# Tasks: Atomic Implementation Breakdown

## Total Tasks: 22
## Estimated Effort: 5-7 days for a single developer (or 2-3 days with parallel agents)

---

### TASK-001: Update course store with versioning and new badges
**Component**: Store
**Covers**: FR-006, FR-007, FR-009
**Dependencies**: None
**Description**: Update `src/lib/stores/course.ts`:
- Change `TOTAL_MODULES` from 12 to 13
- Add `STORE_VERSION = 2` constant
- Add version check on init: if no version or version < 2 → `reset()`, set version = 2
- Replace `allBadges` array with 14 new badges (13 module badges + claude-code-master)
- Add `claudeCodeMaster` badge logic: unlocks when modules 4, 5, 8 all have score >= 90% of maxScore
- Update `progressPercent` derived calculation for 13 modules
- Update competency blocks mapping for /resultados
**Acceptance Criteria**:
- [ ] TOTAL_MODULES = 13
- [ ] 14 badges defined with correct triggers
- [ ] Version check resets old data cleanly
- [ ] claudeCodeMaster logic correct
- [ ] `npm run check` passes

### TASK-002: Update module metadata
**Component**: Data
**Covers**: FR-008
**Dependencies**: None
**Description**: Rewrite `src/lib/data/modules.ts` with 13 module definitions. Each module needs: id, title, description, objectives array, sources array with {title, url} for primary sources.
**Acceptance Criteria**:
- [ ] 13 modules defined
- [ ] Each module has 3+ sources with valid URLs
- [ ] Titles match the new structure exactly

### TASK-003: Update vocabulary data
**Component**: Data
**Covers**: FR-019
**Dependencies**: None
**Description**: Update `src/lib/data/vocabulary.ts` with Claude Code terms for each module. Add terms: context engineering, context rot, compaction, just-in-time context, plan mode, worktree, opusplan, hooks, skills, sub-agents, SKILL.md, frontmatter, PreToolUse, PostToolUse, headless mode, sandbox, agent teams, teammate, task list, handoff, orchestrator-worker.
**Acceptance Criteria**:
- [ ] Each of the 13 modules has relevant vocabulary terms
- [ ] New Claude Code terms added with accurate definitions

### TASK-004: Update home page grid
**Component**: Routes
**Covers**: FR-012
**Dependencies**: TASK-002
**Description**: Update `src/routes/+page.svelte` to display 13 module cards in the grid. Adjust grid layout if needed for 13 items.
**Acceptance Criteria**:
- [ ] 13 module cards visible
- [ ] Grid layout balanced
- [ ] Module links point to correct /modulo/N routes

### TASK-005: Update results page
**Component**: Routes
**Covers**: FR-013
**Dependencies**: TASK-001, TASK-002
**Description**: Update `src/routes/resultados/+page.svelte` to reflect 13 modules, new badges, competency breakdown. Add "Claude Code Master" badge display.
**Acceptance Criteria**:
- [ ] Shows 13 modules progress
- [ ] Displays 14 badges correctly
- [ ] Claude Code Master badge has special styling

### TASK-006: Rewrite Module 1 — Anatomía de un Agente IA
**Component**: Module
**Covers**: FR-002, FR-011, FR-014
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/1/+page.svelte`. Add "En Claude Code" sections mapping 4 components to Claude Code. Add 2 quiz questions about Claude Code. Update InteractiveFlow with Claude Code nodes. Cite 3+ sources. Educational tone.
**Acceptance Criteria**:
- [ ] "En Claude Code" sections present
- [ ] 2+ Claude Code quiz questions
- [ ] 3+ sources cited with SourcesSection
- [ ] MODULE_ID = 1, startModule/completeModule calls correct

### TASK-007: Rewrite Module 2 — Tool Calling
**Component**: Module
**Covers**: FR-002, FR-011, FR-014
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/2/+page.svelte`. Expand MCP section (transport types, scopes). Add Anthropic's 5 tool design principles. Add Tool Search Tool section. 2+ Claude Code quiz questions. Cite sources.
**Acceptance Criteria**:
- [ ] MCP deep dive section
- [ ] 5 tool design principles from Anthropic article
- [ ] 2+ Claude Code quiz questions
- [ ] 3+ sources cited

### TASK-008: Rewrite Module 3 — Ecosistema 2026
**Component**: Module
**Covers**: FR-002, FR-011
**Dependencies**: TASK-001, TASK-002
**Description**: Refocus `src/routes/modulo/3/+page.svelte`. Claude Code = 60% of content. Reduce autonomous agents to brief overview. Add "Por qué Claude Code es el foco" section. Update InteractiveFlow.
**Acceptance Criteria**:
- [ ] Claude Code is clearly the primary agent
- [ ] Comparison is honest but Claude Code-centric
- [ ] Reduced Devin/Jules coverage
- [ ] 3+ sources cited

### TASK-009: Write Module 4 — Context Engineering (NEW)
**Component**: Module
**Covers**: FR-003, FR-011, FR-014
**Dependencies**: TASK-001, TASK-002
**Description**: Write `src/routes/modulo/4/+page.svelte` from scratch. Cover: context eng vs prompt eng, context rot, CLAUDE.md hierarchy (6 layers with table), just-in-time strategy, 3 techniques (compaction, note-taking, sub-agents), 60% rule, /clear savings. InteractiveFlow of context pipeline. 5 quiz questions. SourcesSection with 6+ primary sources.
**Acceptance Criteria**:
- [ ] CLAUDE.md hierarchy table with 6 layers
- [ ] 3 techniques explained with data (39% improvement cited)
- [ ] 5 quiz questions
- [ ] InteractiveFlow diagram
- [ ] 6+ sources cited
- [ ] Educational tone, no personality

### TASK-010: Write Module 5 — Trabajar CON Claude Code (FULL REWRITE)
**Component**: Module
**Covers**: FR-002, FR-011, FR-015
**Dependencies**: TASK-001, TASK-002
**Description**: Rewrite `src/routes/modulo/5/+page.svelte` 100% from scratch. Cover: 4-phase workflow, Plan Mode, verification as #1 practice, failure patterns (5 patterns with fixes), structured prompting, /clear /compact /rewind, worktrees, opusplan, cost optimization. BranchingScenario with Claude Code workflow decisions. 5 quiz questions.
**Acceptance Criteria**:
- [ ] 4-phase workflow explained
- [ ] 5 failure patterns with fixes
- [ ] BranchingScenario with real decisions
- [ ] 5 quiz questions
- [ ] 5+ sources cited

### TASK-011: Rewrite Module 6 — Construir tu Agente
**Component**: Module
**Covers**: FR-002, FR-011, FR-017
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/6/+page.svelte`. Pivot to Claude ecosystem: Agent SDK (4-stage cycle), MCP server development, Hoofy case study (composition root, bridge, knowledge graph). Compare Agent SDK vs Claude Code directo.
**Acceptance Criteria**:
- [ ] Agent SDK 4-stage cycle explained
- [ ] MCP server structure section
- [ ] Hoofy referenced as case study
- [ ] 3+ sources cited

### TASK-012: Rewrite Module 7 — Memoria, Planning y Razonamiento
**Component**: Module
**Covers**: FR-002, FR-011
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/7/+page.svelte`. Add Claude Code memory hierarchy (6 layers), auto memory system, Think Tool (54% improvement), extended thinking config, compaction strategies, memory + context editing = 39%.
**Acceptance Criteria**:
- [ ] 6-layer memory hierarchy
- [ ] Think Tool section with data
- [ ] 39% improvement data cited
- [ ] 3+ sources cited

### TASK-013: Write Module 8 — Claude Code Deep Dive (NEW)
**Component**: Module
**Covers**: FR-004, FR-011, FR-014
**Dependencies**: TASK-001, TASK-002
**Description**: Write `src/routes/modulo/8/+page.svelte` from scratch. Cover: .claude/ directory (settings, agents, skills, commands, rules), hooks (17 events, 3 types, exit codes, matchers, patterns), skills (SKILL.md, frontmatter, invocation control, dynamic context), sub-agents (built-in + custom, memory, isolation), permissions (allow/ask/deny, sandbox), headless mode (CLI flags, output formats). InteractiveFlow of .claude/ ecosystem. 5 quiz questions.
**Acceptance Criteria**:
- [ ] .claude/ directory structure documented
- [ ] Hooks: 17 events listed, 3 types explained
- [ ] Skills: SKILL.md structure with frontmatter
- [ ] Sub-agents: built-in + custom config
- [ ] Permissions + sandbox
- [ ] Headless mode flags
- [ ] 5 quiz questions
- [ ] InteractiveFlow
- [ ] 7+ sources cited

### TASK-014: Write Module 9 — Multi-Agent (MERGE)
**Component**: Module
**Covers**: FR-005, FR-011, FR-014
**Dependencies**: TASK-001, TASK-002
**Description**: Rewrite `src/routes/modulo/9/+page.svelte`. Merge content from old modules 7+8. Claude Agent SDK as primary framework (reduced coverage of others). 5 orchestration patterns implemented with Claude Code. Agent Teams section. Multi-agent research system (90.2% improvement). C compiler case study (16 agents). BranchingScenario.
**Acceptance Criteria**:
- [ ] Claude Agent SDK primary focus
- [ ] 5 orchestration patterns
- [ ] Agent Teams explained
- [ ] 2 case studies (research + compiler)
- [ ] BranchingScenario
- [ ] 5+ sources cited

### TASK-015: Rewrite Module 10 — Guardrails, Seguridad y Evaluación
**Component**: Module
**Covers**: FR-002, FR-011, FR-021
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/10/+page.svelte`. Add Claude Code permission model (allow/ask/deny), sandbox (filesystem + network), PreToolUse hooks as guardrails, eval framework (3 grader types, pass@k, pass^k, infrastructure noise).
**Acceptance Criteria**:
- [ ] Permission model section
- [ ] Sandbox section
- [ ] Hook guardrail example
- [ ] Eval framework with 3 grader types
- [ ] 4+ sources cited

### TASK-016: Rewrite Module 11 — Entorno del Agent Architect
**Component**: Module
**Covers**: FR-002, FR-011, FR-016
**Dependencies**: TASK-001, TASK-002
**Description**: Refocus `src/routes/modulo/11/+page.svelte`. Reduce tmux/zellij to 30%. Expand Claude Code workspace to 70%: .claude/ structure, MCP config, worktrees, multi-session. incident.io case study. Plugins ecosystem. 
**Acceptance Criteria**:
- [ ] Terminal setup = 30%
- [ ] Claude Code workspace = 70%
- [ ] incident.io case study
- [ ] Plugins/ecosystem section
- [ ] 4+ sources cited

### TASK-017: Rewrite Module 12 — Agentes en Producción
**Component**: Module
**Covers**: FR-002, FR-011, FR-018
**Dependencies**: TASK-001, TASK-002
**Description**: Enhance `src/routes/modulo/12/+page.svelte`. Add Claude Code GitHub Action (YAML workflow), headless mode in CI, long-running harnesses (initializer agent, progress files, one feature per session), cost management (opusplan, MAX_THINKING_TOKENS, batch API), rainbow deployments.
**Acceptance Criteria**:
- [ ] GitHub Action YAML example
- [ ] Headless mode in CI section
- [ ] Long-running harness patterns
- [ ] Cost management section
- [ ] 4+ sources cited

### TASK-018: Write Module 13 — Taller Final (NEW FILE)
**Component**: Module
**Covers**: FR-010, FR-022
**Dependencies**: TASK-001, TASK-002
**Description**: Create `src/routes/modulo/13/+page.svelte`. Checklist of 12 previous modules. Complexity ladder. Reference architectures with Claude Code. BranchingScenario with Timer (15 min): design code review system for TechCorp (200 PRs/day) using Claude Code. Scenario requires: CLAUDE.md design, agent dispatch table, hooks config, orchestration pattern selection.
**Acceptance Criteria**:
- [ ] New file created
- [ ] Checklist covers 12 prior modules
- [ ] BranchingScenario with Timer
- [ ] Scenario requires CLAUDE.md + hooks + agents design
- [ ] Consolidated sources

### TASK-019: Update layout for 13 modules
**Component**: Layout
**Covers**: FR-010
**Dependencies**: TASK-001
**Description**: Review and update `src/routes/+layout.svelte` if ProgressBar or navigation needs adjustment for 13 modules.
**Acceptance Criteria**:
- [ ] ProgressBar works with 13 modules
- [ ] No layout bugs

### TASK-020: Create ModuleNav for module 13
**Component**: Routes
**Covers**: FR-010
**Dependencies**: TASK-018
**Description**: Ensure ModuleNav in module 13 has correct prev/next (prev=12, next=resultados). Verify all other modules have correct ModuleNav.
**Acceptance Criteria**:
- [ ] All 13 modules have correct prev/next navigation
- [ ] Module 13 → resultados works

### TASK-021: Run full build and type check
**Component**: QA
**Covers**: NFR-005, NFR-007
**Dependencies**: All TASK-001 through TASK-020
**Description**: Run `npm run check` and `npm run build`. Fix any TypeScript errors, Svelte warnings, or build failures.
**Acceptance Criteria**:
- [ ] `npm run check` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] Static output in ./build/ is valid

### TASK-022: Verify sources and links
**Component**: QA
**Covers**: NFR-001
**Dependencies**: All module tasks
**Description**: Verify all cited source URLs are valid and accessible. Check that every module has its SourcesSection component with 3+ sources. Verify no dead links.
**Acceptance Criteria**:
- [ ] All URLs return 200 status
- [ ] Every module has SourcesSection with 3+ sources
- [ ] No placeholder or invented URLs

---

## Execution Waves

### Wave 1 — Foundation (no dependencies, all parallel)
- **TASK-001**: Update store (versioning, badges)
- **TASK-002**: Update module metadata
- **TASK-003**: Update vocabulary data

### Wave 2 — Infrastructure (depends on Wave 1)
- **TASK-004**: Update home page grid
- **TASK-005**: Update results page
- **TASK-019**: Update layout

### Wave 3 — Modules (depends on Wave 1, all parallel)
- **TASK-006**: Module 1 (enhance)
- **TASK-007**: Module 2 (enhance)
- **TASK-008**: Module 3 (refocus)
- **TASK-009**: Module 4 — Context Engineering (NEW)
- **TASK-010**: Module 5 — Trabajar CON Claude Code (REWRITE)
- **TASK-011**: Module 6 (enhance)
- **TASK-012**: Module 7 (enhance)
- **TASK-013**: Module 8 — Claude Code Deep Dive (NEW)
- **TASK-014**: Module 9 — Multi-Agent MERGE
- **TASK-015**: Module 10 (enhance)
- **TASK-016**: Module 11 (refocus)
- **TASK-017**: Module 12 (enhance)
- **TASK-018**: Module 13 — Taller Final (NEW FILE)

### Wave 4 — Navigation & Polish (depends on Wave 3)
- **TASK-020**: Verify ModuleNav across all 13 modules

### Wave 5 — QA (depends on all)
- **TASK-021**: Full build and type check
- **TASK-022**: Verify sources and links

---

## Dependency Graph

```
TASK-001 ─┬─→ TASK-004 ─→ TASK-020 ─→ TASK-021
TASK-002 ─┤   TASK-005                  TASK-022
TASK-003 ─┤   TASK-019
           │
           ├─→ TASK-006 (Module 1)
           ├─→ TASK-007 (Module 2)
           ├─→ TASK-008 (Module 3)
           ├─→ TASK-009 (Module 4) ★ NEW
           ├─→ TASK-010 (Module 5) ★ REWRITE
           ├─→ TASK-011 (Module 6)
           ├─→ TASK-012 (Module 7)
           ├─→ TASK-013 (Module 8) ★ NEW
           ├─→ TASK-014 (Module 9) ★ MERGE
           ├─→ TASK-015 (Module 10)
           ├─→ TASK-016 (Module 11)
           ├─→ TASK-017 (Module 12)
           └─→ TASK-018 (Module 13) ★ NEW FILE
```
