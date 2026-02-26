# Feature: Light Soft Theme Toggle

## Problem
The agent-mastery course currently has a single hardcoded dark theme. The user sometimes prefers a lighter, warmer reading experience — not pure white, but a "light soft" palette with warm undertones. There is no mechanism to switch themes.

## What We're Adding
A theme toggle button in the header that switches between:
- **Dark mode** (current default) — existing `agent-*` color tokens
- **Light soft mode** — warm, cream-toned palette with soft shadows instead of glowing borders

## Current State
- All theme colors are defined as CSS custom properties in `src/app.css` under `@theme` (Tailwind 4)
- Colors are referenced via Tailwind classes like `bg-agent-dark`, `text-agent-text`, etc.
- The layout (`+layout.svelte`) has hardcoded dark classes on the shell
- No theme state exists — no localStorage key, no toggle UI

## Approach
1. **CSS-first**: Define a second set of `agent-*` color values for light mode, activated by a `[data-theme="light"]` attribute on `<html>`
2. **Toggle component**: Small sun/moon button in the header (next to score/badges)
3. **Persistence**: Save preference to localStorage (separate key from course progress)
4. **Default**: Dark mode (current behavior preserved)

## Scope
- IN: Theme toggle button, light soft CSS variables, localStorage persistence, smooth transition
- OUT: Per-module themes, system preference detection (`prefers-color-scheme`), theme customizer/picker

## Files Affected
- `src/app.css` — add light theme variable overrides
- `src/routes/+layout.svelte` — add toggle button, theme state, localStorage read/write
- Possibly `src/app.html` — add script to prevent flash of wrong theme on load (FOUC)
