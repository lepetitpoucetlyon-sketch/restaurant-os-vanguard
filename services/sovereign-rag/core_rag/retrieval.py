import logging
import json
import re
import asyncio
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from infra.db.database import get_db_connection
from core_rag.model_router import router as brain
from core_rag.utils import tokenize_smart

logger = logging.getLogger("SovereignRAG.Retrieval")


def _make_filter(explicit_root_id: Optional[str]) -> Optional[List[str]]:
    return [explicit_root_id] if explicit_root_id else None


class RetrievalManager:
    def __init__(self, embed_model, client, bm25_manager, veto_manager, ingestion_manager):
        self.embed_model = embed_model
        self.client = client
        self.bm25_manager = bm25_manager
        self.veto_manager = veto_manager
        self.ingestion_manager = ingestion_manager

    async def resolve_document_reference(self, question: str, workspace_id: str) -> Optional[str]:
        q_lower = question.lower()
        conn = get_db_connection()
        cursor = conn.cursor()
        patterns = [
            (r'facture\s*(?:#?\s*)?(\w+)', 'Facture'),
            (r'contrat\s+(\w+)', 'Contrat'),
            (r'devis\s+(?:de\s+)?(\w+)', 'Devis'),
            (r'bon de livraison', 'Bon de livraison'),
        ]
        for pattern, doc_type in patterns:
            match = re.search(pattern, q_lower)
            if match:
                cursor.execute(
                    "SELECT root_id FROM documents WHERE workspace_id = ? AND doc_type = ?",
                    (workspace_id, doc_type)
                )
                row = cursor.fetchone()
                if row:
                    conn.close()
                    return row["root_id"]
        conn.close()
        return None

    def get_visible_root_ids(self, workspace_id: str, user_id: Optional[str], role: str) -> Optional[List[str]]:
        """Timidité des couronnes — retourne les root_ids accessibles par cet utilisateur."""
        if user_id is None or role == "owner":
            return None
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT root_id FROM documents "
            "WHERE workspace_id = ? AND root_id IS NOT NULL "
            "AND (owner_id = ? OR visibility = 'shared')",
            (workspace_id, user_id)
        )
        rows = cursor.fetchall()
        return [r["root_id"] for r in rows] if rows else []

    # ── Visibility ────────────────────────────────────────────────────────────

    def _setup_visibility(self, allowed_doc_ids: Optional[List[str]], workspace_id: str, user_id: Optional[str], role: str) -> Optional[List[str]]:
        if allowed_doc_ids is not None:
            return allowed_doc_ids
        visible_roots = self.get_visible_root_ids(workspace_id, user_id, role)
        if visible_roots is not None:
            logger.info(f"🌿 Visibility filter: {len(visible_roots)} root_ids accessibles pour user {user_id}")
            return visible_roots
        return None

    # ── Sandbox ───────────────────────────────────────────────────────────────

    async def _handle_sandbox(self, question: str, workspace_id: str, allowed_doc_ids: Optional[List[str]]) -> Optional[Dict[str, Any]]:
        from core_rag.sandbox import intent_router, generate_and_execute_sandbox, to_bionic_reading
        if intent_router(question) != "CODE_SANDBOX":
            return None
        logger.info("🧠 Arithmetic/List query detected. Routing to Sandbox Fallback.")
        sandbox_res = await generate_and_execute_sandbox(
            query=question, workspace_id=workspace_id,
            client=self.client, allowed_doc_ids=allowed_doc_ids
        )
        if sandbox_res.get("success"):
            bionic_ans = to_bionic_reading(sandbox_res["output"])
            return {
                "answer": f"Résultat du calcul exact : **{bionic_ans}**",
                "sources": sandbox_res.get("sources", []),
                "source_snippets": [], "latency_ms": 0,
                "score": 1.0, "gate": "green", "brain": "Zenith-sandbox", "_metadata": {}
            }
        logger.warning(f"⚠️ Sandbox execution failed: {sandbox_res.get('error')}. Falling back to semantic search.")
        return None

    # ── Veto + early CQE ─────────────────────────────────────────────────────

    async def _veto_or_expand(self, question: str, workspace_id: str, bm25_metadata: list, mode: str, allowed_doc_ids: Optional[List[str]]) -> Optional[Dict[str, Any]]:
        question_is_relevant, max_score = await self.veto_manager.question_veto(question, workspace_id, bm25_metadata)
        if question_is_relevant:
            return None
        if max_score < 0.12:
            logger.info(f"🚫 Absolute Question Veto Blocked: centroid_score={max_score:.4f} < 0.12.")
            return {
                "answer": "Aucune information pertinente dans le corpus.",
                "sources": [], "score": max_score, "vetoed": True, "gate": "red",
                "veto_reason": "question_out_of_scope",
                "_metadata": {"question_veto": True, "layer": 0, "absolute_veto": True}
            }
        logger.info("🚫 Question Veto Gate BLOCKED. Attempting early Corrective Query Expansion...")
        from core_rag.antigravity_prompt import get_query_expansion_prompt
        try:
            expansion_response = await brain.generate(
                get_query_expansion_prompt(question),
                system_prompt="Expert en expansion sémantique JSON strict.", timeout=30.0
            )
            res_str = expansion_response.strip()
            if "```json" in res_str:
                res_str = res_str.split("```json")[1].split("```")[0].strip()
            elif "```" in res_str:
                res_str = res_str.split("```")[1].split("```")[0].strip()
            variations = json.loads(res_str)
            if isinstance(variations, list) and variations:
                logger.info(f"✨ Found early variations: {variations}")
                for variation in variations[:3]:
                    variation_is_relevant, _ = await self.veto_manager.question_veto(variation, workspace_id, bm25_metadata)
                    if variation_is_relevant:
                        logger.info(f"🎉 Early CQE SUCCESS! Variation '{variation}' is relevant.")
                        return await self.query(workspace_id, variation, skip_macro_routing=True, mode=mode, is_retry=True, allowed_doc_ids=allowed_doc_ids)
        except Exception as e:
            logger.error(f"⚠️ Early query expansion failed: {e}")
        logger.info(f"🚫 Question Veto Gate BLOCKED: '{question[:60]}' — hors du corpus")
        return {
            "answer": "Aucune information pertinente dans le corpus.",
            "sources": [], "score": max_score, "vetoed": True, "gate": "red",
            "veto_reason": "question_out_of_scope",
            "_metadata": {"question_veto": True, "layer": 0}
        }

    # ── Blacklist ─────────────────────────────────────────────────────────────

    def _load_blacklist(self, workspace_id: str) -> set:
        blacklisted: set = set()
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT ki_id, alias_text FROM blacklisted_aliases WHERE workspace_id = ?", (workspace_id,))
            for row in cursor.fetchall():
                blacklisted.add((row[0], row[1].lower()))
            conn.close()
        except Exception as e:
            logger.warning(f"⚠️ Failed to query blacklisted aliases: {e}")
        return blacklisted

    # ── Doc filter ────────────────────────────────────────────────────────────

    def _apply_doc_filter(self, results: list, allowed_doc_ids: Optional[List[str]], blacklisted: set) -> list:
        if not (allowed_doc_ids is not None or blacklisted):
            return results
        filtered = []
        for ki in results:
            if allowed_doc_ids is not None and ki.get("source") not in allowed_doc_ids and ki.get("root_id") not in allowed_doc_ids:
                continue
            if (ki.get("ki_id"), ki.get("alias", "").lower()) in blacklisted:
                logger.info(f"🛡️ Security: Filtering out blacklisted alias '{ki.get('alias')}' for KI {ki.get('ki_id')}")
                continue
            filtered.append(ki)
        return filtered

    # ── Macro routing ─────────────────────────────────────────────────────────

    async def _fetch_bridged_root_ids(self, workspace_id: str, macro_context: dict) -> List[str]:
        target_root_ids: List[str] = []
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT target_ki_id FROM ki_relations WHERE workspace_id = ? AND source_ki_id = ? AND relationship_type = 'RELATED_TO'",
                (workspace_id, macro_context["id"])
            )
            bridged_cluster_ids = [row[0] for row in cursor.fetchall()]
            if bridged_cluster_ids:
                placeholders = ",".join(["?"] * len(bridged_cluster_ids))
                cursor.execute(f"SELECT root_ids FROM clusters WHERE id IN ({placeholders})", bridged_cluster_ids)
                for row in cursor.fetchall():
                    if row[0]:
                        try:
                            rids = json.loads(row[0])
                            if isinstance(rids, list):
                                target_root_ids.extend(rids)
                        except Exception:
                            pass
            conn.close()
        except Exception as e:
            logger.error(f"⚠️ Failed to query bridged clusters: {e}")
        root_ids_str = macro_context.get("root_ids")
        if root_ids_str:
            try:
                rids = json.loads(root_ids_str)
                if isinstance(rids, list):
                    target_root_ids.extend(rids)
            except Exception as e:
                logger.error(f"⚠️ Erreur parsing root_ids du cluster: {e}")
        return target_root_ids

    async def _macro_route(self, workspace_id: str, question: str, vec: list, skip_macro_routing: bool) -> Tuple[Optional[dict], List[str], str, dict]:
        macro_context = None
        target_root_ids: List[str] = []
        bm25_query = question
        meta: dict = {}
        if skip_macro_routing:
            return macro_context, target_root_ids, bm25_query, meta
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, summary, keywords, centroid, root_ids FROM clusters WHERE workspace_id = ?", (workspace_id,))
        clusters = cursor.fetchall()
        conn.close()
        if not clusters:
            return macro_context, target_root_ids, bm25_query, meta
        vec_np = np.array(vec)
        best_score = -1.0
        for row in clusters:
            if not row["centroid"]:
                continue
            try:
                centroid = np.array(json.loads(row["centroid"]))
                norm_v = np.linalg.norm(vec_np)
                norm_c = np.linalg.norm(centroid)
                if norm_v > 0 and norm_c > 0:
                    score = float(np.dot(vec_np, centroid) / (norm_v * norm_c))
                    if score > best_score:
                        best_score = score
                        macro_context = dict(row)
            except Exception as e:
                logger.error(f"⚠️ Erreur parsing centroid: {e}")
        if macro_context and best_score > 0.85:
            logger.info(f"🌲 Macro-Routing: Matched cluster '{macro_context['name']}' (Score: {best_score:.2f})")
            bm25_query = f"{question} {macro_context.get('keywords', '')} {macro_context.get('name', '')}"
            target_root_ids = await self._fetch_bridged_root_ids(workspace_id, macro_context)
            meta = {"matched_cluster": macro_context.get("name")}
        return macro_context, target_root_ids, bm25_query, meta

    # ── Cluster boost ─────────────────────────────────────────────────────────

    def _apply_cluster_boost(self, vector_results: list, target_root_ids: List[str]) -> list:
        if not target_root_ids:
            return vector_results
        for ki in vector_results:
            if ki.get("root_id") in target_root_ids:
                ki["score"] = min(1.0, float(ki.get("score", 0.0)) * 1.15)
        return vector_results

    # ── RRF merge ─────────────────────────────────────────────────────────────

    def _rrf_merge(self, vector_results: list, bm25_results: list) -> Tuple[list, dict]:
        k_rrf = 60
        combined_scores: dict = {}
        ki_map: dict = {}
        seen_v: set = set()
        for i, ki in enumerate(vector_results):
            ki_id = ki.get("ki_id")
            if ki_id not in seen_v:
                seen_v.add(ki_id)
                combined_scores[ki_id] = combined_scores.get(ki_id, 0) + (1.0 / (k_rrf + i + 1))
            if ki_id not in ki_map or ki.get("score", 0.0) > ki_map[ki_id].get("score", 0.0):
                ki_map[ki_id] = ki
        seen_b: set = set()
        for i, ki in enumerate(bm25_results):
            ki_id = ki.get("ki_id")
            if ki_id not in seen_b:
                seen_b.add(ki_id)
                combined_scores[ki_id] = combined_scores.get(ki_id, 0) + (1.0 / (k_rrf + i + 1))
            if ki_id not in ki_map:
                ki_map[ki_id] = ki
        return sorted(combined_scores.items(), key=lambda x: x[1], reverse=True), ki_map

    # ── Feedback ──────────────────────────────────────────────────────────────

    def _load_feedbacks(self, workspace_id: str) -> Tuple[set, set, set, set]:
        incorrect_ki_ids: set = set()
        incorrect_cluster_ids: set = set()
        correct_ki_ids: set = set()
        correct_cluster_ids: set = set()
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "SELECT ki_id, cluster_id, feedback_type FROM feedbacks "
                "WHERE workspace_id = ? AND feedback_type IN ('incorrect', 'correct')",
                (workspace_id,)
            )
            for row in cursor.fetchall():
                if row["feedback_type"] == "incorrect":
                    if row["ki_id"]:
                        incorrect_ki_ids.add(row["ki_id"])
                    if row["cluster_id"]:
                        incorrect_cluster_ids.add(row["cluster_id"])
                else:
                    if row["ki_id"]:
                        correct_ki_ids.add(row["ki_id"])
                    if row["cluster_id"]:
                        correct_cluster_ids.add(row["cluster_id"])
            conn.close()
        except Exception as fe:
            logger.error(f"⚠️ Erreur lors de la récupération des feedbacks: {fe}")
        return incorrect_ki_ids, incorrect_cluster_ids, correct_ki_ids, correct_cluster_ids

    def _apply_ki_feedback(self, ki: dict, final_results: list, explicit_root_id: Optional[str], top_root: Optional[str], inc_ki: set, inc_cl: set, cor_ki: set, cor_cl: set):
        ki_id = ki.get("ki_id")
        if ki_id in inc_ki or ki.get("matched_cluster") in inc_cl:
            ki["score"] = float(ki.get("score", 0.0)) * 0.50
            logger.info(f"❌ Feedback learning: Applied -50% penalty to KI {ki_id}")
        elif ki_id in cor_ki or ki.get("matched_cluster") in cor_cl:
            ki["score"] = min(1.0, float(ki.get("score", 0.0)) * 1.25)
            logger.info(f"✅ Feedback learning: Applied +25% boost to KI {ki_id}")
        elif top_root and top_root != "UNKNOWN":
            if ki.get("root_id") == top_root and ki != final_results[0]:
                ki["score"] = min(1.0, float(ki.get("score", 0.0)) * 1.25)
            elif ki.get("root_id") != top_root and explicit_root_id:
                ki["score"] = max(0.0, float(ki.get("score", 0.0)) * 0.70)

    def _apply_feedback(self, final_results: list, explicit_root_id: Optional[str], inc_ki: set, inc_cl: set, cor_ki: set, cor_cl: set) -> list:
        if not final_results:
            return final_results
        top_root = explicit_root_id or final_results[0].get("root_id")
        for ki in final_results:
            self._apply_ki_feedback(ki, final_results, explicit_root_id, top_root, inc_ki, inc_cl, cor_ki, cor_cl)
        return final_results

    # ── Snippet pruning ───────────────────────────────────────────────────────

    def _prune_raw_snippets(self, query: str, raw_snippets: list) -> list:
        stop = {"quel", "quelle", "quels", "quelles", "avec", "dans", "pour", "est", "sont", "les", "une", "des"}
        keywords = [w.lower() for w in re.findall(r"\b\w{3,}\b", query) if w.lower() not in stop]
        pruned = []
        for snippet in raw_snippets:
            if not snippet:
                continue
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", snippet) if s.strip()]
            keep: set = set()
            for idx, sentence in enumerate(sentences):
                s_lower = sentence.lower()
                has_kw = any(kw in s_lower for kw in keywords)
                has_num = (any(c.isdigit() for c in sentence)
                           if any(w in query.lower() for w in ["montant", "combien", "tva", "tarif", "date", "quand"])
                           else False)
                if has_kw or has_num:
                    keep.add(idx)
                    if idx > 0:
                        keep.add(idx - 1)
            if keep:
                pruned.append(" ".join(sentences[i] for i in sorted(keep)))
            else:
                pruned.append(sentences[0] if sentences else snippet)
        return pruned

    # ── Logical answer ────────────────────────────────────────────────────────

    async def _logical_answer(self, question: str, q_lower: str, final_results: list, brain_mode: str, meta: dict) -> Optional[Dict[str, Any]]:
        is_logical = any(w in q_lower for w in ["ht", "ttc", "tva", "montant", "combien", "plus cher"])
        has_financial = any(w in q_lower for w in ["ht", "ttc", "tva", "montant"])
        if not (is_logical and has_financial):
            return None
        logger.info("🧠 Logical/Arithmetic question detected. Generating direct logical answer from retrieved context...")
        context_pieces = []
        for ki in final_results[:5]:
            p = ki.get('payload', {})
            payload_info = ""
            if p and any(k in p for k in ['ht_amount', 'ttc_amount', 'tva_amount']):
                payload_info = f" (HT={p.get('ht_amount')}, TVA={p.get('tva_amount')}, TTC={p.get('ttc_amount')})"
            context_pieces.append(f"Fact: {ki.get('question')} -> {ki.get('answer')}{payload_info} [Doc: {ki.get('source', 'unknown')}]")
        context_str = "\n".join(context_pieces)
        prompt = (
            f"Voici les informations extraites du document:\n{context_str}\n\n"
            f"Réponds de manière extrêmement concise, exacte et factuelle à la question suivante.\n"
            f"Tu DOIS impérativement entourer de doubles astérisques les montants, valeurs clés ou entités factuelles importantes.\n\n"
            f"Question: \"{question}\"\nZéro blabla, réponds directement."
        )
        try:
            ans = await brain.generate(prompt, system_prompt="Tu es un assistant analytique expert.", timeout=30.0, mode=brain_mode)
            raw_snippets = [ki.get("raw_snippet") or ki.get("payload", {}).get("raw_snippet", "") for ki in final_results[:5]]
            return {
                "answer": ans.strip(),
                "sources": list(set([ki.get("source", "unknown") for ki in final_results[:5]])),
                "source_snippets": self._prune_raw_snippets(question, raw_snippets),
                "latency_ms": 0, "score": 1.0, "gate": "green", "brain": "Zenith-logic", "_metadata": meta
            }
        except Exception as e:
            logger.error(f"⚠️ Direct logical answer generation failed: {e}. Falling back to standard flow.")
            return None

    # ── Synthesis ─────────────────────────────────────────────────────────────

    async def _synthesize_answer(self, question: str, raw_answer: str, brain_mode: str) -> str:
        synthesize_prompt = (
            f"Rédige une phrase de réponse courte, claire, polie et bien formulée en français à la question suivante.\n"
            f"Tu DOIS impérativement inclure la valeur factuelle exacte '{raw_answer}' dans ta réponse, et l'entourer de doubles astérisques pour la mettre en valeur (ex: '**{raw_answer}**').\n\n"
            f"Question: {question}\nValeur factuelle à inclure et surligner: {raw_answer}\n\n"
            f"Exemple de réponse attendue:\nQuestion: 'Quel est le client de la facture #777?' -> Réponse: 'Le client de la facture #777 est **Ville de Marseille**.'\n\nRéponse rédigée:"
        )
        try:
            ans_gen = await brain.generate(synthesize_prompt, system_prompt="Tu es un secrétaire de direction précis.", timeout=15.0, mode=brain_mode)
            answer = ans_gen.strip()
            if f"**{raw_answer}**" not in answer and raw_answer in answer:
                answer = answer.replace(raw_answer, f"**{raw_answer}**")
            return answer
        except Exception as e:
            logger.error(f"Failed to synthesize formulated response: {e}")
            return f"**{raw_answer}**"

    # ── Candidate evaluation ──────────────────────────────────────────────────

    async def _evaluate_candidates(self, question: str, final_results: list, threshold: float, workspace_id: str, brain_mode: str, is_retry: bool, meta: dict) -> Tuple[Optional[Dict[str, Any]], list]:
        eval_limit = 1 if is_retry else 3
        eval_tasks = [
            self.veto_manager.evaluate_candidate(i, ki, question, threshold, workspace_id=workspace_id, brain_mode=brain_mode)
            for i, ki in enumerate(final_results[:eval_limit])
        ]
        eval_results = await asyncio.gather(*eval_tasks)
        vetoed = []
        for res in eval_results:
            if res["status"] == "approved":
                top_ki = res["ki"]
                raw_answer = top_ki.get("answer", "")
                answer = await self._synthesize_answer(question, raw_answer, brain_mode)
                raw_snippet = top_ki.get("raw_snippet") or top_ki.get("payload", {}).get("raw_snippet", "")
                return {
                    "answer": answer,
                    "sources": [top_ki.get("source", "unknown")],
                    "source_snippets": self._prune_raw_snippets(question, [raw_snippet]),
                    "latency_ms": 0, "score": res["score"], "gate": "green",
                    "brain": "Zenith-hybrid", "ki_id": top_ki.get("ki_id"), "_metadata": meta
                }, vetoed
            else:
                vetoed.append(res)
        return None, vetoed

    # ── Corrective Query Expansion ────────────────────────────────────────────

    async def _run_variation(self, variation: str, workspace_id: str, mode: str, threshold: float, allowed_doc_ids: Optional[List[str]], question: str) -> Optional[Dict[str, Any]]:
        logger.info(f"🔄 Retrying semantic search with query variation: '{variation}'")
        retry_res = await self.query(workspace_id, variation, skip_macro_routing=True, mode=mode, is_retry=True, allowed_doc_ids=allowed_doc_ids)
        if not retry_res.get("vetoed", False) and retry_res.get("score", 0.0) >= threshold:
            logger.info(f"🎉 Corrective Query Expansion SUCCESS with variation: '{variation}'!")
            retry_res.setdefault("_metadata", {})
            retry_res["_metadata"]["original_query"] = question
            retry_res["_metadata"]["corrective_variation"] = variation
            return retry_res
        return None

    async def _corrective_query_expansion(self, question: str, workspace_id: str, mode: str, threshold: float, allowed_doc_ids: Optional[List[str]]) -> Optional[Dict[str, Any]]:
        logger.info("⚠️ Veto Gate triggered on all candidates. Starting local Corrective Query Expansion...")
        from core_rag.antigravity_prompt import get_query_expansion_prompt
        try:
            expansion_response = await brain.generate(
                get_query_expansion_prompt(question),
                system_prompt="Expert en expansion sémantique JSON strict.", timeout=30.0
            )
            res_str = expansion_response.strip()
            if "```json" in res_str:
                res_str = res_str.split("```json")[1].split("```")[0].strip()
            elif "```" in res_str:
                res_str = res_str.split("```")[1].split("```")[0].strip()
            variations = json.loads(res_str)
            if isinstance(variations, list) and variations:
                logger.info(f"✨ Found query variations: {variations}")
                cqe_tasks = [asyncio.create_task(self._run_variation(v, workspace_id, mode, threshold, allowed_doc_ids, question)) for v in variations[:3]]
                for future in asyncio.as_completed(cqe_tasks):
                    result = await future
                    if result:
                        for t in cqe_tasks:
                            t.cancel()
                        return result
        except Exception as e:
            logger.error(f"⚠️ Query expansion failed: {e}")
        return None

    # ── Main entry point ──────────────────────────────────────────────────────

    async def query(self, workspace_id: str, question: str, skip_macro_routing: bool = False, mode: str = "mix", is_retry: bool = False, allowed_doc_ids: Optional[List[str]] = None, user_id: Optional[str] = None, role: str = "editor") -> Dict[str, Any]:
        q_lower = question.lower()
        allowed_doc_ids = self._setup_visibility(allowed_doc_ids, workspace_id, user_id, role)
        logger.info(f"🔍 Hybrid Query received on {workspace_id} (Length: {len(question)})")

        sandbox_ans = await self._handle_sandbox(question, workspace_id, allowed_doc_ids)
        if sandbox_ans:
            return sandbox_ans

        self.bm25_manager.load(workspace_id)
        bm25_metadata = self.bm25_manager.metadata.get(workspace_id, [])

        if not is_retry:
            veto = await self._veto_or_expand(question, workspace_id, bm25_metadata, mode, allowed_doc_ids)
            if veto:
                return veto

        explicit_root_id = await self.resolve_document_reference(question, workspace_id)
        filter_root_ids = _make_filter(explicit_root_id)
        blacklisted = self._load_blacklist(workspace_id)

        vec = (await asyncio.to_thread(self.embed_model.encode, question, normalize_embeddings=True)).tolist()
        vector_results = self._apply_doc_filter(
            (await self.client.query(workspace_id, vec, filter_root_ids=filter_root_ids)).get("results", []),
            allowed_doc_ids, blacklisted
        )

        macro_context, target_root_ids, bm25_query, meta = await self._macro_route(workspace_id, question, vec, skip_macro_routing)
        vector_results = self._apply_cluster_boost(vector_results, target_root_ids)

        bm25_results = self._apply_doc_filter(self.bm25_manager.search(workspace_id, bm25_query), allowed_doc_ids, blacklisted)
        if explicit_root_id:
            bm25_results = [ki for ki in bm25_results if ki.get("root_id") == explicit_root_id]

        sorted_ids, ki_map = self._rrf_merge(vector_results, bm25_results)

        from core_rag.reranker import rerank
        from infra.config import get_config as _get_cfg
        rrf_candidates = [ki_map[kid] for kid, _ in sorted_ids[:_get_cfg().rerank_candidates]]
        final_results = rerank(question, rrf_candidates)[:10]

        inc_ki, inc_cl, cor_ki, cor_cl = self._load_feedbacks(workspace_id)
        final_results = self._apply_feedback(final_results, explicit_root_id, inc_ki, inc_cl, cor_ki, cor_cl)

        if not final_results:
            return {
                "answer": "Aucune information pertinente dans le corpus.",
                "sources": [], "score": 0.0, "vetoed": True,
                "gate": "red", "veto_reason": "no_results_found"
            }

        config = self.ingestion_manager.get_workspace_config(workspace_id)
        threshold = float(config.get("veto_threshold", 0.65))
        brain_mode = config.get("brain_mode", "cloud")

        logical_ans = await self._logical_answer(question, q_lower, final_results, brain_mode, meta)
        if logical_ans:
            return logical_ans

        approved, vetoed = await self._evaluate_candidates(question, final_results, threshold, workspace_id, brain_mode, is_retry, meta)
        if approved:
            return approved

        if not is_retry:
            cqe = await self._corrective_query_expansion(question, workspace_id, mode, threshold, allowed_doc_ids)
            if cqe:
                return cqe

        first_veto_reason = vetoed[0]["reason"] if vetoed else "unknown"
        top_score = float(final_results[0].get("score", 0.0))
        return {
            "answer": f"Information rejetée (veto sémantique / score bas). Raison principale: {first_veto_reason}",
            "sources": [], "score": top_score, "vetoed": True, "gate": "red", "_metadata": meta
        }
