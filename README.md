# Earnings Analyst (Midas Agent)

AI-powered earnings call analyst: multi-step pipeline, live SSE progress, chat grounded in analysis, and markdown reports.

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, shadcn-style UI
- **Backend:** Express, TypeScript, custom LLM provider abstraction
- **Database:** Supabase (optional; in-memory mock when unset)

## Quick start

See [setup.md](setup.md) for API keys and Supabase.

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (new terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

Open http://localhost:3848 — default mock mode works without API keys (`USE_MOCK_DB`, `USE_MOCK_LLM`, `USE_MOCK_FETCH` in `backend/.env`).

## Tests

```bash
cd backend && npm test
cd frontend && npm test
cd evals && npm install && npm test
```

## Project layout

- `frontend/` — React app
- `backend/` — Express API and agent pipeline
- `evals/` — Eval runner and datasets
- `supabase/migrations/` — Database schema
- `technical_spec.md` — Full technical specification
