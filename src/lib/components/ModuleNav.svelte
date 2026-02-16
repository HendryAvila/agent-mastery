<script lang="ts">
  import { base } from '$app/paths';
  import { totalModules } from '$lib/stores/course';

  interface Props {
    currentModule: number;
  }

  let { currentModule }: Props = $props();
</script>

<div class="flex items-center justify-between mt-8 pt-6 border-t border-agent-border">
  {#if currentModule > 1}
    <a
      href="{base}/modulo/{currentModule - 1}"
      class="btn-secondary text-sm"
    >
      &larr; Modulo {currentModule - 1}
    </a>
  {:else}
    <a href="{base}/" class="btn-secondary text-sm">&larr; Inicio</a>
  {/if}

  <span class="text-agent-muted text-sm font-mono">{currentModule} / {totalModules}</span>

  {#if currentModule < totalModules}
    <a
      href="{base}/modulo/{currentModule + 1}"
      class="btn-primary text-sm"
    >
      Modulo {currentModule + 1} &rarr;
    </a>
  {:else}
    <a href="{base}/resultados" class="btn-primary text-sm">
      Ver resultados
    </a>
  {/if}
</div>
