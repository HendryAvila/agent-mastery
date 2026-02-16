<script lang="ts">
  import type { Source } from '$lib/data/modules';

  interface Props {
    sources: Source[];
  }

  let { sources }: Props = $props();
  let open = $state(false);
</script>

<div class="mt-8 border-t border-agent-border pt-4">
  <button
    onclick={() => open = !open}
    class="flex items-center gap-2 text-sm text-agent-muted hover:text-agent-accent transition-colors cursor-pointer"
  >
    <span class="text-xs transition-transform duration-200 {open ? 'rotate-90' : ''}">&#9654;</span>
    Fuentes y referencias ({sources.length})
  </button>

  {#if open}
    <ul class="mt-3 space-y-2 fade-in">
      {#each sources as source}
        <li class="flex items-start gap-2 text-sm">
          <span class="text-agent-accent shrink-0">*</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-agent-accent hover:underline"
          >
            {source.name}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
