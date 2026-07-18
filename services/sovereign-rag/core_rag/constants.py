"""core_rag/constants.py — Constantes partagées entre les modules RAG."""

# Seuil de fusion sémantique calibré (ablation study, F1=92.9% à 0.75 vs 50.0% à 0.92)
TAU_FUSION: float = 0.75
