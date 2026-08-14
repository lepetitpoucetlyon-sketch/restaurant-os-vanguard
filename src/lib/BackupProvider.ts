/**
 * BackupProvider — Interface agnostique pour les sauvegardes Restaurant OS.
 *
 * Implémentations disponibles :
 *   GCSBackupProvider    — Google Cloud Storage (Firebase)
 *   S3BackupProvider     — AWS S3 / OVH Object Storage / Cloudflare R2 (S3-compatible)
 *   LocalFSBackupProvider — Système de fichiers local (dev / on-premise)
 *
 * Sélection via BACKUP_PROVIDER env var : 'gcs' | 's3' | 'local'
 *
 * Obligation NF525 : journaux fiscaux conservés 6 ans minimum.
 * Recommandation : backup quotidien, rétention 7 ans, chiffrement AES-256 côté client.
 */

export interface BackupManifest {
    id:          string;
    tenantId:    string;
    createdAt:   string;
    provider:    string;
    fileName:    string;
    sizeBytes:   number;
    collections: string[];
    checksum:    string;   // SHA-256 du fichier exporté
    retainUntil: string;   // ISO date (NF525 = +6 ans)
}

export interface BackupListEntry {
    fileName:  string;
    sizeBytes: number;
    createdAt: string;
}

export interface IBackupProvider {
    readonly name: string;
    /** Pousse un buffer compressé vers le stockage. Retourne l'URL ou le chemin. */
    upload(fileName: string, data: Buffer): Promise<{ location: string }>;
    /** Liste les sauvegardes disponibles (filtrable par préfixe). */
    list(prefix?: string): Promise<BackupListEntry[]>;
    /** Télécharge une sauvegarde. */
    download(fileName: string): Promise<Buffer>;
    /** Supprime les sauvegardes plus anciennes que `beforeDate`. */
    purgeOlderThan(beforeDate: Date): Promise<number>;
}

// ─── GCS (Firebase / Google Cloud Storage) ──────────────────────────────────

export class GCSBackupProvider implements IBackupProvider {
    readonly name = 'gcs';
    private bucket: string;

    constructor() {
        this.bucket = process.env.BACKUP_GCS_BUCKET ?? 'restaurant-os-backups';
    }

    async upload(fileName: string, data: Buffer): Promise<{ location: string }> {
        // @google-cloud/storage doit être installé : npm i @google-cloud/storage
        const { Storage } = await import('@google-cloud/storage' as string) as {
            Storage: new() => { bucket(name: string): { file(name: string): { save(data: Buffer, opts: object): Promise<void> } } }
        };
        const storage = new Storage();
        await storage.bucket(this.bucket).file(fileName).save(data, { contentType: 'application/gzip' });
        return { location: `gs://${this.bucket}/${fileName}` };
    }

    async list(prefix = 'backups/'): Promise<BackupListEntry[]> {
        const { Storage } = await import('@google-cloud/storage' as string) as {
            Storage: new() => { bucket(name: string): { getFiles(opts: object): Promise<[Array<{ name: string; metadata: { size?: string; timeCreated?: string } }>]> } }
        };
        const [files] = await new Storage().bucket(this.bucket).getFiles({ prefix });
        return files.map(f => ({
            fileName:  f.name,
            sizeBytes: parseInt(f.metadata.size ?? '0', 10),
            createdAt: f.metadata.timeCreated ?? '',
        }));
    }

    async download(fileName: string): Promise<Buffer> {
        const { Storage } = await import('@google-cloud/storage' as string) as {
            Storage: new() => { bucket(name: string): { file(name: string): { download(): Promise<[Buffer]> } } }
        };
        const [contents] = await new Storage().bucket(this.bucket).file(fileName).download();
        return contents;
    }

    async purgeOlderThan(beforeDate: Date): Promise<number> {
        const files = await this.list();
        let deleted = 0;
        for (const f of files) {
            if (f.createdAt && new Date(f.createdAt) < beforeDate) {
                const { Storage } = await import('@google-cloud/storage' as string) as {
                    Storage: new() => { bucket(name: string): { file(name: string): { delete(): Promise<void> } } }
                };
                await new Storage().bucket(this.bucket).file(f.fileName).delete();
                deleted++;
            }
        }
        return deleted;
    }
}

// ─── S3-compatible (AWS S3 / OVH Object Storage / Cloudflare R2 / Scaleway) ─

export class S3BackupProvider implements IBackupProvider {
    readonly name = 's3';
    private bucket: string;
    private endpoint: string;

    constructor() {
        this.bucket   = process.env.BACKUP_S3_BUCKET   ?? 'restaurant-os-backups';
        this.endpoint = process.env.BACKUP_S3_ENDPOINT ?? ''; // vide = AWS, sinon OVH/R2/Scaleway
    }

    private async client() {
        // @aws-sdk/client-s3 : npm i @aws-sdk/client-s3
        const { S3Client } = await import('@aws-sdk/client-s3' as string) as {
            S3Client: new(cfg: object) => object
        };
        return new S3Client({
            region:      process.env.BACKUP_S3_REGION ?? 'eu-west-1',
            endpoint:    this.endpoint || undefined,
            credentials: {
                accessKeyId:     process.env.BACKUP_S3_ACCESS_KEY ?? '',
                secretAccessKey: process.env.BACKUP_S3_SECRET_KEY ?? '',
            },
            // OVH / Scaleway imposent path-style
            forcePathStyle: !!this.endpoint,
        });
    }

    async upload(fileName: string, data: Buffer): Promise<{ location: string }> {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3' as string) as {
            PutObjectCommand: new(input: object) => object
        };
        const client = await this.client() as { send(cmd: object): Promise<void> };
        await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: fileName, Body: data, ContentType: 'application/gzip' }));
        const base = this.endpoint ? `${this.endpoint}/${this.bucket}` : `https://${this.bucket}.s3.amazonaws.com`;
        return { location: `${base}/${fileName}` };
    }

    async list(prefix = 'backups/'): Promise<BackupListEntry[]> {
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3' as string) as {
            ListObjectsV2Command: new(input: object) => object
        };
        const client = await this.client() as { send(cmd: object): Promise<{ Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }> }> };
        const res = await client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
        return (res.Contents ?? []).map(o => ({
            fileName:  o.Key ?? '',
            sizeBytes: o.Size ?? 0,
            createdAt: o.LastModified?.toISOString() ?? '',
        }));
    }

    async download(fileName: string): Promise<Buffer> {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3' as string) as {
            GetObjectCommand: new(input: object) => object
        };
        const client = await this.client() as { send(cmd: object): Promise<{ Body?: { transformToByteArray(): Promise<Uint8Array> } }> };
        const res = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: fileName }));
        const bytes = await res.Body?.transformToByteArray();
        return Buffer.from(bytes ?? []);
    }

    async purgeOlderThan(beforeDate: Date): Promise<number> {
        const files = await this.list();
        const old = files.filter(f => f.createdAt && new Date(f.createdAt) < beforeDate);
        if (old.length === 0) return 0;
        const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3' as string) as {
            DeleteObjectsCommand: new(input: object) => object
        };
        const client = await this.client() as { send(cmd: object): Promise<void> };
        await client.send(new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: old.map(f => ({ Key: f.fileName })) },
        }));
        return old.length;
    }
}

// ─── Filesystem local (dev / NAS / on-premise) ───────────────────────────────

export class LocalFSBackupProvider implements IBackupProvider {
    readonly name = 'local';
    private dir: string;

    constructor() {
        this.dir = process.env.BACKUP_LOCAL_DIR ?? '/var/backups/restaurant-os';
    }

    async upload(fileName: string, data: Buffer): Promise<{ location: string }> {
        const { writeFile, mkdir } = await import('node:fs/promises');
        const { join } = await import('node:path');
        await mkdir(this.dir, { recursive: true });
        const filePath = join(this.dir, fileName.replace(/\//g, '_'));
        await writeFile(filePath, data);
        return { location: filePath };
    }

    async list(prefix = ''): Promise<BackupListEntry[]> {
        const { readdir, stat } = await import('node:fs/promises');
        const { join } = await import('node:path');
        try {
            const files = await readdir(this.dir);
            const entries = await Promise.all(
                files.filter(f => !prefix || f.startsWith(prefix.replace(/\//g, '_'))).map(async f => {
                    const s = await stat(join(this.dir, f));
                    return { fileName: f, sizeBytes: s.size, createdAt: s.birthtime.toISOString() };
                })
            );
            return entries;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[BackupProvider/LocalFS] Impossible de lister les backups', this.dir, err);
            return [];
        }
    }

    async download(fileName: string): Promise<Buffer> {
        const { readFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        return readFile(join(this.dir, fileName.replace(/\//g, '_')));
    }

    async purgeOlderThan(beforeDate: Date): Promise<number> {
        const { unlink } = await import('node:fs/promises');
        const { join } = await import('node:path');
        const files = await this.list();
        const old = files.filter(f => new Date(f.createdAt) < beforeDate);
        for (const f of old) { await unlink(join(this.dir, f.fileName)).catch(() => {}); }
        return old.length;
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function getBackupProvider(): IBackupProvider {
    const p = (process.env.BACKUP_PROVIDER ?? 'local').toLowerCase();
    if (p === 'gcs')   return new GCSBackupProvider();
    if (p === 's3')    return new S3BackupProvider();
    if (p === 'local') return new LocalFSBackupProvider();
    throw new Error(`BACKUP_PROVIDER inconnu : "${p}". Valides : gcs | s3 | local`);
}
