import asyncio
import logging
import uuid
import os
import time
from typing import Dict, Any, Optional

from infra.config import get_config
from app.services.zenith_client import ZenithClient
from sentence_transformers import SentenceTransformer

from core_rag.bm25_store import BM25Manager
from core_rag.jobs import JobManager
from core_rag.veto import VetoManager
from core_rag.ingestion import IngestionManager
from core_rag.retrieval import RetrievalManager
from core_rag.self_crystallizer import SelfCrystallizer

logger = logging.getLogger("SovereignRAG.Facade")
logger.setLevel(logging.INFO)

# ─── Workspace lock retention policy ──────────────────────────────────────────
_LOCK_MAX_AGE_S = 4 * 3600   # Evict locks unused for 4 hours
_LOCK_MAX_ENTRIES = 500       # Hard cap on in-memory lock entries


class ZenithRAGEngine:
    def __init__(self):
        # 1. Modèle d'embedding — device piloté par zenith.yaml → hardware.profile
        # zenith.yaml > auto-détection torch en fallback
        cfg = get_config()
        device = cfg.embed_device
        if device == "cpu":
            # Fallback auto-detect si le yaml n'a pas surchargé
            try:
                import torch
                if torch.cuda.is_available():
                    device = "cuda"
                elif torch.backends.mps.is_available():
                    device = "mps"
            except ImportError:
                pass
        logger.info(f"⚙️ Embedding device: {device.upper()} (profil hw: {cfg.hardware_profile}) — modèle: {cfg.embed_model_name}")
        self.embed_model = SentenceTransformer(cfg.embed_model_name, device=device)
        
        # 2. Client gRPC/HTTP vers le démon Rust `zenith_core`
        self.client = ZenithClient()
        
        # 3. Composants Modulaires
        self.bm25_manager = BM25Manager()
        self.job_manager = JobManager()
        self.veto_manager = VetoManager(self.embed_model)
        
        # Workspace locks: {workspace_id: (Lock, last_access_timestamp)}
        self._workspace_locks: dict[str, tuple[asyncio.Lock, float]] = {}
        # Global concurrency cap across all workspaces (anti-OOM on heavy embed/index operations).
        # Each workspace also has its own Lock (workspace_locks) so two uploads to the same
        # workspace never run concurrently, independently of this global cap.
        max_concurrent = get_config().max_concurrent_ingestions
        self.global_ingestion_semaphore = asyncio.Semaphore(max_concurrent)

        self.ingestion_manager = IngestionManager(
            self.embed_model,
            self.client,
            self.bm25_manager,
            self.job_manager,
            self.global_ingestion_semaphore
        )
        self.retrieval_manager = RetrievalManager(
            self.embed_model,
            self.client,
            self.bm25_manager,
            self.veto_manager,
            self.ingestion_manager
        )
        self.self_crystallizer = SelfCrystallizer(
            self.embed_model,
            self.client,
            self.ingestion_manager
        )

    # ─── Workspace lock management (LRU-style) ────────────────────────────────

    @property
    def workspace_locks(self) -> dict:
        """Backward-compatible property so endpoints.py can still do
        `engine.workspace_locks[ws_id]` for reads. Writes should use
        `_get_workspace_lock()` instead."""
        # Return a view that maps ws_id -> Lock (hiding the timestamp)
        return {ws_id: entry[0] for ws_id, entry in self._workspace_locks.items()}

    def _get_workspace_lock(self, workspace_id: str) -> asyncio.Lock:
        """Get or create a per-workspace lock, evicting stale entries."""
        now = time.monotonic()

        # Lazy eviction: clean stale entries when the dict grows too large
        if len(self._workspace_locks) >= _LOCK_MAX_ENTRIES:
            stale_ids = [
                ws_id for ws_id, (_, ts) in self._workspace_locks.items()
                if (now - ts) > _LOCK_MAX_AGE_S
            ]
            for ws_id in stale_ids:
                del self._workspace_locks[ws_id]
            if stale_ids:
                logger.info(f"🧹 Evicted {len(stale_ids)} stale workspace locks (>{_LOCK_MAX_AGE_S}s idle)")

        entry = self._workspace_locks.get(workspace_id)
        if entry is None:
            lock = asyncio.Lock()
            self._workspace_locks[workspace_id] = (lock, now)
            return lock
        else:
            # Touch: update last-access timestamp
            self._workspace_locks[workspace_id] = (entry[0], now)
            return entry[0]

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        return self.job_manager.get_job(job_id)

    async def ingest(self, workspace_id: str, file_path: str) -> str:
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        self.job_manager.create_job(job_id, {
            "status": "processing",
            "progress": 0,
            "filename": os.path.basename(file_path),
            "start_time": time.time(),
        })

        ws_lock = self._get_workspace_lock(workspace_id)

        async def safe_background():
            # 1. Workspace lock: prevents two simultaneous uploads to the same workspace.
            # 2. Global semaphore: caps total concurrent ingestions across all workspaces.
            async with ws_lock:
                async with self.global_ingestion_semaphore:
                    await self.ingestion_manager.background_ingest(job_id, workspace_id, file_path)

        asyncio.create_task(safe_background())
        return job_id

    async def query(self, workspace_id: str, question: str, skip_macro_routing: bool = False, mode: str = "mix", user_id: Optional[str] = None, role: str = "editor") -> Dict[str, Any]:
        """Façade pour la recherche hybride avec auto-cristallisation post-réponse."""
        result = await self.retrieval_manager.query(workspace_id, question, skip_macro_routing, mode, user_id=user_id, role=role)

        # ── Auto-cristallisation en tâche de fond (gate=green uniquement) ──
        # Respecte le flag crystallization_enabled par workspace.
        if result.get("gate") == "green" and not result.get("vetoed"):
            config = self.ingestion_manager.get_workspace_config(workspace_id)
            crystal_enabled = bool(config.get("crystallization_enabled", 1))
            if crystal_enabled:
                asyncio.create_task(
                    self.self_crystallizer.crystallize_after_query(
                        workspace_id=workspace_id,
                        question=question,
                        answer=result.get("answer", ""),
                        score=result.get("score", 0.0),
                        source=result.get("sources", [None])[0],
                        root_id=result.get("_metadata", {}).get("root_id"),
                    )
                )

        return result


_engine: Optional[ZenithRAGEngine] = None

def get_engine() -> ZenithRAGEngine:
    """Lazily create the RAG engine so tests and admin routes can import the app."""
    global _engine
    if _engine is None:
        _engine = ZenithRAGEngine()
    return _engine

async def ingest_document(workspace_id: str, file_path: str) -> str:
    engine = get_engine()
    return await engine.ingest(workspace_id, file_path)

async def query_rag_engine(workspace_id: str, question: str, mode: str = "mix", user_id: Optional[str] = None, role: str = "editor") -> Dict[str, Any]:
    engine = get_engine()
    return await engine.query(workspace_id, question, mode=mode, user_id=user_id, role=role)

def get_ingest_status(job_id: str) -> Dict[str, Any]:
    engine = get_engine()
    return engine.get_job_status(job_id)
