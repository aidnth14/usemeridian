# Meridian

> The precision interface — Unified TypeScript Frontend and Django Backend.

Deployed at: **[usemeridian.vercel.app](https://usemeridian.vercel.app)**  
GitHub: **[aidnth14/usemeridian](https://github.com/aidnth14/usemeridian)**

---

## Architecture

- **Frontend**: React 19 + TypeScript 5.7 + Vite + Tailwind CSS
- **Backend**: Django 6.1.2 running inside an isolated Python virtual environment (`.venv`)
- **Hosting & Edge**: Vercel (`usemeridian.vercel.app`)

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
# Activate virtualenv (macOS/Linux)
source .venv/bin/activate

# Or run directly with npm scripts
npm run backend:migrate
npm run backend
```

The Django API runs at `http://127.0.0.1:8000/`.  
API status endpoint: `http://127.0.0.1:8000/api/status/`

---

## Deployment to Vercel

All updates are deployed directly to `usemeridian.vercel.app`:

```bash
vercel --prod
```
