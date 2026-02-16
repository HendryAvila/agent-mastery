<script lang="ts">
  import { progressPercent } from '$lib/stores/course';
</script>

<div class="flex items-center gap-3">
  <div class="flex-1 h-2 bg-agent-dark rounded-full overflow-hidden">
    <div
      class="h-full bg-agent-accent rounded-full transition-all duration-700"
      style="width: {$progressPercent}%"
    ></div>
  </div>
  <span class="text-xs text-agent-muted font-mono shrink-0">{$progressPercent}%</span>
</div>
