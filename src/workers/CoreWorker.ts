/**
 * ⚛️ CoreWorker - Restaurant OS (Singularity 5.4)
 * Offloads heavy computations to a background thread to maintain 60FPS UI.
 */

// We simulate imports as workers often need bundled scripts
// In a real build, this would be a separate entry point.

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;

  try {
    switch (type) {
      case 'GENERATE_HASH': {
        const { data, previousHash } = payload;
        const result = await generateSHA256(data, previousHash);
        self.postMessage({ id, result });
        break;
      }
      case 'RECONSTRUCT_STOCK': {
        const { initial, events } = payload;
        const result = reconstructQuantity(initial, events);
        self.postMessage({ id, result });
        break;
      }
      case 'BLOOM_CHECK': {
        const { buffer, tenantId, size, hashCount } = payload;
        const result = mightContain(buffer, tenantId, size, hashCount);
        self.postMessage({ id, result });
        break;
      }
      default:
        self.postMessage({ id, error: 'Unknown Task' });
    }
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};

/** 🧮 Bitwise Bloom Filter Logic (Sync) */
function mightContain(buffer: Uint8Array, val: string, size: number, hashCount: number): boolean {
    for (let i = 0; i < hashCount; i++) {
        let h = i; // seed
        for (let j = 0; j < val.length; j++) {
            h = (h << 5) - h + val.charCodeAt(j);
            h |= 0;
        }
        const idx = Math.abs(h % size);
        if (!(buffer[idx >> 3] & (1 << (idx & 7)))) return false;
    }
    return true;
}

/** 🔐 Pure SHA-256 (Async) */
async function generateSHA256(data: string, previousHash: string = ''): Promise<string> {
  const dataToHash = data + previousHash;
  const msgUint8 = new TextEncoder().encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  
  const bytes = new Uint8Array(hashBuffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/** 📦 Deterministic Stock Logic (Sync) */
function reconstructQuantity(initial: number, events: any[]): number {
  return events.reduce((acc, event) => {
    if (event.type === 'IN') return acc + event.quantity;
    if (event.type === 'OUT') return acc - event.quantity;
    return acc;
  }, initial);
}
