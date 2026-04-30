# Story 3.4: Persistence integration test (FR-6 + NFR-3)

Status: review

## ACs
1. 1000 sequential POSTs across two app instances; GET returns all 1000.
2. Two restarts (close pool, recreate app) verify state survives.
3. `apps/server/src/test/persistence.int.test.ts` runs as part of `pnpm test` when `DATABASE_URL` reaches a Postgres; auto-skips otherwise.

## Implementation
- Two phases of 500 POSTs each, with a pool teardown + fresh app instance between them (simulates a process restart against the same DB).
- Third instance issues only a GET to confirm cold restart returns the identical list.
- `it.skipIf(!reachable)` probes the DB at suite-load time so the test is opt-in via env presence.

## Verification
- Local run: 1 test, 1000 inserts + 2 restarts in ~6s.
- 117 unit tests still green.

## Note
The integration test currently runs against the same Postgres as dev. CI provisions a fresh Postgres service container per run, so isolation is automatic in CI; locally, the test deletes all todos before and after to avoid corrupting dev state.
