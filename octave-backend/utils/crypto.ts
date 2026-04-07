

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "crypto";
import { ApiError } from "./AppError";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV — recommended for GCM
const TAG_BYTES = 16; // 128-bit auth tag — GCM default
export type AppRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "EXPENSE_VIEWER" | "STORE_MANAGER";

// ── Key loading ───────────────────────────────────────────────────────────────
// Called once at module load — throws immediately on startup if keys are missing
// or malformed, so the process never starts in an insecure state.

function loadKey(envVar: string, label: string): Buffer {
  const hex = process.env[envVar];
  if (!hex) {
    // 500: Internal Server Error (Missing configuration)
    throw new ApiError(
      `[crypto] Missing required environment variable: ${envVar}. ` +
        `Generate it with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      500,
    );
  }
  if (hex.length !== 64) {
    // 500: Internal Server Error (Misconfigured key length)
    throw new ApiError(
      `[crypto] ${label} must be exactly 64 hex characters (32 bytes). Got ${hex.length} chars.`,
      500,
    );
  }
  return Buffer.from(hex, "hex");
}

const AES_KEY = loadKey("AES_SECRET_KEY", "AES_SECRET_KEY");
const HMAC_KEY = loadKey("HMAC_SECRET_KEY", "HMAC_SECRET_KEY");

// Sanity check: the two keys must differ. Using the same key for both operations
// is a well-known cryptographic mistake.
if (AES_KEY.equals(HMAC_KEY)) {
  throw new ApiError(
    "[crypto] AES_SECRET_KEY and HMAC_SECRET_KEY must be different keys. " +
      "Reusing the same key for encryption and HMAC is a security vulnerability.",
    500,
  );
}

// ── Encrypted payload format ──────────────────────────────────────────────────
// Stored as a single colon-delimited base64 string:
//   <iv_base64>:<authTag_base64>:<ciphertext_base64>
// This keeps the stored value self-contained — no separate columns for IV/tag.

const SEPARATOR = ":";

// ── encrypt ───────────────────────────────────────────────────────────────────
// Returns a single string safe to store in a VARCHAR column.
// Each call produces a different ciphertext (random IV) even for the same input.

export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.length === 0) {
    throw new ApiError("[crypto] encrypt: plaintext must not be empty", 400);
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, AES_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(SEPARATOR);
}

// ── decrypt ───────────────────────────────────────────────────────────────────
// Throws on tampered data (auth tag mismatch) — never silently returns garbage.

export function decrypt(stored: string): string {
  if (!stored || !stored.includes(SEPARATOR)) {
    throw new ApiError(
      "[crypto] decrypt: invalid stored ciphertext format",
      400,
    );
  }

  const parts = stored.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new ApiError(
      "[crypto] decrypt: ciphertext must have exactly 3 parts (iv:tag:data)",
      400,
    );
  }

  const [ivB64, tagB64, dataB64] = parts;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");

  if (iv.length !== IV_BYTES) {
    throw new ApiError(`[crypto] decrypt: IV must be ${IV_BYTES} bytes`, 400);
  }
  if (authTag.length !== TAG_BYTES) {
    throw new ApiError(
      `[crypto] decrypt: auth tag must be ${TAG_BYTES} bytes`,
      400,
    );
  }

  const decipher = createDecipheriv(ALGORITHM, AES_KEY, iv);
  decipher.setAuthTag(authTag);

  // setAuthTag + final() performs the GCM integrity check.
  // If the ciphertext or tag was tampered with, this throws — do NOT catch it
  // silently. Let it propagate so the caller can treat it as a security event.
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ── blindIndex ────────────────────────────────────────────────────────────────
// HMAC-SHA256 of the plaintext using a separate secret key.
// Properties:
//   • Deterministic: same input → same hash (needed for DB WHERE queries)
//   • Keyed: without HMAC_SECRET_KEY the hash cannot be reproduced
//   • One-way: cannot reverse to plaintext
//
// Usage:
//   Store blindIndex(email) as emailHash in the DB.
//   At login: WHERE emailHash = blindIndex(submittedEmail)

export function blindIndex(plaintext: string): string {
  if (!plaintext || plaintext.length === 0) {
    throw new ApiError("[crypto] blindIndex: plaintext must not be empty", 400);
  }

  return createHmac("sha256", HMAC_KEY)
    .update(plaintext.toLowerCase().trim()) // normalise before hashing
    .digest("hex");
}

// ── encryptRole ───────────────────────────────────────────────────────────────
// Convenience wrapper — role is just a short string ('super_admin' | 'sub_admin')
// but we encrypt it so a DB dump reveals no RBAC structure.

export function encryptRole(role: AppRole): string {
  return encrypt(role);
}

// 3. Update decryptRole to check against the exact uppercase strings in the database
export function decryptRole(stored: string): AppRole {
  const plain = decrypt(stored);

  if (
    plain !== "SUPER_ADMIN" &&
    plain !== "FINANCE_ADMIN" &&
    plain !== "EXPENSE_VIEWER" &&
    plain !== "STORE_MANAGER"
  ) {
    throw new ApiError(
      `[crypto] decryptRole: unexpected role value after decryption (${plain})`,
      403,
    );
  }

  return plain as AppRole;
}

export const generateCrypto = (token: string | undefined) => {
  if (!token) {
    throw new ApiError("OTP value is required", 500);
  }

  return crypto.createHash("sha256").update(token).digest("hex");
};
// ── encryptEmail / decryptEmail ───────────────────────────────────────────────

export function encryptEmail(email: string): string {
  return encrypt(email.toLowerCase().trim());
}

export function decryptEmail(stored: string): string {
  return decrypt(stored);
}
