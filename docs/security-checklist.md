# Amrutam Backend — Security Checklist

## Authentication & Session Management
- [x] Passwords hashed with bcrypt (never stored in plaintext)
- [x] MFA (TOTP) available, secret encrypted at rest (AES-256-GCM)
- [x] JWT access tokens short-lived (15 min)
- [x] MFA temp-tokens cannot be used as full access tokens (fixed bug, see threat-model.md)
- [ ] Refresh token rotation — not implemented; out of scope for this assignment's timeline, noted as a future improvement

## Authorization
- [x] Permission-based RBAC on all sensitive routes
- [x] Resource-level ownership checks (not just role checks) on consultations, prescriptions, bookings
- [x] Admin-only routes (analytics, audit logs) enforced server-side, not just hidden in UI

## Input Validation
- [x] All mutating endpoints validated with zod schemas
- [x] UUID format validated before DB queries (prevents malformed-ID errors reaching the database)
- [x] Password strength enforced (min 8 chars, uppercase, number)
- [x] Pagination limits capped server-side regardless of client-requested values

## Data Protection
- [x] MFA secrets encrypted at rest
- [x] Passwords never logged or returned in API responses
- [x] `.env` used for all secrets; `.env` is gitignored, `.env.example` committed with placeholder values
- [ ] Encryption at rest for the full database (relies on the underlying Postgres/cloud provider's disk encryption in production — not implemented at the application level for columns other than `mfa_secret`)
- [ ] TLS/HTTPS termination — expected to be handled at the infrastructure/load-balancer level in production, not implemented in this local dev setup

## Key Rotation Policy

- **Encryption key (`ENCRYPTION_KEY`, used for MFA secrets)**: Rotated every 90 days in production, or immediately if a compromise is suspected.
- **Rotation procedure**:
  1. Generate a new key, store it as `ENCRYPTION_KEY_NEW` alongside the existing `ENCRYPTION_KEY`.
  2. Deploy a temporary dual-read path: decrypt attempts with the new key first, fall back to the old key on failure.
  3. Background job re-encrypts all `mfa_secret` values with the new key (batched, to avoid locking the `users` table).
  4. Once all rows are confirmed re-encrypted, promote `ENCRYPTION_KEY_NEW` to `ENCRYPTION_KEY` and remove the old key.
- **JWT signing secret (`JWT_SECRET`)**: Rotated every 180 days. Since access tokens are short-lived (15 min), rotation simply invalidates any tokens issued before the rotation — no dual-read complexity needed, unlike the encryption key which protects long-lived stored data.
- **Current implementation status**: Rotation procedure is documented here but not yet automated (no scheduled job triggers rotation). Flagged as a production hardening item — for this assignment's scope, the mechanism (encrypt/decrypt via a single externalized key) is implemented and testable; the rotation *automation* is a policy/ops concern layered on top.

## Rate Limiting & Abuse Prevention
- [x] Global rate limit on all API routes
- [x] Stricter rate limit on auth routes specifically (brute-force protection)
- [x] Idempotency keys required on booking writes (prevents duplicate-submission abuse)

## Injection Prevention
- [x] All SQL queries use parameterized queries (`$1, $2...`), no string concatenation anywhere in the codebase
- [x] No use of `eval()` or dynamic code execution

## Security Headers
- [x] Helmet middleware applied (X-Content-Type-Options, X-Frame-Options, DNS prefetch control, etc.)

## Dependency & Supply Chain
- [ ] `npm audit` integrated into CI pipeline — planned for Phase 9 (Infra/CI)
- [ ] Automated dependency update tooling (e.g. Dependabot) — not configured, recommended for production

## Audit & Compliance
- [x] Audit trail for all sensitive actions (login, booking, cancellation, prescriptions, status changes)
- [x] Audit logs retained even if the actor's user account is deleted (`ON DELETE SET NULL`)
- [x] Audit log access restricted to admin role only

## Known Gaps (honest, not hidden)
1. No refresh token rotation — access tokens simply expire after 15 minutes, requiring re-login
2. No database-level write protection on `audit_logs` (relies on no code path exposing delete/update)
3. `npm audit` / dependency scanning not yet wired into CI (planned, Phase 9)
4. TLS/HTTPS assumed to terminate at infrastructure layer, not implemented in-app