<script lang="ts">
  interface FlowNode {
    id: string;
    label: string;
    description: string;
    icon: string;
    x: number;
    y: number;
  }

  interface FlowEdge {
    from: string;
    to: string;
    label?: string;
  }

  interface FlowChallenge {
    question: string;
    targetNodeId: string;
    hint: string;
  }

  interface Props {
    nodes: FlowNode[];
    edges: FlowEdge[];
    title: string;
    challenges?: FlowChallenge[];
    onComplete?: (score: number, total: number) => void;
  }

  let { nodes, edges, title, challenges = [], onComplete }: Props = $props();

  type Mode = 'explore' | 'challenge';

  let activeNodeId = $state<string | null>(null);
  let mode = $state<Mode>('explore');
  let isPlaying = $state(false);
  let playIndex = $state(0);
  let playIntervalId: ReturnType<typeof setInterval> | null = null;

  // Challenge state
  let currentChallenge = $state(0);
  let challengeScore = $state(0);
  let challengeAnswered = $state(false);
  let challengeCorrect = $state(false);
  let challengeFinished = $state(false);
  let showHint = $state(false);

  // Visited nodes for explore animation trail
  let visitedNodeIds = $state<Set<string>>(new Set());
  let animatedEdges = $state<Set<string>>(new Set());

  // Build a traversal order from edges (BFS-like from first node)
  let traversalOrder = $derived.by(() => {
    if (nodes.length === 0) return [];
    const order: string[] = [];
    const visited = new Set<string>();
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from)!.push(edge.to);
    }

    const queue = [nodes[0].id];
    visited.add(nodes[0].id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      const neighbors = adjacency.get(current) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Add any nodes not reached by BFS
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        order.push(node.id);
      }
    }

    return order;
  });

  function getNodeById(id: string): FlowNode | undefined {
    return nodes.find(n => n.id === id);
  }

  function handleNodeClick(nodeId: string) {
    if (mode === 'explore') {
      activeNodeId = activeNodeId === nodeId ? null : nodeId;
    } else if (mode === 'challenge' && !challengeAnswered && challenges.length > 0) {
      challengeAnswered = true;
      const target = challenges[currentChallenge].targetNodeId;
      if (nodeId === target) {
        challengeCorrect = true;
        challengeScore++;
      } else {
        challengeCorrect = false;
      }
      activeNodeId = target;
    }
  }

  function startAutoPlay() {
    if (isPlaying) {
      stopAutoPlay();
      return;
    }
    isPlaying = true;
    playIndex = 0;
    visitedNodeIds = new Set();
    animatedEdges = new Set();
    activeNodeId = null;

    playIntervalId = setInterval(() => {
      if (playIndex >= traversalOrder.length) {
        stopAutoPlay();
        return;
      }

      const currentNodeId = traversalOrder[playIndex];
      activeNodeId = currentNodeId;
      visitedNodeIds = new Set([...visitedNodeIds, currentNodeId]);

      // Animate edge from previous node
      if (playIndex > 0) {
        const prevNodeId = traversalOrder[playIndex - 1];
        const edgeKey = `${prevNodeId}-${currentNodeId}`;
        animatedEdges = new Set([...animatedEdges, edgeKey]);
      }

      playIndex++;
    }, 1200);
  }

  function stopAutoPlay() {
    isPlaying = false;
    if (playIntervalId) {
      clearInterval(playIntervalId);
      playIntervalId = null;
    }
  }

  function enterChallengeMode() {
    if (challenges.length === 0) return;
    mode = 'challenge';
    activeNodeId = null;
    currentChallenge = 0;
    challengeScore = 0;
    challengeAnswered = false;
    challengeCorrect = false;
    challengeFinished = false;
    showHint = false;
    stopAutoPlay();
  }

  function nextChallenge() {
    if (currentChallenge < challenges.length - 1) {
      currentChallenge++;
      challengeAnswered = false;
      challengeCorrect = false;
      activeNodeId = null;
      showHint = false;
    } else {
      challengeFinished = true;
      onComplete?.(challengeScore, challenges.length);
    }
  }

  function backToExplore() {
    mode = 'explore';
    activeNodeId = null;
    challengeFinished = false;
  }

  function restartChallenges() {
    currentChallenge = 0;
    challengeScore = 0;
    challengeAnswered = false;
    challengeCorrect = false;
    challengeFinished = false;
    activeNodeId = null;
    showHint = false;
  }

  // Compute SVG edge lines
  function getEdgePath(edge: FlowEdge): { x1: number; y1: number; x2: number; y2: number } | null {
    const fromNode = getNodeById(edge.from);
    const toNode = getNodeById(edge.to);
    if (!fromNode || !toNode) return null;
    return {
      x1: fromNode.x,
      y1: fromNode.y,
      x2: toNode.x,
      y2: toNode.y,
    };
  }

  function isEdgeAnimated(edge: FlowEdge): boolean {
    return animatedEdges.has(`${edge.from}-${edge.to}`);
  }

  $effect(() => {
    return () => {
      if (playIntervalId) clearInterval(playIntervalId);
    };
  });

  let activeNode = $derived(activeNodeId ? getNodeById(activeNodeId) : null);
</script>

<div class="bg-agent-card border border-agent-border rounded-xl overflow-hidden fade-in">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-agent-border bg-agent-dark flex items-center justify-between flex-wrap gap-2">
    <div>
      <h3 class="text-lg font-bold text-agent-text">{title}</h3>
      <span class="text-xs text-agent-muted">
        {mode === 'explore' ? 'Haz clic en los nodos para explorar' : `Desafio ${currentChallenge + 1} de ${challenges.length}`}
      </span>
    </div>
    <div class="flex items-center gap-2">
      {#if mode === 'explore'}
        <button
          onclick={startAutoPlay}
          class="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer {
            isPlaying
              ? 'border-agent-warning/50 text-agent-warning bg-agent-warning/10'
              : 'border-agent-accent/50 text-agent-accent bg-agent-accent/10 hover:bg-agent-accent/20'
          }"
        >
          {isPlaying ? 'Detener' : 'Auto-play'}
        </button>
        {#if challenges.length > 0}
          <button
            onclick={enterChallengeMode}
            class="text-xs px-3 py-1.5 rounded-lg border border-agent-accent/50 text-agent-accent bg-agent-accent/10 hover:bg-agent-accent/20 transition-all cursor-pointer"
          >
            Modo desafio
          </button>
        {/if}
      {:else}
        <button
          onclick={backToExplore}
          class="text-xs px-3 py-1.5 rounded-lg border border-agent-border text-agent-muted hover:text-agent-text transition-all cursor-pointer"
        >
          Volver a explorar
        </button>
      {/if}
    </div>
  </div>

  <!-- Challenge question bar -->
  {#if mode === 'challenge' && !challengeFinished && challenges.length > 0}
    <div class="px-6 py-3 bg-agent-accent/10 border-b border-agent-accent/20">
      <p class="text-sm text-agent-text font-medium">{challenges[currentChallenge].question}</p>
      <div class="flex items-center gap-3 mt-1">
        <span class="text-xs text-agent-muted">Puntos: <span class="text-agent-accent font-bold">{challengeScore}/{challenges.length}</span></span>
        {#if !challengeAnswered}
          <button
            onclick={() => showHint = !showHint}
            class="text-xs text-agent-warning hover:text-agent-warning/80 cursor-pointer"
          >
            {showHint ? 'Ocultar pista' : 'Ver pista'}
          </button>
        {/if}
      </div>
      {#if showHint && !challengeAnswered}
        <p class="text-xs text-agent-warning mt-1 italic">{challenges[currentChallenge].hint}</p>
      {/if}
    </div>
  {/if}

  <!-- Flow diagram container -->
  <div class="relative w-full" style="aspect-ratio: 16/9; min-height: 300px;">
    <!-- SVG edges layer -->
    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="currentColor" class="text-agent-border" />
        </marker>
        <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="currentColor" class="text-agent-accent" />
        </marker>
      </defs>

      {#each edges as edge}
        {@const path = getEdgePath(edge)}
        {#if path}
          <!-- Edge line -->
          <line
            x1={path.x1}
            y1={path.y1}
            x2={path.x2}
            y2={path.y2}
            stroke-width="0.3"
            marker-end={isEdgeAnimated(edge) ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
            class="{isEdgeAnimated(edge) ? 'stroke-agent-accent' : 'stroke-agent-border'} transition-colors duration-500"
          />

          <!-- Animated dot on edge -->
          {#if isEdgeAnimated(edge)}
            <circle r="0.8" class="fill-agent-accent">
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                path="M{path.x1},{path.y1} L{path.x2},{path.y2}"
              />
            </circle>
          {/if}

          <!-- Edge label -->
          {#if edge.label}
            <text
              x={(path.x1 + path.x2) / 2}
              y={(path.y1 + path.y2) / 2 - 1.5}
              text-anchor="middle"
              class="fill-agent-muted"
              font-size="2.2"
            >
              {edge.label}
            </text>
          {/if}
        {/if}
      {/each}
    </svg>

    <!-- Nodes layer -->
    {#each nodes as node}
      <button
        onclick={() => handleNodeClick(node.id)}
        class="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-500 cursor-pointer group z-10"
        style="left: {node.x}%; top: {node.y}%;"
      >
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl border-2 transition-all duration-500 {
          activeNodeId === node.id
            ? 'border-agent-accent bg-agent-accent/20 glow-accent scale-110'
            : visitedNodeIds.has(node.id)
              ? 'border-agent-accent/50 bg-agent-card'
              : 'border-agent-border bg-agent-card group-hover:border-agent-accent/50'
        }">
          {node.icon}
        </div>
        <span class="text-[10px] sm:text-xs font-medium max-w-[80px] text-center leading-tight {
          activeNodeId === node.id ? 'text-agent-accent' : 'text-agent-muted group-hover:text-agent-text'
        }">
          {node.label}
        </span>
      </button>
    {/each}
  </div>

  <!-- Description panel -->
  {#if mode === 'explore' && activeNode}
    <div class="px-6 py-4 border-t border-agent-border bg-agent-dark fade-in">
      <div class="flex items-start gap-3">
        <span class="text-2xl">{activeNode.icon}</span>
        <div>
          <h4 class="text-agent-text font-bold">{activeNode.label}</h4>
          <p class="text-sm text-agent-muted mt-1 leading-relaxed">{activeNode.description}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Challenge feedback -->
  {#if mode === 'challenge' && challengeAnswered && !challengeFinished}
    <div class="px-6 py-4 border-t border-agent-border fade-in {
      challengeCorrect ? 'bg-agent-success/10' : 'bg-agent-danger/10'
    }">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl">{challengeCorrect ? '\u2705' : '\u274C'}</span>
          <p class="text-sm {challengeCorrect ? 'text-agent-success' : 'text-agent-danger'} font-medium">
            {challengeCorrect ? 'Correcto!' : `Incorrecto. Era: ${getNodeById(challenges[currentChallenge].targetNodeId)?.label}`}
          </p>
        </div>
        <button onclick={nextChallenge} class="btn-primary text-xs py-2 px-4">
          {currentChallenge < challenges.length - 1 ? 'Siguiente' : 'Ver resultado'}
        </button>
      </div>
    </div>
  {/if}

  <!-- Challenge results -->
  {#if mode === 'challenge' && challengeFinished}
    <div class="px-6 py-6 border-t border-agent-border text-center fade-in">
      <div class="text-4xl mb-3">{challengeScore >= challenges.length * 0.8 ? '\u{1F3C6}' : challengeScore >= challenges.length * 0.5 ? '\u{1F44D}' : '\u{1F4DA}'}</div>
      <h4 class="text-xl font-bold text-agent-text">{challengeScore} / {challenges.length}</h4>
      <p class="text-sm text-agent-muted mt-1">
        {challengeScore >= challenges.length * 0.8
          ? 'Excelente! Conoces la arquitectura a fondo.'
          : challengeScore >= challenges.length * 0.5
            ? 'Bien, pero repasa algunos componentes.'
            : 'Necesitas revisar el diagrama con mas detalle.'}
      </p>
      <div class="flex gap-2 justify-center mt-4">
        <button onclick={restartChallenges} class="btn-secondary text-xs">Reintentar</button>
        <button onclick={backToExplore} class="btn-primary text-xs">Explorar de nuevo</button>
      </div>
    </div>
  {/if}
</div>
