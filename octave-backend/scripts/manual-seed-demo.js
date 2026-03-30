const crypto = require("crypto");
const { Pool } = require("pg");
require("dotenv").config();

async function main() {
  const AES_KEY = Buffer.from(process.env.AES_SECRET_KEY, "hex");
  const HMAC_KEY = Buffer.from(process.env.HMAC_SECRET_KEY, "hex");
  const ALGORITHM = "aes-256-gcm";
  const IV_BYTES = 12;
  const SEPARATOR = ":";

  function encrypt(plaintext) {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(SEPARATOR);
  }

  function blindIndex(plaintext) {
    return crypto.createHmac("sha256", HMAC_KEY).update(plaintext.toLowerCase().trim()).digest("hex");
  }

  const rawEmail = "democfo@gmail.com";
  const rawRole = "SUPER_ADMIN";

  const emailHash = blindIndex(rawEmail);
  const emailEncrypted = encrypt(rawEmail.toLowerCase().trim());
  const roleEncrypted = encrypt(rawRole);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log(`🚀 Manually seeding ${rawEmail}...`);
    
    // Check if exists
    const res = await pool.query('SELECT id FROM "Admin" WHERE "emailHash" = $1', [emailHash]);
    
    if (res.rows.length > 0) {
      await pool.query(
        'UPDATE "Admin" SET "emailEncrypted" = $1, "roleEncrypted" = $2 WHERE "emailHash" = $3',
        [emailEncrypted, roleEncrypted, emailHash]
      );
      console.log("✅ Updated existing democfo user.");
    } else {
      const id = crypto.randomUUID();
      await pool.query(
        'INSERT INTO "Admin" (id, "emailHash", "emailEncrypted", "roleEncrypted") VALUES ($1, $2, $3, $4)',
        [id, emailHash, emailEncrypted, roleEncrypted]
      );
      console.log("✅ Inserted new democfo user.");
    }
  } catch (err) {
    console.error("❌ Database error:", err);
  } finally {
    await pool.end();
  }
}

main();
