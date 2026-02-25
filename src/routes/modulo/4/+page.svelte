<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import Quiz from '$lib/components/Quiz.svelte';
  import InteractiveFlow from '$lib/components/InteractiveFlow.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';
  import type { Source } from '$lib/data/modules';

  const MODULE_ID = 4;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);

  let showFlow = $state(false);
  let showQuiz = $state(false);
  let flowDone = $state(false);

  courseStore.startModule(MODULE_ID);

  function handleFlowComplete(score: number, total: number) {
    flowDone = true;
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    const badge = courseStore.unlockBadge('context-engineer');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
    completed = true;
  }

  // ─── InteractiveFlow: Context Management Pipeline ───
  const flowNodes = [
    { id: 'claudemd', label: 'CLAUDE.md Layers', description: 'El punto de partida: la jerarquia de 6 capas de CLAUDE.md. Capa 1: Managed Policy (Anthropic, siempre activa). Capa 2: User Global (~/.claude/CLAUDE.md). Capa 3: Project Root. Capa 4: Project Local (.claude/CLAUDE.md). Capa 5: Path Rules (.claude/rules/*.md, se activan al tocar archivos que matchean). Capa 6: Auto Memory (generada dinamicamente). El target es mantener el CLAUDE.md bajo 2.5K tokens para no saturar el contexto desde el inicio.', icon: '\u{1F4C4}', x: 8, y: 30 },
    { id: 'jit', label: 'Just-In-Time Loading', description: 'No cargues todo el contexto al inicio. Proporciona identificadores ligeros (paths, nombres) y deja que el agente cargue detalles SOLO cuando los necesita. Ejemplo: en vez de pegar toda la API docs en el prompt, escribe "API docs estan en /docs/api/ \u2014 leelos cuando necesites". Esto reduce el consumo inicial de tokens y mantiene el contexto limpio para el trabajo real.', icon: '\u{1F4E6}', x: 25, y: 55 },
    { id: 'working', label: 'Agent Working Memory', description: 'El espacio donde el agente trabaja activamente: historial de mensajes, resultados de herramientas, y razonamiento intermedio. La regla del 60%: nunca pre-cargues mas del 60% de la ventana de contexto. Deja el 40% restante para que el agente piense, use herramientas y genere respuestas. Si excedes el 60%, la performance se degrada por context rot.', icon: '\u{1F9E0}', x: 42, y: 25 },
    { id: 'compaction', label: 'Compaction (/compact)', description: 'Cuando el contexto crece demasiado, /compact resume la conversacion preservando decisiones y contexto critico pero descartando detalles intermedios. Usalo entre milestones: despues de completar una feature, antes de empezar la siguiente. Anthropic encontro que memory + context editing mejoro la performance en 39% en tareas de larga duracion.', icon: '\u{1F5DC}', x: 60, y: 55 },
    { id: 'subagent', label: 'Sub-Agent Delegation', description: 'Para tareas de investigacion o exploracion, lanza sub-agentes con contextos limpios. Cada sub-agente recibe solo la informacion necesaria para su tarea especifica, trabaja en aislamiento, y retorna un resumen de 1-2K tokens. El agente principal se mantiene limpio y enfocado. Patron: main agent coordina, sub-agents investigan.', icon: '\u{1F916}', x: 78, y: 25 },
    { id: 'clear', label: '/clear entre Fases', description: 'El arma secreta contra context rot. Usar /clear entre tareas independientes ahorra 50-70% de tokens y previene que el contexto acumulado degrade la performance. Divide trabajo complejo en fases: Research \u2192 Plan \u2192 Implement \u2192 Validate, usando /clear entre cada una. Simple pero con impacto masivo en calidad y costo.', icon: '\u{1F9F9}', x: 92, y: 55 },
  ];

  const flowEdges = [
    { from: 'claudemd', to: 'jit', label: 'Contexto base' },
    { from: 'jit', to: 'working', label: 'Carga selectiva' },
    { from: 'working', to: 'compaction', label: 'Contexto lleno' },
    { from: 'compaction', to: 'working', label: 'Resumido' },
    { from: 'working', to: 'subagent', label: 'Tarea compleja' },
    { from: 'subagent', to: 'working', label: 'Resumen 1-2K' },
    { from: 'working', to: 'clear', label: 'Fase completa' },
    { from: 'clear', to: 'claudemd', label: 'Nueva fase' },
  ];

  const flowChallenges = [
    { question: 'El contexto del agente esta al 75% despues de investigar 20 archivos. Que nodo aplicas para liberar espacio sin perder decisiones?', targetNodeId: 'compaction', hint: 'Resume la conversacion preservando lo critico y descartando detalles intermedios.' },
    { question: 'Necesitas investigar 3 microservicios antes de disenar una integracion. Que nodo evita contaminar el contexto principal?', targetNodeId: 'subagent', hint: 'Cada uno trabaja en aislamiento y retorna un resumen corto.' },
    { question: 'Terminaste de implementar una feature y vas a empezar a escribir tests. Que nodo aplicas entre las dos tareas?', targetNodeId: 'clear', hint: 'Ahorra 50-70% de tokens y previene context rot entre tareas independientes.' },
    { question: 'Tu CLAUDE.md tiene 5K tokens con toda la documentacion del API. Que nodo aplicas para reducir la carga inicial?', targetNodeId: 'jit', hint: 'No cargues todo al inicio. Proporciona paths y deja que el agente cargue bajo demanda.' },
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Cual es la diferencia FUNDAMENTAL entre prompt engineering y context engineering?',
      options: [
        { text: 'Son sinonimos, solo cambia el nombre segun la empresa', correct: false, explanation: 'No son sinonimos. Prompt engineering se enfoca en un solo mensaje. Context engineering abarca TODO el entorno informacional del agente.' },
        { text: 'Prompt engineering = disenar un mensaje. Context engineering = disenar TODO el entorno informacional: system prompt, archivos cargados, tool results, memoria, metadata', correct: true, explanation: 'Exacto. Context engineering es una disciplina mas amplia que INCLUYE prompt engineering. Segun Anthropic, el contexto que recibe el agente determina el 80% de la calidad de sus respuestas. No es solo "escribe un buen prompt", es "disena todo lo que el agente ve".' },
        { text: 'Prompt engineering es para chatbots, context engineering es para agentes', correct: false, explanation: 'Prompt engineering se aplica a ambos. La diferencia no es el tipo de sistema sino el ALCANCE: prompt es un mensaje, context es todo el entorno.' },
        { text: 'Context engineering es solo organizar archivos en el proyecto', correct: false, explanation: 'Va mucho mas alla. Incluye la jerarquia de CLAUDE.md, estrategias just-in-time, compaction, sub-agents, la regla del 60%, y como se gestiona el ciclo de vida completo del contexto.' },
      ],
      source: 'Anthropic - Effective Context Engineering for AI Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents'
    },
    {
      question: 'En la jerarquia de 6 capas de CLAUDE.md, cual capa se activa SOLO cuando el agente toca archivos que coinciden con un patron especifico?',
      options: [
        { text: 'Capa 2: User Global (~/.claude/CLAUDE.md)', correct: false, explanation: 'La capa User Global se carga siempre al inicio de sesion, para TODOS los proyectos. No depende de que archivos toque el agente.' },
        { text: 'Capa 4: Project Local (PROJECT/.claude/CLAUDE.md)', correct: false, explanation: 'La capa Project Local se carga al inicio de sesion junto con la Project Root. No es condicional a archivos tocados.' },
        { text: 'Capa 5: Path Rules (.claude/rules/*.md)', correct: true, explanation: 'Correcto! Las Path Rules usan globs en el frontmatter (ej: globs: "src/api/**/*.py") y se inyectan en el contexto SOLO cuando el agente toca archivos que matchean ese patron. Esto permite tener reglas especificas por area del proyecto sin cargarlas todas siempre.' },
        { text: 'Capa 6: Auto Memory', correct: false, explanation: 'La Auto Memory se genera dinamicamente por el agente, no depende de patrones de archivos. Es memoria que el agente escribe durante su trabajo.' },
      ],
      source: 'Claude Code - Memory',
      sourceUrl: 'https://code.claude.com/docs/en/memory'
    },
    {
      question: 'Tu agente lleva 2 horas trabajando en una feature. Notas que empieza a repetir instrucciones que ya dio, olvida decisiones tomadas hace 30 minutos, y genera codigo inconsistente con lo que hizo antes. Que esta pasando y cual es la MEJOR solucion?',
      options: [
        { text: 'El modelo es malo. Cambia a un modelo mas grande.', correct: false, explanation: 'No es el modelo, es el CONTEXTO. Incluso Claude Opus 4.6 sufre context rot cuando la ventana se satura. Un modelo mas grande no resuelve el problema fundamental.' },
        { text: 'Context rot: la ventana esta saturada. Usa /compact para resumir la conversacion preservando decisiones criticas, y continua con un contexto mas limpio.', correct: true, explanation: 'Exacto! Context rot es el fenomeno donde la performance se degrada al crecer el contexto. Anthropic encontro que memory + context editing mejora la performance un 39% en tareas largas. /compact resume lo esencial y descarta los detalles intermedios que ya no necesitas.' },
        { text: 'Usa /clear para borrar todo y empezar de cero', correct: false, explanation: '/clear borra TODO, incluyendo las decisiones tomadas. Es util entre tareas independientes, pero en medio de una feature perderas todo el contexto de trabajo. /compact es mejor aqui porque preserva lo critico.' },
        { text: 'Ignora el problema y sigue trabajando. El agente se autocorrige.', correct: false, explanation: 'Context rot NO se autocorrige. Solo empeora a medida que creces el contexto. Sin intervencion activa, la calidad seguira degradandose.' },
      ],
      source: 'Anthropic - Effective Harnesses for Long-Running Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
    },
    {
      question: 'Tienes una ventana de contexto de 200K tokens. Tu CLAUDE.md ocupa 4K tokens, los archivos cargados ocupan 80K, y las tool results acumulan 50K. Cuanto contexto libre tiene el agente para trabajar?',
      options: [
        { text: '66K tokens libres, que es suficiente', correct: false, explanation: 'Matematicamente son 66K (200K - 4K - 80K - 50K = 66K), pero eso es solo 33% libre. La regla del 60% dice que no deberias pre-cargar mas del 60%, y ya estas al 67% ocupado. El agente va a tener problemas.' },
        { text: 'Ya excediste la regla del 60%. Con 134K de 200K ocupados (67%), deberias reducir la carga. Aplica just-in-time loading para los archivos y /compact para las tool results.', correct: true, explanation: 'Correcto! La regla del 60% existe porque el agente necesita espacio para pensar, usar herramientas y generar respuestas. Al 67% ocupado, estas en zona de riesgo. Solucion: no cargues los 80K de archivos upfront, usa just-in-time para que el agente cargue solo lo que necesita.' },
        { text: '66K tokens es un monton, no hay problema', correct: false, explanation: '66K absolutos parece mucho, pero el porcentaje es lo que importa. Al 67% ocupado, cada tool call que genere output te acerca al limite. Ademas, el LLM necesita espacio para su propio razonamiento (extended thinking, tool planning).' },
        { text: 'Cambia a un modelo con ventana de 1M tokens', correct: false, explanation: 'Mas ventana no resuelve malos habitos de context management. Si cargas 67% de 200K, probablemente cargaras 67% de 1M. El problema es la ESTRATEGIA de carga, no el tamano de la ventana.' },
      ],
      source: 'Boris Cherny - 22 Tips for Claude Code',
      sourceUrl: 'https://www.builder.io/blog/claude-code-tips'
    },
    {
      question: 'Necesitas que tu agente investigue 5 microservicios, analice sus APIs, y luego disene una integracion entre ellos. Cual es la MEJOR estrategia de context management?',
      options: [
        { text: 'Carga toda la documentacion de los 5 microservicios en el contexto y disena la integracion en una sola sesion', correct: false, explanation: 'Cargar la documentacion de 5 microservicios va a saturar el contexto rapidamente. Es la receta perfecta para context rot.' },
        { text: 'Investiga los 5 microservicios uno por uno, usando /clear entre cada uno', correct: false, explanation: '/clear entre cada investigacion pierde el contexto de los microservicios anteriores. Cuando llegues al diseno, no tendras la informacion de los primeros.' },
        { text: 'Lanza 5 sub-agentes (uno por microservicio) que retornen resumenes de 1-2K tokens cada uno. Luego el agente principal disena la integracion con los 5 resumenes limpios.', correct: true, explanation: 'Exacto! Sub-agent delegation: cada sub-agente tiene un contexto limpio dedicado a un solo microservicio. Retorna un resumen conciso. El agente principal recibe 5-10K tokens de resumenes (en vez de 100K+ de documentacion cruda) y puede disenar la integracion con un contexto limpio y enfocado.' },
        { text: 'Pide al usuario que haga un resumen manual de cada microservicio', correct: false, explanation: 'Funciona pero desaprovechas la capacidad del agente. Los sub-agentes automatizan exactamente esta tarea de investigacion y resumen.' },
      ],
      source: 'Claude Code - Best Practices',
      sourceUrl: 'https://code.claude.com/docs/en/best-practices'
    },
  ];
</script>

<svelte:head>
  <title>Modulo 4: {mod.title} | Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 fade-in">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <p class="text-agent-accent text-sm font-bold uppercase tracking-wider">Modulo {MODULE_ID}</p>
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

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 1: Context Engineering vs Prompt Engineering -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Context Engineering vs Prompt Engineering</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Si los modulos anteriores te ensenaron <em>que es</em> un agente y <em>que herramientas</em> tiene, este modulo te ensena la habilidad que determina si ese agente produce resultados brillantes o mediocres: <strong class="text-agent-text">context engineering</strong>.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La mayoria de las personas piensan que trabajar con IA es cuestion de escribir buenos prompts. Y durante la era de los chatbots, tenian razon. Pero los agentes no son chatbots. Un agente no recibe un solo mensaje: recibe un <strong class="text-agent-text">entorno informacional completo</strong> compuesto por multiples capas que incluyen system prompts, archivos del proyecto cargados en contexto, resultados de herramientas ejecutadas, historial de conversacion, metadata del sistema, y memoria persistente.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted"><strong class="text-agent-text">Prompt engineering</strong> = disenar UN mensaje efectivo. <strong class="text-agent-text">Context engineering</strong> = disenar TODO el entorno informacional que el agente recibe: system prompt, archivos cargados, tool results, memoria, y metadata. Es como la diferencia entre escribir una linea de codigo vs disenar la arquitectura completa del sistema.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Segun datos internos de Anthropic, el <strong class="text-agent-text">contexto que recibe el agente determina hasta el 80% de la calidad de sus respuestas</strong>. No importa cuan sofisticado sea el modelo si le das contexto pobre, desorganizado o excesivo. Un Claude Opus 4.6 con mal contexto produce peores resultados que un Haiku con contexto impecable.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-muted bg-agent-dark">
        <h3 class="text-agent-muted font-bold mb-2">Prompt Engineering</h3>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x2022; Un mensaje, una respuesta</li>
          <li>&#x2022; Foco en la redaccion del prompt</li>
          <li>&#x2022; Contexto estatico (no cambia)</li>
          <li>&#x2022; Ideal para chatbots</li>
          <li>&#x2022; Medido en calidad de la respuesta</li>
        </ul>
      </div>
      <div class="card border-l-4 border-l-agent-accent bg-agent-dark">
        <h3 class="text-agent-accent font-bold mb-2">Context Engineering</h3>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x2022; Multiples capas, sesiones largas</li>
          <li>&#x2022; Foco en TODO el entorno informacional</li>
          <li>&#x2022; Contexto dinamico (crece, se compacta, rota)</li>
          <li>&#x2022; Esencial para agentes</li>
          <li>&#x2022; Medido en calidad sostenida durante horas</li>
        </ul>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en la analogia de un cirujano. Prompt engineering es elegir el bisturi correcto. Context engineering es preparar todo el quirofano: iluminacion, instrumental ordenado, equipo de apoyo, monitores del paciente, y protocolo de emergencia. El bisturi importa, pero sin el quirofano preparado, la operacion falla.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">La evolucion de la disciplina</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      El termino <strong class="text-agent-text">"context engineering"</strong> empezo a popularizarse a finales de 2025 cuando equipos como Anthropic, Google DeepMind, y OpenAI publicaron articulos sobre como la gestion del contexto tiene mas impacto que el tamano del modelo en tareas agenticas. La razon: los modelos ya son suficientemente buenos. El cuello de botella es la <em>informacion que reciben</em>, no su capacidad de procesarla.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      En 2023-2024, el enfoque estaba en <strong class="text-agent-text">prompt templates</strong>: "usa este template para pedir codigo", "usa este otro para reviews". Eran recetas estaticas para chatbots. En 2025-2026, el enfoque cambio a <strong class="text-agent-text">sistemas de contexto dinamicos</strong>: como cargo informacion on-demand, como gestiono memoria entre sesiones, como evito que el contexto degrade la performance. La diferencia es la misma que entre escribir scripts individuales y disenar arquitectura de software.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En el articulo <em>"Effective Context Engineering for AI Agents"</em>, Anthropic describe como sus propios ingenieros pasaron de escribir prompts individuales a disenar sistemas completos de context management para Claude Code. El resultado: agentes que mantienen calidad consistente durante sesiones de 4+ horas, en lugar de degradarse despues de 30 minutos. La clave no fue un modelo mejor, fue un contexto mejor gestionado.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Andrej Karpathy (ex-Tesla AI, ex-OpenAI) dijo en enero 2026: <em>"I would like to propose that we retire the term 'prompt engineering' and replace it with 'context engineering'"</em>. El argumento: los agentes modernos no reciben solo un prompt, reciben un contexto complejo que incluye herramientas, memoria, y multiples capas de instrucciones. Disenar ese contexto es ingenieria, no solo redaccion.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 2: Context Rot -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Problema del "Context Rot"</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Context rot es el fenomeno mas insidioso al trabajar con agentes de larga duracion. A medida que la conversacion crece, el contexto se llena de resultados de herramientas, razonamiento intermedio, y detalles que ya no son relevantes. El agente literalmente <strong class="text-agent-text">pierde la capacidad de encontrar lo importante entre el ruido</strong>.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los sintomas son claros: el agente empieza a repetir instrucciones que ya dio, olvida decisiones tomadas hace 20 mensajes, genera codigo inconsistente con lo que hizo antes, y a veces contradice directamente sus propias conclusiones previas. No es que el modelo sea malo. Es que esta ahogandose en su propio contexto.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Muchos desarrolladores asumen que "mas contexto = mejor". Es exactamente al reves. Anthropic encontro que agentes con <strong>context editing activo</strong> (compaction + nota-taking) <strong>mejoran su performance un 39%</strong> comparado con agentes que simplemente acumulan contexto sin gestionarlo. Menos ruido = mejor senal.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      El problema es matematico. Un modelo con ventana de 200K tokens procesa todo el contexto en cada llamada. Si tienes 150K tokens de historial acumulado, el modelo debe "leer" esos 150K tokens cada vez que genera una respuesta. Pero la atencion del transformer no es uniforme: la informacion al inicio y al final del contexto recibe mas atencion que la del medio (fenomeno conocido como <strong class="text-agent-text">"lost in the middle"</strong>). Tus instrucciones del CLAUDE.md estan al inicio, pero las decisiones criticas tomadas hace 30 minutos pueden estar enterradas en el medio.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-card">
          <tr>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Sintoma</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Causa</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Solucion</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Repite instrucciones ya dadas</td>
            <td class="py-2 px-3">Instrucciones tempranas "lost in the middle"</td>
            <td class="py-2 px-3 text-agent-accent">/compact para re-priorizar</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Olvida decisiones previas</td>
            <td class="py-2 px-3">Demasiadas tool results diluyen las decisiones</td>
            <td class="py-2 px-3 text-agent-accent">Note-taking: que el agente escriba sus propias notas</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Codigo inconsistente</td>
            <td class="py-2 px-3">Contexto tan grande que no "ve" sus propios outputs previos</td>
            <td class="py-2 px-3 text-agent-accent">/clear entre features + CLAUDE.md como ancla</td>
          </tr>
          <tr>
            <td class="py-2 px-3">Se contradice a si mismo</td>
            <td class="py-2 px-3">Contexto saturado al 90%+</td>
            <td class="py-2 px-3 text-agent-accent">Sub-agents con contextos limpios</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La curva de degradacion</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      La degradacion no es lineal, es exponencial. Los primeros 50% de la ventana de contexto funcionan casi perfecto. Del 50% al 70%, empiezas a notar inconsistencias menores. Del 70% al 85%, los errores se vuelven frecuentes. Por encima del 85%, el agente es practicamente inutilizable para tareas que requieren coherencia con su trabajo previo.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Esto no es una falla del modelo. Es una consecuencia de como funcionan los transformers: la atencion se distribuye entre TODOS los tokens del contexto. Mas tokens = menos atencion por token = mayor probabilidad de "perder" informacion critica. Es el equivalente computacional de tratar de escuchar 10 conversaciones simultaneas: puedes seguir 2-3, pero a partir de la 6ta pierdes el hilo.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Dato clave</p>
      <p class="text-sm text-agent-muted">En el articulo <em>"Effective Harnesses for Long-Running Agents"</em>, Anthropic reporta que los agentes que implementan <strong>memory + context editing</strong> muestran una <strong>mejora del 39% en performance</strong> en tareas de larga duracion comparado con agentes que simplemente acumulan contexto. La gestion activa del contexto no es un lujo, es una necesidad para cualquier tarea que dure mas de 15-20 minutos.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 3: CLAUDE.md Mastery -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">CLAUDE.md Mastery: La Jerarquia de 6 Capas</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      El archivo CLAUDE.md es el mecanismo principal de context engineering en Claude Code. Pero no es un solo archivo: es una <strong class="text-agent-text">jerarquia de 6 capas</strong> que se combinan para formar el contexto inicial del agente. Cada capa tiene un scope diferente y se carga en un momento diferente.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Entender esta jerarquia es critico porque te permite <strong class="text-agent-text">colocar la informacion correcta en la capa correcta</strong>. Las preferencias personales van en User Global. Las convenciones del proyecto van en Project Root. Las reglas especificas para el frontend van en Path Rules que solo se cargan cuando tocas archivos del frontend.
    </p>

    <!-- The 6-Layer Hierarchy Table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-card">
          <tr>
            <th class="text-left py-3 px-3 text-agent-accent font-bold border-b border-agent-border w-12">Capa</th>
            <th class="text-left py-3 px-3 text-agent-accent font-bold border-b border-agent-border">Archivo</th>
            <th class="text-left py-3 px-3 text-agent-accent font-bold border-b border-agent-border">Scope</th>
            <th class="text-left py-3 px-3 text-agent-accent font-bold border-b border-agent-border">Cuando se carga</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50 bg-agent-darker/50">
            <td class="py-3 px-3 text-agent-text font-bold">1</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">(Anthropic internal)</code></td>
            <td class="py-3 px-3">Todos los usuarios</td>
            <td class="py-3 px-3">Siempre (managed policy)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-text font-bold">2</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">~/.claude/CLAUDE.md</code></td>
            <td class="py-3 px-3">Todos tus proyectos</td>
            <td class="py-3 px-3">Inicio de sesion</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-darker/50">
            <td class="py-3 px-3 text-agent-text font-bold">3</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">PROJECT/CLAUDE.md</code></td>
            <td class="py-3 px-3">Este proyecto</td>
            <td class="py-3 px-3">Inicio de sesion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-text font-bold">4</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">PROJECT/.claude/CLAUDE.md</code></td>
            <td class="py-3 px-3">Este proyecto (privado)</td>
            <td class="py-3 px-3">Inicio de sesion</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-darker/50">
            <td class="py-3 px-3 text-agent-text font-bold">5</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">.claude/rules/*.md</code></td>
            <td class="py-3 px-3">Path-specific</td>
            <td class="py-3 px-3 text-agent-warning">Cuando archivos matchean</td>
          </tr>
          <tr>
            <td class="py-3 px-3 text-agent-text font-bold">6</td>
            <td class="py-3 px-3"><code class="text-agent-accent text-xs">(Auto-generated)</code></td>
            <td class="py-3 px-3">Session-specific</td>
            <td class="py-3 px-3 text-agent-warning">Dinamico</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La <strong class="text-agent-text">Capa 1 (Managed Policy)</strong> es invisible para ti. Es donde Anthropic define las reglas de seguridad base del modelo. La <strong class="text-agent-text">Capa 2 (User Global)</strong> es tu archivo personal que se aplica a TODOS tus proyectos. Aqui van preferencias universales: tu estilo de commit, herramientas que prefieres, idioma de respuestas, reglas que nunca cambian.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Las <strong class="text-agent-text">Capas 3 y 4</strong> son a nivel de proyecto. La diferencia: Capa 3 (<code class="text-agent-accent">PROJECT/CLAUDE.md</code>) se commitea al repo y la comparte el equipo. La Capa 4 (<code class="text-agent-accent">PROJECT/.claude/CLAUDE.md</code>) esta en <code class="text-agent-accent">.gitignore</code> y es para tus preferencias personales dentro del proyecto.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La <strong class="text-agent-text">Capa 5 (Path Rules)</strong> es la mas poderosa y menos conocida. Puedes crear archivos como <code class="text-agent-accent">.claude/rules/frontend.md</code> con un frontmatter que especifica un glob pattern. Ese archivo solo se carga cuando el agente toca archivos que matchean el patron.
    </p>

    {@html `<pre class="code-block text-xs mb-6"># .claude/rules/frontend.md
---
globs: "src/components/**/*.svelte"
---

## Reglas Frontend
- Usar Svelte 5 runes ($state, $derived, $props)
- NUNCA usar Svelte 4 stores en componentes
- Tailwind CSS v4 para estilos
- Unicode: usar HTML entities (&#38;#xXXXX;) en templates, no \\u{XXXX}</pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave: Target de 2.5K tokens</p>
      <p class="text-sm text-agent-muted">Boris Cherny (autor de "22 Tips for Claude Code") recomienda mantener el CLAUDE.md principal bajo <strong>2.5K tokens</strong>. Si necesitas mas, usa la sintaxis <code class="text-agent-accent">@path/to/file.md</code> para importar archivos adicionales que se cargan bajo demanda, o distribuye las reglas en Path Rules (Capa 5) que solo se cargan cuando son relevantes.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Que incluir vs que NO incluir</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-t-4 border-t-agent-success bg-agent-dark">
        <h4 class="text-agent-success font-bold mb-2">SI incluir</h4>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x2713; Stack tecnologico y versiones</li>
          <li>&#x2713; Convenciones de codigo (naming, patterns)</li>
          <li>&#x2713; Estructura del proyecto (breve)</li>
          <li>&#x2713; Restricciones criticas ("NUNCA usar X")</li>
          <li>&#x2713; Comandos de build/test/deploy</li>
          <li>&#x2713; Patrones arquitectonicos del proyecto</li>
        </ul>
      </div>
      <div class="card border-t-4 border-t-agent-danger bg-agent-dark">
        <h4 class="text-agent-danger font-bold mb-2">NO incluir</h4>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x2717; Documentacion completa de APIs</li>
          <li>&#x2717; Cosas obvias ("usa variables descriptivas")</li>
          <li>&#x2717; Tutoriales o explicaciones largas</li>
          <li>&#x2717; Contenido duplicado entre capas</li>
          <li>&#x2717; Historial de cambios del proyecto</li>
          <li>&#x2717; Secretos o credenciales</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Este mismo curso (Agent Mastery) tiene un CLAUDE.md de ~2K tokens que le dice al agente: stack (SvelteKit + Svelte 5 + Tailwind 4), componentes disponibles, interfaces, patron de cada modulo, y convenciones de estilos. Cuando el agente trabaja en un modulo, sabe exactamente que componentes usar, que runes aplicar, y que clases CSS son validas. Sin ese CLAUDE.md, cada sesion empezaria con 15 minutos de "descubrimiento" del proyecto.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Ejemplo completo de Path Rules en equipo</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Imagina un monorepo con frontend (Svelte), backend (FastAPI), y infraestructura (Terraform). Cada area tiene reglas diferentes. Con Path Rules, configuras reglas especificas que SOLO se cargan cuando el agente toca archivos de esa area:
    </p>

    {@html `<pre class="code-block text-xs mb-4"># .claude/rules/backend.md
---
globs: "backend/**/*.py"
---
- FastAPI 0.115+ con SQLAlchemy 2.0 async
- Pydantic v2 para DTOs, NUNCA v1
- Repository pattern para data access
- Type hints obligatorios en TODAS las funciones

# .claude/rules/infra.md
---
globs: "infra/**/*.tf"
---
- Terraform 1.9+ con OpenTofu compatible
- Modulos reutilizables en modules/
- Variables con description y validation blocks
- NUNCA hardcodear IPs o secrets</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando el agente edita un archivo Python en <code class="text-agent-accent">backend/</code>, automaticamente recibe las reglas del backend. Cuando edita Terraform, recibe las reglas de infra. Las reglas del frontend no se cargan cuando trabajas en el backend, ahorrando tokens y evitando confusiones.
    </p>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 4: Just-In-Time Strategy -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Estrategia Just-In-Time</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      El instinto natural es cargar toda la informacion posible al inicio de la sesion: "asi el agente tiene TODO lo que necesita". Pero esto es exactamente lo que causa context rot. La estrategia <strong class="text-agent-text">Just-In-Time (JIT)</strong> invierte esta logica: carga el minimo al inicio y deja que el agente obtenga detalles bajo demanda.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      En la practica, esto significa proporcionar <strong class="text-agent-text">identificadores ligeros</strong> en vez de contenido completo. En lugar de pegar 50K tokens de documentacion de API en el CLAUDE.md, escribe una linea: <em>"La documentacion del API esta en /docs/api/ con un archivo por endpoint. Leelos cuando necesites detalles."</em> El agente es inteligente. Sabe cuando necesita mas informacion y puede usar sus herramientas (Read, Glob, Grep) para obtenerla.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-danger bg-agent-dark">
        <h3 class="text-agent-danger font-bold mb-2">Anti-patron: Eager Loading</h3>
        {@html `<pre class="code-block text-xs mt-2"># CLAUDE.md (BAD - 8K tokens!)
## API Endpoints
### GET /users
Retorna lista de usuarios...
[200 lineas de documentacion]

### POST /users
Crea un usuario...
[150 lineas de documentacion]

### GET /users/:id
[100 lineas mas...]</pre>`}
        <p class="text-sm text-agent-muted mt-2">8K+ tokens gastados al inicio. La mayoria nunca se usaran en esta sesion.</p>
      </div>
      <div class="card border-l-4 border-l-agent-success bg-agent-dark">
        <h3 class="text-agent-success font-bold mb-2">Patron: JIT Loading</h3>
        {@html `<pre class="code-block text-xs mt-2"># CLAUDE.md (GOOD - 200 tokens)
## API
- Docs: /docs/api/*.md (1 file per endpoint)
- Schema: /docs/openapi.yaml
- Lee los docs cuando necesites detalles
- Base URL: /api/v2</pre>`}
        <p class="text-sm text-agent-muted mt-2">200 tokens. El agente carga detalles SOLO cuando los necesita.</p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La estrategia JIT funciona porque los agentes modernos son excelentes en <strong class="text-agent-text">progressive disclosure</strong>: primero leen el resumen, identifican que archivos son relevantes para la tarea actual, y luego cargan solo esos archivos. Claude Code hace esto nativamente con Glob (buscar archivos por patron), Grep (buscar contenido), y Read (leer archivos especificos).
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Dato</p>
      <p class="text-sm text-agent-muted">Anthropic reporta que Tool Search Tool (la herramienta que carga tools bajo demanda en vez de cargar todas al inicio) logra una <strong>reduccion del 85% en tokens consumidos</strong> por las definiciones de herramientas. El mismo principio aplica a tu contexto: carga bajo demanda, no por adelantado.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Progressive Disclosure en la practica</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      El concepto viene de UX design: no muestres toda la informacion de golpe, revela detalles progresivamente a medida que el usuario (en este caso, el agente) los necesita. Aplicado a context engineering, significa organizar tu informacion en <strong class="text-agent-text">3 niveles de profundidad</strong>:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <div class="card bg-agent-dark text-center">
        <p class="text-agent-accent font-bold text-sm mb-1">Nivel 1: Siempre</p>
        <p class="text-xs text-agent-muted">CLAUDE.md con el resumen del proyecto (~2.5K tokens)</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <p class="text-agent-warning font-bold text-sm mb-1">Nivel 2: Condicional</p>
        <p class="text-xs text-agent-muted">Path Rules que se cargan segun el area (.claude/rules/)</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <p class="text-agent-success font-bold text-sm mb-1">Nivel 3: On-demand</p>
        <p class="text-xs text-agent-muted">Archivos que el agente lee solo cuando necesita detalles</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El patron @import</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code soporta la sintaxis <code class="text-agent-accent">@path/to/file.md</code> en CLAUDE.md para importar archivos adicionales. Pero atencion: estos imports se cargan al inicio de sesion, no bajo demanda. Son utiles para modularizar un CLAUDE.md grande en secciones, pero NO son JIT. Para JIT real, usa la tecnica de "proporcionar paths y dejar que el agente lea cuando necesite".
    </p>

    {@html `<pre class="code-block text-xs mb-4"># CLAUDE.md principal (~500 tokens)
## Stack: SvelteKit + Svelte 5 + Tailwind 4

## Quick Commands
- Dev: npm run dev
- Build: npm run build
- Check: npm run check

## Conventions
@docs/conventions.md

## API Reference
- Docs en /docs/api/ - leer cuando sea necesario
- Schema en /docs/openapi.yaml</pre>`}
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 5: 3 Tecnicas para Tareas Largas -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3 Tecnicas para Tareas Largas</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Las tareas cortas (arreglar un bug, escribir una funcion) rara vez tienen problemas de contexto. Pero las tareas que duran horas (refactorizar un modulo completo, disenar una nueva feature, migrar una dependencia) requieren estrategias activas de context management. Aqui van las tres tecnicas principales.
    </p>

    <!-- Technique 1: Compaction -->
    <div class="card border-l-4 border-l-purple-500 mb-6">
      <h3 class="text-lg font-bold text-agent-text mb-2">1. Compaction (<code class="text-agent-accent text-sm">/compact</code>)</h3>
      <p class="text-agent-muted leading-relaxed mb-3">
        El comando <code class="text-agent-accent">/compact</code> le dice a Claude Code: "resume toda la conversacion actual preservando las decisiones y el contexto critico, pero descarta los detalles intermedios que ya no necesito". Es como hacer un git squash de tu conversacion.
      </p>
      <p class="text-agent-muted leading-relaxed mb-3">
        <strong class="text-agent-text">Cuando usarlo:</strong> despues de completar un milestone (feature terminada, bug resuelto, fase de investigacion completa). Antes de empezar la siguiente fase de trabajo. Cuando notas los sintomas de context rot.
      </p>
      <p class="text-agent-muted leading-relaxed mb-3">
        <strong class="text-agent-text">Que preserva:</strong> decisiones tomadas, conclusiones de investigacion, estado actual del trabajo, archivos modificados. <strong class="text-agent-text">Que descarta:</strong> tool results detallados, razonamiento intermedio, intentos fallidos, outputs largos de herramientas.
      </p>
      <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-3 mt-2">
        <p class="text-xs text-agent-muted"><strong class="text-agent-warning">Tip:</strong> Puedes pasar instrucciones a compact: <code class="text-agent-accent">/compact focus on the auth module decisions</code> para guiar que se preserva con prioridad.</p>
      </div>
    </div>

    <!-- Technique 2: Structured Note-Taking -->
    <div class="card border-l-4 border-l-blue-500 mb-6">
      <h3 class="text-lg font-bold text-agent-text mb-2">2. Structured Note-Taking (Agentic Memory)</h3>
      <p class="text-agent-muted leading-relaxed mb-3">
        La idea mas poderosa de context engineering: <strong class="text-agent-text">que el agente escriba sus propias notas</strong>. En vez de depender unicamente de la ventana de contexto (que se degrada), el agente mantiene un archivo de progreso que sobrevive a compaction e incluso a /clear.
      </p>
      <p class="text-agent-muted leading-relaxed mb-3">
        Anthropic llama a esto <strong class="text-agent-text">"agentic memory"</strong>. El agente crea un archivo (ej: <code class="text-agent-accent">PROGRESS.md</code> o <code class="text-agent-accent">.claude/progress.md</code>) donde registra: decisiones tomadas, archivos modificados, problemas encontrados, y proximos pasos. Este archivo persiste en el filesystem y el agente puede releerlo despues de un /compact.
      </p>

      {@html `<pre class="code-block text-xs mb-3"># PROGRESS.md (escrito por el agente)
## Tarea: Migrar auth de JWT a OAuth2

### Decisiones
- Usar auth0 como provider (decidido por req de SSO)
- Mantener JWT para service-to-service

### Completado
- [x] Configurar auth0 tenant
- [x] Crear middleware de auth
- [x] Migrar /login y /register

### Pendiente
- [ ] Migrar /users endpoints
- [ ] Tests de integracion
- [ ] Actualizar docs

### Problemas encontrados
- El middleware legacy usa headers custom X-Auth-Token
- Hay 3 endpoints que bypassean auth (intencionalmente)</pre>`}

      <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-3 mt-2">
        <p class="text-xs text-agent-muted"><strong class="text-agent-info">Dato:</strong> En el articulo sobre harnesses de Anthropic, se reporta que agentes con "initializer" (archivos de progreso leidos al inicio de cada iteracion) mantienen coherencia durante 100+ iteraciones de un loop agentico. Sin initializer, la coherencia cae despues de 20-30 iteraciones.</p>
      </div>
    </div>

    <!-- Technique 3: Sub-Agent Architecture -->
    <div class="card border-l-4 border-l-green-500 mb-6">
      <h3 class="text-lg font-bold text-agent-text mb-2">3. Sub-Agent Architecture</h3>
      <p class="text-agent-muted leading-relaxed mb-3">
        Cuando necesitas investigar algo extenso (leer 10 archivos, analizar un microservicio, buscar patrones en un codebase grande), <strong class="text-agent-text">no contamines el contexto principal</strong>. Lanza un sub-agente con un contexto limpio, dedicado solo a esa tarea de investigacion.
      </p>
      <p class="text-agent-muted leading-relaxed mb-3">
        El sub-agente recibe instrucciones minimas ("analiza el servicio de pagos y retorna un resumen de su API, dependencias, y patrones"), trabaja con su propia ventana de contexto limpia, y retorna un resumen de 1-2K tokens. El agente principal nunca ve los detalles intermedios de la investigacion, solo el resultado destilado.
      </p>
      <p class="text-agent-muted leading-relaxed mb-3">
        En Claude Code, los sub-agentes se lanzan nativamente con <code class="text-agent-accent">Task</code> tool o via <code class="text-agent-accent">claude --print</code> en modo headless. El patron es: <strong class="text-agent-text">main agent coordina, sub-agents investigan, resultados suben resumidos</strong>.
      </p>

      <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-3 mt-2">
        <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Analogia:</strong> Piensa en un director de proyecto que envia a 3 investigadores a analizar diferentes sistemas. No necesita ver TODOS los documentos que cada investigador leyo. Solo necesita el reporte ejecutivo de cada uno. El sub-agent pattern es exactamente eso: delegacion con resumen.</p>
      </div>
    </div>

    <!-- Technique comparison -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-card">
          <tr>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Tecnica</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Cuando usar</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Preserva contexto?</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Costo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Compaction</td>
            <td class="py-2 px-3">Entre milestones de la misma tarea</td>
            <td class="py-2 px-3 text-agent-success">Si (resumido)</td>
            <td class="py-2 px-3">Bajo (1 llamada al LLM)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Note-Taking</td>
            <td class="py-2 px-3">Tareas de multiples horas/dias</td>
            <td class="py-2 px-3 text-agent-success">Si (en filesystem)</td>
            <td class="py-2 px-3">Minimo (Write tool)</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-text font-bold">Sub-Agents</td>
            <td class="py-2 px-3">Investigacion/exploracion paralela</td>
            <td class="py-2 px-3 text-agent-warning">Parcial (solo resumen)</td>
            <td class="py-2 px-3">Alto (N sesiones extra)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Combinacion ganadora</p>
      <p class="text-sm text-agent-muted">Las tres tecnicas no son excluyentes. La combinacion mas efectiva para tareas complejas: <strong>sub-agents para investigacion</strong> (cada uno retorna resumen), <strong>note-taking para decisiones</strong> (el agente principal escribe PROGRESS.md), y <strong>compaction cuando el contexto crece</strong>. Los equipos que usan las tres reportan sesiones productivas de 4+ horas sin degradacion.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 6: La Regla del 60% -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">La Regla del 60%</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Esta es la regla mas simple y mas impactante de context engineering: <strong class="text-agent-text">nunca pre-cargues mas del 60% de la ventana de contexto</strong>. Deja al menos el 40% libre para que el agente trabaje.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Ese 40% libre no es "espacio desperdiciado". Es el espacio que el agente necesita para: leer archivos adicionales con Read/Grep/Glob, ejecutar herramientas y procesar sus resultados, razonar con extended thinking, generar respuestas largas (codigo, explicaciones), y manejar errores con retries. Si pre-cargas el 85% del contexto, el agente tiene solo el 15% para TODA su operacion. Es como darle a un cirujano un quirofano donde el 85% del espacio esta ocupado por documentos.
    </p>

    <!-- Visual: Context Window Distribution -->
    <div class="card bg-agent-dark mb-6">
      <h3 class="text-agent-text font-bold mb-3">Distribucion optima de la ventana de contexto</h3>
      <div class="space-y-3">
        <div>
          <div class="flex justify-between text-xs text-agent-muted mb-1">
            <span>CLAUDE.md + System Prompt</span>
            <span class="text-agent-accent">~5-10%</span>
          </div>
          <div class="w-full bg-agent-darker rounded-full h-3">
            <div class="bg-purple-500 h-3 rounded-full" style="width: 8%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-agent-muted mb-1">
            <span>Tool Definitions</span>
            <span class="text-agent-accent">~5-10%</span>
          </div>
          <div class="w-full bg-agent-darker rounded-full h-3">
            <div class="bg-blue-500 h-3 rounded-full" style="width: 8%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-agent-muted mb-1">
            <span>Archivos / Contexto pre-cargado</span>
            <span class="text-agent-accent">~20-30%</span>
          </div>
          <div class="w-full bg-agent-darker rounded-full h-3">
            <div class="bg-cyan-500 h-3 rounded-full" style="width: 25%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-agent-muted mb-1">
            <span>Historial de conversacion</span>
            <span class="text-agent-accent">~10-20%</span>
          </div>
          <div class="w-full bg-agent-darker rounded-full h-3">
            <div class="bg-yellow-500 h-3 rounded-full" style="width: 15%"></div>
          </div>
        </div>
        <div class="pt-2 border-t border-agent-border/50">
          <div class="flex justify-between text-xs text-agent-muted mb-1">
            <span class="text-agent-success font-bold">Espacio libre para el agente (TARGET: 40%+)</span>
            <span class="text-agent-success font-bold">~40%+</span>
          </div>
          <div class="w-full bg-agent-darker rounded-full h-3">
            <div class="bg-agent-success h-3 rounded-full" style="width: 44%"></div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Para tareas complejas, Anthropic recomienda dividir el trabajo en <strong class="text-agent-text">fases</strong> para mantener el contexto limpio:
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card bg-agent-dark text-center py-4">
        <span class="text-2xl block mb-1">&#x1F50D;</span>
        <p class="text-xs text-agent-accent font-bold">Fase 1</p>
        <p class="text-xs text-agent-muted">Research</p>
      </div>
      <div class="card bg-agent-dark text-center py-4">
        <span class="text-2xl block mb-1">&#x1F4CB;</span>
        <p class="text-xs text-agent-accent font-bold">Fase 2</p>
        <p class="text-xs text-agent-muted">Plan</p>
      </div>
      <div class="card bg-agent-dark text-center py-4">
        <span class="text-2xl block mb-1">&#x2699;&#xFE0F;</span>
        <p class="text-xs text-agent-accent font-bold">Fase 3</p>
        <p class="text-xs text-agent-muted">Implement</p>
      </div>
      <div class="card bg-agent-dark text-center py-4">
        <span class="text-2xl block mb-1">&#x2705;</span>
        <p class="text-xs text-agent-accent font-bold">Fase 4</p>
        <p class="text-xs text-agent-muted">Validate</p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Usa <code class="text-agent-accent">/clear</code> entre cada fase. El resultado de la fase anterior (plan, codigo, notas) persiste en el filesystem. La siguiente fase empieza con un contexto fresco que lee los artefactos de la fase previa. Es como un relay race donde cada corredor empieza fresco pero recibe el baton del anterior.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: incident.io</p>
      <p class="text-sm text-agent-muted">El equipo de incident.io reporto que su workflow de 4-7 agentes concurrentes usa /clear agresivamente entre tareas. Cada agente trabaja en un git worktree aislado con un contexto limpio dedicado a una sola tarea. El resultado: PRs mas pequenos, reviews mas rapidos, y cero contaminacion de contexto entre tareas. La clave fue tratar cada tarea como una sesion independiente.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">La regla del 60% en numeros</p>
      <p class="text-sm text-agent-muted">Con una ventana de 200K tokens: <strong>120K es tu limite de pre-carga</strong>. Pero en la practica, entre system prompt (~5K), tool definitions (~10K), y CLAUDE.md (~2.5K), ya tienes ~17.5K ocupados antes de empezar. Tu budget real para archivos y contexto es ~100K. Y cada tool call que genere output reduce ese espacio. Planifica en consecuencia.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Anti-patron: "La sesion de 6 horas"</p>
      <p class="text-sm text-agent-muted">Desarrolladores que abren una sesion y trabajan 6 horas sin /clear ni /compact. El contexto crece hasta el 95%, la calidad cae en picada, generan bugs que les toman mas tiempo arreglar que lo que "ahorraron" al no gestionar el contexto. <strong>Una sesion limpia de 30 minutos produce mejor codigo que una sesion sucia de 3 horas.</strong></p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 7: El Impacto de /clear -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Impacto de /clear</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Si solo te llevas UNA practica de todo este modulo, que sea esta: <strong class="text-agent-text">usa /clear entre tareas independientes</strong>. Es el cambio mas simple con el impacto mas grande en calidad y costo.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      <code class="text-agent-accent">/clear</code> borra toda la conversacion actual pero mantiene los archivos CLAUDE.md cargados. Es un reset limpio del contexto de trabajo. El agente re-lee tus rules files y empieza fresco, pero tu proyecto sigue ahi con todos los cambios que hiciste en la sesion anterior.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-card">
          <tr>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Metrica</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Sin /clear</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold border-b border-agent-border">Con /clear entre tareas</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Tokens por tarea</td>
            <td class="py-2 px-3">Crece exponencialmente</td>
            <td class="py-2 px-3 text-agent-success">Constante (~base tokens)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Ahorro de tokens</td>
            <td class="py-2 px-3">0% (referencia)</td>
            <td class="py-2 px-3 text-agent-success">50-70% por sesion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Calidad en tarea 5</td>
            <td class="py-2 px-3 text-agent-danger">Degradada (context rot)</td>
            <td class="py-2 px-3 text-agent-success">Igual que tarea 1</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-text font-bold">Consistencia</td>
            <td class="py-2 px-3 text-agent-danger">Decrece con el tiempo</td>
            <td class="py-2 px-3 text-agent-success">Estable</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">/clear vs /compact: Cuando usar cual</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">/clear</strong> = borra todo. Ideal entre tareas <em>independientes</em> (feature A terminada, empiezo feature B). No necesitas contexto de la tarea anterior.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">/compact</strong> = resume y comprime. Ideal en <em>medio</em> de una tarea larga (completaste investigacion, ahora vas a implementar). Necesitas preservar decisiones pero no los detalles intermedios.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Regla de oro</p>
      <p class="text-sm text-agent-muted">Si la siguiente tarea NO necesita nada de la conversacion actual: <strong>/clear</strong>. Si la siguiente fase SI necesita las decisiones de la fase actual pero no los detalles: <strong>/compact</strong>. En la duda, <strong>/clear + escribir las decisiones en un archivo</strong> es siempre la opcion mas segura.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Workflow diario con /clear</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Un dia tipico de trabajo productivo con un agente se ve asi: arrancas la sesion, el agente lee CLAUDE.md. Trabajas en bug #1 (20 min). <code class="text-agent-accent">/clear</code>. Trabajas en feature #2 (40 min). <code class="text-agent-accent">/compact</code> porque la feature aun no termina pero el contexto crecio. Continuas feature #2 (20 min). <code class="text-agent-accent">/clear</code>. Escribes tests (30 min). Cada tarea obtiene un contexto fresco. Cada transicion es explicita.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los desarrolladores que adoptan este workflow reportan dos beneficios inesperados: primero, el <strong class="text-agent-text">costo de tokens baja drasticamente</strong> porque el agente no re-procesa 100K tokens de historial viejo en cada llamada. Segundo, la <strong class="text-agent-text">calidad de la 5ta tarea del dia es igual a la 1ra</strong>, porque cada una empieza con un contexto limpio. Sin /clear, la 5ta tarea es notablemente peor que la 1ra.
    </p>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- SECTION 8: Modelo Mental + Resumen -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Framework Completo de Context Engineering</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Todo lo que aprendiste en este modulo se resume en un flujo ciclico que el diagrama interactivo a continuacion representa. Desde las capas de CLAUDE.md como fundamento, pasando por JIT loading, gestion activa de la memoria de trabajo, compaction, delegacion a sub-agentes, y /clear entre fases. Cada nodo es una herramienta que dominas para mantener al agente operando en su mejor nivel.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Modelo mental: El context engineer</p>
      <p class="text-sm text-agent-muted">Hazte estas 3 preguntas antes de cada sesion con un agente:</p>
      <ol class="text-sm text-agent-muted mt-2 space-y-1 list-decimal list-inside">
        <li><strong class="text-agent-text">Que contexto NECESITA el agente?</strong> (CLAUDE.md, archivos relevantes, nada mas)</li>
        <li><strong class="text-agent-text">Cuanto durara esta tarea?</strong> (corta = sin gestion, larga = necesito plan de compaction/clear)</li>
        <li><strong class="text-agent-text">Hay investigacion previa?</strong> (si = sub-agents primero, no = directo a implementar)</li>
      </ol>
      <p class="text-sm text-agent-muted mt-2">Si puedes responder estas 3 preguntas antes de empezar, tu sesion sera 2-3x mas productiva que "abrir el agente y ver que pasa".</p>
    </div>

    <div class="card bg-agent-dark border-agent-accent/30 mb-6">
      <h3 class="text-agent-accent font-bold mb-3">Checklist de Context Engineering</h3>
      <ul class="text-sm text-agent-muted space-y-2">
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>CLAUDE.md bajo 2.5K tokens con lo esencial del proyecto</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>Path Rules para reglas especificas por area (.claude/rules/)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>JIT: paths en vez de contenido completo en el CLAUDE.md</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>/compact entre milestones dentro de una tarea</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>/clear entre tareas independientes</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>Sub-agentes para investigacion sin contaminar contexto principal</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>Fases: Research &#8594; Plan &#8594; Implement &#8594; Validate</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent shrink-0">&#9744;</span>
          <span>Regla del 60%: nunca pre-cargar mas del 60% de la ventana</span>
        </li>
      </ul>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- INTERACTIVE FLOW -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el pipeline de context management interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Pipeline de Context Engineering"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- QUIZ -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10">
    {#if !showQuiz}
      <button onclick={() => showQuiz = true} class="btn-primary w-full justify-center">
        Comenzar el quiz
      </button>
    {:else}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#x1F3AF;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ahora dominas context engineering: la habilidad que separa a los usuarios casuales de los profesionales. Sabes disenar el entorno informacional optimo para que tu agente produzca resultados de maxima calidad de forma consistente.</p>
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
{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
