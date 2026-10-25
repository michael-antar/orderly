# 0009. URL layout: landing at `/`, SPA at `/app/`, API at `/api/`

- Status: Accepted
- Date: 2026-10-24
- Phase: 2
- Amends: [0004](./0004-single-vps-k3s-cloudflare.md) (SPA path only; same-origin hosting is unchanged)

## Context

A static, search-engine-indexable landing page is planned after the MVP. If it gets `/` while the SPA already lives at `/`, the SPA has to move, and moving it later breaks things that are hard to fix once they exist:

- **The PWA service worker** is scoped to `/` (`vite.config.ts`: `scope: '/'`, `start_url: '/'`). Installed copies keep serving the old app from that scope until the service worker is replaced.
- **Links already sent** in password-reset and (later) verification emails would point at the old paths.
- **Supabase Auth Site URL and redirect URLs** during the transition, plus Traefik routes, cookie paths, and bookmarks.

Choosing the layout before Phase 5 starts emailing links is cheap. Changing it afterwards is not.

## Decision

|Path|Served by|Indexed by search engines|
|---|---|---|
|`/`|Static landing page (HTML/CSS, no React)|Yes|
|`/app/`|React SPA (Vite `base: '/app/'`, PWA `scope` and `start_url` set to `/app/`)|No (`robots.txt` disallows it)|
|`/api/`|Go API|No|

- Phase 2 moves the SPA to `/app/`. Until the real landing page exists (post-MVP), `/` serves a minimal placeholder: either a small static page linking to `/app/`, or a redirect. Decide at the Phase 2 kickoff.
- One nginx image serves both the landing page and the SPA. The landing page becomes either a second Vite entry point or a separate folder of static files; that's decided post-MVP.
- Every link the backend emails (password reset, and later email verification or guest upgrade) points under `/app/`.

## Consequences

- The post-MVP landing page is purely additive: replace the placeholder at `/`, with no changes to the SPA, PWA, or auth.
- Phase 2 touches the Vite `base` setting, the PWA manifest, asset paths, the Supabase Auth URL settings, and the Traefik ingress paths.
- The SPA still needs no router for the MVP. If a router is added later (for search deep links), it routes under `/app/`.
