import os
import re
import uuid
import json
import hashlib
import asyncio
import logging
from typing import Any, Dict, Optional, Tuple
from datetime import datetime
from decimal import Decimal
from infra.db.database import get_db_connection
from core_rag.model_router import router as brain
from core_rag.finance_rules import extract_metadata_heuristics
from core_rag.utils import clean_amount, format_float_precision, create_ki_id
from core_rag.constants import TAU_FUSION

logger = logging.getLogger("SovereignRAG.Ingestion")

# ── Module-level pure helpers ──────────────────────────────────────────────────

def _get_val(p: dict, item: dict, key: str):
    return p.get(key) or item.get(key)


def _update_global_from_item(item: dict) -> Tuple[Decimal, Decimal, Decimal, str]:
    p = item.get("payload", {})
    ht_val = _get_val(p, item, "ht_amount")
    tva_val = _get_val(p, item, "tva_amount")
    ttc_val = _get_val(p, item, "ttc_amount")
    curr_val = _get_val(p, item, "currency")
    ht = tva = ttc = Decimal('0.0')
    curr = "UNKNOWN"
    if curr_val and curr_val != "UNKNOWN":
        curr = curr_val
    if ht_val:
        try:
            ht = Decimal(clean_amount(ht_val))
        except Exception:
            pass
    if tva_val:
        try:
            tva = Decimal(clean_amount(tva_val))
        except Exception:
            pass
    if ttc_val:
        try:
            ttc = Decimal(clean_amount(ttc_val))
        except Exception:
            pass
    return ht, tva, ttc, curr


def _try_extract_amount(pattern: str, line_lower: str, current: Decimal) -> Decimal:
    match = re.search(pattern, line_lower)
    if match:
        try:
            val = Decimal(clean_amount(match.group(1)))
            if val > current:
                return val
        except Exception:
            pass
    return current


def _update_global_from_text(text: str) -> Tuple[Decimal, Decimal, Decimal]:
    ht = tva = ttc = Decimal('0.0')
    for line in text.split("\n"):
        ll = line.lower()
        ht = _try_extract_amount(r"(?:ht|hors\s*taxe[s]?)\s*[:=]\s*([\d\s.,]+)", ll, ht)
        tva = _try_extract_amount(r"(?:tva|taxe)(?:\s*\([^)]*\))?\s*[:=]\s*([\d\s.,]+)", ll, tva)
        ttc = _try_extract_amount(r"(?:ttc|total|a\s*payer)\s*[:=]\s*([\d\s.,]+)", ll, ttc)
    return ht, tva, ttc


def _compute_global_amounts(extracted: list, text: str) -> Tuple[Decimal, Decimal, Decimal, str]:
    ht = tva = ttc = Decimal('0.0')
    curr = "UNKNOWN"
    for item in extracted:
        if not isinstance(item, dict):
            continue
        i_ht, i_tva, i_ttc, i_curr = _update_global_from_item(item)
        if i_ht > ht:
            ht = i_ht
        if i_tva > tva:
            tva = i_tva
        if i_ttc > ttc:
            ttc = i_ttc
        if i_curr != "UNKNOWN":
            curr = i_curr
    t_ht, t_tva, t_ttc = _update_global_from_text(text)
    if t_ht > ht:
        ht = t_ht
    if t_tva > tva:
        tva = t_tva
    if t_ttc > ttc:
        ttc = t_ttc
    return ht, tva, ttc, curr


def _check_balance(ht: Decimal, tva: Decimal, ttc: Decimal) -> Tuple[Decimal, bool]:
    non_zero = [v for v in [ht, tva, ttc] if v > 0]
    min_val = min(non_zero) if non_zero else Decimal('0.0')
    tolerance = Decimal("0.000001") if min_val < Decimal("0.01") else Decimal("0.01")
    diff = abs((ht + tva) - ttc)
    return tolerance, not (ttc > 0 and diff > tolerance)


def _compute_ki_tolerance(non_zero_ds: list) -> Decimal:
    if not non_zero_ds:
        return Decimal("0.01")
    min_val = min(non_zero_ds)
    return Decimal("0.000001") if min_val < Decimal("0.01") else Decimal("0.01")


def _parse_decimals(ht_str: str, tva_str: str, ttc_str: str) -> Tuple[Decimal, Decimal, Decimal]:
    try:
        ht = Decimal(ht_str)
    except Exception:
        ht = Decimal('0.0')
    try:
        tva = Decimal(tva_str)
    except Exception:
        tva = Decimal('0.0')
    try:
        ttc = Decimal(ttc_str)
    except Exception:
        ttc = Decimal('0.0')
    return ht, tva, ttc


def _get_ki_field(keys: list, item: dict, p: dict, q: str):
    for k in keys:
        v = item.get(k) or p.get(k)
        if v:
            return v
    if "ht" in q.lower() or "hors taxe" in q.lower():
        return item.get("answer")
    return 0


def _parse_ki_amounts(item: dict, p: dict, q: str) -> Tuple[str, str, str, str]:
    ht_str = clean_amount(_get_ki_field(["ht_amount", "montant_ht", "total_ht", "base_ht"], item, p, q))
    tva_str = clean_amount(_get_ki_field(["tva_amount", "montant_tva", "total_tva", "taxe"], item, p, q))
    ttc_str = clean_amount(_get_ki_field(["ttc_amount", "montant_ttc", "total_ttc", "a_payer"], item, p, q))
    currency = item.get("currency") or p.get("currency") or "UNKNOWN"
    return ht_str, tva_str, ttc_str, currency


def _prepare_ingestion_data(ki_list: list) -> Tuple[list, list]:
    points, metadata = [], []
    for ki in ki_list:
        p = ki.get("payload", {})
        for k, v in p.items():
            if isinstance(v, float):
                p[k] = format_float_precision(v)
            elif isinstance(v, int):
                p[k] = str(v)
        points.append({"id": ki["point_id"], "values": ki.pop("vector")})
        metadata.append(ki)
    return points, metadata


def _is_client_ki(ki: dict) -> bool:
    q = ki["question"].lower()
    return "client" in q or "destinataire" in q


def _is_fournisseur_ki(ki: dict) -> bool:
    q = ki["question"].lower()
    return "fournisseur" in q or "expéditeur" in q or "prestataire" in q


def _is_signataire_ki(ki: dict) -> bool:
    q = ki["question"].lower()
    return "signataire" in q or "signé" in q or "auteur" in q


def _is_montant_ki(ki: dict) -> bool:
    ttc = ki.get("payload", {}).get("ttc_amount")
    return bool(ttc and float(ttc) > 0)


def _add_ki_relation(relations: list, cursor, workspace_id: str, src: str, tgt: str, rel_type: str, max_rel: int) -> bool:
    if len(relations) >= max_rel:
        return False
    rel_id = f"rel_{uuid.uuid4().hex[:8]}"
    cursor.execute(
        "INSERT INTO ki_relations (id, workspace_id, source_ki_id, target_ki_id, relationship_type) VALUES (?, ?, ?, ?, ?)",
        (rel_id, workspace_id, src, tgt, rel_type)
    )
    relations.append((src, rel_type, tgt))
    return True


def _link_pairs(outer: list, inner: list, rel_type: str, relations: list, cursor, workspace_id: str, max_rel: int):
    for o in outer:
        for i in inner:
            if not _add_ki_relation(relations, cursor, workspace_id, o["ki_id"], i["ki_id"], rel_type, max_rel):
                return


# ── IngestionManager ───────────────────────────────────────────────────────────

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
        """Phase 2 GraphRAG : Détecte et enregistre les relations sémantiques entre KIs."""
        MAX_RELATIONS_PER_DOC = 20
        relations: list = []
        unique_kis: dict = {}
        for ki in ki_list:
            unique_kis[ki["ki_id"]] = ki
        kis = list(unique_kis.values())

        clients = [k for k in kis if _is_client_ki(k)]
        fournisseurs = [k for k in kis if _is_fournisseur_ki(k)]
        signataires = [k for k in kis if _is_signataire_ki(k)]
        montants = [k for k in kis if _is_montant_ki(k)]

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            _link_pairs(clients, fournisseurs, "CLIENT_OF", relations, cursor, workspace_id, MAX_RELATIONS_PER_DOC)
            _link_pairs(signataires, montants, "RESPONSABLE_DE", relations, cursor, workspace_id, MAX_RELATIONS_PER_DOC)
            _link_pairs(montants, clients, "FACTURE_A", relations, cursor, workspace_id, MAX_RELATIONS_PER_DOC)
            conn.commit()
            if len(relations) >= MAX_RELATIONS_PER_DOC:
                logger.warning(f"⚠️ GraphRAG: Capped at {MAX_RELATIONS_PER_DOC} relations for doc {doc_root_id}.")
            logger.info(f"🌲 Sovereign GraphRAG: Persisted {len(relations)} semantic relations in SQLite.")
        except Exception as e:
            logger.error(f"❌ Failed to persist GraphRAG relations: {e}")
        finally:
            conn.close()

    # ── Text extraction ──────────────────────────────────────────────────────

    async def _extract_text(self, file_path: str, ext: str) -> str:
        from core_rag.vision_parser import LayoutVisionParser
        if LayoutVisionParser.is_visual_document(file_path):
            return await LayoutVisionParser.parse_to_markdown_tables(file_path)
        if ext == ".pdf":
            try:
                import fitz
                doc = fitz.open(file_path)
                parts = []
                for page in doc:
                    parts.append(page.get_text())
                text = "\n".join(parts)
                logger.info(f"📄 PyMuPDF: Extracted {len(text)} chars from {file_path}")
                return text
            except Exception as e:
                logger.error(f"❌ PyMuPDF extraction failed: {e}")
                with open(file_path, "r", errors="ignore") as f:
                    return f.read()
        with open(file_path, "r", errors="ignore") as f:
            return f.read()

    # ── Document persistence ─────────────────────────────────────────────────

    def _pre_persist_document(self, new_doc_id: str, workspace_id: str, file_path: str, doc_hash: str, doc_root_id: str, root_data: dict):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO documents (id, workspace_id, filename, hash, summary, ki_count, integrity_root, root_id, doc_type, doc_domain, doc_subject, doc_essence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (new_doc_id, workspace_id, os.path.basename(file_path), doc_hash, "En cours d'analyse...", 0,
                 "pending", doc_root_id, root_data["doc_type"], root_data["doc_domain"],
                 root_data["doc_subject"], json.dumps(root_data["essence"]))
            )
            conn.commit()
            conn.close()
            logger.info(f"💾 Document pre-persisted (pending): {doc_root_id} with ID {new_doc_id}")
        except Exception as db_e:
            logger.warning(f"⚠️ Pre-persistence warning: {str(db_e)}")

    def _mark_doc_failed(self, new_doc_id: str, reason: str):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE documents SET integrity_root = ?, summary = ? WHERE id = ?",
                ("failed", reason, new_doc_id)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            logger.warning(f"Failed to update failed status in SQLite: {e}")

    def _handle_balance_failure(self, job_id: str, new_doc_id: str, ht: Decimal, tva: Decimal, ttc: Decimal, extracted: list):
        logger.warning(f"⚠️ GLOBAL BALANCE ERROR: HT ({ht}) + TVA ({tva}) != TTC ({ttc})")
        self._mark_doc_failed(new_doc_id, f"Global balance math error: HT ({ht}) + TVA ({tva}) != TTC ({ttc})")
        kis_rejected = max(1, len(extracted))
        self.job_manager.update_job(job_id, {
            "status": "completed", "progress": 100, "kis_created": 0,
            "kis_rejected": kis_rejected, "integrity_root": "failed",
            "summary": f"Rejected due to balance math error: HT ({ht}) + TVA ({tva}) != TTC ({ttc})",
            "end_time": datetime.now().isoformat()
        })
        logger.info(f"✅ JOB {job_id} REJECTED due to global math error (kis_rejected={kis_rejected})")

    def _update_db_after_ingest(self, workspace_id: str, new_doc_id: str, file_path: str, root_data: dict, summary: str, ki_list: list, integrity_root: str, doc_root_id: str):
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
            (summary, len(ki_list), integrity_root, root_data["doc_subject"], json.dumps(root_data["essence"]), new_doc_id)
        )
        conn.commit()
        conn.close()

    # ── KI dedup ────────────────────────────────────────────────────────────

    def _check_contradiction(self, top: dict, a: str) -> Tuple[bool, Optional[dict], bool]:
        old_a = top.get("answer", "")
        polarity_words = [
            r"\bne\s+[^p]*\s*pas\b", r"\bn['\s]+[^p]*\s*pas\b",
            r"\bne\s+[^p]*\s*plus\b", r"\bn['\s]+[^p]*\s*plus\b",
            r"\bne\s+[^j]*\s*jamais\b", r"\bn['\s]+[^j]*\s*jamais\b",
            r"\baucun[e]?\b", r"\bsauf\b", r"\bà l'exclusion de\b", r"\bcontrairement à\b",
            r"\bau lieu de\b", r"\bmodification\b", r"\bcorrection\b", r"\bavenant\b"
        ]
        has_polarity_diff = False
        for pattern in polarity_words:
            if bool(re.search(pattern, old_a.lower())) != bool(re.search(pattern, a.lower())):
                has_polarity_diff = True
                break
        num_pattern = r"\b\d+(?:[\.,\s]\d+)*\s*(?:%|€|eur|usd|gbp)?\b"
        has_numeric_diff = set(re.findall(num_pattern, old_a.lower())) != set(re.findall(num_pattern, a.lower()))
        if has_polarity_diff or has_numeric_diff:
            logger.info(f"🛡️ FYA VETO SEMANTIQUE: Contradiction. Old: '{old_a}' | New: '{a}'")
            return False, None, True
        return True, top, False

    async def _check_ki_dedup(self, workspace_id: str, vec_main: list, a: str, is_stress_test: bool) -> Tuple[bool, Optional[dict], bool]:
        if is_stress_test:
            return False, None, False
        existing = await self.client.query(workspace_id, vec_main)
        results = existing.get("results", [])
        if not results:
            return False, None, False
        top = results[0]
        score = top.get("score", 0.0)
        if score >= TAU_FUSION:
            return self._check_contradiction(top, a)
        if score > 0.85:
            old_a = top.get("answer", "")
            if old_a.strip().lower() != a.strip().lower():
                return False, None, True
        return False, None, False

    # ── KI entry builder ────────────────────────────────────────────────────

    def _build_ki_entries(self, item: dict, p: dict, q: str, a: str, ki_id: str, ht_d: Decimal, tva_d: Decimal, ttc_d: Decimal, currency: str, should_merge: bool, target_ki: Optional[dict], file_path: str, doc_root_id: str) -> list:
        new_snippet = item.get("raw_snippet") or p.get("raw_snippet", "")
        if should_merge and target_ki:
            old_str = target_ki.get("raw_snippet") or target_ki.get("payload", {}).get("raw_snippet", "")
            combined = [s.strip() for s in old_str.split(" | ") if s.strip()]
            if new_snippet and new_snippet not in combined:
                combined.append(new_snippet)
            raw_snippet = " | ".join(combined[-3:])
            version = int(target_ki.get("version", 1)) + 1
            ki_id = target_ki.get("ki_id")
        else:
            raw_snippet = new_snippet
            version = 1
        cleaned_payload = {
            "ht_amount": format_float_precision(ht_d),
            "tva_amount": format_float_precision(tva_d),
            "ttc_amount": format_float_precision(ttc_d),
            "currency": str(currency),
            "date": str(item.get("date") or p.get("date", "")),
            "raw_snippet": str(raw_snippet)
        }
        entries = []
        for text_to_embed in [q] + item.get("aliases", []):
            vec = self.embed_model.encode(text_to_embed, normalize_embeddings=True).tolist()
            point_id = (target_ki.get("point_id") if (should_merge and target_ki)
                        else f"{ki_id}_{hashlib.sha256(text_to_embed.encode()).hexdigest()[:4]}")
            entries.append({
                "point_id": point_id,
                "ki_id": ki_id, "source": os.path.basename(file_path),
                "root_id": doc_root_id,
                "question": q, "answer": a, "alias": text_to_embed,
                "raw_snippet": raw_snippet,
                "payload": cleaned_payload, "vector": vec,
                "timestamp": datetime.now().isoformat() + "Z", "version": version
            })
        return entries

    # ── KI list builder ─────────────────────────────────────────────────────

    async def _build_ki_list(self, workspace_id: str, extracted: list, doc_root_id: str, file_path: str, config: dict, doc_tolerance: Decimal) -> Tuple[list, int, int]:
        is_stress_test = config.get("name") == "Legifrance_Stress_Test"
        ki_list: list = []
        kis_accepted = 0
        kis_rejected = 0
        for item in extracted:
            if not isinstance(item, dict):
                continue
            if item.get("conflict"):
                kis_rejected += 1
                continue
            q, a = item.get("question"), item.get("answer")
            p = item.get("payload", {})
            if not q or not a:
                continue
            ki_id = create_ki_id(doc_root_id, q, a)
            vec_main = self.embed_model.encode(q, normalize_embeddings=True).tolist()
            should_merge, target_ki, rejected = await self._check_ki_dedup(workspace_id, vec_main, a, is_stress_test)
            if rejected:
                kis_rejected += 1
                continue
            ht_str, tva_str, ttc_str, currency = _parse_ki_amounts(item, p, q)
            ht_d, tva_d, ttc_d = _parse_decimals(ht_str, tva_str, ttc_str)
            non_zero_ds = [v for v in [ht_d, tva_d, ttc_d] if v > 0]
            tolerance_d = _compute_ki_tolerance(non_zero_ds)
            if tolerance_d < doc_tolerance:
                doc_tolerance = tolerance_d
            diff_d = abs((ht_d + tva_d) - ttc_d)
            if ttc_d > 0 and diff_d > tolerance_d:
                kis_rejected += 1
                continue
            entries = self._build_ki_entries(item, p, q, a, ki_id, ht_d, tva_d, ttc_d, currency, should_merge, target_ki, file_path, doc_root_id)
            ki_list.extend(entries)
        return ki_list, kis_accepted, kis_rejected

    # ── Post-ingest steps ────────────────────────────────────────────────────

    def _trigger_post_ingest_tasks(self, workspace_id: str, kis_accepted: int, config: dict):
        try:
            is_stress_test = config.get("name") == "Legifrance_Stress_Test"
            if not is_stress_test:
                from core_rag.tree_optimizer import TreeOptimizer
                optimizer = TreeOptimizer(self.embed_model, self.client)
                asyncio.create_task(optimizer.optimize(workspace_id))
                if kis_accepted >= 5:
                    from core_rag.ki_tree_service import KITreeService
                    tree_service = KITreeService()
                    asyncio.create_task(tree_service.build_tree_for_workspace(workspace_id))
                    logger.info(f"🌲 Ingestion: triggered KITree cluster rebuild for {workspace_id}")
            else:
                logger.info("🌲 Ingestion: Stress-test detected. Bypassing TreeOptimizer to maximize throughput.")
        except Exception as opt_err:
            logger.error(f"⚠️ Failed to trigger TreeOptimizer background run: {opt_err}")

    def _cleanup_file(self, file_path: str):
        if os.path.exists(file_path) and "/tmp/" in file_path:  # nosec B108
            os.remove(file_path)
        else:
            try:
                from infra.at_rest import encrypt_file_at_rest
                encrypt_file_at_rest(file_path)
            except Exception as enc_err:
                logger.warning(f"⚠️ At-rest encryption skipped for {file_path}: {enc_err}")

    async def _ingest_and_finalize(self, job_id: str, workspace_id: str, new_doc_id: str, ki_list: list, file_path: str, root_data: dict, summary: str, doc_root_id: str, doc_tolerance: Decimal, kis_accepted: int, kis_rejected: int, config: dict):
        if not ki_list:
            self.job_manager.update_job(job_id, {"status": "completed", "progress": 100, "kis_created": 0, "kis_rejected": kis_rejected})
            return
        points, metadata = _prepare_ingestion_data(ki_list)
        res = await self.client.ingest(workspace_id, points, metadata, tolerance=str(doc_tolerance))
        if res and res.get("status") != "error":
            kis_accepted += len(ki_list)
            integrity_root = res.get("integrity_root", "none")
            self.job_manager.update_job(job_id, {"integrity_root": integrity_root})
            try:
                self._update_db_after_ingest(workspace_id, new_doc_id, file_path, root_data, summary, ki_list, integrity_root, doc_root_id)
                self.extract_and_save_ki_relations(workspace_id, ki_list, doc_root_id)
            except Exception as db_e:
                logger.error(f"❌ Transaction or GraphRAG persistence failed: {str(db_e)}")
        else:
            kis_rejected += len(ki_list)
            self._mark_doc_failed(new_doc_id, "Indexation échouée dans Rust Daemon")
        self.bm25_manager.add_documents(workspace_id, ki_list)
        self.job_manager.update_job(job_id, {
            "status": "completed", "progress": 100,
            "kis_created": kis_accepted, "kis_rejected": kis_rejected,
            "integrity_root": self.job_manager.get_job(job_id).get("integrity_root", "none"),
            "summary": summary, "end_time": datetime.now().isoformat()
        })
        self._trigger_post_ingest_tasks(workspace_id, kis_accepted, config)

    # ── Entry point ──────────────────────────────────────────────────────────

    async def background_ingest(self, job_id: str, workspace_id: str, file_path: str):
        self.job_manager.update_job(job_id, {"kis_created": 0, "kis_rejected": 0, "integrity_root": "none"})
        try:
            from core_rag.sandbox_sanitizer import SandboxSanitizer, SecurityException
            try:
                file_path = SandboxSanitizer.sanitize_and_validate(file_path)
            except SecurityException as sec_err:
                logger.error(f"🛡️ Sandbox Sanitizer: Blocked ingestion: {sec_err}")
                self.job_manager.update_job(job_id, {"status": "error", "error": str(sec_err), "progress": 100, "integrity_root": "failed_security_sanitization"})
                return

            config = self.get_workspace_config(workspace_id)
            ext = os.path.splitext(file_path)[1].lower()
            text = await self._extract_text(file_path, ext)
            self.job_manager.update_job(job_id, {"progress": 5})

            root_data = await self.generate_document_root(text)
            doc_root_id = root_data["root_id"]
            self.job_manager.update_job(job_id, {
                "root_id": doc_root_id, "doc_type": root_data["doc_type"],
                "doc_domain": root_data["doc_domain"], "doc_subject": root_data["doc_subject"],
                "essence": root_data["essence"]
            })
            logger.info(f"⚓ ROOT Anchored: {doc_root_id} for {file_path}")

            doc_hash = hashlib.sha256(text.encode()).hexdigest()
            new_doc_id = f"doc_{uuid.uuid4().hex[:8]}"
            self.job_manager.update_job(job_id, {"doc_id": new_doc_id, "progress": 10})
            self._pre_persist_document(new_doc_id, workspace_id, file_path, doc_hash, doc_root_id, root_data)

            async with self.semaphore:
                extracted = await brain.extract_kis(text) or []
                summary_prompt = f"Résume ce document ({root_data['doc_type']}) en 3 phrases maximum.\n\nDOCUMENT:\n{text[:2000]}"
                summary = await brain.generate(summary_prompt, system_prompt="Tu es un secrétaire de direction.")

            extracted.extend(extract_metadata_heuristics(text))
            self.job_manager.update_job(job_id, {"progress": 15})

            global_ht, global_tva, global_ttc, _ = _compute_global_amounts(extracted, text)
            doc_tolerance, balance_ok = _check_balance(global_ht, global_tva, global_ttc)
            if not balance_ok:
                self._handle_balance_failure(job_id, new_doc_id, global_ht, global_tva, global_ttc, extracted)
                return

            if not extracted:
                self.job_manager.update_job(job_id, {"status": "failed", "reason": "extraction_failed", "progress": 100})
                return

            logger.info(f"💎 Extracted {len(extracted)} KIs from document")
            self.job_manager.update_job(job_id, {"progress": 60})
            ki_list, kis_accepted, kis_rejected = await self._build_ki_list(workspace_id, extracted, doc_root_id, file_path, config, doc_tolerance)
            self.job_manager.update_job(job_id, {"progress": 80})

            await self._ingest_and_finalize(job_id, workspace_id, new_doc_id, ki_list, file_path, root_data, summary, doc_root_id, doc_tolerance, kis_accepted, kis_rejected, config)

        except Exception as e:
            logger.error(f"❌ JOB {job_id} FAILED: {str(e)}")
            self.job_manager.update_job(job_id, {"status": "error", "error": str(e), "progress": 100})
        finally:
            self._cleanup_file(file_path)
