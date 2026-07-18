import os
import secrets
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import List, Dict, Optional
from infra.db.database import get_db_connection
from pydantic import BaseModel

async def verify_admin(x_admin_key: str = Header(...)):
    expected = os.getenv("ADMIN_API_KEY")
    if not expected or not secrets.compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=403, detail="Non autorisé")

router = APIRouter(dependencies=[Depends(verify_admin)])

class WorkspaceUpdate(BaseModel):
    brain_mode: Optional[str] = None
    veto_threshold: Optional[float] = None
    model_name: Optional[str] = None
    status: Optional[str] = None

@router.get("/workspaces")
async def list_workspaces():
    """Liste tous les workspaces et leurs configurations"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workspaces")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.patch("/workspaces/{workspace_id}")
async def update_workspace(workspace_id: str, update: WorkspaceUpdate):
    """Modifie la configuration d'un workspace"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Construction dynamique de la requête
    fields = []
    values = []
    for field, value in update.dict(exclude_unset=True).items():
        fields.append(f"{field} = ?")
        values.append(value)
    
    if not fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")
    
    values.append(workspace_id)
    query = f"UPDATE workspaces SET {', '.join(fields)} WHERE id = ?"  # nosec B608
    
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    
    return {"status": "success", "updated_id": workspace_id}

@router.get("/stats")
async def get_system_stats():
    """Statistiques globales du système Zenith"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM workspaces")
    ws_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*), AVG(latency_ms) FROM usage")
    usage_stats = cursor.fetchone()
    conn.close()
    return {
        "total_workspaces": ws_count,
        "total_queries": usage_stats[0],
        "avg_latency_ms": usage_stats[1] or 0
    }
