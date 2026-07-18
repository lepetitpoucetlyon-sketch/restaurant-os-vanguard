import secrets
import hashlib
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from infra.db.database import get_db_connection

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

def generate_api_key() -> str:
    return f"sk_{secrets.token_urlsafe(32)}"

async def get_workspace_from_api_key(api_key: str = Security(api_key_header)):
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key manquante"
        )
    
    api_key_hash = hash_api_key(api_key)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, plan FROM workspaces WHERE api_key_hash = ? AND status = 'active'",
        (api_key_hash,)
    )
    workspace = cursor.fetchone()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key invalide ou workspace inactif"
        )
    
    return dict(workspace)
