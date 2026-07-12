# Amrutam Backend

Production-grade telemedicine backend — Node.js, Express, PostgreSQL, Redis.

## Quick Start (Docker — recommended)

\`\`\`bash
git clone <repo-url>
cd amrutam
cp backend/.env.example backend/.env   # fill in JWT_SECRET, ENCRYPTION_KEY (see below)
docker compose up -d --build
\`\`\`

Backend: `http://localhost:5000`
Jaeger UI (traces): `http://localhost:16686`
Metrics: `http://localhost:5000/metrics`

Generate secrets for `.env`:
\`\`\`bash
openssl rand -hex 32   # use for both JWT_SECRET and ENCRYPTION_KEY (generate separately for each)
\`\`\`

## Local Development (without Docker for the app)

\`\`\`bash
docker compose up -d postgres redis jaeger   # infra only
cd backend
npm install
npm run migrate:up
npm run dev
\`\`\`

## Running Tests

\`\`\`bash
cd backend
npm test
\`\`\`

## API Documentation

- OpenAPI schema: `docs/openapi.yaml` (preview with `npx @redocly/cli preview-docs docs/openapi.yaml`)
- Architecture: `docs/architecture.md`
- ER diagram: `docs/er-diagram.md`
- Threat model: `docs/threat-model.md`
- Security checklist: `docs/security-checklist.md`

## Project Structure

\`\`\`
backend/src/modules/    — feature modules (auth, doctors, bookings, consultations, prescriptions, users, audit, analytics)
backend/src/middlewares/
backend/migrations/     — node-pg-migrate migrations (run in order via npm run migrate:up)
backend/tests/          — Jest + Supertest integration tests
docs/                   — architecture, ER diagram, threat model, security checklist, OpenAPI
.github/workflows/      — CI pipeline (migrations + tests + npm audit + docker build)
\`\`\`

## Core Workflows Implemented

- User lifecycle: registration, login, MFA (TOTP), permission-based RBAC
- Doctor availability & booking: idempotency-key protected writes, Redis distributed lock + Postgres row lock for concurrency safety
- Consultation lifecycle & prescriptions: state-machine-enforced status transitions
- Search & filtering: typo-tolerant fuzzy doctor search (Postgres trigram)
- Compliance & audit trails: transaction-safe audit logging on all sensitive actions
- Admin analytics: cached aggregate metrics (revenue, cancellation rate, top specialties)

## Key Design Decisions

- **Idempotency**: all booking writes require an `Idempotency-Key` header; retries return the original cached response instead of creating duplicates.
- **Concurrency & sagas**: booking is a Redis-locked, Postgres-transactional saga — a failed payment rolls back the entire booking, including reopening the slot.
- **Observability**: structured logs (pino), Prometheus metrics (`/metrics`), OpenTelemetry traces (Jaeger) — all correlated by request ID.
- **Security**: bcrypt password hashing, AES-256-GCM encrypted MFA secrets, rate limiting (stricter on auth routes), zod input validation on every mutating endpoint.

See `docs/architecture.md` for the full design, including retry/backoff strategy, caching, data partitioning, and backup/DR strategy.

## Environment Variables

See `backend/.env.example` for the full list. Required: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`.
