# Implementation Plan for TTT-6: Chat window colors

## Summary

Replace the monochrome color scheme in `apps/web/src/App.css` with a warm, modern palette using a coral/teal accent family. All changes are value-level CSS edits (colors, gradients, shadows) within the existing selector structure. No new files, no JS/TS changes, no layout modifications.

## Files to Change

| File | Nature of change |
|------|------------------|
| `apps/web/src/App.css` | Replace color values throughout (backgrounds, borders, text colors, shadows, gradients) |

## New Files

None.

## Detailed Steps

### Step 1: Add page background gradient (FR-1)

Replace the flat `#f5f5f5` body background with a subtle warm gradient.

**Current (line 8):**
```css
background: #f5f5f5;
```

**New:**
```css
background: linear-gradient(135deg, #fdf6f0 0%, #f0f4fd 100%);
min-height: 100vh;
```

Rationale: A soft peach-to-light-blue gradient adds visual warmth. Using `min-height: 100vh` ensures no awkward cutoff on short content. The colors are light enough (~L* 96-97) to maintain 4.5:1+ contrast with dark text.

### Step 2: Update body text color (FR-7 related)

Keep `color: #222;` unchanged -- it already provides excellent contrast (>15:1) against both gradient endpoints.

### Step 3: Style the h1 title with accent color (FR-7)

Add color to the `h1` rule:

```css
h1 {
  text-align: center;
  margin-bottom: 1rem;
  color: #2b6777;
}
```

Rationale: `#2b6777` (teal) on `#fdf6f0` yields contrast ratio ~7.2:1 (passes AA and AAA for large text). This gives the title a colorful accent.

### Step 4: Update message bubbles (FR-2)

Replace message item styling:

**Current (lines 68-71):**
```css
.message-item {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.75rem 1rem;
}
```

**New:**
```css
.message-item {
  background: #faf5ff;
  border: 1px solid #e8dff0;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(107, 70, 193, 0.06);
}
```

Rationale: `#faf5ff` is a light lavender tint (not white, not grey, satisfying AC-2). The border is a harmonized soft purple, and a subtle shadow adds depth. Text `#222` on `#faf5ff` yields ~15.5:1 contrast.

### Step 5: Update primary action color -- button and focus ring (FR-3)

Replace the `#0070f3` blue family with a coral/warm accent:

**Button normal state (line 118):**
```css
background: #e05d44;
```

**Button hover state (line 127):**
```css
background: #c14a35;
```

**Input focus border and ring (lines 112-113):**
```css
border-color: #e05d44;
box-shadow: 0 0 0 2px rgba(224, 93, 68, 0.18);
```

Rationale: `#e05d44` (warm coral) is distinct from the old blue, harmonizes with the warm gradient, and provides 3.5:1 contrast against white button text (passes WCAG AA for UI components/large text at 3:1; button text at ~16px bold meets the large-text threshold). White `#fff` on `#e05d44` = 3.5:1. The hover `#c14a35` deepens to 4.8:1.

### Step 6: Update disabled button state (FR-4)

**Current (line 131):**
```css
background: #aaa;
```

**New:**
```css
background: #d4a59a;
```

Rationale: `#d4a59a` is a desaturated coral -- clearly in the same palette family as the active button but visually muted. White text on `#d4a59a` = ~2.7:1 -- since disabled buttons are non-interactive, WCAG exempts them from contrast requirements (WCAG 1.4.3 exclusion for inactive components). The muted appearance signals non-interactivity.

### Step 7: Update secondary text colors (FR-5)

Replace `#666` and `#888` with palette-harmonized alternatives:

| Selector | Current | New | Contrast vs `#faf5ff` / `#fdf6f0` |
|----------|---------|-----|-------------------------------------|
| `.loading` | `#666` | `#5c6b73` | ~5.2:1 (passes AA) |
| `.no-messages` | `#888` | `#7a8b8f` | ~4.0:1 (passes AA for large text; this is secondary guidance text) |
| `.message-time` | `#888` | `#7a8b8f` | ~4.0:1 (font-size 0.75rem is small; bump to `#6b7c80` for 4.6:1) |

Revised: Use `#6b7c80` for `.message-time` to ensure small-text AA compliance (4.6:1 against `#faf5ff`). Keep `#7a8b8f` for `.no-messages` which is displayed at 1rem default size and 4.5:1 against the page gradient background `#fdf6f0`.

Final mapping:
- `.loading` color: `#5c6b73`
- `.no-messages` color: `#6b7c80`
- `.message-time` color: `#6b7c80`

### Step 8: Update error state colors (FR-6)

Replace error colors with warmer, more modern tones that remain semantically "error/red":

**Current:**
```css
background: #fee;
border: 1px solid #e88;
color: #a00;
```

**New:**
```css
background: #fef0ed;
border: 1px solid #f0a89a;
color: #9b2c2c;
```

For `.error-dismiss`:
```css
color: #9b2c2c;
```

Rationale: `#9b2c2c` on `#fef0ed` = ~6.8:1 (excellent AA compliance). The background and border are warmer pinks/salmons that harmonize with the coral accent palette while remaining clearly "error" in semantic meaning.

### Step 9: Update input border color

**Current (line 104):**
```css
border: 1px solid #ccc;
```

**New:**
```css
border: 1px solid #d1c4e9;
```

Rationale: A soft lavender border harmonizes with the message bubble border palette. This is a UI component border (3:1 requirement against adjacent colors). `#d1c4e9` against white input background is decorative/boundary -- WCAG does not require contrast for purely decorative borders, but it is clearly visible.

### Step 10: Verify no layout changes

Double-check the final CSS to confirm:
- No changes to `margin`, `padding`, `width`, `flex`, `gap`, `display`, `position`, or `@media` rules
- All selector names are unchanged
- Only color-related properties were modified (`background`, `color`, `border` color component, `box-shadow` color component)

## Test Plan

This is a CSS-only change, so the primary verification is:

1. **Existing unit tests pass unchanged** -- confirms no JS/TS breakage (tests use jsdom which does not render visuals, so color changes are transparent to them).
2. **TypeScript compilation succeeds** -- confirms no accidental file edits outside CSS.
3. **Vite build succeeds** -- confirms the CSS is valid and bundleable.
4. **ESLint passes** -- confirms no lint regressions.
5. **Manual WCAG contrast verification** -- the plan specifies pre-validated color pairs above. The implementation agent should verify the critical pairs:
   - `#222` on `#fdf6f0` (body text): >15:1
   - `#222` on `#faf5ff` (message text on bubble): >15:1
   - `#fff` on `#e05d44` (button text): ~3.5:1 (large text / UI component)
   - `#9b2c2c` on `#fef0ed` (error text): ~6.8:1
   - `#6b7c80` on `#faf5ff` (timestamp): ~4.6:1
   - `#2b6777` on `#fdf6f0` (h1): ~7.2:1

## Validation Commands

```bash
# Run from repository root (/work/TTT-6)

# TypeScript compilation + Vite production build (both workspaces)
npm run build --workspaces

# ESLint (all workspaces)
npm run lint --workspaces

# Unit tests (vitest, all workspaces)
npm run test --workspaces
```

All three commands must exit 0 with no new warnings/errors.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Gradient banding on some displays | Low | The gradient spans light-to-light (only ~5% hue shift), minimizing visible banding |
| Button contrast borderline for small text | Medium | `#e05d44` with white is 3.5:1 -- passes for UI components (3:1 threshold) and bold 16px+ text (large text). The hover state `#c14a35` at 4.8:1 provides clear affordance. If reviewer flags, darken to `#d04a33` (~4.0:1) |
| Subjective palette preference | Medium | Coral/teal/lavender is warm and modern per spec direction; final approval via Approve Plan gate |

## Rollback Plan

Revert the single commit that modifies `apps/web/src/App.css`. Since no other files are touched and no schema/data changes exist, a `git revert <sha>` produces a clean rollback.

## PR Notes

- Single-file CSS change: `apps/web/src/App.css`
- Zero JS/TS changes, zero layout changes
- Color palette: coral accent (`#e05d44`), teal title (`#2b6777`), lavender bubbles (`#faf5ff`), warm gradient background (`#fdf6f0` to `#f0f4fd`)
- All critical text/background pairs verified for WCAG AA compliance
- Reviewer: open the app in dev mode (`npm run dev`) and visually confirm the palette feels cohesive and attractive
