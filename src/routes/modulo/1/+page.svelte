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
    const badge = courseStore.unlockBadge('first-step');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
    completed = true;
  }

  // InteractiveFlow data: The Agent Loop (circular)
  const flowNodes = [
    { id: 'input', label: 'Input del Usuario', description: 'El usuario proporciona una tarea, pregunta o instruccion al agente. Este es el punto de entrada del loop. Puede ser "arregla este bug", "crea un endpoint" o cualquier solicitud en lenguaje natural.', icon: '\u{1F4AC}', x: 50, y: 10 },
    { id: 'llm', label: 'Procesamiento LLM', description: 'El cerebro del agente. El LLM analiza el input, el contexto acumulado y los resultados previos para RAZONAR sobre que hacer. Aqui es donde ocurre el "think" del ciclo observe-think-act.', icon: '\u{1F9E0}', x: 88, y: 30 },
    { id: 'planning', label: 'Planificacion', description: 'El LLM decide QUE herramienta usar, con que parametros, y en que orden. Si necesita multiples acciones, planifica la secuencia. Este paso diferencia a un agente de un chatbot simple.', icon: '\u{1F4CB}', x: 88, y: 65 },
    { id: 'tool', label: 'Ejecucion de Tool', description: 'La aplicacion host ejecuta la herramienta seleccionada por el LLM: leer un archivo, ejecutar un comando, buscar en la web, editar codigo. El LLM NO ejecuta directamente, solo solicita.', icon: '\u{1F527}', x: 50, y: 85 },
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

  // Quiz data
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
      question: 'Tu agente tiene acceso a herramientas (tool use) pero NO tiene ningun sistema de memoria. Cual es la limitacion MAS critica?',
      options: [
        { text: 'No puede usar herramientas complejas', correct: false, explanation: 'Las herramientas funcionan independientemente de la memoria. El LLM genera el JSON de la tool call sin necesitar memoria persistente.' },
        { text: 'No puede aprender de iteraciones previas dentro de la misma sesion', correct: true, explanation: 'Sin memoria, cada iteracion del loop pierde el contexto de lo que ya intento. El agente podria repetir las mismas acciones fallidas una y otra vez, o no construir sobre resultados anteriores.' },
        { text: 'No puede entender las instrucciones del usuario', correct: false, explanation: 'El LLM entiende instrucciones por su entrenamiento. La memoria es sobre retener contexto entre iteraciones, no sobre comprension del lenguaje.' },
        { text: 'No puede planificar acciones', correct: false, explanation: 'La planificacion la hace el LLM con su razonamiento. La memoria es sobre RETENER resultados, no sobre la capacidad de planificar.' },
      ],
      source: 'OpenAI - A Practical Guide to Building Agents',
      sourceUrl: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf'
    },
    {
      question: 'Estas revisando codigo generado por un agente. Notas que hizo 12 tool calls cuando solo necesitaba 3. Que componente probablemente esta fallando?',
      options: [
        { text: 'Las herramientas estan mal implementadas y devuelven errores', correct: false, explanation: 'Si las herramientas fallaran, veriamos errores, no tool calls innecesarias. El problema es de PLANIFICACION, no de ejecucion.' },
        { text: 'El LLM es muy lento y necesita mas intentos', correct: false, explanation: 'La velocidad del LLM no causa tool calls extra. Un modelo rapido con mala planificacion haria lo mismo.' },
        { text: 'La planificacion/razonamiento del agente: no esta eligiendo la estrategia optima', correct: true, explanation: 'Cuando un agente hace acciones innecesarias, el problema esta en su razonamiento y planificacion. No esta evaluando correctamente que acciones son necesarias ni en que orden.' },
        { text: 'El usuario dio instrucciones ambiguas', correct: false, explanation: 'Instrucciones ambiguas pueden causar resultados incorrectos, pero no necesariamente 4x mas tool calls. Un agente con buena planificacion pediria clarificacion.' },
      ],
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

  <!-- THEORY SECTION 1: Que NO es un agente -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Que NO es un agente IA</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de entender que ES un agente, necesitas saber que NO lo es. El mercado esta lleno de productos que se autodenominan "agentes" cuando en realidad son chatbots glorificados. Vamos a separar la paja del trigo.
    </p>

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
          <tr>
            <td class="py-3 px-4 text-agent-accent">Ejemplo</td>
            <td class="py-3 px-4">ChatGPT basico</td>
            <td class="py-3 px-4">GitHub Copilot inline</td>
            <td class="py-3 px-4 text-agent-highlight">Claude Code, Cursor Agent</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Clave para recordar:</p>
      <p class="text-sm text-agent-muted">Un chatbot RESPONDE. Un copilot SUGIERE. Un agente ACTUA. La diferencia fundamental es quien tiene el control del flujo de trabajo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: Los 4 Componentes Core -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Los 4 Componentes Core</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Todo agente IA, sin importar el framework o la implementacion, tiene estos cuatro componentes. Piensa en ellos como los organos vitales: si falta uno, el agente no funciona.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F9E0;</span>
          <h3 class="text-agent-text font-bold">LLM (El Cerebro)</h3>
        </div>
        <p class="text-sm text-agent-muted">El modelo de lenguaje es el motor de razonamiento. Recibe instrucciones en lenguaje natural, analiza el contexto, y decide que hacer. Sin LLM, no hay agente: solo tienes un script automatizado.</p>
        <p class="text-xs text-agent-accent mt-2">Analogia: Es el cerebro de Tony Stark, no el traje de Iron Man.</p>
      </div>

      <div class="card border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F527;</span>
          <h3 class="text-agent-text font-bold">Tools (Las Manos)</h3>
        </div>
        <p class="text-sm text-agent-muted">Las herramientas permiten al agente ACTUAR en el mundo: leer archivos, ejecutar comandos, buscar en la web, editar codigo. Un LLM sin tools es un pensador que no puede hacer nada.</p>
        <p class="text-xs text-agent-accent mt-2">Analogia: Son las manos y las herramientas de un cirujano.</p>
      </div>

      <div class="card border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F4BE;</span>
          <h3 class="text-agent-text font-bold">Memory (El Contexto)</h3>
        </div>
        <p class="text-sm text-agent-muted">La memoria permite al agente retener informacion entre iteraciones. Sin memoria, cada paso del loop empieza desde cero. Incluye el historial de conversacion, resultados previos, y conocimiento del proyecto.</p>
        <p class="text-xs text-agent-accent mt-2">Analogia: Es la libreta de notas de un detective.</p>
      </div>

      <div class="card border-l-4 border-l-agent-info">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F4CB;</span>
          <h3 class="text-agent-text font-bold">Planning (La Estrategia)</h3>
        </div>
        <p class="text-sm text-agent-muted">La capacidad de descomponer una tarea compleja en pasos, decidir el orden de ejecucion, y adaptar el plan cuando algo falla. Diferencia a un agente inteligente de uno que ejecuta a ciegas.</p>
        <p class="text-xs text-agent-accent mt-2">Analogia: Es el plan de batalla de un general.</p>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 3: El Agent Loop -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Agent Loop: observe-think-act</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El corazon de todo agente es un ciclo que se repite: observar el estado actual, razonar sobre que hacer, ejecutar una accion, y observar el resultado. Este patron se llama <strong class="text-agent-highlight">Agent Loop</strong> y es lo que convierte un simple LLM en un agente.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">Ejemplo practico: Como trabaja Claude Code</p>
      <ol class="space-y-2 text-sm text-agent-muted">
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">1.</span> <strong class="text-agent-text">Observe:</strong> El usuario pide "arregla el test que esta fallando"</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">2.</span> <strong class="text-agent-text">Think:</strong> Claude Code razona: "Primero necesito ver que test falla, despues leer el codigo"</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">3.</span> <strong class="text-agent-text">Act:</strong> Ejecuta <code class="text-agent-highlight bg-agent-darker px-1 rounded">npm test</code> para ver los errores</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">4.</span> <strong class="text-agent-text">Observe:</strong> Ve que <code class="text-agent-highlight bg-agent-darker px-1 rounded">user.test.ts</code> falla en la linea 42</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">5.</span> <strong class="text-agent-text">Think:</strong> "Necesito leer ese archivo para entender el error"</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">6.</span> <strong class="text-agent-text">Act:</strong> Lee el archivo, identifica el bug, edita el codigo</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">7.</span> <strong class="text-agent-text">Observe:</strong> Vuelve a correr los tests para verificar</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">8.</span> <strong class="text-agent-text">Resultado:</strong> Tests pasan, responde al usuario con lo que hizo</li>
      </ol>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Nota que este ciclo se repitio <strong class="text-agent-text">varias veces</strong> antes de completar la tarea. Cada iteracion del loop agrega informacion al contexto del agente. Esto es lo que los papers academicos llaman el patron <strong class="text-agent-highlight">ReAct</strong> (Reasoning + Acting).
    </p>
  </section>

  <!-- THEORY SECTION 4: Niveles de Autonomia -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Niveles de Autonomia</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      No todos los agentes tienen el mismo grado de independencia. Anthropic clasifica los sistemas IA en niveles de autonomia, desde el chat basico hasta agentes completamente independientes. Entender estos niveles te ayuda a elegir la herramienta correcta para cada situacion.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-border flex items-center justify-center text-sm font-bold text-agent-muted">0</span>
          <div>
            <h3 class="text-agent-text font-bold">Chat basico</h3>
            <p class="text-sm text-agent-muted">Pregunta-respuesta sin herramientas. El humano controla todo. Ejemplo: ChatGPT vanilla.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-info/20 flex items-center justify-center text-sm font-bold text-agent-info">1</span>
          <div>
            <h3 class="text-agent-text font-bold">Copilot</h3>
            <p class="text-sm text-agent-muted">Sugiere acciones que el humano aprueba o rechaza. Ejemplo: GitHub Copilot inline, sugerencias de Cursor.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-accent/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-sm font-bold text-agent-accent">2</span>
          <div>
            <h3 class="text-agent-highlight font-bold">Agente con aprobacion</h3>
            <p class="text-sm text-agent-muted">Ejecuta acciones autonomamente pero pide confirmacion para acciones criticas. Ejemplo: Claude Code en modo normal.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-warning/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-warning/20 flex items-center justify-center text-sm font-bold text-agent-warning">3</span>
          <div>
            <h3 class="text-agent-text font-bold">Agente autonomo</h3>
            <p class="text-sm text-agent-muted">Planifica y ejecuta sin intervencion. Solo reporta al final. Ejemplo: Devin, Claude Code en modo --dangerously-skip-permissions.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Importante:</p>
      <p class="text-sm text-agent-muted">Mas autonomia NO significa mejor. Un agente de nivel 3 sin guardrails es como dar las llaves del auto a alguien sin licencia. La autonomia debe ser proporcional a la confianza en el sistema y la gravedad de las acciones.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
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

  <!-- Quiz -->
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
      <p class="text-agent-muted">Ya entiendes la anatomia de un agente IA. Ahora sabes distinguir un chatbot de un agente real y conoces el ciclo fundamental observe-think-act.</p>
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
