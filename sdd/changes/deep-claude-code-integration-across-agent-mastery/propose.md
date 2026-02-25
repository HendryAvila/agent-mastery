# Proposal: Deep Claude Code Integration

## Problem Statement

El curso "Agent Mastery" actualmente cubre conceptos de agentes IA de forma genérica y agnóstica. Claude Code se menciona como UNA de muchas herramientas sin profundizar. Esto deja gaps críticos:

- **Zero cobertura** de Context Engineering (la disciplina #1 según Anthropic)
- **Zero cobertura** de CLAUDE.md authoring, hooks, skills, sub-agents, permisos
- **Módulos 7+8** se solapan 60-70% (Frameworks + Orquestación)
- Los estudiantes no salen sabiendo USAR Claude Code profesionalmente

Según Anthropic: *"Context engineering — not prompt engineering — is THE foundational discipline"* ([Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).

## Target Users

1. **Desarrolladores que ya usan Claude Code** y quieren ir de "vibe coding" a uso profesional con CLAUDE.md, hooks, skills, y multi-agent
2. **Desarrolladores que evalúan herramientas** y necesitan entender por qué Claude Code y cómo configurarlo vs. Cursor, Aider, OpenCode
3. **Tech leads / arquitectos** que necesitan diseñar sistemas multi-agente y establecer prácticas de equipo con Claude Code

## Proposed Solution

### Reestructuración a 13 Módulos

**Merge**: Módulos 7+8 actuales (Frameworks + Orquestación) → 1 módulo fusionado
**Nuevos**: 2 módulos dedicados (Context Engineering + Claude Code Deep Dive)
**Resultado**: 12 - 1 (merge) + 2 (nuevos) = **13 módulos**

### Estructura Propuesta

| # | Módulo | Tipo de Cambio | Enfoque Claude Code |
|---|--------|---------------|---------------------|
| 1 | Anatomía de un Agente IA | MEJORAR | Claude Code como implementación de referencia de los 4 componentes (LLM, tools, memory, planning) |
| 2 | Tool Calling | MEJORAR | MCP como extensión de herramientas + tool design principles de Anthropic |
| 3 | Ecosistema 2026 | REFOCALIZAR | Claude Code como agente primario, otros como landscape comparativo |
| 4 | **Context Engineering** | **NUEVO** | CLAUDE.md mastery, gestión de contexto, just-in-time loading, compaction, 60% rule |
| 5 | Trabajar CON Claude Code | REWRITE MAYOR | Best practices oficiales, Plan-Act-Verify, Boris Cherny 22 tips |
| 6 | Construir tu Agente | MEJORAR | Claude Agent SDK, MCP server development, Hoofy como case study |
| 7 | Memoria, Planning y Razonamiento | MEJORAR | Memory hierarchy de Claude Code (6 capas), Think tool, extended thinking |
| 8 | **Claude Code Deep Dive** | **NUEVO** | .claude/ directory, hooks (17 events), skills, sub-agents, permisos, headless mode |
| 9 | Multi-Agent: Frameworks y Orquestación | MERGE 7+8 | Claude Agent SDK como primario + orchestrator-worker, pipeline, handoff patterns |
| 10 | Guardrails, Seguridad y Evaluación | MEJORAR | Claude Code permissions, sandbox, hooks de seguridad, evals (3 tipos) |
| 11 | Entorno del Agent Architect | REFOCALIZAR | Claude Code workspace completo, worktrees, CI/CD, incident.io case study |
| 12 | Agentes en Producción | MEJORAR | Headless mode, GitHub Actions, cost optimization, long-running harnesses |
| 13 | Taller Final | MEJORAR | Diseño Claude Code-centric con CLAUDE.md + specialists + hooks + MCP |

### Cada Módulo Incluirá

1. **Sección "En Claude Code"** — cómo el concepto se implementa específicamente en Claude Code
2. **Fuentes citadas** — usando el componente `SourcesSection` existente, con URLs verificadas
3. **Quiz actualizado** — preguntas específicas sobre Claude Code (no solo conceptos genéricos)
4. **Diagrama interactivo actualizado** — flujos que muestran Claude Code en acción

### Fuentes Primarias (verificadas por research)

- 18 artículos de Anthropic Engineering Blog (Dec 2024 - Feb 2026)
- 15+ páginas de docs oficiales de Claude Code
- 60+ fuentes de comunidad (Boris Cherny, incident.io, Addy Osmani, etc.)
- Hoofy MCP como case study open-source de MCP server

## Out of Scope

- No se cambia el tech stack (SvelteKit 5, Svelte 5, Tailwind 4)
- No se modifica el sistema de gamificación (badges, scoring) más allá de ajustar badges para nuevos módulos
- No se agrega backend ni autenticación
- No se crean labs interactivos con Claude Code real (el curso es estático)
- No se cubren otros coding agents (Cursor, Copilot) con la misma profundidad que Claude Code

## Success Criteria

1. Cada módulo tiene al menos 3 referencias a fuentes oficiales verificadas
2. Los 13 módulos forman una progresión coherente de "qué es un agente" a "diseña tu sistema con Claude Code"
3. Un estudiante que complete el curso puede: configurar CLAUDE.md, crear skills/hooks, diseñar arquitectura multi-agent, y usar Claude Code en CI/CD
4. El módulo de Context Engineering cubre las 3 técnicas de Anthropic: compaction, structured note-taking, sub-agent architectures
5. Cero contenido inventado — todo respaldado por docs, artículos, o community patterns con fuente citada

## Open Questions

1. ¿Los badges actuales se reasignan a los nuevos módulos o se crean nuevos?
2. ¿El módulo de Context Engineering va como #4 (antes de prácticas) o como #5 (después de prácticas)?
3. ¿Queremos un badge especial tipo "Claude Code Master" que requiera pasar quizzes de Claude Code con 90%+?
