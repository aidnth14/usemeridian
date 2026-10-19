// Vercel reserves /api/* for its own Serverless Functions convention and
// blocks rewrites to an external domain there (confirmed: vercel.json rewrite
// to the Render backend 404'd at the platform level). Calling Render directly
// instead - Django already allows it via CORS_ALLOW_ALL_ORIGINS. Empty string
// in dev keeps using Vite's /api proxy to the local backend.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const PERSON_FIELD_KEYS = [
  'legal-name', 'sex', 'birthdate', 'nationality', 'religion', 'father-name',
  'email', 'phone', 'address-1', 'address-2', 'postal-code', 'signature',
] as const;

export type PersonData = Record<(typeof PERSON_FIELD_KEYS)[number], string>;

export type SealTransform = { x: number; y: number; scale: number; rotation: number };

export type CertificateRecord = {
  id: string;
  key: string;
  certificateTemplate: string;
  sealTemplate: string;
  seal: SealTransform;
  groom: PersonData;
  bride: PersonData;
  createdAt: string;
};

function personFromValues(values: Record<string, string>, prefix: 'groom' | 'bride'): PersonData {
  const person = {} as PersonData;
  for (const key of PERSON_FIELD_KEYS) {
    person[key] = values[`${prefix}-${key}`] ?? '';
  }
  return person;
}

export function buildCertificatePayload(values: Record<string, string>, seal: SealTransform) {
  return {
    groom: personFromValues(values, 'groom'),
    bride: personFromValues(values, 'bride'),
    seal,
  };
}

// Render's free tier cold-starts after idling - a sleeping instance can take
// ~30-50s to wake. 60s gives real cold starts room without hanging forever.
const CREATE_TIMEOUT_MS = 60_000;

export async function createCertificate(values: Record<string, string>, seal: SealTransform) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CREATE_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/certificates/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCertificatePayload(values, seal)),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please try again in a moment.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to create certificate (${res.status})`);
  }
  return res.json() as Promise<{ id: string; key: string; createdAt: string }>;
}

export async function getCertificate(id: string): Promise<CertificateRecord | null> {
  const res = await fetch(`${API_BASE}/api/certificates/${encodeURIComponent(id)}/`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load certificate (${res.status})`);
  }
  return res.json() as Promise<CertificateRecord>;
}

// Flattens a fetched record's groom/bride fields back into the "groom-legal-name"
// style keys CertificateOverlay expects, so the view page can reuse it directly.
export function flattenCertificateValues(cert: CertificateRecord): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of PERSON_FIELD_KEYS) {
    values[`groom-${key}`] = cert.groom[key] ?? '';
    values[`bride-${key}`] = cert.bride[key] ?? '';
  }
  return values;
}
