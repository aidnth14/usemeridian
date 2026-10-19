# Meridian

> The precision interface — Unified TypeScript Frontend, Django Backend, and Turso libSQL Cloud Database.

- Production URL: **[usemeridian-eight.vercel.app](https://usemeridian-eight.vercel.app)**
- Secondary Domain: **[use-meridian.vercel.app](https://use-meridian.vercel.app)**
- GitHub Repository: **[aidnth14/usemeridian](https://github.com/aidnth14/usemeridian)**

---

## Architecture

- **Frontend**: React 19 + TypeScript 5.7 + Vite + Tailwind CSS + `@libsql/client`
- **Backend**: Django 6.1.2 running inside an isolated Python virtual environment (`.venv`) with `libsql-client`
- **Database**: Turso libSQL Cloud (`libsql://usemeridian-usemeridian.aws-us-east-1.turso.io`)
- **Assets**: Security Guilloché certificate assets in `assets/` and `public/assets/`
- **Hosting & Edge**: Vercel

---

## Database (Turso libSQL)

The project is linked to the Turso libSQL Cloud database:

```env
TURSO_DATABASE_URL="libsql://usemeridian-usemeridian.aws-us-east-1.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERT..."
```

- **Python Client**: Available via `backend.config.turso.query_turso(sql)`
- **TypeScript Client**: Available via `src/lib/turso.ts` with direct browser execution via `@libsql/client/web`
- **API Endpoints**:
  - `GET /api/status/` — System and database health status
  - `GET /api/db/` — Database latency and cluster verification

---

## Local Development

### 1. Frontend (TypeScript + Vite)

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Typecheck and build for production
npm run build
```

### 2. Backend (Django)

```bash
# Run migrations & start Django API (http://127.0.0.1:8000)
npm run backend:migrate
npm run backend
```

---

## Deployment to Vercel

```bash
vercel --prod
```
