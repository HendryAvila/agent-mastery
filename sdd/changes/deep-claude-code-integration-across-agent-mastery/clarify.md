# Clarity Gate: Ambiguity Resolution

## Questions Asked and Answers Received

### Q1: Renumeración de módulos — ¿cómo manejamos el contenido existente?
**Answer**: Opción B — Reescribir todos los módulos in-place en sus nuevas posiciones directamente. No hay renombrado de carpetas, se reescribe el contenido en la posición final.

**Impact**: Cada archivo `/modulo/N/+page.svelte` se reescribe con el contenido que corresponde a su nueva posición. Ejemplo: `/modulo/4/+page.svelte` se reescribe con Context Engineering (nuevo), `/modulo/5/+page.svelte` se reescribe con el contenido del viejo módulo 4 (Best Practices) ahora rewritten para Claude Code, etc.

### Q2: Migración de localStorage
**Answer**: Opción A — Reset completo. Detectar versión vieja, limpiar, empezar de cero.

**Impact**: Agregar version key al store. Si version no coincide con la actual, `courseStore.reset()` y re-inicializar. Simple, limpio, sin bugs de mapping.

### Q3: Scope del rewrite del módulo 5
**Answer**: Rewrite completo desde cero. No mantener contenido genérico.

**Impact**: Módulo 5 ("Trabajar CON Claude Code") se escribe 100% nuevo basado en: best practices oficiales de Claude Code, Boris Cherny 22 tips, Plan-Act-Verify workflow, incident.io case study.

### Q4: Tono del curso (agregada por el usuario)
**Answer**: Mantener tono educativo. No personalidades ni personajes. Orientado a enseñanza seria y profesional.

**Impact**: El contenido debe ser educativo, directo, profesional. Sin humor forzado, sin mascota del curso, sin lenguaje infantil. Puede ser cercano y rioplatense pero siempre con sustancia técnica. El tono actual del curso es correcto — mantenerlo.

## Dimension Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Target Users | 90 | Bien definidos: devs que usan/evalúan Claude Code, tech leads |
| Core Functionality | 95 | 13 módulos con contenido específico por módulo y fuentes verificadas |
| Data Model | 85 | Store con versioning, 13+ badges, localStorage reset, modules.ts update |
| Integrations | 80 | Componentes existentes reutilizados, no hay integraciones externas nuevas |
| Edge Cases | 85 | localStorage migration resuelto (reset), renumeración resuelta (rewrite in-place) |
| Security | 90 | No aplica (curso estático), pero URLs de fuentes deben ser verificables |
| Scale/Performance | 85 | 13 módulos ~1000-1300 líneas cada uno, build estático, no hay concerns de escala |
| Scope Boundaries | 90 | Out of scope claramente definido (no labs reales, no backend, no cambio de stack) |

**Overall Clarity Score: 87.5/100** — PASS (threshold: 50 for expert mode)

## Resolved Ambiguities Summary

1. **Archivos se reescriben in-place** en su posición final (no hay rename de carpetas)
2. **localStorage se resetea** al detectar versión vieja (version key en store)
3. **Módulo 5 es rewrite 100% nuevo** — zero contenido genérico preservado
4. **Tono educativo profesional** — sin personalidades, serio pero cercano, rioplatense
