import os
import logging
from dotenv import load_dotenv

# Chargement des variables d'environnement (doit être AVANT get_config)
load_dotenv()

from infra.config import get_config as _get_zenith_config  # noqa: E402
_cfg = _get_zenith_config()

# Configuration du logging — niveau piloté par zenith.yaml → logging.level
logging.basicConfig(
    level=getattr(logging, _cfg.log_level.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(
    f"⚙️  Zenith config chargée — mode={_cfg.deployment_mode} "
    f"llm={_cfg.llm_primary_backend} hw={_cfg.hardware_profile} "
    f"embed={_cfg.embed_device} workers={_cfg.gunicorn_workers}"
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.endpoints import router as api_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.sharing import router as sharing_router
from app.api.payment import router as payment_router
from infra.db.database import init_db


init_db()

# IP-based Rate Limiter (Token Bucket) — thread-safe via asyncio.Lock per key
import time
import asyncio
from fastapi import Request
from fastapi.responses import JSONResponse

class TokenBucketLimiter:
    """
    Token bucket rate limiter safe for use in async concurrent contexts.
    Each IP gets its own asyncio.Lock so bucket reads/writes are atomic.
    """
    def __init__(self, rate: float, capacity: float):
        self.rate = rate          # tokens per second
        self.capacity = capacity  # max tokens
        self._buckets: dict[str, float] = {}
        self._last_update: dict[str, float] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def _get_lock(self, key: str) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    async def consume(self, key: str) -> bool:
        async with self._get_lock(key):
            now = time.monotonic()
            last = self._last_update.get(key, now)
            elapsed = now - last
            self._last_update[key] = now
            current = self._buckets.get(key, self.capacity)
            self._buckets[key] = min(self.capacity, current + elapsed * self.rate)
            if self._buckets[key] >= 1.0:
                self._buckets[key] -= 1.0
                return True
            return False

# Taux : rpm → tokens/sec, capacité = burst (tous deux pilotés par zenith.yaml)
_rpm   = _cfg.rate_limit_rpm
_burst = _cfg.rate_limit_burst
rate_limiter = TokenBucketLimiter(rate=_rpm / 60.0, capacity=float(_burst))

app = FastAPI(
    title="Zenith Core API",
    description="Interface de commandement souveraine.",
    version="1.2.0"
)

# CORS Restrict
allowed_origins_env = os.getenv("CORS_ORIGINS", "https://sovereign-rag.com,http://localhost:8000,http://127.0.0.1:8000")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ne faire confiance aux en-têtes de forwarding QUE si l'app tourne derrière un
# reverse proxy de confiance (nginx). Sinon un client peut usurper X-Forwarded-For
# pour se faire passer pour 127.0.0.1 et contourner entièrement le rate-limiting.
_TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() in {"1", "true", "yes"}

def get_client_ip(request: Request) -> str:
    # IP du pair TCP direct — non falsifiable par le client.
    peer = request.client.host if request.client else "unknown"

    if not _TRUST_PROXY_HEADERS:
        return peer

    # Derrière un proxy de confiance : nginx (proxy_add_x_forwarded_for) ajoute le
    # vrai client à la FIN de la chaîne X-Forwarded-For, et pose X-Real-IP à
    # $remote_addr. On prend donc l'entrée de droite / X-Real-IP : elle est écrite
    # par notre proxy et ne peut pas être forgée par le client.
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        parts = [ip.strip() for ip in x_forwarded_for.split(",") if ip.strip()]
        if parts:
            return parts[-1]
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()
    return peer

@app.middleware("http")
async def security_and_rate_limiting_middleware(request: Request, call_next):
    # 1. Rate Limiting for API routes
    if request.url.path.startswith("/api/v1"):
        client_ip = get_client_ip(request)
        if client_ip not in ("127.0.0.1", "localhost", "::1") and not await rate_limiter.consume(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too Many Requests. Rate limit exceeded (100 req/min)."}
            )
            
    # 2. Process the request
    response = await call_next(request)
    
    # 3. Inject Security Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    return response

# ── Observabilité Prometheus ───────────────────────────────────────────────
# Expose /metrics : latences par endpoint (histogrammes), compteurs de requêtes
# et d'erreurs. Scrapable par Prometheus/Grafana en local comme en prod.
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator(
        should_group_status_codes=True,
        excluded_handlers=["/metrics", "/health", "/static/.*"],
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
    logger.info("📊 Prometheus /metrics exposé")
except ImportError:
    logger.warning("⚠️ prometheus-fastapi-instrumentator absent — /metrics désactivé")

# Montage du dossier static AVANT les routes pour éviter les conflits
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Routes API
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(sharing_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(payment_router, prefix="/api/v1/payment")

# Route Admin Directe
@app.get("/admin", include_in_schema=False)
async def admin_page():
    return FileResponse("static/admin.html")

@app.get("/dashboard", include_in_schema=False)
async def dashboard_page():
    return FileResponse("static/dashboard.html")

@app.get("/", include_in_schema=False)
async def home_page():
    return FileResponse("static/index.html")

@app.get("/health")
async def health():
    return {
        "status": "zenith_alive",
        "version": "1.2.0",
        "deployment_mode": _cfg.deployment_mode,
        "llm_backend": _cfg.llm_primary_backend,
        "hardware_profile": _cfg.hardware_profile,
        "embed_device": _cfg.embed_device,
        "max_concurrent_ingestions": _cfg.max_concurrent_ingestions,
    }

