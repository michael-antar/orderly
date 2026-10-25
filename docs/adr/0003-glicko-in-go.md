# 0003. Ranking logic moves from SQL/TypeScript into Go

- Status: Accepted
- Date: 2026-10-23
- Phase: 4

## Context

Ranking logic is currently split across three places:

- **SQL:** `handle_comparison` is a `SECURITY DEFINER` plpgsql function with no ownership check. It does RD time decay, the Glicko-1 update, `comparison_count` / `last_compared_at`, and the audit insert.
- **TypeScript:** `useComparisonQueue` builds the pair queue (uncertain, similar, and random tiers; at most 100 pairs) and runs 3-round calibration with ±25% jitter.
- **Duplicated constants:** the confidence bands (RD 150/250) are copied into three components.

## Decision

- All ranking logic lives in `backend/internal/ranking`:
  - Glicko-1 update and RD decay as pure functions (no I/O), unit-tested with table-driven tests.
  - Pair-queue generation and calibration are server-side and exposed through API endpoints.
  - Confidence bands are defined once in Go and returned by the API, or exported as a single constant.
- A comparison runs in one database transaction:
  1. Lock both item rows with `SELECT … FOR UPDATE`, always in a fixed order (by id) to avoid deadlocks.
  2. Verify both items belong to the caller and to the same category.
  3. Apply the update and insert the `comparisons` audit row.
  4. Commit and return the new ratings.
- **Parity requirement:** before `handle_comparison` is retired, replay the stored `comparisons` history through the Go implementation. Each row already records rating and RD before and after. The Go results must match within a documented tolerance.
- Keep the algorithm itself unchanged during the port (Glicko-1, 350 initial RD, 30 minimum RD, 90-day decay constant). Any change to it is a separate ADR made after parity is achieved.

## Consequences

- Ranking becomes testable, observable through metrics and logs, and one language end to end. The missing ownership check is fixed as a side effect.
- The frontend loses `useComparisonQueue`'s logic and only renders the pairs it receives.
- Pair generation can now cache or reuse queue state server-side if needed. It starts stateless (recomputed per request) because the data is small.
- Parity may not be exact. The SQL `numeric` and Go `float64` types differ, and decay depends on timestamps. The tolerance is decided at Phase 4 kickoff.
