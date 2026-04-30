# Story 2.10: Visual distinction between active and completed todos (FR-5)

Status: review

## ACs
1. Completed todos render with `line-through` + reduced opacity on the title text.
2. Distinction is operable in greyscale (not color-only — strikethrough is the primary cue).
3. Contrast ratio between active and completed text states ≥ 3:1 (Tailwind's `text-gray-900` → `text-gray-500` clears 3:1).
4. Tests verify the conditional class application.

## Tasks
- [x] Update TodoItem to apply conditional classes
- [x] Test verifies completed and active variants

## Notes
Strikethrough satisfies the "not color-only" requirement (greyscale-operable). Opacity reduction reinforces — but isn't load-bearing.
