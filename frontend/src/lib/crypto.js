const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(bytes) {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 210_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt plaintext HTML → { content, iv, salt } (all base64 / strings). */
export async function encryptContent(plaintext, passphrase) {
  if (!passphrase) throw new Error('Passphrase required to encrypt');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(plaintext),
  );
  return {
    content: toBase64(new Uint8Array(cipher)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

/** Decrypt ciphertext using stored iv + salt. */
export async function decryptContent({ content, iv, salt }, passphrase) {
  if (!passphrase) throw new Error('Passphrase required to decrypt');
  const key = await deriveKey(passphrase, fromBase64(salt));
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(content),
  );
  return textDecoder.decode(plain);
}
