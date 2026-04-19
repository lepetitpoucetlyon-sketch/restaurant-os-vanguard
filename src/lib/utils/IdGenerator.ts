/**
 * 🔱 IdGenerator Service (Grade X - Singularity)
 * 
 * High-performance, collision-resistant identifier generator.
 * Utilizing native crypto.getRandomValues for sovereign entropy.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DEFAULT_SIZE = 21;

export const IdGenerator = {
    /**
     * Generates a secure random ID (NanoID standard).
     * @param size Length of the ID.
     */
    generate(size: number = DEFAULT_SIZE): string {
        const bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        let id = '';
        for (let i = 0; i < size; i++) {
            id += ALPHABET[bytes[i] % ALPHABET.length];
        }
        return id;
    },

    /**
     * Generates a prefixed ID (e.g., 'usr_...', 'res_...').
     */
    generateWithPrefix(prefix: string, size: number = DEFAULT_SIZE): string {
        return `${prefix}_${this.generate(size)}`;
    }
};
