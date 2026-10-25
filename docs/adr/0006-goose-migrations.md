# 0006. goose for database migrations

- Status: Accepted
- Date: 2026-10-23
- Phase: 6 (Supabase CLI remains in use until then)

## Context

- Today the Supabase CLI applies migrations and records which ones have run.
- After the cutover, something else must track the schema version in each database, apply migrations in order, and avoid two runners migrating at the same time.
- Writing my own runner adds maintenance and teaches little.

## Decision

- **Tool:** `github.com/pressly/goose/v3`, embedded in a `backend/cmd/migrate` binary. Migrations are SQL files plus Go migrations for data reshaping, embedded with `embed.FS`.
- **Deployment:**
  - Migrations run as a Kubernetes Job before each API rollout. App pods never migrate on startup.
  - The Job creates the goose provider with `WithSessionLocker(lock.NewPostgresSessionLocker())`. **Without that option goose does no locking at all**, so this option is required. With it, goose uses a Postgres advisory lock.
- **Transactions:**
  - goose wraps each SQL migration in a transaction by default. Keep it that way.
  - Mark a migration `-- +goose NO TRANSACTION` only when Postgres requires it, for example `CREATE INDEX CONCURRENTLY`. Keep such migrations small and idempotent (`IF NOT EXISTS`).
- **Baseline:**
  - The first goose migration is a baseline of the `public` schema as it exists at cutover, with Supabase-specific objects removed (`auth.*` references, RLS policies tied to `auth.uid()`, Supabase roles and grants).
  - The old `supabase/migrations/` folder is archived, not replayed. Its initial migration contains invalid `CREATE TYPE IF NOT EXISTS` and would fail on a fresh database.
- **Rehearsal:** before any risky migration, restore last night's backup into a local Postgres and run the migration against it.

## Consequences

- Version tracking lives in `goose_db_version`.
- Locking only exists because the session locker is configured. Never remove that option.
- A failed migration that ran outside a transaction can leave partial changes. The recovery is a manual fix followed by a re-run, which is why non-transactional migrations must be idempotent.
- AI writes the migration SQL. goose only applies it.
