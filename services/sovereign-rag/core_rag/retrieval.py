import logging
import json
import re
import asyncio
import numpy as np
from typing import Dict, Any, Optional, List
from infra.db.database import get_db_connection
from core_rag.model_router import router as brain
from core_rag.utils import tokenize_smart

logger = logging.getLogger("SovereignRAG.Retrieval")

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
        """
        Timidité des couronnes : retourne la liste des root_ids accessibles par cet utilisateur.
        - owner  → None (pas de filtre, voit tout)
        - editor/viewer → ses propres documents + les documents partagés
        Si user_id est None (auth API key legacy), pas de filtre (comportement rétrocompat).
        """
        if user_id is None or role == "owner":
            return None  # Pas de filtre

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

    async def query(self, workspace_id: str, question: str, skip_macro_routing: bool = False, mode: str = "mix", is_retry: bool = False, allowed_doc_ids: Optional[List[str]] = None, user_id: Optional[str] = None, role: str = "editor") -> Dict[str, Any]:
        q_lower = question.lower()
        is_logical_query = any(w in q_lower for w in ["ht", "ttc", "tva", "montant", "combien", "plus cher"])

        # ── Timidité des couronnes — filtre de visibilité ─────────────────────
        # Si un user_id est fourni, on restreint la recherche aux documents
        # accessibles par cet utilisateur (ses privés + les partagés du workspace).
        # Un owner voit tout. Une auth legacy (sans user_id) voit tout (rétrocompat).
        if allowed_doc_ids is None:
            visible_roots = self.get_visible_root_ids(workspace_id, user_id, role)
            if visible_roots is not None:
                allowed_doc_ids = visible_roots
                logger.info(f"🌿 Visibility filter: {len(allowed_doc_ids)} root_ids accessibles pour user {user_id}")

        logger.info(f"🔍 Hybrid Query received on {workspace_id} (Length: {len(question)})")

        # 1. Route Intent to Code Sandbox Fallback
        from core_rag.sandbox import intent_router, generate_and_execute_sandbox, to_bionic_reading
        if intent_router(question) == "CODE_SANDBOX":
            logger.info("🧠 Arithmetic/List query detected. Routing to Sandbox Fallback.")
            sandbox_res = await generate_and_execute_sandbox(
                query=question,
                workspace_id=workspace_id,
                client=self.client,
                allowed_doc_ids=allowed_doc_ids
            )
            if sandbox_res.get("success"):
                bionic_ans = to_bionic_reading(sandbox_res["output"])
                return {
                    "answer": f"Résultat du calcul exact : **{bionic_ans}**",
                    "sources": sandbox_res.get("sources", []),
                    "source_snippets": [],
                    "latency_ms": 0,
                    "score": 1.0,
                    "gate": "green",
                    "brain": "Zenith-sandbox",
                    "_metadata": {}
                }
            else:
                logger.warning(f"⚠️ Sandbox execution failed: {sandbox_res.get('error')}. Falling back to semantic search.")

        self.bm25_manager.load(workspace_id)
        bm25_metadata = self.bm25_manager.metadata.get(workspace_id, [])

        if not is_retry:
            question_is_relevant, max_score = await self.veto_manager.question_veto(question, workspace_id, bm25_metadata)
            if not question_is_relevant:
                if max_score < 0.12:
                    logger.info(f"🚫 Absolute Question Veto Blocked: centroid_score={max_score:.4f} < 0.12. REJET IMMÉDIAT.")
                    return {
                        "answer": "Aucune information pertinente dans le corpus.",
                        "sources": [],
                        "score": max_score,
                        "vetoed": True,
                        "gate": "red",
                        "veto_reason": "question_out_of_scope",
                        "_metadata": {"question_veto": True, "layer": 0, "absolute_veto": True}
                    }

                logger.info("🚫 Question Veto Gate BLOCKED. Attempting early Corrective Query Expansion for foreign/colloquial phrasing...")
                from core_rag.antigravity_prompt import get_query_expansion_prompt
                expansion_prompt = get_query_expansion_prompt(question)
                try:
                    expansion_response = await brain.generate(expansion_prompt, system_prompt="Expert en expansion sémantique JSON strict.", timeout=30.0)
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
                                logger.info(f"🎉 Early Corrective Query Expansion SUCCESS! Variation '{variation}' is relevant. Proceeding search.")
                                return await self.query(workspace_id, variation, skip_macro_routing=True, mode=mode, is_retry=True, allowed_doc_ids=allowed_doc_ids)
                except Exception as e:
                    logger.error(f"⚠️ Early query expansion failed: {e}")

                logger.info(f"🚫 Question Veto Gate BLOCKED: '{question[:60]}' — hors du corpus")
                return {
                    "answer": "Aucune information pertinente dans le corpus.",
                    "sources": [],
                    "score": max_score,
                    "vetoed": True,
                    "gate": "red",
                    "veto_reason": "question_out_of_scope",
                    "_metadata": {"question_veto": True, "layer": 0}
                }

        explicit_root_id = await self.resolve_document_reference(question, workspace_id)
        filter_root_ids = [explicit_root_id] if explicit_root_id else None
        if explicit_root_id:
            logger.info(f"📑 Explicit document reference resolved: {explicit_root_id}")

        # Fetch blacklisted aliases for filtering
        blacklisted = set()
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT ki_id, alias_text FROM blacklisted_aliases WHERE workspace_id = ?", (workspace_id,))
            for row in cursor.fetchall():
                blacklisted.add((row[0], row[1].lower()))
            conn.close()
        except Exception as e:
            logger.warning(f"⚠️ Failed to query blacklisted aliases: {e}")

        # encode() bloque l'event loop s'il est appelé directement — to_thread
        # permet aux autres requêtes de progresser pendant l'embedding.
        vec = (await asyncio.to_thread(
            self.embed_model.encode, question, normalize_embeddings=True
        )).tolist()
        rust_res = await self.client.query(workspace_id, vec, filter_root_ids=filter_root_ids)
        vector_results = rust_res.get("results", [])
        
        # Apply allowed_doc_ids and blacklisted alias filters
        if allowed_doc_ids is not None or blacklisted:
            filtered_vector = []
            for ki in vector_results:
                if allowed_doc_ids is not None and ki.get("source") not in allowed_doc_ids and ki.get("root_id") not in allowed_doc_ids:
                    continue
                if (ki.get("ki_id"), ki.get("alias", "").lower()) in blacklisted:
                    logger.info(f"🛡️ Security: Filtering out blacklisted alias '{ki.get('alias')}' for KI {ki.get('ki_id')}")
                    continue
                filtered_vector.append(ki)
            vector_results = filtered_vector
        
        macro_context = None
        bm25_query = question
        
        clusters = []
        if not skip_macro_routing:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, summary, keywords, centroid, root_ids FROM clusters WHERE workspace_id = ?", (workspace_id,))
            clusters = cursor.fetchall()
            conn.close()
        
        best_cluster_score = -1.0
        
        if clusters:
            vec_np = np.array(vec)
            for row in clusters:
                if row["centroid"]:
                    try:
                        centroid = np.array(json.loads(row["centroid"]))
                        norm_vec = np.linalg.norm(vec_np)
                        norm_cent = np.linalg.norm(centroid)
                        if norm_vec > 0 and norm_cent > 0:
                            score = np.dot(vec_np, centroid) / (norm_vec * norm_cent)
                            if score > best_cluster_score:
                                best_cluster_score = score
                                macro_context = dict(row)
                    except Exception as e:
                        logger.error(f"⚠️ Erreur parsing centroid: {e}")
        
        target_root_ids = []
        bridged_cluster_ids = []
        if macro_context and best_cluster_score > 0.85:
            logger.info(f"🌲 Macro-Routing: Matched cluster '{macro_context['name']}' (Score: {best_cluster_score:.2f})")
            bm25_query = f"{question} {macro_context.get('keywords', '')} {macro_context.get('name', '')}"
            
            # Query for bridged clusters (RELATED_TO relations)
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT target_ki_id FROM ki_relations WHERE workspace_id = ? AND source_ki_id = ? AND relationship_type = 'RELATED_TO'",
                    (workspace_id, macro_context["id"])
                )
                bridged_cluster_ids = [row[0] for row in cursor.fetchall()]
                
                # Fetch root_ids for the bridged clusters
                if bridged_cluster_ids:
                    placeholders = ",".join(["?"] * len(bridged_cluster_ids))
                    cursor.execute(
                        f"SELECT root_ids FROM clusters WHERE id IN ({placeholders})",
                        bridged_cluster_ids
                    )
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

        if target_root_ids:
            for ki in vector_results:
                if ki.get("root_id") in target_root_ids:
                    old_score = ki.get("score", 0.0)
                    ki["score"] = min(1.0, float(old_score) * 1.15)
        
        bm25_results = self.bm25_manager.search(workspace_id, bm25_query)
        if allowed_doc_ids is not None or blacklisted:
            filtered_bm25 = []
            for ki in bm25_results:
                if allowed_doc_ids is not None and ki.get("source") not in allowed_doc_ids and ki.get("root_id") not in allowed_doc_ids:
                    continue
                if (ki.get("ki_id"), ki.get("alias", "").lower()) in blacklisted:
                    logger.info(f"🛡️ Security: Filtering out blacklisted alias '{ki.get('alias')}' for KI {ki.get('ki_id')}")
                    continue
                filtered_bm25.append(ki)
            bm25_results = filtered_bm25
        if explicit_root_id:
            bm25_results = [ki for ki in bm25_results if ki.get("root_id") == explicit_root_id]
        
        k_rrf = 60
        combined_scores = {}
        ki_map = {}
        
        seen_vector_ki = set()
        for i, ki in enumerate(vector_results):
            ki_id = ki.get("ki_id")
            if ki_id not in seen_vector_ki:
                seen_vector_ki.add(ki_id)
                combined_scores[ki_id] = combined_scores.get(ki_id, 0) + (1.0 / (k_rrf + i + 1))
            if ki_id not in ki_map or ki.get("score", 0.0) > ki_map[ki_id].get("score", 0.0):
                ki_map[ki_id] = ki
            
        seen_bm25_ki = set()
        for i, ki in enumerate(bm25_results):
            ki_id = ki.get("ki_id")
            if ki_id not in seen_bm25_ki:
                seen_bm25_ki.add(ki_id)
                combined_scores[ki_id] = combined_scores.get(ki_id, 0) + (1.0 / (k_rrf + i + 1))
            if ki_id not in ki_map:
                ki_map[ki_id] = ki

        sorted_ids = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)

        # ── Reranking cross-encoder ────────────────────────────────────────────
        # On récupère plus large que le top 10 RRF (rerank_candidates) puis le
        # cross-encoder re-trie par pertinence réelle question↔document.
        from core_rag.reranker import rerank
        from infra.config import get_config as _get_cfg
        _n_candidates = _get_cfg().rerank_candidates
        rrf_candidates = [ki_map[kid] for kid, score in sorted_ids[:_n_candidates]]
        final_results = rerank(question, rrf_candidates)[:10]

        incorrect_ki_ids = set()
        incorrect_cluster_ids = set()
        correct_ki_ids = set()
        correct_cluster_ids = set()
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
                    if row["ki_id"]: incorrect_ki_ids.add(row["ki_id"])
                    if row["cluster_id"]: incorrect_cluster_ids.add(row["cluster_id"])
                else:
                    if row["ki_id"]: correct_ki_ids.add(row["ki_id"])
                    if row["cluster_id"]: correct_cluster_ids.add(row["cluster_id"])
            conn.close()
        except Exception as fe:
            logger.error(f"⚠️ Erreur lors de la récupération des feedbacks: {fe}")

        if final_results:
            top_root = explicit_root_id or final_results[0].get("root_id")
            for ki in final_results:
                ki_id = ki.get("ki_id")
                if ki_id in incorrect_ki_ids or ki.get("matched_cluster") in incorrect_cluster_ids:
                    old_score = ki.get("score", 0.0)
                    ki["score"] = float(old_score) * 0.50
                    logger.info(f"❌ Feedback learning: Applied -50% penalty to KI {ki_id}")
                elif ki_id in correct_ki_ids or ki.get("matched_cluster") in correct_cluster_ids:
                    old_score = ki.get("score", 0.0)
                    ki["score"] = min(1.0, float(old_score) * 1.25)
                    logger.info(f"✅ Feedback learning: Applied +25% boost to KI {ki_id}")
                elif top_root and top_root != "UNKNOWN":
                    if ki.get("root_id") == top_root and ki != final_results[0]:
                        old_score = ki.get("score", 0.0)
                        ki["score"] = min(1.0, float(old_score) * 1.25)
                    elif ki.get("root_id") != top_root and explicit_root_id:
                        old_score = ki.get("score", 0.0)
                        ki["score"] = max(0.0, float(old_score) * 0.70)
        
        if not final_results:
            return {
                "answer": "Aucune information pertinente dans le corpus.",
                "sources": [],
                "score": 0.0,
                "vetoed": True,
                "gate": "red",
                "veto_reason": "no_results_found"
            }

        config = self.ingestion_manager.get_workspace_config(workspace_id)
        threshold = float(config.get("veto_threshold", 0.65))
        # Résolution du brain_mode par workspace — c'est ici que la feature "souveraineté
        # par client" prend effet. On injecte le mode dans chaque appel brain.generate()
        # pour que local/cloud/cloud_sovereign soit respecté au niveau de la requête.
        workspace_brain_mode = config.get("brain_mode", "cloud")

        meta = {}
        if macro_context:
            meta["matched_cluster"] = macro_context.get("name")

        # ─── CRITIQUE & PRUNING CONTEXTUEL (FYA v12.0) ────────────────────────
        def prune_raw_snippets(query: str, raw_snippets: list) -> list:
            import re
            keywords = [w.lower() for w in re.findall(r"\b\w{3,}\b", query) if w.lower() not in {"quel", "quelle", "quels", "quelles", "avec", "dans", "pour", "est", "sont", "les", "une", "des"}]
            pruned_snippets = []
            
            for snippet in raw_snippets:
                if not snippet:
                    continue
                # Division en phrases
                sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", snippet) if s.strip()]
                keep_indices = set()
                
                for idx, sentence in enumerate(sentences):
                    # Calcul de pertinence de la phrase (mots-clés ou nombres pour les requêtes de montant/date)
                    s_lower = sentence.lower()
                    has_kw = any(kw in s_lower for kw in keywords)
                    has_num = any(c.isdigit() for c in sentence) if any(w in query.lower() for w in ["montant", "combien", "tva", "tarif", "date", "quand"]) else False
                    
                    if has_kw or has_num:
                        keep_indices.add(idx)
                        # ─── RÉSOLUTION DU "LOST IN PRONOUNS" (Phrase n-1) ───────────
                        if idx > 0:
                            keep_indices.add(idx - 1)
                
                if keep_indices:
                    pruned = [sentences[i] for i in sorted(list(keep_indices))]
                    pruned_snippets.append(" ".join(pruned))
                else:
                    # Fallback si aucune phrase ne matche, on garde la première phrase
                    pruned_snippets.append(sentences[0] if sentences else snippet)
            return pruned_snippets

        if is_logical_query and any(w in q_lower for w in ["ht", "ttc", "tva", "montant"]):
            logger.info("🧠 Logical/Arithmetic question detected. Generating direct logical answer from retrieved context...")
            
            context_pieces = []
            for ki in final_results[:5]:
                payload_info = ""
                p = ki.get('payload', {})
                if p and any(k in p for k in ['ht_amount', 'ttc_amount', 'tva_amount']):
                    payload_info = f" (HT={p.get('ht_amount')}, TVA={p.get('tva_amount')}, TTC={p.get('ttc_amount')})"
                context_pieces.append(f"Fact: {ki.get('question')} -> {ki.get('answer')}{payload_info} [Doc: {ki.get('source', 'unknown')}]")
            
            context_str = "\n".join(context_pieces)
            prompt = (
                f"Voici les informations extraites du document:\n{context_str}\n\n"
                f"Réponds de manière extrêmement concise, exacte et factuelle à la question suivante.\n"
                f"Tu DOIS impérativement entourer de doubles astérisques les montants, valeurs clés ou entités factuelles importantes (ex: '**18000 EUR**' ou '**ClientA**') pour les mettre en valeur.\n\n"
                f"Question: \"{question}\"\n"
                f"Exemple de réponse attendue: \"Non, le montant TTC (**18000 EUR**) est supérieur au montant HT (**15000 EUR**).\"\n"
                f"Zéro blabla, réponds directement à la question sans fioriture."
            )
            try:
                ans = await brain.generate(prompt, system_prompt="Tu es un assistant analytique expert.", timeout=30.0, mode=workspace_brain_mode)
                raw_snippets = [ki.get("raw_snippet") or ki.get("payload", {}).get("raw_snippet", "") for ki in final_results[:5]]
                pruned_snippets = prune_raw_snippets(question, raw_snippets)
                return {
                    "answer": ans.strip(),
                    "sources": list(set([ki.get("source", "unknown") for ki in final_results[:5]])),
                    "source_snippets": pruned_snippets,
                    "latency_ms": 0,
                    "score": 1.0,
                    "gate": "green",
                    "brain": "Zenith-logic",
                    "_metadata": meta
                }
            except Exception as e:
                logger.error(f"⚠️ Direct logical answer generation failed: {e}. Falling back to standard flow.")

        eval_limit = 1 if is_retry else 3
        eval_tasks = [
            self.veto_manager.evaluate_candidate(i, ki, question, threshold, workspace_id=workspace_id, brain_mode=workspace_brain_mode)
            for i, ki in enumerate(final_results[:eval_limit])
        ]
        eval_results = await asyncio.gather(*eval_tasks)
        
        vetoed_candidates = []
        for res in eval_results:
            if res["status"] == "approved":
                top_ki = res["ki"]
                raw_answer = top_ki.get("answer", "")
                
                # Synthesize a formulated response wrapping the factual answer in bold markdown
                synthesize_prompt = (
                    f"Rédige une phrase de réponse courte, claire, polie et bien formulée en français à la question suivante.\n"
                    f"Tu DOIS impérativement inclure la valeur factuelle exacte '{raw_answer}' dans ta réponse, et l'entourer de doubles astérisques pour la mettre en valeur (ex: '**{raw_answer}**').\n\n"
                    f"Question: {question}\n"
                    f"Valeur factuelle à inclure et surligner: {raw_answer}\n\n"
                    f"Exemple de réponse attendue:\n"
                    f"Question: 'Quel est le client de la facture #777?' -> Réponse: 'Le client de la facture #777 est **Ville de Marseille**.'\n\n"
                    f"Réponse rédigée:"
                )
                try:
                    ans_gen = await brain.generate(synthesize_prompt, system_prompt="Tu es un secrétaire de direction précis.", timeout=15.0, mode=workspace_brain_mode)
                    answer = ans_gen.strip()
                    # Fallback check to ensure raw_answer is highlighted
                    if f"**{raw_answer}**" not in answer and raw_answer in answer:
                        answer = answer.replace(raw_answer, f"**{raw_answer}**")
                except Exception as e:
                    logger.error(f"Failed to synthesize formulated response: {e}")
                    answer = f"**{raw_answer}**"

                raw_snippet = top_ki.get("raw_snippet") or top_ki.get("payload", {}).get("raw_snippet", "")
                pruned_snippets = prune_raw_snippets(question, [raw_snippet])

                return {
                    "answer": answer,
                    "sources": [top_ki.get("source", "unknown")],
                    "source_snippets": pruned_snippets,
                    "latency_ms": 0,
                    "score": res["score"],
                    "gate": "green",
                    "brain": "Zenith-hybrid",
                    "ki_id": top_ki.get("ki_id"),
                    "_metadata": meta
                }
            else:
                vetoed_candidates.append(res)

        if not is_retry:
            logger.info("⚠️ Veto Gate triggered on all candidates. Starting local Corrective Query Expansion...")
            from core_rag.antigravity_prompt import get_query_expansion_prompt
            expansion_prompt = get_query_expansion_prompt(question)
            try:
                expansion_response = await brain.generate(expansion_prompt, system_prompt="Expert en expansion sémantique JSON strict.", timeout=30.0)
                res_str = expansion_response.strip()
                if "```json" in res_str:
                    res_str = res_str.split("```json")[1].split("```")[0].strip()
                elif "```" in res_str:
                    res_str = res_str.split("```")[1].split("```")[0].strip()
                
                variations = json.loads(res_str)
                if isinstance(variations, list) and variations:
                    logger.info(f"✨ Found query variations: {variations}")
                    
                    async def run_variation(variation):
                        logger.info(f"🔄 Retrying semantic search with query variation: '{variation}'")
                        retry_res = await self.query(workspace_id, variation, skip_macro_routing=True, mode=mode, is_retry=True, allowed_doc_ids=allowed_doc_ids)
                        if not retry_res.get("vetoed", False) and retry_res.get("score", 0.0) >= threshold:
                            logger.info(f"🎉 Corrective Query Expansion SUCCESS with variation: '{variation}'!")
                            if "_metadata" not in retry_res:
                                retry_res["_metadata"] = {}
                            retry_res["_metadata"]["original_query"] = question
                            retry_res["_metadata"]["corrective_variation"] = variation
                            return retry_res
                        return None

                    cqe_tasks = [asyncio.create_task(run_variation(v)) for v in variations[:3]]
                    
                    for future in asyncio.as_completed(cqe_tasks):
                        result = await future
                        if result:
                            for t in cqe_tasks:
                                t.cancel()
                            return result
            except Exception as e:
                logger.error(f"⚠️ Query expansion failed: {e}")

        first_veto_reason = vetoed_candidates[0]["reason"] if vetoed_candidates else "unknown"
        top_score = float(final_results[0].get("score", 0.0)) if final_results else 0.0
        return {
            "answer": f"Information rejetée (veto sémantique / score bas). Raison principale: {first_veto_reason}",
            "sources": [],
            "score": top_score,
            "vetoed": True,
            "gate": "red",
            "_metadata": meta
        }
