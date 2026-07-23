import logging
import json
import numpy as np
import hashlib
from typing import Tuple
from infra.db.database import get_db_connection
from core_rag.model_router import router as brain
from core_rag.finance_rules import correct_answer_from_payload

logger = logging.getLogger("SovereignRAG.Veto")
QUESTION_VETO_THRESHOLD = 0.65

class VetoManager:
    def __init__(self, embed_model):
        self.embed_model = embed_model
        self.veto_cache = {}

    def symbolic_guard(self, question: str, candidate_answer: str) -> Tuple[bool, str]:
        """Valide programmatiquement si la réponse candidate correspond au type attendu par la question."""
        import re
        q_lower = question.lower()
        ans_lower = candidate_answer.lower()
        
        is_who = any(w in q_lower for w in ["qui", "signataire", "signataires", "partie", "parties", "client", "prestataire", "fournisseur", "représentant"])
        is_how_much = any(w in q_lower for w in ["combien", "montant", "tva", "tarif", "prix", "taux", "total", "ttc", "ht"])
        is_when = any(w in q_lower for w in ["quand", "date", "durée", "duree", "échéance", "echeance", "période", "periode", "validité"])
        
        # Refinement: If it contains "quel(s)/quelle(s)" followed by an entity noun
        # and doesn't ask "quel est le montant/taux/tarif/prix/total/tva", it's NOT a how much question!
        if any(w in q_lower for w in ["quel", "quels", "quelle", "quelles"]):
            has_metric_phrase = any(p in q_lower for p in ["quel est le montant", "quel est le taux", "quel est le prix", "quel est le tarif", "quel est le total", "quelle est la tva", "quel est le coût", "quel est le cout", "quelle est la valeur", "quelle amende"])
            if not has_metric_phrase and any(ent in q_lower for ent in ["résident", "parti", "ministre", "société", "autorité", "commission", "syndicat", "inspecteur", "établissement", "militaire", "direction"]):
                is_how_much = False
        
        # Résoudre les conflits d'intentions multiples
        if is_who and is_how_much:
            # Si la question contient "qui" ou demande explicitement un nom d'entité, c'est WHO
            if any(w in q_lower for w in ["qui", "quel client", "quel prestataire", "quel fournisseur", "quel signataire", "quelle partie"]):
                is_how_much = False
            else:
                # Sinon, si elle demande un montant (ex: "Quel est le montant..."), c'est HOW_MUCH
                is_who = False
                
        if is_who and is_when:
            if any(w in q_lower for w in ["qui", "quel client", "quel prestataire", "quel fournisseur", "quel signataire", "quelle partie"]):
                is_when = False
            else:
                is_who = False
        
        if is_who:
            exclus_qui = ["indéterminée", "indeterminee", "illimitée", "illimitee", "temporaire", "3 mois", "1 an", "non définie"]
            if any(ex in ans_lower for ex in exclus_qui):
                return False, f"La question attend une entité (QUI), mais la réponse contient un terme temporel exclu: '{candidate_answer}'"
            
            if "qui" in q_lower and "signataire" in q_lower:
                exclus_signataires = ["clients industriels", "clients", "entreprises", "produits"]
                cleaned_ans = re.sub(r"^(les|le|la|l\'|un|une|des)\s+", "", ans_lower.replace(".", "").strip())
                if any(ex == cleaned_ans for ex in exclus_signataires):
                    return False, f"La question attend des personnes physiques/morales signataires (QUI), pas un groupe générique exclu: '{candidate_answer}'"
            
            # Rejeter les réponses ressemblant à des montants financiers (ex: "1200 EUR")
            cleaned_ans = ans_lower.replace("€", "").replace("$", "").replace("£", "")
            cleaned_ans = re.sub(r"\b(eur|euros|usd|gbp|tva|ht|ttc)\b", "", cleaned_ans)
            cleaned_ans = cleaned_ans.replace(" ", "").replace(",", "").replace(".", "").strip()
            if cleaned_ans.isdigit() and len(cleaned_ans) > 0:
                return False, f"La question attend une entité (QUI), mais la réponse ressemble à un montant numérique: '{candidate_answer}'"
            
        elif is_how_much:
            has_digit = any(c.isdigit() for c in candidate_answer)
            if not has_digit:
                return False, f"La question attend un montant ou une quantité (COMBIEN), mais la réponse ne contient aucun chiffre: '{candidate_answer}'"
                
        elif is_when:
            has_digit = any(c.isdigit() for c in candidate_answer)
            durations = ["indéterminée", "indeterminee", "illimitée", "illimitee", "temporaire", "mois", "an", "jour", "heure", "semaine", "durée", "indéterminé", "indetermine"]
            has_duration_word = any(d in ans_lower for d in durations)
            
            if not (has_digit or has_duration_word):
                return False, f"La question attend une date ou une durée (QUAND), mais la réponse ne contient ni chiffre ni motif temporel: '{candidate_answer}'"

        return True, ""

    async def question_veto(self, question: str, workspace_id: str, bm25_metadata: list) -> Tuple[bool, float]:
        """Couche 0 - Filtre les questions AVANT toute recherche HNSW/BM25/LLM."""
        q_vector = self.embed_model.encode(question, normalize_embeddings=True).tolist()

        # Get threshold dynamically from DB for Grade X customization
        threshold = QUESTION_VETO_THRESHOLD
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT veto_threshold FROM workspaces WHERE id = ?", (workspace_id,))
            row = cursor.fetchone()
            if row and row["veto_threshold"] is not None:
                threshold = float(row["veto_threshold"])
        except Exception as e:
            logger.warning(f"⚠️ Failed to load veto_threshold from DB: {e}")
        finally:
            if 'conn' in locals() and conn:
                conn.close()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT centroid FROM clusters WHERE workspace_id = ?",
            (workspace_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            if not bm25_metadata:
                return False, 0.0

            try:
                sample = bm25_metadata[:20]
                ki_questions = [ki.get("question", "") for ki in sample if ki.get("question")]
                if not ki_questions:
                    return True, 1.0

                ki_embeddings = self.embed_model.encode(ki_questions, normalize_embeddings=True)
                corpus_centroid = np.mean(ki_embeddings, axis=0)

                q_vec = np.array(q_vector)
                norm_q = np.linalg.norm(q_vec)
                norm_c = np.linalg.norm(corpus_centroid)
                if norm_q > 0 and norm_c > 0:
                    score = float(np.dot(q_vec, corpus_centroid) / (norm_q * norm_c))
                    logger.info(f"🛡️ Question Veto Gate (BM25 fallback): centroid_score={score:.4f} threshold={threshold}")
                    return score >= threshold, score
                return True, 1.0
            except Exception as e:
                logger.warning(f"⚠️ Question Veto Gate fallback error: {e}")
                return True, 1.0 

        q_vec = np.array(q_vector)
        max_score = 0.0

        for row in rows:
            if not row["centroid"]:
                continue
            try:
                centroid = np.array(json.loads(row["centroid"]))
                norm_q = np.linalg.norm(q_vec)
                norm_c = np.linalg.norm(centroid)
                if norm_q > 0 and norm_c > 0:
                    score = float(np.dot(q_vec, centroid) / (norm_q * norm_c))
                    if score > max_score:
                        max_score = score
            except Exception:
                continue

        logger.info(f"🛡️ Question Veto Gate: max_centroid_score={max_score:.4f} threshold={threshold}")
        return max_score >= threshold, max_score

    async def evaluate_candidate(self, rank_idx: int, top_ki: dict, question: str, threshold: float, workspace_id: str = "", brain_mode: str = "cloud") -> dict:
        """Le Juge Sémantique - Evalue la qualité d'un candidat (tenant-isolated cache)"""
        top_ki_id = top_ki.get("ki_id")
        conf_score = float(top_ki.get("score", 0.0))
        
        logger.info(f"🔎 Evaluating Candidate #{rank_idx}: ID={top_ki_id} Score={conf_score}")
        
        if conf_score < threshold:
            logger.info(f"⚠️ Candidate #{rank_idx} VETOED by score ({conf_score} < {threshold})")
            return {"status": "vetoed", "ki_id": top_ki_id, "reason": "score_too_low", "score": conf_score}
            
        top_ki = correct_answer_from_payload(question, top_ki)

        is_valid_type, type_reason = self.symbolic_guard(question, top_ki.get("answer", ""))
        if not is_valid_type:
            logger.info(f"🛡️ Candidate #{rank_idx} VETOED by Symbolic Guard: {type_reason}")
            return {"status": "vetoed", "ki_id": top_ki_id, "reason": f"symbolic_guard: {type_reason}", "score": conf_score}

        cache_key = f"{workspace_id}_{top_ki_id}_{hashlib.md5(question.encode()).hexdigest()}"
            
        if cache_key in self.veto_cache:
            logger.info(f"⚡ Veto cache hit for candidate #{rank_idx}")
            verdict = self.veto_cache[cache_key]
        else:
            from core_rag.antigravity_prompt import get_veto_prompt
            veto_prompt = get_veto_prompt(
                question, 
                top_ki.get("question", ""), 
                top_ki.get("answer", ""), 
                top_ki.get("payload", {}),
                raw_snippet=top_ki.get("raw_snippet") or top_ki.get("payload", {}).get("raw_snippet")
            )
            system_prompt = "Tu es un auditeur de sécurité sémantique."
            verdict = await brain.generate(veto_prompt, system_prompt=system_prompt, timeout=30.0, mode=brain_mode)
            
            if len(self.veto_cache) > 5000:
                self.veto_cache.clear()
            self.veto_cache[cache_key] = verdict
            
        logger.info(f"Candidate #{rank_idx} VETO_VERDICT='{verdict}'")
        
        verdict_upper = verdict.upper()
        is_rejected = True
        if "VALIDE" in verdict_upper and "ERROR" not in verdict_upper:
            is_rejected = False
            
        if is_rejected:
            logger.info(f"⚠️ Candidate #{rank_idx} VETOED by LLM: {verdict}")
            return {"status": "vetoed", "ki_id": top_ki_id, "reason": f"llm_veto: {verdict}", "score": conf_score}
            
        logger.info(f"✅ Candidate #{rank_idx} APPROVED! Returning answer.")
        return {"status": "approved", "ki": top_ki, "score": conf_score}
