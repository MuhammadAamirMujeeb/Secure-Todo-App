import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_HEX_LENGTH = 64;
const IV_BYTES = 12;
const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be a ${KEY_HEX_LENGTH}-character hex string (32 bytes). ` +
        "Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Generates a unique random 12-byte IV per call.
 * Returns the result as "iv:authTag:ciphertext" (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  if (plaintext === "") {
    throw new Error("Cannot encrypt an empty string");
  }

  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypts a value previously produced by encrypt().
 * Expects the format "iv:authTag:ciphertext" (all hex-encoded).
 * Throws if the format is invalid or authentication fails.
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) {
    throw new Error("Cannot decrypt an empty string");
  }

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted format — expected 'iv:authTag:ciphertext'"
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted value: one or more segments are empty");
  }

  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
