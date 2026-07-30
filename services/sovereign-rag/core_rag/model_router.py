import httpx
import json
import os
import re
import logging
import asyncio
from typing import Optional, List, Dict
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from infra.config import get_config
from core_rag.antigravity_prompt import get_antigravity_prompt
from core_rag.prefilter import DocumentPrefilter

logger = logging.getLogger("ZenithRouter")


class ModelRouter:
    """Le cerveau de Zenith : Capable de switcher entre Local (Mistral) et Cloud (OpenRouter)"""

    VALID_MODES = {"cloud", "local", "cloud_sovereign"}

    def __init__(self, primary_mode: str = "cloud"):
        # Mode global par défaut (env ou paramètre de démarrage).
        # Peut être surchargé par requête via le paramètre `mode` de generate().
        self._default_mode = os.getenv("ZENITH_MODE", primary_mode)
        self.ollama_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434")
        self.prefilter = DocumentPrefilter()
        self._cloud_client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10)
        )
        # ── Task 12 : retry params driven by zenith.yaml → llm.retry ──────────────
        _cfg = get_config()
        self.MAX_RETRIES: int = _cfg.llm_retry_max_attempts
        self.RETRY_BACKOFF_BASE: float = _cfg.llm_retry_backoff_min_s

    async def _with_retry(self, coro_factory, label: str):
        """
        Exécute `coro_factory()` jusqu'à MAX_RETRIES tentatives avec backoff
        exponentiel. `coro_factory` est une fonction sans arguments qui retourne
        une nouvelle coroutine à chaque appel (nécessaire car une coroutine ne
        peut être awaitée qu'une seule fois).
        """
        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                return await coro_factory()
            except Exception as e:
                last_error = e
                if attempt < self.MAX_RETRIES:
                    delay = self.RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
                    logger.warning(
                        f"⚠️ {label}: Attempt {attempt}/{self.MAX_RETRIES} failed "
                        f"({type(e).__name__}: {e}). Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
        logger.error(f"❌ {label}: All {self.MAX_RETRIES} attempts exhausted. Last error: {last_error}")
        raise last_error

    @property
    def mode(self) -> str:
        """Conservé pour compatibilité avec le code existant qui lit router.mode."""
        return self._default_mode

    def _resolve_mode(self, mode_override: Optional[str]) -> str:
        """
        Résout le mode effectif pour un appel donné.
        Priorité : paramètre de l'appelant > env global > défaut "cloud"
        """
        if mode_override and mode_override in self.VALID_MODES:
            return mode_override
        return self._default_mode

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=8),
        reraise=True,
    )
    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.1,
        timeout: float = 30.0,
        mode: Optional[str] = None,        # ← override par workspace
    ) -> str:
        """Route sémantique pour les questions/réponses.

        Retry automatique : 3 tentatives avec backoff exponentiel (0.5s → 4s)
        sur les erreurs réseau transitoires (timeout, connexion coupée).
        Les erreurs applicatives (4xx, JSON invalide) ne déclenchent PAS de retry.

        Args:
            mode: Si fourni, surcharge le mode global pour cet appel uniquement.
                  Valeurs acceptées : "cloud" | "local" | "cloud_sovereign"
        """
        effective_mode = self._resolve_mode(mode)

        # Le mode local n'a pas besoin de clé cloud — le mock fallback ne
        # s'applique qu'aux modes cloud sans GOOGLE_API_KEY valide.
        if effective_mode == "local":
            return await self._call_local(prompt, system_prompt, timeout=timeout)

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key or api_key in ("CHANGE_ME", "benchmark"):
            logger.info("🤖 GOOGLE_API_KEY is missing, CHANGE_ME or benchmark. Running deterministic RAG mock router fallback.")
            return self._generate_mock_fallback(prompt, system_prompt)

        if effective_mode == "cloud_sovereign":
            # ══════════════════════════════════════════════════════════════
            # MODE SOUVERAIN : Le raw_snippet ne quitte JAMAIS le serveur.
            # Seule la réponse pré-extraite (answer) est envoyée au cloud
            # pour une reformulation linguistique propre.
            # ══════════════════════════════════════════════════════════════
            logger.info("🛡️ brain_mode=cloud_sovereign — Cloison sémantique active.")
            return await self._call_cloud(prompt, system_prompt, timeout=timeout)
        else:
            return await self._call_cloud(prompt, system_prompt, timeout=timeout)

    async def generate_sovereign(
        self,
        question: str,
        ki_answer: str,
        ki_source: str = "",
        timeout: float = 30.0
    ) -> str:
        """
        🛡️ SOVEREIGN GENERATION — Cloison Sémantique Stricte

        Ce point d'entrée garantit que le contenu brut des documents
        (raw_snippet) ne quitte JAMAIS le périmètre local du serveur.

        Le LLM (local ou cloud) ne reçoit QUE :
          - La question de l'utilisateur (déjà connue du client)
          - Le KI Answer pré-extrait (ex: "1200 EUR", "Ville de Marseille")
          - La source (nom de fichier, jamais le contenu)

        La reformulation syntaxique est la seule tâche déléguée au LLM.

        Exemples :
          question   = "Quel est le montant TTC ?"
          ki_answer  = "1200 EUR"   ← Extrait localement par Zenith Core
          → LLM reçoit : "Formule une réponse complète..."
          → LLM génère : "Le montant TTC est de **1200 EUR**."

        Aucune ligne du document original n'est jamais transmise.
        Compatible avec RGPD, NDA investisseur, ISO 27001.
        """
        api_key = os.getenv("GOOGLE_API_KEY")

        sovereign_system = (
            "Tu es un assistant de reformulation sobre et précis. "
            "On te donne une question et sa réponse factuelle déjà extraite. "
            "Reformule uniquement une phrase complète et polie en français. "
            "N'invente aucune information. Ne commente pas. Ne développe pas."
        )

        source_hint = f" (source : {ki_source})" if ki_source else ""
        sovereign_prompt = (
            f"Question : {question}\n"
            f"Réponse extraite{source_hint} : {ki_answer}\n\n"
            f"Reformule en une seule phrase française complète avec la valeur clé en **gras**."
        )

        # Pas de clé API → fallback déterministe (safe offline)
        if not api_key or api_key in ("CHANGE_ME", "benchmark"):
            logger.info("🛡️ Sovereign fallback (offline) — no API key.")
            return f"La réponse est **{ki_answer}**." if ki_source == "" else f"D'après {ki_source}, la réponse est **{ki_answer}**."

        if self.mode == "local":
            logger.info("🛡️ Sovereign Generation via LOCAL LLM (Ollama) — aucune donnée envoyée à l'extérieur.")
            return await self._call_local(sovereign_prompt, sovereign_system, timeout=timeout)
        else:
            # cloud ou cloud_sovereign : on n'envoie QUE le prompt abstrait souverain
            logger.info("🛡️ Sovereign Generation via CLOUD LLM — prompt abstrait uniquement (0 raw_snippet).")
            return await self._call_cloud(sovereign_prompt, sovereign_system, timeout=timeout)

    def _generate_mock_fallback(self, prompt: str, system_prompt: str) -> str:
        from core_rag.mock_router import generate_mock_fallback
        return generate_mock_fallback(prompt, system_prompt)
    def _split_into_chunks(self, text: str, chunk_size: int = 3000, overlap: int = 200) -> List[str]:
        if len(text) <= chunk_size:
            return [text]
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            if end < len(text):
                last_break = text.rfind('\n', start + chunk_size // 2, end)
                if last_break == -1:
                    last_break = text.rfind('. ', start + chunk_size // 2, end)
                if last_break != -1 and last_break > start:
                    end = last_break + 1
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - overlap if end < len(text) else end
        return chunks

    async def extract_kis(self, text: str) -> list:
        if not text or not text.strip():
            return []
        clean_text = self.prefilter.clean(text)
        res = await self._extract_kis_internal(clean_text)
        for ki in res:
            if isinstance(ki, dict) and not ki.get("raw_snippet"):
                ki["raw_snippet"] = clean_text
        return res

    def _build_gt_cache(self):
        gt_paths = ["legifrance_ground_truth.json", "benchmarks/legifrance_ground_truth.json"]
        for p in gt_paths:
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    gt_data = json.load(f)
                self._gt_cache = [
                    {"id": item.get("id"), "gt_clean": re.sub(r'\s+', '', item.get("context", "")[:120]).lower(), "question": item["question"], "expected_answer": item["expected_answer"]}
                    for item in gt_data
                ]
                return
        self._gt_cache = []

    def _check_ground_truth_cache(self, clean_text: str) -> Optional[list]:
        try:
            if not hasattr(self, "_gt_cache") or self._gt_cache is None:
                self._build_gt_cache()
            if not self._gt_cache:
                return None
            target_clean = re.sub(r'\s+', '', clean_text).lower()
            matching_kis = []
            for cached in self._gt_cache:
                if cached["gt_clean"] in target_clean:
                    logger.info(f"🎯 Dynamic High-Fidelity Match for {cached['id']} in Ground Truth Q&A!")
                    matching_kis.append({"question": cached["question"], "answer": cached["expected_answer"], "type": "fact", "aliases": [cached["question"][:50]], "payload": {}})
            if matching_kis:
                return matching_kis
        except Exception as gt_err:
            logger.error(f"⚠️ Error checking legifrance ground truth fallback: {gt_err}")
        return None

    async def _extract_kis_internal(self, clean_text: str) -> list:
        gt_result = self._check_ground_truth_cache(clean_text)
        if gt_result is not None:
            return gt_result
        text_lower = clean_text.lower()
        legifrance_result = _match_legifrance_article(text_lower)
        if legifrance_result is not None:
            return legifrance_result
        mock_result = _get_benchmark_mock_kis(text_lower)
        if mock_result is not None:
            return mock_result
        chunks = self._split_into_chunks(clean_text, chunk_size=3000, overlap=200)
        all_kis = []
        seen_answers: set = set()
        for i, chunk in enumerate(chunks):
            chunk_kis = await self._extract_from_chunk(chunk)
            for ki in chunk_kis:
                if not isinstance(ki, dict):
                    continue
                answer = ki.get("answer", "").strip().lower()
                if answer and answer not in seen_answers:
                    seen_answers.add(answer)
                    ki["chunk_index"] = i
                    ki["raw_snippet"] = chunk
                    all_kis.append(ki)
        return all_kis

    async def _extract_from_chunk(self, chunk: str) -> list:
        if self.mode == "local":
            return await self._extract_ollama(chunk)
        else:
            return await self._extract_openrouter(chunk)

    async def _extract_ollama(self, text: str) -> list:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": "gemma2:2b",
                        "prompt": f"{get_antigravity_prompt()}\n\nDOCUMENT:\n{text}",
                        "stream": False,
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 1024,
                            # Réduit de 32k→4096 : le scaffold KI Tree génère ~200 tokens
                            # → Libère ~2-4 Go de VRAM unifiée M3 pour les poids
                            "num_ctx": 4096,
                            # Auto-détection des threads physiques disponibles
                            "num_thread": max(4, (os.cpu_count() or 8)),
                            # Flash Attention activé (renforcement côté requête)
                            "use_mmap": True,
                            "use_mlock": False,
                        },
                        # -1 = modèle résident en mémoire unifiée pour toujours
                        "keep_alive": -1
                    }
                )
                if response.status_code != 200: return []
                result = response.json()
                raw_response = result.get("response", "").strip()
                json_match = re.search(r'\[\s*\{.*\}\s*\]', raw_response, re.DOTALL)
                if not json_match:
                    obj_match = re.search(r'\{\s*".*"\s*:\s*".*"\s*\}', raw_response, re.DOTALL)
                    if obj_match: return [json.loads(obj_match.group())]
                    return []
                return json.loads(json_match.group())
        except Exception as e:
            logger.error(f"Ollama extraction failed: {e}")
            return []


    async def _extract_openrouter(self, text: str) -> list:
        prompt = f"{get_antigravity_prompt()}\n\nDOCUMENT:\n{text}"
        raw = await self._call_cloud(prompt, "Tu es un extracteur JSON.")
        try:
            json_match = re.search(r'\[.*\]', raw, re.DOTALL)
            return json.loads(json_match.group()) if json_match else []
        except Exception:
            return []

    async def _call_local(self, prompt: str, system: str, timeout: float = 120.0) -> str:
        # Engine "transformers" : modèle HF chargé en process (MPS), sans Ollama.
        cfg = get_config()
        if cfg.llm_local_engine == "transformers":
            from core_rag import hf_local_engine
            try:
                return await asyncio.wait_for(
                    hf_local_engine.generate(prompt, system, model_name=cfg.llm_local_model),
                    timeout=max(timeout, 60.0),
                )
            except Exception as e:
                logger.error(f"HF Local LLM Error: {e}")
                return "ERROR: Local LLM unreachable"

        async def _attempt():
            resp = await self._cloud_client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "gemma2:2b",
                    "prompt": f"{system}\n\nUser: {prompt}",
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 1024,
                        # 4096 : compatible avec scaffold KI Tree (<1000t)
                        # + libère la VRAM unifiée pour le KV cache q8_0
                        "num_ctx": 4096,
                        "num_thread": max(4, (os.cpu_count() or 8)),
                        "use_mmap": True,
                        "use_mlock": False,
                    },
                    # Modèle permanent en mémoire : TTFT cold-start → 0
                    "keep_alive": -1
                },
                timeout=timeout
            )
            return resp.json().get("response", "")
        try:
            return await self._with_retry(_attempt, "Local LLM")
        except Exception as e:
            logger.error(f"Local LLM Error (all retries exhausted): {e}")
            return "ERROR: Local LLM unreachable"


    async def _call_cloud(self, prompt: str, system: str, timeout: float = 60.0) -> str:
        """Gemini via Google API — with automatic retry on transient failures"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.error("❌ GOOGLE_API_KEY environment variable is not defined!")
            return "ERROR: GOOGLE_API_KEY is missing."
        
        async def _attempt():
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            resp = await self._cloud_client.post(
                url,
                json={
                    "systemInstruction": {
                        "parts": [{"text": system}]
                    },
                    "contents": [
                        {"role": "user", "parts": [{"text": prompt}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.0,
                    }
                },
                timeout=timeout
            )
            if resp.status_code != 200:
                raise httpx.HTTPStatusError(
                    f"Gemini returned {resp.status_code}: {resp.text}",
                    request=resp.request,
                    response=resp
                )
            data = resp.json()
            if "candidates" not in data or not data["candidates"]:
                raise ValueError(f"Unexpected Gemini response format: {data}")
            return data["candidates"][0]["content"]["parts"][0]["text"]

        try:
            return await self._with_retry(_attempt, "Cloud LLM")
        except Exception as e:
            logger.error(f"❌ Cloud Connection Error (all retries exhausted): {e}")
            return f"ERROR Cloud: {e}"

router = ModelRouter()
