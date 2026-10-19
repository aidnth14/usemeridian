import { createClient } from '@libsql/client';

export const TURSO_DATABASE_URL = 
  import.meta.env.VITE_TURSO_DATABASE_URL || 
  'libsql://usemeridian-usemeridian.aws-us-east-1.turso.io';

export const TURSO_AUTH_TOKEN = 
  import.meta.env.VITE_TURSO_AUTH_TOKEN || 
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI0MTIwODIsImlkIjoiMDFhMTU0MTUtOWUwMS03MWE1LTljNGUtZjNhMzU3NWNmMjg5Iiwia2lkIjoiZzBteG5aX0M1azMwU0NnTmRFWjg4R2FRYUdRUTNMVG5Gb2ZVak5jNUtVdyIsInJpZCI6IjExNzkwNzRhLTY3MDktNDYyMy05NDI1LWQ5MTViNmFjNzBhZCJ9.76E8JWmjq5F4BQzFzRdb90oydhzJlBGgz_zV09ZVVvhu7_iBHwmH6oWv61xxSNOAdhzKO7WAoA0-BKZmV2KbBQ';

export const turso = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export interface DatabaseStatus {
  connected: boolean;
  engine: string;
  url: string;
  region: string;
  latencyMs: number;
  serverTime?: string;
  sqliteVersion?: string;
  error?: string;
}

export async function pingTurso(): Promise<DatabaseStatus> {
  const start = performance.now();
  try {
    const res = await turso.execute("SELECT datetime('now') as now, sqlite_version() as version");
    const latency = Math.round(performance.now() - start);
    const row = res.rows[0];
    return {
      connected: true,
      engine: 'Turso (libSQL)',
      url: TURSO_DATABASE_URL,
      region: 'aws-us-east-1',
      latencyMs: latency,
      serverTime: row ? String(row.now) : undefined,
      sqliteVersion: row ? String(row.version) : undefined,
    };
  } catch (err: unknown) {
    return {
      connected: false,
      engine: 'Turso (libSQL)',
      url: TURSO_DATABASE_URL,
      region: 'aws-us-east-1',
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
