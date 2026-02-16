<script lang="ts">
  import { base } from '$app/paths';
  import { courseStore, allBadges, progressPercent } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import { browser } from '$app/environment';

  interface ModuleState { completed: boolean; score: number; maxScore: number }
  interface PageState {
    userName: string;
    totalScore: number;
    badges: typeof allBadges;
    modules: Record<number, ModuleState>;
    currentModule: number;
  }

  let state: PageState = $state({
    userName: '',
    totalScore: 0,
    badges: [] as typeof allBadges,
    modules: {} as Record<number, ModuleState>,
    currentModule: 1
  });
  let percent = $state(0);
  let showReset = $state(false);
  let showCertificate = $state(false);

  courseStore.subscribe((s) => {
    state = {
      userName: s.userName,
      totalScore: s.totalScore,
      badges: s.badges,
      modules: s.modules,
      currentModule: s.currentModule
    };
  });

  progressPercent.subscribe((p) => { percent = p; });

  const completedCount = $derived(Object.values(state.modules).filter(m => m.completed).length);
  const maxPossibleScore = $derived(
    Object.values(state.modules).reduce((sum, m) => sum + m.maxScore, 0)
  );
  const allComplete = $derived(completedCount === 12);

  const competencies = [
    { name: 'Fundamentos de Agentes', icon: '🧬', modules: [1, 2], description: 'Anatomía y tool calling' },
    { name: 'Ecosistema y Uso', icon: '🌐', modules: [3, 4], description: 'Conocimiento del ecosistema y uso profesional' },
    { name: 'Construcción', icon: '⚡', modules: [5, 6], description: 'Construir agentes y sistemas de memoria' },
    { name: 'Orquestación', icon: '🎭', modules: [7, 8], description: 'Frameworks y patrones multi-agente' },
    { name: 'Producción', icon: '🛡️', modules: [9, 10, 11, 12], description: 'Seguridad, entorno, producción y diseño' }
  ];

  function getCompetencyScore(moduleIds: number[]): number {
    let total = 0, max = 0;
    for (const id of moduleIds) {
      const m = state.modules[id];
      if (m) { total += m.score; max += m.maxScore; }
    }
    return max > 0 ? Math.round((total / max) * 100) : 0;
  }

  function resetCourse() {
    courseStore.reset();
    showReset = false;
  }

  function printCertificate() {
    if (browser) window.print();
  }
</script>

<svelte:head>
  <title>Resultados — Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="text-center mb-10 fade-in">
    <span class="text-5xl">📊</span>
    <h1 class="text-3xl font-black mt-2">Resultados del Curso</h1>
    <p class="text-agent-muted">Tu progreso en Agent Mastery</p>
  </div>

  <!-- Overview Cards -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
    <div class="card text-center">
      <p class="text-3xl font-black text-agent-accent">{completedCount}</p>
      <p class="text-xs text-agent-muted uppercase">Módulos</p>
    </div>
    <div class="card text-center">
      <p class="text-3xl font-black text-agent-accent">{state.totalScore}</p>
      <p class="text-xs text-agent-muted uppercase">Puntos</p>
    </div>
    <div class="card text-center">
      <p class="text-3xl font-black text-agent-accent">{state.badges.length}</p>
      <p class="text-xs text-agent-muted uppercase">Badges</p>
    </div>
    <div class="card text-center">
      <p class="text-3xl font-black text-agent-accent">{percent}%</p>
      <p class="text-xs text-agent-muted uppercase">Progreso</p>
    </div>
  </div>

  <!-- Per-module breakdown -->
  <div class="card mb-8">
    <h2 class="text-xl font-bold mb-4">Detalle por Módulo</h2>
    <div class="space-y-3">
      {#each modules as mod}
        {@const progress = state.modules[mod.id]}
        <div class="flex items-center gap-3">
          <span class="text-xl">{mod.icon}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-bold truncate">{mod.title}</span>
              {#if progress?.completed}
                <span class="text-xs text-agent-success font-bold">{progress.score}/{progress.maxScore}</span>
              {:else}
                <span class="text-xs text-agent-muted">—</span>
              {/if}
            </div>
            <div class="w-full bg-agent-darker rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all duration-700 {progress?.completed ? 'bg-agent-accent' : 'bg-agent-border'}"
                style="width: {progress?.completed && progress.maxScore > 0 ? Math.round((progress.score / progress.maxScore) * 100) : 0}%"
              ></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Competency Assessment -->
  <div class="card mb-8">
    <h2 class="text-xl font-bold mb-4">Evaluación por Competencia</h2>
    <div class="space-y-4">
      {#each competencies as comp}
        {@const score = getCompetencyScore(comp.modules)}
        <div>
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span>{comp.icon}</span>
              <span class="text-sm font-bold">{comp.name}</span>
            </div>
            <span class="text-sm font-bold {score >= 80 ? 'text-agent-success' : score >= 50 ? 'text-agent-warning' : 'text-agent-muted'}">{score}%</span>
          </div>
          <p class="text-xs text-agent-muted mb-1">{comp.description}</p>
          <div class="w-full bg-agent-darker rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-700 {score >= 80 ? 'bg-agent-success' : score >= 50 ? 'bg-agent-warning' : 'bg-agent-border'}"
              style="width: {score}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Badge Gallery -->
  <div class="card mb-8">
    <h2 class="text-xl font-bold mb-4">Galería de Badges</h2>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      {#each allBadges as badge}
        {@const earned = state.badges.find(b => b.id === badge.id)}
        <div class="text-center p-3 rounded-lg {earned ? 'bg-agent-accent/10 border border-agent-accent/30' : 'bg-agent-darker opacity-40'}">
          <span class="text-3xl {earned ? '' : 'grayscale'}">{badge.icon}</span>
          <p class="text-xs font-bold mt-1 {earned ? 'text-agent-accent' : 'text-agent-muted'}">{badge.name}</p>
          <p class="text-xs text-agent-muted mt-0.5">{badge.description}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Certificate -->
  {#if allComplete && state.userName}
    <div class="card mb-8 text-center glow-accent">
      <div class="text-5xl mb-3">🎓</div>
      <h2 class="text-2xl font-black text-agent-accent mb-2">Certificado de Completitud</h2>
      <p class="text-agent-muted mb-6">Has demostrado dominio completo en arquitectura de agentes IA</p>

      {#if showCertificate}
        <div class="border-2 border-agent-accent rounded-xl p-8 mb-4 bg-agent-darker print:bg-white print:text-black">
          <p class="text-xs text-agent-muted uppercase tracking-widest mb-4">Certificado de Completitud</p>
          <p class="text-3xl font-black text-agent-accent mb-2">Agent Mastery</p>
          <p class="text-agent-muted mb-6">De Usuario a Arquitecto de Agentes IA</p>
          <p class="text-sm text-agent-muted mb-1">Otorgado a</p>
          <p class="text-2xl font-bold text-agent-text mb-4">{state.userName}</p>
          <div class="flex justify-center gap-8 text-sm text-agent-muted mb-4">
            <span>Puntos: {state.totalScore}</span>
            <span>Badges: {state.badges.length}/10</span>
            <span>Módulos: 12/12</span>
          </div>
          <p class="text-xs text-agent-muted">Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onclick={printCertificate} class="btn-primary">Imprimir Certificado</button>
      {:else}
        <button onclick={() => showCertificate = true} class="btn-primary">Ver Certificado</button>
      {/if}
    </div>
  {:else if allComplete}
    <div class="card mb-8 text-center">
      <p class="text-agent-warning">Ingresa tu nombre en la página principal para generar tu certificado.</p>
    </div>
  {/if}

  <!-- Further Learning -->
  <div class="card mb-8">
    <h2 class="text-xl font-bold mb-4">Siguientes Pasos</h2>
    <div class="space-y-3">
      <a href="https://www.anthropic.com/research/building-effective-agents" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">Anthropic: Building Effective AI Agents</span>
        <p class="text-xs text-agent-muted">El paper fundacional sobre construcción de agentes</p>
      </a>
      <a href="https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">OpenAI: A Practical Guide to Building Agents</span>
        <p class="text-xs text-agent-muted">Guía práctica con patrones de producción</p>
      </a>
      <a href="https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">Microsoft: AI Agent Design Patterns</span>
        <p class="text-xs text-agent-muted">Patrones de arquitectura para agentes en Azure</p>
      </a>
      <a href="https://strandsagents.com/latest/" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">AWS Strands Agents SDK</span>
        <p class="text-xs text-agent-muted">Framework open source para construir agentes con Python</p>
      </a>
      <a href="https://docs.anthropic.com/en/docs/build-with-claude/tool-use" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">Anthropic: Tool Use Documentation</span>
        <p class="text-xs text-agent-muted">Documentación oficial de tool use con Claude</p>
      </a>
      <a href="https://openai.github.io/openai-agents-python/" target="_blank" rel="noopener" class="block p-3 rounded-lg border border-agent-border hover:border-agent-accent transition-colors">
        <span class="text-sm font-bold text-agent-text">OpenAI Agents SDK</span>
        <p class="text-xs text-agent-muted">SDK oficial para construir agentes multi-modelo</p>
      </a>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-between">
    <a href="{base}/" class="btn-secondary">← Volver al Curso</a>

    {#if showReset}
      <div class="flex items-center gap-2">
        <span class="text-sm text-agent-danger">¿Seguro?</span>
        <button onclick={resetCourse} class="btn-danger">Sí, reiniciar</button>
        <button onclick={() => showReset = false} class="btn-secondary">Cancelar</button>
      </div>
    {:else}
      <button onclick={() => showReset = true} class="btn-danger">Reiniciar Curso</button>
    {/if}
  </div>
</div>
