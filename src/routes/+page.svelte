<script lang="ts">
  import { base } from '$app/paths';
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';

  let currentModule = $state(1);
  let userName = $state('');
  let totalScore = $state(0);
  let badges = $state<typeof allBadges>([]);
  let showNameInput = $state(false);

  courseStore.subscribe((s) => {
    currentModule = s.currentModule;
    userName = s.userName;
    totalScore = s.totalScore;
    badges = s.badges;
  });

  function saveName(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    if (input.value.trim()) {
      courseStore.setUserName(input.value.trim());
      showNameInput = false;
    }
  }

  const blockLabels: Record<number, string> = {
    1: 'BLOQUE 1: FUNDAMENTOS',
    3: 'BLOQUE 2: CONTEXT & USO',
    6: 'BLOQUE 3: CONSTRUCCIÓN',
    8: 'BLOQUE 4: MULTI-AGENTE',
    10: 'BLOQUE 5: MAESTRÍA'
  };
</script>

<svelte:head>
  <title>Agent Mastery — De Usuario a Arquitecto de Agentes IA</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  <!-- Hero Section -->
  <div class="text-center mb-12 fade-in">
    <div class="text-7xl mb-4">🤖</div>
    <h1 class="text-4xl md:text-5xl font-black mb-3">
      <span class="text-agent-accent">Agent</span> Mastery
    </h1>
    <p class="text-xl text-agent-muted mb-2">De Usuario a Arquitecto de Agentes IA</p>
    <p class="text-sm text-agent-highlight max-w-2xl mx-auto">
      Los agentes ejecutan. Tu trabajo es DIRIGIR, CONSTRUIR y ORQUESTAR.
    </p>

    {#if !userName}
      {#if showNameInput}
        <form onsubmit={saveName} class="mt-6 flex items-center gap-2 justify-center">
          <input
            type="text"
            placeholder="Tu nombre..."
            class="bg-agent-card border border-agent-border rounded-lg px-4 py-2 text-agent-text focus:border-agent-accent focus:outline-none"
            autofocus
          />
          <button type="submit" class="btn-primary">Guardar</button>
        </form>
      {:else}
        <button onclick={() => showNameInput = true} class="btn-secondary mt-6">
          Ingresa tu nombre para el certificado
        </button>
      {/if}
    {:else}
      <p class="text-sm text-agent-accent mt-4">Bienvenido de vuelta, <span class="font-bold">{userName}</span></p>
    {/if}
  </div>

  <!-- Stats bar -->
  <div class="grid grid-cols-3 gap-4 mb-10">
    <div class="card text-center">
      <p class="text-2xl font-black text-agent-accent">{totalScore}</p>
      <p class="text-xs text-agent-muted uppercase tracking-wider">Puntos</p>
    </div>
    <div class="card text-center">
      <p class="text-2xl font-black text-agent-accent">{badges.length}/14</p>
      <p class="text-xs text-agent-muted uppercase tracking-wider">Badges</p>
    </div>
    <div class="card text-center">
      <p class="text-2xl font-black text-agent-accent">{Object.values($courseStore.modules).filter(m => m.completed).length}/13</p>
      <p class="text-xs text-agent-muted uppercase tracking-wider">Módulos</p>
    </div>
  </div>

  <!-- Module Grid -->
  <div class="space-y-8">
    {#each modules as mod}
      {#if blockLabels[mod.id]}
        <div class="flex items-center gap-3 mt-8 mb-4">
          <div class="h-px flex-1 bg-agent-border"></div>
          <span class="text-xs font-bold text-agent-accent uppercase tracking-widest">{blockLabels[mod.id]}</span>
          <div class="h-px flex-1 bg-agent-border"></div>
        </div>
      {/if}

      {@const isUnlocked = mod.id <= currentModule}
      {@const isCompleted = $courseStore.modules[mod.id]?.completed}
      {@const moduleScore = $courseStore.modules[mod.id]?.score ?? 0}
      {@const moduleMax = $courseStore.modules[mod.id]?.maxScore ?? 0}

      {#if isUnlocked}
        <a href="{base}/modulo/{mod.id}" class="block card-interactive group">
          <div class="flex items-start gap-4">
            <div class="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {mod.icon}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono text-agent-muted">M{String(mod.id).padStart(2, '0')}</span>
                {#if isCompleted}
                  <span class="badge bg-agent-success/20 text-agent-success">Completado ✓</span>
                {:else if $courseStore.modules[mod.id]?.startedAt}
                  <span class="badge bg-agent-accent/20 text-agent-accent">En progreso</span>
                {/if}
                <span class="badge bg-agent-card text-agent-muted border border-agent-border ml-auto">{mod.duration}</span>
              </div>
              <h3 class="text-lg font-bold text-agent-text group-hover:text-agent-accent transition-colors">{mod.title}</h3>
              <p class="text-sm text-agent-muted mt-1">{mod.subtitle}</p>
              <div class="flex items-center gap-3 mt-2">
                <span class="text-xs text-agent-muted">{mod.type}</span>
                {#if isCompleted && moduleMax > 0}
                  <span class="text-xs text-agent-accent ml-auto">{moduleScore}/{moduleMax} pts</span>
                {/if}
              </div>
            </div>
          </div>
        </a>
      {:else}
        <div class="card opacity-40 cursor-not-allowed">
          <div class="flex items-start gap-4">
            <div class="text-4xl flex-shrink-0 grayscale">🔒</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono text-agent-muted">M{String(mod.id).padStart(2, '0')}</span>
                <span class="badge bg-agent-card text-agent-muted border border-agent-border ml-auto">{mod.duration}</span>
              </div>
              <h3 class="text-lg font-bold text-agent-muted">{mod.title}</h3>
              <p class="text-sm text-agent-muted/50 mt-1">Completa el módulo anterior para desbloquear</p>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Results Link -->
  <div class="mt-12 text-center">
    <a href="{base}/resultados" class="btn-secondary">
      📊 Ver Resultados y Certificado
    </a>
  </div>
</div>
