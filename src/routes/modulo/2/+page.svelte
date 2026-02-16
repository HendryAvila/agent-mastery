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
    // Badge 'tool-master' requires 80%+ score
    if (score / total >= 0.8) {
      const badge = courseStore.unlockBadge('tool-master');
      if (badge) {
        earnedBadge = badge;
        showBadge = true;
      }
    }
    completed = true;
  }

  // InteractiveFlow: Tool Call Flow
  const flowNodes = [
    { id: 'prompt', label: 'Prompt del Usuario', description: 'El usuario envia una solicitud al agente. Ejemplo: "Busca los archivos .ts que tengan errores de tipo y corrigelos". El prompt viaja al LLM junto con las definiciones de herramientas disponibles.', icon: '\u{1F4AC}', x: 8, y: 25 },
    { id: 'analysis', label: 'Analisis del LLM', description: 'El LLM analiza el prompt Y las tool definitions disponibles. Razona sobre CUAL herramienta usar, con que parametros, y en que orden. Este paso es critico: una mala definicion de tool causa malas decisiones.', icon: '\u{1F9E0}', x: 28, y: 25 },
    { id: 'toolcall', label: 'Tool Call (JSON)', description: 'El LLM genera un objeto JSON estructurado con el nombre de la funcion y los argumentos. NO ejecuta nada. Solo emite la SOLICITUD. Ejemplo: {"name": "read_file", "arguments": {"path": "src/index.ts"}}', icon: '\u{1F4E4}', x: 50, y: 15 },
    { id: 'parallel', label: 'Parallel Calls', description: 'Cuando el LLM identifica herramientas INDEPENDIENTES, puede emitir multiples tool calls en una sola respuesta. La app host las ejecuta en paralelo, reduciendo la latencia total drasticamente.', icon: '\u26A1', x: 50, y: 50 },
    { id: 'execution', label: 'App Ejecuta', description: 'La aplicacion host (NO el LLM) toma el JSON del tool call, valida los parametros contra el JSON Schema, y ejecuta la funcion real. Aqui es donde el codigo tiene acceso al sistema de archivos, APIs, bases de datos, etc.', icon: '\u2699\uFE0F', x: 72, y: 25 },
    { id: 'result', label: 'Tool Result', description: 'El resultado de la ejecucion se envia de vuelta al LLM como un "tool result" message. El modelo incorpora esta informacion a su contexto y decide: responder al usuario, o hacer otra tool call.', icon: '\u{1F4E5}', x: 88, y: 25 },
    { id: 'response', label: 'Respuesta Final', description: 'Cuando el LLM determina que tiene suficiente informacion, genera una respuesta en lenguaje natural para el usuario. Si NO tiene suficiente, vuelve a emitir otro tool call y el ciclo se repite.', icon: '\u2705', x: 88, y: 60 },
  ];

  const flowEdges = [
    { from: 'prompt', to: 'analysis', label: 'envio' },
    { from: 'analysis', to: 'toolcall', label: 'single call' },
    { from: 'analysis', to: 'parallel', label: 'multi call' },
    { from: 'toolcall', to: 'execution', label: 'JSON' },
    { from: 'parallel', to: 'execution', label: 'batch' },
    { from: 'execution', to: 'result', label: 'resultado' },
    { from: 'result', to: 'analysis', label: 'loop' },
    { from: 'result', to: 'response', label: 'completo' },
  ];

  const flowChallenges = [
    { question: 'Donde se genera el JSON estructurado con el nombre de la herramienta y sus argumentos?', targetNodeId: 'toolcall', hint: 'El LLM produce una solicitud, no la aplicacion host.' },
    { question: 'Quien ejecuta REALMENTE la herramienta: el LLM o la aplicacion?', targetNodeId: 'execution', hint: 'El LLM solo genera la solicitud. Otra pieza de software hace el trabajo.' },
    { question: 'Cuando multiples herramientas son independientes, que nodo permite reducir la latencia?', targetNodeId: 'parallel', hint: 'Se trata de ejecutar varias cosas al mismo tiempo.' },
    { question: 'Despues de recibir el resultado, a donde va la informacion para decidir si continuar o responder?', targetNodeId: 'result', hint: 'El resultado se reinyecta al contexto para que el LLM decida el siguiente paso.' },
  ];

  // Quiz data
  const quizQuestions = [
    {
      question: 'Observa esta definicion de herramienta y determina que esta MAL:',
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
        { text: 'El nombre "do_stuff" es demasiado vago: el LLM no sabra CUANDO usar esta herramienta', correct: false, explanation: 'Correcto que el nombre es vago, pero el problema MAS critico es la descripcion.' },
        { text: 'La descripcion "Does stuff" es inutil: el LLM usa la descripcion para decidir CUANDO y COMO usar la herramienta. Sin contexto, eligira mal.', correct: true, explanation: 'Exacto. La descripcion es el recurso principal que usa el LLM para seleccionar herramientas. Una descripcion vaga causa selecciones incorrectas y argumentos mal formados. Nombre Y descripcion deben ser claros.' },
        { text: 'El parametro "input" deberia ser un array, no un string', correct: false, explanation: 'El tipo depende del caso de uso. Un string puede ser correcto. El problema real es que nadie sabe QUE poner en ese "input".' },
        { text: 'Falta el campo "required" en los parametros', correct: false, explanation: 'Si, falta "required", pero ese no es el problema PRINCIPAL. Una herramienta con descripcion clara pero sin "required" funciona mejor que una con "required" pero descripcion ilegible.' },
      ],
      source: 'OpenAI - Function Calling Documentation',
      sourceUrl: 'https://platform.openai.com/docs/guides/function-calling'
    },
    {
      question: 'Por que el LLM NO ejecuta las herramientas directamente?',
      options: [
        { text: 'Porque es demasiado lento para ejecutar codigo', correct: false, explanation: 'La velocidad no es la razon. Es una cuestion de ARQUITECTURA y SEGURIDAD.' },
        { text: 'Porque el LLM es un modelo de lenguaje, no un runtime. Separar la solicitud (JSON) de la ejecucion permite validacion, sandboxing, logging y control de permisos.', correct: true, explanation: 'Exacto. Esta separacion es FUNDAMENTAL. Permite que la aplicacion host valide parametros, controle permisos, registre logs, aplique rate limits, y ejecute en un entorno seguro. Si el LLM ejecutara directamente, no habria ningun control.' },
        { text: 'Porque las herramientas necesitan credenciales que el LLM no tiene', correct: false, explanation: 'Las credenciales son parte del tema de seguridad, pero no la razon principal de la separacion. Es un beneficio, no la causa.' },
        { text: 'Porque OpenAI y Anthropic lo decidieron asi arbitrariamente', correct: false, explanation: 'No es arbitrario. Es un principio de diseno llamado separacion de responsabilidades (Separation of Concerns). El LLM razona, la app ejecuta.' },
      ],
    },
    {
      question: 'Un agente llama a 5 herramientas secuencialmente, pero 3 de ellas son INDEPENDIENTES entre si (no necesitan el resultado de las otras). Que patron mejoraria la latencia?',
      options: [
        { text: 'Usar un modelo mas rapido para las tool calls', correct: false, explanation: 'La latencia no viene del modelo, viene de la ejecucion SECUENCIAL de herramientas. Cada tool call espera innecesariamente a la anterior.' },
        { text: 'Parallel tool calls: el LLM emite las 3 llamadas independientes en una sola respuesta y la app las ejecuta simultaneamente', correct: true, explanation: 'Correcto. Los parallel tool calls permiten al LLM emitir multiples solicitudes en un solo turno. La aplicacion host las ejecuta en paralelo, reduciendo la latencia de 3x secuencial a 1x paralelo.' },
        { text: 'Cachear los resultados de las herramientas para no ejecutarlas', correct: false, explanation: 'El caching ayuda si los mismos inputs se repiten, pero en este caso las herramientas se ejecutan por primera vez. El problema es el ORDEN, no la repeticion.' },
        { text: 'Combinar las 3 herramientas en una sola herramienta mas grande', correct: false, explanation: 'Mega-herramientas son un anti-patron. Pierdes granularidad, reusabilidad, y le haces mas dificil al LLM decidir que usar. Parallel calls resuelve el problema sin sacrificar nada.' },
      ],
      source: 'Anthropic - Tool Use with Claude',
      sourceUrl: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview'
    },
    {
      question: 'Tienes dos opciones para disenar herramientas para un agente de codigo. Opcion A: 3 herramientas grandes (manage_files, manage_git, manage_tests). Opcion B: 10 herramientas especificas (read_file, write_file, git_commit, git_push, run_test...). Cual es la mejor y por que?',
      options: [
        { text: 'Opcion A: menos herramientas = menos confusion para el LLM', correct: false, explanation: 'Menos herramientas no significa menos confusion. "manage_files" puede hacer 20 cosas distintas, obligando al LLM a pasar parametros complejos y ambiguos para especificar que operacion quiere.' },
        { text: 'Opcion B: herramientas granulares con responsabilidad unica, cada una con parametros claros y especificos', correct: true, explanation: 'Correcto. Herramientas granulares siguen el principio de responsabilidad unica. El LLM elige mejor entre "read_file" y "write_file" que entre "manage_files mode=read" y "manage_files mode=write". Parametros mas simples = menos errores.' },
        { text: 'Opcion A si usas un modelo potente, Opcion B si usas un modelo pequeno', correct: false, explanation: 'El principio de herramientas granulares aplica independientemente del modelo. Incluso los modelos mas potentes se benefician de herramientas claras y especificas.' },
        { text: 'Da igual, ambas funcionan exactamente igual', correct: false, explanation: 'No da igual. La granularidad de las herramientas afecta directamente la precision del LLM para seleccionarlas y usarlas. Las definiciones claras reducen errores.' },
      ],
      source: 'Composio - Tool Calling Explained',
      sourceUrl: 'https://composio.dev/blog/ai-agent-tool-calling-guide'
    },
    {
      question: 'El "strict mode" en function calling fuerza al LLM a adherirse exactamente al JSON Schema definido. En que escenario NO es recomendable usarlo?',
      options: [
        { text: 'Nunca: siempre hay que usar strict mode', correct: false, explanation: 'Strict mode es recomendable en produccion, pero tiene limitaciones. No permite parametros opcionales flexibles ni schemas dinamicos.' },
        { text: 'Cuando necesitas que el LLM genere parametros creativos o exploratorios que no encajan en un schema rigido', correct: true, explanation: 'Correcto. En herramientas exploratorias (busqueda abierta, generacion creativa, queries dinamicas), un schema demasiado estricto limita la capacidad del LLM de adaptarse al contexto. El trade-off es validacion vs flexibilidad.' },
        { text: 'Cuando el LLM es muy potente y no necesita restricciones', correct: false, explanation: 'Incluso los modelos mas potentes pueden generar JSON malformado sin strict mode. La potencia del modelo no elimina la necesidad de validacion.' },
        { text: 'Cuando tienes pocas herramientas definidas', correct: false, explanation: 'La cantidad de herramientas no afecta si debes usar strict mode. El factor es la naturaleza de los parametros, no la cantidad de herramientas.' },
      ],
    },
    {
      question: 'Tu agente falla con el error "tool not found: readFile" pero tienes una herramienta definida como "read_file". Cual es el problema y como lo solucionas?',
      options: [
        { text: 'El LLM necesita mas contexto para elegir la herramienta correcta', correct: false, explanation: 'No es un problema de contexto. El LLM esta generando un nombre de herramienta que NO EXISTE en tus definiciones.' },
        { text: 'El LLM alucino el nombre de la herramienta. La solucion es usar strict mode y/o mejorar la descripcion para que el modelo use el nombre exacto "read_file"', correct: true, explanation: 'Exacto. El LLM puede "inventar" nombres de herramientas basandose en su entrenamiento (camelCase vs snake_case). Strict mode fuerza al modelo a usar SOLO los nombres definidos. Tambien ayuda tener descripciones claras y consistentes.' },
        { text: 'Hay que renombrar la herramienta a "readFile" porque el LLM prefiere camelCase', correct: false, explanation: 'No debes adaptar tu sistema al LLM. El LLM debe adaptarse a tus definiciones. Para eso existe strict mode y buenas tool definitions.' },
        { text: 'Es un bug del framework, no del LLM', correct: false, explanation: 'El error viene del LLM generando un nombre inexistente. No es un bug del framework: es el comportamiento esperado cuando no se usa strict mode o las definiciones son ambiguas.' },
      ],
      source: 'OpenAI - Function Calling Documentation',
      sourceUrl: 'https://platform.openai.com/docs/guides/function-calling'
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

  <!-- THEORY SECTION 1: Que es Function Calling -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Que es Function Calling</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Function calling (o tool calling) es el mecanismo que le da "manos" a un LLM. En lugar de solo generar texto, el modelo puede generar <strong class="text-agent-highlight">solicitudes estructuradas en JSON</strong> para invocar funciones externas. Pero hay algo CLAVE que debes entender:
    </p>

    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-agent-accent font-bold text-lg mb-2">El LLM NO ejecuta la funcion.</p>
      <p class="text-agent-muted text-sm">El LLM genera un JSON diciendo "quiero llamar a esta funcion con estos parametros". La aplicacion host recibe ese JSON, valida los parametros, ejecuta la funcion real, y devuelve el resultado al LLM. Esta separacion es FUNDAMENTAL para la seguridad y el control.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensalo asi: el LLM es un arquitecto que dibuja planos. Los planos dicen "pon una pared aqui con estas dimensiones". Pero es el obrero (la aplicacion host) quien realmente construye la pared. Si el plano tiene un error, el obrero puede rechazarlo antes de construir algo mal.
    </p>
  </section>

  <!-- THEORY SECTION 2: Anatomia de una Tool Definition -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Anatomia de una Tool Definition</h2>
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
    in the project source files.
    Use when you need to find where
    a function, class, or variable
    is defined or used.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Regex or literal
          text to search for"
      },
      "file_type": {
        "type": "string",
        "enum": ["ts","py","go","all"],
        "description": "Filter by lang"
      }
    },
    "required": ["pattern"]
  }
}</pre>`}
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Regla de oro:</p>
      <p class="text-sm text-agent-muted">Si un humano no puede entender CUANDO usar tu herramienta leyendo solo la descripcion, el LLM tampoco podra. Escribe las descripciones como si fueran documentacion para un nuevo desarrollador del equipo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: El Flujo Completo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Flujo Completo de un Tool Call</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Vamos a seguir el viaje completo de un tool call, paso a paso:
    </p>

    <div class="space-y-4 mb-6">
      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">1</span>
        <div>
          <h4 class="text-agent-text font-bold">El usuario envia un prompt</h4>
          <p class="text-sm text-agent-muted">"Lee el archivo package.json y dime que version de React estamos usando"</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">2</span>
        <div>
          <h4 class="text-agent-text font-bold">El LLM recibe el prompt + las tool definitions</h4>
          <p class="text-sm text-agent-muted">El modelo ve: "Tengo una herramienta <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code> que lee archivos. El usuario quiere leer un archivo. Voy a usarla."</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 text-agent-accent flex items-center justify-center text-sm font-bold">3</span>
        <div>
          <h4 class="text-agent-text font-bold">El LLM genera un tool_call</h4>
          {@html `<pre class="code-block text-xs mt-2">{"name": "read_file", "arguments": {"path": "package.json"}}</pre>`}
        </div>
      </div>

      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-warning/20 text-agent-warning flex items-center justify-center text-sm font-bold">4</span>
        <div>
          <h4 class="text-agent-text font-bold">La aplicacion host valida y ejecuta</h4>
          <p class="text-sm text-agent-muted">La app recibe el JSON, verifica que "path" sea un string valido, que el archivo exista, y que el agente tenga permisos. Luego lee el archivo real del disco.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-sm font-bold">5</span>
        <div>
          <h4 class="text-agent-text font-bold">El resultado se devuelve al LLM</h4>
          <p class="text-sm text-agent-muted">El contenido del archivo se envia como "tool result" en el siguiente turno de la conversacion. El LLM lo incorpora a su contexto.</p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <span class="shrink-0 w-8 h-8 rounded-full bg-agent-info/20 text-agent-info flex items-center justify-center text-sm font-bold">6</span>
        <div>
          <h4 class="text-agent-text font-bold">El LLM genera la respuesta final</h4>
          <p class="text-sm text-agent-muted">"El proyecto usa React 19.1.0 segun el package.json" O decide hacer otro tool call si necesita mas informacion.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 4: Parallel Tool Calls -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Parallel Tool Calls</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los modelos modernos pueden emitir <strong class="text-agent-highlight">multiples tool calls en una sola respuesta</strong> cuando las herramientas son independientes entre si. Esto es un multiplicador de rendimiento enorme.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark border-agent-danger/30">
        <h3 class="text-agent-danger font-bold mb-2">Secuencial (lento)</h3>
        <div class="space-y-1 text-sm text-agent-muted">
          <p>1. Lee archivo A <span class="text-agent-muted">(500ms)</span></p>
          <p>2. Espera resultado...</p>
          <p>3. Lee archivo B <span class="text-agent-muted">(500ms)</span></p>
          <p>4. Espera resultado...</p>
          <p>5. Lee archivo C <span class="text-agent-muted">(500ms)</span></p>
          <p class="text-agent-danger font-bold mt-2">Total: ~1500ms + 3 LLM turns</p>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-success/30">
        <h3 class="text-agent-success font-bold mb-2">Paralelo (rapido)</h3>
        <div class="space-y-1 text-sm text-agent-muted">
          <p>1. Lee archivos A, B, C <span class="text-agent-muted">(simultaneo)</span></p>
          <p>2. Espera todos los resultados...</p>
          <p>3. Analiza los 3 resultados juntos</p>
          <p class="text-agent-success font-bold mt-2">Total: ~500ms + 1 LLM turn</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Cuando NO usar parallel calls:</p>
      <p class="text-sm text-agent-muted">Cuando hay dependencias entre herramientas. Si necesitas LEER un archivo para saber que tests CORRER, no puedes ejecutarlos en paralelo. La planificacion debe identificar que es independiente y que es secuencial.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
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

  <!-- Quiz -->
  <section class="mb-10">
    {#if !showQuiz}
      <button onclick={() => showQuiz = true} class="btn-primary w-full justify-center">
        Comenzar el quiz (necesitas 80%+ para el badge)
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
      <p class="text-agent-muted">Ahora entiendes como funciona tool calling: el superpoder que convierte a un LLM pasivo en un agente que puede actuar en el mundo real.</p>
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
