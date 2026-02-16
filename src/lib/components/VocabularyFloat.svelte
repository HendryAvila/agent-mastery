<script lang="ts">
  import { courseStore } from '$lib/stores/course';
  import { vocabulary } from '$lib/data/vocabulary';

  interface Props {
    moduleId: number;
  }

  let { moduleId }: Props = $props();

  let minimized = $state(false);
  let closed = $state(false);
  let currentIndex = $state(0);

  let terms = $derived(
    vocabulary
      .filter(v => v.module === moduleId)
      .filter(v => {
        let dismissed: string[] = [];
        courseStore.subscribe(s => { dismissed = s.vocabularyDismissed; })();
        return !dismissed.includes(`${v.module}-${v.term}`);
      })
  );

  let currentTerm = $derived(terms[currentIndex % Math.max(terms.length, 1)]);

  function dismiss() {
    if (currentTerm) {
      courseStore.dismissVocabulary(`${currentTerm.module}-${currentTerm.term}`);
    }
    if (terms.length <= 1) closed = true;
    else currentIndex = currentIndex % Math.max(terms.length - 1, 1);
  }

  function next() {
    currentIndex = (currentIndex + 1) % terms.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + terms.length) % terms.length;
  }
</script>

{#if !closed && terms.length > 0}
  <div class="fixed bottom-4 right-4 z-50 slide-in max-w-xs">
    {#if minimized}
      <button
        onclick={() => minimized = false}
        class="bg-agent-card border border-agent-accent/30 rounded-full px-4 py-2 text-sm text-agent-accent hover:bg-agent-accent/10 transition-all cursor-pointer flex items-center gap-2"
      >
        Vocabulario ({terms.length})
      </button>
    {:else}
      <div class="bg-agent-card border border-agent-accent/30 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-agent-accent uppercase tracking-wider font-bold">{currentTerm?.category}</span>
          <div class="flex items-center gap-1">
            <button onclick={() => minimized = true} class="text-agent-muted hover:text-agent-text text-xs cursor-pointer">--</button>
            <button onclick={() => closed = true} class="text-agent-muted hover:text-agent-danger text-xs cursor-pointer">x</button>
          </div>
        </div>
        <h4 class="text-agent-text font-bold font-mono text-sm">{currentTerm?.term}</h4>
        <p class="text-agent-muted text-xs mt-1 leading-relaxed">{currentTerm?.definition}</p>
        <div class="flex items-center justify-between mt-3">
          <div class="flex gap-1">
            <button onclick={prev} class="text-xs text-agent-muted hover:text-agent-accent cursor-pointer px-1">&larr;</button>
            <span class="text-xs text-agent-muted">{(currentIndex % terms.length) + 1}/{terms.length}</span>
            <button onclick={next} class="text-xs text-agent-muted hover:text-agent-accent cursor-pointer px-1">&rarr;</button>
          </div>
          <button onclick={dismiss} class="text-xs text-agent-success hover:text-agent-success/80 cursor-pointer">Ya lo se</button>
        </div>
      </div>
    {/if}
  </div>
{/if}
