# Story 3.1: Keyboard operability and visible focus indicators (FR-12)

Status: review

## ACs
1. Tab order is logical: input → Add button → first todo toggle → first todo delete → next todo toggle → ...
2. Enter on the input creates the todo.
3. Space (and Enter) toggles a focused checkbox.
4. Enter on a focused delete button removes the todo.
5. Every interactive element has a visible focus indicator.

## Implementation
- Added `apps/client/src/test/e2e/keyboard.spec.ts` with five tests covering each AC.
- Tab-order test skipped on WebKit (macOS Safari skips form controls in default Tab order unless system "Full Keyboard Access" is enabled — the app's Tab order is correct regardless).
- All `focus-visible:outline-*` Tailwind classes were already in place from Stories 2.3–2.10; this story is verification, not new wiring.

## Verification
33 e2e cases (3 browsers × 11 specs); 32 pass + 1 webkit-skipped. 117 unit tests still green.
