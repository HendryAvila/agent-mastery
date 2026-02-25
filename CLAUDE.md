# Agent Mastery — CLAUDE.md

> Interactive course: "De Usuario a Arquitecto de Agentes IA" — 12 modules covering AI agent fundamentals through multi-agent architecture design.

---

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:5173
npm run build        # Static build to ./build/
npm run preview      # Preview the static build
npm run check        # Svelte type checking
```

### Prerequisites

- Node.js v20+
- npm (comes with Node)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **SvelteKit** | 2.x (Svelte 5) | Web framework with file-based routing |
| **Svelte 5** | 5.49+ | Component framework (uses `$state`, `$derived`, `$props`, `$effect` runes) |
| **Tailwind CSS** | 4.x | Utility-first styling via `@tailwindcss/vite` plugin |
| **TypeScript** | 5.9+ | Type safety with strict mode |
| **Vite** | 7.x | Build tool and dev server |
| **adapter-static** | 3.x | Generates fully static site for GitHub Pages |
| **js-confetti** | 0.13 | Confetti animations for course completion |

---

## Architecture

### Pattern: Static SPA with File-Based Routing

This is a **fully static** SvelteKit site (SSG). All pages are pre-rendered at build time via `adapter-static`. There is **no backend, no API, no database**. User progress is persisted in `localStorage`.

### Directory Structure

```
src/
├── app.css                     # Global styles + Tailwind theme (custom agent-* colors)
├── app.d.ts                    # SvelteKit global type declarations
├── app.html                    # HTML shell template
├── lib/
│   ├── index.ts                # Barrel export for $lib
│   ├── components/             # Reusable UI components
│   │   ├── Quiz.svelte             # Multiple-choice quiz engine
│   │   ├── InteractiveFlow.svelte  # Node-based flow diagram with challenges
│   │   ├── BranchingScenario.svelte # Choose-your-adventure decision trees
│   │   ├── Timer.svelte            # Countdown timer with urgency states
│   │   ├── ModuleNav.svelte        # Prev/Next module navigation
│   │   ├── ProgressBar.svelte      # Global course progress indicator
│   │   ├── BadgeNotification.svelte # Toast notification for badge unlocks
│   │   ├── SourcesSection.svelte   # Collapsible academic sources per module
│   │   └── VocabularyFloat.svelte  # Floating vocabulary flashcard widget
│   ├── data/
│   │   ├── modules.ts              # 12 module definitions (metadata, objectives, sources)
│   │   └── vocabulary.ts           # Technical vocabulary terms per module
│   └── stores/
│       └── course.ts               # Svelte writable store — progress, scores, badges, localStorage
└── routes/
    ├── +layout.svelte          # App shell: header, progress bar, footer
    ├── +layout.ts              # prerender=true, ssr=true
    ├── +page.svelte            # Home page: hero, module grid, stats
    ├── modulo/
    │   ├── 1/+page.svelte     # Module 1: Anatomia de un Agente IA (~880 lines)
    │   ├── 2/+page.svelte     # Module 2: Tool Calling (~884 lines)
    │   ├── 3/+page.svelte     # Module 3: Ecosistema 2026 (~881 lines)
    │   ├── 4/+page.svelte     # Module 4: Mejores Practicas (~1029 lines)
    │   ├── 5/+page.svelte     # Module 5: Construir tu Agente (~904 lines)
    │   ├── 6/+page.svelte     # Module 6: Memoria y Planning (~909 lines)
    │   ├── 7/+page.svelte     # Module 7: Frameworks Multi-Agente (~979 lines)
    │   ├── 8/+page.svelte     # Module 8: Patrones de Orquestacion (~899 lines)
    │   ├── 9/+page.svelte     # Module 9: Guardrails y Seguridad (~1288 lines)
    │   ├── 10/+page.svelte    # Module 10: Entorno Profesional (~1250 lines)
    │   ├── 11/+page.svelte    # Module 11: Agentes en Produccion (~1000 lines)
    │   └── 12/+page.svelte    # Module 12: Diseno de Arquitecturas (~968 lines)
    └── resultados/
        └── +page.svelte       # Results dashboard: scores, badges, certificate
```

---

## Key Concepts

### Svelte 5 Runes (NOT Svelte 4)

This project uses **Svelte 5 runes** exclusively. Do NOT use Svelte 4 syntax.

| Rune | Usage | Example |
|---|---|---|
| `$state()` | Reactive state declaration | `let count = $state(0)` |
| `$derived()` | Computed values | `let double = $derived(count * 2)` |
| `$props()` | Component props | `let { title }: Props = $props()` |
| `$effect()` | Side effects | `$effect(() => { ... })` |
| `{@render children()}` | Slot rendering | In `+layout.svelte` |

### Course Store (`src/lib/stores/course.ts`)

The central state management. A Svelte `writable` store that auto-persists to `localStorage` under key `agent-mastery-progress`.

**State shape:**
- `currentModule` — highest module reached
- `modules` — `Record<number, ModuleProgress>` with `completed`, `score`, `maxScore`
- `totalScore` — sum of all module scores
- `badges` — array of unlocked `Badge` objects (10 total)
- `vocabularyDismissed` — dismissed vocabulary term IDs
- `userName` — for the certificate

**Key methods:** `startModule()`, `completeModule()`, `unlockBadge()`, `dismissVocabulary()`, `reset()`

### Component Pattern

Each module page (`/modulo/N/+page.svelte`) follows this pattern:
1. Import `courseStore` + components (Quiz, InteractiveFlow, etc.)
2. Define `MODULE_ID` constant
3. Call `courseStore.startModule(MODULE_ID)` on mount
4. Define inline data: `flowNodes`, `flowEdges`, `flowChallenges`, `quizQuestions`
5. Handle `onComplete` callbacks to `courseStore.completeModule()` and `unlockBadge()`
6. Render: Theory sections -> Interactive diagram -> Quiz -> ModuleNav

### Interactive Components

| Component | Purpose | Data Interface |
|---|---|---|
| `Quiz` | Multiple-choice with explanations per option | `QuizQuestion[]` with `QuizOption[]` |
| `InteractiveFlow` | Node-based diagrams with explore/challenge modes | `FlowNode[]`, `FlowEdge[]`, `FlowChallenge[]` |
| `BranchingScenario` | Decision tree with points and outcomes | `Record<string, ScenarioNode>` with choices/outcomes |
| `Timer` | Countdown with visual urgency (normal/warning/critical) | `duration`, `onTimeUp` callback |
| `VocabularyFloat` | Floating flashcard for module-specific terms | `moduleId` prop, reads from `vocabulary.ts` |

---

## Design System

### Custom Theme Colors (defined in `app.css` via `@theme`)

| Token | Hex | Usage |
|---|---|---|
| `agent-dark` | `#0a1420` | Header, card backgrounds |
| `agent-darker` | `#060e18` | Page background |
| `agent-card` | `#0f1d2e` | Card surfaces |
| `agent-border` | `#1a3348` | Borders |
| `agent-accent` | `#06b6d4` | Primary accent (cyan) |
| `agent-success` | `#22c55e` | Correct answers |
| `agent-danger` | `#ef4444` | Wrong answers, critical states |
| `agent-warning` | `#eab308` | Warning timer state |
| `agent-text` | `#f8fafc` | Primary text |
| `agent-muted` | `#94a3b8` | Secondary text |

### Utility Classes (defined in `app.css`)

- `.btn-primary`, `.btn-secondary`, `.btn-danger` — button variants
- `.card`, `.card-interactive` — card containers
- `.code-block` — code display
- `.flow-node`, `.flow-node-active` — diagram nodes
- `.fade-in`, `.slide-in`, `.pulse-glow` — animations
- `.glow-accent` — cyan box-shadow glow

---

## Deployment

### GitHub Pages (via GitHub Actions)

The CI/CD pipeline is in `.github/workflows/deploy.yml`:
- Triggers on push to `main`
- Builds with `BASE_PATH=/agent-mastery`
- Deploys via `actions/deploy-pages@v4`

**Critical config:** `BASE_PATH` in the workflow must match the repo name exactly. All internal links use `{base}` from `$app/paths`.

### SvelteKit Config (`svelte.config.js`)

- `adapter-static` outputs to `./build/`
- `fallback: 'index.html'` for SPA client-side routing
- `paths.base` reads from `BASE_PATH` env var (empty in dev)

---

## Gamification System

### Badges (10 total, defined in `course.ts`)

| Badge ID | Name | Trigger |
|---|---|---|
| `first-step` | Primer Contacto | Complete module 1 |
| `agent-anatomy` | Anatomista | Module 2 completion |
| `tool-master` | Tool Master | Score 80%+ on module 2 quiz |
| `ecosystem-explorer` | Explorador | Module 3 completion |
| `agent-whisperer` | Agent Whisperer | Module 4 completion |
| `builder` | Constructor | Module 5 completion |
| `brain-architect` | Arquitecto Mental | Module 6 completion |
| `orchestrator` | Orquestador | Module 7/8 completion |
| `guardian` | Guardian | Module 9 completion |
| `agent-architect` | Agent Architect | Complete all 12 modules |

### Scoring

- Each module has a `maxScore` (determined by quiz question count)
- `totalScore` is recalculated on each module completion (keeps best score per module)
- Results page shows competency breakdown across 5 blocks

---

## Common Patterns

### Adding a New Module

1. Create `src/routes/modulo/N/+page.svelte` following the existing pattern
2. Add module metadata to `src/lib/data/modules.ts`
3. Add vocabulary terms to `src/lib/data/vocabulary.ts`
4. Define badge in `allBadges` array in `src/lib/stores/course.ts`
5. Update `TOTAL_MODULES` constant in `src/lib/stores/course.ts`

### Modifying the Theme

All custom colors are in `src/app.css` under `@theme`. Tailwind 4 uses CSS custom properties — no `tailwind.config.js` file needed.

### Data Flow

```
User interaction
  -> Component event handler
    -> courseStore.completeModule() / unlockBadge()
      -> Svelte store update
        -> Auto-save to localStorage
          -> Derived stores recalculate (progressPercent)
            -> UI reactively updates
```

---

## Troubleshooting

### Blank page after build
- Check `BASE_PATH` matches repo name in `deploy.yml`
- Verify all links use `{base}` from `$app/paths`

### Styles not loading
- Tailwind 4 uses `@tailwindcss/vite` plugin — ensure it's in `vite.config.ts`
- Custom theme colors are in `app.css` under `@theme`, not in a config file

### localStorage issues
- Storage key: `agent-mastery-progress`
- Call `courseStore.reset()` to clear all progress
- Browser private mode may block localStorage

### Type errors
- Run `npm run check` for full Svelte + TypeScript diagnostics
- Ensure Svelte 5 rune syntax (`$state`, `$props`, etc.) — NOT Svelte 4 stores in components
