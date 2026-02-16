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

    <p class="text-agent-muted leading-relaxed mb-4">
      Esta distincion no es academica: tiene consecuencias practicas directas. Si tratas a un chatbot como si fuera un agente, vas a disenar tu sistema mal. Vas a esperar que tome decisiones, que ejecute acciones, que se autocorrija, y nada de eso va a pasar. Vas a culpar a la herramienta cuando el problema es que la estas usando para algo que no fue disenada.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Por otro lado, si tratas a un agente como si fuera un chatbot, vas a subutilizarlo enormemente. Le vas a dar instrucciones paso a paso cuando el es perfectamente capaz de planificar la secuencia el mismo. Seria como contratar a un ingeniero senior y dictarle cada linea de codigo: un desperdicio monumental de capacidad.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">GitHub Copilot es el ejemplo perfecto de esta evolucion. Lanzo como un <strong class="text-agent-text">autocompletado</strong> en 2022 (Nivel 0.5). En 2023 agrego el <strong class="text-agent-text">chat panel</strong> (Nivel 1). En 2025 lanzo <strong class="text-agent-text">Copilot Agent Mode</strong> que puede ejecutar comandos de terminal, editar multiples archivos, y corregir errores de build por si mismo (Nivel 2). Un mismo producto subio 3 niveles de autonomia en 3 anos. El nombre no cambio, pero la NATURALEZA del sistema es completamente diferente.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La clasificacion de Anthropic</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Anthropic publico en diciembre 2024 su paper <em class="text-agent-highlight">"Building Effective Agents"</em>, donde establece una clasificacion formal. Segun Anthropic, la mayoria de lo que la industria llama "agentes" son en realidad <strong class="text-agent-highlight">workflows</strong>: secuencias predefinidas de pasos con LLMs. Un agente REAL es un sistema donde el LLM controla dinamicamente su propio flujo de trabajo, decidiendo que herramientas usar, en que orden, y cuando parar. La diferencia es sutil pero fundamental: en un workflow, tu defines los pasos. En un agente, el LLM define los pasos.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Anthropic recomienda empezar con workflows simples y escalar a agentes solo cuando la complejidad lo justifique. Textualmente dicen: "The most successful implementations we've seen don't use complex frameworks or specialized libraries. Instead, they use simple, composable patterns." La sofisticacion no siempre es la respuesta.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La evolucion historica: de chatbot a agente</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para entender donde estamos, necesitas saber de donde venimos. En <strong class="text-agent-text">2022</strong>, todo era "chatbot". ChatGPT lanzo en noviembre y el mundo conocio los LLMs. En <strong class="text-agent-text">2023</strong>, aparecieron los "copilots": ChatGPT Plugins, GitHub Copilot Chat, y las primeras integraciones de IA en IDEs. La gente empezo a decir "esto no es solo un chat, me ayuda a HACER cosas". En <strong class="text-agent-text">2024</strong>, llego la explosion: Devin, Claude Code, Cursor Agent Mode, y docenas de herramientas que podian ejecutar codigo, leer archivos, y tomar decisiones. La palabra "agente" se volvio la buzzword del ano. Y en <strong class="text-agent-text">2025-2026</strong>, llegamos a la madurez: sistemas multi-agente, orquestacion, y despliegues en produccion real.
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
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Flujo de control</td>
            <td class="py-3 px-4">Humano 100%</td>
            <td class="py-3 px-4">Humano aprueba</td>
            <td class="py-3 px-4 text-agent-highlight">LLM dirige el loop</td>
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

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Clave para recordar:</p>
      <p class="text-sm text-agent-muted">Un chatbot RESPONDE. Un copilot SUGIERE. Un agente ACTUA. La diferencia fundamental es quien tiene el control del flujo de trabajo. Y ojo: un agente puede DECIDIR no actuar. Puede decidir pedir clarificacion. La clave es que el que decide es el LLM, no una secuencia predefinida.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: Los 4 Componentes Core -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Los 4 Componentes Core</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Todo agente IA, sin importar el framework o la implementacion, tiene estos cuatro componentes. Piensa en ellos como los organos vitales: si falta uno, el agente no funciona. Lo interesante es que estos mismos cuatro componentes aparecen tanto en Claude Code como en Devin, tanto en un agente sencillo de 50 lineas como en un sistema multi-agente empresarial.
    </p>
    <p class="text-agent-muted leading-relaxed mb-6">
      Vamos a desmenuzar cada componente en profundidad, porque entenderlos es la base de TODO lo que viene despues en este curso.
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

    <!-- Deep dive: LLM -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: El LLM como motor de razonamiento</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El LLM no es una base de datos con respuestas pregrabadas. Es un modelo estadistico que predice el siguiente token mas probable dada una secuencia de entrada. Cuando le dices "arregla el bug en auth.py", internamente procesa esa instruccion como una secuencia de <strong class="text-agent-highlight">tokens</strong> (fragmentos de palabras), la mezcla con el contexto (system prompt, historial, tool results), y genera una respuesta token por token.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Tres conceptos tecnicos que necesitas entender sobre el LLM dentro de un agente:
    </p>
    <ul class="space-y-3 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Context window:</strong> Es la "memoria de trabajo" del modelo. Todo lo que el agente sabe en un momento dado debe caber en esta ventana. Claude Opus 4.6 tiene 200K tokens (~150K palabras). Suena mucho, pero un codebase mediano puede llenarlo rapido. La gestion del contexto es critica.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Temperature:</strong> Controla la "creatividad" de las respuestas. Para agentes de codigo, se usa temperature baja (0.0 a 0.3) porque quieres respuestas predecibles y correctas, no creativas. Para un agente de brainstorming, podrias subir a 0.7+.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Extended thinking:</strong> Modelos como Claude pueden "pensar" internamente antes de responder, descomponiendo problemas complejos en pasos de razonamiento. Esto es fundamental para agentes: les permite planificar ANTES de actuar, no solo reaccionar.</span>
      </li>
    </ul>

    <!-- Deep dive: Tools -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Tools como interfaz con el mundo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas funcionan mediante un mecanismo llamado <strong class="text-agent-highlight">function calling</strong> (lo veremos en detalle en el Modulo 2). En resumen: le envias al LLM una lista de herramientas disponibles descritas en JSON Schema. Cuando el modelo decide que necesita usar una, genera un objeto JSON con el nombre de la herramienta y los argumentos. Tu aplicacion recibe ese JSON, ejecuta la funcion real, y devuelve el resultado al LLM.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Es importante entender que el LLM <strong class="text-agent-highlight">NUNCA ejecuta las herramientas directamente</strong>. Solo genera la solicitud. La aplicacion host (Claude Code, Cursor, etc.) es quien realmente lee archivos, ejecuta comandos, y hace llamadas de red. Esta separacion es fundamental para la seguridad: permite validar, filtrar, y controlar lo que el agente hace.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Claude Code tiene mas de 10 herramientas internas: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, entre otras. Cada una esta optimizada para un tipo especifico de operacion. La clave no es tener muchas herramientas, sino tener las herramientas CORRECTAS con descripciones claras. Anthropic recomienda mantener el numero por debajo de 20 para evitar confundir al modelo.</p>
    </div>

    <!-- Deep dive: Memory -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Memoria de corto y largo plazo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La memoria de un agente opera en dos niveles distintos, como el cerebro humano:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Memoria de corto plazo (Session)</h4>
        <p class="text-xs text-agent-muted">Es el context window del LLM. Incluye el system prompt, las instrucciones del usuario, los resultados de herramientas previas, y todo lo que ha pasado en la sesion actual. Es volatil: cuando cierras la sesion, desaparece. Es la "mesa de trabajo" del agente.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-warning font-bold text-sm mb-2">Memoria de largo plazo (Persistente)</h4>
        <p class="text-xs text-agent-muted">Informacion que sobrevive entre sesiones. En Claude Code, esto incluye CLAUDE.md (instrucciones del proyecto), agent memory (aprendizajes persistentes), y el codebase mismo. Devin usa una "knowledge base" interna. Es el "archivo" del agente.</p>
      </div>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      El mayor desafio de la memoria es la <strong class="text-agent-highlight">gestion del contexto</strong>. A medida que el agente trabaja, el context window se llena con resultados de herramientas, codigo leido, y razonamiento previo. Cuando se llena, el agente debe decidir que olvidar. Los agentes modernos usan tecnicas de "summarization" para comprimir la historia y mantener lo relevante.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Pensar que el agente "recuerda todo". El context window tiene un limite FIJO. Si le pides que analice 50 archivos, los primeros archivos leidos pueden ser "olvidados" cuando el contexto se llena. Por eso los agentes inteligentes son selectivos: no leen TODO, solo lo que necesitan. Claude Code usa Glob y Grep para encontrar archivos relevantes en vez de leer el codebase entero.</p>
    </div>

    <!-- Deep dive: Planning -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Profundizando: Planning y Chain-of-Thought</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La planificacion es lo que separa a un agente inteligente de uno que dispara herramientas a ciegas. El mecanismo principal se llama <strong class="text-agent-highlight">Chain-of-Thought (CoT)</strong>: el modelo "piensa en voz alta" antes de actuar, descomponiendo la tarea en pasos logicos.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando le pides a Claude Code "refactoriza esta funcion para usar async/await", internamente razona algo como: "Primero necesito leer la funcion actual para entender su estructura. Luego identificar las operaciones bloqueantes. Despues convertirlas a async. Finalmente, verificar que los callers de esta funcion tambien soporten async." Esa descomposicion NO esta programada: emerge del razonamiento del LLM.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La planificacion tambien incluye <strong class="text-agent-highlight">adaptacion</strong>: si el agente ejecuta un paso y el resultado no es el esperado, re-planifica. Si los tests fallan despues de un cambio, el agente no repite el mismo cambio. Analiza el error, ajusta su plan, y prueba una estrategia diferente. Esta capacidad de adaptacion es lo que hace que los agentes sean fundamentalmente diferentes de los scripts automatizados.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Los 4 componentes no funcionan en aislamiento: forman un sistema integrado. El LLM usa la memoria para entender el contexto, las tools para actuar, y el planning para decidir QUE herramienta usar y CUANDO. Si falla la planificacion, el agente ejecuta herramientas innecesarias. Si falla la memoria, el agente repite acciones. Si fallan las tools, el agente no puede actuar. Y si falla el LLM, todo el sistema colapsa.</p>
    </div>

    <!-- What happens when one fails -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Que pasa cuando un componente falla?</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Componente que falla</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Sintoma observable</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Ejemplo real</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">LLM</td>
            <td class="py-3 px-4">Respuestas incoherentes, tool calls con parametros incorrectos</td>
            <td class="py-3 px-4">Usar un modelo demasiado pequeno para tareas complejas de refactoring</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Tools</td>
            <td class="py-3 px-4">El agente "piensa" correctamente pero no puede actuar</td>
            <td class="py-3 px-4">El agente sabe que necesita leer un archivo pero la herramienta falla por permisos</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-accent">Memory</td>
            <td class="py-3 px-4">Repite acciones, olvida lo que ya hizo, loops infinitos</td>
            <td class="py-3 px-4">Lee el mismo archivo 5 veces porque el contexto se lleno y "olvido" que ya lo leyo</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-accent">Planning</td>
            <td class="py-3 px-4">Ejecuta herramientas innecesarias, no sigue un orden logico</td>
            <td class="py-3 px-4">Intenta correr tests antes de escribir el codigo, o edita sin leer primero</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como trabajan juntos: el flujo completo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para que veas como los 4 componentes se integran, sigamos una tarea real paso a paso. El usuario pide: "Agrega validacion al formulario de login".
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <ol class="space-y-3 text-sm text-agent-muted">
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">1.</span>
          <span><strong class="text-agent-text">Planning:</strong> El LLM descompone la tarea: "Primero necesito encontrar el formulario de login, luego entender su estructura actual, luego agregar la validacion, luego verificar que funciona."</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">2.</span>
          <span><strong class="text-agent-text">Tools:</strong> Ejecuta <code class="text-agent-highlight bg-agent-darker px-1 rounded">grep("login", "*.tsx")</code> para encontrar el archivo. Luego <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file("src/components/LoginForm.tsx")</code>.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">3.</span>
          <span><strong class="text-agent-text">Memory:</strong> El resultado (contenido del archivo) se agrega al contexto. El LLM ahora "recuerda" la estructura del formulario para el siguiente paso.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">4.</span>
          <span><strong class="text-agent-text">LLM:</strong> Con el contexto actualizado, razona sobre QUE validacion agregar y COMO hacerlo (ej: usar zod, validacion nativa HTML5, o custom).</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">5.</span>
          <span><strong class="text-agent-text">Tools:</strong> Ejecuta <code class="text-agent-highlight bg-agent-darker px-1 rounded">edit_file</code> para agregar el codigo de validacion.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">6.</span>
          <span><strong class="text-agent-text">Planning + Memory:</strong> Recuerda que el plan incluia verificar, asi que ejecuta los tests existentes para confirmar que nada se rompio.</span>
        </li>
      </ol>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Anthropic realizo un estudio interno sobre como los desarrolladores mas productivos usan Claude Code. Descubrieron que los mejores resultados se obtienen cuando el usuario proporciona <strong class="text-agent-text">contexto claro</strong> (que, no como) y deja que el agente use sus 4 componentes naturalmente. Los usuarios que dan instrucciones paso a paso micromanaging al agente obtienen peores resultados que los que confian en su planificacion.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: El Agent Loop -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Agent Loop: observe-think-act</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El corazon de todo agente es un ciclo que se repite: observar el estado actual, razonar sobre que hacer, ejecutar una accion, y observar el resultado. Este patron se llama <strong class="text-agent-highlight">Agent Loop</strong> y es lo que convierte un simple LLM en un agente.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La magia del agent loop es que es <strong class="text-agent-highlight">indeterminado</strong>: nadie sabe de antemano cuantas iteraciones necesitara. Un bug simple puede resolverse en 3 iteraciones (leer, editar, verificar). Un refactoring complejo puede necesitar 30+ iteraciones. El agente decide cuando parar basandose en si la tarea esta completa, no en un numero predefinido de pasos.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">Ejemplo practico: Como trabaja Claude Code</p>
      <p class="text-xs text-agent-muted mb-3">El usuario escribe: "arregla el test que esta fallando en el modulo de autenticacion"</p>
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
      Nota que este ciclo se repitio <strong class="text-agent-text">varias veces</strong> antes de completar la tarea. Cada iteracion del loop agrega informacion al contexto del agente. Esto es lo que los papers academicos llaman el patron <strong class="text-agent-highlight">ReAct</strong> (Reasoning + Acting), publicado por Yao et al. en Princeton en 2022.
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

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Observa el <code class="text-agent-highlight bg-agent-darker px-1 rounded">while True</code>: el loop es potencialmente infinito. La unica forma de salir es que el LLM decida NO hacer mas tool calls y generar una respuesta de texto. Si el agente tiene mala planificacion, puede quedarse en un loop infinito haciendo las mismas acciones una y otra vez. Por eso los sistemas de produccion siempre tienen un <strong class="text-agent-text">max_iterations</strong> como safety net.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Condiciones de parada: Como sabe el agente cuando terminar?</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un agente puede parar por varias razones:
    </p>
    <ul class="space-y-2 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-success shrink-0 mt-0.5">&#x2714;</span>
        <span><strong class="text-agent-text">Tarea completada:</strong> El agente verifica que la accion fue exitosa (tests pasan, archivo creado, etc.) y genera una respuesta de resumen.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-warning shrink-0 mt-0.5">&#x26A0;</span>
        <span><strong class="text-agent-text">Necesita input humano:</strong> El agente llega a un punto donde necesita una decision del usuario (ej: "hay 3 formas de resolver esto, cual prefieres?").</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-danger shrink-0 mt-0.5">&#x2718;</span>
        <span><strong class="text-agent-text">Limite alcanzado:</strong> Se alcanzo el maximo de iteraciones o el context window esta lleno. El agente se ve forzado a parar aunque no haya terminado.</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-danger shrink-0 mt-0.5">&#x2718;</span>
        <span><strong class="text-agent-text">Error irrecuperable:</strong> La herramienta falla repetidamente y el agente determina que no puede continuar.</span>
      </li>
    </ul>

    <h3 class="text-lg font-bold text-agent-text mb-3">Chatbot vs Agente: la diferencia en accion</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para que la diferencia quede cristalina, veamos la misma tarea procesada por ambos sistemas:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-muted font-bold text-sm mb-2">Chatbot (1 turno)</h4>
        <p class="text-xs text-agent-muted mb-2">Usuario: "arregla el test que falla"</p>
        <p class="text-xs text-agent-muted">Bot: "Para arreglar un test que falla, primero deberias identificar el error leyendo el output. Luego revisa el archivo del test y compara con la implementacion. Haz los cambios necesarios y corre los tests de nuevo."</p>
        <p class="text-xs text-agent-danger mt-2">Resultado: Te dio una RECETA, no arreglo nada.</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Agente (15 tool calls)</h4>
        <p class="text-xs text-agent-muted mb-2">Usuario: "arregla el test que falla"</p>
        <p class="text-xs text-agent-muted">Agente: Ejecuto npm test, lei user.test.ts, identifique que el mock no coincidia con la nueva interfaz, edite el mock, volvi a correr los tests, confirmado que pasan.</p>
        <p class="text-xs text-agent-success mt-2">Resultado: El bug esta ARREGLADO. Los tests pasan.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En las evaluaciones internas de Anthropic, Claude Code resuelve el 72.7% de los issues en SWE-bench Verified, un benchmark que mide la capacidad de resolver issues reales de GitHub. Cada resolucion requiere un promedio de 10-30 iteraciones del agent loop: leer codigo, entender el contexto, hacer cambios, correr tests, ajustar. Un chatbot simplemente no puede hacer esto porque no tiene loop.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El paper original de ReAct (Yao et al., 2022) demostro que combinar razonamiento y accion mejora drasticamente el rendimiento comparado con solo razonar (Chain-of-Thought) o solo actuar (herramientas sin razonamiento). El "sweet spot" es el ciclo completo: razonar sobre que hacer, actuar, observar el resultado, razonar de nuevo. Quita cualquiera de estas fases y el rendimiento cae.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Niveles de Autonomia -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Niveles de Autonomia</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No todos los agentes tienen el mismo grado de independencia. Anthropic clasifica los sistemas IA en niveles de autonomia, desde el chat basico hasta agentes completamente independientes. Entender estos niveles te ayuda a elegir la herramienta correcta para cada situacion.
    </p>
    <p class="text-agent-muted leading-relaxed mb-6">
      Piensa en los niveles de autonomia como una escala de confianza. Cuanta mas autonomia le das a un sistema, mas confianza necesitas en que va a tomar decisiones correctas. Un chatbot no necesita confianza porque no hace nada por si solo. Un agente autonomo necesita confianza total porque toma decisiones sin consultarte.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-border flex items-center justify-center text-sm font-bold text-agent-muted">0</span>
          <div>
            <h3 class="text-agent-text font-bold">Chat basico</h3>
            <p class="text-sm text-agent-muted">Pregunta-respuesta sin herramientas. El humano controla todo.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Productos:</strong> ChatGPT vanilla, Gemini web, Perplexity (sin acciones).</p>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Analogia:</strong> Pedirle consejo a un amigo por chat. Te da ideas pero tu haces TODO el trabajo.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-info/20 flex items-center justify-center text-sm font-bold text-agent-info">1</span>
          <div>
            <h3 class="text-agent-text font-bold">Copilot</h3>
            <p class="text-sm text-agent-muted">Sugiere acciones que el humano aprueba o rechaza. El flujo lo controla el humano.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Productos:</strong> GitHub Copilot inline, Tabnine, sugerencias de autocompletado de Cursor.</p>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Analogia:</strong> Un copiloto de avion que sugiere la ruta pero el piloto decide. Si sugiere algo raro, lo ignoras.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-accent/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-sm font-bold text-agent-accent">2</span>
          <div>
            <h3 class="text-agent-highlight font-bold">Agente con aprobacion (human-in-the-loop)</h3>
            <p class="text-sm text-agent-muted">Ejecuta acciones autonomamente pero pide confirmacion para acciones criticas. El balance ideal para la mayoria de casos.</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Productos:</strong> Claude Code (modo normal), Cursor Agent Mode, Roo Code, Cline.</p>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Analogia:</strong> Un asistente ejecutivo que organiza tu agenda, pero te pide aprobacion antes de cancelar una reunion importante. Confia para lo rutinario, consulta para lo critico.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-warning/30">
        <div class="flex items-center gap-3">
          <span class="text-2xl w-10 h-10 rounded-full bg-agent-warning/20 flex items-center justify-center text-sm font-bold text-agent-warning">3</span>
          <div>
            <h3 class="text-agent-text font-bold">Agente autonomo</h3>
            <p class="text-sm text-agent-muted">Planifica y ejecuta sin intervencion humana. Solo reporta al final (o cuando esta atascado).</p>
            <p class="text-xs text-agent-muted mt-1"><strong class="text-agent-text">Productos:</strong> Devin, OpenHands, Claude Code con <code class="text-agent-highlight bg-agent-darker px-1 rounded">--dangerously-skip-permissions</code>.</p>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Analogia:</strong> Contratar a un freelancer remoto. Le das la tarea y esperas el resultado. Si hace algo mal, no te enteras hasta que lo ves.</p>
          </div>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El espectro de confianza</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Mas autonomia significa mas riesgo. Pero tambien significa mas productividad cuando funciona bien. La clave esta en calibrar el nivel de autonomia segun dos factores: la <strong class="text-agent-highlight">gravedad de las acciones</strong> (borrar un archivo de produccion vs leer un archivo) y la <strong class="text-agent-highlight">madurez del sistema</strong> (cuanto confias en sus decisiones).
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Nivel</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Confianza requerida</th>
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
            <td class="py-3 px-4">2 - Agente + humano</td>
            <td class="py-3 px-4">Media</td>
            <td class="py-3 px-4 text-agent-warning">Medio</td>
            <td class="py-3 px-4 text-agent-success">Alta</td>
          </tr>
          <tr>
            <td class="py-3 px-4">3 - Autonomo</td>
            <td class="py-3 px-4">Alta</td>
            <td class="py-3 px-4 text-agent-danger">Alto</td>
            <td class="py-3 px-4 text-agent-success">Muy alta (si funciona)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Goldman Sachs fue una de las primeras grandes empresas en desplegar Devin (Nivel 3) para tareas de ingenieria internas. Pero incluso ellos lo usan con supervision: un ingeniero senior revisa el output antes de hacer merge. En la practica, incluso los sistemas "autonomos" operan con revision humana en entornos de produccion. El consenso del 2026 es claro: <strong class="text-agent-text">Nivel 2 (agente con aprobacion) es el sweet spot</strong> para la mayoria de equipos de desarrollo.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Creer que "mas autonomo = mejor desarrollador IA". Un agente de Nivel 2 que hace el 95% del trabajo y te pide aprobacion en puntos criticos es MAS confiable que un agente de Nivel 3 que hace el 100% solo pero comete un error catastrofico en produccion cada 20 tareas. La autonomia es un slider, no un interruptor, y la posicion correcta depende de tu contexto.</p>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Importante:</p>
      <p class="text-sm text-agent-muted">Mas autonomia NO significa mejor. Un agente de nivel 3 sin guardrails es como dar las llaves del auto a alguien sin licencia. La autonomia debe ser proporcional a la confianza en el sistema y la gravedad de las acciones. Veremos guardrails y seguridad en profundidad en el Modulo 9.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: La Historia de los Agentes -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">La Historia de los Agentes IA</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para entender a donde vamos, necesitas saber de donde venimos. La historia de los agentes de codigo es corta pero increiblemente densa. En apenas 4 anos pasamos de "la IA puede completar una linea de codigo" a "la IA puede resolver issues reales de GitHub de principio a fin".
    </p>

    <div class="space-y-4 mb-6">
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 text-right">
          <span class="text-sm font-bold text-agent-accent">2022</span>
        </div>
        <div class="border-l-2 border-agent-accent/30 pl-4 pb-4">
          <h4 class="text-agent-text font-bold text-sm">Los fundamentos academicos</h4>
          <p class="text-xs text-agent-muted">Yao et al. publican el paper <strong class="text-agent-text">ReAct</strong> en Princeton, estableciendo el patron observe-think-act que usan todos los agentes modernos. GitHub Copilot ya existia como autocompletado inline. ChatGPT lanza en noviembre y el mundo descubre los LLMs. Pero todavia nadie habla de "agentes" en el contexto de codigo.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 text-right">
          <span class="text-sm font-bold text-agent-info">2023</span>
        </div>
        <div class="border-l-2 border-agent-info/30 pl-4 pb-4">
          <h4 class="text-agent-text font-bold text-sm">La era de los plugins y los primeros agentes</h4>
          <p class="text-xs text-agent-muted">ChatGPT Plugins lanzan en marzo: el primer intento masivo de darle "manos" a un LLM. AutoGPT se viraliza en GitHub como "el primer agente autonomo" (spoiler: era mas demo que producto). GitHub Copilot agrega chat. OpenAI lanza function calling en junio, la base tecnica de todo tool calling moderno. GPT-4 demuestra capacidades de razonamiento que hacen viable el agent loop.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 text-right">
          <span class="text-sm font-bold text-agent-warning">2024</span>
        </div>
        <div class="border-l-2 border-agent-warning/30 pl-4 pb-4">
          <h4 class="text-agent-text font-bold text-sm">La explosion de los agentes de codigo</h4>
          <p class="text-xs text-agent-muted"><strong class="text-agent-text">Devin</strong> se presenta como "el primer software engineer IA" en marzo y genera un terremoto mediatico. <strong class="text-agent-text">Claude Code</strong> lanza con Claude 3.5 Sonnet. <strong class="text-agent-text">Cursor</strong> lanza el Agent Mode. <strong class="text-agent-text">Cline</strong> supera 1M de installs en VS Code. <strong class="text-agent-text">Aider</strong> se consolida como la opcion open source. Anthropic publica "Building Effective Agents" en diciembre. SWE-bench se convierte en EL benchmark. La palabra "agente" es la buzzword del ano.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 text-right">
          <span class="text-sm font-bold text-agent-success">2025</span>
        </div>
        <div class="border-l-2 border-agent-success/30 pl-4 pb-4">
          <h4 class="text-agent-text font-bold text-sm">Madurez y produccion</h4>
          <p class="text-xs text-agent-muted"><strong class="text-agent-text">Claude Code</strong> lanza Agent Teams y MCP integrado. <strong class="text-agent-text">OpenCode</strong> explota a 100K+ estrellas con Go-based TUI. <strong class="text-agent-text">Roo Code</strong> se separa de Cline con custom modes. Anthropic lanza <strong class="text-agent-text">Claude Opus 4</strong> optimizado para agentes. Los frameworks multi-agente (CrewAI, LangGraph, Strands) se consolidan. Las empresas empiezan a desplegar agentes en produccion real.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 text-right">
          <span class="text-sm font-bold text-agent-highlight">2026</span>
        </div>
        <div class="border-l-2 border-agent-highlight/30 pl-4">
          <h4 class="text-agent-text font-bold text-sm">La era actual: agentes en todas partes</h4>
          <p class="text-xs text-agent-muted">Estamos aqui. Claude Opus 4.6 domina benchmarks de codigo. MCP se convierte en estandar de facto para herramientas. Multi-agente pasa de experimental a produccion. Los equipos de desarrollo integran agentes en sus workflows diarios. La pregunta ya no es "deberia usar un agente?" sino "como uso agentes de forma efectiva?".</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">AutoGPT, que en abril 2023 fue el repositorio de GitHub con mas rapido crecimiento de la historia (100K estrellas en semanas), era mas un prototipo viral que un producto funcional. Prometia "agentes autonomos generales" pero en la practica entraba en loops infinitos y gastaba cientos de dolares en tokens sin lograr casi nada. Sin embargo, inspiro a toda una generacion de herramientas que SI funcionan. A veces el demo imperfecto es el que abre el camino.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Estamos en el INICIO de esta revolucion. Los agentes de 2026 son a los agentes del futuro lo que los primeros smartphones eran al iPhone 15. La tecnologia fundamental (LLMs + tools + loops) ya existe y funciona. Lo que viene es optimizacion, especializacion, y adopcion masiva. Aprender esto ahora es como haber aprendido desarrollo web en 2005: no es demasiado temprano, es el momento justo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 6: Repaso y modelo mental -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Construyendo tu Modelo Mental</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de pasar a la practica, vamos a consolidar todo lo que aprendiste en un modelo mental que puedas usar para evaluar cualquier herramienta de IA que encuentres en el futuro.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 3 preguntas que debes hacerte</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando alguien te presenta una nueva herramienta de IA y dice "esto es un agente", hazte estas tres preguntas:
    </p>
    <div class="space-y-3 mb-6">
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">1. Tiene un loop?</p>
        <p class="text-xs text-agent-muted">Si solo hace una cosa y para, no es un agente. Un agente NECESITA un ciclo observe-think-act que se repita hasta completar la tarea. Pregunta: puede tomar multiples acciones en una sola solicitud del usuario?</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">2. Tiene herramientas?</p>
        <p class="text-xs text-agent-muted">Si solo genera texto, no es un agente. Un agente necesita ACTUAR en el mundo: leer archivos, ejecutar comandos, llamar APIs. Sin herramientas, es un chatbot con buenas intenciones.</p>
      </div>
      <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
        <p class="text-sm text-agent-accent font-bold mb-1">3. Quien controla el flujo?</p>
        <p class="text-xs text-agent-muted">Si el usuario define cada paso, es un workflow. Si el LLM decide dinamicamente que hacer en cada iteracion, es un agente. La clave es: el LLM tiene control del flujo de ejecucion?</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">La formula del agente</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si tuvieras que resumir todo este modulo en una formula, seria:
    </p>
    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-4 text-center">
      <p class="text-lg text-agent-highlight font-bold">Agente = LLM + Tools + Memory + Planning + Loop</p>
      <p class="text-xs text-agent-muted mt-2">Quita cualquier componente y dejas de tener un agente. El loop es el que une todo: es el ciclo que permite al LLM usar herramientas, acumular memoria, y ejecutar planes de forma iterativa.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Harrison Chase, creador de LangChain, dice que la definicion mas simple de un agente es: "un sistema donde un LLM decide el flujo de control de una aplicacion". Todo lo demas (herramientas, memoria, planificacion) son implementaciones de esa idea central. Si el LLM no controla el flujo, no es un agente.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Lo que viene en el curso</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ahora que entiendes la anatomia fundamental, los proximos modulos van a profundizar en cada pieza:
    </p>
    <ul class="space-y-2 mb-4">
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 2:</strong> Tool Calling en profundidad: como funcionan las herramientas a nivel tecnico</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 3:</strong> El ecosistema completo de agentes de codigo en 2026</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 4:</strong> MCP y el protocolo que estandariza todo</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulo 5:</strong> Construir tu primer agente desde cero</span>
      </li>
      <li class="flex items-start gap-2 text-sm text-agent-muted">
        <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
        <span><strong class="text-agent-text">Modulos 6-12:</strong> Memoria, frameworks, orquestacion, seguridad, produccion</span>
      </li>
    </ul>
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
