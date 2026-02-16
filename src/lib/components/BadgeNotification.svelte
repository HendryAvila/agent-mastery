<script lang="ts">
  import type { Badge } from '$lib/stores/course';

  interface Props {
    badge: Badge;
    onClose?: () => void;
  }

  let { badge, onClose }: Props = $props();

  $effect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 5000);
    return () => clearTimeout(timer);
  });
</script>

<div class="fixed top-4 right-4 z-[100] slide-in">
  <div class="bg-agent-card border border-agent-accent rounded-xl p-4 shadow-xl glow-accent max-w-sm">
    <div class="flex items-start gap-3">
      <span class="text-3xl">{badge.icon}</span>
      <div class="flex-1">
        <p class="text-xs text-agent-accent uppercase tracking-wider font-bold">Badge desbloqueado</p>
        <p class="text-agent-text font-bold mt-1">{badge.name}</p>
        <p class="text-agent-muted text-sm mt-0.5">{badge.description}</p>
      </div>
      <button onclick={() => onClose?.()} class="text-agent-muted hover:text-agent-text text-sm cursor-pointer">x</button>
    </div>
  </div>
</div>
