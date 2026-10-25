---
name: phase-kickoff
description: Start a Go-migration phase or sub-step. Loads the migration plan and ADRs, checks git state, resolves the phase's open questions, then plans the work. Use at the start of every migration session.
---

# Phase kickoff

The user names a phase or sub-step (e.g. `3`, `3a items`). If none was given, ask which one.

## 1. Load context (read, do not skim)

1. `docs/migration-plan.md`: the whole file. Find the target phase, its exit criteria, its status, any phase-log "next steps" left by a previous session, and every open question tagged with this phase.
2. `docs/adr/README.md` and every ADR whose `Phase:` line includes this phase or that the phase section links to.
3. `docs/workflow.md`: the "Implement" watch-list, which applies to you.
4. For phases after the first, the most recent `docs/learning/phase-*.md`, to see how the previous phase actually turned out.

## 2. Check reality

- Run `git status` and `git branch --show-current`. If you're on `main` or the working tree is dirty, stop and tell the user. Don't create branches or stash anything yourself.
- Check that earlier phases the plan depends on are actually ✅. If the plan says ✅ but the code disagrees, report the mismatch before planning.
- Read the code areas the phase will touch, so the plan rests on what the code does now and not on assumptions.

## 3. Resolve open questions

- Ask the user about every open question tagged for this phase, plus any new ones that came up while reading, in one batch. For each, offer concrete options and a recommendation.
- Answers that are hard to reverse or affect more than this phase must become ADRs. Include writing them as steps in the plan.

## 4. Plan

Write the plan with:

- **Scope.** What this session delivers, mapped to the phase's exit criteria. If the phase is too big for one session (more than about 8–10 steps or several subsystems), propose sub-steps and plan only the first.
- **Out of scope.** Anything adjacent that you'll deliberately leave alone.
- **Steps**, in order, naming concrete files, packages, endpoints, and migrations.
- **Verification**, for each exit criterion: the exact command, request, or UI flow that proves it, and what result to expect.
- **Doc updates** that close-out will need to make (plan status, ADRs, `AGENTS.md` sections, learning note topics).
- **Risks.** Data loss, auth or ownership holes, downtime, RAM budget.

Rules:
- Never plan work that contradicts an Accepted ADR. Either follow it, or include a superseding ADR in the plan and flag it explicitly.
- Every new query or endpoint must enforce `user_id` ownership and have a test for it.
- Generated files (`database.types.ts`, OpenAPI codegen output) are always regenerated, never edited by hand.
- Check the plan's "Post-MVP backlog" table for constraints that fall in this phase, and include them. Don't build backlog features themselves during an MVP phase.

Propose the plan for approval. Don't start implementing until it's approved.
