# Implementation Tasks

## TASK-001: Define light soft theme CSS variables
**Component**: `src/app.css`
**Dependencies**: None
**Description**: Add a `[data-theme="light"]` selector block that overrides all `--color-agent-*` custom properties with warm, light values. The palette should be cream/warm-white based (not cold white). Also override glow/shadow effects to use soft shadows instead of cyan glows.

**Light palette reference** (warm soft):
- `agent-darker` → `#f5f0e8` (warm cream background)
- `agent-dark` → `#ede7db` (warm header/card bg)
- `agent-card` → `#faf7f2` (card surface, almost white)
- `agent-border` → `#d4c9b8` (warm tan border)
- `agent-accent` → `#0891b2` (slightly deeper cyan for contrast on light)
- `agent-accent-hover` → `#0e7490`
- `agent-text` → `#1c1917` (stone-900, warm dark text)
- `agent-muted` → `#78716c` (stone-500, warm muted)
- `agent-highlight` → `#0e7490`
- `agent-glow` → `#0891b2`

Also override `glow-accent` box-shadow to use a subtle warm shadow instead of cyan glow.

**Acceptance Criteria**:
- [ ] All `agent-*` variables have light overrides under `[data-theme="light"]`
- [ ] `body` background, text, selection colors adapt correctly
- [ ] `.btn-primary` text remains readable on light (currently uses `text-agent-darker`)
- [ ] `.code-block` is readable with light theme
- [ ] `.flow-node` and `.flow-node-active` are visually distinct in light mode

---

## TASK-002: Add anti-FOUC script in app.html
**Component**: `src/app.html`
**Dependencies**: None
**Description**: Add an inline `<script>` in `<head>` (before any CSS loads) that reads `localStorage.getItem('agent-mastery-theme')` and sets `document.documentElement.dataset.theme` accordingly. This prevents flash of dark theme when user has light preference saved.

**Acceptance Criteria**:
- [ ] No flash of wrong theme on page load
- [ ] Script is inline in `<head>`, not deferred
- [ ] Falls back to no attribute (dark default) if no localStorage value

---

## TASK-003: Create ThemeToggle component and integrate in layout
**Component**: `src/lib/components/ThemeToggle.svelte`, `src/routes/+layout.svelte`
**Dependencies**: TASK-001, TASK-002
**Description**: Create a small toggle button component (sun/moon icons) that:
1. Reads initial theme from `document.documentElement.dataset.theme` on mount
2. Toggles `data-theme` attribute on `<html>` between absent (dark) and `"light"`
3. Persists choice to `localStorage` under key `agent-mastery-theme`

Integrate it in the header of `+layout.svelte`, next to the score/badge indicators.

**Acceptance Criteria**:
- [ ] Button shows moon icon in light mode, sun icon in dark mode
- [ ] Click toggles theme immediately with smooth CSS transition
- [ ] Preference persists across page reloads
- [ ] Button is accessible (aria-label, keyboard navigable)
- [ ] Fits visually in the header without breaking layout

---

## TASK-004: Add CSS transition for theme switch
**Component**: `src/app.css`
**Dependencies**: TASK-001
**Description**: Add a `transition` on `body` (or `:root`) for `background-color` and `color` properties (~200ms) so the theme switch feels smooth, not jarring.

**Acceptance Criteria**:
- [ ] Theme transition is smooth (~200ms)
- [ ] No layout shift during transition
- [ ] Transition doesn't affect page load (only applies on toggle)

---

## Execution Waves

**Wave 1** (parallel — no dependencies):
- TASK-001: Light CSS variables
- TASK-002: Anti-FOUC script

**Wave 2** (depends on Wave 1):
- TASK-003: ThemeToggle component + layout integration
- TASK-004: CSS transition for smooth switch

## Dependency Graph
```
TASK-001 ──┐
           ├──→ TASK-003
TASK-002 ──┘
TASK-001 ────→ TASK-004
```

## Estimated Effort
~1-2 hours for a single developer. Straightforward CSS + small Svelte component.
