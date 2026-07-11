# Amrutam Backend — Threat Model

Threat modeling done using the STRIDE framework. Each threat category lists the specific attack
surface in this system and the concrete mitigation implemented.

## Attack Surface Overview

- **Public endpoints**: registration, login, doctor search, doctor availability listing
- **Authenticated endpoints**: booking, consultations, prescriptions, profile management
- **Admin-only endpoints**: analytics, audit log access
- **Sensitive data**: passwords, MFA secrets, prescription details, payment amounts

## S — Spoofing (pretending to be someone else)

| Threat | Mitigation |
|---|---|
| Attacker steals/guesses a password and logs in as another user | Passwords hashed with bcrypt (cost factor 10, never stored/logged in plaintext); MFA (TOTP) available as a second factor |
| Attacker uses a stolen JWT after it should be invalid | Short-lived access tokens (15 min expiry); temp tokens issued mid-MFA-flow are explicitly rejected by the `authenticate` middleware if used as a full access token (see Known Issues below) |
| Attacker brute-forces login credentials | `authLimiter` rate-limits `/api/auth/*` to 10 requests/15min per IP in production |

## T — Tampering (unauthorized data modification)

| Threat | Mitigation |
|---|---|
| Attacker modifies another user's booking/consultation/prescription via crafted requests | Every mutating service function checks resource ownership (`patient_id`/`doctor_user_id`) before allowing changes, not just authentication |
| Attacker sends malformed/malicious input to corrupt data | All mutating endpoints validated with zod schemas before reaching business logic |
| Attacker races two booking requests for the same slot to create inconsistent state | Redis distributed lock + Postgres `SELECT ... FOR UPDATE` row lock double-protect against double-booking |
| Attacker retries a request expecting a different side effect than the first attempt | Idempotency-Key required on all booking writes; identical key returns the cached original response |

## R — Repudiation (denying an action was performed)

| Threat | Mitigation |
|---|---|
| A doctor denies writing a prescription, or a patient denies cancelling a booking | `audit_logs` table records actor, action, and metadata for all sensitive actions (login, booking, cancellation, status changes, prescriptions); logs are written inside the same DB transaction as the action itself where applicable, so they cannot be inconsistent with actual state |
| Audit logs themselves are tampered with or deleted | `audit_logs.actor_id` uses `ON DELETE SET NULL` (not CASCADE) so records persist even if the user account is later deleted. *(Not yet implemented: write-once/append-only enforcement at the DB permission level — noted as a future improvement.)* |

## I — Information Disclosure (exposing data to unauthorized parties)

| Threat | Mitigation |
|---|---|
| MFA secrets readable if the database is compromised | MFA secrets encrypted at rest with AES-256-GCM before storage; the encryption key lives outside the database (environment variable) |
| A patient can read another patient's consultation/prescription via ID guessing | Ownership checks (`isPatient`/`isDoctor`) enforced in the service layer for every read of consultation/prescription data |
| Verbose error messages leak internal details (stack traces, SQL, file paths) | Central `errorHandler` middleware returns only `message` and `statusCode`; stack traces are logged server-side via pino, never sent to the client |
| Sensitive fields (passwords, MFA secrets) accidentally returned in API responses | Repository/service layer explicitly constructs response objects rather than returning full DB rows (e.g. `registerUser` returns `{id, email, role}` only, never the row with `password_hash`) |

## D — Denial of Service

| Threat | Mitigation |
|---|---|
| Attacker floods the API with requests | `generalLimiter` (200 req/15min/IP in production) applied globally; stricter `authLimiter` on auth routes |
| Attacker requests unbounded result sets to exhaust memory/DB | Pagination `limit` capped server-side (max 50 for search, max 100 for audit logs, max 90 days for analytics ranges), regardless of what the client requests |
| Attacker holds a slot lock indefinitely by never completing a booking | Redis lock has a hard 10-second TTL; it auto-releases even if the request crashes mid-transaction |

## E — Elevation of Privilege

| Threat | Mitigation |
|---|---|
| A patient calls an admin/doctor-only endpoint directly | Permission-based RBAC (`requirePermission` middleware) checked on every sensitive route, independent of what the UI exposes |
| A user modifies their own JWT to claim a different role | JWT is signed with `JWT_SECRET` (HMAC-SHA256); any tampering invalidates the signature and `jwt.verify()` rejects it |
| A doctor updates a consultation they are not assigned to | `updateConsultationStatus` explicitly compares `consultation.doctor_user_id` to the requester before allowing any status transition |

## Known Issues / Accepted Risks (documented, not hidden)

- **MFA temp-token bypass** — discovered during manual testing in Phase 4, fixed by rejecting `stage: 'mfa_pending'` tokens in the `authenticate` middleware. Documented here as an example of the kind of issue this threat model is designed to catch.
- **Mock payment gateway** — `simulateFailure` exists for demo/testing purposes only and is gated behind `NODE_ENV !== 'production'`. A real integration would need webhook signature verification (a new spoofing/tampering surface not modeled here since no real gateway is integrated).
- **Audit log immutability** — currently relies on application-level discipline (no code path exposes `DELETE`/`UPDATE` on `audit_logs`), not database-level write protection (e.g. a separate DB role with INSERT-only grants). Flagged as a production hardening item.