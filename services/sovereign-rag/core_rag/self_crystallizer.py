"""
╔══════════════════════════════════════════════════════════════════════════════╗
║   SELF CRYSTALLIZER — FYA v12.0                                             ║
║   Le LLM écrit activement dans sa propre mémoire (KI Tree) après chaque   ║
║   échange. Implémente l'Axe 1 de l'amélioration du contexte général des IA ║
╠══════════════════════════════════════════════════════════════════════════════╣
║   Architecture :                                                            ║
║     1. Post-query hook : après chaque réponse RAG approuvée                ║
║     2. LLM → extrait ce qu'il vient d'apprendre (KI structuré)             ║
║     3. KI auto-généré → injecté dans le KI Tree (avec déduplication FYA)   ║
║     4. Disponible immédiatement pour les requêtes suivantes                 ║
║                                                                             ║
║   Analogie cognitive : Mémoire épisodique → Mémoire sémantique             ║
║   Référence : Titans (Google, 2025), MemGPT (Letta, 2023)                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from infra.config import get_config
from core_rag.constants import TAU_FUSION
from core_rag.model_router import router as brain

logger = logging.getLogger("SovereignRAG.SelfCrystallizer")

# ─── Constantes ────────────────────────────────────────────────────────────────
# Préfixe pour identifier les KIs auto-générés vs ingestés
SELF_CRYSTAL_SOURCE = "_self_crystal"
# Min score / answer len now loaded from zenith.yaml via get_config() at init time

# ─── Prompt d'extraction ──────────────────────────────────────────────────────
# NOTE: On n'utilise PAS str.format() pour construire ce prompt car la question
# ou la réponse peuvent contenir des accolades { } (JSON, code, formules).
# La fonction ci-dessous assemble le prompt par concaténation sûre.
def _build_extraction_prompt(question: str, answer: str) -> str:
    return (
        "Tu es un système de mémoire. Analyse cet échange Q/R et extrait UN fait "
        "atomique, factuel et précis appris lors de cet échange.\n\n"
        "ÉCHANGE :\n"
        "Question : " + question + "\n"
        "Réponse  : " + answer + "\n\n"
        "RÈGLES STRICTES :\n"
        "- Réponds UNIQUEMENT en JSON valide, rien d'autre\n"
        "- Extrais UN seul fait, le plus précis et réutilisable possible\n"
        '- La question doit être une question générique réutilisable (pas "dans ce document")\n'
        "- La réponse doit être factuelle et courte (max 80 chars)\n"
        '- Si aucun fait mémorisable n\'est trouvé, retourne {"skip": true}\n\n'
        "FORMAT ATTENDU :\n"
        '{\n'
        '  "question": "Quelle est [X] selon [contexte] ?",\n'
        '  "answer": "La valeur est [Y].",\n'
        '  "confidence": 0.0 à 1.0,\n'
        '  "domain": "Finance|Legal|Technique|RH|Commercial|Général",\n'
        '  "skip": false\n'
        '}'
    )

SYSTEM_PROMPT = "Tu es un extracteur de mémoire JSON strict. Réponds uniquement en JSON valide."


class SelfCrystallizer:
    """
    Service d'auto-écriture dans le KI Tree.

    Après chaque réponse RAG approuvée (gate=green), le LLM extrait
    le fait qu'il vient d'apprendre et l'injecte dans sa propre mémoire
    permanente sous forme de KI structuré.

    Cela crée une boucle de rétroaction : plus le système répond,
    plus sa mémoire s'enrichit — sans intervention humaine.
    """

    def __init__(self, embed_model, client, ingestion_manager):
        self.embed_model = embed_model
        self.client = client
        self.ingestion_manager = ingestion_manager
        # ── Task 11 : driven by zenith.yaml → rag.crystallizer.enabled_by_default ──
        _cfg = get_config()
        self._enabled: bool = _cfg.crystallizer_enabled_default
        self._min_score: float = _cfg.crystallizer_min_score
        self._min_answer_len: int = _cfg.crystallizer_min_answer_len

    async def crystallize_after_query(
        self,
        workspace_id: str,
        question: str,
        answer: str,
        score: float,
        source: Optional[str] = None,
        root_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Point d'entrée principal — appelé en tâche de fond après une réponse approuvée.

        Flux :
          1. Évaluation du seuil de confiance
          2. LLM extrait le KI atomique
          3. Vérification déduplication (τ_fusion = 0.75)
          4. Injection dans le KI Tree permanent
          5. Mise à jour du BM25 index

        Args:
            workspace_id : identifiant du workspace courant
            question     : question posée par l'utilisateur
            answer       : réponse approuvée par le gate sémantique
            score        : score de confiance de la réponse
            source       : source originelle (optionnel)
            root_id      : ROOT du document source (optionnel)

        Returns:
            dict avec statut, ki_id créé, et métriques
        """
        if not self._enabled:
            return {"status": "disabled"}

        # ── Seuil de confiance (zenith.yaml : rag.crystallizer.min_score) ─────────
        if score < self._min_score:
            logger.info(
                f"🧊 SelfCrystal: Score {score:.2f} < {self._min_score} → pas de cristallisation"
            )
            return {"status": "skipped", "reason": "low_confidence"}

        if len(answer.strip()) < self._min_answer_len:
            return {"status": "skipped", "reason": "answer_too_short"}

        # ── Extraction LLM du KI atomique ─────────────────────────────────────
        try:
            prompt = _build_extraction_prompt(question, answer)
            raw = await brain.generate(prompt, system_prompt=SYSTEM_PROMPT, timeout=15.0)

            # Nettoyage JSON
            raw = raw.strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()

            ki_data = json.loads(raw)

        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ SelfCrystal: JSON invalide : {e}")
            return {"status": "error", "reason": "json_parse_error"}
        except Exception as e:
            logger.error(f"❌ SelfCrystal: Extraction LLM failed : {e}")
            return {"status": "error", "reason": str(e)}

        # ── Skip si le LLM n'a rien trouvé de mémorisable ─────────────────────
        if ki_data.get("skip", False):
            logger.info("🧊 SelfCrystal: LLM a décidé que rien ne vaut d'être mémorisé")
            return {"status": "skipped", "reason": "llm_decided_skip"}

        extracted_q = ki_data.get("question", "").strip()
        extracted_a = ki_data.get("answer", "").strip()
        confidence  = float(ki_data.get("confidence", 0.8))
        domain      = ki_data.get("domain", "Général")

        if not extracted_q or not extracted_a:
            return {"status": "skipped", "reason": "empty_extraction"}

        # ── Vérification déduplication avant injection (τ_fusion = 0.75) ───────
        vec = self.embed_model.encode(extracted_q, normalize_embeddings=True).tolist()
        existing = await self.client.query(workspace_id, vec)

        if existing.get("results"):
            top = existing["results"][0]
            top_score = top.get("score", 0.0)

            if top_score >= TAU_FUSION:
                # Vérifie que ce n'est pas une contradiction (Veto Λ)
                import re
                neg_patterns = [
                    r"\bne\s+\w+\s+pas\b", r"\bn'est\s+pas\b", r"\baucun\b",
                    r"\binterdit\b", r"\bexempté\b", r"\bnon\s+soumis\b"
                ]
                def has_neg(t: str) -> bool:
                    return any(re.search(p, t.lower()) for p in neg_patterns)

                if has_neg(extracted_a) != has_neg(top.get("answer", "")):
                    logger.info(
                        f"🛡️ SelfCrystal Veto Λ: Contradiction détectée avec KI existant "
                        f"'{top.get('ki_id')}' (score={top_score:.3f}) → Fusion refusée"
                    )
                    # On garde les deux comme KIs distincts → pas de skip
                else:
                    logger.info(
                        f"🔄 SelfCrystal: Doublon détecté (score={top_score:.3f} ≥ τ={TAU_FUSION}) "
                        f"→ KI déjà présent, cristallisation inutile"
                    )
                    return {
                        "status": "deduplicated",
                        "existing_ki_id": top.get("ki_id"),
                        "similarity": top_score,
                    }

        # ── Injection dans le KI Tree ──────────────────────────────────────────
        # ROOT synthétique pour les KIs auto-générés
        crystal_root_id = root_id or f"ROOT_crystal_{hashlib.sha256(workspace_id.encode()).hexdigest()[:12]}"
        ki_id = f"KI_crystal_{hashlib.sha256((extracted_q + extracted_a).encode()).hexdigest()[:12]}"
        point_id = f"{ki_id}_{uuid.uuid4().hex[:4]}"

        ki_entry = {
            "point_id":  point_id,
            "ki_id":     ki_id,
            "source":    SELF_CRYSTAL_SOURCE,
            "root_id":   crystal_root_id,
            "question":  extracted_q,
            "answer":    extracted_a,
            "alias":     extracted_q,
            "raw_snippet": f"[AutoCrystal] Q: {extracted_q} → A: {extracted_a}",
            "payload": {
                "ht_amount":  "0.0",
                "tva_amount": "0.0",
                "ttc_amount": "0.0",
                "currency":   "UNKNOWN",
                "date":       datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "raw_snippet": f"[AutoCrystal | domain={domain} | conf={confidence:.2f}] {extracted_a}",
                "domain":     domain,
                "confidence": str(confidence),
                "origin_question": question[:200],
            },
            "vector":    vec,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "version":   1,
        }

        try:
            res = await self.client.ingest(
                workspace_id,
                [{"id": point_id, "values": vec}],
                [ki_entry],
            )

            if res and res.get("status") != "error":
                # Mise à jour du BM25 index
                self.ingestion_manager.bm25_manager.add_documents(workspace_id, [ki_entry])

                logger.info(
                    f"💎 SelfCrystal SUCCESS: KI {ki_id} créé dans {workspace_id} "
                    f"(domain={domain}, conf={confidence:.2f})"
                )
                return {
                    "status":     "crystallized",
                    "ki_id":      ki_id,
                    "question":   extracted_q,
                    "answer":     extracted_a,
                    "domain":     domain,
                    "confidence": confidence,
                    "source":     SELF_CRYSTAL_SOURCE,
                }
            else:
                logger.warning(f"⚠️ SelfCrystal: Ingestion failed pour {ki_id}")
                return {"status": "error", "reason": "ingestion_failed"}

        except Exception as e:
            logger.error(f"❌ SelfCrystal: Injection exception : {e}")
            return {"status": "error", "reason": str(e)}

    async def crystallize_session_summary(
        self,
        workspace_id: str,
        session_exchanges: list,  # Liste de {question, answer, score}
        max_crystals: int = 5,
    ) -> Dict[str, Any]:
        """
        Cristallisation de fin de session : résume et mémorise les N faits
        les plus importants d'une session complète.

        Analogie : consolidation mémoire épisodique → sémantique (sommeil).

        Args:
            workspace_id    : workspace cible
            session_exchanges: liste des échanges de la session [{question, answer, score}]
            max_crystals    : nombre maximum de KIs à créer depuis cette session
        """
        if not session_exchanges:
            return {"status": "empty_session"}

        # Filtrer les échanges avec score suffisant
        eligible = [
            ex for ex in session_exchanges
            if ex.get("score", 0.0) >= self._min_score
               and len(ex.get("answer", "")) >= self._min_answer_len
        ]

        if not eligible:
            return {"status": "no_eligible_exchanges"}

        # Trier par score décroissant, prendre les N meilleurs
        eligible_sorted = sorted(eligible, key=lambda x: x.get("score", 0.0), reverse=True)
        to_crystallize = eligible_sorted[:max_crystals]

        results = []
        for ex in to_crystallize:
            result = await self.crystallize_after_query(
                workspace_id=workspace_id,
                question=ex["question"],
                answer=ex["answer"],
                score=ex["score"],
                source=ex.get("source"),
                root_id=ex.get("root_id"),
            )
            results.append(result)
            # Petite pause pour éviter de saturer le LLM
            await asyncio.sleep(0.5)

        crystallized = [r for r in results if r.get("status") == "crystallized"]
        deduplicated = [r for r in results if r.get("status") == "deduplicated"]

        logger.info(
            f"🧠 SelfCrystal Session Summary: {len(crystallized)} crystallisés, "
            f"{len(deduplicated)} dédupliqués sur {len(to_crystallize)} échanges"
        )

        return {
            "status":        "done",
            "total_eligible": len(eligible),
            "attempted":     len(to_crystallize),
            "crystallized":  len(crystallized),
            "deduplicated":  len(deduplicated),
            "crystals":      crystallized,
        }
