// src/utils/relayCrypto.ts
import crypto from "crypto";

export function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Hybrid encryption: AES-256-GCM for payload, RSA-OAEP(SHA256) for AES key.
 * Returns JSON string with base64 fields.
 */
export function encryptForAgent(publicKeyPem: string, payloadObj: any): string {
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8");

  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();

  const encKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey,
  );

  return JSON.stringify({
    encKey: encKey.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  });
}

export function makePairCode(): string {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${a}-${b}`;
}
