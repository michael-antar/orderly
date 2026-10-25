# 0008. Identity model ready for anonymous guests

- Status: Accepted
- Date: 2026-10-23
- Phase: 5 (data model), 8 (feature)

## Context

- Portfolio visitors are more likely to try the app if they can use it without signing up.
- Supabase anonymous sign-in currently provides this: a real `auth.users` row with no email, upgraded in place by `auth.updateUser`.
- Guest support is out of scope for the MVP. But if the identity model assumes every user has an email, adding guests later would mean migrating data between accounts.

## Decision

**Phase 5 (MVP) lays the groundwork:**

- **A guest is a normal `users` row** with `email` and `password_hash` NULL and `is_guest = true`. A check constraint requires email and password whenever `is_guest = false`, and email is unique where present.
- **Every owned row references `users.id`** regardless of whether the user is a guest. Nothing in catalog or ranking ever branches on guest status.
- **Upgrading is in place:** an `UPDATE` that sets email, password hash, and `is_guest = false` on the same row. No rows are copied or re-owned.
- **Sessions are the same for guests and registered users.** A guest session is an ordinary session for a guest user.
- **`GET /api/me` returns `is_guest`** from the start, so the frontend shape doesn't change later.

**Phase 8 (post-MVP) builds the feature:**

- `POST /api/guest-sessions` creates a guest user and session, protected by Cloudflare Turnstile and per-IP rate limiting.
- The upgrade endpoint, and a UI banner prompting guests to save their account.
- Seeded sample categories and items, so a guest sees a working demo immediately.
- A cleanup CronJob that deletes guests inactive for more than N days. Owned rows are removed by the existing `ON DELETE CASCADE` foreign keys.
- When a guest logs in to an existing account, the guest's data is discarded. Merging into the existing account is not supported.

## Consequences

- Phase 8 is a small addition, roughly a few days of work: one endpoint, the upgrade flow, Turnstile, the cleanup job, seed data, and a UI banner. No data migration is needed.
- The cost is now: Phase 5 must write the nullable-email schema and constraint, and the API must never assume `email` is present.
- Guests are the main abuse risk, through junk rows and signup spam. Turnstile, rate limits, cleanup, and per-user quotas (rows per category) are the defenses.
