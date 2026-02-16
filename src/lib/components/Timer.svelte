<script lang="ts">
  interface Props {
    duration: number;
    onTimeUp?: () => void;
    autoStart?: boolean;
    label?: string;
  }

  let { duration, onTimeUp, autoStart = true, label = 'Tiempo restante' }: Props = $props();

  let remaining = $state(duration);
  let running = $state(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  let percent = $derived((remaining / duration) * 100);
  let urgency = $derived(
    percent > 50 ? 'normal' : percent > 25 ? 'warning' : 'critical'
  );

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  export function start() {
    if (running) return;
    running = true;
    intervalId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        remaining = 0;
        pause();
        onTimeUp?.();
      }
    }, 1000);
  }

  export function pause() {
    running = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  export function reset() {
    pause();
    remaining = duration;
  }

  $effect(() => {
    if (autoStart) start();
    return () => { if (intervalId) clearInterval(intervalId); };
  });
</script>

<div class="flex items-center gap-3 px-4 py-2 rounded-lg border {
  urgency === 'normal' ? 'border-agent-accent/30 bg-agent-accent/5' :
  urgency === 'warning' ? 'border-agent-warning/30 bg-agent-warning/5' :
  'border-agent-danger/30 bg-agent-danger/5'
} {urgency === 'critical' ? 'pulse-glow' : ''}">
  <span class="text-sm {
    urgency === 'normal' ? 'text-agent-accent' :
    urgency === 'warning' ? 'text-agent-warning' :
    'text-agent-danger'
  }">{label}</span>
  <span class="font-mono font-bold text-lg {
    urgency === 'normal' ? 'text-agent-accent' :
    urgency === 'warning' ? 'text-agent-warning' :
    'text-agent-danger'
  }">
    {formatTime(remaining)}
  </span>
  <div class="flex-1 h-2 bg-agent-dark rounded-full overflow-hidden">
    <div class="h-full rounded-full transition-all duration-1000 {
      urgency === 'normal' ? 'bg-agent-accent' :
      urgency === 'warning' ? 'bg-agent-warning' :
      'bg-agent-danger'
    }" style="width: {percent}%"></div>
  </div>
</div>
