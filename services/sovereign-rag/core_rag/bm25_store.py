import json
import os
import tempfile
import logging
from rank_bm25 import BM25Okapi
from core_rag.utils import tokenize_smart

logger = logging.getLogger("SovereignRAG.BM25")

try:
    import fcntl
    _HAS_FCNTL = True
except ImportError:
    _HAS_FCNTL = False  # Windows fallback


class BM25Manager:
    def __init__(self):
        self.indices = {}      # workspace_id -> BM25Okapi
        self.metadata = {}     # workspace_id -> list of KIs

    def _data_path(self, workspace_id: str) -> str:
        return f"data/{workspace_id}.bm25"

    def _lock_path(self, workspace_id: str) -> str:
        return f"data/{workspace_id}.bm25.lock"

    def _rebuild_index(self, workspace_id: str):
        """Reconstruit l'index BM25 en mémoire depuis les métadonnées."""
        corpus = [
            tokenize_smart(f"{ki.get('question', '')} {ki.get('answer', '')}")
            for ki in self.metadata.get(workspace_id, [])
        ]
        if corpus:
            self.indices[workspace_id] = BM25Okapi(corpus)
        else:
            self.indices.pop(workspace_id, None)

    def load(self, workspace_id: str):
        """Charge l'index BM25 depuis le disque (lecture simple, pas de verrou nécessaire)."""
        if workspace_id in self.indices:
            return

        path = self._data_path(workspace_id)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.metadata[workspace_id] = data.get("metadata", [])
                self._rebuild_index(workspace_id)
                logger.info(f"📚 BM25 loaded for {workspace_id}: {len(self.metadata[workspace_id])} KIs")
            except Exception as e:
                logger.error(f"❌ Failed to load BM25 index for {workspace_id}: {e}")
                self.metadata[workspace_id] = []

    def add_documents(self, workspace_id: str, ki_list: list):
        """
        Ajoute des KIs à l'index BM25 de manière atomique et thread-safe.
        Pattern: Lock → Reload-from-disk → Merge → Atomic-Write → Release
        Cela garantit l'absence de race condition lors d'ingestions concurrentes.
        """
        os.makedirs("data", exist_ok=True)
        path = self._data_path(workspace_id)
        lock_path = self._lock_path(workspace_id)

        lock_file = open(lock_path, "a+", encoding="utf-8")
        try:
            # 1. Acquérir le verrou exclusif (bloquant)
            if _HAS_FCNTL:
                fcntl.flock(lock_file, fcntl.LOCK_EX)

            # 2. Recharger l'état actuel du disque (captures les écritures des autres workers)
            on_disk_metadata = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        on_disk_data = json.load(f)
                    on_disk_metadata = on_disk_data.get("metadata", [])
                except Exception as e:
                    logger.warning(f"⚠️ BM25 reload failed for {workspace_id}: {e}")

            # 3. Fusionner : métadonnées disque + nouvelles
            merged = on_disk_metadata + ki_list

            # 4. Écriture atomique via fichier temporaire + os.replace
            dir_name = os.path.dirname(path) or "."
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=dir_name,
                delete=False,
                suffix=".tmp"
            ) as tmp_f:
                tmp_path = tmp_f.name
                json.dump({"metadata": merged}, tmp_f, ensure_ascii=False)

            os.replace(tmp_path, path)  # Atomic on POSIX

            # 5. Mettre à jour l'état en mémoire
            self.metadata[workspace_id] = merged
            self._rebuild_index(workspace_id)
            logger.info(f"✅ BM25 index updated for {workspace_id}: {len(merged)} KIs total")

        except Exception as e:
            logger.error(f"❌ BM25 add_documents failed for {workspace_id}: {e}")
            # Fallback : ajouter en mémoire seulement pour ne pas perdre les données de la session
            if workspace_id not in self.metadata:
                self.metadata[workspace_id] = []
            self.metadata[workspace_id].extend(ki_list)
            self._rebuild_index(workspace_id)
        finally:
            if _HAS_FCNTL:
                fcntl.flock(lock_file, fcntl.LOCK_UN)
            lock_file.close()

    def rebuild_from_ki_list(self, workspace_id: str, full_ki_list: list):
        """
        Reconstruit l'intégralité de l'index BM25 depuis une liste complète de KIs.
        Utilisé par le script de récupération d'index.
        """
        os.makedirs("data", exist_ok=True)
        path = self._data_path(workspace_id)
        lock_path = self._lock_path(workspace_id)

        lock_file = open(lock_path, "a+", encoding="utf-8")
        try:
            if _HAS_FCNTL:
                fcntl.flock(lock_file, fcntl.LOCK_EX)

            dir_name = os.path.dirname(path) or "."
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=dir_name,
                delete=False,
                suffix=".tmp"
            ) as tmp_f:
                tmp_path = tmp_f.name
                json.dump({"metadata": full_ki_list}, tmp_f, ensure_ascii=False)

            os.replace(tmp_path, path)
            self.metadata[workspace_id] = full_ki_list
            self._rebuild_index(workspace_id)
            logger.info(f"🔄 BM25 index rebuilt for {workspace_id}: {len(full_ki_list)} KIs")
        finally:
            if _HAS_FCNTL:
                fcntl.flock(lock_file, fcntl.LOCK_UN)
            lock_file.close()

    def search(self, workspace_id: str, query: str, top_n: int = 20) -> list:
        if workspace_id not in self.indices:
            return []
        tokenized_query = tokenize_smart(query)
        scores = self.indices[workspace_id].get_scores(tokenized_query)
        import numpy as np
        top_indices = np.argsort(scores)[::-1][:top_n]
        results = []
        for idx in top_indices:
            if scores[idx] > 0:
                results.append(self.metadata[workspace_id][idx])
        return results
