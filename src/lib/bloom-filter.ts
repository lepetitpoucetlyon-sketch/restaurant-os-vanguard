// @ts-nocheck
/**
 * 🌸 Bloom Filter - Restaurant OS MCC
 * space-efficient probabilistic data structure for fleet-wide update tracking.
 * Target: 10,000 tenants with < 100KB footprint.
 */

export class FleetBloomFilter {
  private buffer: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(size: number = 100000, hashCount: number = 7) {
    this.size = size;
    this.hashCount = hashCount;
    this.buffer = new Uint8Array(Math.ceil(size / 8));
  }

  /**
   * Simple hash function for the filter
   */
  private hash(val: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < val.length; i++) {
      h = (h << 5) - h + val.charCodeAt(i);
      h |= 0; // Convert to 32bit int
    }
    return Math.abs(h % this.size);
  }

  /**
   * Adds an element (tenantId) to the filter
   */
  add(val: string) {
    for (let i = 0; i < this.hashCount; i++) {
        const h = this.hash(val, i);
        this.buffer[h >> 3] |= 1 << (h & 7);
    }
  }

  /**
   * Checks if an element (tenantId) possibly has an update
   */
  mightContain(val: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
        const h = this.hash(val, i);
        if (!(this.buffer[h >> 3] & (1 << (h & 7)))) return false;
    }
    return true;
  }

  /**
   * Alias for mightContain
   */
  has(val: string): boolean {
    return this.mightContain(val);
  }

  /**
   * Resets the filter for the next cycle
   */
  clear() {
    this.buffer.fill(0);
  }

  /**
   * Serialization for MasterBridge transport
   */
  serialize(): string {
    return btoa(String.fromCharCode(...this.buffer));
  }

  /**
   * Deserialization
   */
  static deserialize(data: string, size: number = 100000, hashCount: number = 7): FleetBloomFilter {
    const filter = new FleetBloomFilter(size, hashCount);
    const binary = atob(data);
    for (let i = 0; i < binary.length; i++) {
        filter.buffer[i] = binary.charCodeAt(i);
    }
    return filter;
  }
}
