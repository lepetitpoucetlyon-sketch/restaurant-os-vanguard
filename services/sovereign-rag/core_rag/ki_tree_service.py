"""
ki_tree_service.py — Antigravity Native KI Tree Engine
========================================================
Double KI Tree Architecture (Grade X):
  A. Code KI Tree      → Structure sémantique du workspace (inchangé)
  B. Conversational KI Tree → DAG de mémoire de session conversationnelle

Le Conversational Compactor réduit l'historique de session en un scaffold
ultra-dense de <1000 tokens pour réduire la consommation de tokens de ~90%.
"""

from __future__ import annotations

import json
import re
import uuid
import sqlite3
import logging
import asyncio
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

import numpy as np
from sklearn.cluster import DBSCAN

from infra.db.database import get_db_connection
from app.services.zenith_client import ZenithClient
from core_rag.model_router import router as brain

logger = logging.getLogger("SovereignRAG.KITree")

# ══════════════════════════════════════════════════════════════════
# SECTION A — CODE KI TREE (Workspace Structure)
# ══════════════════════════════════════════════════════════════════

class KITreeService:
    """Construit et interroge le Code KI Tree (clusters sémantiques du workspace)."""

    def __init__(self):
        self.client = ZenithClient()

    async def build_tree_for_workspace(self, workspace_id: str) -> Dict[str, Any]:
        """Reconstruit le KI Tree complet pour un workspace (DBSCAN + LLM synthèse)."""
        logger.info(f"🌲 Construction du Code KI Tree pour workspace: {workspace_id}")

        try:
            dump = await self.client.dump_vectors(workspace_id)
            if dump.get("status") != "success":
                return {"status": "error", "message": "Impossible de récupérer les vecteurs depuis Rust."}

            rust_kis = dump.get("kis", [])
            rust_vectors = dump.get("vectors", [])

            if not rust_vectors:
                return {"status": "error", "message": "Aucun vecteur trouvé pour le clustering"}

            embeddings, kis = [], []
            for i, ki in enumerate(rust_kis):
                if i < len(rust_vectors):
                    vec = rust_vectors[i]
                    if vec["id"].startswith(ki["ki_id"]):
                        embeddings.append(vec["values"])
                        ki["embedding"] = vec["values"]
                        kis.append(ki)

            if not embeddings:
                return {"status": "error", "message": "Aucun KI valide avec vecteur trouvé"}

            logger.info(f"🧠 DBSCAN sur {len(embeddings)} vecteurs")
            X = np.array(embeddings)
            
            # Dynamically tune eps to target 25 clusters
            best_eps = 0.23
            best_diff = 999
            for test_eps in [0.18, 0.20, 0.22, 0.23, 0.24, 0.25, 0.27, 0.30]:
                test_clustering = DBSCAN(eps=test_eps, min_samples=2, metric='cosine').fit(X)
                test_labels = test_clustering.labels_
                test_n = len(set(test_labels)) - (1 if -1 in test_labels else 0)
                diff = abs(test_n - 25)
                if diff < best_diff:
                    best_diff = diff
                    best_eps = test_eps
            
            logger.info(f"🎯 Dynamic tuning selected eps={best_eps} (target: 25 clusters)")
            clustering = DBSCAN(eps=best_eps, min_samples=2, metric='cosine').fit(X)
            labels = clustering.labels_

            clusters_map: Dict[str, list] = {}
            outliers = []
            for idx, label in enumerate(labels):
                if label == -1:
                    outliers.append(kis[idx])
                    continue
                clusters_map.setdefault(str(label), []).append(kis[idx])

            logger.info(f"📊 {len(clusters_map)} clusters | Outliers: {len(outliers)}")

            async def process_cluster(cluster_id: str, cluster_kis: list):
                if len(cluster_kis) < 2:
                    return None
                sample_kis = cluster_kis[:5]
                context = "\n".join([f"- Q: {ki.get('question')} | R: {ki.get('answer')}" for ki in sample_kis])
                prompt = f"""Tu es un analyste expert Grade X. Génère une synthèse globale pour ce groupe de connaissances.
Réponds UNIQUEMENT en JSON valide.
Format attendu:
{{"name": "Nom court du concept", "summary": "Résumé consolidé (max 3 phrases)", "keywords": "mot1, mot2, mot3"}}
CONNAISSANCES:
{context}"""
                try:
                    res = await brain.generate(prompt, system_prompt="Analyste expert RAG Grade X. JSON strict.")
                    res_str = res.strip()
                    if "```json" in res_str:
                        res_str = res_str.split("```json")[1].split("```")[0].strip()
                    elif "```" in res_str:
                        res_str = res_str.split("```")[1].split("```")[0].strip()
                    synth = json.loads(res_str)
                    centroid = np.mean([ki['embedding'] for ki in cluster_kis], axis=0).tolist()
                    root_ids = list(set(ki.get("root_id") for ki in cluster_kis if ki.get("root_id")))
                    return {
                        "id": f"CLUSTER_{uuid.uuid4().hex[:8]}",
                        "name": synth.get("name"),
                        "summary": synth.get("summary"),
                        "keywords": synth.get("keywords"),
                        "size": len(cluster_kis),
                        "centroid": centroid,
                        "root_ids": root_ids
                    }
                except Exception as e:
                    logger.error(f"⚠️ Synthèse cluster {cluster_id}: {e}")
                    return None

            tasks = [process_cluster(c_id, c_kis) for c_id, c_kis in clusters_map.items()]
            cluster_results = list(await asyncio.gather(*tasks))

            if outliers:
                outlier_centroid = np.mean([ki['embedding'] for ki in outliers], axis=0).tolist()
                cluster_results.append({
                    "id": f"CLUSTER_ORPHANS_{uuid.uuid4().hex[:8]}",
                    "name": "Cluster Orphelins (Infos Diverses)",
                    "summary": "Faits isolés n'appartenant à aucun thème majeur.",
                    "keywords": "divers, orphelin, faits isolés",
                    "size": len(outliers),
                    "centroid": outlier_centroid,
                    "root_ids": list(set(ki.get("root_id") for ki in outliers if ki.get("root_id")))
                })

            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM clusters WHERE workspace_id = ?", (workspace_id,))
            saved_clusters = []
            for r in cluster_results:
                if r:
                    cursor.execute(
                        "INSERT INTO clusters (id, workspace_id, name, summary, keywords, size, centroid, root_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (r["id"], workspace_id, r["name"], r["summary"], r["keywords"], r["size"],
                         json.dumps(r["centroid"]), json.dumps(r["root_ids"]))
                    )
                    saved_clusters.append({"id": r["id"], "name": r["name"], "size": r["size"]})
            conn.commit()
            conn.close()

            # Automatically build semantic bridges between the new clusters
            bridges_created = 0
            try:
                from core_rag_service import get_engine
                from core_rag.tree_optimizer import TreeOptimizer
                engine = get_engine()
                optimizer = TreeOptimizer(engine.embed_model, self.client)
                bridges_created = await optimizer.build_bridges(workspace_id)
                logger.info(f"🌉 Built {bridges_created} semantic bridges between clusters.")
            except Exception as bridge_err:
                logger.error(f"⚠️ Failed to build bridges after tree build: {bridge_err}")

            return {
                "status": "success",
                "message": f"Code KI Tree reconstruit. {len(saved_clusters)} Super-KIs générés. {bridges_created} ponts créés.",
                "clusters": saved_clusters
            }

        except Exception as e:
            logger.error(f"❌ Erreur KI Tree: {e}")
            return {"status": "error", "message": str(e)}


# ══════════════════════════════════════════════════════════════════
# SECTION B — CONVERSATIONAL KI TREE (Session Memory DAG)
# ══════════════════════════════════════════════════════════════════

# Marqueurs linguistiques de validation (promotion feuille → branche)
CONSENSUS_MARKERS = re.compile(
    r"\b(go|validé|valide|c'est bon|impeccable|parfait|ouais|ok|exactement|"
    r"nickel|approuvé|approuve|confirmed|confirmed|lock|locked|figé|figé)\b",
    re.IGNORECASE | re.UNICODE
)


@dataclass
class UserRadicelle:
    """Radicelle : formulation brute d'une intention utilisateur."""
    id: str = field(default_factory=lambda: f"RAD_{uuid.uuid4().hex[:8]}")
    prompt: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class ContextualLeaf:
    """
    Feuille : bloc technique pur (code, payload, métadonnée).
    Peut être promu en ConsensusBranch si l'utilisateur valide.
    """
    id: str = field(default_factory=lambda: f"LEAF_{uuid.uuid4().hex[:8]}")
    essence: str = ""            # Résumé ultra-condensé de l'échange
    payload_type: str = "text"   # 'code', 'decision', 'text', 'config'
    raw_payload: str = ""        # Contenu brut (code, JSON, etc.)
    token_estimate: int = 0
    is_validated: bool = False   # True si marqueur de consensus détecté
    parent_branch_id: Optional[str] = None
    radicelles: List[UserRadicelle] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class ConsensusBranch:
    """
    Branche : décision validée et irréversible.
    Représente un jalon de la session (architectural, technique).
    """
    id: str = field(default_factory=lambda: f"BRANCH_{uuid.uuid4().hex[:8]}")
    title: str = ""              # Titre court de la décision
    summary: str = ""            # Résumé de la décision
    is_active: bool = True       # Toggle UI — si False, ignoré dans le scaffold
    parent_branch_id: Optional[str] = None  # Pour les bifurcations
    leaves: List[ContextualLeaf] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class SessionRoot:
    """
    Tronc : objectif ultime de la session de travail.
    Unique par session_id.
    """
    id: str = field(default_factory=lambda: f"ROOT_{uuid.uuid4().hex[:8]}")
    session_id: str = ""
    objective: str = ""          # Objectif global (ex: "Optimisation RAM + RAG local")
    branches: List[ConsensusBranch] = field(default_factory=list)
    pending_leaves: List[ContextualLeaf] = field(default_factory=list)  # Feuilles non encore promues
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _detect_payload_type(text: str) -> str:
    """Détecte si le contenu est du code, une config, une décision ou du texte."""
    if "```" in text or text.strip().startswith("def ") or text.strip().startswith("func "):
        return "code"
    if text.strip().startswith("{") or text.strip().startswith("["):
        return "config"
    if any(w in text.lower() for w in ["décision", "on retient", "on choisit", "on valide", "on part sur"]):
        return "decision"
    return "text"


def _estimate_tokens(text: str) -> int:
    """Estimation rapide du nombre de tokens (approximation : 1 token ≈ 4 chars)."""
    return max(1, len(text) // 4)


def _extract_essence(user_prompt: str, assistant_response: str) -> str:
    """
    Extrait l'essence d'un échange en moins de 120 tokens.
    Version locale sans appel LLM pour minimiser la latence.
    """
    # Tronquer sévèrement pour garantir <200 chars
    assistant_short = assistant_response[:160].replace("\n", " ").strip()
    user_short = user_prompt[:60].replace("\n", " ").strip()
    return f"[U] {user_short} → [AG] {assistant_short}"


class ConversationalKITree:
    """
    Moteur de mémoire conversationnelle basé sur un DAG (Directed Acyclic Graph).

    Principes :
    - Chaque tour de conversation est compilé en une ContextualLeaf.
    - Les feuilles validées sont promues en ConsensusBranch (décisions immuables).
    - `build_context_scaffold()` produit un scaffold <1000 tokens pour le prochain tour.
    - Persistance complète dans SQLite local (hors base RAG).
    """

    import platform
    if platform.system() == "Darwin":
        DB_PATH = Path.home() / "Library" / "Application Support" / "ZCPO" / "conv_ki_tree.db"
    elif platform.system() == "Windows":
        DB_PATH = Path.home() / "AppData" / "Local" / "ZCPO" / "conv_ki_tree.db"
    else:
        DB_PATH = Path.home() / ".local" / "share" / "zcpo" / "conv_ki_tree.db"

    def __init__(self):
        self.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        # Cache mémoire des sessions actives (session_id → SessionRoot)
        self._sessions: Dict[str, SessionRoot] = {}

    def _init_db(self):
        """Initialise le schéma SQLite de persistance du Conversational KI Tree."""
        conn = sqlite3.connect(str(self.DB_PATH))
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.executescript("""
        CREATE TABLE IF NOT EXISTS session_roots (
            id TEXT PRIMARY KEY,
            session_id TEXT UNIQUE NOT NULL,
            objective TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS consensus_branches (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            parent_branch_id TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES session_roots(session_id)
        );

        CREATE TABLE IF NOT EXISTS contextual_leaves (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            branch_id TEXT,
            essence TEXT NOT NULL,
            payload_type TEXT NOT NULL DEFAULT 'text',
            raw_payload TEXT NOT NULL,
            token_estimate INTEGER NOT NULL DEFAULT 0,
            is_validated INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES session_roots(session_id)
        );

        CREATE TABLE IF NOT EXISTS user_radicelles (
            id TEXT PRIMARY KEY,
            leaf_id TEXT NOT NULL,
            prompt TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (leaf_id) REFERENCES contextual_leaves(id)
        );

        CREATE INDEX IF NOT EXISTS idx_leaves_session ON contextual_leaves(session_id);
        CREATE INDEX IF NOT EXISTS idx_branches_session ON consensus_branches(session_id);
        """)
        conn.commit()
        conn.close()

    # ─── Persistance ──────────────────────────────────────────────

    def _save_root(self, root: SessionRoot):
        conn = sqlite3.connect(str(self.DB_PATH))
        c = conn.cursor()
        c.execute(
            "INSERT OR REPLACE INTO session_roots (id, session_id, objective, created_at, updated_at) VALUES (?,?,?,?,?)",
            (root.id, root.session_id, root.objective, root.created_at, root.updated_at)
        )
        conn.commit()
        conn.close()

    def _save_branch(self, branch: ConsensusBranch, session_id: str):
        conn = sqlite3.connect(str(self.DB_PATH))
        c = conn.cursor()
        c.execute(
            "INSERT OR REPLACE INTO consensus_branches (id, session_id, title, summary, is_active, parent_branch_id, timestamp) VALUES (?,?,?,?,?,?,?)",
            (branch.id, session_id, branch.title, branch.summary, int(branch.is_active), branch.parent_branch_id, branch.timestamp)
        )
        conn.commit()
        conn.close()

    def _save_leaf(self, leaf: ContextualLeaf, session_id: str, branch_id: Optional[str] = None):
        conn = sqlite3.connect(str(self.DB_PATH))
        c = conn.cursor()
        c.execute(
            "INSERT OR REPLACE INTO contextual_leaves (id, session_id, branch_id, essence, payload_type, raw_payload, token_estimate, is_validated, timestamp) VALUES (?,?,?,?,?,?,?,?,?)",
            (leaf.id, session_id, branch_id, leaf.essence, leaf.payload_type, leaf.raw_payload,
             leaf.token_estimate, int(leaf.is_validated), leaf.timestamp)
        )
        for rad in leaf.radicelles:
            c.execute(
                "INSERT OR REPLACE INTO user_radicelles (id, leaf_id, prompt, timestamp) VALUES (?,?,?,?)",
                (rad.id, leaf.id, rad.prompt, rad.timestamp)
            )
        conn.commit()
        conn.close()

    def _update_branch_toggle(self, branch_id: str, is_active: bool):
        conn = sqlite3.connect(str(self.DB_PATH))
        c = conn.cursor()
        c.execute("UPDATE consensus_branches SET is_active = ? WHERE id = ?", (int(is_active), branch_id))
        conn.commit()
        conn.close()

    # ─── Session Management ───────────────────────────────────────

    def get_or_create_session(self, session_id: str, objective: str = "") -> SessionRoot:
        """Récupère ou crée la racine d'une session."""
        if session_id in self._sessions:
            return self._sessions[session_id]

        # Chercher en base
        conn = sqlite3.connect(str(self.DB_PATH))
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        row = c.execute("SELECT * FROM session_roots WHERE session_id = ?", (session_id,)).fetchone()

        if row:
            root = SessionRoot(
                id=row["id"],
                session_id=row["session_id"],
                objective=row["objective"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            # Charger les branches
            branches_rows = c.execute(
                "SELECT * FROM consensus_branches WHERE session_id = ? ORDER BY timestamp",
                (session_id,)
            ).fetchall()
            for br in branches_rows:
                root.branches.append(ConsensusBranch(
                    id=br["id"], title=br["title"], summary=br["summary"],
                    is_active=bool(br["is_active"]), parent_branch_id=br["parent_branch_id"],
                    timestamp=br["timestamp"]
                ))
            # Charger les feuilles pendantes
            pending_rows = c.execute(
                "SELECT * FROM contextual_leaves WHERE session_id = ? AND branch_id IS NULL ORDER BY timestamp",
                (session_id,)
            ).fetchall()
            for lf in pending_rows:
                root.pending_leaves.append(ContextualLeaf(
                    id=lf["id"], essence=lf["essence"], payload_type=lf["payload_type"],
                    raw_payload=lf["raw_payload"], token_estimate=lf["token_estimate"],
                    is_validated=bool(lf["is_validated"]), timestamp=lf["timestamp"]
                ))
        else:
            obj = objective or f"Session {session_id[:8]}"
            root = SessionRoot(session_id=session_id, objective=obj)
            self._save_root(root)

        conn.close()
        self._sessions[session_id] = root
        return root

    # ─── Core Engine ──────────────────────────────────────────────

    def compile_turn_to_ki(
        self,
        session_id: str,
        user_prompt: str,
        assistant_response: str,
        objective: str = ""
    ) -> ContextualLeaf:
        """
        Compile un tour de conversation en une ContextualLeaf.

        Heuristique de promotion automatique en ConsensusBranch :
        - Détection de marqueurs de validation dans le user_prompt (ex: "go", "validé")
        - OU si le tour précédent contenait un payload technique >300 tokens et que
          le user_prompt est un signal de validation court (<30 chars)
        """
        root = self.get_or_create_session(session_id, objective)

        # Construire la radicelle
        radicelle = UserRadicelle(prompt=user_prompt)

        # Extraire l'essence et détecter le type
        essence = _extract_essence(user_prompt, assistant_response)
        payload_type = _detect_payload_type(assistant_response)
        token_est = _estimate_tokens(assistant_response)

        # Détecter si ce tour valide le tour précédent (promotion heuristique)
        is_validation_turn = bool(CONSENSUS_MARKERS.search(user_prompt)) and len(user_prompt.strip()) < 60

        leaf = ContextualLeaf(
            essence=essence,
            payload_type=payload_type,
            raw_payload=assistant_response,
            token_estimate=token_est,
            is_validated=is_validation_turn,
            radicelles=[radicelle]
        )

        # Si c'est un tour de validation et qu'il y a une feuille pendante → promouvoir
        if is_validation_turn and root.pending_leaves:
            last_leaf = root.pending_leaves[-1]
            promoted = self.promote_leaf_to_branch(session_id, last_leaf.id)
            if promoted:
                logger.info(f"✅ Feuille promue en branche: {promoted.title}")

        # Sauvegarder la feuille courante
        root.pending_leaves.append(leaf)
        root.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_leaf(leaf, session_id)
        self._save_root(root)

        logger.info(f"🍃 KI compilé: [{payload_type}] ~{token_est}t | validé={is_validation_turn}")
        return leaf

    def promote_leaf_to_branch(
        self,
        session_id: str,
        leaf_id: str,
        parent_branch_id: Optional[str] = None
    ) -> Optional[ConsensusBranch]:
        """
        Élève une ContextualLeaf au rang de ConsensusBranch (décision validée).
        Gestion des bifurcations via parent_branch_id.
        """
        root = self._sessions.get(session_id)
        if not root:
            return None

        leaf = next((lf for lf in root.pending_leaves if lf.id == leaf_id), None)
        if not leaf:
            return None

        # Générer un titre court depuis l'essence
        title = leaf.essence[:80].split("→")[0].replace("[USER]", "").strip()
        summary = leaf.essence

        branch = ConsensusBranch(
            title=title,
            summary=summary,
            is_active=True,
            parent_branch_id=parent_branch_id,
            leaves=[leaf]
        )

        root.branches.append(branch)
        root.pending_leaves = [lf for lf in root.pending_leaves if lf.id != leaf_id]

        self._save_branch(branch, session_id)
        self._save_leaf(leaf, session_id, branch_id=branch.id)

        return branch

    def build_context_scaffold(self, session_id: str) -> Dict[str, Any]:
        """
        Conversational Compactor — construit un scaffold ultra-dense (<1000 tokens).

        Structure injectée :
        1. Tronc (objectif global) : ~50 tokens
        2. Branches actives (décisions validées) : ~30 tokens chacune
        3. Dernière feuille pendante pertinente : ~200 tokens max
        4. Total cible : <1000 tokens
        """
        root = self._sessions.get(session_id)
        if not root:
            return {"error": f"Session {session_id} introuvable"}

        lines = []
        token_budget = 950

        # 1. Tronc
        tronc_line = f"🎯 OBJECTIF SESSION: {root.objective}"
        lines.append(tronc_line)
        token_budget -= _estimate_tokens(tronc_line)

        # 2. Branches actives (décisions validées)
        active_branches = [b for b in root.branches if b.is_active]
        lines.append(f"\n📌 DÉCISIONS VALIDÉES ({len(active_branches)}):")
        for branch in active_branches[-10:]:  # Max 10 branches
            branch_line = f"  • [{branch.id[:8]}] {branch.title}: {branch.summary[:120]}"
            cost = _estimate_tokens(branch_line)
            if token_budget - cost < 200:  # Réserver ~200t pour la feuille
                break
            lines.append(branch_line)
            token_budget -= cost

        # 3. Dernière feuille pertinente (contexte immédiat)
        if root.pending_leaves:
            last_leaf = root.pending_leaves[-1]
            lines.append(f"\n🍃 CONTEXTE IMMÉDIAT [{last_leaf.payload_type}]:")
            payload_preview = last_leaf.raw_payload[:800]  # Tronquer si nécessaire
            lines.append(payload_preview)

        scaffold_text = "\n".join(lines)
        total_tokens = _estimate_tokens(scaffold_text)

        return {
            "session_id": session_id,
            "objective": root.objective,
            "active_branches_count": len(active_branches),
            "pending_leaves_count": len(root.pending_leaves),
            "scaffold_text": scaffold_text,
            "estimated_tokens": total_tokens,
            "token_reduction_vs_linear": f"~{max(0, (len(root.branches) + len(root.pending_leaves)) * 200 - total_tokens)} tokens économisés"
        }

    def get_tree_json(self, session_id: str) -> Dict[str, Any]:
        """Sérialise le DAG complet pour l'UI (Knowledge & Rules Explorer)."""
        root = self._sessions.get(session_id)
        if not root:
            return {"error": f"Session {session_id} introuvable"}

        return {
            "session_id": root.session_id,
            "objective": root.objective,
            "created_at": root.created_at,
            "updated_at": root.updated_at,
            "tronc": {
                "id": root.id,
                "objective": root.objective,
                "branches_count": len(root.branches),
                "pending_leaves_count": len(root.pending_leaves)
            },
            "branches": [
                {
                    "id": b.id,
                    "title": b.title,
                    "summary": b.summary,
                    "is_active": b.is_active,
                    "parent_branch_id": b.parent_branch_id,
                    "leaves_count": len(b.leaves),
                    "timestamp": b.timestamp
                }
                for b in root.branches
            ],
            "pending_leaves": [
                {
                    "id": lf.id,
                    "essence": lf.essence,
                    "payload_type": lf.payload_type,
                    "token_estimate": lf.token_estimate,
                    "is_validated": lf.is_validated,
                    "timestamp": lf.timestamp
                }
                for lf in root.pending_leaves[-20:]  # Max 20 dernières
            ]
        }

    def toggle_branch(self, session_id: str, branch_id: str, is_active: bool) -> Dict[str, Any]:
        """
        Décoche/recoche une branche (décision) dans le UI.
        L'état est reflété dans le prochain scaffold généré.
        """
        root = self._sessions.get(session_id)
        if not root:
            return {"error": f"Session {session_id} introuvable"}

        branch = next((b for b in root.branches if b.id == branch_id), None)
        if not branch:
            return {"error": f"Branche {branch_id} introuvable"}

        branch.is_active = is_active
        self._update_branch_toggle(branch_id, is_active)

        status = "activée ✅" if is_active else "désactivée (contexte réévalué) ⚠️"
        logger.info(f"🔀 Branche {branch_id} {status}")
        return {
            "status": "success",
            "branch_id": branch_id,
            "is_active": is_active,
            "message": f"Décision '{branch.title}' {status}"
        }

    def list_sessions(self) -> List[Dict[str, str]]:
        """Liste toutes les sessions connues."""
        conn = sqlite3.connect(str(self.DB_PATH))
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        rows = c.execute("SELECT session_id, objective, created_at, updated_at FROM session_roots ORDER BY updated_at DESC").fetchall()
        conn.close()
        return [dict(r) for r in rows]


# Singleton global
_conv_ki_tree = ConversationalKITree()

def get_conv_ki_tree() -> ConversationalKITree:
    """Retourne le singleton du Conversational KI Tree."""
    return _conv_ki_tree
