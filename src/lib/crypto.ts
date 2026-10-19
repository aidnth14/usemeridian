// Client-side, zero-knowledge encryption for certificate data.
//
// The server only ever stores/returns opaque ciphertext. The AES-GCM key is
// generated in the browser, never sent to the server, and travels only in the
// URL fragment (#k=...) of the share link - fragments are never included in
// HTTP requests per the URL spec, so the server genuinely cannot decrypt what
// it stores, and neither can anyone with direct database access. AES-GCM is
// an authenticated cipher: any tampering with stored ciphertext (whether at
// rest or by someone editing the row directly) makes decryption fail loudly
// rather than silently returning altered content.

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

function bufToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuf(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToBase64url(raw);
}

export async function importKey(base64url: string): Promise<CryptoKey> {
  const raw = base64urlToBuf(base64url);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

// Output format: base64url(iv) + "." + base64url(ciphertext+authtag)
async function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${bufToBase64url(iv.buffer)}.${bufToBase64url(ciphertext)}`;
}

async function decryptString(key: CryptoKey, blob: string): Promise<string> {
  const [ivPart, dataPart] = blob.split('.');
  if (!ivPart || !dataPart) throw new Error('malformed ciphertext');
  const iv = new Uint8Array(base64urlToBuf(ivPart));
  const data = base64urlToBuf(dataPart);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(plainBuf);
}

// Mirrors the backend's id format (10 random digits + a 6-digit/4-letter key)
// so the client can bake the final share URL's QR code into the snapshot
// *before* the certificate is created, instead of only learning the id after.
function randomIndex(max: number): number {
  // Rejection sampling against a 32-bit random value to avoid modulo bias.
  const limit = Math.floor(0x100000000 / max) * max;
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return value % max;
}

export function generateCertificateId(): string {
  const digits = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomFrom = (alphabet: string, n: number) =>
    Array.from({ length: n }, () => alphabet[randomIndex(alphabet.length)]).join('');
  return randomFrom(digits, 10) + randomFrom(digits, 6) + randomFrom(letters, 4);
}

export async function newSessionKey() {
  const key = await generateKey();
  const exported = await exportKey(key);
  return { key, exported };
}

export async function encryptJSON(key: CryptoKey, value: unknown): Promise<string> {
  return encryptString(key, JSON.stringify(value));
}

export async function decryptJSON<T>(key: CryptoKey, blob: string): Promise<T> {
  return JSON.parse(await decryptString(key, blob)) as T;
}

export { encryptString, decryptString };
