"""
Reranker cross-encoder — re-trie les candidats du retrieval hybride.

Le cross-encoder lit la paire (question, document) en une seule passe
d'attention, contrairement au bi-encoder qui compare deux vecteurs
indépendants. Précision top-k nettement supérieure, au prix de ~30-80ms
par requête sur MPS.

Fail-open : si le modèle n'est pas disponible (pas de réseau pour le
télécharger, mémoire insuffisante), le reranking est désactivé pour la
session et l'ordre RRF d'origine est conservé.
"""
import logging
from typing import Any, Dict, List, Optional

from infra.config import get_config

logger = logging.getLogger("SovereignRAG.Reranker")

_model = None
_load_failed = False


def _get_model():
    """Chargement lazy du CrossEncoder — une seule tentative par session."""
    global _model, _load_failed
    if _model is not None or _load_failed:
        return _model

    cfg = get_config()
    try:
        from sentence_transformers import CrossEncoder
        device = cfg.embed_device
        if device == "cpu":
            try:
                import torch
                if torch.backends.mps.is_available():
                    device = "mps"
            except ImportError:
                pass
        _model = CrossEncoder(cfg.rerank_model_name, device=device, max_length=512)
        logger.info(f"✅ Reranker chargé: {cfg.rerank_model_name} sur {device.upper()}")
    except Exception as e:
        _load_failed = True
        logger.warning(f"⚠️ Reranker indisponible ({e}) — ordre RRF conservé pour la session.")
    return _model


def _ki_text(ki: Dict[str, Any]) -> str:
    """Texte représentatif d'un KI pour le scoring cross-encoder."""
    q = ki.get("question") or ki.get("alias") or ""
    a = ki.get("answer") or ""
    snippet = ki.get("raw_snippet") or ki.get("payload", {}).get("raw_snippet", "")
    text = f"{q} {a}".strip()
    # Le snippet donne du contexte quand question/réponse sont courtes
    if snippet and len(text) < 80:
        text = f"{text} — {snippet[:300]}"
    return text or snippet[:300]


def rerank(question: str, candidates: List[Dict[str, Any]], top_k: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Re-trie les candidats par pertinence cross-encoder.

    Retourne les candidats réordonnés (top_k premiers), chaque KI enrichi
    d'un champ `rerank_score`. Si le reranker est désactivé ou indisponible,
    retourne les candidats inchangés.
    """
    cfg = get_config()
    if not cfg.rerank_enabled or not candidates:
        return candidates

    model = _get_model()
    if model is None:
        return candidates

    k = top_k or cfg.rerank_top_k
    try:
        pairs = [(question, _ki_text(ki)) for ki in candidates]
        scores = model.predict(pairs)
        for ki, score in zip(candidates, scores):
            ki["rerank_score"] = float(score)
        ranked = sorted(candidates, key=lambda ki: ki.get("rerank_score", 0.0), reverse=True)
        logger.info(
            f"🎯 Rerank: {len(candidates)} candidats → top {k} "
            f"(best={ranked[0].get('rerank_score', 0):.3f})"
        )
        return ranked[:max(k, 10)]
    except Exception as e:
        logger.warning(f"⚠️ Rerank échoué ({e}) — ordre RRF conservé.")
        return candidates
