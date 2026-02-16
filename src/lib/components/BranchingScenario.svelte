<script lang="ts">
  interface ScenarioChoice {
    text: string;
    nextId: string;
    points: number;
    feedback?: string;
  }

  interface ScenarioOutcome {
    title: string;
    description: string;
    score: number;
    maxScore: number;
    grade: 'excellent' | 'good' | 'needs-work' | 'critical';
    lessons: string[];
  }

  interface ScenarioNode {
    id: string;
    narrative: string;
    choices?: ScenarioChoice[];
    outcome?: ScenarioOutcome;
  }

  interface Props {
    nodes: Record<string, ScenarioNode>;
    startId: string;
    title: string;
    onComplete?: (score: number, maxScore: number) => void;
  }

  let { nodes, startId, title, onComplete }: Props = $props();

  let currentId = $state(startId);
  let totalPoints = $state(0);
  let history = $state<{ nodeId: string; choiceText: string; points: number; feedback?: string }[]>([]);
  let showFeedback = $state(false);
  let lastFeedback = $state('');
  let lastPoints = $state(0);

  let currentNode = $derived(nodes[currentId]);
  let isOutcome = $derived(!!currentNode?.outcome);

  function makeChoice(choice: ScenarioChoice) {
    totalPoints += choice.points;
    lastPoints = choice.points;
    lastFeedback = choice.feedback ?? '';
    history = [...history, { nodeId: currentId, choiceText: choice.text, points: choice.points, feedback: choice.feedback }];

    if (choice.feedback) {
      showFeedback = true;
      setTimeout(() => {
        showFeedback = false;
        currentId = choice.nextId;
        if (nodes[choice.nextId]?.outcome) {
          onComplete?.(totalPoints, nodes[choice.nextId].outcome!.maxScore);
        }
      }, 2500);
    } else {
      currentId = choice.nextId;
      if (nodes[choice.nextId]?.outcome) {
        onComplete?.(totalPoints, nodes[choice.nextId].outcome!.maxScore);
      }
    }
  }

  function restart() {
    currentId = startId;
    totalPoints = 0;
    history = [];
    showFeedback = false;
  }

  const gradeColors: Record<string, string> = {
    excellent: 'text-agent-success border-agent-success',
    good: 'text-agent-accent border-agent-accent',
    'needs-work': 'text-agent-warning border-agent-warning',
    critical: 'text-agent-danger border-agent-danger',
  };

  const gradeEmoji: Record<string, string> = {
    excellent: '\u{1F3C6}',
    good: '\u{1F44D}',
    'needs-work': '\u26A0\uFE0F',
    critical: '\u{1F480}',
  };
</script>

<div class="bg-agent-card border border-agent-border rounded-xl overflow-hidden fade-in">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-agent-border bg-agent-dark">
    <h3 class="text-lg font-bold text-agent-text">{title}</h3>
    <div class="flex items-center gap-4 mt-1">
      <span class="text-xs text-agent-muted">Puntos: <span class="text-agent-accent font-bold">{totalPoints}</span></span>
      <span class="text-xs text-agent-muted">Decisiones: <span class="text-agent-accent font-bold">{history.length}</span></span>
    </div>
  </div>

  <div class="p-6">
    {#if showFeedback}
      <!-- Feedback overlay -->
      <div class="text-center py-8 fade-in">
        <span class="text-3xl">{lastPoints > 0 ? '\u2705' : lastPoints === 0 ? '\u{1F914}' : '\u274C'}</span>
        <p class="text-agent-text mt-3 font-medium">{lastFeedback}</p>
        <p class="text-sm mt-2 {lastPoints > 0 ? 'text-agent-success' : lastPoints === 0 ? 'text-agent-warning' : 'text-agent-danger'}">
          {lastPoints > 0 ? `+${lastPoints} puntos` : lastPoints === 0 ? 'Sin puntos' : `${lastPoints} puntos`}
        </p>
      </div>
    {:else if isOutcome && currentNode.outcome}
      <!-- Outcome -->
      <div class="text-center">
        <span class="text-5xl">{gradeEmoji[currentNode.outcome.grade]}</span>
        <h4 class="text-xl font-bold mt-3 {gradeColors[currentNode.outcome.grade]}">{currentNode.outcome.title}</h4>
        <p class="text-agent-muted mt-2">{currentNode.outcome.description}</p>
        <div class="mt-4 p-4 bg-agent-dark rounded-lg text-left">
          <p class="text-sm font-bold text-agent-text mb-2">Puntuacion: {currentNode.outcome.score !== undefined ? currentNode.outcome.score : totalPoints}/{currentNode.outcome.maxScore}</p>
          <p class="text-sm font-bold text-agent-text mb-2">Lecciones aprendidas:</p>
          <ul class="space-y-1">
            {#each currentNode.outcome.lessons as lesson}
              <li class="text-sm text-agent-muted flex items-start gap-2">
                <span class="text-agent-accent shrink-0">*</span>
                {lesson}
              </li>
            {/each}
          </ul>
        </div>
        <button onclick={restart} class="btn-secondary mt-4">Reintentar escenario</button>
      </div>
    {:else if currentNode}
      <!-- Narrative -->
      <div class="mb-6">
        <p class="text-agent-text leading-relaxed whitespace-pre-line">{currentNode.narrative}</p>
      </div>

      <!-- Choices -->
      {#if currentNode.choices}
        <div class="space-y-3">
          {#each currentNode.choices as choice, i}
            <button
              onclick={() => makeChoice(choice)}
              class="w-full text-left p-4 rounded-lg border border-agent-border bg-agent-dark hover:border-agent-accent/50 hover:bg-agent-accent/5 transition-all duration-200 cursor-pointer"
            >
              <div class="flex items-start gap-3">
                <span class="shrink-0 w-7 h-7 rounded-full bg-agent-border text-agent-muted flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <p class="text-agent-text">{choice.text}</p>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
