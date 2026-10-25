# Architecture Decision Records

Short, numbered records of decisions that shape the migration. Format: Context → Decision → Consequences.

## Rules

- **Never rewrite an Accepted ADR's decision.** To change it, write a new ADR that supersedes the old one, then set the old one's status to `Superseded by NNNN`.
- **Create a new ADR when a decision:**
  - is hard to reverse, or
  - affects more than one module or phase, or
  - is something a future session might otherwise re-decide differently.
- **Don't create ADRs for small choices.** Library minutiae, naming, and similar belong in code comments or the plan.
- **Use the template below.** Keep ADRs under about one page.

## Index

|#|Title|Status|
|---|---|---|
|[0001](./0001-modular-monolith.md)|Go modular monolith first|Accepted|
|[0002](./0002-auth-sessions-resend.md)|Own auth: email/password, cookie sessions, Resend|Accepted|
|[0003](./0003-glicko-in-go.md)|Ranking logic moves from SQL/TypeScript into Go|Accepted|
|[0004](./0004-single-vps-k3s-cloudflare.md)|Single Hetzner VPS, k3s, Cloudflare, same-origin SPA|Accepted|
|[0005](./0005-gitops-flux-sops.md)|GitOps with minimal Flux and SOPS|Accepted|
|[0006](./0006-goose-migrations.md)|goose for database migrations|Accepted|
|[0007](./0007-no-persistent-staging.md)|No persistent staging environment|Accepted|
|[0008](./0008-anonymous-ready-identity.md)|Identity model ready for anonymous guests|Accepted|
|[0009](./0009-url-layout-landing-app-api.md)|URL layout: landing `/`, SPA `/app/`, API `/api/`|Accepted|

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD
- Phase: N

## Context
What forces are at play; what problem needs deciding.

## Decision
What we will do, stated plainly.

## Consequences
What gets easier, what gets harder, what we must now do.
```
