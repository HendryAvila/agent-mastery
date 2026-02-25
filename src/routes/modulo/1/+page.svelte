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

  const MODULE_ID = 1;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);

  let showFlow = $state(false);
  let showQuiz = $state(false);
  let flowDone = $state(false);
  let quizDone = $state(false);

  courseStore.startModule(MODULE_ID);

  function handleFlowComplete(score: number, total: number) {
    flowDone = true;
  }

  function handleQuizComplete(score: number, total: number) {
    quizDone = true;
    courseStore.completeModule(MODULE_ID, score, total);
    const badge = courseStore.unlockBadge('agent-anatomy');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
    completed = true;
  }

  // InteractiveFlow data: The Agent Loop (circular)
  const flowNodes = [
    { id: 'input', label: 'Input del Usuario', description: 'El usuario proporciona una tarea, pregunta o instruccion al agente. Este es el punto de entrada del loop. Puede ser "arregla este bug", "crea un endpoint" o cualquier solicitud en lenguaje natural.', icon: '\u{1F4AC}', x: 50, y: 10 },
    { id: 'llm', label: 'Procesamiento LLM', description: 'El cerebro del agente. El LLM analiza el input, el contexto acumulado y los resultados previos para RAZONAR sobre que hacer. En Claude Code esto es Claude Opus 4.6 con extended thinking activado.', icon: '\u{1F9E0}', x: 88, y: 30 },
    { id: 'planning', label: 'Planificacion', description: 'El LLM decide QUE herramienta usar, con que parametros, y en que orden. Si necesita multiples acciones, planifica la secuencia. En Claude Code, el plan mode muestra el razonamiento al usuario.', icon: '\u{1F4CB}', x: 88, y: 65 },
    { id: 'tool', label: 'Ejecucion de Tool', description: 'La aplicacion host ejecuta la herramienta seleccionada: Read, Write, Edit, Bash, Glob, Grep, WebFetch, o cualquier MCP server conectado. El LLM NO ejecuta directamente, solo solicita.', icon: '\u{1F527}', x: 50, y: 85 },
    { id: 'result', label: 'Analisis de Resultado', description: 'El resultado de la herramienta se reinyecta al LLM. El agente observa si la accion fue exitosa, si necesita mas informacion, o si debe intentar otra estrategia. Este es el "observe" del ciclo.', icon: '\u{1F50D}', x: 12, y: 65 },
    { id: 'response', label: 'Respuesta / Siguiente Accion', description: 'El agente decide: si la tarea esta completa, genera una respuesta final al usuario. Si no, vuelve al paso de procesamiento LLM para continuar el loop. Este ciclo puede repetirse decenas de veces.', icon: '\u{2705}', x: 12, y: 30 },
  ];

  const flowEdges = [
    { from: 'input', to: 'llm', label: 'observe' },
    { from: 'llm', to: 'planning', label: 'think' },
    { from: 'planning', to: 'tool', label: 'act' },
    { from: 'tool', to: 'result', label: 'resultado' },
    { from: 'result', to: 'response', label: 'evaluar' },
    { from: 'response', to: 'llm', label: 'loop' },
  ];

  const flowChallenges = [
    { question: 'Cual componente decide QUE herramienta usar y con que parametros?', targetNodeId: 'planning', hint: 'No es la ejecucion, es la fase donde se DECIDE la estrategia.' },
    { question: 'Donde ocurre el razonamiento principal del agente?', targetNodeId: 'llm', hint: 'Es el "cerebro" del sistema, donde se procesa el lenguaje natural.' },
    { question: 'Quien ejecuta REALMENTE la herramienta: el LLM o la aplicacion host?', targetNodeId: 'tool', hint: 'El LLM solo genera una solicitud JSON, otra pieza de software la ejecuta.' },
    { question: 'En que paso el agente decide si la tarea esta COMPLETA o debe continuar?', targetNodeId: 'response', hint: 'Es el punto de decision entre terminar o hacer otra iteracion del loop.' },
  ];

  // Quiz data: 3 general agent concepts + 2 Claude Code anatomy
  const quizQuestions = [
    {
      question: 'Un agente de codigo detecta un bug y necesita ejecutar 3 herramientas para verificarlo: leer el archivo, correr los tests, y revisar los logs. En que parte del agent loop se decide el ORDEN de estas herramientas?',
      options: [
        { text: 'En la ejecucion de tools, porque las herramientas se auto-organizan', correct: false, explanation: 'Las herramientas solo se ejecutan, no deciden su propio orden. Son pasivas.' },
        { text: 'En el procesamiento del LLM, durante la fase de planificacion', correct: true, explanation: 'Correcto. El LLM razona sobre la secuencia optima ANTES de ejecutar nada. La planificacion es la fase donde se decide estrategia, orden y parametros.' },
        { text: 'En el analisis de resultado, porque ahi se re-evalua el plan', correct: false, explanation: 'El analisis de resultado evalua lo ya ejecutado, no planifica la secuencia inicial. Puede causar re-planificacion, pero el orden inicial se decide antes.' },
        { text: 'No importa el orden, el agente ejecuta todo en paralelo siempre', correct: false, explanation: 'No todas las acciones son independientes. Necesitas leer el archivo ANTES de saber que tests correr. La planificacion distingue dependencias.' },
      ],
      source: 'Anthropic - Building Effective Agents',
      sourceUrl: 'https://www.anthropic.com/research/building-effective-agents'
    },
    {
      question: 'Cual de estas es una diferencia FUNDAMENTAL entre un copilot (Nivel 1) y un agente autonomo (Nivel 2+)?',
      options: [
        { text: 'El copilot usa IA y el agente usa reglas programaticas', correct: false, explanation: 'Ambos usan LLMs. La diferencia no es la tecnologia subyacente sino el FLUJO DE CONTROL.' },
        { text: 'El copilot sugiere y el humano decide; el agente toma decisiones y ejecuta acciones por si mismo', correct: true, explanation: 'Exacto. La diferencia clave es QUIEN CONTROLA EL FLUJO. En un copilot, el humano aprueba cada accion. En un agente, el sistema ejecuta autonomamente y el humano supervisa.' },
        { text: 'El agente es mas preciso que el copilot', correct: false, explanation: 'No necesariamente. Un agente puede ser menos preciso pero mas autonomo. La precision depende del modelo y las herramientas, no del nivel de autonomia.' },
        { text: 'El copilot solo funciona en IDEs y el agente solo en la terminal', correct: false, explanation: 'Hay copilots en terminales y agentes en IDEs. El medio de operacion no define el nivel de autonomia.' },
      ],
      source: 'Anthropic - Building Effective Agents',
      sourceUrl: 'https://www.anthropic.com/research/building-effective-agents'
    },
    {
      question: 'En el patron ReAct (Reasoning + Acting), que sucede si eliminas la fase de "Reasoning" y el agente solo ejecuta acciones directamente?',
      options: [
        { text: 'El agente se vuelve mas rapido porque salta un paso', correct: false, explanation: 'Mas rapido si, pero drasticamente menos preciso. Sin razonamiento, el agente ejecuta acciones sin evaluar si son correctas o necesarias.' },
        { text: 'El agente pierde la capacidad de autocorregirse porque no razona sobre los resultados de sus acciones', correct: true, explanation: 'Sin la fase de razonamiento, el agente no puede evaluar si una accion fue exitosa, diagnosticar errores, o cambiar de estrategia. Se convierte en un ejecutor ciego que no aprende de sus propios resultados.' },
        { text: 'No pasa nada, el razonamiento es opcional en agentes modernos', correct: false, explanation: 'El razonamiento es lo que DIFERENCIA a un agente de un script automatizado. Sin el, pierdes adaptabilidad, deteccion de errores y capacidad de cambiar de enfoque.' },
        { text: 'El agente usa mas herramientas para compensar', correct: false, explanation: 'Usar mas herramientas sin razonamiento solo genera mas acciones sin direccion. El problema no se resuelve con mas herramientas sino con mejor razonamiento.' },
      ],
      source: 'ReAct: Synergizing Reasoning and Acting in Language Models',
      sourceUrl: 'https://arxiv.org/abs/2210.03629'
    },
    {
      question: 'En Claude Code, el archivo CLAUDE.md actua como el system prompt del agente. Si un proyecto tiene CLAUDE.md en la raiz y otro en un subdirectorio, que sucede?',
      options: [
        { text: 'Solo se lee el de la raiz, los demas se ignoran', correct: false, explanation: 'Claude Code tiene una jerarquia de CLAUDE.md: user-global (~/.claude/CLAUDE.md), proyecto (raiz), y directorio-especifico. Todos se combinan, no se ignoran.' },
        { text: 'Claude Code los fusiona jerarquicamente, combinando las instrucciones de ambos niveles', correct: true, explanation: 'Correcto. Claude Code carga CLAUDE.md desde 3 niveles: instrucciones globales del usuario, proyecto, y subdirectorio. Se concatenan para formar el contexto completo. Esto permite reglas generales en la raiz y reglas especificas por carpeta.' },
        { text: 'El del subdirectorio reemplaza completamente al de la raiz', correct: false, explanation: 'No se reemplaza. La jerarquia de CLAUDE.md es aditiva: cada nivel agrega contexto al anterior. Si hubiera conflicto, el mas especifico tiene prioridad, pero normalmente se complementan.' },
        { text: 'Claude Code pide al usuario cual usar al inicio de cada sesion', correct: false, explanation: 'La carga es automatica y silenciosa. Claude Code detecta y carga todos los CLAUDE.md relevantes al iniciar la sesion sin preguntar.' },
      ],
      source: 'Claude Code - Memory',
      sourceUrl: 'https://code.claude.com/docs/en/memory'
    },
    {
      question: 'Cuando Claude Code ejecuta una herramienta como Bash("npm test"), que parte del sistema es la que realmente ejecuta el comando npm?',
      options: [
        { text: 'El modelo Claude Opus 4.6 ejecuta el comando directamente en el servidor de Anthropic', correct: false, explanation: 'El modelo NUNCA ejecuta nada. Solo genera la solicitud de tool call como JSON. La ejecucion es local.' },
        { text: 'La aplicacion Claude Code (el host) ejecuta el comando en tu maquina local', correct: true, explanation: 'Correcto. El modelo genera un JSON diciendo "quiero ejecutar Bash con argumento npm test". La aplicacion Claude Code (corriendo en tu terminal) intercepta esa solicitud, ejecuta el comando en tu maquina, y devuelve el output al modelo. El LLM nunca toca tu sistema directamente.' },
        { text: 'Un servicio cloud intermediario ejecuta el comando y devuelve el resultado', correct: false, explanation: 'No hay intermediario cloud. Claude Code es una aplicacion local (CLI en Node.js) que ejecuta las herramientas directamente en tu maquina.' },
        { text: 'El propio sistema operativo detecta la solicitud del LLM y la ejecuta automaticamente', correct: false, explanation: 'El SO no sabe nada sobre LLMs. Es la aplicacion Claude Code la que traduce las solicitudes del modelo a operaciones del sistema.' },
      ],
      source: 'Claude Code - Overview',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
    },
  ];
</script>

<svelte:head>
  <title>Modulo 1: {mod.title} | Agent Mastery</title>
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

  <!-- =============================================
       THEORY SECTION 1: Que es un agente IA
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">Que es un agente IA</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de entender que ES un agente, necesitas saber que NO lo es. El mercado esta lleno de productos que se autodenominan "agentes" cuando en realidad son chatbots glorificados. Vamos a separar la paja del trigo.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Esta distincion no es academica: tiene consecuencias practicas directas. Si tratas a un chatbot como si fuera un agente, vas a disenar tu sistema mal. Vas a esperar que tome decisiones, que ejecute acciones, que se autocorrija, y nada de eso va a pasar. Por otro lado, si tratas a un agente como si fuera un chatbot, vas a subutilizarlo enormemente. Le vas a dar instrucciones paso a paso cuando el es perfectamente capaz de planificar la secuencia el mismo.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">La clasificacion de Anthropic</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Anthropic publico en diciembre 2024 su paper <em class="text-agent-highlight">"Building Effective Agents"</em>, donde establece una clasificacion formal. Segun Anthropic, la mayoria de lo que la industria llama "agentes" son en realidad <strong class="text-agent-highlight">workflows</strong>: secuencias predefinidas de pasos con LLMs. Un agente REAL es un sistema donde el LLM controla dinamicamente su propio flujo de trabajo, decidiendo que herramientas usar, en que orden, y cuando parar. La diferencia es sutil pero fundamental: en un workflow, vos defines los pasos. En un agente, el LLM define los pasos.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Anthropic recomienda empezar con workflows simples y escalar a agentes solo cuando la complejidad lo justifique. Textualmente dicen: <em>"The most successful implementations we've seen don't use complex frameworks or specialized libraries. Instead, they use simple, composable patterns."</em> La sofisticacion no siempre es la respuesta.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La evolucion: de chatbot a copilot a agente</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para entender donde estamos, necesitas saber de donde venimos. En <strong class="text-agent-text">2022</strong>, todo era "chatbot". ChatGPT lanzo en noviembre y el mundo conocio los LLMs. En <strong class="text-agent-text">2023</strong>, aparecieron los "copilots": ChatGPT Plugins, GitHub Copilot Chat, y las primeras integraciones de IA en IDEs. En <strong class="text-agent-text">2024</strong>, llego la explosion: Devin, Claude Code, Cursor Agent Mode, y docenas de herramientas que podian ejecutar codigo, leer archivos, y tomar decisiones. Y en <strong class="text-agent-text">2025-2026</strong>, llegamos a la madurez: sistemas multi-agente, orquestacion, y despliegues en produccion real.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">GitHub Copilot es el ejemplo perfecto de esta evolucion. Lanzo como un <strong class="text-agent-text">autocompletado</strong> en 2022 (Nivel 0.5). En 2023 agrego el <strong class="text-agent-text">chat panel</strong> (Nivel 1). En 2025 lanzo <strong class="text-agent-text">Copilot Agent Mode</strong> que puede ejecutar comandos de terminal, editar multiples archivos, y corregir errores de build por si mismo (Nivel 2). Un mismo producto subio 3 niveles de autonomia en 3 anos.</p>
    </div>

    <!-- Comparison table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Caracteristica</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Chatbot (Nivel 0)</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Copilot (Nivel 1)</th>
            <th class="text-left py-3 px-4 text-agent-highlight font-bold">Agente (Nivel 2+)</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Interaccion</td>
            <td class="py-3 px-4">Pregunta-respuesta</td>
            <td class="py-3 px-4">Sugerencia inline</td>
            <td class="py-3 px-4 text-agent-highlight">Ejecucion autonoma</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Herramientas</td>
            <td class="py-3 px-4">Ninguna</td>
            <td class="py-3 px-4">Limitadas al IDE</td>
            <td class="py-3 px-4 text-agent-highlight">Multiples, externas</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Quien controla</td>
            <td class="py-3 px-4">El usuario 100%</td>
            <td class="py-3 px-4">El usuario aprueba</td>
            <td class="py-3 px-4 text-agent-highlight">El agente decide</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Memoria</td>
            <td class="py-3 px-4">Solo la conversacion</td>
            <td class="py-3 px-4">Archivo actual</td>
            <td class="py-3 px-4 text-agent-highlight">Contexto del proyecto</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Autocorreccion</td>
            <td class="py-3 px-4">No</td>
            <td class="py-3 px-4">Limitada</td>
            <td class="py-3 px-4 text-agent-highlight">Si, en cada iteracion</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-accent">Ejemplo</td>
            <td class="py-3 px-4">ChatGPT basico</td>
            <td class="py-3 px-4">GitHub Copilot inline</td>
            <td class="py-3 px-4 text-agent-highlight">Claude Code, Cursor Agent</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Mucha gente piensa que un chatbot con acceso a internet es un agente. <strong class="text-agent-text">No lo es.</strong> Agregar "search" a ChatGPT no lo convierte en agente. Un agente necesita un LOOP de decision: observar resultado, razonar, decidir siguiente accion, ejecutar, repetir. Si el sistema hace una cosa y para, no es un agente, es un workflow de un solo paso.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Clave para recordar:</p>
      <p class="text-sm text-agent-muted">Un chatbot RESPONDE. Un copilot SUGIERE. Un agente ACTUA. La diferencia fundamental es quien tiene el control del flujo de trabajo.</p>
    </div>
  </section>

  <!-- =============================================
       THEORY SECTION 2: El Agent Loop
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">El Agent Loop: observe-think-act</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El corazon de todo agente es un ciclo que se repite: observar el estado actual, razonar sobre que hacer, ejecutar una accion, y observar el resultado. Este patron se llama <strong class="text-agent-highlight">Agent Loop</strong> y es lo que convierte un simple LLM en un agente.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La magia del agent loop es que es <strong class="text-agent-highlight">indeterminado</strong>: nadie sabe de antemano cuantas iteraciones necesitara. Un bug simple puede resolverse en 3 iteraciones (leer, editar, verificar). Un refactoring complejo puede necesitar 30+ iteraciones. El agente decide cuando parar basandose en si la tarea esta completa, no en un numero predefinido de pasos.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Este patron viene del paper <strong class="text-agent-highlight">ReAct</strong> (Reasoning + Acting), publicado por Yao et al. en Princeton en 2022. La idea central: combinar razonamiento y accion en un loop mejora drasticamente el rendimiento comparado con solo razonar (Chain-of-Thought) o solo actuar (herramientas sin razonamiento). El "sweet spot" es el ciclo completo.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">El pseudocodigo del Agent Loop</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si tuvieras que programar un agente desde cero, el loop se veria asi:
    </p>
    {@html `<pre class="code-block text-xs mb-4">while True:
    # 1. OBSERVE: Recopilar contexto actual
    context = [system_prompt, user_message, tool_results]

    # 2. THINK: El LLM razona sobre el contexto
    response = llm.generate(context, tools=available_tools)

    # 3. DECIDE: El LLM elige una accion
    if response.has_tool_calls():
        # ACT: Ejecutar las herramientas solicitadas
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)
            context.append(tool_result(result))
        # Volver al paso 1 con el nuevo contexto
        continue
    else:
        # STOP: El LLM decidio que la tarea esta completa
        return response.text_content</pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Observa el <code class="text-agent-highlight bg-agent-darker px-1 rounded">while True</code>: el loop es potencialmente infinito. La unica forma de salir es que el LLM decida NO hacer mas tool calls. Si el agente tiene mala planificacion, puede quedarse en un loop infinito. Por eso los sistemas de produccion siempre tienen un <strong class="text-agent-text">max_iterations</strong> como safety net.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Condiciones de parada</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un agente puede parar por varias razones:
    </p>
    <ul class="space-y-2 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-success shrink-0 mt-0.5">&#x2714;</span>
        <span><strong class="text-agent-text">Tarea completada:</strong> El agente verifica que la accion fue exitosa (tests pasan, archivo creado) y genera una respuesta de resumen.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-warning shrink-0 mt-0.5">&#x26A0;</span>
        <span><strong class="text-agent-text">Necesita input humano:</strong> El agente llega a un punto donde necesita una decision del usuario (ej: "hay 3 formas de resolver esto, cual prefieres?").</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-danger shrink-0 mt-0.5">&#x2718;</span>
        <span><strong class="text-agent-text">Limite alcanzado:</strong> Se alcanzo el maximo de iteraciones o el context window esta lleno.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-danger shrink-0 mt-0.5">&#x2718;</span>
        <span><strong class="text-agent-text">Error irrecuperable:</strong> La herramienta falla repetidamente y el agente no puede continuar.</span>
      </li>
    </ul>

    <h3 class="text-lg font-bold text-agent-text mb-3">Chatbot vs Agente: la diferencia en accion</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-muted font-bold text-sm mb-2">Chatbot (1 turno)</h4>
        <p class="text-xs text-agent-muted mb-2">Usuario: "arregla el test que falla"</p>
        <p class="text-xs text-agent-muted">Bot: "Para arreglar un test que falla, primero deberias identificar el error leyendo el output. Luego revisa el archivo del test y compara con la implementacion..."</p>
        <p class="text-xs text-agent-danger mt-2">Resultado: Te dio una RECETA, no arreglo nada.</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Agente (15 tool calls)</h4>
        <p class="text-xs text-agent-muted mb-2">Usuario: "arregla el test que falla"</p>
        <p class="text-xs text-agent-muted">Agente: Ejecuto npm test, lei user.test.ts, identifique que el mock no coincidia con la interfaz, edite el mock, volvi a correr los tests, confirmado que pasan.</p>
        <p class="text-xs text-agent-success mt-2">Resultado: El bug esta ARREGLADO. Los tests pasan.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En las evaluaciones internas de Anthropic, Claude Code resuelve el 72.7% de los issues en SWE-bench Verified, un benchmark que mide la capacidad de resolver issues reales de GitHub. Cada resolucion requiere un promedio de 10-30 iteraciones del agent loop. Un chatbot simplemente no puede hacer esto porque no tiene loop.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      El paper "Building Effective Agents" de Anthropic hace enfasis en que este loop debe ser lo mas simple posible. Los mejores agentes no son los que tienen loops complicados con multiples sub-loops y estados internos. Son los que tienen un loop limpio y directo donde el LLM tiene la informacion correcta para tomar buenas decisiones en cada iteracion.
    </p>
  </section>

  <!-- =============================================
       THEORY SECTION 3: Los 4 componentes core
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">Los 4 Componentes Core</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Todo agente IA, sin importar el framework o la implementacion, tiene estos cuatro componentes. Piensa en ellos como los organos vitales: si falta uno, el agente no funciona. Los mismos cuatro aparecen tanto en Claude Code como en Devin, tanto en un agente sencillo de 50 lineas como en un sistema multi-agente empresarial.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F9E0;</span>
          <h3 class="text-agent-text font-bold">LLM (El Cerebro)</h3>
        </div>
        <p class="text-sm text-agent-muted">El modelo de lenguaje es el motor de razonamiento. Recibe instrucciones en lenguaje natural, analiza el contexto, y decide que hacer. Sin LLM, no hay agente: solo tenes un script automatizado.</p>
        <p class="text-xs text-agent-accent mt-2">Claude Opus 4.6 — 200K tokens (1M beta)</p>
      </div>

      <div class="card border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F527;</span>
          <h3 class="text-agent-text font-bold">Tools (Las Manos)</h3>
        </div>
        <p class="text-sm text-agent-muted">Las herramientas permiten al agente ACTUAR en el mundo: leer archivos, ejecutar comandos, buscar en la web, editar codigo. Un LLM sin tools es un pensador que no puede hacer nada.</p>
        <p class="text-xs text-agent-accent mt-2">Read, Write, Edit, Bash, Glob, Grep + MCP</p>
      </div>

      <div class="card border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F4BE;</span>
          <h3 class="text-agent-text font-bold">Memory (El Contexto)</h3>
        </div>
        <p class="text-sm text-agent-muted">La memoria permite al agente retener informacion entre iteraciones. Sin memoria, cada paso del loop empieza desde cero. Incluye el historial, resultados previos, y conocimiento del proyecto.</p>
        <p class="text-xs text-agent-accent mt-2">CLAUDE.md (3 niveles) + auto memory + session</p>
      </div>

      <div class="card border-l-4 border-l-agent-info">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F4CB;</span>
          <h3 class="text-agent-text font-bold">Planning (La Estrategia)</h3>
        </div>
        <p class="text-sm text-agent-muted">La capacidad de descomponer una tarea compleja en pasos, decidir el orden, y adaptar el plan cuando algo falla. Diferencia a un agente inteligente de uno que ejecuta a ciegas.</p>
        <p class="text-xs text-agent-accent mt-2">Extended thinking + plan mode</p>
      </div>
    </div>

    <!-- Deep dive: LLM -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: El LLM como motor de razonamiento</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El LLM no es una base de datos con respuestas pregrabadas. Es un modelo estadistico que predice el siguiente token mas probable dada una secuencia de entrada. Tres conceptos tecnicos que necesitas entender sobre el LLM dentro de un agente:
    </p>
    <ul class="space-y-3 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Context window:</strong> Es la "memoria de trabajo" del modelo. Todo lo que el agente sabe en un momento dado debe caber en esta ventana. Claude Opus 4.6 tiene 200K tokens (~150K palabras). Suena mucho, pero un codebase mediano puede llenarlo rapido.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Temperature:</strong> Controla la "creatividad" de las respuestas. Para agentes de codigo, se usa temperature baja (0.0 a 0.3) porque queres respuestas predecibles y correctas, no creativas.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Extended thinking:</strong> Modelos como Claude pueden "pensar" internamente antes de responder, descomponiendo problemas complejos en pasos de razonamiento. Esto les permite planificar ANTES de actuar.</span>
      </li>
    </ul>

    <!-- Deep dive: Tools -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Tools como interfaz con el mundo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas funcionan mediante <strong class="text-agent-highlight">function calling</strong> (lo veremos en detalle en el Modulo 2). Le envias al LLM una lista de herramientas disponibles descritas en JSON Schema. Cuando el modelo decide que necesita usar una, genera un objeto JSON con el nombre y los argumentos. La aplicacion host ejecuta la funcion real y devuelve el resultado al LLM.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Es critico entender que el LLM <strong class="text-agent-highlight">NUNCA ejecuta las herramientas directamente</strong>. Solo genera la solicitud. La aplicacion host (Claude Code, Cursor, etc.) es quien realmente lee archivos, ejecuta comandos, y hace llamadas de red. Esta separacion es fundamental para la seguridad.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Claude Code tiene mas de 10 herramientas internas: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, NotebookEdit, entre otras. Ademas, puede conectarse a cualquier <strong class="text-agent-text">MCP server</strong> para extender sus capacidades: Jira, GitHub, bases de datos, y cientos de integraciones mas.</p>
    </div>

    <!-- Deep dive: Memory -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Memoria de corto y largo plazo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La memoria de un agente opera en dos niveles distintos, como el cerebro humano:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Memoria de corto plazo (Session)</h4>
        <p class="text-xs text-agent-muted">Es el context window del LLM. Incluye el system prompt, instrucciones del usuario, resultados de herramientas previas. Es volatil: cuando cierras la sesion, desaparece.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-warning font-bold text-sm mb-2">Memoria de largo plazo (Persistente)</h4>
        <p class="text-xs text-agent-muted">Informacion que sobrevive entre sesiones. En Claude Code: CLAUDE.md (instrucciones del proyecto), agent memory (aprendizajes automaticos), y el codebase mismo.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Pensar que el agente "recuerda todo". El context window tiene un limite FIJO. Si le pedis que analice 50 archivos, los primeros pueden ser "olvidados" cuando el contexto se llena. Por eso los agentes inteligentes son selectivos: no leen TODO, solo lo que necesitan.</p>
    </div>

    <!-- Deep dive: Planning -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Planning y Chain-of-Thought</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La planificacion es lo que separa a un agente inteligente de uno que dispara herramientas a ciegas. El mecanismo principal se llama <strong class="text-agent-highlight">Chain-of-Thought (CoT)</strong>: el modelo "piensa en voz alta" antes de actuar, descomponiendo la tarea en pasos logicos. Cuando le pedis a Claude Code "refactoriza esta funcion para usar async/await", internamente razona la secuencia de pasos necesarios. Esa descomposicion NO esta programada: emerge del razonamiento del LLM.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La planificacion tambien incluye <strong class="text-agent-highlight">adaptacion</strong>: si el agente ejecuta un paso y el resultado no es el esperado, re-planifica. Si los tests fallan despues de un cambio, el agente analiza el error, ajusta su plan, y prueba una estrategia diferente.
    </p>

    <!-- Component failure table -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Que pasa cuando un componente falla?</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Componente</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Sintoma observable</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Ejemplo real</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">LLM</td>
            <td class="py-3 px-4">Respuestas incoherentes, tool calls con parametros incorrectos</td>
            <td class="py-3 px-4">Usar un modelo muy pequeno para tareas complejas de refactoring</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Tools</td>
            <td class="py-3 px-4">El agente "piensa" correctamente pero no puede actuar</td>
            <td class="py-3 px-4">La herramienta de lectura falla por permisos de archivo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Memory</td>
            <td class="py-3 px-4">Repite acciones, olvida lo que ya hizo, loops infinitos</td>
            <td class="py-3 px-4">Lee el mismo archivo 5 veces porque el contexto se lleno</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-accent">Planning</td>
            <td class="py-3 px-4">Ejecuta herramientas innecesarias, no sigue orden logico</td>
            <td class="py-3 px-4">Intenta correr tests antes de escribir el codigo</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Los 4 componentes no funcionan en aislamiento: forman un sistema integrado. El LLM usa la memoria para entender el contexto, las tools para actuar, y el planning para decidir QUE herramienta usar y CUANDO. Si falla uno, el efecto se propaga a todo el sistema.</p>
    </div>
  </section>

  <!-- =============================================
       THEORY SECTION 4: "En Claude Code" mapping
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">En Claude Code: los 4 componentes en accion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Todo lo que acabamos de ver en teoria tiene una implementacion concreta en Claude Code. Esta herramienta de Anthropic es, posiblemente, el agente de codigo mas avanzado de 2026, y es el que vamos a usar como referencia a lo largo de todo el curso. Veamos como mapea cada componente abstracto a algo real y tangible.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 border-agent-accent">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Componente</th>
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Concepto abstracto</th>
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Implementacion en Claude Code</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-4 px-4">
              <span class="text-lg mr-1">&#x1F9E0;</span>
              <strong class="text-agent-text">LLM</strong>
            </td>
            <td class="py-4 px-4">Motor de razonamiento que analiza contexto y decide acciones</td>
            <td class="py-4 px-4">
              <strong class="text-agent-highlight">Claude Opus 4.6</strong> — 200K context window (1M beta). Seleccionable con <code class="text-agent-highlight bg-agent-darker px-1 rounded">/model</code>. Soporta extended thinking para razonamiento profundo.
            </td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-4 px-4">
              <span class="text-lg mr-1">&#x1F527;</span>
              <strong class="text-agent-text">Tools</strong>
            </td>
            <td class="py-4 px-4">Interfaz para actuar en el mundo real</td>
            <td class="py-4 px-4">
              <strong class="text-agent-highlight">10+ herramientas internas:</strong> Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, NotebookEdit. <strong class="text-agent-highlight">+ MCP servers</strong> para integraciones externas (Jira, GitHub, DBs, etc.)
            </td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-4 px-4">
              <span class="text-lg mr-1">&#x1F4BE;</span>
              <strong class="text-agent-text">Memory</strong>
            </td>
            <td class="py-4 px-4">Retencion de informacion entre iteraciones y sesiones</td>
            <td class="py-4 px-4">
              <strong class="text-agent-highlight">3 niveles de CLAUDE.md:</strong> user-global (<code class="text-agent-highlight bg-agent-darker px-1 rounded">~/.claude/CLAUDE.md</code>), proyecto (raiz), subdirectorio. <strong class="text-agent-highlight">Auto memory</strong> que aprende entre sesiones. <strong class="text-agent-highlight">Context window</strong> como memoria de sesion.
            </td>
          </tr>
          <tr>
            <td class="py-4 px-4">
              <span class="text-lg mr-1">&#x1F4CB;</span>
              <strong class="text-agent-text">Planning</strong>
            </td>
            <td class="py-4 px-4">Descomposicion de tareas y adaptacion del plan</td>
            <td class="py-4 px-4">
              <strong class="text-agent-highlight">Extended thinking</strong> (razonamiento interno antes de actuar). <strong class="text-agent-highlight">Plan mode</strong> (<code class="text-agent-highlight bg-agent-darker px-1 rounded">shift+tab</code>) que muestra la estrategia al usuario antes de ejecutar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La jerarquia de memoria en Claude Code</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La memoria es quizas el componente mas sofisticado de Claude Code. Opera en tres capas que se combinan automaticamente al iniciar cada sesion:
    </p>

    <div class="space-y-3 mb-6">
      <div class="bg-agent-dark border border-agent-accent/20 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-agent-accent font-bold text-sm">Nivel 1:</span>
          <code class="text-agent-highlight bg-agent-darker px-2 py-0.5 rounded text-xs">~/.claude/CLAUDE.md</code>
        </div>
        <p class="text-xs text-agent-muted">Instrucciones globales del usuario. Aplican a TODOS los proyectos. Aca pones tus preferencias personales: "nunca uses tabs", "siempre commit en conventional commits", "prefiero TypeScript sobre JavaScript".</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/20 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-agent-accent font-bold text-sm">Nivel 2:</span>
          <code class="text-agent-highlight bg-agent-darker px-2 py-0.5 rounded text-xs">./CLAUDE.md</code>
        </div>
        <p class="text-xs text-agent-muted">Instrucciones del proyecto en la raiz del repo. Se comparten con todo el equipo via git. Aca pones las convenciones del proyecto: tech stack, patrones, estructura de carpetas, como correr tests.</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/20 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-agent-accent font-bold text-sm">Nivel 3:</span>
          <code class="text-agent-highlight bg-agent-darker px-2 py-0.5 rounded text-xs">./src/CLAUDE.md</code>
        </div>
        <p class="text-xs text-agent-muted">Instrucciones de subdirectorio. Para reglas especificas de una carpeta: "en /api todas las rutas usan middleware de auth", "en /components seguimos atomic design".</p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code fusiona estos tres niveles automaticamente al iniciar sesion. No reemplaza, <strong class="text-agent-highlight">concatena</strong>. Esto permite tener reglas generales en la raiz y reglas especificas por carpeta, exactamente como lo harias con un archivo <code class="text-agent-highlight bg-agent-darker px-1 rounded">.eslintrc</code> que hereda configuraciones.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las herramientas internas de Claude Code</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cada herramienta interna esta optimizada para un tipo especifico de operacion:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Tool</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Funcion</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Cuando la usa</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Read</code></td>
            <td class="py-2 px-3">Leer archivos, imagenes, PDFs</td>
            <td class="py-2 px-3">Entender codigo existente, revisar configuracion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Write</code></td>
            <td class="py-2 px-3">Crear archivos nuevos</td>
            <td class="py-2 px-3">Crear componentes, configs, archivos desde cero</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Edit</code></td>
            <td class="py-2 px-3">Reemplazos exactos de texto</td>
            <td class="py-2 px-3">Modificar codigo existente con precision quirurgica</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Bash</code></td>
            <td class="py-2 px-3">Ejecutar comandos de terminal</td>
            <td class="py-2 px-3">npm test, git commit, build, instalar dependencias</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Glob</code></td>
            <td class="py-2 px-3">Buscar archivos por patron</td>
            <td class="py-2 px-3">Encontrar todos los *.test.ts, localizar componentes</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">Grep</code></td>
            <td class="py-2 px-3">Buscar contenido dentro de archivos</td>
            <td class="py-2 px-3">Encontrar donde se usa una funcion, buscar imports</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight">WebFetch</code></td>
            <td class="py-2 px-3">Obtener contenido de URLs</td>
            <td class="py-2 px-3">Consultar documentacion, leer APIs</td>
          </tr>
          <tr>
            <td class="py-2 px-3"><code class="text-agent-highlight">WebSearch</code></td>
            <td class="py-2 px-3">Buscar en la web</td>
            <td class="py-2 px-3">Investigar errores, buscar soluciones actualizadas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Ademas de las herramientas internas, Claude Code puede conectarse a <strong class="text-agent-text">MCP servers</strong> (Model Context Protocol) para agregar herramientas externas. Un MCP server de Jira le da herramientas para crear y actualizar issues. Un MCP de base de datos le da queries SQL. Esto hace que Claude Code sea extensible sin limites. Lo veremos en profundidad en el Modulo 2.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Anthropic reporto que los desarrolladores mas productivos con Claude Code no son los que le dan instrucciones paso a paso. Son los que configuran bien su CLAUDE.md (memoria de largo plazo) con las convenciones del proyecto, y luego le dan tareas de alto nivel: "implementa el feature X" en vez de "crea el archivo Y, agrega la funcion Z, edita el archivo W". La buena memoria libera al agente para usar su planificacion.</p>
    </div>
  </section>

  <!-- =============================================
       THEORY SECTION 5: Trace real de un ciclo
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">Trace real: "arregla el test que falla en auth.test.ts"</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ahora que conoces los 4 componentes y como se implementan en Claude Code, veamos un ciclo completo en accion. Vamos a seguir paso a paso exactamente lo que hace Claude Code cuando le pedis que arregle un test roto. Cada paso muestra que componente se activa y que herramienta se usa.
    </p>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-3">El usuario escribe:</p>
      <p class="text-agent-text text-sm italic mb-4">"arregla el test que falla en auth.test.ts"</p>

      <div class="space-y-4">
        <!-- Step 1 -->
        <div class="border-l-2 border-agent-accent pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-accent px-2 py-0.5 rounded">THINK</span>
            <span class="text-xs text-agent-muted">Iteracion 1 — Planning</span>
          </div>
          <p class="text-xs text-agent-muted">"Necesito primero ver que test esta fallando y cual es el error. Voy a ejecutar los tests del archivo para ver el output."</p>
        </div>

        <!-- Step 2 -->
        <div class="border-l-2 border-agent-success pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-success px-2 py-0.5 rounded">ACT</span>
            <span class="text-xs text-agent-muted">Tool: Bash</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">npx vitest run auth.test.ts</pre>`}
        </div>

        <!-- Step 3 -->
        <div class="border-l-2 border-agent-info pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-info px-2 py-0.5 rounded">OBSERVE</span>
            <span class="text-xs text-agent-muted">Resultado del tool</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">FAIL src/auth.test.ts
  &#x2717; should validate JWT token (12ms)
    TypeError: validateToken is not a function
    at Object.&lt;anonymous&gt; (src/auth.test.ts:15:22)</pre>`}
        </div>

        <!-- Step 4 -->
        <div class="border-l-2 border-agent-accent pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-accent px-2 py-0.5 rounded">THINK</span>
            <span class="text-xs text-agent-muted">Iteracion 2 — Re-planificacion</span>
          </div>
          <p class="text-xs text-agent-muted">"El error dice que validateToken no es una funcion. Puede ser un problema de export o de import. Necesito leer el test y el modulo de auth para entender la discrepancia."</p>
        </div>

        <!-- Step 5 -->
        <div class="border-l-2 border-agent-success pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-success px-2 py-0.5 rounded">ACT</span>
            <span class="text-xs text-agent-muted">Tool: Read (2 archivos)</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">Read("src/auth.test.ts")   // Ve: import { validateToken } from './auth'
Read("src/auth.ts")        // Ve: export function verifyToken(...)</pre>`}
        </div>

        <!-- Step 6 -->
        <div class="border-l-2 border-agent-accent pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-accent px-2 py-0.5 rounded">THINK</span>
            <span class="text-xs text-agent-muted">Iteracion 3 — Diagnostico</span>
          </div>
          <p class="text-xs text-agent-muted">"Encontre el bug: el test importa 'validateToken' pero la funcion se llama 'verifyToken'. Se renombro la funcion pero no se actualizo el test. Voy a editar el import en el test."</p>
        </div>

        <!-- Step 7 -->
        <div class="border-l-2 border-agent-success pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-success px-2 py-0.5 rounded">ACT</span>
            <span class="text-xs text-agent-muted">Tool: Edit</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">Edit("src/auth.test.ts")
  old: "import { validateToken } from './auth'"
  new: "import { verifyToken } from './auth'"
  + actualizar todas las referencias en el archivo</pre>`}
        </div>

        <!-- Step 8 -->
        <div class="border-l-2 border-agent-success pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-success px-2 py-0.5 rounded">ACT</span>
            <span class="text-xs text-agent-muted">Tool: Bash — Verificacion</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">npx vitest run auth.test.ts</pre>`}
        </div>

        <!-- Step 9 -->
        <div class="border-l-2 border-agent-info pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-info px-2 py-0.5 rounded">OBSERVE</span>
            <span class="text-xs text-agent-muted">Tests pasan</span>
          </div>
          {@html `<pre class="bg-agent-darker rounded p-2 text-xs text-agent-muted overflow-x-auto">&#x2713; src/auth.test.ts (3 tests)
  &#x2713; should validate JWT token (8ms)
  &#x2713; should reject expired token (4ms)
  &#x2713; should reject malformed token (2ms)</pre>`}
        </div>

        <!-- Step 10 -->
        <div class="border-l-2 border-agent-warning pl-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-agent-darker bg-agent-warning px-2 py-0.5 rounded">STOP</span>
            <span class="text-xs text-agent-muted">Tarea completa</span>
          </div>
          <p class="text-xs text-agent-muted">"El test estaba importando 'validateToken' pero la funcion fue renombrada a 'verifyToken'. Actualice el import y todas las referencias en auth.test.ts. Los 3 tests pasan correctamente."</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Desglose: que componentes se usaron</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Paso</th>
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Componente</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Que hizo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">1</td>
            <td class="py-2 px-3 text-agent-info">Planning</td>
            <td class="py-2 px-3">Decidio empezar corriendo los tests para ver el error</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">2</td>
            <td class="py-2 px-3 text-agent-success">Tools (Bash)</td>
            <td class="py-2 px-3">Ejecuto vitest para obtener el output de error</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">3</td>
            <td class="py-2 px-3 text-agent-warning">Memory</td>
            <td class="py-2 px-3">El resultado se agrego al contexto para la siguiente iteracion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">4</td>
            <td class="py-2 px-3 text-agent-accent">LLM</td>
            <td class="py-2 px-3">Razono que el error era de import/export, decidio leer ambos archivos</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">5</td>
            <td class="py-2 px-3 text-agent-success">Tools (Read x2)</td>
            <td class="py-2 px-3">Leyo test y modulo para comparar la interfaz</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">6</td>
            <td class="py-2 px-3 text-agent-accent">LLM</td>
            <td class="py-2 px-3">Diagnostico: nombre de funcion cambio pero test no se actualizo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">7</td>
            <td class="py-2 px-3 text-agent-success">Tools (Edit)</td>
            <td class="py-2 px-3">Actualizo import y referencias en el test</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">8</td>
            <td class="py-2 px-3 text-agent-info">Planning</td>
            <td class="py-2 px-3">Decidio verificar corriendo tests de nuevo</td>
          </tr>
          <tr>
            <td class="py-2 px-3">9-10</td>
            <td class="py-2 px-3 text-agent-success">Tools (Bash)</td>
            <td class="py-2 px-3">Verifico que los tests pasan, genero resumen final</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Nota como los 4 componentes trabajaron en equipo: <strong class="text-agent-text">Planning</strong> decidio la estrategia inicial y la verificacion final. <strong class="text-agent-text">Tools</strong> ejecutaron las acciones concretas. <strong class="text-agent-text">Memory</strong> retuvo los resultados entre iteraciones. Y el <strong class="text-agent-text">LLM</strong> fue el director de orquesta que razono sobre cada paso. 3 iteraciones del loop, 5 tool calls, un bug arreglado.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Un agente bueno <strong class="text-agent-text">verifica su propio trabajo</strong>. Observa que Claude Code no solo edito el archivo y se fue. Volvio a correr los tests para confirmar que el fix funciona. Este paso de verificacion es lo que separa a un agente confiable de uno que "tira y reza". La autocorreccion requiere el loop completo: actuar, observar resultado, evaluar.</p>
    </div>
  </section>

  <!-- =============================================
       THEORY SECTION 6: Niveles de Autonomia
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">Niveles de Autonomia</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No todos los agentes tienen el mismo grado de independencia. Piensa en los niveles de autonomia como una escala de confianza. Cuanta mas autonomia le das a un sistema, mas confianza necesitas en que va a tomar decisiones correctas.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-border flex items-center justify-center text-sm font-bold text-agent-muted">0</span>
          <div>
            <h3 class="text-agent-text font-bold">Chat basico</h3>
            <p class="text-sm text-agent-muted">Pregunta-respuesta sin herramientas. El humano controla todo.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Ejemplo:</strong> ChatGPT vanilla, Gemini web.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-info/20 flex items-center justify-center text-sm font-bold text-agent-info">1</span>
          <div>
            <h3 class="text-agent-text font-bold">Copilot</h3>
            <p class="text-sm text-agent-muted">Sugiere acciones que el humano aprueba o rechaza.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Ejemplo:</strong> GitHub Copilot inline, Tabnine.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-accent/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-sm font-bold text-agent-accent">2</span>
          <div>
            <h3 class="text-agent-highlight font-bold">Agente con aprobacion (human-in-the-loop)</h3>
            <p class="text-sm text-agent-muted">Ejecuta autonomamente pero pide confirmacion para acciones criticas.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Ejemplo:</strong> Claude Code (modo normal), Cursor Agent Mode, Roo Code.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-warning/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-warning/20 flex items-center justify-center text-sm font-bold text-agent-warning">3</span>
          <div>
            <h3 class="text-agent-text font-bold">Agente autonomo supervisado</h3>
            <p class="text-sm text-agent-muted">Planifica y ejecuta sin intervencion. Reporta al final o cuando se atasca.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Ejemplo:</strong> Devin, Claude Code con <code class="text-agent-highlight bg-agent-darker px-1 rounded">--dangerously-skip-permissions</code>.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-danger/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-danger/20 flex items-center justify-center text-sm font-bold text-agent-danger">4</span>
          <div>
            <h3 class="text-agent-text font-bold">Agente completamente autonomo</h3>
            <p class="text-sm text-agent-muted">Opera continuamente sin supervision humana. Toma decisiones, deploya, y monitorea por si solo.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Ejemplo:</strong> Agentes en CI/CD, background agents experimentales. Todavia raro en 2026.</p>
          </div>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Donde esta Claude Code en esta escala?</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code opera principalmente en <strong class="text-agent-highlight">Nivel 2-3</strong>. En su modo normal (Nivel 2), ejecuta lectura y busqueda de forma autonoma pero pide permiso para acciones que modifican archivos o ejecutan comandos. Si configuras allowlists de permisos o usas el flag <code class="text-agent-highlight bg-agent-darker px-1 rounded">--dangerously-skip-permissions</code>, sube a Nivel 3 donde ejecuta todo sin preguntar.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La recomendacion de Anthropic es clara: <strong class="text-agent-highlight">Nivel 2 es el sweet spot</strong> para la mayoria de equipos de desarrollo. Te da la productividad de un agente autonomo con la seguridad de revision humana en puntos criticos. Solo necesitas subir a Nivel 3 cuando tenes tareas batch bien definidas (CI/CD, code review automatizado) con guardrails robustos.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Nivel</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Confianza</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Riesgo</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Productividad</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">0 - Chat</td>
            <td class="py-3 px-4">Ninguna</td>
            <td class="py-3 px-4 text-agent-success">Cero</td>
            <td class="py-3 px-4 text-agent-danger">Baja</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">1 - Copilot</td>
            <td class="py-3 px-4">Baja</td>
            <td class="py-3 px-4 text-agent-success">Bajo</td>
            <td class="py-3 px-4 text-agent-warning">Media</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent font-bold">2 - Agente + humano</td>
            <td class="py-3 px-4">Media</td>
            <td class="py-3 px-4 text-agent-warning">Medio</td>
            <td class="py-3 px-4 text-agent-success">Alta</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">3 - Autonomo supervisado</td>
            <td class="py-3 px-4">Alta</td>
            <td class="py-3 px-4 text-agent-danger">Alto</td>
            <td class="py-3 px-4 text-agent-success">Muy alta</td>
          </tr>
          <tr>
            <td class="py-3 px-4">4 - Full autonomo</td>
            <td class="py-3 px-4">Maxima</td>
            <td class="py-3 px-4 text-agent-danger">Muy alto</td>
            <td class="py-3 px-4 text-agent-success">Maxima (si funciona)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Creer que "mas autonomo = mejor". Un agente de Nivel 2 que hace el 95% del trabajo y te pide aprobacion en puntos criticos es MAS confiable que un agente de Nivel 4 que hace el 100% solo pero comete un error catastrofico cada 20 tareas. La autonomia es un slider, no un interruptor.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Goldman Sachs fue una de las primeras grandes empresas en desplegar Devin (Nivel 3). Pero incluso ellos lo usan con supervision: un ingeniero senior revisa el output antes de hacer merge. En la practica, incluso los sistemas "autonomos" operan con revision humana en entornos de produccion.</p>
    </div>
  </section>

  <!-- =============================================
       Consolidacion: modelo mental
       ============================================= -->
  <section class="mb-12 fade-in">
    <h2 class="text-2xl font-bold mb-4 text-agent-accent">Construyendo tu Modelo Mental</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de pasar a la practica, consolidemos todo en un modelo mental que puedas usar para evaluar cualquier herramienta de IA.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 3 preguntas que debes hacerte</h3>
    <div class="space-y-3 mb-6">
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">1. Tiene un loop?</p>
        <p class="text-xs text-agent-muted">Si solo hace una cosa y para, no es un agente. Puede tomar multiples acciones en una sola solicitud del usuario?</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">2. Tiene herramientas?</p>
        <p class="text-xs text-agent-muted">Si solo genera texto, no es un agente. Puede ACTUAR en el mundo: leer archivos, ejecutar comandos, llamar APIs?</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">3. Quien controla el flujo?</p>
        <p class="text-xs text-agent-muted">Si el usuario define cada paso, es un workflow. Si el LLM decide dinamicamente que hacer, es un agente.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La formula del agente</h3>
    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-6 text-center">
      <p class="text-lg text-agent-highlight font-bold">Agente = LLM + Tools + Memory + Planning + Loop</p>
      <p class="text-xs text-agent-muted mt-2">Quita cualquier componente y dejas de tener un agente. El loop es el que une todo: permite al LLM usar herramientas, acumular memoria, y ejecutar planes de forma iterativa.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Harrison Chase, creador de LangChain, dice que la definicion mas simple de un agente es: "un sistema donde un LLM decide el flujo de control de una aplicacion". Si el LLM no controla el flujo, no es un agente.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Lo que viene en el curso</h3>
    <ul class="space-y-2 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 2:</strong> Tool Calling en profundidad: como funcionan las herramientas y MCP</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 3:</strong> El ecosistema completo de agentes de codigo en 2026</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 4:</strong> Context Engineering y mejores practicas con Claude Code</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 5:</strong> Construir tu primer agente con Claude Agent SDK</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulos 6-12:</strong> Memoria, frameworks, orquestacion, seguridad, produccion</span>
      </li>
    </ul>
  </section>

  <!-- =============================================
       InteractiveFlow
       ============================================= -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el Agent Loop interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="El Agent Loop: observe-think-act"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- =============================================
       Quiz
       ============================================= -->
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
      <span class="text-4xl block mb-3">&#x1F680;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ya entendes la anatomia de un agente IA y como Claude Code implementa cada componente. Ahora sabes distinguir un chatbot de un agente real y conoces el ciclo fundamental observe-think-act.</p>
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
