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

  const MODULE_ID = 2;
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
    const badge = courseStore.unlockBadge('tool-caller');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
    completed = true;
  }

  // InteractiveFlow: Tool Call Flow
  const flowNodes = [
    { id: 'input', label: 'Input del Usuario', description: 'El usuario envia un prompt al agente. Puede ser una pregunta, una tarea, o una instruccion compleja. El prompt viaja al LLM junto con las tool definitions disponibles y el historial de conversacion.', icon: '\u{1F4AC}', x: 8, y: 25 },
    { id: 'reasoning', label: 'Razonamiento del LLM', description: 'El LLM analiza el prompt, las tool definitions, y el contexto disponible. Razona sobre que herramienta(s) necesita, con que parametros, y en que orden. En Claude, este razonamiento puede ser visible como texto antes de la tool call.', icon: '\u{1F9E0}', x: 28, y: 15 },
    { id: 'selection', label: 'Seleccion de Tool', description: 'El LLM elige la herramienta mas apropiada comparando las descriptions de cada tool definition con la tarea actual. Si ninguna herramienta aplica, responde directamente con texto. Si multiples son independientes, emite parallel calls.', icon: '\u{1F3AF}', x: 28, y: 50 },
    { id: 'json', label: 'Tool Call JSON', description: 'El LLM genera un objeto JSON estructurado con el nombre de la funcion y los argumentos. NO ejecuta nada: solo emite la SOLICITUD. Ejemplo: {"name": "read_file", "arguments": {"path": "src/index.ts"}}. Esto sigue el JSON Schema definido en la tool definition.', icon: '\u{1F4E4}', x: 50, y: 25 },
    { id: 'host', label: 'App Host Ejecuta', description: 'La aplicacion host (Claude Code, tu backend, etc.) recibe el JSON, valida los parametros contra el schema, verifica permisos, y ejecuta la funcion real. Aqui es donde hay acceso al filesystem, APIs, bases de datos. El LLM NUNCA ejecuta directamente.', icon: '\u2699\uFE0F', x: 72, y: 15 },
    { id: 'result', label: 'Tool Result', description: 'El resultado de la ejecucion se devuelve al LLM como un mensaje tool_result. El modelo incorpora esta informacion a su contexto. Cada resultado consume tokens del context window, por eso es importante truncar resultados grandes.', icon: '\u{1F4E5}', x: 72, y: 50 },
    { id: 'analysis', label: 'Analisis del LLM', description: 'El LLM analiza el resultado recibido y toma una decision critica: tiene suficiente informacion para responder al usuario, o necesita hacer otra tool call? Si necesita mas datos, el loop se repite. Si no, genera la respuesta final.', icon: '\u{1F50D}', x: 50, y: 60 },
    { id: 'response', label: 'Respuesta Final', description: 'Cuando el LLM determina que tiene suficiente informacion, genera una respuesta en lenguaje natural para el usuario. Esta respuesta incorpora toda la informacion recopilada a traves de las tool calls previas.', icon: '\u2705', x: 92, y: 40 },
  ];

  const flowEdges = [
    { from: 'input', to: 'reasoning', label: 'prompt' },
    { from: 'reasoning', to: 'selection', label: 'evalua tools' },
    { from: 'selection', to: 'json', label: 'elige' },
    { from: 'json', to: 'host', label: 'JSON' },
    { from: 'host', to: 'result', label: 'ejecuta' },
    { from: 'result', to: 'analysis', label: 'resultado' },
    { from: 'analysis', to: 'reasoning', label: 'loop' },
    { from: 'analysis', to: 'response', label: 'completo' },
  ];

  const flowChallenges = [
    { question: 'Donde se genera el JSON estructurado con el nombre de la herramienta y los argumentos?', targetNodeId: 'json', hint: 'El LLM produce una solicitud estructurada, no la aplicacion host.' },
    { question: 'Quien ejecuta REALMENTE la herramienta: el LLM o la aplicacion?', targetNodeId: 'host', hint: 'El LLM solo genera la solicitud. Otra pieza de software hace el trabajo real.' },
    { question: 'Despues de recibir el resultado, que nodo decide si continuar el loop o responder al usuario?', targetNodeId: 'analysis', hint: 'Se necesita analizar si hay suficiente informacion o si se requiere otra tool call.' },
    { question: 'Cuando el LLM tiene multiples herramientas disponibles, en que paso compara las descriptions para elegir la correcta?', targetNodeId: 'selection', hint: 'Antes de generar el JSON, el modelo debe decidir CUAL herramienta usar.' },
  ];

  // Quiz data
  const quizQuestions = [
    {
      question: 'Observa esta definicion de herramienta. Segun los 5 principios de tool design de Anthropic, cual es el problema PRINCIPAL?',
      codeBlock: `{
  "name": "do_stuff",
  "description": "Does stuff",
  "parameters": {
    "type": "object",
    "properties": {
      "input": { "type": "string" }
    }
  }
}`,
      options: [
        { text: 'El nombre "do_stuff" es vago, pero la description es el problema MAS critico: "Does stuff" no le dice al LLM CUANDO ni COMO usar esta herramienta', correct: true, explanation: 'Exacto. Principio #3 de Anthropic: "Provide meaningful context in descriptions". La description es el recurso principal que usa el LLM para seleccionar herramientas. Anthropic dice: "Prompt-engineer your tool descriptions as carefully as user prompts" (principio #5).' },
        { text: 'El parametro "input" deberia ser un array, no un string', correct: false, explanation: 'El tipo depende del caso de uso. Un string puede ser correcto. El problema real es que nadie (ni el LLM) sabe QUE poner en ese "input" porque la description no explica nada.' },
        { text: 'Falta el campo "required" en los parametros', correct: false, explanation: 'Si, falta "required", pero ese no es el problema principal. Una herramienta con description clara pero sin "required" funciona mejor que una con "required" pero description ilegible.' },
        { text: 'El nombre deberia usar camelCase en vez de snake_case', correct: false, explanation: 'El estilo de nombres es una convencion del proyecto, no un error. El principio #2 de Anthropic habla de namespacing claro (verb_noun), no de camelCase vs snake_case.' },
      ],
      source: 'Anthropic - Writing Effective Tools for Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/writing-tools-for-agents'
    },
    {
      question: 'Por que el LLM NO ejecuta las herramientas directamente?',
      options: [
        { text: 'Porque es demasiado lento para ejecutar codigo', correct: false, explanation: 'La velocidad no es la razon. Es una cuestion de ARQUITECTURA y SEGURIDAD.' },
        { text: 'El LLM es un modelo de lenguaje, no un runtime. Separar la solicitud (JSON) de la ejecucion permite validacion, sandboxing, logging y control de permisos.', correct: true, explanation: 'Exacto. Esta separacion (Command Pattern) es FUNDAMENTAL. Permite que la app host valide parametros, controle permisos, registre logs, aplique rate limits, y ejecute en entorno seguro. Sin esta separacion, no habria ningun control.' },
        { text: 'Porque las herramientas necesitan credenciales que el LLM no tiene', correct: false, explanation: 'Las credenciales son parte del tema de seguridad, pero no la razon principal. Es un beneficio de la separacion, no la causa.' },
        { text: 'Porque Anthropic y OpenAI lo decidieron asi arbitrariamente', correct: false, explanation: 'No es arbitrario. Es el principio de Separation of Concerns. El LLM razona, la app ejecuta. Esta separacion existe en toda la ingenieria de software.' },
      ],
    },
    {
      question: 'Tenes un agente con 80 herramientas MCP conectadas. Segun el articulo "Advanced Tool Use" de Anthropic, cual es la MEJOR estrategia para manejar este numero?',
      options: [
        { text: 'Enviar las 80 herramientas en cada request y confiar en que el LLM elija bien', correct: false, explanation: 'Demasiadas herramientas confunden al modelo y consumen tokens masivamente. Anthropic recomienda no pasar de ~20 por request.' },
        { text: 'Reducir a 10 herramientas mega-funcionales que cubran todo', correct: false, explanation: 'Las mega-herramientas son un anti-patron. "manage_everything(action=X)" es mas confuso que herramientas granulares.' },
        { text: 'Usar una Tool Search Tool: una meta-herramienta que busca y carga dinamicamente solo las herramientas relevantes para la tarea actual', correct: true, explanation: 'Exacto. Es el patron "Tool Search Tool" de Anthropic: en vez de cargar 80 herramientas, cargas 1 meta-herramienta que busca entre las 80. El agente primero busca "herramientas de GitHub" y solo se cargan las 5 relevantes. Reduccion de 85% en tokens segun Anthropic.' },
        { text: 'Crear 80 agentes separados, cada uno con una herramienta', correct: false, explanation: '80 agentes es una exageracion. El patron correcto es filtrar herramientas dinamicamente con Tool Search Tool, no multiplicar agentes.' },
      ],
      source: 'Anthropic - Advanced Tool Use',
      sourceUrl: 'https://www.anthropic.com/engineering/advanced-tool-use'
    },
    {
      question: 'En MCP, que diferencia hay entre los transportes stdio y SSE, y cuando usarias cada uno?',
      options: [
        { text: 'stdio es para la nube y SSE para local', correct: false, explanation: 'Es al reves. stdio lanza un proceso local via command+args. SSE se conecta a un server remoto via URL. Cada transporte tiene su caso de uso.' },
        { text: 'stdio lanza un proceso local (ideal para CLI y herramientas del filesystem). SSE se conecta a un server remoto via HTTP streaming (ideal para APIs cloud).', correct: true, explanation: 'Correcto. stdio es el transporte mas comun en Claude Code porque ejecuta procesos locales (npx, python, binarios). SSE conecta a servidores remotos con streaming para actualizaciones en tiempo real. HTTP stateless es para operaciones request-response simples.' },
        { text: 'Ambos son equivalentes, la diferencia es solo de rendimiento', correct: false, explanation: 'No son equivalentes. stdio ejecuta un PROCESO local (tiene acceso al filesystem). SSE se conecta a un SERVER remoto (acceso via red). La arquitectura es fundamentalmente diferente.' },
        { text: 'SSE es el unico transporte seguro, stdio no tiene encriptacion', correct: false, explanation: 'La seguridad no depende del transporte. stdio es local (no necesita encriptacion de red). SSE puede usar HTTPS. Ambos pueden ser seguros en su contexto.' },
      ],
      source: 'Claude Code - MCP',
      sourceUrl: 'https://code.claude.com/docs/en/mcp'
    },
    {
      question: 'Segun el principio #4 de Anthropic ("Be token-efficient with responses"), que deberia hacer tu herramienta cuando el resultado es muy grande?',
      options: [
        { text: 'Devolver todo el resultado completo para que el LLM tenga toda la informacion', correct: false, explanation: 'Resultados gigantes desperdician context window. Si una herramienta devuelve 10,000 lineas, eso consume una porcion enorme del contexto disponible, dejando menos espacio para razonamiento.' },
        { text: 'No devolver nada y pedirle al usuario que busque manualmente', correct: false, explanation: 'Eso anula el proposito de la herramienta. El agente debe ser capaz de procesar resultados, no delegar al usuario.' },
        { text: 'Truncar, resumir, o paginar el resultado. Devolver solo la informacion relevante y ofrecer una forma de obtener mas si es necesario.', correct: true, explanation: 'Exacto. Principio #4: "Be token-efficient with responses". Trunca resultados grandes, resume cuando sea posible, o devuelve solo los primeros N resultados con un indicador de "hay mas". Claude Code hace esto: Read trunca archivos largos, Bash limita output a 30K caracteres.' },
        { text: 'Comprimir el resultado con gzip antes de devolverlo', correct: false, explanation: 'El LLM no puede leer datos comprimidos. Los tokens se cuentan sobre el TEXTO, no sobre bytes comprimidos. La solucion es truncar o resumir el contenido textual.' },
      ],
      source: 'Anthropic - Writing Effective Tools for Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/writing-tools-for-agents'
    },
  ];
</script>

<svelte:head>
  <title>Modulo 2: {mod.title} | Agent Mastery</title>
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

  <!-- ============================================================ -->
  <!-- SECTION 1: Function Calling — El corazon del agente          -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Function Calling: el corazon del agente</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Function calling (o tool calling) es el mecanismo que le da "manos" a un LLM. En lugar de solo generar texto, el modelo puede generar <strong class="text-agent-highlight">solicitudes estructuradas en JSON</strong> para invocar funciones externas. Pero hay algo CLAVE que debes internalizar desde el primer momento:
    </p>

    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-agent-accent font-bold text-lg mb-2">El LLM NUNCA ejecuta la funcion.</p>
      <p class="text-agent-muted text-sm">El LLM genera un JSON diciendo "quiero llamar a esta funcion con estos parametros". La aplicacion host recibe ese JSON, valida los parametros, ejecuta la funcion real, y devuelve el resultado al LLM. Esta separacion es FUNDAMENTAL para la seguridad y el control.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensalo asi: el LLM es un arquitecto que dibuja planos. Los planos dicen "pone una pared aqui con estas dimensiones". Pero es el obrero (la aplicacion host) quien realmente construye la pared. Si el plano tiene un error, el obrero puede rechazarlo antes de construir algo mal. Esta separacion entre <strong class="text-agent-highlight">intencion</strong> (el JSON) y <strong class="text-agent-highlight">ejecucion</strong> (la app host) es un patron de arquitectura llamado <strong class="text-agent-text">Command Pattern</strong>, y es lo que habilita validacion, logging, rate limiting, sandboxing, y control de permisos.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">El flujo completo paso a paso</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Vamos a seguir el viaje completo de un tool call. Esto es lo que sucede REALMENTE en la comunicacion entre tu aplicacion y la API:
    </p>

    <div class="space-y-4 mb-6">
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">1</span>
        <div>
          <h4 class="text-agent-text font-bold">User Message: el usuario envia un prompt</h4>
          <p class="text-sm text-agent-muted">"Lee el archivo package.json y dime que version de React estamos usando"</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">2</span>
        <div>
          <h4 class="text-agent-text font-bold">LLM Reasoning: el modelo analiza prompt + tool definitions</h4>
          <p class="text-sm text-agent-muted">El modelo ve: "Tengo una herramienta <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code> que lee archivos del filesystem. El usuario quiere leer un archivo. Voy a usarla con path='package.json'."</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-warning/20 text-agent-warning flex items-center justify-center text-sm font-bold">3</span>
        <div>
          <h4 class="text-agent-text font-bold">Tool Call JSON: el LLM emite la solicitud estructurada</h4>
          {@html `<pre class="code-block text-xs mt-2">{"name": "read_file", "arguments": {"path": "package.json"}}</pre>`}
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-warning/20 text-agent-warning flex items-center justify-center text-sm font-bold">4</span>
        <div>
          <h4 class="text-agent-text font-bold">Host Execution: la app valida y ejecuta</h4>
          <p class="text-sm text-agent-muted">La app recibe el JSON, verifica que "path" sea un string valido, que el archivo exista y que el agente tenga permisos. Luego lee el archivo real del disco.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-sm font-bold">5</span>
        <div>
          <h4 class="text-agent-text font-bold">Tool Result: el resultado vuelve al LLM</h4>
          <p class="text-sm text-agent-muted">El contenido del archivo se envia como "tool result" en el siguiente turno de la conversacion. El LLM lo incorpora a su contexto.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-info/20 text-agent-info flex items-center justify-center text-sm font-bold">6</span>
        <div>
          <h4 class="text-agent-text font-bold">LLM Processes Result: decide siguiente accion o respuesta</h4>
          <p class="text-sm text-agent-muted">"El proyecto usa React 19.1.0 segun el package.json". O si necesita mas info, emite OTRO tool call y el ciclo se repite.</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Entrenamiento: como el LLM aprende a llamar herramientas</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los LLMs no nacen sabiendo hacer function calling. Son <strong class="text-agent-highlight">entrenados especificamente</strong> para reconocer cuando una tarea requiere una herramienta y para generar JSON valido como output. Durante el entrenamiento, el modelo ve miles de ejemplos de conversaciones donde una pregunta lleva a una tool call, y la tool call devuelve un resultado que se incorpora a la respuesta final.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Tecnicamente, el modelo aprende a emitir tokens especiales que la infraestructura de la API interpreta como "esto es una tool call, no texto normal". Es como si el modelo aprendiera un segundo idioma: ademas de generar texto en lenguaje natural, puede generar instrucciones estructuradas en JSON. Los modelos mas recientes (Claude Opus 4.6, GPT-4o, Gemini 2.5) son extremadamente confiables en generar JSON valido, pero no siempre fue asi.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que?</p>
      <p class="text-sm text-agent-muted">Antes de que existiera function calling nativo (pre-junio 2023), los desarrolladores usaban REGEX para extraer tool calls del texto del modelo. Le decian al LLM en el system prompt: "Cuando quieras ejecutar una herramienta, escribe ACTION: nombre_herramienta(argumentos)". Luego parseaban el texto con expresiones regulares. Era fragil, propenso a errores, y una pesadilla de mantener. El function calling nativo fue un salto cuantico en confiabilidad.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anthropic vs OpenAI: diferencias de implementacion</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Anthropic (Claude)</h4>
        <p class="text-xs text-agent-muted">Usa <strong class="text-agent-text">content blocks</strong>: una respuesta mezcla bloques de texto y bloques <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_use</code>. Los resultados se envian como <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_result</code>. El modelo puede razonar en texto ANTES de emitir la tool call, lo cual es ideal para debugging.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-warning font-bold text-sm mb-2">OpenAI (GPT)</h4>
        <p class="text-xs text-agent-muted">Usa un campo <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_calls</code> en el mensaje del asistente. Los resultados se envian con role <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool</code>. Soporta "strict mode" que fuerza adherencia exacta al JSON Schema definido.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Conversaciones multi-turno: tool call chains</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      En la practica, un agente raramente hace UN solo tool call. La situacion tipica es una <strong class="text-agent-highlight">cadena de tool calls</strong> donde el resultado de una herramienta alimenta la decision de usar la siguiente:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <ol class="space-y-3 text-sm text-agent-muted">
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC1:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">grep("useState", "*.tsx")</code> &#x2192; 5 archivos encontrados</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC2:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file("src/hooks/useAuth.tsx")</code> &#x2192; contenido del archivo</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC3:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">edit("src/hooks/useAuth.tsx", old, new)</code> &#x2192; archivo modificado</span>
        </li>
      </ol>
      <p class="text-xs text-agent-accent mt-3">Cada tool call depende del resultado del anterior. El agente no puede leer un archivo sin saber cual leer, y no puede editar sin haber leido primero.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">&#x26A0; Error comun</p>
      <p class="text-sm text-agent-muted">Pensar que function calling es lo mismo que "plugins". Los plugins son un concepto de PRODUCTO (una extension que agregas). Function calling es un mecanismo de INFRAESTRUCTURA: es como el LLM se comunica con el mundo exterior. Todos los plugins usan function calling por debajo, pero function calling es mucho mas que plugins.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Parallel Tool Calls: el multiplicador de rendimiento</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los modelos modernos pueden emitir <strong class="text-agent-highlight">multiples tool calls en una sola respuesta</strong> cuando las herramientas son independientes entre si. Esto reduce dramaticamente la latencia:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark border-agent-danger/30">
        <h4 class="text-agent-danger font-bold mb-2">Secuencial (lento)</h4>
        <div class="space-y-1 text-sm text-agent-muted">
          <p>1. Lee archivo A <span class="text-agent-muted">(500ms)</span></p>
          <p>2. Espera resultado...</p>
          <p>3. Lee archivo B <span class="text-agent-muted">(500ms)</span></p>
          <p>4. Espera resultado...</p>
          <p>5. Lee archivo C <span class="text-agent-muted">(500ms)</span></p>
          <p class="text-agent-danger font-bold mt-2">Total: ~1500ms + 3 LLM turns (~9s)</p>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-success/30">
        <h4 class="text-agent-success font-bold mb-2">Paralelo (rapido)</h4>
        <div class="space-y-1 text-sm text-agent-muted">
          <p>1. Lee archivos A, B, C <span class="text-agent-muted">(simultaneo)</span></p>
          <p>2. Espera todos los resultados...</p>
          <p>3. Analiza los 3 resultados juntos</p>
          <p class="text-agent-success font-bold mt-2">Total: ~500ms + 1 LLM turn (~3s)</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">&#x1F3E2; Caso Real</p>
      <p class="text-sm text-agent-muted">Claude Code usa parallel tool calls agresivamente. Cuando le pedis "revisa el estado del proyecto", emite simultaneamente: <code class="text-agent-highlight bg-agent-darker px-1 rounded">git status</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">git diff</code>, y <code class="text-agent-highlight bg-agent-darker px-1 rounded">git log</code>. Tres herramientas independientes ejecutadas en paralelo. En tareas complejas, esto reduce el tiempo total en 50-70%.</p>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- SECTION 2: JSON Schema para herramientas                     -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">JSON Schema para herramientas</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para que el LLM sepa que herramientas tiene disponibles, le envias un array de <strong class="text-agent-highlight">tool definitions</strong> junto con cada request. Cada definicion tiene tres partes criticas:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card border-t-4 border-t-agent-accent">
        <h3 class="text-agent-accent font-bold mb-2">name</h3>
        <p class="text-sm text-agent-muted">Identificador unico. Debe ser descriptivo y especifico. <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code> es bueno. <code class="text-agent-danger bg-agent-darker px-1 rounded">do_stuff</code> es terrible.</p>
      </div>
      <div class="card border-t-4 border-t-agent-success">
        <h3 class="text-agent-success font-bold mb-2">description</h3>
        <p class="text-sm text-agent-muted">La pieza MAS importante. Explica CUANDO usar la herramienta y QUE hace. El LLM usa esto para decidir. Una mala descripcion causa malas decisiones.</p>
      </div>
      <div class="card border-t-4 border-t-agent-warning">
        <h3 class="text-agent-warning font-bold mb-2">parameters</h3>
        <p class="text-sm text-agent-muted">JSON Schema que define los parametros: tipos, restricciones, descripciones, y cuales son requeridos. Cuanto mas preciso, menos errores del LLM.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Buena definicion vs mala definicion</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-agent-danger/10 border-b border-agent-danger/20">
          <span class="text-sm font-bold text-agent-danger">MAL: Definicion vaga</span>
        </div>
        {@html `<pre class="code-block rounded-none border-none text-xs">{
  "name": "search",
  "description": "Searches for things",
  "parameters": {
    "type": "object",
    "properties": {
      "q": { "type": "string" }
    }
  }
}</pre>`}
      </div>

      <div class="bg-agent-dark border border-agent-success/30 rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-agent-success/10 border-b border-agent-success/20">
          <span class="text-sm font-bold text-agent-success">BIEN: Definicion precisa</span>
        </div>
        {@html `<pre class="code-block rounded-none border-none text-xs">{
  "name": "search_codebase",
  "description": "Search for text patterns
    in project source files. Use when you
    need to find where a function, class,
    or variable is defined or used.
    Returns file paths + line numbers.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Regex or literal text"
      },
      "file_type": {
        "type": "string",
        "enum": ["ts","py","go","all"],
        "description": "Filter by language"
      }
    },
    "required": ["pattern"]
  }
}</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tipos fundamentales de JSON Schema</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Tipo</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Uso</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Propiedades utiles</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">string</code></td>
            <td class="py-2 px-3">Texto, paths, nombres</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">enum</code> para valores fijos, <code class="text-agent-highlight bg-agent-darker px-1 rounded">pattern</code> para regex</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">number</code></td>
            <td class="py-2 px-3">Contadores, timeouts, limites</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">minimum</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">maximum</code></td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">boolean</code></td>
            <td class="py-2 px-3">Flags, opciones on/off</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">default</code></td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">array</code></td>
            <td class="py-2 px-3">Listas de items</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">items</code> define el tipo de cada elemento</td>
          </tr>
          <tr>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">object</code></td>
            <td class="py-2 px-3">Objetos anidados</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">properties</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">required</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El historial de mensajes con tool calls</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Detras de bambalinas, la conversacion con tool calls se ve como una secuencia de mensajes con roles distintos. Entender esta estructura es fundamental para debuggear agentes:
    </p>
    {@html `<pre class="code-block text-xs mb-4">[
  // 1. System prompt + tools
  { "role": "system", "content": "Eres un agente..." },

  // 2. El usuario pide algo
  { "role": "user", "content": "Lee package.json" },

  // 3. El LLM responde con tool call
  { "role": "assistant", "content": [
    { "type": "text", "text": "Voy a leer el archivo..." },
    { "type": "tool_use", "id": "call_001",
      "name": "read_file",
      "input": { "path": "package.json" } }
  ]},

  // 4. Resultado de la herramienta
  { "role": "user", "content": [
    { "type": "tool_result", "tool_use_id": "call_001",
      "content": "{ \\"react\\": \\"19.1.0\\" }" }
  ]},

  // 5. Respuesta final del LLM
  { "role": "assistant",
    "content": "El proyecto usa React 19.1.0" }
]</pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">&#x1F511; Concepto Clave</p>
      <p class="text-sm text-agent-muted">El <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_result</code> se envia como un mensaje del usuario. Cada tool call agrega DOS mensajes al historial (la solicitud + el resultado), consumiendo context window rapidamente. Un agente que lee 20 archivos de 500 lineas ya consumio 10,000 lineas de contexto. Por eso herramientas como Grep son valiosas: buscan patrones sin cargar archivos enteros.</p>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- SECTION 3: MCP — El protocolo universal                      -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">MCP: El protocolo universal</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-highlight">Model Context Protocol (MCP)</strong> es un estandar abierto creado por Anthropic que revoluciona la forma en que los agentes se conectan con herramientas. Piensa en MCP como el <strong class="text-agent-text">"USB-C de los agentes IA"</strong>: antes de USB, cada dispositivo tenia su propio conector. Antes de MCP, cada agente tenia su propio formato de herramientas.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <h4 class="text-agent-danger font-bold text-sm mb-2">Sin MCP: N x M integraciones</h4>
        <p class="text-xs text-agent-muted">Claude Code tiene su conector de GitHub, Cursor el suyo, Roo Code el suyo. Si queres soportar un nuevo servicio, necesitas escribir la integracion para CADA agente. 5 agentes x 20 servicios = 100 integraciones.</p>
      </div>
      <div class="bg-agent-dark border border-agent-success/30 rounded-lg p-4">
        <h4 class="text-agent-success font-bold text-sm mb-2">Con MCP: N + M integraciones</h4>
        <p class="text-xs text-agent-muted">Un servidor MCP expone herramientas via protocolo estandar. CUALQUIER agente compatible se conecta. Escribis el servidor MCP de GitHub UNA vez y funciona en todos los agentes. 5 + 20 = 25 integraciones.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Los 3 tipos de transporte</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      MCP soporta tres mecanismos de transporte para conectar cliente (agente) con servidor (herramientas). Cada uno tiene su caso de uso optimo:
    </p>

    <div class="space-y-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">&#x1F4BB;</span>
          <h4 class="text-agent-accent font-bold">stdio (Standard I/O)</h4>
          <span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded-full">Mas comun</span>
        </div>
        <p class="text-sm text-agent-muted mb-2">El cliente lanza un <strong class="text-agent-text">proceso local</strong> con <code class="text-agent-highlight bg-agent-darker px-1 rounded">command</code> + <code class="text-agent-highlight bg-agent-darker px-1 rounded">args</code> y se comunica via stdin/stdout. Es el transporte por defecto en Claude Code porque la mayoria de herramientas son locales.</p>
        <p class="text-xs text-agent-muted"><strong class="text-agent-text">Cuando usarlo:</strong> herramientas CLI, acceso al filesystem, bases de datos locales, cualquier cosa que se ejecute en tu maquina.</p>
      </div>

      <div class="card border-l-4 border-l-agent-info">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">&#x1F310;</span>
          <h4 class="text-agent-info font-bold">SSE (Server-Sent Events)</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">El cliente se conecta a un <strong class="text-agent-text">servidor remoto</strong> via HTTP streaming. El servidor puede enviar actualizaciones en tiempo real al agente. Conexion persistente con <code class="text-agent-highlight bg-agent-darker px-1 rounded">url</code> como parametro.</p>
        <p class="text-xs text-agent-muted"><strong class="text-agent-text">Cuando usarlo:</strong> APIs cloud, herramientas compartidas entre equipos, servicios que necesitan notificar al agente de cambios.</p>
      </div>

      <div class="card border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">&#x1F4E1;</span>
          <h4 class="text-agent-warning font-bold">HTTP (Streamable)</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">Conexion <strong class="text-agent-text">stateless</strong> request-response. El cliente envia un request HTTP y recibe un response. Sin conexion persistente. Ideal para operaciones simples de ida y vuelta.</p>
        <p class="text-xs text-agent-muted"><strong class="text-agent-text">Cuando usarlo:</strong> APIs REST simples, servicios serverless, operaciones que no necesitan streaming ni estado.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Los 3 scopes de configuracion MCP</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      En Claude Code, los servidores MCP se configuran en tres niveles con diferentes alcances:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Scope</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Archivo</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Alcance</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Ejemplo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 font-bold text-agent-success">Project</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">.mcp.json</code></td>
            <td class="py-2 px-3">Solo este repo. Se commitea al repositorio para que todo el equipo lo use.</td>
            <td class="py-2 px-3">DB del proyecto, Jira del equipo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 font-bold text-agent-info">User</td>
            <td class="py-2 px-3"><code class="text-agent-highlight bg-agent-darker px-1 rounded">~/.claude/settings.json</code></td>
            <td class="py-2 px-3">Todos tus proyectos. Configuracion personal del desarrollador.</td>
            <td class="py-2 px-3">GitHub personal, memoria (Hoofy)</td>
          </tr>
          <tr>
            <td class="py-2 px-3 font-bold text-agent-warning">Enterprise</td>
            <td class="py-2 px-3">Managed policy</td>
            <td class="py-2 px-3">Toda la organizacion. Configurado por admins.</td>
            <td class="py-2 px-3">Guardrails corporativos, herramientas aprobadas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Configuracion en la practica</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Asi se ve la configuracion MCP en Claude Code. El archivo <code class="text-agent-highlight bg-agent-darker px-1 rounded">.mcp.json</code> en la raiz del proyecto (scope project) con dos servidores:
    </p>
    {@html `<pre class="code-block text-xs mb-4">// .mcp.json (scope: project, se commitea al repo)
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_xxx..." }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}

// ~/.claude/settings.json (scope: user, personal)
{
  "mcpServers": {
    "hoofy": {
      "command": "/path/to/hoofy",
      "args": ["--db", "~/.hoofy/memory.db"],
      "env": {}
    }
  }
}</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Con esta configuracion, Claude Code automaticamente tiene acceso a herramientas de GitHub (crear PRs, leer issues), PostgreSQL (consultar tablas), y Hoofy (memoria persistente). El agente descubre las herramientas de cada servidor MCP al iniciar y las agrega a sus tool definitions.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que?</p>
      <p class="text-sm text-agent-muted">MCP no reemplaza function calling: se construye ENCIMA de function calling. Los servidores MCP exponen herramientas que internamente se convierten en tool definitions JSON Schema. El LLM no sabe (ni le importa) si una herramienta viene de MCP o esta hardcodeada. Lo que cambia es como se descubren y distribuyen las herramientas, no como el LLM las usa.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">&#x1F3E2; Caso Real</p>
      <p class="text-sm text-agent-muted">En 2026, el ecosistema MCP tiene miles de servidores disponibles. OpenAI y Google adoptaron MCP para sus plataformas, consolidandolo como estandar de facto. Un servidor MCP escrito para Claude funciona con GPT, Gemini, o cualquier agente compatible. La analogia USB-C se hizo realidad.</p>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- SECTION 4: Los 5 principios de tool design                   -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Los 5 principios de tool design</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Estos principios vienen directamente del articulo <strong class="text-agent-highlight">"Writing Effective Tools for Agents"</strong> de Anthropic. Son las reglas que el equipo de Claude Code sigue para disenar las herramientas internas del agente. No son sugerencias: son la diferencia entre un agente que funciona bien y uno que constantemente elige la herramienta incorrecta.
    </p>

    <div class="space-y-6 mb-6">
      <!-- Principio 1 -->
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-3 mb-3">
          <span class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-lg font-bold">1</span>
          <div>
            <h3 class="text-agent-text font-bold">Elegi las herramientas correctas</h3>
            <p class="text-xs text-agent-accent">Choose the right tools</p>
          </div>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          No demasiadas, no demasiado pocas. Cada herramienta extra que agregas es "ruido" que el modelo debe filtrar. Pero si faltan herramientas esenciales, el agente queda paralizado. Anthropic recomienda mantener el numero por debajo de ~20 herramientas por request.
        </p>
        <div class="bg-agent-dark rounded p-3">
          <p class="text-xs text-agent-muted"><strong class="text-agent-text">Regla practica:</strong> Si el agente no uso una herramienta en las ultimas 50 interacciones, probablemente no la necesita en el contexto actual. Filtra herramientas por contexto en vez de cargar todas siempre.</p>
        </div>
      </div>

      <!-- Principio 2 -->
      <div class="card border-l-4 border-l-agent-success">
        <div class="flex items-center gap-3 mb-3">
          <span class="shrink-0 w-10 h-10 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-lg font-bold">2</span>
          <div>
            <h3 class="text-agent-text font-bold">Usa namespacing claro</h3>
            <p class="text-xs text-agent-success">Use clear namespacing (verb_noun pattern)</p>
          </div>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Los nombres de herramientas deben seguir el patron <code class="text-agent-highlight bg-agent-darker px-1 rounded">verbo_sustantivo</code>: <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">search_codebase</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">create_issue</code>. El verbo dice que ACCION, el sustantivo dice sobre QUE.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="bg-agent-dark rounded p-3">
            <p class="text-xs text-agent-danger font-bold mb-1">Mal</p>
            <p class="text-xs text-agent-muted"><code class="text-agent-highlight bg-agent-darker px-1 rounded">search</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">do_stuff</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">handle</code></p>
          </div>
          <div class="bg-agent-dark rounded p-3">
            <p class="text-xs text-agent-success font-bold mb-1">Bien</p>
            <p class="text-xs text-agent-muted"><code class="text-agent-highlight bg-agent-darker px-1 rounded">search_codebase</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">create_github_issue</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">run_test_suite</code></p>
          </div>
        </div>
      </div>

      <!-- Principio 3 -->
      <div class="card border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-3 mb-3">
          <span class="shrink-0 w-10 h-10 rounded-full bg-agent-warning/20 text-agent-warning flex items-center justify-center text-lg font-bold">3</span>
          <div>
            <h3 class="text-agent-text font-bold">Proporciona contexto significativo en las descriptions</h3>
            <p class="text-xs text-agent-warning">Provide meaningful context in descriptions</p>
          </div>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          La description es el recurso PRINCIPAL que usa el LLM para decidir cuando usar cada herramienta. No solo expliques QUE hace: explica CUANDO usarla y CUANDO NO usarla.
        </p>
        {@html `<pre class="code-block text-xs">"description": "Search for text patterns in
  source files using regex. Use when you need
  to find where a function is defined or used.
  DO NOT use for finding files by name (use
  Glob instead). Returns file paths and line
  numbers matching the pattern."</pre>`}
      </div>

      <!-- Principio 4 -->
      <div class="card border-l-4 border-l-agent-info">
        <div class="flex items-center gap-3 mb-3">
          <span class="shrink-0 w-10 h-10 rounded-full bg-agent-info/20 text-agent-info flex items-center justify-center text-lg font-bold">4</span>
          <div>
            <h3 class="text-agent-text font-bold">Se eficiente con los tokens en las respuestas</h3>
            <p class="text-xs text-agent-info">Be token-efficient with responses</p>
          </div>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Cada resultado de herramienta consume tokens del context window. Si una herramienta devuelve 10,000 lineas, todo eso va al contexto. Trunca, resume, o pagina los resultados. Claude Code lo hace: Read trunca archivos largos, Bash limita output a 30K caracteres.
        </p>
        <div class="bg-agent-dark rounded p-3">
          <p class="text-xs text-agent-muted"><strong class="text-agent-text">Regla de oro:</strong> Devuelve solo la informacion que el agente NECESITA para tomar la siguiente decision. Si un <code class="text-agent-highlight bg-agent-darker px-1 rounded">ls</code> devuelve 500 archivos, probablemente el agente solo necesita los primeros 20 + un conteo total.</p>
        </div>
      </div>

      <!-- Principio 5 -->
      <div class="card border-l-4 border-l-agent-danger">
        <div class="flex items-center gap-3 mb-3">
          <span class="shrink-0 w-10 h-10 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-lg font-bold">5</span>
          <div>
            <h3 class="text-agent-text font-bold">Prompt-engineera las descriptions como los prompts del usuario</h3>
            <p class="text-xs text-agent-danger">Prompt-engineer tool descriptions as carefully as user prompts</p>
          </div>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Las tool descriptions SON prompts. El mismo cuidado que pones en escribir un system prompt deberia ir en las descriptions de tus herramientas. Itera, testa, y mejora las descriptions basandote en como las usa el modelo.
        </p>
        <div class="bg-agent-dark rounded p-3">
          <p class="text-xs text-agent-muted"><strong class="text-agent-text">Caso del equipo de Claude Code:</strong> Agregar descripciones detalladas que diferencian CUANDO usar Grep vs Read vs Glob mejoro la precision de seleccion de herramientas en un 30%+. La version anterior de Grep decia "Search for text". La nueva explica cuando usarla Y cuando NO usarla.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- SECTION 5: Tool Search Tool                                  -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Tool Search Tool: cuando tenes 50+ herramientas</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Que pasa cuando tu agente tiene acceso a 50, 80, o 200 herramientas via MCP? Cargar todas en cada request tiene dos problemas enormes: consume una cantidad brutal de tokens (cada tool definition son ~100-500 tokens), y el LLM se confunde al elegir entre demasiadas opciones. La solucion de Anthropic es elegante:
    </p>

    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-agent-accent font-bold text-lg mb-2">Dale al agente una sola meta-herramienta: Tool Search Tool</p>
      <p class="text-agent-muted text-sm">En vez de cargar 80 herramientas, cargas 1 herramienta que busca entre las 80. El agente primero busca "herramientas de GitHub" y solo se cargan las 5 relevantes. Es como un buscador de herramientas DENTRO del agente.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como funciona</h3>
    <div class="space-y-4 mb-6">
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">1</span>
        <div>
          <h4 class="text-agent-text font-bold">El agente arranca con ~10 herramientas core + Tool Search Tool</h4>
          <p class="text-sm text-agent-muted">Las herramientas basicas (Read, Write, Bash, Grep) siempre estan disponibles. El resto no se carga.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">2</span>
        <div>
          <h4 class="text-agent-text font-bold">Cuando necesita una herramienta especifica, busca</h4>
          {@html `<pre class="code-block text-xs mt-2">{"name": "search_tools", "arguments": {"query": "create GitHub pull request"}}</pre>`}
        </div>
      </div>
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">3</span>
        <div>
          <h4 class="text-agent-text font-bold">El resultado devuelve las herramientas relevantes</h4>
          <p class="text-sm text-agent-muted">Solo las 3-5 herramientas que matchean la query se agregan al contexto para el proximo turno. Las demas nunca se cargan.</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark border-agent-danger/30">
        <h4 class="text-agent-danger font-bold mb-2">Sin Tool Search</h4>
        <div class="text-sm text-agent-muted">
          <p>80 tools x ~300 tokens = <strong class="text-agent-danger">~24,000 tokens</strong></p>
          <p class="text-xs mt-1">Consumidos en CADA request, incluso si solo usas 2-3.</p>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-success/30">
        <h4 class="text-agent-success font-bold mb-2">Con Tool Search</h4>
        <div class="text-sm text-agent-muted">
          <p>10 core + 1 search = <strong class="text-agent-success">~3,600 tokens</strong></p>
          <p class="text-xs mt-1">Reduccion del 85% en tokens. Solo carga lo que necesita.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que?</p>
      <p class="text-sm text-agent-muted">Claude Code implementa un patron similar internamente. No carga TODAS las herramientas MCP en cada turno. Usa un mecanismo de descubrimiento que determina cuales herramientas son relevantes para la tarea actual. Esto es parte de la razon por la que Claude Code se siente rapido incluso con muchos servidores MCP conectados.</p>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- SECTION 6: Herramientas de Claude Code                       -->
  <!-- ============================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Herramientas de Claude Code</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code viene con un set de herramientas built-in que son el nucleo de su capacidad agentica. Cada una esta disenada siguiendo los 5 principios que vimos arriba. Entender ESTAS herramientas te hace mas efectivo porque sabes exactamente que puede y que no puede hacer el agente:
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F4D6;</span>
          <h4 class="text-agent-accent font-bold">Read</h4>
        </div>
        <p class="text-sm text-agent-muted">Lee archivos del filesystem local. Soporta texto, imagenes, PDFs y notebooks Jupyter. Parametros: <code class="text-agent-highlight bg-agent-darker px-1 rounded">file_path</code> (requerido), <code class="text-agent-highlight bg-agent-darker px-1 rounded">offset</code> y <code class="text-agent-highlight bg-agent-darker px-1 rounded">limit</code> (para archivos grandes). Trunca lineas mayores a 2000 caracteres.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x270F;&#xFE0F;</span>
          <h4 class="text-agent-accent font-bold">Write</h4>
        </div>
        <p class="text-sm text-agent-muted">Escribe archivos completos al filesystem. Sobrescribe el archivo existente. REQUIERE haber leido el archivo primero (para no perder contenido). Ideal para archivos nuevos.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x2702;&#xFE0F;</span>
          <h4 class="text-agent-accent font-bold">Edit</h4>
        </div>
        <p class="text-sm text-agent-muted">Reemplazos exactos de string en archivos. Usa <code class="text-agent-highlight bg-agent-darker px-1 rounded">old_string</code> &#x2192; <code class="text-agent-highlight bg-agent-darker px-1 rounded">new_string</code>. El old_string DEBE ser unico en el archivo. Mas seguro que Write para cambios parciales porque no reescribe todo el archivo.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F4BB;</span>
          <h4 class="text-agent-accent font-bold">Bash</h4>
        </div>
        <p class="text-sm text-agent-muted">Ejecuta comandos en la terminal. Para git, npm, tests, docker, etc. El directorio de trabajo persiste entre llamadas. Timeout maximo de 10 minutos. Output truncado a 30K caracteres.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F50D;</span>
          <h4 class="text-agent-accent font-bold">Grep</h4>
        </div>
        <p class="text-sm text-agent-muted">Busca patrones en contenido de archivos con regex. Mucho mas eficiente que leer archivos enteros. Modos: <code class="text-agent-highlight bg-agent-darker px-1 rounded">content</code> (lineas), <code class="text-agent-highlight bg-agent-darker px-1 rounded">files_with_matches</code> (paths), <code class="text-agent-highlight bg-agent-darker px-1 rounded">count</code>. Soporta filtro por tipo de archivo y glob.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F4C1;</span>
          <h4 class="text-agent-accent font-bold">Glob</h4>
        </div>
        <p class="text-sm text-agent-muted">Busca archivos por nombre/patron (<code class="text-agent-highlight bg-agent-darker px-1 rounded">**/*.ts</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">src/**/*.test.*</code>). Funciona con cualquier tamano de codebase. Complementa a Grep: Glob busca NOMBRES, Grep busca CONTENIDO.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F310;</span>
          <h4 class="text-agent-accent font-bold">WebFetch / WebSearch</h4>
        </div>
        <p class="text-sm text-agent-muted">WebFetch obtiene contenido de una URL y lo procesa. WebSearch busca en la web y devuelve resultados. Permiten al agente consultar documentacion, APIs, y informacion actualizada sin salir del contexto.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F916;</span>
          <h4 class="text-agent-accent font-bold">Task (Sub-agents)</h4>
        </div>
        <p class="text-sm text-agent-muted">Lanza sub-agentes con su propio context window aislado. Ideal para tareas que requieren mucho contexto sin contaminar la conversacion principal. Es como delegar una sub-tarea a un colega.</p>
      </div>

      <div class="card bg-agent-dark hover:border-agent-accent/50 transition-colors">
        <div class="flex items-center gap-3 mb-1">
          <span class="text-lg">&#x1F50C;</span>
          <h4 class="text-agent-accent font-bold">MCP Tools</h4>
        </div>
        <p class="text-sm text-agent-muted">Cualquier herramienta expuesta por servidores MCP configurados. Aparecen como <code class="text-agent-highlight bg-agent-darker px-1 rounded">mcp__servidor__herramienta</code>. Pueden ser herramientas de GitHub, bases de datos, Jira, memoria, o cualquier servicio que tenga un servidor MCP.</p>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">&#x1F511; Concepto Clave</p>
      <p class="text-sm text-agent-muted">Las herramientas de Claude Code estan disenadas con <strong class="text-agent-text">separation of concerns</strong>: Read lee, Write escribe, Edit edita parcialmente, Grep busca contenido, Glob busca nombres. El agente COMBINA estas herramientas atomicas en flujos complejos. No hay una mega-herramienta "manage_files" que hace todo. Este es el principio #1 (herramientas correctas) y #2 (namespacing claro) en accion.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">&#x26A0; Anti-patron comun</p>
      <p class="text-sm text-agent-muted">Usar <code class="text-agent-highlight bg-agent-darker px-1 rounded">Bash</code> para todo: <code class="text-agent-highlight bg-agent-darker px-1 rounded">cat</code> en vez de Read, <code class="text-agent-highlight bg-agent-darker px-1 rounded">grep</code> en vez de Grep, <code class="text-agent-highlight bg-agent-darker px-1 rounded">find</code> en vez de Glob. Las herramientas especializadas tienen permisos optimizados, mejor manejo de errores, y resultados estructurados. Bash es para comandos que no tienen herramienta dedicada (git, npm, docker).</p>
    </div>
  </section>

  <!-- ============================================================ -->
  <!-- InteractiveFlow                                              -->
  <!-- ============================================================ -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el flujo de Tool Calling interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="El Flujo Completo de Tool Calling"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ============================================================ -->
  <!-- Quiz                                                         -->
  <!-- ============================================================ -->
  <section class="mb-10">
    {#if !showQuiz}
      <button onclick={() => showQuiz = true} class="btn-primary w-full justify-center">
        Comenzar el quiz del modulo
      </button>
    {:else}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#x1F527;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ahora entendes como funciona tool calling, MCP, y los 5 principios de tool design de Anthropic. Este es el superpoder que convierte a un LLM en un agente capaz de actuar en el mundo real.</p>
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
