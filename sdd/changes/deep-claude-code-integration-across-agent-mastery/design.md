# Design: Technical Architecture

## 1. Module Architecture (13 Modules)

### Module Map with Content Specification

#### Module 1 — Anatomía de un Agente IA (ENHANCE)
**Source file**: `src/routes/modulo/1/+page.svelte`
**Change type**: Add "En Claude Code" sections, keep existing theory
**Key additions**:
- Claude Code como implementación de referencia: LLM (Opus 4.6), Tools (Read/Write/Edit/Bash/Glob/Grep), Memory (CLAUDE.md + .claude/), Planning (extended thinking)
- Trace real de un ciclo observe-think-act en Claude Code
- Quiz: 2 nuevas preguntas sobre Claude Code anatomy
**Primary sources**:
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — 5 workflow patterns
- [Claude Code Overview](https://code.claude.com/docs/en/overview) — capabilities, surfaces
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — 4-stage feedback cycle

#### Module 2 — Tool Calling (ENHANCE)
**Source file**: `src/routes/modulo/2/+page.svelte`
**Change type**: Expand MCP section, deepen Claude Code tool examples
**Key additions**:
- MCP protocol deep dive: transport types (HTTP, SSE, stdio), scopes (local, project, user)
- 5 principios de tool design de Anthropic (choose right tools, namespace, meaningful context, token efficiency, prompt-engineer descriptions)
- Tool Search Tool: 85% token reduction
- Example: cómo configurar un MCP server en Claude Code
**Primary sources**:
- [Writing Effective Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents) — 5 principles
- [Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use) — Tool Search, Programmatic Calling
- [Claude Code MCP docs](https://code.claude.com/docs/en/mcp) — configuration, transport types

#### Module 3 — Ecosistema 2026 (REFOCUS)
**Source file**: `src/routes/modulo/3/+page.svelte`
**Change type**: Claude Code como primario, reducir cobertura de otros
**Key changes**:
- Claude Code: 60% del módulo (deep dive features, architecture, pricing)
- Comparación honesta: CLI (OpenCode, Aider) vs IDE (Cursor, Roo Code) vs Autonomous (Devin)
- Sección "Por qué Claude Code es el foco de este curso" con justificación técnica
- Reducir coverage de agents autónomos (Devin, Jules) a resumen breve
**Primary sources**:
- [Claude Code Overview](https://code.claude.com/docs/en/overview) — all surfaces
- [2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report)

#### Module 4 — Context Engineering (NEW)
**Source file**: `src/routes/modulo/4/+page.svelte`
**Change type**: Completamente nuevo
**Content outline**:
1. Context Engineering vs Prompt Engineering (definición, scope, timing)
2. El problema de "context rot" — performance degrades as tokens increase
3. CLAUDE.md Mastery:
   - Hierarchy de 6 capas (managed policy → auto memory)
   - Qué incluir, qué excluir (tabla de Anthropic best practices)
   - `.claude/rules/` para reglas path-specific
   - Import syntax (`@path/to/import`)
   - Target: < 2.5K tokens (Boris Cherny benchmark)
4. Just-In-Time Context Strategy — lightweight identifiers, runtime loading, progressive disclosure
5. Tres técnicas para long-horizon tasks:
   - Compaction (qué preservar vs descartar)
   - Structured Note-Taking (agentic memory)
   - Sub-Agent Architectures (clean context windows, 1-2K token summaries)
6. La regla del 60% — nunca exceder 60% de contexto, dividir en Research/Plan/Implement/Validate
7. `/clear` entre tareas — 50-70% ahorro de tokens
8. Quiz: 5 preguntas sobre context engineering
9. InteractiveFlow: context management pipeline
**Primary sources**:
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 39% improvement
- [Managing Context on Developer Platform](https://www.anthropic.com/news/context-management)
- [Claude Code Memory docs](https://code.claude.com/docs/en/memory)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Boris Cherny 22 Tips](https://medium.com/@joe.njenga/boris-cherny-claude-code-creator-shares-these-22-tips)

#### Module 5 — Trabajar CON Claude Code (FULL REWRITE)
**Source file**: `src/routes/modulo/5/+page.svelte`
**Change type**: 100% nuevo, zero contenido preservado
**Content outline**:
1. El workflow de 4 fases: Explore (Plan Mode) → Plan → Implement → Commit
2. Plan Mode: Shift+Tab, read-only exploration, plan editing con Ctrl+G
3. Verificación como práctica #1 (tests, linters, screenshots)
4. Common failure patterns y sus fixes (kitchen sink, correction spiral, over-specified CLAUDE.md, trust-then-verify gap, infinite exploration)
5. Structured prompting: Context + Objective + Constraints
6. Cuándo usar /clear, /compact, /rewind
7. Worktrees para trabajo paralelo: `claude -w feature-name`
8. Model selection strategy: opusplan (Opus planning, Sonnet execution)
9. Cost optimization: /clear = 50-70% savings, batch API = 50% savings
10. BranchingScenario: tomar decisiones reales de workflow en Claude Code
11. Quiz: 5 preguntas sobre best practices
**Primary sources**:
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Common Workflows](https://code.claude.com/docs/en/tutorials)
- [Boris Cherny 22 Tips](https://medium.com/@joe.njenga/boris-cherny-claude-code-creator-shares-these-22-tips)
- [Steve Kinney Builder.io](https://www.builder.io/blog/claude-code)
- [incident.io blog](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees)
- [Cost Management](https://code.claude.com/docs/en/costs)

#### Module 6 — Construir tu Agente (ENHANCE)
**Source file**: `src/routes/modulo/6/+page.svelte`
**Change type**: Pivotear de genérico a ecosistema Claude
**Key changes**:
- Claude Agent SDK como framework principal (Agent, Tool, Handoff, Guardrail)
- 4-stage feedback cycle: Gather Context → Take Action → Verify → Iterate
- Construir un MCP server: estructura, tools, transport
- Hoofy como case study: composition root, bridge pattern, 30 tools, knowledge graph
- Comparar: cuándo Agent SDK vs Claude Code directo
**Primary sources**:
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) — 98.7% token reduction
- [Hoofy MCP](https://github.com/HendryAvila/Hoofy) — case study

#### Module 7 — Memoria, Planning y Razonamiento (ENHANCE)
**Source file**: `src/routes/modulo/7/+page.svelte`
**Change type**: Agregar Claude Code memory architecture
**Key additions**:
- Memory hierarchy de Claude Code: 6 capas con tabla comparativa
- Auto memory system: cómo Claude guarda learnings automáticamente
- Think Tool: 54% improvement, cuándo usarlo
- Extended thinking: configuración, toggle, MAX_THINKING_TOKENS
- Compaction vs /clear vs sub-agents: cuándo usar cada uno
- Memory + context editing = 39% performance improvement (data de Anthropic)
**Primary sources**:
- [The Think Tool](https://www.anthropic.com/engineering/claude-think-tool)
- [Claude Code Memory docs](https://code.claude.com/docs/en/memory)
- [Effective Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

#### Module 8 — Claude Code Deep Dive (NEW)
**Source file**: `src/routes/modulo/8/+page.svelte`
**Change type**: Completamente nuevo
**Content outline**:
1. La estructura `.claude/`:
   - `settings.json` (project, local, user)
   - `agents/` (custom sub-agents con YAML frontmatter)
   - `skills/` (SKILL.md + frontmatter + supporting files)
   - `commands/` (slash commands simples)
   - `rules/` (path-specific rules con YAML)
2. Hooks System (17 events):
   - 3 tipos: command, prompt, agent
   - Exit codes: 0 (proceed), 2 (block)
   - Patterns: auto-format, block protected files, notifications, re-inject context post-compaction
   - Matchers: regex para filtrar por tool name, session type, etc.
3. Skills System:
   - SKILL.md structure + frontmatter fields
   - Invocation control: user-invocable, disable-model-invocation
   - Dynamic context: `$ARGUMENTS`, `` !`command` ``
   - Skills como "executable expertise"
4. Sub-Agents:
   - Built-in: Explore (Haiku, read-only), Plan (inherits, read-only), general-purpose (all tools)
   - Custom: `.claude/agents/` con model, tools, memory, isolation
   - Foreground vs background, persistent memory
5. Permission Model:
   - Allow/ask/deny rules con glob patterns
   - Permission modes: acceptEdits, askEdits, plan, bypassPermissions
   - Sandbox: filesystem + network isolation (84% fewer prompts)
6. Headless Mode:
   - `claude -p "query"` para CI/CD
   - Output formats: text, json, stream-json
   - --max-turns, --allowedTools, --max-budget-usd
7. Quiz: 5 preguntas + InteractiveFlow del .claude/ ecosystem
**Primary sources**:
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Skills docs](https://code.claude.com/docs/en/skills)
- [Sub-Agents docs](https://code.claude.com/docs/en/sub-agents)
- [Settings docs](https://code.claude.com/docs/en/settings)
- [Permissions docs](https://code.claude.com/docs/en/permissions)
- [Headless Mode docs](https://code.claude.com/docs/en/headless)
- [Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)

#### Module 9 — Multi-Agent: Frameworks y Orquestación (MERGE 7+8)
**Source file**: `src/routes/modulo/9/+page.svelte`
**Change type**: Merge de módulos 7+8 actuales, refocalizar en Claude
**Content outline**:
1. Frameworks: Claude Agent SDK como primario, LangGraph y CrewAI como alternativas (reducido)
2. 5 Orchestration Patterns: Orchestrator-Worker, Pipeline, Handoff, Parallelization, Evaluator-Optimizer
3. Claude Code sub-agents como implementación de patterns
4. Agent Teams (experimental): team lead, teammates, shared task list, mailbox
5. Multi-agent research system de Anthropic: Opus lead + Sonnet workers = 90.2% improvement
6. Building C Compiler case study: 16 agents, lock files, Docker isolation
7. Cuándo sub-agents vs agent teams vs multiple sessions
8. BranchingScenario: diseñar orquestación para code review system
**Primary sources**:
- [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Building C Compiler](https://www.anthropic.com/engineering/building-c-compiler)
- [Agent Teams docs](https://code.claude.com/docs/en/agent-teams)
- [Sub-Agents docs](https://code.claude.com/docs/en/sub-agents)
- [Addy Osmani on Swarms](https://addyosmani.com/blog/claude-code-agent-teams/)

#### Module 10 — Guardrails, Seguridad y Evaluación (ENHANCE)
**Source file**: `src/routes/modulo/10/+page.svelte`
**Change type**: Agregar Claude Code security specifics
**Key additions**:
- Claude Code permission model: allow/ask/deny con ToolName(pattern) syntax
- Sandbox: filesystem isolation + network isolation
- PreToolUse hooks como guardrails (bloquear rm -rf, curl malicioso)
- Evals: 3 tipos de graders (code-based, model-based, human), pass@k, pass^k
- Infrastructure noise: "differences below 3 percentage points deserve skepticism"
**Primary sources**:
- [Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Demystifying Evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Infrastructure Noise](https://www.anthropic.com/engineering/infrastructure-noise)
- [Permissions docs](https://code.claude.com/docs/en/permissions)

#### Module 11 — Entorno del Agent Architect (REFOCUS)
**Source file**: `src/routes/modulo/11/+page.svelte`
**Change type**: Reducir tmux/zellij, expandir Claude Code workspace
**Key changes**:
- Terminal setup: 30% (tmux/zellij condensado)
- Claude Code workspace: 70% (.claude/ structure, MCP config, worktrees, multi-session patterns)
- Git worktrees: `claude -w feature-name`, 3-5 parallel sessions (Boris Cherny)
- incident.io case study: 4-7 concurrent agents, fast tooling prerequisite, new hire shipping day 2
- Plugins ecosystem: compound-engineering, ContextKit, awesome-claude-code
**Primary sources**:
- [incident.io blog](https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees)
- [Common Workflows](https://code.claude.com/docs/en/tutorials)
- [Boris Cherny 22 Tips](https://medium.com/@joe.njenga/boris-cherny-claude-code-creator-shares-these-22-tips)

#### Module 12 — Agentes en Producción (ENHANCE)
**Source file**: `src/routes/modulo/12/+page.svelte`
**Change type**: Agregar Claude Code production patterns
**Key additions**:
- Claude Code GitHub Action: `anthropics/claude-code-action@v1`, workflow YAML, trigger phrases
- Headless mode en CI: `claude -p`, --allowedTools, --max-turns
- Long-running agent harnesses: initializer agent, progress files, one feature per session
- Cost management: opusplan, MAX_THINKING_TOKENS, batch API (50% savings)
- Rainbow deployments para no disrumpir agents en ejecución
**Primary sources**:
- [GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- [Effective Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Headless Mode docs](https://code.claude.com/docs/en/headless)
- [Cost Management docs](https://code.claude.com/docs/en/costs)

#### Module 13 — Taller Final (ENHANCE)
**Source file**: `src/routes/modulo/13/+page.svelte`
**Change type**: Nuevo archivo, escenario Claude Code-centric
**Content outline**:
1. Revisión de los 12 módulos previos (checklist)
2. Complejidad ladder: prompt eng → single agent → multi-agent orchestrated → autonomous
3. Arquitecturas de referencia implementadas con Claude Code
4. BranchingScenario con Timer (15 min): diseñar sistema de code review para empresa con 200 PRs/día usando Claude Code
5. El escenario requiere: diseñar CLAUDE.md, definir agent dispatch table, configurar hooks, elegir patterns de orquestación
**Primary sources**: All previous modules' sources consolidated

## 2. Badge System Design

### 13 Module Badges + 1 Special

| Badge ID | Name | Trigger | Module |
|----------|------|---------|--------|
| `agent-anatomy` | Anatomista de Agentes | Complete module 1 | 1 |
| `tool-caller` | Maestro de Herramientas | Complete module 2 | 2 |
| `ecosystem-explorer` | Explorador del Ecosistema | Complete module 3 | 3 |
| `context-engineer` | Ingeniero de Contexto | Complete module 4 | 4 |
| `claude-pro` | Claude Code Pro | Complete module 5 | 5 |
| `agent-builder` | Constructor de Agentes | Complete module 6 | 6 |
| `memory-architect` | Arquitecto de Memoria | Complete module 7 | 7 |
| `deep-diver` | Deep Diver | Complete module 8 | 8 |
| `orchestrator` | Orquestador Multi-Agente | Complete module 9 | 9 |
| `guardian` | Guardián de Seguridad | Complete module 10 | 10 |
| `workspace-master` | Maestro del Entorno | Complete module 11 | 11 |
| `production-ready` | Production Ready | Complete module 12 | 12 |
| `agent-architect` | Arquitecto de Agentes | Complete module 13 | 13 |
| `claude-code-master` | Claude Code Master | Score 90%+ on modules 4, 5, 8 quizzes | Special |

## 3. Store Changes (`src/lib/stores/course.ts`)

```
Changes needed:
- TOTAL_MODULES = 13
- STORE_VERSION = 2 (new constant)
- Add version check in init: if stored version !== STORE_VERSION → reset()
- Replace allBadges array with 14 new badges
- Add claudeCodeMaster badge logic: check modules 4, 5, 8 scores >= 90% of maxScore
- Update progressPercent derived calculation for 13 modules
- Update competency blocks for /resultados (5 blocks → adjust for 13 modules)
```

## 4. Data Changes (`src/lib/data/modules.ts`)

```
Changes needed:
- Replace 12 module definitions with 13 new ones
- Each module: id, title, description, objectives (array), sources (array of {title, url})
- New fields if needed: claudeCodeFocus (boolean), primarySources (array)
```

## 5. Vocabulary Updates (`src/lib/data/vocabulary.ts`)

New terms to add across modules:
- Module 4: context engineering, context rot, compaction, just-in-time context, progressive disclosure
- Module 5: plan mode, worktree, opusplan, /clear, /compact, /rewind
- Module 8: hooks, skills, sub-agents, SKILL.md, frontmatter, PreToolUse, PostToolUse, headless mode, sandbox
- Module 9: agent teams, teammate, task list, mailbox, handoff, orchestrator-worker
- Other modules: update existing terms + add Claude Code specific ones

## 6. Routing Changes

```
Files to create:
- src/routes/modulo/13/+page.svelte (new)

Files to rewrite in-place:
- src/routes/modulo/1/+page.svelte through src/routes/modulo/12/+page.svelte
- src/routes/+page.svelte (home grid: 13 modules)
- src/routes/resultados/+page.svelte (13 modules, new badges)

Files to update:
- src/lib/data/modules.ts (13 module definitions)
- src/lib/data/vocabulary.ts (new terms)
- src/lib/stores/course.ts (TOTAL_MODULES, badges, version)
- src/routes/+layout.svelte (if progress bar needs adjustment)
```

## 7. Migration Strategy

```
localStorage key: agent-mastery-progress
Current: no version field
New: { version: 2, ... }

On init:
1. Read stored data
2. If no 'version' field OR version < 2 → courseStore.reset(), set version = 2
3. Otherwise → load normally
```
