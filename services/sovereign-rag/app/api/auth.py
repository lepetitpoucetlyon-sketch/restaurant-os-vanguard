"""
app/api/auth.py — Endpoints d'authentification utilisateurs

Routes :
  POST /auth/register  — créer un compte
  POST /auth/login     — obtenir un JWT
  POST /auth/refresh   — renouveler l'access token
  POST /auth/invite    — inviter un membre dans un workspace (owner only)
  GET  /auth/me        — profil de l'utilisateur courant
  PATCH /auth/me/role  — changer le rôle d'un membre (owner only)
"""

import uuid
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.auth_users import (
    CurrentUser, get_current_user,
    create_user, authenticate_user, add_member_to_workspace,
    create_access_token, create_refresh_token,
    get_user_workspace_role, hash_api_key,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from infra.db.database import get_db_connection

router = APIRouter(tags=["Auth"])


# ── Schémas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    org_name: Optional[str] = None    # Si fourni, crée une nouvelle organisation

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    workspace_id: str
    role: str

class InviteRequest(BaseModel):
    user_email: str
    role: str = "viewer"   # "viewer" | "editor" | "owner"

class RoleUpdateRequest(BaseModel):
    user_email: str
    new_role: str


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(req: RegisterRequest):
    """
    Crée un compte utilisateur.
    Si org_name est fourni, crée une nouvelle organisation et un workspace par défaut (rôle owner).
    Sinon, le compte est créé sans workspace — rejoindre via /auth/invite uniquement.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    org_id = None
    workspace_id = None
    role = None

    if req.org_name:
        org_id = f"org_{uuid.uuid4().hex[:10]}"
        cursor.execute(
            "INSERT INTO organizations (id, name) VALUES (?, ?)",
            (org_id, req.org_name)
        )
        workspace_id = f"ws_{uuid.uuid4().hex[:8]}"
        api_key = f"sk_{uuid.uuid4().hex}"
        api_key_hash = hash_api_key(api_key)
        cursor.execute(
            "INSERT INTO workspaces (id, name, org_id, api_key_hash) VALUES (?, ?, ?, ?)",
            (workspace_id, f"{req.org_name} — Workspace", org_id, api_key_hash)
        )
        conn.commit()

    user = create_user(
        email=req.email,
        password=req.password,
        full_name=req.full_name,
        org_id=org_id,
    )
    user_id = user["user_id"]

    if workspace_id:
        role = "owner"
        cursor.execute(
            "INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role) "
            "VALUES (?, ?, ?)",
            (workspace_id, user_id, role)
        )
        conn.commit()

    return {
        "user_id": user_id,
        "email": req.email,
        "org_id": org_id,
        "workspace_id": workspace_id,
        "role": role,
        "message": "Compte créé avec succès." if workspace_id else "Compte créé. Rejoignez un workspace via une invitation (/auth/invite).",
    }


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), totp_code: Optional[str] = Form(None)):
    """
    Authentification par email + mot de passe.
    Si le 2FA est activé sur le compte, le champ form `totp_code` est requis.
    Retourne un access token JWT (1h) et un refresh token (30j).
    Le workspace utilisé est le premier workspace actif de l'utilisateur.
    """
    user = authenticate_user(form.username, form.password)
    user_id = user["id"]

    # ── Vérification 2FA TOTP ────────────────────────────────────────────────
    if user.get("totp_enabled"):
        if not totp_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="totp_required",
            )
        import pyotp
        if not pyotp.TOTP(user["totp_secret"]).verify(totp_code, valid_window=1):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code 2FA invalide.",
            )

    conn = get_db_connection()
    cursor = conn.cursor()

    # Récupérer le premier workspace actif de l'utilisateur
    cursor.execute(
        "SELECT wm.workspace_id, wm.role FROM workspace_members wm "
        "JOIN workspaces w ON w.id = wm.workspace_id "
        "WHERE wm.user_id = ? AND w.status = 'active' "
        "ORDER BY wm.joined_at ASC LIMIT 1",
        (user_id,)
    )
    membership = cursor.fetchone()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aucun workspace actif trouvé pour cet utilisateur.",
        )

    workspace_id = membership["workspace_id"]
    role = membership["role"]

    access_token  = create_access_token(user_id, workspace_id, role)
    refresh_token = create_refresh_token()

    # Stocker le refresh token (hashé)
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    cursor.execute(
        "INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at) "
        "VALUES (?, ?, ?, ?)",
        (session_id, user_id, rt_hash, expires_at.isoformat())
    )
    conn.commit()

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        workspace_id=workspace_id,
        role=role,
    )


# ── Refresh token ─────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str
    workspace_id: Optional[str] = None

@router.post("/refresh")
async def refresh_token(req: RefreshRequest):
    """Échange un refresh token valide contre un nouvel access token."""
    rt_hash = hashlib.sha256(req.refresh_token.encode()).hexdigest()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, expires_at FROM user_sessions WHERE refresh_token_hash = ?",
        (rt_hash,)
    )
    session = cursor.fetchone()

    if not session:
        raise HTTPException(status_code=401, detail="Refresh token invalide.")
    if datetime.fromisoformat(session["expires_at"]).replace(tzinfo=None) < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=401, detail="Refresh token expiré.")

    user_id = session["user_id"]

    # Workspace cible (celui demandé ou le premier disponible)
    ws_id = req.workspace_id
    if ws_id:
        role = get_user_workspace_role(user_id, ws_id)
        if not role:
            raise HTTPException(status_code=403, detail="Accès non autorisé à ce workspace.")
    else:
        cursor.execute(
            "SELECT workspace_id, role FROM workspace_members WHERE user_id = ? LIMIT 1",
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=403, detail="Aucun workspace disponible.")
        ws_id = row["workspace_id"]
        role = row["role"]

    return {"access_token": create_access_token(user_id, ws_id, role), "token_type": "bearer"}


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(current: CurrentUser = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur courant et son rôle dans le workspace."""
    if not current.user_id:
        return {"auth": "api_key_legacy", "workspace_id": current.workspace_id, "role": current.role}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT email, full_name, org_id, created_at FROM users WHERE id = ?",
        (current.user_id,)
    )
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    return {
        "user_id": current.user_id,
        "email": user["email"],
        "full_name": user["full_name"],
        "org_id": user["org_id"],
        "workspace_id": current.workspace_id,
        "role": current.role,
    }


# ── Invite ────────────────────────────────────────────────────────────────────

@router.post("/invite")
async def invite_member(
    req: InviteRequest,
    current: CurrentUser = Depends(get_current_user),
):
    """Invite un utilisateur dans le workspace courant (owner uniquement)."""
    current.require("invite")

    if req.role not in ("viewer", "editor", "owner"):
        raise HTTPException(status_code=400, detail="Rôle invalide. Valeurs: viewer, editor, owner.")

    result = add_member_to_workspace(
        workspace_id=current.workspace_id,
        user_email=req.user_email,
        role=req.role,
        invited_by=current.user_id or "system",
    )
    return {"message": f"Utilisateur invité avec le rôle '{req.role}'.", **result}


# ── Change role ───────────────────────────────────────────────────────────────

@router.patch("/members/role")
async def update_member_role(
    req: RoleUpdateRequest,
    current: CurrentUser = Depends(get_current_user),
):
    """Modifie le rôle d'un membre du workspace (owner uniquement)."""
    current.require("invite")  # Seul owner peut changer les rôles

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.user_email,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    cursor.execute(
        "UPDATE workspace_members SET role = ? "
        "WHERE workspace_id = ? AND user_id = ?",
        (req.new_role, current.workspace_id, user["id"])
    )
    conn.commit()
    return {"message": f"Rôle mis à jour : {req.new_role}", "user_id": user["id"]}


# ── List members ──────────────────────────────────────────────────────────────

@router.get("/members")
async def list_members(current: CurrentUser = Depends(get_current_user)):
    """Liste les membres du workspace courant."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT u.id, u.email, u.full_name, wm.role, wm.joined_at "
        "FROM workspace_members wm "
        "JOIN users u ON u.id = wm.user_id "
        "WHERE wm.workspace_id = ? "
        "ORDER BY wm.joined_at ASC",
        (current.workspace_id,)
    )
    return {"members": [dict(r) for r in cursor.fetchall()]}


# ── 2FA TOTP ──────────────────────────────────────────────────────────────────

class TotpCodeRequest(BaseModel):
    code: str

@router.post("/2fa/setup")
async def totp_setup(current: CurrentUser = Depends(get_current_user)):
    """
    Génère un secret TOTP pour l'utilisateur courant (non activé tant que
    /2fa/enable n'a pas validé un premier code). Retourne le secret et
    l'URI de provisioning à encoder en QR code (Google Authenticator, etc.).
    """
    if not current.user_id:
        raise HTTPException(status_code=403, detail="Réservé aux comptes utilisateurs (pas aux clés API legacy).")
    import pyotp
    secret = pyotp.random_base32()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, totp_enabled FROM users WHERE id = ?", (current.user_id,))
    row = cursor.fetchone()
    if row and row["totp_enabled"]:
        raise HTTPException(status_code=409, detail="2FA déjà activé. Désactivez-le d'abord via /2fa/disable.")
    cursor.execute("UPDATE users SET totp_secret = ? WHERE id = ?", (secret, current.user_id))
    conn.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(
        name=row["email"] if row else current.user_id,
        issuer_name="Sovereign RAG",
    )
    return {"secret": secret, "provisioning_uri": uri}

@router.post("/2fa/enable")
async def totp_enable(req: TotpCodeRequest, current: CurrentUser = Depends(get_current_user)):
    """Active le 2FA après validation d'un premier code TOTP correct."""
    if not current.user_id:
        raise HTTPException(status_code=403, detail="Réservé aux comptes utilisateurs.")
    import pyotp
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT totp_secret FROM users WHERE id = ?", (current.user_id,))
    row = cursor.fetchone()
    if not row or not row["totp_secret"]:
        raise HTTPException(status_code=400, detail="Aucun secret TOTP. Appelez d'abord /2fa/setup.")
    if not pyotp.TOTP(row["totp_secret"]).verify(req.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Code 2FA invalide.")
    cursor.execute("UPDATE users SET totp_enabled = 1 WHERE id = ?", (current.user_id,))
    conn.commit()
    return {"message": "2FA activé."}

@router.post("/2fa/disable")
async def totp_disable(req: TotpCodeRequest, current: CurrentUser = Depends(get_current_user)):
    """Désactive le 2FA (nécessite un code TOTP valide)."""
    if not current.user_id:
        raise HTTPException(status_code=403, detail="Réservé aux comptes utilisateurs.")
    import pyotp
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT totp_secret, totp_enabled FROM users WHERE id = ?", (current.user_id,))
    row = cursor.fetchone()
    if not row or not row["totp_enabled"]:
        raise HTTPException(status_code=400, detail="2FA non activé.")
    if not pyotp.TOTP(row["totp_secret"]).verify(req.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Code 2FA invalide.")
    cursor.execute("UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?", (current.user_id,))
    conn.commit()
    return {"message": "2FA désactivé."}
