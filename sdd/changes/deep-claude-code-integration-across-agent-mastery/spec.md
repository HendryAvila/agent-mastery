# Specification: Deep Claude Code Integration

## Functional Requirements

### Must Have (Launch Blockers)

- **FR-001**: Reestructurar curso de 12 a 13 módulos: merge módulos 7+8 actuales en uno, agregar "Context Engineering" (posición #4) y "Claude Code Deep Dive" (posición #8)
- **FR-002**: Cada módulo debe tener una sección "En Claude Code" que conecte el concepto general con la implementación específica en Claude Code, con al menos 3 fuentes oficiales citadas
- **FR-003**: Crear módulo "Context Engineering" (#4) cubriendo: CLAUDE.md hierarchy (6 capas), just-in-time context loading, compaction strategies, 60% context rule, structured note-taking, sub-agent context isolation. Fuentes: Anthropic "Effective Context Engineering", "Effective Harnesses", docs oficiales de memory
- **FR-004**: Crear módulo "Claude Code Deep Dive" (#8) cubriendo: .claude/ directory structure, settings.json, hooks system (17 events, 3 tipos), skills system (SKILL.md + frontmatter), sub-agents (built-in + custom), permission model, headless mode. Fuentes: docs oficiales de Claude Code
- **FR-005**: Merge módulos 7 (Frameworks) + 8 (Orquestación) en módulo #9 "Multi-Agent: Frameworks y Orquestación" con Claude Agent SDK como framework primario y patterns implementados con Claude Code sub-agents
- **FR-006**: Diseñar 13 nuevos badges (1 por módulo + 1 "Claude Code Master" especial)
- **FR-007**: Badge "Claude Code Master" se desbloquea al obtener 90%+ en quizzes de módulos 4, 5, 8 (los módulos más Claude Code-heavy)
- **FR-008**: Actualizar `src/lib/data/modules.ts` con metadatos de los 13 módulos (títulos, descripciones, objetivos, fuentes)
- **FR-009**: Actualizar `src/lib/stores/course.ts` con: `TOTAL_MODULES = 13`, nuevo array de badges, lógica de "Claude Code Master"
- **FR-010**: Actualizar routing: crear `/modulo/13/+page.svelte`, reordenar contenido de módulos existentes según nueva numeración
- **FR-011**: Cada módulo debe tener quiz con al menos 2 preguntas específicas sobre Claude Code (no solo conceptos genéricos)
- **FR-012**: Actualizar `+page.svelte` (home) para mostrar grid de 13 módulos
- **FR-013**: Actualizar `/resultados/+page.svelte` para reflejar 13 módulos y nuevos badges

### Should Have (High Value)

- **FR-014**: Cada módulo debe tener un diagrama InteractiveFlow actualizado que incluya nodos de Claude Code (no solo flujos genéricos)
- **FR-015**: Módulo 5 (Trabajar CON Claude Code) debe incluir BranchingScenario con decisiones reales de Claude Code: cuándo usar /clear, cuándo Plan Mode, cuándo sub-agents
- **FR-016**: Módulo 11 (Entorno) debe incluir case study de incident.io (4-7 agentes concurrentes, worktrees, fast tooling prerequisite)
- **FR-017**: Módulo 6 (Construir Agente) debe referenciar Hoofy MCP como case study de MCP server open-source con architecture patterns (composition root, bridge, DIP)
- **FR-018**: Módulo 12 (Producción) debe incluir sección sobre Claude Code GitHub Actions con YAML de workflow real
- **FR-019**: Agregar vocabulary terms de Claude Code a `src/lib/data/vocabulary.ts` para cada módulo (CLAUDE.md, hooks, skills, MCP, sub-agents, worktrees, headless, compaction, etc.)

### Could Have (Future Enhancement)

- **FR-020**: Sección "Top 10 Community Tips" en módulo 5 con fuentes de Boris Cherny, Steve Kinney, Addy Osmani
- **FR-021**: Módulo 10 (Guardrails) incluir ejemplo de PreToolUse hook que bloquea `rm -rf` con código real
- **FR-022**: Módulo 13 (Taller Final) con timer más largo (15 min) y escenario que requiera diseñar CLAUDE.md + agent dispatch table
- **FR-023**: Easter egg badge "Hoofy's Apprentice" al completar todos los módulos con 100% en quizzes

### Won't Have (Explicitly Excluded)

- **FR-024**: No se crean labs interactivos que ejecuten Claude Code real (el curso es estático)
- **FR-025**: No se agrega backend, API, ni autenticación
- **FR-026**: No se cambia el tech stack (SvelteKit 5, Svelte 5 runes, Tailwind 4, adapter-static)
- **FR-027**: No se cubren Cursor, Copilot, Devin con la misma profundidad que Claude Code

## Non-Functional Requirements

- **NFR-001**: Cada claim técnico debe tener fuente verificable (URL) citada en el componente SourcesSection del módulo
- **NFR-002**: El curso debe mantener consistencia visual (mismos colores agent-*, mismas clases CSS, mismo design system)
- **NFR-003**: Todos los módulos deben usar Svelte 5 runes ($state, $derived, $props, $effect) — NO Svelte 4 syntax
- **NFR-004**: El contenido es en español rioplatense (mantener tono actual del curso)
- **NFR-005**: Build estático debe funcionar correctamente con `npm run build` y GitHub Pages deployment
- **NFR-006**: Cada módulo individual no debe exceder ~1300 líneas de Svelte (mantener manejable)
- **NFR-007**: `npm run check` debe pasar sin errores de TypeScript
- **NFR-008**: La página home debe cargar el grid de 13 módulos sin degradar performance
- **NFR-009**: localStorage migration: usuarios existentes con progreso de 12 módulos deben migrar a 13 sin perder datos

## Dependencies

- Research data de los 4 agentes (completado)
- Componentes existentes: Quiz, InteractiveFlow, BranchingScenario, Timer, ModuleNav, ProgressBar, BadgeNotification, SourcesSection, VocabularyFloat
- Datos existentes: modules.ts, vocabulary.ts, course.ts store

## Assumptions

- El deploy sigue siendo GitHub Pages con BASE_PATH=/agent-mastery
- Los usuarios existentes son pocos (curso nuevo), por lo que la migración de localStorage no es crítica pero sí deseable
- Se mantiene la estructura de routing `/modulo/N/+page.svelte`
- Los 18 artículos de Anthropic Engineering y las URLs de docs seguirán activos
