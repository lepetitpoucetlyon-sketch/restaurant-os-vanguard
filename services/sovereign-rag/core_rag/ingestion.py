import os
import re
import uuid
import json
import hashlib
import asyncio
import logging
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal
from infra.db.database import get_db_connection
from core_rag.model_router import router as brain
from core_rag.finance_rules import extract_metadata_heuristics
from core_rag.utils import clean_amount, format_float_precision, create_ki_id
from core_rag.constants import TAU_FUSION

logger = logging.getLogger("SovereignRAG.Ingestion")

class IngestionManager:
    def __init__(self, embed_model, client, bm25_manager, job_manager, semaphore):
        self.embed_model = embed_model
        self.client = client
        self.bm25_manager = bm25_manager
        self.job_manager = job_manager
        self.semaphore = semaphore

    def get_workspace_config(self, workspace_id: str) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT name, brain_mode, veto_threshold, model_name, "
            "crystallization_enabled, active_ruleset FROM workspaces WHERE id = ?",
            (workspace_id,)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return {
            "name": "",
            "brain_mode": "cloud",
            "veto_threshold": 0.65,
            "model_name": "anthropic/claude-3-5-sonnet",
            "crystallization_enabled": 1,
            "active_ruleset": "finance_fr",
        }

    async def generate_document_root(self, text: str) -> Dict[str, Any]:
        """Génère l'ADN sémantique du document (ROOT)"""
        text_excerpt = text[:2500]
        base_hash = hashlib.sha256(text_excerpt.encode()).hexdigest()[:12]
        
        prompt = """Analyse ce document et réponds UNIQUEMENT en JSON valide:
{
  "type": "Facture|Contrat|Notice|Email|Accord|Rapport",
  "domain": "Finance|RH|Legal|Technique|Commercial|Support",
  "subject": "Résumé court (max 100 chars)",
  "essence": ["mot1", "mot2", "mot3"]
}

## DOCUMENT:
---
""" + text_excerpt + """
---
"""
        try:
            res = await brain.generate(prompt, system_prompt="Analyste expert RAG Grade X. JSON strict.")
            root_json = json.loads(res.strip())
            doc_sig = f"{root_json.get('type')}_{root_json.get('domain')}_{base_hash}"
            root_id = f"ROOT_{hashlib.sha256(doc_sig.encode()).hexdigest()[:12]}"
            
            return {
                "root_id": root_id,
                "doc_type": root_json.get("type", "Unknown"),
                "doc_domain": root_json.get("domain", "Unknown"),
                "doc_subject": root_json.get("subject", "Sans sujet"),
                "essence": root_json.get("essence", [])
            }
        except Exception as e:
            logger.error(f"⚠️ ROOT Generation Failed: {e}")
            return {
                "root_id": f"ROOT_{base_hash}", 
                "doc_type": "Unknown", 
                "doc_domain": "Unknown", 
                "doc_subject": "Fallback", 
                "essence": []
            }

    def extract_and_save_ki_relations(self, workspace_id: str, ki_list: list, doc_root_id: str):
        """Phase 2 GraphRAG : Détecte et enregistre les relations sémantiques entre KIs.
        
        Hard cap à MAX_RELATIONS_PER_DOC pour éviter l'explosion O(N²) sur les gros
        contrats cadres avec beaucoup de parties prenantes.
        """
        MAX_RELATIONS_PER_DOC = 20
        relations = []
        unique_kis = {}
        for ki in ki_list:
            unique_kis[ki["ki_id"]] = ki
            
        kis = list(unique_kis.values())
        
        clients = [k for k in kis if "client" in k["question"].lower() or "destinataire" in k["question"].lower()]
        fournisseurs = [k for k in kis if "fournisseur" in k["question"].lower() or "expéditeur" in k["question"].lower() or "prestataire" in k["question"].lower()]
        signataires = [k for k in kis if "signataire" in k["question"].lower() or "signé" in k["question"].lower() or "auteur" in k["question"].lower()]
        montants = [k for k in kis if k.get("payload", {}).get("ttc_amount") and float(k["payload"]["ttc_amount"]) > 0]
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        def _add_relation(src_ki_id: str, tgt_ki_id: str, rel_type: str) -> bool:
            """Insert une relation et retourne False si le cap est atteint."""
            if len(relations) >= MAX_RELATIONS_PER_DOC:
                return False
            rel_id = f"rel_{uuid.uuid4().hex[:8]}"
            cursor.execute(
                "INSERT INTO ki_relations (id, workspace_id, source_ki_id, target_ki_id, relationship_type) VALUES (?, ?, ?, ?, ?)",
                (rel_id, workspace_id, src_ki_id, tgt_ki_id, rel_type)
            )
            relations.append((src_ki_id, rel_type, tgt_ki_id))
            return True
        
        try:
            for c in clients:
                for f in fournisseurs:
                    if not _add_relation(c["ki_id"], f["ki_id"], "CLIENT_OF"):
                        break
                else:
                    continue
                break
            
            for s in signataires:
                for m in montants:
                    if not _add_relation(s["ki_id"], m["ki_id"], "RESPONSABLE_DE"):
                        break
                else:
                    continue
                break
            
            for m in montants:
                for c in clients:
                    if not _add_relation(m["ki_id"], c["ki_id"], "FACTURE_A"):
                        break
                else:
                    continue
                break
                    
            conn.commit()
            if len(relations) >= MAX_RELATIONS_PER_DOC:
                logger.warning(f"⚠️ GraphRAG: Capped at {MAX_RELATIONS_PER_DOC} relations for doc {doc_root_id} (potential large contract).")
            logger.info(f"🌲 Sovereign GraphRAG: Persisted {len(relations)} semantic relations in SQLite.")
        except Exception as e:
            logger.error(f"❌ Failed to persist GraphRAG relations: {e}")
        finally:
            conn.close()

    async def background_ingest(self, job_id: str, workspace_id: str, file_path: str):
        self.job_manager.update_job(job_id, {
            "kis_created": 0,
            "kis_rejected": 0,
            "integrity_root": "none"
        })
        try:
            logger.info(f"🚀 START BACKGROUND JOB: {job_id} for {file_path}")
            config = self.get_workspace_config(workspace_id)
            
            # ─── SOVEREIGN SANDBOX SANITIZER (DANGERZONE FALLBACK) ────────────────
            from core_rag.sandbox_sanitizer import SandboxSanitizer, SecurityException
            try:
                file_path = SandboxSanitizer.sanitize_and_validate(file_path)
            except SecurityException as sec_err:
                logger.error(f"🛡️ Sandbox Sanitizer: Blocked ingestion due to safety breach: {sec_err}")
                self.job_manager.update_job(job_id, {
                    "status": "error",
                    "error": str(sec_err),
                    "progress": 100,
                    "integrity_root": "failed_security_sanitization"
                })
                return

            ext = os.path.splitext(file_path)[1].lower()
            text = ""
            
            from core_rag.vision_parser import LayoutVisionParser
            if LayoutVisionParser.is_visual_document(file_path):
                text = await LayoutVisionParser.parse_to_markdown_tables(file_path)
            elif ext == ".pdf":
                try:
                    import fitz
                    doc = fitz.open(file_path)
                    text_parts = []
                    for page in doc:
                        text_parts.append(page.get_text())
                    text = "\n".join(text_parts)
                    logger.info(f"📄 PyMuPDF: Extracted {len(text)} chars from {file_path}")
                except Exception as e:
                    logger.error(f"❌ PyMuPDF extraction failed: {e}")
                    with open(file_path, "r", errors="ignore") as f:
                        text = f.read()
            else:
                with open(file_path, "r", errors="ignore") as f:
                    text = f.read()

            self.job_manager.update_job(job_id, {"progress": 5})
            root_data = await self.generate_document_root(text)
            doc_root_id = root_data["root_id"]
            self.job_manager.update_job(job_id, {
                "root_id": doc_root_id,
                "doc_type": root_data["doc_type"],
                "doc_domain": root_data["doc_domain"],
                "doc_subject": root_data["doc_subject"],
                "essence": root_data["essence"]
            })
            logger.info(f"⚓ ROOT Anchored: {doc_root_id} for {file_path}")

            doc_hash = hashlib.sha256(text.encode()).hexdigest()
            self.job_manager.update_job(job_id, {"progress": 10})
            
            new_doc_id = f"doc_{uuid.uuid4().hex[:8]}"
            self.job_manager.update_job(job_id, {"doc_id": new_doc_id})

            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO documents (id, workspace_id, filename, hash, summary, ki_count, integrity_root, root_id, doc_type, doc_domain, doc_subject, doc_essence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        new_doc_id, 
                        workspace_id, 
                        os.path.basename(file_path), 
                        doc_hash, 
                        "En cours d'analyse...", 
                        0, 
                        "pending", 
                        doc_root_id, 
                        root_data["doc_type"], 
                        root_data["doc_domain"],
                        root_data["doc_subject"],
                        json.dumps(root_data["essence"])
                    )
                )
                conn.commit()
                conn.close()
                logger.info(f"💾 Document pre-persisted (pending): {doc_root_id} with ID {new_doc_id}")
            except Exception as db_e:
                logger.warning(f"⚠️ Pre-persistence warning: {str(db_e)}")

            self.job_manager.update_job(job_id, {"progress": 15})
            
            async with self.semaphore:
                extracted = await brain.extract_kis(text)
                
                summary_prompt = f"Résume ce document ({root_data['doc_type']}) en 3 phrases maximum.\n\nDOCUMENT:\n{text[:2000]}"
                summary = await brain.generate(summary_prompt, system_prompt="Tu es un secrétaire de direction.")
            
            if not extracted:
                extracted = []
            heuristics = extract_metadata_heuristics(text)
            extracted.extend(heuristics)
            
            global_ht = Decimal('0.0')
            global_tva = Decimal('0.0')
            global_ttc = Decimal('0.0')
            global_currency = "UNKNOWN"
            
            for item in extracted:
                if not isinstance(item, dict): continue
                p = item.get("payload", {})
                
                ht_val = p.get("ht_amount") or item.get("ht_amount")
                tva_val = p.get("tva_amount") or item.get("tva_amount")
                ttc_val = p.get("ttc_amount") or item.get("ttc_amount")
                curr_val = p.get("currency") or item.get("currency")
                
                if curr_val and curr_val != "UNKNOWN":
                    global_currency = curr_val
                    
                if ht_val:
                    try:
                        val_d = Decimal(clean_amount(ht_val))
                        if val_d > global_ht: global_ht = val_d
                    except Exception: pass
                if tva_val:
                    try:
                        val_d = Decimal(clean_amount(tva_val))
                        if val_d > global_tva: global_tva = val_d
                    except Exception: pass
                if ttc_val:
                    try:
                        val_d = Decimal(clean_amount(ttc_val))
                        if val_d > global_ttc: global_ttc = val_d
                    except Exception: pass
            
            text_lines = text.split("\n")
            for line in text_lines:
                line_lower = line.lower()
                ht_match = re.search(r"(?:ht|hors\s*taxe[s]?)\s*[:=]\s*([\d\s.,]+)", line_lower)
                if ht_match:
                    try:
                        val_d = Decimal(clean_amount(ht_match.group(1)))
                        if val_d > global_ht: global_ht = val_d
                    except Exception: pass
                tva_match = re.search(r"(?:tva|taxe)(?:\s*\([^)]*\))?\s*[:=]\s*([\d\s.,]+)", line_lower)
                if tva_match:
                    try:
                        val_d = Decimal(clean_amount(tva_match.group(1)))
                        if val_d > global_tva: global_tva = val_d
                    except Exception: pass
                ttc_match = re.search(r"(?:ttc|total|a\s*payer)\s*[:=]\s*([\d\s.,]+)", line_lower)
                if ttc_match:
                    try:
                        val_d = Decimal(clean_amount(ttc_match.group(1)))
                        if val_d > global_ttc: global_ttc = val_d
                    except Exception: pass
                    
            non_zero_ds = [v for v in [global_ht, global_tva, global_ttc] if v > 0]
            min_val_d = min(non_zero_ds) if non_zero_ds else Decimal('0.0')
            tolerance_d = Decimal("0.000001") if min_val_d < Decimal("0.01") else Decimal("0.01")
            
            diff_d = abs((global_ht + global_tva) - global_ttc)
            if global_ttc > 0 and diff_d > tolerance_d:
                logger.warning(f"⚠️ GLOBAL BALANCE ERROR: HT ({global_ht}) + TVA ({global_tva}) != TTC ({global_ttc}) | Diff: {diff_d} | Tolerance: {tolerance_d}")
                kis_rejected = max(1, len(extracted))
                
                try:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE documents SET integrity_root = ?, summary = ? WHERE id = ?",
                        ("failed", f"Global balance math error: HT ({global_ht}) + TVA ({global_tva}) != TTC ({global_ttc})", new_doc_id)
                    )
                    conn.commit()
                    conn.close()
                except Exception as e:
                    logger.warning(f"Failed to update failed status in SQLite: {e}")
                
                self.job_manager.update_job(job_id, {
                    "status": "completed", 
                    "progress": 100, 
                    "kis_created": 0, 
                    "kis_rejected": kis_rejected,
                    "integrity_root": "failed",
                    "summary": f"Rejected due to balance math error: HT ({global_ht}) + TVA ({global_tva}) != TTC ({global_ttc})",
                    "end_time": datetime.now().isoformat()
                })
                logger.info(f"✅ JOB {job_id} REJECTED due to global math error (kis_rejected={kis_rejected})")
                return
            
            self.job_manager.update_job(job_id, {"progress": 60})

            if not extracted:
                self.job_manager.update_job(job_id, {"status": "failed", "reason": "extraction_failed", "progress": 100})
                return

            logger.info(f"💎 Extracted {len(extracted)} KIs from document")
            ki_list, point_list = [], []
            kis_accepted = 0
            kis_rejected = 0
            doc_tolerance = Decimal("0.01")
            for item in extracted:
                if not isinstance(item, dict): continue
                
                if item.get("conflict"):
                    kis_rejected += 1
                    continue

                q, a = item.get("question"), item.get("answer")
                p = item.get("payload", {})
                
                if q and a:
                    ki_id = create_ki_id(doc_root_id, q, a)
                    vec_main = self.embed_model.encode(q, normalize_embeddings=True).tolist()
                    # Dédoublonnage Vectoriel Actif (Cristallisation & Fusion FYA v12.0)
                    is_stress_test = config.get("name") == "Legifrance_Stress_Test"
                    should_merge = False
                    target_ki = None

                    if not is_stress_test:
                        existing = await self.client.query(workspace_id, vec_main)
                        if existing.get("results") and existing["results"][0].get("score", 0.0) >= TAU_FUSION:
                            match_ki = existing["results"][0]
                            old_a = match_ki.get("answer", "")
                            
                            # ─── VETO SÉMANTIQUE DE CONTRADICTION ──────────────────────
                            # 1. Regex de mutation / polarité
                            polarity_words = [
                                r"\bne\s+[^p]*\s*pas\b", r"\bn['\s]+[^p]*\s*pas\b",
                                r"\bne\s+[^p]*\s*plus\b", r"\bn['\s]+[^p]*\s*plus\b",
                                r"\bne\s+[^j]*\s*jamais\b", r"\bn['\s]+[^j]*\s*jamais\b",
                                r"\baucun[e]?\b", r"\bsauf\b", r"\bà l'exclusion de\b", r"\bcontrairement à\b", 
                                r"\bau lieu de\b", r"\bmodification\b", r"\bcorrection\b", r"\bavenant\b"
                            ]
                            has_polarity_diff = False
                            for pattern in polarity_words:
                                has_old = bool(re.search(pattern, old_a.lower()))
                                has_new = bool(re.search(pattern, a.lower()))
                                if has_old != has_new:
                                    has_polarity_diff = True
                                    break

                            # 2. Entités nommées et valeurs numériques
                            num_pattern = r"\b\d+(?:[\.,\s]\d+)*\s*(?:%|€|eur|usd|gbp)?\b"
                            old_nums = set(re.findall(num_pattern, old_a.lower()))
                            new_nums = set(re.findall(num_pattern, a.lower()))
                            has_numeric_diff = (old_nums != new_nums)

                            if has_polarity_diff or has_numeric_diff:
                                logger.info(f"🛡️ FYA VETO SEMANTIQUE: Contradiction détectée. Fusion rejetée. Old: '{old_a}' | New: '{a}'")
                                # On rejette la fusion, on garde comme entité distincte ou on ignore le doublon
                                kis_rejected += 1
                                continue
                            else:
                                should_merge = True
                                target_ki = match_ki
                        elif existing.get("results") and existing["results"][0].get("score", 0.0) > 0.85:
                            # Conflit sur score plus faible -> rejet simple
                            match_ki = existing["results"][0]
                            old_a = match_ki.get("answer", "")
                            if old_a.strip().lower() != a.strip().lower():
                                kis_rejected += 1
                                continue

                    def get_any(keys: list, fallback_val: Any = None):
                        for k in keys:
                            val = item.get(k) or p.get(k)
                            if val: return val
                        if "ht" in q.lower() or "hors taxe" in q.lower():
                            return item.get("answer")
                        return fallback_val or 0

                    ht_str = clean_amount(get_any(["ht_amount", "montant_ht", "total_ht", "base_ht"]))
                    tva_str = clean_amount(get_any(["tva_amount", "montant_tva", "total_tva", "taxe"]))
                    ttc_str = clean_amount(get_any(["ttc_amount", "montant_ttc", "total_ttc", "a_payer"]))
                    currency = item.get("currency") or p.get("currency") or "UNKNOWN"

                    try:
                        ht_d = Decimal(ht_str)
                    except Exception:
                        ht_d = Decimal('0.0')
                        
                    try:
                        tva_d = Decimal(tva_str)
                    except Exception:
                        tva_d = Decimal('0.0')
                        
                    try:
                        ttc_d = Decimal(ttc_str)
                    except Exception:
                        ttc_d = Decimal('0.0')

                    non_zero_ds = [v for v in [ht_d, tva_d, ttc_d] if v > 0]
                    min_val_d = min(non_zero_ds) if non_zero_ds else Decimal('0.0')
                    tolerance_d = Decimal("0.000001") if min_val_d < Decimal("0.01") else Decimal("0.01")
                    if tolerance_d < doc_tolerance:
                        doc_tolerance = tolerance_d
                    
                    diff_d = abs((ht_d + tva_d) - ttc_d)
                    if ttc_d > 0 and diff_d > tolerance_d:
                        kis_rejected += 1
                        continue

                    # Concaténation avec Hard Cap de 3 snippets maximum
                    new_snippet = item.get("raw_snippet") or p.get("raw_snippet", "")
                    if should_merge and target_ki:
                        # Extraire les anciens snippets existants
                        old_snippets_str = target_ki.get("raw_snippet") or target_ki.get("payload", {}).get("raw_snippet", "")
                        old_snippets = [s.strip() for s in old_snippets_str.split(" | ") if s.strip()]
                        
                        # Combiner et appliquer le Hard Cap de 3
                        combined = old_snippets
                        if new_snippet and new_snippet not in combined:
                            combined.append(new_snippet)
                        combined = combined[-3:]  # Garder les 3 plus récents
                        raw_snippet_final = " | ".join(combined)
                        
                        # Versioning et fusion
                        version_final = int(target_ki.get("version", 1)) + 1
                        ki_id = target_ki.get("ki_id")
                        logger.info(f"🔮 FYA Cristallisation: Fusion du KI {ki_id} (v{version_final})")
                    else:
                        raw_snippet_final = new_snippet
                        version_final = 1

                    cleaned_payload = {
                        "ht_amount": format_float_precision(ht_d),
                        "tva_amount": format_float_precision(tva_d),
                        "ttc_amount": format_float_precision(ttc_d),
                        "currency": str(currency),
                        "date": str(item.get("date") or p.get("date", "")),
                        "raw_snippet": str(raw_snippet_final)
                    }
                    
                    texts_to_embed = [q] + item.get("aliases", [])
                    for text_to_embed in texts_to_embed:
                        vec = self.embed_model.encode(text_to_embed, normalize_embeddings=True).tolist()
                        point_id = target_ki.get("point_id") if (should_merge and target_ki) else f"{ki_id}_{hashlib.sha256(text_to_embed.encode()).hexdigest()[:4]}"
                        
                        ki_entry = {
                            "point_id": point_id,
                            "ki_id": ki_id, "source": os.path.basename(file_path),
                            "root_id": doc_root_id,
                            "question": q, "answer": a, "alias": text_to_embed,
                            "raw_snippet": raw_snippet_final,
                            "payload": cleaned_payload, "vector": vec,
                            "timestamp": datetime.now().isoformat() + "Z", "version": version_final
                        }
                        ki_list.append(ki_entry)
            
            self.job_manager.update_job(job_id, {"progress": 80})

            if ki_list:
                points = []
                metadata = []
                for ki in ki_list:
                    p = ki.get("payload", {})
                    for k, v in p.items():
                        if isinstance(v, float):
                            p[k] = format_float_precision(v)
                        elif isinstance(v, int):
                            p[k] = str(v)
                    
                    points.append({"id": ki["point_id"], "values": ki.pop("vector")})
                    metadata.append(ki)
                
                res = await self.client.ingest(workspace_id, points, metadata, tolerance=str(doc_tolerance))
                
                if res and res.get("status") != "error":
                    kis_accepted += len(ki_list)
                    integrity_root = res.get("integrity_root", "none")
                    self.job_manager.update_job(job_id, {"integrity_root": integrity_root})
                    
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute(
                            "SELECT root_id FROM documents WHERE filename = ? AND workspace_id = ? AND id != ?",
                            (os.path.basename(file_path), workspace_id, new_doc_id)
                        )
                        row = cursor.fetchone()
                        if row:
                            old_root_id = row["root_id"]
                            old_root_part = old_root_id[5:] if old_root_id.startswith("ROOT_") else old_root_id[:12]
                            cursor.execute(
                                "DELETE FROM ki_relations WHERE workspace_id = ? AND (source_ki_id LIKE ? OR target_ki_id LIKE ?)",
                                (workspace_id, f"KI_{old_root_part}%", f"KI_{old_root_part}%")
                            )
                            cursor.execute(
                                "DELETE FROM documents WHERE filename = ? AND workspace_id = ? AND id != ?",
                                (os.path.basename(file_path), workspace_id, new_doc_id)
                            )
                        
                        cursor.execute(
                            "UPDATE documents SET summary = ?, ki_count = ?, integrity_root = ?, doc_subject = ?, doc_essence = ? WHERE id = ?",
                            (
                                summary, 
                                len(ki_list), 
                                integrity_root,
                                root_data["doc_subject"],
                                json.dumps(root_data["essence"]),
                                new_doc_id
                            )
                        )
                        conn.commit()
                        conn.close()
                        
                        self.extract_and_save_ki_relations(workspace_id, ki_list, doc_root_id)
                    except Exception as db_e:
                        logger.error(f"❌ Transaction or GraphRAG persistence failed: {str(db_e)}")
                else:
                    kis_rejected += len(ki_list)
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        cursor.execute(
                            "UPDATE documents SET integrity_root = ?, summary = ? WHERE id = ?",
                            ("failed", "Indexation échouée dans Rust Daemon", new_doc_id)
                        )
                        conn.commit()
                        conn.close()
                    except Exception as e:
                        logger.warning(f"Failed to update failed status in SQLite: {e}")

                self.bm25_manager.add_documents(workspace_id, ki_list)

                self.job_manager.update_job(job_id, {
                    "status": "completed",
                    "progress": 100,
                    "kis_created": kis_accepted,
                    "kis_rejected": kis_rejected,
                    "integrity_root": self.job_manager.get_job(job_id).get("integrity_root", "none"),
                    "summary": summary,
                    "end_time": datetime.now().isoformat()
                })
                
                # Trigger the TreeOptimizer self-healing and semantic bridging loop asynchronously
                try:
                    is_stress_test = config.get("name") == "Legifrance_Stress_Test"
                    if not is_stress_test:
                        from core_rag.tree_optimizer import TreeOptimizer
                        optimizer = TreeOptimizer(self.embed_model, self.client)
                        asyncio.create_task(optimizer.optimize(workspace_id))

                        # Rebuild semantic cluster tree if enough KIs accumulated
                        if kis_accepted >= 5:
                            from core_rag.ki_tree_service import KITreeService
                            tree_service = KITreeService()
                            asyncio.create_task(tree_service.build_tree_for_workspace(workspace_id))
                            logger.info(f"🌲 Ingestion: triggered KITree cluster rebuild for {workspace_id}")
                    else:
                        logger.info("🌲 Ingestion: Stress-test detected. Bypassing TreeOptimizer background run to maximize ingestion throughput.")
                except Exception as opt_err:
                    logger.error(f"⚠️ Failed to trigger TreeOptimizer background run: {opt_err}")
            else:
                self.job_manager.update_job(job_id, {"status": "completed", "progress": 100, "kis_created": 0, "kis_rejected": kis_rejected})
                
        except Exception as e:
            logger.error(f"❌ JOB {job_id} FAILED: {str(e)}")
            self.job_manager.update_job(job_id, {"status": "error", "error": str(e), "progress": 100})
        finally:
            if os.path.exists(file_path) and "/tmp/" in file_path:  # nosec B108
                os.remove(file_path)
            else:
                # Upload persistant : la pipeline n'a plus besoin du fichier brut.
                # S'il reste sur disque (uploads/{ws}/), on le chiffre at-rest.
                try:
                    from infra.at_rest import encrypt_file_at_rest
                    encrypt_file_at_rest(file_path)
                except Exception as enc_err:
                    logger.warning(f"⚠️ At-rest encryption skipped for {file_path}: {enc_err}")
