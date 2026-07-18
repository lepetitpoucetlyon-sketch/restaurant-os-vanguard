import sqlite3
import threading
import os
from typing import Optional, Dict, Any

DB_PATH = os.getenv("DB_PATH", "sovereign_rag.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ── Organisations (entreprises clientes) ──────────────────────────────────
    # Une organisation regroupe plusieurs utilisateurs et plusieurs workspaces.
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        plan TEXT DEFAULT 'standard',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # ── Utilisateurs individuels ───────────────────────────────────────────────
    # Chaque utilisateur appartient à une organisation.
    # L'authentification se fait par email + mot de passe (hash bcrypt-style)
    # ou via une clé API personnelle (api_key_hash).
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        api_key_hash TEXT UNIQUE,
        full_name TEXT,
        status TEXT DEFAULT 'active',  -- 'active' | 'suspended'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # ── Appartenance workspace ─────────────────────────────────────────────────
    # Un utilisateur peut avoir des rôles différents sur différents workspaces.
    # Rôles :
    #   owner  — tout faire, inviter, supprimer le workspace
    #   editor — uploader, requêter, partager, annoter
    #   viewer — requêter uniquement, pas d'accès aux documents bruts
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'viewer',
        invited_by TEXT REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, user_id)
    )
    ''')

    # ── Workspaces — ajout org_id ─────────────────────────────────────────────
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        org_id TEXT REFERENCES organizations(id),
        api_key_hash TEXT NOT NULL UNIQUE,
        plan TEXT DEFAULT 'standard',
        status TEXT DEFAULT 'active',
        brain_mode TEXT DEFAULT 'cloud',
        veto_threshold REAL DEFAULT 0.65,
        model_name TEXT DEFAULT 'anthropic/claude-3-5-haiku',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Suppression du forçage du threshold pour préserver la config par workspace
    
    # Table des documents ingérés (Audit Trail / Merkle)
    # visibility : 'private' = visible uniquement par owner_id
    #              'shared'  = visible par tous les membres du workspace
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        owner_id TEXT REFERENCES users(id),
        filename TEXT,
        hash TEXT,
        summary TEXT,
        ki_count INTEGER,
        integrity_root TEXT,
        root_id TEXT,
        doc_type TEXT,
        doc_domain TEXT,
        doc_subject TEXT,
        doc_essence TEXT,
        visibility TEXT DEFAULT 'private',
        shared_by TEXT REFERENCES users(id),
        shared_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
    ''')

    # Table de l'usage
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id TEXT,
        endpoint TEXT,
        brain TEXT,
        tokens INTEGER,
        latency_ms REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
    ''')

    # Table des Clusters Sémantiques (KI TREE Phase 3)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clusters (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        name TEXT,
        summary TEXT,
        keywords TEXT,
        size INTEGER,
        centroid TEXT, -- Stocké en JSON
        root_ids TEXT, -- Stocké en JSON
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
    ''')

    # Table des relations de graphe (Sovereign GraphRAG Phase 2)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ki_relations (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        source_ki_id TEXT,
        target_ki_id TEXT,
        relationship_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
    ''')

    # Table de feedback utilisateur pour la boucle d'apprentissage (Couche 8)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id TEXT,
        query_id TEXT,
        query_text TEXT,
        ki_id TEXT,
        cluster_id TEXT,
        feedback_type TEXT, -- 'incorrect' ou 'correct'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
    ''')

    # ── KI partagés (timidité des couronnes + pool commun optionnel) ───────────
    # Un KI cristallisé est privé par défaut.
    # Un editor/owner peut le pousser dans le pool commun du workspace.
    # Cette table est l'index de ce qui a été partagé explicitement.
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS shared_ki (
        ki_id TEXT PRIMARY KEY,
        workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
        shared_by TEXT REFERENCES users(id),
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note TEXT
    )
    ''')

    # ── Sessions utilisateur (JWT refresh tokens) ─────────────────────────────
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Migrations progressives — ignorées si la colonne existe déjà
    migrations = [
        "ALTER TABLE clusters ADD COLUMN root_ids TEXT",
        "ALTER TABLE workspaces ADD COLUMN crystallization_enabled INTEGER DEFAULT 1",
        "ALTER TABLE workspaces ADD COLUMN active_ruleset TEXT DEFAULT 'finance_fr'",
        "ALTER TABLE workspaces ADD COLUMN org_id TEXT",
        "ALTER TABLE documents ADD COLUMN owner_id TEXT",
        "ALTER TABLE documents ADD COLUMN visibility TEXT DEFAULT 'private'",
        "ALTER TABLE documents ADD COLUMN shared_by TEXT",
        "ALTER TABLE documents ADD COLUMN shared_at TIMESTAMP",
        "ALTER TABLE feedbacks ADD COLUMN user_id TEXT",
        "ALTER TABLE users ADD COLUMN totp_secret TEXT",
        "ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0",
        "ALTER TABLE workspaces ADD COLUMN subscription_id TEXT",
    ]
    for migration in migrations:
        try:
            cursor.execute(migration)
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e).lower():
                raise  # Ne pas avaler les vraies erreurs de migration

    # Indices de performance sur les colonnes workspace_id (requêtes multi-tenant)
    indices = [
        "CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_usage_workspace ON usage(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_feedbacks_workspace ON feedbacks(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_clusters_workspace ON clusters(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_ki_relations_workspace ON ki_relations(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)",
    ]
    for idx in indices:
        cursor.execute(idx)

    # Table des jobs d'ingestion (externalisation P1)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        status TEXT,
        progress INTEGER,
        filename TEXT,
        workspace_id TEXT,
        error TEXT,
        result_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()
    conn.close()

# Thread-local connection pool: one persistent connection per thread.
# Avoids the overhead of opening/closing a connection on every request
# while remaining safe under concurrent access (each thread has its own conn).
_thread_local = threading.local()

def get_db_connection() -> sqlite3.Connection:
    conn = getattr(_thread_local, "conn", None)
    if conn is not None:
        try:
            # Simple check to see if connection is still open and responsive
            conn.execute("SELECT 1")
        except sqlite3.ProgrammingError:
            conn = None
            
    if conn is None:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        conn.row_factory = sqlite3.Row
        _thread_local.conn = conn
    return conn
