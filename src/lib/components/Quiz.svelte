<script lang="ts">
  interface QuizOption {
    text: string;
    correct: boolean;
    explanation: string;
  }

  interface QuizQuestion {
    question: string;
    options: QuizOption[];
    source?: string;
    sourceUrl?: string;
    codeBlock?: string;
  }

  interface Props {
    questions: QuizQuestion[];
    onComplete?: (score: number, total: number) => void;
  }

  let { questions, onComplete }: Props = $props();

  let currentQuestion = $state(0);
  let selectedOption = $state(-1);
  let answered = $state(false);
  let score = $state(0);
  let finished = $state(false);
  let answers = $state<boolean[]>([]);

  function selectOption(index: number) {
    if (answered) return;
    selectedOption = index;
    answered = true;
    const isCorrect = questions[currentQuestion].options[index].correct;
    if (isCorrect) score++;
    answers = [...answers, isCorrect];
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      selectedOption = -1;
      answered = false;
    } else {
      finished = true;
      onComplete?.(score, questions.length);
    }
  }

  function restart() {
    currentQuestion = 0;
    selectedOption = -1;
    answered = false;
    score = 0;
    finished = false;
    answers = [];
  }

  let progressPercent = $derived(((currentQuestion + (answered ? 1 : 0)) / questions.length) * 100);
</script>

{#if !finished}
  <div class="bg-agent-card border border-agent-border rounded-xl p-6 fade-in">
    <!-- Progress -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-agent-muted text-sm">Pregunta {currentQuestion + 1} de {questions.length}</span>
      <span class="text-agent-accent text-sm font-bold">{score} correctas</span>
    </div>
    <div class="h-1.5 bg-agent-dark rounded-full mb-6">
      <div class="h-full bg-agent-accent rounded-full transition-all duration-500" style="width: {progressPercent}%"></div>
    </div>

    <!-- Question -->
    <h3 class="text-lg font-bold text-agent-text mb-4">{questions[currentQuestion].question}</h3>

    <!-- Code Block (if provided) -->
    {#if questions[currentQuestion].codeBlock}
      {@html `<pre class="code-block mb-4">${questions[currentQuestion].codeBlock}</pre>`}
    {/if}

    <!-- Options -->
    <div class="space-y-3 mb-4">
      {#each questions[currentQuestion].options as option, i}
        <button
          onclick={() => selectOption(i)}
          disabled={answered}
          class="w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer disabled:cursor-default {
            !answered
              ? 'border-agent-border hover:border-agent-accent/50 bg-agent-dark'
              : option.correct
                ? 'border-agent-success bg-agent-success/10'
                : i === selectedOption
                  ? 'border-agent-danger bg-agent-danger/10'
                  : 'border-agent-border bg-agent-dark opacity-50'
          }"
        >
          <div class="flex items-start gap-3">
            <span class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold {
              !answered
                ? 'bg-agent-border text-agent-muted'
                : option.correct
                  ? 'bg-agent-success text-white'
                  : i === selectedOption
                    ? 'bg-agent-danger text-white'
                    : 'bg-agent-border text-agent-muted'
            }">
              {#if answered && option.correct}✓
              {:else if answered && i === selectedOption && !option.correct}✗
              {:else}{String.fromCharCode(65 + i)}{/if}
            </span>
            <div class="flex-1">
              <p class="text-agent-text">{option.text}</p>
              {#if answered}
                <p class="text-sm mt-2 {option.correct ? 'text-agent-success' : i === selectedOption ? 'text-agent-danger' : 'text-agent-muted'}">
                  {option.explanation}
                </p>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>

    <!-- Source -->
    {#if answered && questions[currentQuestion].source}
      <p class="text-xs text-agent-muted mb-4">
        Fuente: {#if questions[currentQuestion].sourceUrl}<a href={questions[currentQuestion].sourceUrl} target="_blank" rel="noopener" class="text-agent-accent hover:underline">{questions[currentQuestion].source}</a>{:else}{questions[currentQuestion].source}{/if}
      </p>
    {/if}

    <!-- Next button -->
    {#if answered}
      <button onclick={nextQuestion} class="btn-primary w-full justify-center">
        {currentQuestion < questions.length - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
      </button>
    {/if}
  </div>
{:else}
  <!-- Results -->
  <div class="bg-agent-card border border-agent-border rounded-xl p-6 text-center fade-in">
    <div class="text-5xl mb-4">{score >= questions.length * 0.8 ? '\u{1F3C6}' : score >= questions.length * 0.5 ? '\u{1F44D}' : '\u{1F4DA}'}</div>
    <h3 class="text-2xl font-bold text-agent-text mb-2">
      {score} / {questions.length}
    </h3>
    <p class="text-agent-muted mb-2">
      {score >= questions.length * 0.8
        ? 'Excelente! Dominas este tema.'
        : score >= questions.length * 0.5
          ? 'Buen trabajo, pero hay espacio para mejorar.'
          : 'Necesitas repasar los conceptos. No te rindas!'}
    </p>
    <!-- Score bar -->
    <div class="h-3 bg-agent-dark rounded-full mb-6 max-w-xs mx-auto">
      <div class="h-full rounded-full transition-all duration-1000 {
        score >= questions.length * 0.8 ? 'bg-agent-success' : score >= questions.length * 0.5 ? 'bg-agent-warning' : 'bg-agent-danger'
      }" style="width: {(score / questions.length) * 100}%"></div>
    </div>
    <!-- Review answers -->
    <div class="flex gap-2 justify-center mb-4 flex-wrap">
      {#each answers as correct, i}
        <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold {
          correct ? 'bg-agent-success/20 text-agent-success border border-agent-success/30' : 'bg-agent-danger/20 text-agent-danger border border-agent-danger/30'
        }">
          {i + 1}
        </span>
      {/each}
    </div>
    <button onclick={restart} class="btn-secondary">
      Reintentar quiz
    </button>
  </div>
{/if}
