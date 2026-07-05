# Specification for TTT-6: Chat window colors

## Summary

Replace the current monochrome (near-white/grey/black) color scheme of the chat application with a more visually attractive, modern palette. The change is purely cosmetic -- no functionality, layout, or component structure changes.

## Goals

- Introduce a warm, modern color palette that replaces the current grey/white/black monotone theme.
- Make the chat window feel more inviting and visually engaging.
- Maintain WCAG AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text) so readability is not sacrificed for aesthetics.
- Keep all styling changes within the existing single-file CSS approach (`apps/web/src/App.css`).

## Non-Goals

- No dark mode or theme toggle (out of scope for this story).
- No layout or structural changes to components.
- No new CSS files, CSS modules, CSS-in-JS, or CSS variable systems (keep the plain CSS single-file pattern).
- No changes to component logic, props, or TypeScript code.
- No responsive breakpoint changes.

## User Flow

1. User opens the chat application.
2. The page background, message bubbles, form inputs, and buttons display an updated, colorful palette instead of the previous grey/white/black scheme.
3. The application remains fully readable and all interactive elements remain clearly distinguishable.

## Functional Requirements

### FR-1: Page background
Replace the flat `#f5f5f5` body background with a subtle gradient or soft colored background that gives the page more visual depth. Suggested direction: a light warm gradient (e.g., soft lavender-to-light-blue, or peach-to-cream) rather than a single flat grey.

### FR-2: Message bubbles
Replace the white (`#fff`) message item background with a light tinted color (e.g., soft blue, light lavender, or warm cream). Remove or soften the hard `#ddd` border in favor of a subtler shadow or tinted border that matches the new palette.

### FR-3: Primary action color (button/focus)
Replace the current `#0070f3` blue with a warmer or more distinctive accent color (e.g., a coral, teal, or violet) for the send button and input focus ring. The hover state should be a darker shade of the same family.

### FR-4: Disabled button state
Update the disabled button color from flat `#aaa` to something that clearly belongs to the new palette while remaining visually muted (e.g., a desaturated version of the new accent color).

### FR-5: Secondary text colors
Update `#666`, `#888` (used for loading, no-messages, timestamps) to a color that harmonizes with the new palette while maintaining sufficient contrast against the new backgrounds.

### FR-6: Error state
Update the error banner colors (`#fee` background, `#e88` border, `#a00` text) to remain semantically red/warning-toned but feel cohesive with the new palette (slightly warmer or more modern red tones).

### FR-7: Header / title
The `h1` title may optionally receive a color treatment (e.g., the accent color or a complementary shade) rather than the default near-black `#222`.

## Acceptance Criteria

1. The chat application body background is no longer a flat near-white grey; it uses at least two colors (gradient or multi-stop).
2. Message bubbles have a visible tinted background color (not white, not grey).
3. The send button uses a new accent color distinct from the previous `#0070f3` blue.
4. All text/background combinations meet WCAG AA contrast ratio (4.5:1 for body text, 3:1 for large text and UI components).
5. The error state remains visually distinct and recognizable as an error/warning.
6. No changes to HTML structure, component props, or JavaScript/TypeScript logic.
7. All changes are confined to `apps/web/src/App.css`.
8. Existing tests continue to pass without modification.

## Edge Cases

- **High-DPI displays:** Gradients should be smooth (no visible banding). Use enough color stops or a wide-enough range.
- **Very long message lists:** The background gradient should not appear to "end" or create an awkward seam; use `min-height: 100vh` or `background-attachment: fixed` as appropriate.
- **Small screens (mobile):** Colors must remain legible on smaller viewports. No additional responsive changes are needed beyond what already exists; just ensure the new colors don't create issues at the existing 480px breakpoint.

## Dependencies

- None. This is a self-contained CSS-only change with no new packages or external resources.

## Open Decisions

- The exact color palette values are an implementation choice. The spec provides direction (warm, modern, colorful) but leaves the specific hex values to the implementation/plan stage for designer or reviewer approval.

## Implementation Notes

- Source file: `apps/web/src/App.css` (ref: current full content reviewed above).
- The existing CSS uses no variables; introducing a small set of CSS custom properties (e.g., `--bg-gradient-start`, `--accent`) at the top of the file would be acceptable as a lightweight organizational improvement, but is not required.
- A useful contrast checker: https://webaim.org/resources/contrastchecker/
- Preserve the existing selector structure (`.app`, `.message-item`, `.message-form button`, etc.) so the changes are purely color-value swaps and gradient additions.
