<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import { browser } from '$app/environment';
  import Timer from '$lib/components/Timer.svelte';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';

  const MODULE_ID = 12;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let badgeQueue = $state<Badge[]>([]);
  let allModulesComplete = $state(false);

  let showScenario = $state(false);
  let timedOut = $state(false);

  courseStore.startModule(MODULE_ID);

  function handleTimeUp() {
    timedOut = true;
  }

  function handleScenarioComplete(score: number, maxScore: number) {
    let finalScore = score;
    if (timedOut) {
      finalScore = Math.max(0, score - 4);
    }
    courseStore.completeModule(MODULE_ID, finalScore, maxScore);
    completed = true;

    // Check if ALL 12 modules are complete for the final badge
    setTimeout(() => {
      const unsub = courseStore.subscribe((state) => {
        const completedModules = Object.entries(state.modules)
          .filter(([_, m]) => m.completed)
          .map(([id]) => Number(id));

        const all12Done = Array.from({ length: 12 }, (_, i) => i + 1)
          .every(id => completedModules.includes(id));

        if (all12Done) {
          allModulesComplete = true;
          const badge = courseStore.unlockBadge('agent-architect');
          if (badge) {
            badgeQueue = [badge];
            showBadge = true;

            // Launch confetti
            if (browser) {
              import('js-confetti').then(({ default: JSConfetti }) => {
                const confetti = new JSConfetti();
                confetti.addConfetti({
                  emojis: ['\u{1F916}', '\u{1F9EC}', '\u{1F3C6}', '\u26A1', '\u{1F3AF}']
                });
                // Second wave after 1.5s
                setTimeout(() => {
                  confetti.addConfetti({
                    emojis: ['\u{1F916}', '\u{1F9EC}', '\u{1F3C6}', '\u26A1', '\u{1F3AF}']
                  });
                }, 1500);
              });
            }
          }
        }
      });
      // Unsubscribe immediately since we only need one check
      unsub();
    }, 500);
  }

  function handleBadgeClose() {
    badgeQueue = badgeQueue.slice(1);
    if (badgeQueue.length === 0) {
      showBadge = false;
    }
  }

  // BranchingScenario: Diseña el Sistema de Agentes para TechCorp
  const scenarioNodes: Record<string, any> = {
    start: {
      id: 'start',
      narrative: 'TechCorp, una empresa con 200 developers, quiere automatizar su pipeline de code review. Actualmente, cada PR espera 4-8 horas para review humano. Quieren reducirlo a minutos.\n\nRequisitos:\n- Analizar PRs por calidad de codigo (linting, patrones, complejidad)\n- Detectar vulnerabilidades de seguridad (OWASP, dependencias)\n- Verificar test coverage (ejecutar tests, medir cobertura)\n- Generar un resumen de review comprehensivo\n- Manejar 200 PRs por dia (pico: 40 PRs/hora)\n\nPrimer decision: ¿Cuantos agentes necesitas?',
      choices: [
        { text: '1 agente monolitico que haga todo: calidad + seguridad + tests + resumen', nextId: 'mono', points: 0, feedback: 'Peligroso. Un agente monolitico con tantas responsabilidades tendra un system prompt enorme, sera lento, costoso, y dificil de debuggear. Ademas, no escala: 200 PRs/dia con un solo agente secuencial es un cuello de botella.' },
        { text: '4 agentes especializados (calidad, seguridad, tests, resumen) + 1 orquestador', nextId: 'four_agents', points: 3, feedback: 'Excelente. Cada agente tiene una responsabilidad clara, un system prompt enfocado, y puede usar herramientas especificas para su dominio. El orquestador coordina y consolida. Es el patron Orchestrator-Worker en accion.' },
        { text: '10 agentes ultra-especializados (uno por tipo de check)', nextId: 'ten_agents', points: 1, feedback: 'Sobre-ingenieria. 10 agentes generan complejidad de coordinacion innecesaria. Los costos de orquestacion superan los beneficios. 4-5 agentes cubren los dominios sin fragmentacion excesiva.' },
        { text: '2 agentes: uno para analisis (calidad + seguridad + tests) y otro para resumen', nextId: 'two_agents', points: 2, feedback: 'Funcional pero limitado. El agente de analisis tiene demasiadas responsabilidades. No puede ejecutar los 3 checks en paralelo. Y si el analisis de seguridad tiene un bug, afecta tambien a calidad y tests.' }
      ]
    },
    mono: {
      id: 'mono',
      narrative: 'Tu agente monolitico tiene un system prompt de 5,000 tokens, 15 herramientas, y tarda 3-5 minutos por PR. Con 200 PRs/dia, el backlog crece constantemente.\n\nAdemas, cuando intentas mejorar el check de seguridad, rompes el de calidad porque comparten contexto.\n\nNecesitas descomponer. ¿Como?',
      choices: [
        { text: 'Separar en 4 agentes especializados: cada uno con su dominio, herramientas, y system prompt', nextId: 'orchestration', points: 3, feedback: 'Ahora si. Cada agente tiene una responsabilidad clara. El de seguridad tiene herramientas de OWASP, el de calidad tiene linters, el de tests ejecuta tests. Sin interferencia entre dominios.' },
        { text: 'Separar en 2: uno para checks rapidos (lint) y otro para checks lentos (tests + seguridad)', nextId: 'orchestration', points: 2, feedback: 'Mejor que monolitico pero la division por velocidad no es semantica. El agente de "checks lentos" sigue teniendo dos responsabilidades distintas (seguridad y tests) que seria mejor separar.' }
      ]
    },
    four_agents: {
      id: 'four_agents',
      narrative: 'Perfecto. Tienes:\n- Agent Calidad: linting, patrones, complejidad ciclomatica\n- Agent Seguridad: OWASP, dependency scanning, secrets detection\n- Agent Tests: ejecutar tests, medir coverage, detectar tests faltantes\n- Agent Resumen: consolidar todo en un review readable\n- Orquestador: coordina los 4\n\nAhora, ¿que patron de orquestacion usas?',
      choices: [
        { text: 'Orchestrator-Worker con ejecucion paralela: los 3 agentes de analisis corren EN PARALELO, el resumen corre DESPUES de que los 3 terminen', nextId: 'guardrails_design', points: 3, feedback: 'Perfecto. Los 3 checks son INDEPENDIENTES entre si: calidad no necesita el resultado de seguridad para funcionar. Ejecucion paralela = 3x mas rapido. El resumen necesita los 3 resultados, asi que corre al final. Map-reduce clasico.' },
        { text: 'Pipeline secuencial: calidad → seguridad → tests → resumen, uno tras otro', nextId: 'guardrails_design', points: 1, feedback: 'Funciona pero es innecesariamente lento. Los 3 checks son independientes: no necesitan esperarse. Con 200 PRs/dia, un pipeline secuencial de 5 minutos por PR = 16 horas de procesamiento. En paralelo son 2-3 minutos.' },
        { text: 'Handoff descentralizado: cada agente decide a quien pasar el control cuando termina', nextId: 'guardrails_design', points: 0, feedback: 'Peligroso a escala. Sin orquestador central, no hay visibilidad de que PR esta en que estado. Si un agente falla, nadie se entera. Los handoffs descentralizados funcionan para conversaciones, no para pipelines con 200 PRs/dia.' },
        { text: 'Hierarchical: un manager que revisa cada resultado antes de pasarlo al siguiente agente', nextId: 'guardrails_design', points: 2, feedback: 'Agrega overhead. El manager revisa cada resultado = latencia adicional. Para code review automatizado, no necesitas aprobacion intermedia. El orquestador simple con ejecucion paralela es mas eficiente.' }
      ]
    },
    ten_agents: {
      id: 'ten_agents',
      narrative: 'Con 10 agentes, la coordinacion se vuelve compleja. El orquestador necesita un system prompt enorme para saber cuando llamar a cada uno. Los costos de orquestacion (tokens del orquestador) superan el ahorro de especialización.\n\nSimplifica. ¿A cuantos agentes reduces?',
      choices: [
        { text: '4 agentes especializados (calidad, seguridad, tests, resumen) + 1 orquestador', nextId: 'orchestration', points: 3, feedback: 'El sweet spot. 4 dominios claros, cada uno con su responsabilidad, herramientas, y system prompt enfocado. Facil de debuggear, facil de escalar, facil de entender.' },
        { text: '6 agentes: los 4 base + 1 para performance analysis + 1 para documentacion', nextId: 'orchestration', points: 2, feedback: 'Performance y documentacion son nice-to-have, no requisitos. Empieza con los 4 core y agrega agentes solo cuando el negocio lo requiera. YAGNI aplicado a agentes.' }
      ]
    },
    two_agents: {
      id: 'two_agents',
      narrative: 'Tu agente de analisis funciona, pero es lento: ejecuta calidad, seguridad, y tests secuencialmente porque es un solo agente.\n\nAdemas, cuando mejoras el scan de seguridad, a veces afecta la calidad del linting porque comparten contexto.\n\n¿Evoluciones tu diseno?',
      choices: [
        { text: 'Si: separar en 4 agentes especializados que puedan correr en paralelo', nextId: 'orchestration', points: 3, feedback: 'Correcto. La separacion de responsabilidades permite paralelismo Y evita que cambios en un dominio afecten a otro. Es el principio de Single Responsibility aplicado a agentes.' },
        { text: 'No: mantener 2 agentes pero agregar mas herramientas al de analisis', nextId: 'orchestration', points: 1, feedback: 'Mas herramientas en un solo agente = system prompt mas grande = peor razonamiento. El LLM se confunde con 15+ herramientas. Es mejor tener agentes con 3-5 herramientas cada uno.' }
      ]
    },
    orchestration: {
      id: 'orchestration',
      narrative: 'Tienes tus agentes definidos. Ahora, ¿que patron de orquestacion usas para coordinarlos?\n\nRecuerda: 200 PRs/dia, pico de 40/hora. La latencia importa.',
      choices: [
        { text: 'Orchestrator-Worker con ejecucion paralela: los agentes de analisis corren al mismo tiempo, el de resumen al final', nextId: 'guardrails_design', points: 3, feedback: 'Exacto. Calidad, seguridad, y tests son independientes: ejecucion paralela. Resumen depende de los 3: ejecucion secuencial despues. Maximo throughput.' },
        { text: 'Pipeline secuencial: uno tras otro en orden', nextId: 'guardrails_design', points: 1, feedback: 'Lento e innecesario. Los 3 checks no dependen entre si. El pipeline secuencial triplica la latencia sin beneficio.' },
        { text: 'Event-driven: cada agente publica resultados en una cola y los demas reaccionan', nextId: 'guardrails_design', points: 2, feedback: 'Valido pero complejo para 4 agentes. Event-driven brilla con sistemas mas grandes (20+ agentes) donde la coordinacion directa es inviable. Para 4 agentes, el orquestador simple es mas claro.' }
      ]
    },
    guardrails_design: {
      id: 'guardrails_design',
      narrative: 'Ahora los guardrails. Tu sistema va a COMENTAR en PRs de 200 developers. Un falso positivo de seguridad puede bloquear un deployment critico. Un falso negativo puede dejar pasar una vulnerabilidad.\n\n¿Que guardrails implementas?',
      choices: [
        { text: 'Token budget por PR + rate limiting de comentarios + confidence threshold (solo comentar si confidence > 85%) + human escalation para findings criticos', nextId: 'observability_plan', points: 3, feedback: 'Completo. Token budget controla costos, rate limiting evita spam de comentarios, confidence threshold reduce falsos positivos, y human escalation asegura que vulnerabilidades criticas sean revisadas por un humano.' },
        { text: 'Solo un confidence threshold: si el agente no esta seguro, no comenta', nextId: 'observability_plan', points: 1, feedback: 'El confidence threshold es una capa pero no suficiente. Sin token budget, un PR grande puede generar costos enormes. Sin rate limiting, el agente puede dejar 50 comentarios en un PR. Sin escalation, vulnerabilidades criticas pasan desapercibidas.' },
        { text: 'Token budget por PR + human review de TODOS los comentarios antes de publicarlos', nextId: 'observability_plan', points: 2, feedback: 'Seguro pero no escala. Si un humano revisa todos los comentarios de 200 PRs/dia, es mas lento que el code review manual original. El human-in-the-loop debe ser selectivo: solo para findings criticos o cuando el confidence es bajo.' }
      ]
    },
    observability_plan: {
      id: 'observability_plan',
      narrative: 'El sistema esta en produccion hace 2 semanas. El CTO pregunta: "¿Como sabemos que funciona bien? ¿Cuanto nos cuesta? ¿Los developers estan contentos?"\n\n¿Que metricas y observabilidad implementas?',
      choices: [
        { text: 'Dashboard con: precision de findings (verificados vs falsos positivos), latencia por PR, costo diario total, satisfaction score de developers (pulgar arriba/abajo en cada review), traces completos de cada analisis', nextId: 'failure_handling', points: 3, feedback: 'Excelente. Combinas metricas tecnicas (precision, latencia, costo) con metricas de negocio (satisfaction). Los traces permiten debuggear cualquier review especifico. Y la satisfaction de developers es la metrica definitiva: si no confian en el agente, no lo usan.' },
        { text: 'Solo costo diario y numero de PRs procesados', nextId: 'failure_handling', points: 1, feedback: 'Metricas insuficientes. Saber cuanto cuesta y cuantos PRs se procesan no te dice si los reviews son BUENOS. Puedes procesar 200 PRs baratos con reviews inutiles. Necesitas metricas de calidad.' },
        { text: 'Precision de findings + latencia por PR + costo diario', nextId: 'failure_handling', points: 2, feedback: 'Buenas metricas tecnicas pero te falta la perspectiva del USUARIO. Si los developers ignoran el 80% de los comentarios del agente, algo falla aunque la precision tecnica sea alta. La satisfaction metric es crucial.' }
      ]
    },
    failure_handling: {
      id: 'failure_handling',
      narrative: 'Son las 9 AM del lunes. El agente de seguridad fallo porque la API de dependency scanning esta caida (third-party outage). Hay 15 PRs esperando review.\n\n¿Como manejas el fallo?',
      choices: [
        { text: 'Fallback chain: si el scan de dependencias falla, usar un scan local con datos cached + marcar el review como "parcial" + alertar al equipo de seguridad para review manual de las dependencias', nextId: 'human_escalation', points: 3, feedback: 'Perfecto. Degradacion graceful: el review continua con datos parciales, se marca transparentemente, y el gap se cubre con review humano. El sistema no se detiene por un proveedor externo.' },
        { text: 'Detener todos los reviews hasta que la API se recupere', nextId: 'human_escalation', points: 0, feedback: 'Terrible para la productividad. 200 developers esperando porque UNA API de un proveedor esta caida. La calidad y los tests pueden continuar. Bloquear todo por un fallo parcial es over-reaction.' },
        { text: 'Ignorar el check de seguridad y publicar el review sin el', nextId: 'human_escalation', points: 1, feedback: 'Peligroso. Publicar un review de "seguridad" sin haber hecho el scan de seguridad es peor que no publicar nada: da falsa confianza. Al menos marca que el scan de seguridad no se pudo realizar.' },
        { text: 'Reintentar la API cada 30 segundos hasta que vuelva', nextId: 'human_escalation', points: 1, feedback: 'Retry esta bien como primer paso, pero sin un fallback, los PRs se acumulan indefinidamente. Si la API esta caida 2 horas, tienes 80 PRs bloqueados. Necesitas un plan B.' }
      ]
    },
    human_escalation: {
      id: 'human_escalation',
      narrative: 'Ultima decision. El agente de seguridad detecta un posible SQL injection en un PR de un senior developer. El confidence score es 78%.\n\nEscalar o no escalar, esa es la cuestion. Si escalas innecesariamente, pierdes credibilidad. Si no escalas y hay un bug real, tienes un problema de seguridad.',
      choices: [
        { text: 'Escalar a review humano del equipo de seguridad con el contexto completo: codigo relevante, razon de la deteccion, confidence score, y sugerencia de fix', nextId: 'outcome_excellent', points: 3, feedback: 'Correcto. Con 78% de confidence, hay un 22% de probabilidad de falso positivo. Para SQL injection (high-impact), es mejor escalar con contexto que arriesgarse. El contexto completo permite al humano decidir rapido sin releer todo el PR.' },
        { text: 'No escalar: publicar el comentario directamente en el PR indicando posible SQL injection', nextId: 'outcome_good', points: 2, feedback: 'Razonable si el comentario es informativo y no bloqueante. Pero para vulnerabilidades de seguridad criticas como SQL injection, el protocolo deberia ser escalar siempre a un humano de seguridad, no solo dejar un comentario que el developer puede ignorar.' },
        { text: 'No escalar: 78% no es suficientemente alto, probablemente es un falso positivo', nextId: 'outcome_decent', points: 1, feedback: 'Peligroso. 78% de confidence para SQL injection no es bajo: hay 3 de cada 4 probabilidades de que sea real. Para vulnerabilidades de alto impacto, el threshold de escalacion deberia ser MAS bajo, no mas alto.' },
        { text: 'Bloquear el PR automaticamente hasta que el equipo de seguridad lo revise', nextId: 'outcome_good', points: 2, feedback: 'Seguro pero agresivo. Bloquear un PR de un senior developer por un finding con 78% de confidence genera friccion. Mejor escalar con contexto y dejar que el humano decida si bloquear. Autonomia proporcional al confidence.' }
      ]
    },
    outcome_excellent: {
      id: 'outcome_excellent',
      narrative: '',
      outcome: {
        title: 'Agent Architect',
        description: 'Diseñaste un sistema multi-agente completo y production-ready: agentes especializados con orquestacion paralela, guardrails multicapa, observabilidad completa, manejo de fallos graceful, y escalacion humana inteligente. Este es el nivel de diseño que se espera de un arquitecto de agentes.',
        score: 24,
        maxScore: 24,
        grade: 'excellent',
        lessons: [
          'Agentes especializados > agente monolitico. Single Responsibility aplica a agentes tambien.',
          'Ejecucion paralela para tareas independientes. No serialices lo que puede ser concurrente.',
          'Guardrails multicapa: token budgets + confidence thresholds + rate limiting + human escalation.',
          'Observabilidad = metricas tecnicas + metricas de negocio + traces + satisfaction.',
          'Fallback chains para dependencias externas: degradacion graceful > fallo total.',
          'Escalacion humana proporcional al impacto: SQL injection siempre se escala, typos nunca.'
        ]
      }
    },
    outcome_good: {
      id: 'outcome_good',
      narrative: '',
      outcome: {
        title: 'Buen Diseño de Sistema',
        description: 'Tu arquitectura es solida con buenos fundamentos. Algunos aspectos podrian optimizarse pero el sistema funcionaria en produccion.',
        score: 17,
        maxScore: 24,
        grade: 'good',
        lessons: [
          'La especializacion de agentes permite paralelismo y mantenibilidad.',
          'Los guardrails no son opcionales en sistemas que interactuan con developers.',
          'La observabilidad debe incluir la perspectiva del usuario, no solo metricas tecnicas.',
          'Ante fallos de proveedores externos, siempre ten un plan B (fallback).',
          'Para findings de seguridad criticos, escalar a humanos con contexto completo es la decision correcta.'
        ]
      }
    },
    outcome_decent: {
      id: 'outcome_decent',
      narrative: '',
      outcome: {
        title: 'Diseño Funcional con Gaps',
        description: 'El sistema funciona pero tiene areas de mejora significativas en escalabilidad, seguridad, o manejo de fallos.',
        score: 11,
        maxScore: 24,
        grade: 'needs-work',
        lessons: [
          'Evita agentes monoliticos: la complejidad crece exponencialmente con las responsabilidades.',
          'No serialices tareas independientes: la ejecucion paralela es clave para throughput.',
          'Los guardrails de un solo tipo no son suficientes. Necesitas capas complementarias.',
          'Sin metricas de satisfaccion del usuario, no sabes si el sistema realmente funciona.',
          'Para seguridad, es mejor escalar de mas que de menos. Los falsos positivos son molestos; los falsos negativos son peligrosos.'
        ]
      }
    },
    outcome_poor: {
      id: 'outcome_poor',
      narrative: '',
      outcome: {
        title: 'Diseño con Problemas Criticos',
        description: 'Tu arquitectura tiene vulnerabilidades fundamentales que causarian problemas serios en produccion a escala.',
        score: 5,
        maxScore: 24,
        grade: 'critical',
        lessons: [
          'Un agente monolitico con 15 herramientas es un anti-patron. Divide y venceras.',
          'Sin orquestacion clara, los agentes no se coordinan automaticamente.',
          'Bloquear todo el sistema por un fallo parcial es inaceptable a escala.',
          'Los confidence scores bajos para findings criticos de seguridad NO deben ser ignorados.',
          'La observabilidad y los guardrails son requisitos, no features opcionales.'
        ]
      }
    }
  };
</script>

<svelte:head>
  <title>Modulo 12: {mod.title} | Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 fade-in">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <p class="text-agent-accent text-sm font-bold uppercase tracking-wider">Modulo {MODULE_ID} — Taller Final</p>
        <h1 class="text-3xl font-bold text-agent-text">{mod.title}</h1>
      </div>
    </div>
    <p class="text-agent-muted mt-2">{mod.subtitle}</p>
    <div class="flex items-center gap-4 mt-3">
      <span class="text-xs text-agent-muted bg-agent-card px-3 py-1 rounded-full border border-agent-border">{mod.duration}</span>
      <span class="text-xs text-agent-muted bg-agent-card px-3 py-1 rounded-full border border-agent-border">{mod.type}</span>
    </div>
  </div>

  <!-- Objectives -->
  <div class="card mb-8 fade-in">
    <h2 class="text-lg font-bold text-agent-text mb-3">Objetivos del modulo</h2>
    <ul class="space-y-2">
      {#each mod.objectives as obj}
        <li class="flex items-start gap-2 text-sm text-agent-muted">
          <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
          {obj}
        </li>
      {/each}
    </ul>
  </div>

  <!-- THEORY SECTION 1: El Desafio Final -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Desafio Final</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Este es el momento de la verdad. Has aprendido la anatomia de un agente, tool calling, el ecosistema, como dirigir agentes, como construirlos, memoria y planning, frameworks, patrones de orquestacion, guardrails, herramientas, y operaciones en produccion.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ahora vas a <strong class="text-agent-highlight">disenar un sistema multi-agente completo</strong> para un caso real. No vas a escribir codigo: vas a tomar las decisiones arquitectonicas que definen si el sistema funciona o fracasa.
    </p>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">¿Que se evalua?</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Simplicidad:</strong> No sobre-ingeniar. La solucion mas simple que funcione.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Patron correcto:</strong> Elegir la orquestacion adecuada para el problema.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Guardrails:</strong> La seguridad no es opcional. Multiples capas de proteccion.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Observabilidad:</strong> Si no puedes medirlo, no puedes mejorarlo.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Costos:</strong> Consciencia del costo por request y como optimizarlo.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Resiliencia:</strong> ¿Que pasa cuando algo falla? Porque ALGO va a fallar.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Recuerda: no hay respuestas "perfectas"</p>
      <p class="text-sm text-agent-muted">En arquitectura real, cada decision es un tradeoff. Lo que se evalua es tu capacidad de <strong class="text-agent-text">razonar sobre tradeoffs</strong>, no memorizar respuestas. Piensa como un arquitecto, no como un estudiante.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: Checklist del Arquitecto -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Checklist del Agent Architect</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de empezar la simulacion, repasa esta checklist. Cada punto es un concepto que aprendiste en los modulos anteriores.
    </p>

    <div class="space-y-2 mb-6">
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M1</span>
        <p class="text-sm text-agent-muted">¿Necesito un agente o un chatbot/copilot es suficiente? (Agent Loop)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M2</span>
        <p class="text-sm text-agent-muted">¿Que herramientas necesita cada agente? ¿Estan bien definidas? (Tool Calling)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M3</span>
        <p class="text-sm text-agent-muted">¿Que modelo/framework uso para cada agente? (Ecosistema)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M4</span>
        <p class="text-sm text-agent-muted">¿Como configuro las reglas y el comportamiento? (System Prompts, MCP)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M5</span>
        <p class="text-sm text-agent-muted">¿Cual es la estructura minima del agentic loop? (Construir)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M6</span>
        <p class="text-sm text-agent-muted">¿Que tipo de memoria necesita cada agente? (Memoria y Planning)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M7</span>
        <p class="text-sm text-agent-muted">¿Que framework multi-agente es apropiado? (Frameworks)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M8</span>
        <p class="text-sm text-agent-muted">¿Orchestrator-Worker, Handoff, Pipeline, o Hierarchical? (Patrones)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M9</span>
        <p class="text-sm text-agent-muted">¿Que guardrails y evaluaciones necesito? (Seguridad)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M10</span>
        <p class="text-sm text-agent-muted">¿Como configuro mi entorno de desarrollo? (Workspace)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8">M11</span>
        <p class="text-sm text-agent-muted">¿Como monitoreo, manejo costos, y respondo a incidentes? (Produccion)</p>
      </div>
    </div>
  </section>

  <!-- Timer + BranchingScenario -->
  <section class="mb-10">
    {#if !showScenario}
      <div class="card bg-agent-dark border-agent-accent/30 text-center">
        <span class="text-5xl block mb-3">&#127942;</span>
        <h3 class="text-xl font-bold text-agent-accent mb-2">Simulacion Final: Diseña el Sistema para TechCorp</h3>
        <p class="text-agent-muted mb-2 text-sm">Tienes <strong class="text-agent-text">10 minutos</strong> para disenar la arquitectura completa de un sistema de code review automatizado.</p>
        <p class="text-agent-muted mb-4 text-sm">Cada decision cuenta. Vas a elegir numero de agentes, patron de orquestacion, guardrails, observabilidad, manejo de fallos, y escalacion humana.</p>
        <div class="bg-agent-darker rounded-lg p-3 text-left mb-4">
          <p class="text-xs text-agent-accent font-bold mb-1">Requisitos del sistema:</p>
          <ul class="space-y-1 text-xs text-agent-muted">
            <li>&#9656; 200 PRs/dia, pico de 40 PRs/hora</li>
            <li>&#9656; Analisis de calidad de codigo</li>
            <li>&#9656; Deteccion de vulnerabilidades de seguridad</li>
            <li>&#9656; Verificacion de test coverage</li>
            <li>&#9656; Generacion de resumen de review</li>
          </ul>
        </div>
        <button onclick={() => showScenario = true} class="btn-primary">
          Iniciar simulacion final (10 minutos)
        </button>
      </div>
    {:else}
      <div class="mb-4">
        <Timer duration={600} onTimeUp={handleTimeUp} autoStart={true} label="Tiempo para disenar el sistema" />
      </div>
      {#if timedOut}
        <div class="card bg-agent-danger/10 border-agent-danger/30 mb-4 fade-in">
          <p class="text-sm text-agent-danger font-bold">Se acabo el tiempo. Un arquitecto debe tomar decisiones bajo presion. Se aplicara una penalizacion de -4 puntos al resultado final.</p>
        </div>
      {/if}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Taller Final: Sistema de Code Review para TechCorp"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card text-center mb-8 fade-in {allModulesComplete ? 'bg-agent-accent/10 border-agent-accent/30 glow-accent' : 'bg-agent-success/10 border-agent-success/30'}">
      {#if allModulesComplete}
        <span class="text-5xl block mb-3">&#127942;</span>
        <h3 class="text-2xl font-bold text-agent-accent mb-3">Felicidades, Agent Architect!</h3>
        <p class="text-agent-text mb-4">Has completado los 12 modulos de Agent Mastery. Desde la anatomia basica de un agente hasta el diseño de sistemas multi-agente en produccion.</p>
        <div class="bg-agent-dark rounded-lg p-4 text-left mb-4">
          <p class="text-sm text-agent-accent font-bold mb-2">Ahora sabes:</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Como funcionan los agentes por dentro (observe-think-act, tool calling)</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>El ecosistema completo de herramientas 2026</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Como dirigir agentes profesionalmente</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Como construir agentes desde cero</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Memoria, planning, y razonamiento de agentes</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Frameworks y patrones de orquestacion multi-agente</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Seguridad, guardrails, y evaluacion</li>
            <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Como operar agentes en produccion</li>
          </ul>
        </div>
        <a href="/resultados" class="btn-primary inline-block">
          Ver tus resultados completos
        </a>
      {:else}
        <span class="text-4xl block mb-3">&#128640;</span>
        <h3 class="text-xl font-bold text-agent-success mb-2">Simulacion completada!</h3>
        <p class="text-agent-muted mb-4">
          {#if timedOut}
            Completaste el diseño pero se te acabo el tiempo. En la vida real, los stakeholders tienen deadlines. Practica tomar decisiones rapidas con fundamento.
          {:else}
            Has demostrado tu capacidad para diseñar sistemas multi-agente. Completa los modulos restantes para obtener el badge final de Agent Architect.
          {/if}
        </p>
      {/if}
    </div>
  {/if}

  <!-- Sources -->
  <SourcesSection sources={mod.sources} />

  <!-- Nav -->
  <ModuleNav currentModule={MODULE_ID} />
</div>

<!-- Vocabulary Float -->
<VocabularyFloat moduleId={MODULE_ID} />

<!-- Badge Notification -->
{#if showBadge && badgeQueue.length > 0}
  <BadgeNotification badge={badgeQueue[0]} onClose={handleBadgeClose} />
{/if}
