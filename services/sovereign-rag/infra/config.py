"""
app/core/config.py — Chargeur de configuration Zenith

Charge zenith.yaml + hardware_profiles.yaml et expose une dataclass
ZenithConfig consommée par le reste de l'application.

Usage :
    from infra.config import get_config
    cfg = get_config()
    print(cfg.embed_device)  # "mps"
    print(cfg.max_concurrent_ingestions)  # 6
"""

from __future__ import annotations

import logging
import os
import platform
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Optional

logger = logging.getLogger("Zenith.Config")


# ─── Dataclass de configuration ───────────────────────────────────────────────

@dataclass
class ZenithConfig:
    # Déploiement
    deployment_mode: str = "api_server"       # api_server | on_premise | air_gap
    tenant_model: str = "multi"
    host: str = "0.0.0.0"
    port: int = 8000
    gunicorn_workers: int = 4

    # LLM
    llm_primary_backend: str = "cloud"        # cloud | local | cloud_sovereign
    llm_local_engine: str = "ollama"
    llm_local_model: str = "gemma2:2b"
    llm_local_url: str = "http://localhost:11434"
    llm_local_num_thread: int = 8
    llm_local_num_ctx: int = 4096
    llm_cloud_model: str = "gemini-2.5-flash"
    llm_cloud_timeout_s: float = 30.0
    llm_retry_max_attempts: int = 3
    llm_retry_backoff_min_s: float = 0.5
    llm_retry_backoff_max_s: float = 8.0
    deep_analysis_enabled: bool = True

    # Hardware
    hardware_profile: str = "cpu_only"
    embed_device: str = "cpu"
    embed_batch_size: int = 16
    max_concurrent_ingestions: int = 2

    # Embedding & Reranking
    embed_model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"
    rerank_enabled: bool = False
    rerank_model_name: str = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"
    rerank_top_k: int = 5
    rerank_candidates: int = 20

    # Sécurité
    encryption_enabled: bool = False
    rate_limit_rpm: int = 100
    rate_limit_burst: int = 100

    # RAG
    veto_default_threshold: float = 0.65
    veto_max_candidates: int = 3
    crystallizer_enabled_default: bool = True
    crystallizer_min_score: float = 0.60
    crystallizer_min_answer_len: int = 20
    crystallizer_tau_fusion: float = 0.75
    ki_aliases_per_question: int = 10
    query_expansion_variants: int = 3
    default_ruleset: str = "finance_fr"
    graphrag_max_relations: int = 20

    # Logging
    log_level: str = "INFO"
    log_max_file_mb: int = 50
    log_backup_count: int = 5
    log_structured_json: bool = False


# ─── Auto-détection du profil hardware ────────────────────────────────────────

def _detect_hardware_profile() -> str:
    """Détecte le profil hardware optimal selon la plateforme."""
    system = platform.system()
    machine = platform.machine()

    if system == "Darwin" and machine == "arm64":
        # Apple Silicon — distinguer M2 Ultra des autres
        try:
            import subprocess
            result = subprocess.run(
                ["sysctl", "-n", "hw.memsize"],
                capture_output=True, text=True, timeout=2
            )
            mem_bytes = int(result.stdout.strip())
            mem_gb = mem_bytes / (1024 ** 3)
            if mem_gb >= 128:
                return "mac_studio_m2_ultra"
            else:
                return "mac_mini_m4"
        except Exception:
            return "mac_mini_m4"

    if system == "Linux":
        try:
            import subprocess
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                capture_output=True, text=True, timeout=3
            )
            if result.returncode == 0 and result.stdout.strip():
                return "linux_gpu"
        except Exception:
            pass
        return "cpu_only"

    return "cpu_only"


# ─── Chargement ───────────────────────────────────────────────────────────────

def _load_yaml_safe(path: Path) -> dict:
    """Charge un fichier YAML. Retourne {} si absent ou erreur."""
    try:
        import yaml  # type: ignore
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        logger.warning("PyYAML non installé — config YAML ignorée. pip install pyyaml")
        return {}
    except FileNotFoundError:
        logger.debug(f"Fichier config absent : {path}")
        return {}
    except Exception as e:
        logger.error(f"Erreur lecture {path} : {e}")
        return {}


@lru_cache(maxsize=1)
def get_config() -> ZenithConfig:
    """
    Charge et retourne la configuration Zenith.
    Ordre de priorité :
      1. Variables d'environnement (ZENITH_* prefix)
      2. zenith.yaml
      3. hardware_profiles.yaml (profil auto-détecté ou forcé)
      4. Valeurs par défaut de ZenithConfig
    """
    # Chemins relatifs au fichier de démarrage du serveur
    base_dir = Path(os.getenv("ZENITH_CONFIG_DIR", "."))
    raw = _load_yaml_safe(base_dir / "zenith.yaml")
    hw_profiles = _load_yaml_safe(base_dir / "hardware_profiles.yaml")

    # ── Résolution du profil hardware ──────────────────────────────────────
    hw_section = raw.get("hardware", {})
    profile_name = hw_section.get("profile", "auto")
    if profile_name == "auto":
        profile_name = _detect_hardware_profile()
        logger.info(f"🖥️  Hardware auto-détecté : {profile_name}")
    else:
        logger.info(f"🖥️  Hardware profile forcé : {profile_name}")

    hw = dict(hw_profiles.get(profile_name, {}))
    # Les overrides manuels écrasent le profil
    hw.update(hw_section.get("overrides") or {})

    # ── Construction de la config ───────────────────────────────────────────
    dep     = raw.get("deployment", {})
    llm     = raw.get("llm", {})
    llm_p   = llm.get("primary", {})
    llm_l   = llm_p.get("local", {})
    llm_c   = llm_p.get("cloud", {})
    llm_r   = llm.get("retry", {})
    llm_d   = llm.get("deep_analysis", {})
    sec     = raw.get("security", {})
    rag     = raw.get("rag", {})
    veto    = rag.get("veto", {})
    cryst   = rag.get("crystallizer", {})
    aliases = rag.get("aliases", {})
    dom     = rag.get("domain_rules", {})
    grag    = rag.get("graphrag", {})
    log_cfg = raw.get("logging", {})

    cfg = ZenithConfig(
        # Déploiement
        deployment_mode  = dep.get("mode", "api_server"),
        tenant_model     = dep.get("tenant_model", "multi"),
        host             = dep.get("host", "0.0.0.0"),
        port             = int(dep.get("port", 8000)),
        gunicorn_workers = hw.get("gunicorn_workers", dep.get("workers", 4)),

        # LLM
        llm_primary_backend     = llm_p.get("backend", "cloud"),
        llm_local_engine        = llm_l.get("engine", "ollama"),
        llm_local_model         = llm_l.get("model", "gemma2:2b"),
        llm_local_url           = llm_l.get("url", "http://localhost:11434"),
        llm_local_num_thread    = hw.get("ollama_num_thread", llm_l.get("num_thread", 8)),
        llm_local_num_ctx       = hw.get("ollama_num_ctx", llm_l.get("num_ctx", 4096)),
        llm_cloud_model         = llm_c.get("model", "gemini-2.5-flash"),
        llm_cloud_timeout_s     = float(llm_c.get("timeout_s", 30.0)),
        llm_retry_max_attempts  = int(llm_r.get("max_attempts", 3)),
        llm_retry_backoff_min_s = float(llm_r.get("backoff_min_s", 0.5)),
        llm_retry_backoff_max_s = float(llm_r.get("backoff_max_s", 8.0)),
        deep_analysis_enabled   = bool(llm_d.get("enabled", True)),

        # Hardware
        hardware_profile          = profile_name,
        embed_device              = hw.get("embed_device", "cpu"),
        embed_batch_size          = int(hw.get("embed_batch_size", 16)),
        max_concurrent_ingestions = int(hw.get("max_concurrent_ingestions", 2)),

        # Embedding & Reranking
        embed_model_name  = rag.get("embedding", {}).get("model", "paraphrase-multilingual-MiniLM-L12-v2"),
        rerank_enabled    = bool(rag.get("reranker", {}).get("enabled", False)),
        rerank_model_name = rag.get("reranker", {}).get("model", "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"),
        rerank_top_k      = int(rag.get("reranker", {}).get("top_k", 5)),
        rerank_candidates = int(rag.get("reranker", {}).get("candidates", 20)),

        # Sécurité
        encryption_enabled = bool(sec.get("encryption", {}).get("enabled", False)),
        rate_limit_rpm     = int(sec.get("rate_limiting", {}).get("requests_per_minute", 100)),
        rate_limit_burst   = int(sec.get("rate_limiting", {}).get("burst_capacity", 100)),

        # RAG
        veto_default_threshold    = float(veto.get("default_threshold", 0.65)),
        veto_max_candidates       = int(veto.get("max_candidates_evaluated", 3)),
        crystallizer_enabled_default = bool(cryst.get("enabled_by_default", True)),
        crystallizer_min_score    = float(cryst.get("min_score", 0.60)),
        crystallizer_min_answer_len = int(cryst.get("min_answer_length", 20)),
        crystallizer_tau_fusion   = float(cryst.get("tau_fusion", 0.75)),
        ki_aliases_per_question   = int(aliases.get("ki_aliases_per_question", 10)),
        query_expansion_variants  = int(aliases.get("query_expansion_variants", 3)),
        default_ruleset           = dom.get("default_ruleset", "finance_fr"),
        graphrag_max_relations    = int(grag.get("max_relations_per_doc", 20)),

        # Logging
        log_level          = log_cfg.get("level", "INFO"),
        log_max_file_mb    = int(log_cfg.get("max_file_size_mb", 50)),
        log_backup_count   = int(log_cfg.get("backup_count", 5)),
        log_structured_json = bool(log_cfg.get("structured_json", False)),
    )

    # ── Surcharges par variables d'environnement ────────────────────────────
    # Permet de docker-override sans toucher le yaml
    if os.getenv("ZENITH_MODE"):
        cfg.llm_primary_backend = os.getenv("ZENITH_MODE")  # type: ignore
    if os.getenv("MAX_CONCURRENT_INGESTIONS"):
        cfg.max_concurrent_ingestions = int(os.getenv("MAX_CONCURRENT_INGESTIONS"))  # type: ignore
    if os.getenv("LOG_LEVEL"):
        cfg.log_level = os.getenv("LOG_LEVEL")  # type: ignore

    logger.info(
        f"✅ Config chargée — mode={cfg.deployment_mode} "
        f"llm={cfg.llm_primary_backend} hw={cfg.hardware_profile} "
        f"embed={cfg.embed_device} workers={cfg.gunicorn_workers}"
    )
    return cfg


def invalidate_config() -> None:
    """Force le rechargement de la config (utile pour les tests)."""
    get_config.cache_clear()
