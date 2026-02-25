<script lang="ts">
  import '../app.css';
  import { base } from '$app/paths';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import { courseStore } from '$lib/stores/course';

  let { children } = $props();
  let totalScore = $state(0);
  let badgeCount = $state(0);

  courseStore.subscribe((s) => {
    totalScore = s.totalScore;
    badgeCount = s.badges.length;
  });
</script>

<div class="min-h-screen bg-agent-darker">
  <!-- Header -->
  <header class="border-b border-agent-border bg-agent-dark/80 backdrop-blur-sm sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between mb-2">
        <a href="{base}/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span class="text-2xl">🤖</span>
          <div>
            <h1 class="text-sm font-black text-agent-text leading-tight">Agent Mastery</h1>
            <p class="text-xs text-agent-muted">De Usuario a Arquitecto de Agentes IA</p>
          </div>
        </a>
        <div class="flex items-center gap-4 text-sm">
          <span class="text-agent-muted">🎯 {totalScore} pts</span>
          <span class="text-agent-muted">{'\u{1F3C5}'} {badgeCount}/14</span>
        </div>
      </div>
      <ProgressBar />
    </div>
  </header>

  <!-- Main content -->
  <main class="pb-16">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="border-t border-agent-border py-6 text-center">
    <p class="text-xs text-agent-muted">Agent Mastery · De Usuario a Arquitecto de Agentes IA</p>
    <p class="text-xs text-agent-muted mt-1">Construido con SvelteKit + Tailwind CSS</p>
  </footer>
</div>
