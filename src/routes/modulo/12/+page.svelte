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
      narrative: 'Con 10 agentes, la coordinacion se vuelve compleja. El orquestador necesita un system prompt enorme para saber cuando llamar a cada uno. Los costos de orquestacion (tokens del orquestador) superan el ahorro de especializacion.\n\nSimplifica. ¿A cuantos agentes reduces?',
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
        description: 'Disenaste un sistema multi-agente completo y production-ready: agentes especializados con orquestacion paralela, guardrails multicapa, observabilidad completa, manejo de fallos graceful, y escalacion humana inteligente. Este es el nivel de diseno que se espera de un arquitecto de agentes.',
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
        title: 'Buen Diseno de Sistema',
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
        title: 'Diseno Funcional con Gaps',
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
        title: 'Diseno con Problemas Criticos',
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

  <!-- ============================================================= -->
  <!-- THEORY SECTION 1: El Desafio Final (EXPANDED)                  -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Desafio Final</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Este es el momento de la verdad. Has aprendido la anatomia de un agente, tool calling, el ecosistema, como dirigir agentes, como construirlos, memoria y planning, frameworks, patrones de orquestacion, guardrails, herramientas, y operaciones en produccion.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ahora vas a <strong class="text-agent-highlight">disenar un sistema multi-agente completo</strong> para un caso real. No vas a escribir codigo: vas a tomar las decisiones arquitectonicas que definen si el sistema funciona o fracasa en produccion.
    </p>
    <p class="text-agent-muted leading-relaxed mb-6">
      La diferencia entre un usuario de agentes y un <strong class="text-agent-text">Agent Architect</strong> es exactamente esto: la capacidad de tomar decisiones de diseno informadas bajo presion, razonando sobre tradeoffs en lugar de buscar respuestas "correctas" absolutas. En arquitectura real, cada decision tiene un costo y un beneficio. Tu trabajo es encontrar el balance optimo para el contexto especifico.
    </p>

    <!-- Criterios de evaluacion expandidos -->
    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-3">&#127919; Criterios de evaluacion</p>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">1.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Simplicidad (no sobre-ingeniar)</p>
            <p class="text-xs text-agent-muted">La solucion mas simple que resuelva el problema. No necesitas 10 agentes cuando 4 bastan. No necesitas event-driven cuando un orquestador simple funciona. La complejidad tiene un costo: cada agente adicional es mas coordinacion, mas tokens, mas puntos de fallo.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">2.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Patron correcto para el problema</p>
            <p class="text-xs text-agent-muted">Orchestrator-Worker para tareas paralelas independientes. Pipeline para tareas secuenciales con dependencias. Handoff para conversaciones multi-dominio. No existe un patron universal: existe el patron correcto para TU contexto.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">3.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Guardrails multicapa</p>
            <p class="text-xs text-agent-muted">Una sola capa de proteccion no es suficiente. Token budgets controlan costos. Confidence thresholds reducen falsos positivos. Rate limiting previene spam. Human escalation cubre findings criticos. Cada capa atrapa lo que las otras dejan pasar.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">4.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Observabilidad completa</p>
            <p class="text-xs text-agent-muted">Metricas tecnicas (latencia, precision, costo) + metricas de negocio (satisfaccion del usuario, tasa de adopcion) + traces para debugging. Si no puedes medir algo, no puedes mejorar algo. Y la metrica mas importante es: ¿los usuarios CONFIAN en el sistema?</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">5.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Consciencia de costos</p>
            <p class="text-xs text-agent-muted">Cada llamada a un LLM cuesta dinero. Cada token de input y output tiene un precio. Un sistema que procesa 200 PRs/dia con agentes de Claude Opus puede costar $500/dia. Con routing inteligente (Haiku para linting, Sonnet para seguridad, Opus solo para casos complejos), puedes reducirlo a $80/dia sin sacrificar calidad.</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent shrink-0 text-lg">6.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Resiliencia ante fallos</p>
            <p class="text-xs text-agent-muted">Algo VA a fallar. APIs externas se caen. LLMs devuelven respuestas malformadas. Timeouts ocurren. La pregunta no es SI falla, sino COMO responde tu sistema cuando falla. Fallback chains, degradacion graceful, y transparencia con el usuario son la diferencia entre un sistema confiable y uno frustrantemente fragil.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- El Principio de Antropic -->
    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">&#128218; Sabias que? El "Principio de Antropic"</p>
      <p class="text-sm text-agent-muted mb-3">
        El equipo de Anthropic que diseño el SDK de Claude Agents recomienda un principio simple: <strong class="text-agent-text">"Start with the simplest system that could possibly work."</strong> Esto significa que antes de disenar un sistema multi-agente con 10 agentes, te preguntes: ¿podria resolver esto con UN agente bien configurado? Si la respuesta es si, empieza por ahi.
      </p>
      <p class="text-sm text-agent-muted mb-3">
        Este principio no es pereza: es ingenieria responsable. Cada agente adicional agrega complejidad de coordinacion, latencia, costo, y puntos de fallo. Solo agregas agentes cuando la complejidad del problema lo REQUIERE, no cuando "se ve mas profesional".
      </p>
      <p class="text-sm text-agent-muted">
        La escalera de complejidad es: <strong class="text-agent-text">prompt engineering</strong> &#8594; <strong class="text-agent-text">single agent + tools</strong> &#8594; <strong class="text-agent-text">multi-agent orquestado</strong> &#8594; <strong class="text-agent-text">multi-agent autonomo</strong>. Cada escalon solo se justifica cuando el anterior NO resuelve el problema.
      </p>
    </div>

    <!-- Ejemplos de arquitectura por complejidad -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Ejemplo: la misma tarea, 3 niveles de complejidad</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Imagina que quieres automatizar la correccion de typos en documentacion. Mira como la misma tarea puede resolverse a distintos niveles:
    </p>

    <div class="space-y-3 mb-6">
      <div class="bg-agent-dark border border-agent-success/30 rounded-lg p-4">
        <p class="text-sm text-agent-success font-bold mb-1">Nivel 1: Prompt Engineering (correcto para esta tarea)</p>
        <p class="text-xs text-agent-muted mb-2">Un prompt bien escrito que recibe el texto y devuelve las correcciones. Sin agente, sin tools, sin orquestacion. Costo: ~$0.01 por documento.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted">prompt = "Corrige los typos en el siguiente texto.
Responde SOLO con el texto corregido."

response = llm.complete(prompt + document_text)</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
        <p class="text-sm text-agent-warning font-bold mb-1">Nivel 2: Single Agent + Tools (sobre-ingenieria leve)</p>
        <p class="text-xs text-agent-muted mb-2">Un agente con herramientas de busqueda en diccionario, deteccion de idioma, y formateo. Funciona, pero agrega complejidad innecesaria para corregir typos. Costo: ~$0.05 por documento.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted">agent = Agent(
    tools=[dictionary_lookup, language_detect, format_output],
    system_prompt="Eres un corrector de texto..."
)
# 3-5 iteraciones del loop agentico para algo que
# se resuelve en 1 llamada al LLM</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <p class="text-sm text-agent-danger font-bold mb-1">Nivel 3: Multi-Agent (locura para esta tarea)</p>
        <p class="text-xs text-agent-muted mb-2">Un agente que detecta errores, otro que propone correcciones, otro que valida, y un orquestador. 4 agentes, 4x el costo, 10x la latencia. Para corregir typos. No hagas esto. Costo: ~$0.40 por documento.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted"># POR FAVOR NO
orchestrator = Agent(...)
detector_agent = Agent(...)
corrector_agent = Agent(...)
validator_agent = Agent(...)
# 40x mas caro que el prompt simple
# Para la misma tarea</pre>`}
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">&#9888; Error comun: "Mas agentes = mejor"</p>
      <p class="text-sm text-agent-muted">Este es el error mas frecuente de los arquitectos principiantes. Ven que multi-agent es "avanzado" y asumen que mas agentes significa un mejor sistema. La realidad es que cada agente adicional agrega: (1) latencia de coordinacion, (2) costo de tokens del orquestador, (3) complejidad de debugging, (4) puntos de fallo. La habilidad real de un Agent Architect es saber <strong class="text-agent-text">cuando NO usar multi-agent</strong>.</p>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">&#128161; Concepto clave: no hay respuestas "perfectas"</p>
      <p class="text-sm text-agent-muted">En arquitectura real, cada decision es un tradeoff. Lo que se evalua es tu capacidad de <strong class="text-agent-text">razonar sobre tradeoffs</strong>, no memorizar respuestas. Piensa como un arquitecto, no como un estudiante que busca la respuesta "correcta" en el libro. Hay decisiones mejores y peores, pero rara vez hay una unica respuesta perfecta.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 2: Checklist del Arquitecto (EXPANDED)          -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Checklist del Agent Architect</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de empezar la simulacion, repasa esta checklist. Cada punto es un concepto que aprendiste en los modulos anteriores. Si alguno no te suena claro, vuelve al modulo correspondiente antes de continuar.
    </p>
    <p class="text-agent-muted leading-relaxed mb-6">
      Esta checklist no es solo para este ejercicio: es la lista mental que deberias recorrer <strong class="text-agent-text">cada vez que diseñas un sistema basado en agentes</strong> en tu trabajo real. Imprimetela, tenla a mano, revisala antes de cada proyecto.
    </p>

    <div class="space-y-2 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M1</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Necesito un agente o un chatbot/copilot es suficiente? (Agent Loop)</p>
          <p class="text-xs text-agent-muted mt-1">¿La tarea requiere multiples pasos autonomos? ¿Necesita tomar decisiones sobre que herramientas usar? ¿O es una simple pregunta-respuesta que se resuelve con un prompt?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M2</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Que herramientas necesita cada agente? ¿Estan bien definidas? (Tool Calling)</p>
          <p class="text-xs text-agent-muted mt-1">¿Las descripciones de las tools son claras para el LLM? ¿Cada agente tiene 3-5 herramientas enfocadas en su dominio? ¿Hay herramientas peligrosas que necesitan confirmacion humana?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M3</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Que modelo/framework uso para cada agente? (Ecosistema)</p>
          <p class="text-xs text-agent-muted mt-1">¿Necesito un modelo grande (Opus) o uno rapido (Haiku)? ¿El framework elegido soporta mi patron de orquestacion? ¿Existe una API o MCP server que resuelva mi caso sin construir desde cero?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M4</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Como configuro las reglas y el comportamiento? (System Prompts, MCP)</p>
          <p class="text-xs text-agent-muted mt-1">¿El system prompt es claro, especifico, y no contradictorio? ¿Estoy usando MCP para estandarizar la comunicacion con herramientas? ¿He definido CLAUDE.md u otros archivos de reglas para agentes de codigo?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M5</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Cual es la estructura minima del agentic loop? (Construir)</p>
          <p class="text-xs text-agent-muted mt-1">¿Tengo el ciclo observe-think-act implementado? ¿Hay una condicion de parada clara? ¿Que pasa si el agente entra en un loop infinito? ¿Tengo un maximo de iteraciones?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M6</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Que tipo de memoria necesita cada agente? (Memoria y Planning)</p>
          <p class="text-xs text-agent-muted mt-1">¿Necesito memoria a corto plazo (contexto de la conversacion) o a largo plazo (conocimiento persistente entre sesiones)? ¿Que estrategia de planning uso: Chain of Thought, Tree of Thought, ReAct?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M7</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Que framework multi-agente es apropiado? (Frameworks)</p>
          <p class="text-xs text-agent-muted mt-1">¿Necesito la simplicidad del Claude SDK o la flexibilidad de LangGraph? ¿Mi equipo puede mantener el framework elegido? ¿El framework soporta los patrones de orquestacion que necesito?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M8</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Orchestrator-Worker, Handoff, Pipeline, o Hierarchical? (Patrones)</p>
          <p class="text-xs text-agent-muted mt-1">¿Las subtareas son independientes (paralelo) o secuenciales (pipeline)? ¿Necesito un punto central de control (orchestrator) o los agentes pueden auto-coordinarse (handoff)? ¿La escala justifica la complejidad del patron?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M9</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Que guardrails y evaluaciones necesito? (Seguridad)</p>
          <p class="text-xs text-agent-muted mt-1">¿Tengo guardrails de input (validar lo que entra) Y de output (validar lo que sale)? ¿Estoy protegido contra prompt injection? ¿Los datos sensibles estan enmascarados? ¿Tengo benchmarks para medir la calidad del agente?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M10</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Como configuro mi entorno de desarrollo? (Workspace)</p>
          <p class="text-xs text-agent-muted mt-1">¿Estoy usando terminales con multiplexor (tmux/zellij) para manejar multiples agentes? ¿Mi IDE soporta agents (Cursor, VS Code + Roo Code)? ¿Tengo un setup profesional de 6 capas?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M11</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">¿Como monitoreo, manejo costos, y respondo a incidentes? (Produccion)</p>
          <p class="text-xs text-agent-muted mt-1">¿Tengo los 3 pilares de observabilidad (logs, metricas, traces)? ¿Tengo token budgets a nivel de request, usuario, y dia? ¿Mi sistema tiene circuit breakers, fallback chains, y kill switches? ¿Se que hacer a las 3 AM cuando algo falla?</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">&#128161; Concepto clave: el profesional "T-shaped"</p>
      <p class="text-sm text-agent-muted">Un Agent Architect necesita ser <strong class="text-agent-text">"T-shaped"</strong>: conocimiento amplio en todos estos 11 dominios (la barra horizontal de la T) y conocimiento profundo en 2-3 areas especificas (la barra vertical). No necesitas ser experto en TODO, pero si necesitas saber lo suficiente de cada area para tomar decisiones informadas y saber cuando consultar a un especialista.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- NEW SECTION: Arquitecturas de Referencia                       -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Arquitecturas de Referencia</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Antes de la simulacion, estudia estas 3 arquitecturas de referencia. Van de simple a compleja, y cada una es <strong class="text-agent-text">la correcta para su contexto</strong>. La clave no es cual es "mejor", sino cual es apropiada para el nivel de complejidad del problema.
    </p>

    <!-- Arquitectura 1: Simple -->
    <div class="card mb-6 border-agent-success/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127793;</span>
        <h3 class="text-lg font-bold text-agent-success">Arquitectura Simple: Code Review con 1 Agente</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Startup con 10 developers, 15-20 PRs/dia, presupuesto limitado. Solo necesitan feedback basico de calidad de codigo.
      </p>

      <div class="bg-agent-dark rounded-lg p-4 mb-3">
        <p class="text-xs text-agent-accent font-bold mb-2">Componentes</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-agent-muted">
          <div><strong class="text-agent-text">Agentes:</strong> 1 agente unico (Claude Sonnet)</div>
          <div><strong class="text-agent-text">Tools:</strong> read_file, list_changes, post_comment (3 tools)</div>
          <div><strong class="text-agent-text">Patron:</strong> Single agent (sin orquestacion)</div>
          <div><strong class="text-agent-text">Trigger:</strong> GitHub webhook en cada PR</div>
        </div>
      </div>

      {@html `<pre class="text-xs bg-agent-darker p-3 rounded mb-3 overflow-x-auto text-agent-muted"># Arquitectura Simple: 1 agente, 3 tools, 0 orquestacion
agent = Agent(
    model="claude-sonnet-4",
    tools=[read_file, list_pr_changes, post_github_comment],
    system_prompt="""Eres un code reviewer. Analiza los cambios
    del PR y deja comentarios constructivos sobre:
    - Legibilidad y naming
    - Posibles bugs
    - Mejoras de performance obvias
    Maximo 5 comentarios por PR. Se breve y accionable."""
)
# Costo estimado: ~$2/dia para 20 PRs</pre>`}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Guardrails</p>
          <p class="text-agent-muted">Max 5 comentarios/PR, token budget 4K tokens/PR, output validation (solo texto, no codigo ejecutable)</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-info font-bold">Observabilidad</p>
          <p class="text-agent-muted">Log cada review con timestamp + costo, alert si costo diario &gt; $5, metricas semanales de adopcion</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Costo estimado</p>
          <p class="text-agent-muted">~$60/mes (20 PRs/dia x $0.10/PR x 30 dias)</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-danger font-bold">Limitaciones</p>
          <p class="text-agent-muted">No escala mas alla de ~50 PRs/dia. Sin analisis de seguridad profundo. Sin ejecucion de tests.</p>
        </div>
      </div>
    </div>

    <!-- Arquitectura 2: Media -->
    <div class="card mb-6 border-agent-warning/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127795;</span>
        <h3 class="text-lg font-bold text-agent-warning">Arquitectura Media: Pipeline de PR con Multi-Agent</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Empresa mediana con 50 developers, 80-100 PRs/dia, compliance de seguridad requerido (SOC2). Necesitan analisis de calidad, seguridad, y test coverage.
      </p>

      <div class="bg-agent-dark rounded-lg p-4 mb-3">
        <p class="text-xs text-agent-accent font-bold mb-2">Componentes</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-agent-muted">
          <div><strong class="text-agent-text">Agentes:</strong> 4 especializados + 1 orquestador</div>
          <div><strong class="text-agent-text">Tools:</strong> 3-4 por agente (12-16 total)</div>
          <div><strong class="text-agent-text">Patron:</strong> Orchestrator-Worker (paralelo + secuencial)</div>
          <div><strong class="text-agent-text">Modelo:</strong> Haiku (lint), Sonnet (seguridad, tests), Sonnet (resumen)</div>
        </div>
      </div>

      {@html `<pre class="text-xs bg-agent-darker p-3 rounded mb-3 overflow-x-auto text-agent-muted"># Arquitectura Media: 4 agentes especializados + orquestador
#
# Flujo:
# PR webhook → Orquestador
#   ├─→ Agent Calidad (Haiku)    ──┐
#   ├─→ Agent Seguridad (Sonnet) ──┼─→ Agent Resumen (Sonnet)
#   └─→ Agent Tests (Sonnet)     ──┘       → Post Review
#
# Calidad, Seguridad, Tests corren EN PARALELO
# Resumen corre DESPUES de que los 3 terminen (map-reduce)

orchestrator = Orchestrator(
    workers={
        "quality": Agent(model="haiku", tools=[linter, complexity_analyzer, style_checker]),
        "security": Agent(model="sonnet", tools=[owasp_scanner, dependency_check, secret_detector]),
        "tests": Agent(model="sonnet", tools=[test_runner, coverage_analyzer]),
    },
    reducer=Agent(model="sonnet", tools=[format_review, post_comment]),
    parallel=True  # workers corren en paralelo
)
# Costo estimado: ~$8/dia para 100 PRs</pre>`}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Guardrails</p>
          <p class="text-agent-muted">Token budget 8K/PR, confidence threshold 80%, rate limit 10 comentarios/PR, human escalation para findings criticos de seguridad</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-info font-bold">Observabilidad</p>
          <p class="text-agent-muted">Dashboard (precision, latencia, costo/agente), traces por PR, alertas por latencia &gt; 3min, satisfaction survey semanal</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Costo estimado</p>
          <p class="text-agent-muted">~$240/mes ($8/dia). Ahorro vs review manual: ~40 horas/semana de developer time.</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-danger font-bold">Consideraciones</p>
          <p class="text-agent-muted">Necesita fallback para when dependency scanning API falla. Model routing reduce costos 3x vs usar Opus para todo.</p>
        </div>
      </div>
    </div>

    <!-- Arquitectura 3: Compleja -->
    <div class="card mb-6 border-agent-accent/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127795;&#127795;</span>
        <h3 class="text-lg font-bold text-agent-accent">Arquitectura Compleja: Equipo de Desarrollo Completo</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Enterprise con 200+ developers, 300+ PRs/dia, multiples repositorios, requerimientos de compliance estrictos (HIPAA, SOC2, ISO 27001). Necesitan un "equipo virtual" que no solo revise sino que tambien sugiera fixes, genere tests, y actualice documentacion.
      </p>

      <div class="bg-agent-dark rounded-lg p-4 mb-3">
        <p class="text-xs text-agent-accent font-bold mb-2">Componentes</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-agent-muted">
          <div><strong class="text-agent-text">Agentes:</strong> 8 especializados + 2 orquestadores (jerarquico)</div>
          <div><strong class="text-agent-text">Tools:</strong> 4-6 por agente (30-48 total)</div>
          <div><strong class="text-agent-text">Patron:</strong> Hierarchical (meta-orquestador + sub-orquestadores)</div>
          <div><strong class="text-agent-text">Modelos:</strong> Haiku/Sonnet/Opus segun tarea (routing inteligente)</div>
        </div>
      </div>

      {@html `<pre class="text-xs bg-agent-darker p-3 rounded mb-3 overflow-x-auto text-agent-muted"># Arquitectura Compleja: equipo virtual de desarrollo
#
# Meta-Orquestador
#   ├─→ Sub-Orquestador Analisis
#   │     ├─→ Agent Calidad (Haiku)
#   │     ├─→ Agent Seguridad (Sonnet)
#   │     ├─→ Agent Tests (Sonnet)
#   │     └─→ Agent Performance (Haiku)
#   │
#   ├─→ Sub-Orquestador Accion
#   │     ├─→ Agent Fix Generator (Opus) ← solo PRs criticos
#   │     ├─→ Agent Test Generator (Sonnet)
#   │     └─→ Agent Doc Updater (Haiku)
#   │
#   └─→ Agent Resumen Final (Sonnet)
#
# Fase 1: Analisis (paralelo) → Triage
# Fase 2: Accion (solo si se necesita) → paralelo
# Fase 3: Resumen + post

# CRITICAL: el Agent Fix Generator usa Opus SOLO cuando
# el finding es critico Y confidence > 90%.
# Para todo lo demas, sugiere el fix sin generarlo.</pre>`}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Guardrails</p>
          <p class="text-agent-muted">Kill switch global, circuit breakers por agente, token budget jerarquico (global → equipo → PR), human-in-the-loop para fixes generados, audit log completo para compliance</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-info font-bold">Observabilidad</p>
          <p class="text-agent-muted">APM completo (Datadog/NewRelic), traces distribuidos, dashboard ejecutivo (ROI, adoption, satisfaction), alerting multi-nivel (P1-P4), quarterly review con stakeholders</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Costo estimado</p>
          <p class="text-agent-muted">~$1,500-3,000/mes. ROI: reemplaza ~2 FTEs de review time ($20K+/mes en salarios). Payback en semana 1.</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-danger font-bold">Riesgos</p>
          <p class="text-agent-muted">Complejidad de mantenimiento alta. Necesita un equipo dedicado de "Agent Ops". El fix generator puede introducir bugs si los guardrails no son estrictos.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-info/30 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">&#127758; Caso real: como llego GitHub Copilot a code review</p>
      <p class="text-sm text-agent-muted">GitHub Copilot Code Review (lanzado 2025) empezo como un unico modelo que analizaba diffs. Con el tiempo, evoluciono a multiples agentes especializados: uno para seguridad (CodeQL-backed), otro para calidad, otro para sugerencias de fix. La leccion: <strong class="text-agent-text">empieza simple, itera basandote en datos reales, escala solo cuando los datos lo justifiquen</strong>. No diseñes la arquitectura compleja desde el dia 1.</p>
    </div>

    <!-- Tabla comparativa de las 3 arquitecturas -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Comparativa rapida</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-xs text-left border border-agent-border rounded-lg overflow-hidden">
        <thead>
          <tr class="bg-agent-card text-agent-accent">
            <th class="p-2 border-b border-agent-border">Criterio</th>
            <th class="p-2 border-b border-agent-border">Simple (1 agente)</th>
            <th class="p-2 border-b border-agent-border">Media (5 agentes)</th>
            <th class="p-2 border-b border-agent-border">Compleja (10 agentes)</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">PRs/dia</td>
            <td class="p-2">15-50</td>
            <td class="p-2">50-200</td>
            <td class="p-2">200-1000+</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">Latencia/PR</td>
            <td class="p-2">30-60 seg</td>
            <td class="p-2">1-3 min</td>
            <td class="p-2">2-5 min</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">Costo/mes</td>
            <td class="p-2">$60</td>
            <td class="p-2">$240</td>
            <td class="p-2">$1,500-3,000</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">Cobertura</td>
            <td class="p-2">Calidad basica</td>
            <td class="p-2">Calidad + Seguridad + Tests</td>
            <td class="p-2">Todo + Fixes + Tests + Docs</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">Complejidad ops</td>
            <td class="p-2 text-agent-success">Baja</td>
            <td class="p-2 text-agent-warning">Media</td>
            <td class="p-2 text-agent-danger">Alta</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="p-2 text-agent-text">Equipo necesario</td>
            <td class="p-2">1 dev part-time</td>
            <td class="p-2">1-2 devs</td>
            <td class="p-2">Equipo dedicado Agent Ops</td>
          </tr>
          <tr>
            <td class="p-2 text-agent-text">Cuando usar</td>
            <td class="p-2">MVP, startup, bajo presupuesto</td>
            <td class="p-2">Empresa mediana, compliance basico</td>
            <td class="p-2">Enterprise, compliance estricto, alto volumen</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- NEW SECTION: El Futuro de los Agentes                          -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Futuro de los Agentes: 2026-2028</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de entrar a la simulacion final, un vistazo al futuro. No para especular, sino para que entiendas <strong class="text-agent-text">hacia donde se mueve la industria</strong> y puedas tomar decisiones que envejezcan bien.
    </p>

    <!-- Prediccion 1 -->
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">&#128301;</span>
        <h3 class="text-sm font-bold text-agent-accent">Estandares de comunicacion agent-to-agent</h3>
      </div>
      <p class="text-sm text-agent-muted mb-2">
        MCP (Model Context Protocol) ya estandarizo como los agentes hablan con herramientas. El siguiente paso es estandarizar como los agentes hablan <strong class="text-agent-text">entre si</strong>. Google lanzo Agent2Agent (A2A) Protocol en 2025, y Anthropic esta trabajando en extensiones multi-agent para MCP.
      </p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Impacto para ti:</strong> Los sistemas multi-agente que diseñes hoy probablemente migraran a protocolos estandarizados en 1-2 años. Diseña con interfaces limpias entre agentes para facilitar esa migracion.
      </p>
    </div>

    <!-- Prediccion 2 -->
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">&#129302;</span>
        <h3 class="text-sm font-bold text-agent-accent">Equipos de software autonomos</h3>
      </div>
      <p class="text-sm text-agent-muted mb-2">
        OpenAI ya demostro con Codex que un agente puede abrir un PR completo (codigo + tests + docs) de forma autonoma. Anthropic con Claude Code Background Agents puede ejecutar multiples tareas en paralelo. La direccion es clara: equipos de agentes que operan como un equipo de desarrollo junior, con humanos como tech leads.
      </p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Impacto para ti:</strong> Tu rol evoluciona de "escribir codigo" a "diseñar sistemas, definir estandares, y supervisar agentes". El Agent Architect es el tech lead del equipo de agentes.
      </p>
    </div>

    <!-- Prediccion 3 -->
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">&#128176;</span>
        <h3 class="text-sm font-bold text-agent-accent">Costos en caida libre, capacidades en alza</h3>
      </div>
      <p class="text-sm text-agent-muted mb-2">
        En 2024, GPT-4 costaba $30/MTok de input. En 2026, Claude Sonnet 4 cuesta $3/MTok. Los costos caen ~10x cada 18 meses mientras las capacidades mejoran. Esto significa que sistemas multi-agente que hoy cuestan $3,000/mes podrian costar $300/mes en 2028 con mejor calidad.
      </p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Impacto para ti:</strong> Diseña para el costo de HOY pero con la flexibilidad de cambiar modelos facilmente. El model routing que implementas hoy sera aun mas critico cuando haya 20+ modelos competitivos.
      </p>
    </div>

    <!-- Prediccion 4 -->
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">&#128101;</span>
        <h3 class="text-sm font-bold text-agent-accent">El rol de los humanos: de ejecutores a supervisores</h3>
      </div>
      <p class="text-sm text-agent-muted mb-2">
        La transicion ya esta en marcha. Desarrolladores que pasan el 80% de su tiempo escribiendo codigo pasaran a pasar el 80% definiendo requisitos, revisando output de agentes, y tomando decisiones arquitectonicas. Las habilidades que importan cambian: de "saber la sintaxis de Python" a "saber diseñar sistemas que agentes puedan implementar".
      </p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Impacto para ti:</strong> Este curso te pone exactamente en esa posicion. No aprendiste a usar un agente: aprendiste a DISEÑAR sistemas de agentes. Esa es la habilidad que va a importar.
      </p>
    </div>

    <!-- Tu responsabilidad -->
    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-5 mb-6">
      <h3 class="text-lg font-bold text-agent-accent mb-3">Tu responsabilidad como Agent Architect</h3>
      <p class="text-sm text-agent-muted mb-4">
        Con gran poder viene gran responsabilidad. Los sistemas de agentes que diseñes van a tomar decisiones que afectan a personas reales. Un agente de code review que bloquea PRs injustamente frustra a developers. Un agente de seguridad que deja pasar vulnerabilidades pone en riesgo datos de usuarios. Un agente de contratacion con bias discrimina a candidatos.
      </p>
      <div class="space-y-2">
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Transparencia:</strong> Los usuarios deben saber cuando interactuan con un agente vs un humano.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Accountability:</strong> Siempre debe haber un humano responsable de las decisiones del agente.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Fairness:</strong> Evalua si tu agente tiene biases y mitiga activamente.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Safety:</strong> Un agente sin guardrails es un riesgo, no una herramienta.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9656;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Humildad:</strong> Los LLMs cometen errores. Tu sistema debe estar diseñado para eso.</p>
        </div>
      </div>
    </div>

    <!-- Mensaje de cierre -->
    <div class="bg-agent-card border border-agent-accent/20 rounded-lg p-5">
      <p class="text-sm text-agent-muted leading-relaxed mb-3">
        <strong class="text-agent-accent">Nota final antes de la simulacion:</strong> lo que estas a punto de hacer no es un examen. Es una simulacion de lo que haras en tu trabajo real. Las empresas que adoptan agentes de IA necesitan personas que puedan tomar estas decisiones con fundamento, bajo presion, y con consciencia de los tradeoffs.
      </p>
      <p class="text-sm text-agent-muted leading-relaxed">
        Cuando termines este modulo, habras pasado por la experiencia completa: desde entender que ES un agente (Modulo 1) hasta DISEÑAR un sistema multi-agente production-ready (este modulo). Ese arco --de usuario a arquitecto-- es lo que te convierte en un profesional que no sera reemplazado por la IA, sino que la <strong class="text-agent-text">dirige</strong>.
      </p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- Timer + BranchingScenario (PRESERVED EXACTLY)                  -->
  <!-- ============================================================= -->
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
        <p class="text-agent-text mb-4">Has completado los 12 modulos de Agent Mastery. Desde la anatomia basica de un agente hasta el diseno de sistemas multi-agente en produccion.</p>
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
        <p class="text-sm text-agent-muted mb-4">
          El viaje de usuario a arquitecto esta completo. Ahora tu responsabilidad es aplicar estos conocimientos con criterio, etica, y la humildad de saber que siempre hay mas por aprender.
        </p>
        <a href="/resultados" class="btn-primary inline-block">
          Ver tus resultados completos
        </a>
      {:else}
        <span class="text-4xl block mb-3">&#128640;</span>
        <h3 class="text-xl font-bold text-agent-success mb-2">Simulacion completada!</h3>
        <p class="text-agent-muted mb-4">
          {#if timedOut}
            Completaste el diseno pero se te acabo el tiempo. En la vida real, los stakeholders tienen deadlines. Practica tomar decisiones rapidas con fundamento.
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
