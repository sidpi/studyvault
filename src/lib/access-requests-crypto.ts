import "server-only";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getEncryptionKey() {
  const secret = process.env.ACCESS_REQUEST_ENCRYPTION_KEY;
  if (!secret) throw new Error("ACCESS_REQUEST_ENCRYPTION_KEY is missing.");
  const keyBytes = encoder.encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", keyBytes);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptPassword(plainText: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();
  const payload = encoder.encode(plainText);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return {
    password_ciphertext: toBase64(new Uint8Array(encrypted)),
    password_iv: toBase64(iv),
  };
}

export async function decryptPassword(ciphertext: string, iv: string) {
  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext),
  );
  return decoder.decode(decrypted);
}
