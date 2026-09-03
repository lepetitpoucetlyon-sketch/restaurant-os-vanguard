"""
app/core/auth_users.py — Authentification utilisateurs + RBAC

Deux mécanismes coexistent :
  1. Clé API workspace (legacy, rétrocompatible) — identifie un workspace entier
  2. JWT utilisateur (nouveau) — identifie un utilisateur avec son rôle dans un workspace

Le principe de timidité des couronnes est implémenté ici :
  - Par défaut, chaque utilisateur est isolé (voit uniquement ses propres ressources)
  - Le partage est un acte explicite, contrôlé par le rôle
"""

from __future__ import annotations

import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
import bcrypt as _bcrypt
import jwt
from jwt import PyJWTError as JWTError  # migré de python-jose (retire la dép ecdsa, GHSA-wj6h-64fc-37mp)

from infra.db.database import get_db_connection

# ── Constantes JWT ────────────────────────────────────────────────────────────
# JWT_SECRET DOIT être fourni via l'environnement et partagé par tous les workers.
# Un secret généré par process (secrets.token_hex) donnerait un secret différent
# à chaque worker gunicorn → les tokens émis par un worker seraient rejetés par
# les autres, et tous les tokens sauteraient à chaque redémarrage.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    if os.getenv("RAG_ENGINE_MODE", "").lower() in {"prod", "production"} or \
       os.getenv("ENV", "").lower() in {"prod", "production"}:
        raise RuntimeError(
            "JWT_SECRET manquant : définissez une valeur fixe (64 hex) dans "
            "l'environnement. Un secret par process casserait l'auth multi-worker."
        )
    # Hors production : secret éphémère de dev, avec avertissement explicite.
    import logging as _logging
    JWT_SECRET = secrets.token_hex(32)
    _logging.getLogger("SovereignRAG.Auth").warning(
        "⚠️ JWT_SECRET non défini — secret de dev éphémère généré. "
        "Les tokens seront invalidés au redémarrage et entre workers. "
        "NE PAS utiliser en production."
    )
JWT_ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES  = 60
REFRESH_TOKEN_EXPIRE_DAYS    = 30

# ── Schémas d'auth ────────────────────────────────────────────────────────────
oauth2_scheme    = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
api_key_header   = APIKeyHeader(name="X-API-Key", auto_error=False)

# ─────────────────────────────────────────────────────────────────────────────
# Rôles et permissions
# ─────────────────────────────────────────────────────────────────────────────

ROLE_HIERARCHY = {"viewer": 0, "editor": 1, "owner": 2}

PERMISSIONS = {
    # Requêtes
    "query":           {"viewer", "editor", "owner"},
    # Upload de documents
    "ingest":          {"editor", "owner"},
    # Partager un document ou un KI dans le pool commun
    "share":           {"editor", "owner"},
    # Inviter un membre dans un workspace
    "invite":          {"owner"},
    # Supprimer un workspace
    "delete_workspace":{"owner"},
    # Voir les documents des autres membres (admin view)
    "view_all":        {"owner"},
}

def has_permission(role: str, action: str) -> bool:
    return role in PERMISSIONS.get(action, set())


# ─────────────────────────────────────────────────────────────────────────────
# Mots de passe
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def generate_user_api_key() -> str:
    return f"sk_usr_{secrets.token_urlsafe(32)}"


# ─────────────────────────────────────────────────────────────────────────────
# JWT
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, workspace_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "workspace_id": workspace_id,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("Not an access token")
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré.",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Identité courante — résolution depuis JWT ou clé API
# ─────────────────────────────────────────────────────────────────────────────

class CurrentUser:
    """Représente l'identité résolue d'un appelant."""
    def __init__(
        self,
        user_id: Optional[str],
        workspace_id: str,
        role: str,
        org_id: Optional[str] = None,
        is_api_key_auth: bool = False,
    ):
        self.user_id       = user_id
        self.workspace_id  = workspace_id
        self.role          = role
        self.org_id        = org_id
        self.is_api_key_auth = is_api_key_auth

    def require(self, action: str) -> None:
        """Lève 403 si le rôle n'a pas la permission."""
        if not has_permission(self.role, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action '{action}' interdite pour le rôle '{self.role}'.",
            )

    @property
    def can_see_private_of(self) -> Optional[str]:
        """Retourne user_id si l'utilisateur doit voir uniquement ses ressources privées."""
        if self.role == "owner":
            return None  # owner voit tout
        return self.user_id


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    api_key: Optional[str] = Security(api_key_header),
) -> CurrentUser:
    """
    Résout l'identité depuis :
      1. JWT Bearer token (auth utilisateur)
      2. X-API-Key header (auth workspace legacy ou clé API utilisateur)
    """
    # ── Chemin JWT ────────────────────────────────────────────────────────────
    if token:
        payload = decode_access_token(token)
        return CurrentUser(
            user_id      = payload["sub"],
            workspace_id = payload["workspace_id"],
            role         = payload["role"],
        )

    # ── Chemin clé API ────────────────────────────────────────────────────────
    if api_key:
        key_hash = hash_api_key(api_key)
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Clé API utilisateur personnelle
        cursor.execute(
            "SELECT u.id, u.org_id, wm.workspace_id, wm.role "
            "FROM users u "
            "JOIN workspace_members wm ON wm.user_id = u.id "
            "WHERE u.api_key_hash = ? AND u.status = 'active'",
            (key_hash,)
        )
        row = cursor.fetchone()
        if row:
            return CurrentUser(
                user_id      = row["id"],
                workspace_id = row["workspace_id"],
                role         = row["role"],
                org_id       = row["org_id"],
                is_api_key_auth = True,
            )

        # 2. Clé API workspace (legacy — rétrocompatibilité)
        cursor.execute(
            "SELECT id, org_id FROM workspaces "
            "WHERE api_key_hash = ? AND status = 'active'",
            (key_hash,)
        )
        ws = cursor.fetchone()
        if ws:
            # Auth workspace legacy : pas d'utilisateur identifié,
            # on donne le rôle 'editor' par défaut pour ne pas bloquer l'existant
            return CurrentUser(
                user_id      = None,
                workspace_id = ws["id"],
                role         = "editor",
                org_id       = ws["org_id"],
                is_api_key_auth = True,
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification requise (JWT Bearer ou X-API-Key).",
    )


# ─────────────────────────────────────────────────────────────────────────────
# CRUD utilisateurs
# ─────────────────────────────────────────────────────────────────────────────

def create_user(
    email: str,
    password: str,
    full_name: str,
    org_id: Optional[str] = None,
) -> dict:
    user_id  = f"usr_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (id, org_id, email, password_hash, full_name) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, org_id, email, password_hash, full_name)
        )
        conn.commit()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email déjà utilisé.",
        )
    return {"user_id": user_id, "email": email, "org_id": org_id}


def authenticate_user(email: str, password: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, org_id, password_hash, status, totp_secret, totp_enabled "
        "FROM users WHERE email = ?",
        (email,)
    )
    user = cursor.fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte suspendu.",
        )
    return dict(user)


def get_user_workspace_role(user_id: str, workspace_id: str) -> Optional[str]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role FROM workspace_members WHERE user_id = ? AND workspace_id = ?",
        (user_id, workspace_id)
    )
    row = cursor.fetchone()
    return row["role"] if row else None


def add_member_to_workspace(
    workspace_id: str,
    user_email: str,
    role: str,
    invited_by: str,
) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur '{user_email}' introuvable.",
        )
    cursor.execute(
        "INSERT OR REPLACE INTO workspace_members (workspace_id, user_id, role, invited_by) "
        "VALUES (?, ?, ?, ?)",
        (workspace_id, user["id"], role, invited_by)
    )
    conn.commit()
    return {"user_id": user["id"], "workspace_id": workspace_id, "role": role}
