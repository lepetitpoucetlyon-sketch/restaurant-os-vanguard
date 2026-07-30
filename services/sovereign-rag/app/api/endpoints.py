from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.rag_service import query_rag_engine, ingest_document, get_ingest_status, get_engine
from core_rag.ki_tree_service import get_conv_ki_tree
from app.core.auth_users import CurrentUser, get_current_user
from infra.db.database import get_db_connection
import os
import time
import uuid
import hashlib
import logging
from datetime import datetime


router = APIRouter()
logger = logging.getLogger("ZenithAPI")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))
ALLOWED_UPLOAD_EXTENSIONS = {
    ext.strip().lower()
    for ext in os.getenv("ALLOWED_UPLOAD_EXTENSIONS", ".txt,.pdf,.csv,.md").split(",")
    if ext.strip()
}

# ──────────────────────────────────────────────────────────────────
# Modèles Pydantic — Conversational KI Tree
# ──────────────────────────────────────────────────────────────────

class ChatTurnRequest(BaseModel):
    session_id: str
    user_prompt: str
    assistant_response: str
    objective: Optional[str] = ""

class ToggleBranchRequest(BaseModel):
    session_id: str
    branch_id: str
    is_active: bool

class QueryRequest(BaseModel):
    query: str
    workspace_id: str
    skip_macro_routing: bool = False

class WorkspaceCreate(BaseModel):
    name: str

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

@router.post("/workspaces")
async def create_workspace(request: WorkspaceCreate):
    """Crée un nouveau workspace et génère une clé API"""
    if os.getenv("ALLOW_PUBLIC_WORKSPACE_CREATION", "false").lower() not in {"1", "true", "yes"}:
        raise HTTPException(status_code=403, detail="Création publique de workspace désactivée.")

    ws_id = f"ws_{uuid.uuid4().hex[:8]}"
    api_key = f"sk_{uuid.uuid4().hex}"
    api_key_hash = hash_api_key(api_key)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO workspaces (id, name, api_key_hash, veto_threshold) VALUES (?, ?, ?, ?)",
        (ws_id, request.name, api_key_hash, 0.65)
    )
    conn.commit()
    
    return {"workspace_id": ws_id, "api_key": api_key}

@router.post("/query")
async def query_rag(
    request: QueryRequest,
    current: CurrentUser = Depends(get_current_user),
):
    """
    Requête RAG hybride.
    Authentification : JWT Bearer (utilisateur identifié) ou X-API-Key (legacy workspace).

    Timidité des couronnes : si l'utilisateur est identifié (JWT), il ne voit que
    ses propres documents privés + les documents partagés du workspace.
    Un owner voit tout. Une clé API legacy voit tout (rétrocompat).
    """
    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")

    current.require("query")

    # Vérification quota avant chaque requête
    from app.services.payment_service import check_quota
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT plan FROM workspaces WHERE id = ?", (current.workspace_id,))
    ws_row = cursor.fetchone()
    plan = ws_row["plan"] if ws_row else "starter"
    cursor.execute(
        "SELECT COUNT(*) as cnt FROM usage WHERE workspace_id = ? AND endpoint = '/query'",
        (current.workspace_id,)
    )
    usage_count = cursor.fetchone()["cnt"]
    if not check_quota(current.workspace_id, plan, usage_count, "/query"):
        raise HTTPException(
            status_code=429,
            detail=f"Quota de requêtes épuisé pour le plan '{plan}'. Veuillez mettre à niveau."
        )

    result = await query_rag_engine(
        workspace_id=current.workspace_id,
        question=request.query,
        mode=getattr(request, "mode", "mix"),
        user_id=current.user_id,
        role=current.role,
    )
    return result

@router.get("/ingest/status/{job_id}")
async def check_ingest_status(
    job_id: str,
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    status = get_ingest_status(job_id)
    if status.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Job non trouvé.")

    # Sécurité: vérifier que le job appartient au workspace
    if status.get("workspace_id") != current.workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce job.")

    return status

@router.get("/audit")
async def get_audit_ledger(
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    engine = get_engine()
    return await engine.client.audit(current.workspace_id)

def secure_filename(filename: str) -> str:
    # Keep only basename, strip directory traversals
    name = os.path.basename(filename)
    name = name.replace("..", "").replace("/", "").replace("\\", "")
    import re
    name = re.sub(r"[^a-zA-Z0-9_\-\.]", "", name)
    return name

# Tâche d'arrière-plan pour l'ingestion asynchrone avec lock par workspace
async def run_background_ingest_task(job_id: str, workspace_id: str, file_path: str):
    import asyncio
    engine = get_engine()
    lock = engine._get_workspace_lock(workspace_id)
    async with lock:
        await engine.ingestion_manager.background_ingest(job_id, workspace_id, file_path)

def _validate_upload_file(filename: str) -> str:
    """Valide et retourne le nom sécurisé du fichier, ou lève HTTPException."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=415, detail=f"Type de fichier non supporté: {ext or 'sans extension'}.")
    return safe_name


@router.post("/ingest")
async def ingest_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current: CurrentUser = Depends(get_current_user),
):
    current.require("ingest")

    # Vérification quota documents
    from app.services.payment_service import check_quota
    conn_quota = get_db_connection()
    cursor_quota = conn_quota.cursor()
    cursor_quota.execute("SELECT plan FROM workspaces WHERE id = ?", (current.workspace_id,))
    ws_row = cursor_quota.fetchone()
    plan = ws_row["plan"] if ws_row else "starter"
    cursor_quota.execute(
        "SELECT COUNT(*) as cnt FROM documents WHERE workspace_id = ?",
        (current.workspace_id,)
    )
    doc_count = cursor_quota.fetchone()["cnt"]
    if not check_quota(current.workspace_id, plan, doc_count, "/ingest"):
        raise HTTPException(
            status_code=429,
            detail=f"Quota de documents épuisé pour le plan '{plan}'. Veuillez mettre à niveau."
        )

    ws_upload_dir = f"uploads/{current.workspace_id}"
    os.makedirs(ws_upload_dir, exist_ok=True)

    safe_name = _validate_upload_file(file.filename)

    file_path = os.path.join(ws_upload_dir, safe_name)
    total_size = 0
    with open(file_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_UPLOAD_BYTES:
                f.close()
                try:
                    os.remove(file_path)
                except OSError:
                    pass
                raise HTTPException(status_code=413, detail="Fichier trop volumineux.")
            f.write(chunk)

    # Ingestion asynchrone : renvoie un job_id immédiat
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    engine = get_engine()
    engine.job_manager.create_job(job_id, {
        "status": "processing",
        "progress": 5,
        "workspace_id": current.workspace_id,
        "filename": safe_name,
        "start_time": datetime.now().isoformat()
    })

    task_sent = False
    try:
        from app.core.celery_app import CELERY_ENABLED
        if CELERY_ENABLED:
            from app.core.celery_app import celery_ingest_file_task
            celery_ingest_file_task.delay(job_id, current.workspace_id, file_path)
            task_sent = True
            logger.info(f"🚀 Queued background ingestion task via Celery for job: {job_id}")
    except Exception as queue_err:
        logger.warning(f"⚠️ Celery dispatch failed: {queue_err}. Falling back to in-memory BackgroundTasks.")

    if not task_sent:
        background_tasks.add_task(
            run_background_ingest_task,
            job_id,
            current.workspace_id,
            file_path
        )
        logger.info(f"🚀 Started background ingestion task via FastAPI BackgroundTasks for job: {job_id}")

    return {
        "status": "processing",
        "job_id": job_id,
        "progress": 5
    }

@router.post("/verify")
async def verify_integrity(
    request: Dict[str, str],
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    engine = get_engine()
    return await engine.client.verify(current.workspace_id)

@router.get("/health")
async def health_check():
    return {"status": "zenith_alive", "version": "1.2.0"}

@router.post("/build-tree")
async def build_ki_tree(
    current: CurrentUser = Depends(get_current_user),
):
    """Reconstruit l'arbre de connaissance complet (Semantic Clusters + Synthèses)"""
    current.require("ingest")  # reconstruction = mutation du corpus → editor/owner

    from core_rag.ki_tree_service import KITreeService

    tree_service = KITreeService()
    result = await tree_service.build_tree_for_workspace(current.workspace_id)

    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))

    return result

@router.get("/lineage/{query_id}")
async def get_query_lineage(
    query_id: str,
    current: CurrentUser = Depends(get_current_user),
) -> dict:
    """Get complete audit trail for a query result"""
    current.require("query")
    raise HTTPException(
        status_code=501,
        detail="Lineage audit trail non disponible dans cette version. "
               "L'intégration avec le journal Rust est prévue pour la v2.0."
    )

@router.get("/audit-export/{workspace_id}")
async def export_audit_trail(
    workspace_id: str,
    current: CurrentUser = Depends(get_current_user),
) -> dict:
    """Export complete audit trail for compliance"""
    current.require("query")

    if current.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, root_id, integrity_root, created_at FROM documents WHERE workspace_id = ? ORDER BY created_at",
        (workspace_id,)
    )
    documents = cursor.fetchall()
    conn.close()
    
    audit_trail = {
        "workspace_id": workspace_id,
        "exported_at": datetime.now().isoformat() + "Z",
        "total_documents": len(documents),
        "documents": [
            {
                "doc_id": doc["id"],
                "root_id": doc["root_id"],
                "merkle_root": doc["integrity_root"],
                "ingested_at": doc["created_at"]
            }
            for doc in documents
        ]
    }
    return audit_trail


class FeedbackRequest(BaseModel):
    workspace_id: str
    query_id: Optional[str] = None
    query_text: Optional[str] = None
    ki_id: Optional[str] = None
    cluster_id: Optional[str] = None
    feedback_type: str # 'incorrect' ou 'correct'


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Workspace ID mismatch.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO feedbacks (workspace_id, query_id, query_text, ki_id, cluster_id, feedback_type) VALUES (?, ?, ?, ?, ?, ?)",
        (current.workspace_id, request.query_id, request.query_text, request.ki_id, request.cluster_id, request.feedback_type)
    )
    conn.commit()
    conn.close()

    logger.info(f"💾 User feedback registered: {request.feedback_type} for KI {request.ki_id} in {current.workspace_id}.")
    return {"status": "success", "message": "Feedback enregistré avec succès."}


@router.post("/query/sources")
async def query_sources_only(
    request: QueryRequest,
    current: CurrentUser = Depends(get_current_user),
):
    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")

    current.require("query")

    # Récupérer les candidats sémantiques bruts sans appeler le LLM pour générer une réponse
    engine = get_engine()
    engine.bm25_manager.load(current.workspace_id)
    # encode() est synchrone (MPS/CPU) — to_thread évite de geler l'event loop
    # pour toutes les autres requêtes pendant le calcul de l'embedding.
    import asyncio as _asyncio
    vec = (await _asyncio.to_thread(
        engine.embed_model.encode, request.query, normalize_embeddings=True
    )).tolist()
    rust_res = await engine.client.query(current.workspace_id, vec)
    vector_results = rust_res.get("results", [])

    # Timidité des couronnes : filtrer les candidats par visibilité utilisateur.
    visible = engine.retrieval_manager.get_visible_root_ids(
        current.workspace_id, current.user_id, current.role
    )
    if visible is not None:
        allowed = set(visible)
        vector_results = [
            ki for ki in vector_results
            if ki.get("source") in allowed or ki.get("root_id") in allowed
        ]

    sources = list(set(ki.get("source") for ki in vector_results if ki.get("source")))
    return {
        "status": "success",
        "sources": sources,
        "raw_candidates_count": len(vector_results),
        "top_score": vector_results[0].get("score", 0.0) if vector_results else 0.0
    }


@router.post("/query/condensed")
async def query_condensed_only(
    request: QueryRequest,
    current: CurrentUser = Depends(get_current_user),
):
    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")

    current.require("query")

    engine = get_engine()
    res = await engine.query(
        current.workspace_id, request.query, request.skip_macro_routing,
        user_id=current.user_id, role=current.role,
    )

    # Mode condensé sans LLM : retourne directement la réponse brute extraite
    return {
        "status": "success",
        "condensed_answer": res.get("answer"),
        "sources": res.get("sources", []),
        "score": res.get("score", 0.0),
        "gate": res.get("gate", "green")
    }


@router.post("/query/detailed")
async def query_detailed_only(
    request: QueryRequest,
    current: CurrentUser = Depends(get_current_user),
):
    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")

    current.require("query")

    engine = get_engine()
    res = await engine.query(
        current.workspace_id, request.query, request.skip_macro_routing,
        user_id=current.user_id, role=current.role,
    )

    # Mode détaillé : retourne la réponse brute enrichie de son contexte et métadonnées
    return {
        "status": "success",
        "detailed_answer": res.get("answer"),
        "sources": res.get("sources", []),
        "score": res.get("score", 0.0),
        "gate": res.get("gate", "green"),
        "context_metadata": res.get("_metadata", {})
    }


@router.post("/vault/status")
async def get_vault_status(
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    engine = get_engine()
    dump_res = await engine.client.dump_vectors(current.workspace_id)
    kis = dump_res.get("kis", [])

    # Timidité des couronnes : ne dumper que les KIs visibles par l'utilisateur.
    visible = engine.retrieval_manager.get_visible_root_ids(
        current.workspace_id, current.user_id, current.role
    )
    if visible is not None:
        allowed = set(visible)
        kis = [
            ki for ki in kis
            if ki.get("source") in allowed or ki.get("root_id") in allowed
        ]

    # Extraire la liste unique des sources
    sources = list(set([ki.get("source", "Inconnue") for ki in kis if ki.get("source")]))

    return {
        "num_kis": len(kis),
        "kis": kis[:100],
        "sources": sources
    }


@router.post("/blob/status")
async def get_blob_status(
    current: CurrentUser = Depends(get_current_user),
):
    current.require("query")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM feedbacks WHERE workspace_id = ? AND feedback_type = 'incorrect'",
        (current.workspace_id,)
    )
    failures_count = cursor.fetchone()[0]

    cursor.execute(
        "SELECT query_text, created_at FROM feedbacks WHERE workspace_id = ? AND feedback_type = 'incorrect' ORDER BY created_at DESC LIMIT 1",
        (current.workspace_id,)
    )
    last_row = cursor.fetchone()
    last_failure = None
    if last_row:
        last_failure = {
            "query_text": last_row["query_text"],
            "timestamp": last_row["created_at"]
        }
    
    conn.close()
    
    membrane_integrity = "High" if failures_count < 10 else "Vulnerable"
    
    return {
        "num_failures": failures_count,
        "last_failure": last_failure,
        "membrane_integrity": membrane_integrity
    }


# ══════════════════════════════════════════════════════════════════════════════
# CONVERSATIONAL KI TREE — Infinite Context Engine
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/chat/turn")
async def compile_chat_turn(request: ChatTurnRequest, current: CurrentUser = Depends(get_current_user)):
    """
    Compile un tour de conversation (user_prompt + assistant_response)
    dans le Conversational KI Tree.

    Retourne la feuille créée et indique si une promotion en branche
    (décision validée) a été déclenchée.

    🧠 Memory Lens : Ce endpoint est appelé automatiquement après chaque
    réponse d'Antigravity pour alimenter la mémoire sémantique de session.
    """
    current.require("query")
    tree = get_conv_ki_tree()
    leaf = tree.compile_turn_to_ki(
        session_id=request.session_id,
        user_prompt=request.user_prompt,
        assistant_response=request.assistant_response,
        objective=request.objective or ""
    )
    session = tree.get_or_create_session(request.session_id, request.objective or "")
    return {
        "status": "compiled",
        "leaf_id": leaf.id,
        "payload_type": leaf.payload_type,
        "is_validated": leaf.is_validated,
        "token_estimate": leaf.token_estimate,
        "session_branches_count": len(session.branches),
        "session_pending_leaves_count": len(session.pending_leaves),
        "memory_lens": (
            f"🧠 Inférence basée sur {len(session.branches)} décision(s) validée(s) "
            f"et {len(session.pending_leaves)} contexte(s) de session antérieur(s)."
        )
    }


@router.get("/chat/tree")
async def get_chat_tree(session_id: str, current: CurrentUser = Depends(get_current_user)):
    """
    Retourne l'arbre conceptuel complet de la session.

    Utilisé par le composant UI 'Knowledge & Rules Explorer'
    (onglet [Conversation History]) pour afficher les branches,
    feuilles et toggles interactifs.
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requis.")
    current.require("query")
    tree = get_conv_ki_tree()
    result = tree.get_tree_json(session_id)
    if "error" in result:
        tree.get_or_create_session(session_id)
        result = tree.get_tree_json(session_id)
    return result


@router.get("/chat/scaffold/{session_id}")
async def get_context_scaffold(session_id: str, current: CurrentUser = Depends(get_current_user)):
    """
    Conversational Compactor — retourne le scaffold ultra-dense (<1000 tokens)
    représentant toute la mémoire de session.

    Ce scaffold remplace l'historique linéaire brut lors de la prochaine
    inférence LLM, réduisant la consommation de tokens de ~90%.

    Structure du scaffold :
    - 🎯 Tronc (objectif global)
    - 📌 Branches actives (décisions irréversibles)
    - 🍃 Dernière feuille pertinente (contexte immédiat)
    """
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requis.")
    current.require("query")
    tree = get_conv_ki_tree()
    scaffold = tree.build_context_scaffold(session_id)
    if "error" in scaffold:
        raise HTTPException(status_code=404, detail=scaffold["error"])
    return scaffold


@router.post("/chat/toggle-branch")
async def toggle_branch(request: ToggleBranchRequest, current: CurrentUser = Depends(get_current_user)):
    """
    Décoche ou recoche une décision validée (ConsensusBranch) dans l'UI.

    Si une branche est désactivée (is_active=False), elle est exclue
    du prochain scaffold généré → Antigravity réévalue le contexte
    sans cette décision passée.

    Correspond au toggle interactif du panneau 'Knowledge & Rules Explorer'.
    """
    current.require("query")
    tree = get_conv_ki_tree()
    result = tree.toggle_branch(
        session_id=request.session_id,
        branch_id=request.branch_id,
        is_active=request.is_active
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/chat/sessions")
async def list_chat_sessions(current: CurrentUser = Depends(get_current_user)):
    """Liste toutes les sessions KI Tree connues (pour navigation UI)."""
    current.require("query")
    tree = get_conv_ki_tree()
    return {"sessions": tree.list_sessions()}


# ══════════════════════════════════════════════════════════════════════════════
# SELF CRYSTALLIZER — Auto-écriture LLM dans le KI Tree
# Le LLM mémorise activement ce qu'il apprend après chaque échange.
# ══════════════════════════════════════════════════════════════════════════════

class SessionCrystallizeRequest(BaseModel):
    workspace_id: str
    exchanges: List[Dict[str, Any]]  # [{question, answer, score, source?}]
    max_crystals: int = 5

class SingleCrystallizeRequest(BaseModel):
    workspace_id: str
    question: str
    answer: str
    score: float = 0.9
    source: Optional[str] = None


@router.post("/memory/crystallize")
async def crystallize_session(
    request: SessionCrystallizeRequest,
    background_tasks: BackgroundTasks,
    current: CurrentUser = Depends(get_current_user),
):
    """
    Cristallisation manuelle de fin de session.

    Prend N échanges (question/réponse) et demande au LLM d'extraire
    les faits les plus importants pour les persister dans le KI Tree.

    Appelable :
    - En fin de session utilisateur (côté client)
    - Par un scheduler nightly (consolidation mémoire)
    - Manuellement pour enrichir la base de connaissances
    """
    current.require("ingest")  # écrit dans le KI Tree → editor/owner

    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Workspace ID mismatch.")

    engine = get_engine()

    async def run_crystallization():
        result = await engine.self_crystallizer.crystallize_session_summary(
            workspace_id=current.workspace_id,
            session_exchanges=request.exchanges,
            max_crystals=request.max_crystals,
        )
        logger.info(f"🧠 Session crystallization done: {result}")

    background_tasks.add_task(run_crystallization)

    return {
        "status": "crystallizing",
        "message": f"Cristallisation de {len(request.exchanges)} échanges lancée en arrière-plan.",
        "max_crystals": request.max_crystals,
    }


@router.post("/memory/crystallize/single")
async def crystallize_single(
    request: SingleCrystallizeRequest,
    current: CurrentUser = Depends(get_current_user),
):
    """
    Cristallisation synchrone d'un seul échange Q/R.
    Utile pour injecter manuellement un fait précis dans la mémoire.
    Retourne immédiatement le résultat (KI créé ou dédupliqué).
    """
    current.require("ingest")  # écrit dans le KI Tree → editor/owner

    if request.workspace_id != current.workspace_id:
        raise HTTPException(status_code=403, detail="Workspace ID mismatch.")

    engine = get_engine()
    result = await engine.self_crystallizer.crystallize_after_query(
        workspace_id=current.workspace_id,
        question=request.question,
        answer=request.answer,
        score=request.score,
        source=request.source,
    )
    return result


@router.get("/memory/status")
async def get_memory_status(current: CurrentUser = Depends(get_current_user)):
    """
    Retourne le statut de la mémoire auto-cristallisée du workspace.
    Affiche les KIs générés automatiquement par le LLM (source=_self_crystal).
    """
    current.require("query")

    engine = get_engine()
    dump = await engine.client.dump_vectors(current.workspace_id)
    all_kis = dump.get("kis", [])

    # Filtrer les KIs auto-cristallisés
    crystal_kis = [
        ki for ki in all_kis
        if ki.get("source") == "_self_crystal"
    ]

    return {
        "workspace_id":       current.workspace_id,
        "total_kis":          len(all_kis),
        "auto_crystal_count": len(crystal_kis),
        "auto_crystal_ratio": round(len(crystal_kis) / max(len(all_kis), 1), 3),
        "recent_crystals":    crystal_kis[-10:],  # 10 derniers
        "crystallizer_active": engine.self_crystallizer._enabled,
    }


@router.post("/memory/toggle")
async def toggle_crystallizer(
    request: Dict[str, Any],
    current: CurrentUser = Depends(get_current_user),
):
    """Active ou désactive le SelfCrystallizer pour ce workspace."""
    current.require("ingest")  # modifie la config mémoire → editor/owner

    engine = get_engine()
    enabled = request.get("enabled", True)
    engine.self_crystallizer._enabled = bool(enabled)

    logger.info(f"🧠 SelfCrystallizer {'activé' if enabled else 'désactivé'} pour {current.workspace_id}")
    return {
        "status": "updated",
        "crystallizer_enabled": engine.self_crystallizer._enabled,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1-CLICK CONNECTORS (Web-Scrape, Notion, Google Drive)
# ══════════════════════════════════════════════════════════════════════════════

class WebScrapeRequest(BaseModel):
    url: str

class NotionRequest(BaseModel):
    block_id: str
    token: str

class GoogleDriveRequest(BaseModel):
    file_id: str
    token: str

async def run_connector_background_task(job_id: str, workspace_id: str, file_path: str):
    import asyncio
    engine = get_engine()
    ws_lock = engine._get_workspace_lock(workspace_id)
    # Même double protection que rag_service.ingest() :
    # 1. workspace lock  — deux uploads vers le même workspace ne tournent pas en parallèle
    # 2. global semaphore — cap global anti-OOM partagé avec les uploads directs
    async with ws_lock:
        async with engine.global_ingestion_semaphore:
            await engine.ingestion_manager.background_ingest(job_id, workspace_id, file_path)
    # KI Tree rebuild hors des locks (opération de lecture/écriture légère, pas d'OOM risk)
    try:
        from core_rag.ki_tree_service import KITreeService
        tree_service = KITreeService()
        logger.info(f"🌲 Rebuilding KI Tree for workspace {workspace_id} after connector ingest...")
        await tree_service.build_tree_for_workspace(workspace_id)
    except Exception as e:
        logger.error(f"❌ Failed to auto-rebuild KI Tree for workspace {workspace_id}: {e}")

@router.post("/connectors/web-scrape")
async def connector_web_scrape(
    request: WebScrapeRequest,
    background_tasks: BackgroundTasks,
    current: CurrentUser = Depends(get_current_user),
):
    current.require("ingest")

    from app.services.connectors import scrape_web_page
    try:
        scraped = await scrape_web_page(request.url)
    except Exception as e:
        logger.error(f"❌ Web Scraping failed: {e}")
        raise HTTPException(status_code=400, detail=f"Web scraping failed: {str(e)}")

    ws_upload_dir = f"uploads/{current.workspace_id}"
    os.makedirs(ws_upload_dir, exist_ok=True)
    
    # Safe filename from URL or title
    import urllib.parse
    parsed_url = urllib.parse.urlparse(request.url)
    domain = parsed_url.netloc.replace(":", "_").replace(".", "_")
    safe_name = f"web_{domain}_{uuid.uuid4().hex[:6]}.txt"
    file_path = os.path.join(ws_upload_dir, safe_name)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(scraped["text"])

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    engine = get_engine()
    engine.job_manager.create_job(job_id, {
        "status": "processing",
        "progress": 5,
        "workspace_id": current.workspace_id,
        "filename": safe_name,
        "start_time": datetime.now().isoformat()
    })

    background_tasks.add_task(
        run_connector_background_task,
        job_id,
        current.workspace_id,
        file_path
    )

    return {
        "status": "processing",
        "job_id": job_id,
        "progress": 5,
        "filename": safe_name
    }

@router.post("/connectors/notion")
async def connector_notion(
    request: NotionRequest,
    background_tasks: BackgroundTasks,
    current: CurrentUser = Depends(get_current_user),
):
    current.require("ingest")

    from app.services.connectors import fetch_notion_block_text
    try:
        text = await fetch_notion_block_text(request.block_id, request.token)
        if not text.strip():
            raise Exception("No text content found in the specified Notion block.")
    except Exception as e:
        logger.error(f"❌ Notion block fetch failed: {e}")
        raise HTTPException(status_code=400, detail=f"Notion fetch failed: {str(e)}")

    ws_upload_dir = f"uploads/{current.workspace_id}"
    os.makedirs(ws_upload_dir, exist_ok=True)
    
    safe_name = f"notion_{request.block_id[:8]}_{uuid.uuid4().hex[:6]}.txt"
    file_path = os.path.join(ws_upload_dir, safe_name)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    engine = get_engine()
    engine.job_manager.create_job(job_id, {
        "status": "processing",
        "progress": 5,
        "workspace_id": current.workspace_id,
        "filename": safe_name,
        "start_time": datetime.now().isoformat()
    })

    background_tasks.add_task(
        run_connector_background_task,
        job_id,
        current.workspace_id,
        file_path
    )

    return {
        "status": "processing",
        "job_id": job_id,
        "progress": 5,
        "filename": safe_name
    }

@router.post("/connectors/google-drive")
async def connector_google_drive(
    request: GoogleDriveRequest,
    background_tasks: BackgroundTasks,
    current: CurrentUser = Depends(get_current_user),
):
    current.require("ingest")

    from app.services.connectors import download_google_drive_file
    try:
        file_data = await download_google_drive_file(request.file_id, request.token)
    except Exception as e:
        logger.error(f"❌ Google Drive download failed: {e}")
        raise HTTPException(status_code=400, detail=f"Google Drive download failed: {str(e)}")

    ws_upload_dir = f"uploads/{current.workspace_id}"
    os.makedirs(ws_upload_dir, exist_ok=True)
    
    original_filename = file_data["filename"]
    safe_name = secure_filename(original_filename)
    if not safe_name or safe_name in (".", ".."):
        safe_name = f"gdrive_{request.file_id}_{uuid.uuid4().hex[:6]}.txt"
        
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        # If it's a non-supported binary format, or has no extension, fallback to appending .txt
        safe_name += ".txt"
        
    file_path = os.path.join(ws_upload_dir, safe_name)
    
    content = file_data["content"]
    mode = "wb" if isinstance(content, bytes) else "w"
    encoding = None if isinstance(content, bytes) else "utf-8"
    
    with open(file_path, mode, encoding=encoding) as f:
        f.write(content)

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    engine = get_engine()
    engine.job_manager.create_job(job_id, {
        "status": "processing",
        "progress": 5,
        "workspace_id": current.workspace_id,
        "filename": safe_name,
        "start_time": datetime.now().isoformat()
    })

    background_tasks.add_task(
        run_connector_background_task,
        job_id,
        current.workspace_id,
        file_path
    )

    return {
        "status": "processing",
        "job_id": job_id,
        "progress": 5,
        "filename": safe_name
    }

