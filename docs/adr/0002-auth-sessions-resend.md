# 0002. Own auth: email/password, cookie sessions, Resend

- Status: Accepted
- Date: 2026-10-23
- Phase: 2 (transition), 5 (implementation)

## Context

- Supabase Auth currently provides anonymous sign-in, email/password, password reset, and JWTs.
- Leaving Supabase means replacing it.
- The schema has foreign keys to `auth.users(id)` on `category_definitions`, `items`, `comparisons`, and `tags`.
- RLS policies and SQL functions call `auth.uid()`.
- Existing data must stay owned by the same user across the migration.

## Decision

**Transition (Phase 2–4).** The Go API verifies Supabase access tokens. It uses the project JWKS, or the legacy HS256 secret if the project hasn't migrated signing keys. The `sub` claim is the user ID.

**Own auth (Phase 5):**
- **Users table:** `public.users` (id uuid, email, password_hash, created_at, ...).
  - Seeded from `auth.users`, keeping the same UUIDs and the existing bcrypt hashes.
  - All `user_id` foreign keys are repointed to `public.users(id)`.
- **Sessions:**
  - The token is 32 random bytes, sent to the browser in a cookie (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`).
  - The database stores only the SHA-256 hash of the token, plus the expiry and last-seen time.
  - Sessions use a sliding expiry: each use pushes the expiry forward.
- **Passwords:**
  - New and changed passwords are hashed with argon2id.
  - Imported bcrypt hashes are accepted and rehashed to argon2id on the next successful login.
- **CSRF protection:** same-origin hosting, `SameSite=Lax` cookies, and an `Origin` header check on unsafe methods (POST, PUT, PATCH, DELETE).
- **Password reset:**
  - Delivered via Resend from a verified domain (SPF and DKIM records).
  - Single-use, high-entropy tokens, stored hashed, valid for 1 hour.
  - The response is the same whether or not the email exists.
- **Rate limiting:** on login, register, and reset, per IP. The IP is taken from `CF-Connecting-IP`, which is only trusted because the firewall admits traffic from Cloudflare IP ranges only.
- **Anonymous users are dropped for the MVP.** The data model stays ready for them (see [ADR-0008](./0008-anonymous-ready-identity.md)).

## Consequences

- No third-party auth dependency. The tradeoff is that the security-sensitive code is now mine and needs careful review and tests.
- Password reset depends on owning a domain with working DNS (Phase 1).
- RLS stops being the safety net once the API uses its own database role. Every query must filter by the authenticated user ID, and the ownership tests in Phase 2+ are mandatory.
- While Supabase is still live (Phases 5–6), credential tables in `public` are exposed through Supabase's Data API by default (automatic grants to `anon`/`authenticated`). They must be revoked from those roles and have RLS enabled with no policies, and REST access must be verified as denied before Phase 5 merges. See the Phase 5 security gate in the migration plan.
- Email verification on signup is deferred. It can be added later with the same token mechanism used for password reset.
