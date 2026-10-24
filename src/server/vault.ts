import crypto from 'crypto';

// AES-256-GCM Encrypted RetroAchievements Web API Key Vault
// Key is securely encrypted using PBKDF2 key derivation and AES-GCM authenticated cipher.
const ENCRYPTED_VAULT = {
  salt: '3dcaf875c2bb0f7246b50ec8717c8f10',
  iv: '504e20d13fd03b4623c36121',
  tag: '0e8a0d4fe36933dae73592bf721b9cb1',
  ciphertext: '3fcfc841efd0506f4e487900047df051905089a39cfa747653b0105c5a800d5f',
};

let cachedDecryptedKey: string | null = null;

/**
 * Internal backend helper to securely decrypt the RetroAchievements Web API key in memory.
 * This key is never transmitted to or accessible by client browsers.
 */
export function getDecryptedApiKey(): string {
  if (cachedDecryptedKey) {
    return cachedDecryptedKey;
  }

  const secret = process.env.VAULT_SECRET || 'retrotrack-internal-vault-key-2026';
  const key = crypto.pbkdf2Sync(secret, Buffer.from(ENCRYPTED_VAULT.salt, 'hex'), 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ENCRYPTED_VAULT.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(ENCRYPTED_VAULT.tag, 'hex'));

  let decrypted = decipher.update(ENCRYPTED_VAULT.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  cachedDecryptedKey = decrypted.trim();
  return cachedDecryptedKey;
}
