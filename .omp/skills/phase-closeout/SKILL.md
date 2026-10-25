---
name: phase-closeout
description: Finish a Go-migration session. Verifies exit criteria, updates migration plan status/log, ADRs, AGENTS.md, writes the phase learning note, runs checks, drafts the PR description. Use at the end of every migration session, including partial ones.
---

# Phase close-out

Run every step, even when the session only finished part of the phase.

## 1. Verify

- For each exit criterion of the current phase or sub-step in `docs/migration-plan.md`, run the verification the plan defined and record the actual result (command plus key output).
- Run the repo checks that exist at this point:
  - frontend: `npm run lint`, `npm run test:run`, `npm run build`. Run them inside `web/` once the SPA has moved there.
  - backend, if `backend/` exists: `go vet ./...`, `golangci-lint run`, `go test ./...`.
- If anything fails, fix it or report it. Never mark an unverified criterion as done.

## 2. Update `docs/migration-plan.md`

- **Status:** set the phase to ✅ only if every exit criterion is verified. Otherwise 🟡, with what remains.
- **Phase log:** append one line: date, branch or PR, one sentence on any deviation from the plan.
- **Partial work:** if the phase isn't done, write precise "next steps" under its log line for the next kickoff to pick up.
- **Open questions:** remove the ones resolved this session. Add any new ones, tagged with the phase that should resolve them.
- **Scope changes:** edit the phase sections to match what was actually decided. The plan should describe the real path, not the original guess.

## 3. ADRs

- Every decision made this session that is hard to reverse or affects more than one phase gets an ADR, written from the template in `docs/adr/README.md` and added to its index.
- If a decision changed an existing ADR, write a new superseding ADR and set the old one's status to `Superseded by NNNN`. Never rewrite an Accepted ADR's decision.

## 4. `AGENTS.md`

- Update the root `AGENTS.md` (and `backend/AGENTS.md` or `web/AGENTS.md` if they exist) so it describes the repo **as it is now**:
  - architecture and data-flow diagram
  - key directories and important files
  - dev commands
  - conventions
  - known inconsistencies
- Remove statements that are no longer true, for example Supabase call sites that are now API calls. Keep the migration pointer section current.

## 5. Learning note

Write or extend `docs/learning/phase-N-<slug>.md`. The audience is the user, a backend engineer with Java and microservices experience who is new to Go. Cover:

- **What was built:** the files and packages, and how a request flows through them.
- **Go idioms and libraries** used, with the closest Java/Spring equivalent where that helps.
- **Key design trade-offs** and the alternatives that were rejected.
- **Ops concepts touched**, if any: k8s objects, Flux, SOPS, Postgres.
- **Questions to ask myself, and suggested exercises**, for example "change X and predict what the test does".

Keep it focused: a walkthrough, not a reference manual.

## 6. Hand off

Report to the user:

- a verification table (criterion, evidence, ✅ or ❌)
- the docs changed
- a drafted PR title and description (what changed, how it was verified, docs updated, follow-ups)

Don't commit, push, or open the PR unless the user asks. The user reviews the diff first.

If the user asks you to commit and open the PR:

1. Show the exact commit message(s) and wait for approval, then commit and push the branch.
2. Show the exact PR title and body, apply the user's edits, and wait for explicit approval.
3. Only then run `gh pr create`. Report the PR URL and CI status, and stop.

**Never merge the PR.** No `gh pr merge`, no `--auto`, no merging through the API or web UI, no deleting the branch afterwards, and never push to `main`. Merging is the user's decision alone, even when every check is green. See `AGENTS.md` → "Git & Pull Requests".
