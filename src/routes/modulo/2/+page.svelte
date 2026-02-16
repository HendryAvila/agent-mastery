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

    <h3 class="text-lg font-bold text-agent-text mb-3">Como funciona por dentro: el entrenamiento</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los LLMs no nacen sabiendo hacer function calling. Son <strong class="text-agent-highlight">entrenados especificamente</strong> para reconocer cuando una tarea requiere una herramienta y para generar JSON valido como output. Durante el entrenamiento, el modelo ve miles de ejemplos de conversaciones donde una pregunta lleva a una tool call, y la tool call devuelve un resultado que se incorpora a la respuesta final.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Tecnicamente, el modelo aprende a emitir tokens especiales que la infraestructura de la API interpreta como "esto es una tool call, no texto normal". Es como si el modelo aprendiera un segundo idioma: ademas de generar texto en lenguaje natural, puede generar instrucciones estructuradas en JSON. Los modelos mas recientes (Claude Opus 4.6, GPT-4o, Gemini 2.5) son extremadamente confiables en generar JSON valido, pero no siempre fue asi.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Antes de que existiera function calling nativo (pre-junio 2023), los desarrolladores usaban REGEX para extraer tool calls del texto del modelo. Le decian al LLM en el system prompt: "Cuando quieras ejecutar una herramienta, escribe ACTION: nombre_herramienta(argumentos)". Luego parseaban el texto con expresiones regulares para encontrar ese patron. Era fragil, propenso a errores, y una pesadilla de mantener. El function calling nativo fue un salto cuantico en confiabilidad.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anthropic vs OpenAI: diferencias de implementacion</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Aunque el concepto es el mismo, Anthropic y OpenAI implementan function calling de formas ligeramente diferentes:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Anthropic (Claude)</h4>
        <p class="text-xs text-agent-muted">Usa <strong class="text-agent-text">content blocks</strong> en la respuesta: una respuesta puede contener una mezcla de bloques de texto y bloques de <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_use</code>. Los resultados se envian como mensajes de tipo <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_result</code>. El modelo puede razonar en texto ANTES de emitir la tool call.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <h4 class="text-agent-warning font-bold text-sm mb-2">OpenAI (GPT)</h4>
        <p class="text-xs text-agent-muted">Usa un campo <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_calls</code> en el mensaje del asistente. Los resultados se envian como mensajes con role <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool</code>. Soporta "strict mode" que fuerza al modelo a adherirse exactamente al JSON Schema definido.</p>
      </div>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      La diferencia mas importante en la practica: Claude puede intercalar texto y tool calls en la misma respuesta, lo que permite "pensar en voz alta" mientras decide que herramienta usar. Esto es especialmente util para debugging: puedes ver el razonamiento del modelo antes de la accion.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Pensar que function calling es lo mismo que "plugins" o "integraciones". Los plugins son un concepto de PRODUCTO (una extension que agregas). Function calling es un mecanismo de INFRAESTRUCTURA: es como el LLM se comunica con el mundo exterior. Todos los plugins usan function calling por debajo, pero function calling es mucho mas que plugins.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El impacto de function calling en los agentes</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Function calling es lo que convirtio a los LLMs de "generadores de texto sofisticados" a "agentes capaces de actuar en el mundo". Sin function calling, un LLM solo puede darte instrucciones textuales de que hacer. Con function calling, el LLM puede HACER las cosas directamente (a traves de la aplicacion host).
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en la diferencia entre pedirle a alguien una receta de cocina por chat (solo texto) vs tener un robot en tu cocina que sigue las instrucciones automaticamente (function calling). La receta es util, pero el robot que ejecuta la receta es transformacionalmente diferente. Eso es exactamente lo que function calling habilita para los agentes.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">OpenAI lanzo function calling el 13 de junio de 2023. En las semanas siguientes, surgieron decenas de proyectos que usaban esta capacidad: agentes de codigo, asistentes de base de datos, bots de automatizacion. La comunidad estaba lista: tenia los modelos y las ideas, solo le faltaba el mecanismo estructurado para conectarlos. Function calling fue la pieza que faltaba del puzzle.</p>
    </div>
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

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Regla de oro:</p>
      <p class="text-sm text-agent-muted">Si un humano no puede entender CUANDO usar tu herramienta leyendo solo la descripcion, el LLM tampoco podra. Escribe las descripciones como si fueran documentacion para un nuevo desarrollador del equipo.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Herramientas reales: que usa Claude Code por dentro</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para que veas como se ven las tool definitions en un agente de produccion, estas son algunas de las herramientas reales que Claude Code usa internamente:
    </p>

    <div class="space-y-4 mb-6">
      <div class="bg-agent-dark border border-agent-border rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-agent-accent/10 border-b border-agent-accent/20">
          <span class="text-sm font-bold text-agent-accent">Read - Leer archivos</span>
        </div>
        {@html `<pre class="code-block rounded-none border-none text-xs">{
  "name": "Read",
  "description": "Reads a file from the local
    filesystem. Use when you need to see the
    contents of a file. Supports text files,
    images, and PDFs.",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "Absolute path to file"
      },
      "offset": {
        "type": "number",
        "description": "Line number to start"
      },
      "limit": {
        "type": "number",
        "description": "Number of lines to read"
      }
    },
    "required": ["file_path"]
  }
}</pre>`}
      </div>

      <div class="bg-agent-dark border border-agent-border rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-agent-success/10 border-b border-agent-success/20">
          <span class="text-sm font-bold text-agent-success">Bash - Ejecutar comandos</span>
        </div>
        {@html `<pre class="code-block rounded-none border-none text-xs">{
  "name": "Bash",
  "description": "Executes a bash command.
    Use for terminal operations like git,
    npm, running tests, etc. Working
    directory persists between calls.",
  "parameters": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The command to execute"
      },
      "timeout": {
        "type": "number",
        "description": "Timeout in ms (max 600000)"
      }
    },
    "required": ["command"]
  }
}</pre>`}
      </div>

      <div class="bg-agent-dark border border-agent-border rounded-lg overflow-hidden">
        <div class="px-4 py-2 bg-agent-warning/10 border-b border-agent-warning/20">
          <span class="text-sm font-bold text-agent-warning">Edit - Editar archivos</span>
        </div>
        {@html `<pre class="code-block rounded-none border-none text-xs">{
  "name": "Edit",
  "description": "Performs exact string
    replacements in files. The old_string
    must be UNIQUE in the file. Use replace_all
    for renaming variables across the file.",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "old_string": { "type": "string" },
      "new_string": { "type": "string" },
      "replace_all": {
        "type": "boolean",
        "default": false
      }
    },
    "required": ["file_path",
      "old_string", "new_string"]
  }
}</pre>`}
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Observa los patrones en estas definiciones reales: nombres claros y especificos (<code class="text-agent-highlight bg-agent-darker px-1 rounded">Read</code> no <code class="text-agent-highlight bg-agent-darker px-1 rounded">do_file_stuff</code>), descripciones que explican CUANDO usar la herramienta, y parametros con tipos claros y descripciones. Cada parametro <code class="text-agent-highlight bg-agent-darker px-1 rounded">required</code> esta explicitamente marcado.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">JSON Schema en profundidad</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las tool definitions usan <strong class="text-agent-highlight">JSON Schema</strong> para describir los parametros. Si no conoces JSON Schema, estos son los tipos fundamentales que necesitas:
    </p>
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

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Poner demasiadas herramientas confunde al LLM. Anthropic recomienda mantener el numero por debajo de ~20 herramientas por request. Si tienes 50 herramientas, agrupa las que se usan juntas y envia solo las relevantes al contexto actual. Cada herramienta que agregas es "ruido" que el modelo debe filtrar para elegir la correcta.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Las descriptions de las herramientas son tan importantes como el system prompt. El LLM usa las descriptions para decidir CUANDO usar cada herramienta. Si la description de <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code> dice "lee un archivo", y la de <code class="text-agent-highlight bg-agent-darker px-1 rounded">grep</code> dice "busca patrones en archivos", el modelo sabe que para encontrar donde se define una funcion debe usar grep, no leer todos los archivos uno por uno.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: El Flujo Completo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Flujo Completo de un Tool Call</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Vamos a seguir el viaje completo de un tool call, paso a paso. Esto es lo que sucede REALMENTE en la comunicacion entre tu aplicacion y la API del LLM:
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

    <h3 class="text-lg font-bold text-agent-text mb-3">El historial de mensajes: como se ve la conversacion completa</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Detras de bambalinas, la conversacion con tool calls se ve como una secuencia de mensajes con roles distintos. Entender esta estructura es fundamental para debuggear agentes:
    </p>
    {@html `<pre class="code-block text-xs mb-4">[
  // Mensaje 1: System prompt + tools
  { "role": "system", "content": "Eres un agente..." },

  // Mensaje 2: El usuario pide algo
  { "role": "user", "content": "Lee package.json" },

  // Mensaje 3: El LLM responde con tool call
  { "role": "assistant", "content": [
    { "type": "text", "text": "Voy a leer el archivo..." },
    { "type": "tool_use",
      "id": "call_001",
      "name": "read_file",
      "input": { "path": "package.json" }
    }
  ]},

  // Mensaje 4: Resultado de la herramienta
  { "role": "user", "content": [
    { "type": "tool_result",
      "tool_use_id": "call_001",
      "content": "{ \"dependencies\": { \"react\": \"19.1.0\" } }"
    }
  ]},

  // Mensaje 5: Respuesta final del LLM
  { "role": "assistant",
    "content": "El proyecto usa React 19.1.0" }
]</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Nota algo critico: el <strong class="text-agent-highlight">tool_result</strong> se envia como un mensaje del usuario. Desde la perspectiva del LLM, es como si el usuario respondiera con el resultado de la herramienta. Esto es importante porque cada tool call agrega DOS mensajes al historial (la solicitud + el resultado), consumiendo context window rapidamente.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Cada tool call en Claude Code consume tokens tanto en la solicitud (el JSON de la tool call) como en el resultado (el output de la herramienta). Si un archivo tiene 500 lineas, esas 500 lineas van al context window. Un agente que lee 20 archivos de 500 lineas cada uno ya consumio 10,000 lineas de contexto. Por eso las herramientas como Grep son tan valiosas: buscan patrones especificos sin cargar archivos enteros.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Conversaciones multi-turno: tool call chains</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      En la practica, un agente raramente hace UN solo tool call. La situacion tipica es una <strong class="text-agent-highlight">cadena de tool calls</strong> donde el resultado de una herramienta alimenta la decision de usar la siguiente. Veamos un ejemplo con 3 tool calls encadenados:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <ol class="space-y-3 text-sm text-agent-muted">
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC1:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">grep("useState", "*.tsx")</code> - Busca archivos que usen useState. Resultado: 5 archivos encontrados.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC2:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file("src/hooks/useAuth.tsx")</code> - Lee el archivo mas relevante. Resultado: contenido del archivo.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-agent-accent font-bold shrink-0">TC3:</span>
          <span><code class="text-agent-highlight bg-agent-darker px-1 rounded">edit("src/hooks/useAuth.tsx", old, new)</code> - Edita el bug encontrado. Resultado: archivo modificado.</span>
        </li>
      </ol>
      <p class="text-xs text-agent-accent mt-3">Cada tool call depende del resultado del anterior. El agente no puede leer un archivo sin saber cual leer, y no puede editar sin haber leido primero.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La separacion entre "solicitud" (el LLM genera JSON) y "ejecucion" (la app ejecuta la funcion) es un patron de arquitectura llamado <strong class="text-agent-text">Command Pattern</strong>. El LLM genera comandos, la aplicacion los ejecuta. Esto habilita validacion, logging, rate limiting, sandboxing, y control de permisos. Sin esta separacion, el LLM tendria acceso directo a tu sistema sin ninguna barrera de seguridad.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Parallel Tool Calls -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Parallel Tool Calls</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los modelos modernos pueden emitir <strong class="text-agent-highlight">multiples tool calls en una sola respuesta</strong> cuando las herramientas son independientes entre si. Esto es un multiplicador de rendimiento enorme.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Para entender POR QUE esto importa tanto, piensa en la latencia de un agente. Cada iteracion del agent loop tiene dos fuentes de latencia: el tiempo que tarda el LLM en generar la respuesta (~1-5 segundos) y el tiempo que tarda la herramienta en ejecutarse (~50ms a varios segundos). Si un agente necesita leer 5 archivos secuencialmente, son 5 iteraciones del loop, que significan 5 llamadas al LLM + 5 ejecuciones de herramientas. Con parallel calls, son 1 llamada al LLM + 5 ejecuciones simultaneas.
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
          <p class="text-xs text-agent-danger">+ 3x latencia de LLM (~9 seg)</p>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-success/30">
        <h3 class="text-agent-success font-bold mb-2">Paralelo (rapido)</h3>
        <div class="space-y-1 text-sm text-agent-muted">
          <p>1. Lee archivos A, B, C <span class="text-agent-muted">(simultaneo)</span></p>
          <p>2. Espera todos los resultados...</p>
          <p>3. Analiza los 3 resultados juntos</p>
          <p class="text-agent-success font-bold mt-2">Total: ~500ms + 1 LLM turn</p>
          <p class="text-xs text-agent-success">+ 1x latencia de LLM (~3 seg)</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como decide el LLM usar parallel calls</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El LLM no necesita que le digas explicitamente "usa parallel calls". El modelo analiza la tarea y determina si las herramientas que necesita son <strong class="text-agent-highlight">independientes</strong> entre si. Si le pides "lee los archivos package.json, tsconfig.json y README.md", el modelo entiende que estas tres lecturas no dependen una de la otra y emite los tres tool calls en una sola respuesta.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      En la API, esto se ve como una respuesta del assistant con multiples content blocks de tipo <code class="text-agent-highlight bg-agent-darker px-1 rounded">tool_use</code>. La aplicacion host recibe los tres, los ejecuta en paralelo (usando Promise.all, asyncio.gather, o similar), y devuelve los tres resultados al LLM en un solo mensaje.
    </p>

    {@html `<pre class="code-block text-xs mb-4">// El LLM emite 3 tool calls en una respuesta:
{ "role": "assistant", "content": [
  { "type": "text", "text": "Voy a leer los 3 archivos..." },
  { "type": "tool_use", "id": "tc_1",
    "name": "read_file",
    "input": { "path": "package.json" } },
  { "type": "tool_use", "id": "tc_2",
    "name": "read_file",
    "input": { "path": "tsconfig.json" } },
  { "type": "tool_use", "id": "tc_3",
    "name": "read_file",
    "input": { "path": "README.md" } }
]}

// La app ejecuta los 3 en paralelo y devuelve:
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "tc_1",
    "content": "contenido de package.json..." },
  { "type": "tool_result", "tool_use_id": "tc_2",
    "content": "contenido de tsconfig.json..." },
  { "type": "tool_result", "tool_use_id": "tc_3",
    "content": "contenido de README.md..." }
]}</pre>`}

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Claude Code usa parallel tool calls agresivamente. Cuando le pides "revisa el estado del proyecto", puede emitir simultaneamente: <code class="text-agent-highlight bg-agent-darker px-1 rounded">git status</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">git diff</code>, y <code class="text-agent-highlight bg-agent-darker px-1 rounded">git log</code>. Tres herramientas independientes ejecutadas en paralelo en lugar de secuencialmente. En tareas complejas, esto puede reducir el tiempo total del agente en un 50-70%.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Cuando NO usar parallel calls:</p>
      <p class="text-sm text-agent-muted">Cuando hay dependencias entre herramientas. Si necesitas LEER un archivo para saber que tests CORRER, no puedes ejecutarlos en paralelo. La planificacion del LLM debe identificar que es independiente y que es secuencial. Un buen modelo lo hace automaticamente: no va a poner un <code class="text-agent-highlight bg-agent-darker px-1 rounded">edit_file</code> en paralelo con el <code class="text-agent-highlight bg-agent-darker px-1 rounded">read_file</code> del mismo archivo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: MCP -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">MCP: El Futuro del Tool Calling</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-highlight">Model Context Protocol (MCP)</strong> es un estandar abierto creado por Anthropic que revoluciona la forma en que los agentes se conectan con herramientas. En lugar de que cada agente defina sus propias herramientas de forma propietaria, MCP establece un protocolo universal para que CUALQUIER agente se conecte a CUALQUIER servidor de herramientas.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en MCP como el "USB de los agentes IA". Antes de USB, cada dispositivo tenia su propio conector. Antes de MCP, cada agente tenia su propio formato de herramientas. Con MCP, un servidor de herramientas (por ejemplo, uno que se conecta a GitHub) puede ser usado por Claude Code, por Cursor, por Roo Code, y por cualquier agente que implemente el protocolo.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <h4 class="text-agent-danger font-bold text-sm mb-2">Sin MCP (antes)</h4>
        <p class="text-xs text-agent-muted">Cada agente implementa sus propias integraciones. Claude Code tiene su conector de GitHub, Cursor tiene el suyo, Roo Code el suyo. Si quieres soportar una nueva API, necesitas escribir la integracion para CADA agente por separado. N agentes x M servicios = N*M integraciones.</p>
      </div>
      <div class="bg-agent-dark border border-agent-success/30 rounded-lg p-4">
        <h4 class="text-agent-success font-bold text-sm mb-2">Con MCP (ahora)</h4>
        <p class="text-xs text-agent-muted">Un servidor MCP expone herramientas via protocolo estandar. CUALQUIER agente compatible se conecta. Escribes el servidor MCP de GitHub UNA vez y funciona en todos los agentes. N agentes + M servidores = N+M integraciones. Dramaticamente mas eficiente.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como funciona MCP en la practica</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      MCP sigue una arquitectura cliente-servidor. El agente (Claude Code, Cursor, etc.) es el <strong class="text-agent-text">cliente MCP</strong>. Las herramientas se exponen a traves de un <strong class="text-agent-text">servidor MCP</strong> que puede ejecutarse localmente o en la nube. El servidor anuncia sus herramientas disponibles, y el cliente las descubre automaticamente y las agrega a las tool definitions que envia al LLM.
    </p>

    {@html `<pre class="code-block text-xs mb-4">// Ejemplo: configuracion MCP en Claude Code
// archivo: .mcp.json
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
}</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Con esta configuracion, Claude Code automaticamente tiene acceso a herramientas de GitHub (crear PRs, leer issues, buscar repos) y PostgreSQL (consultar tablas, ejecutar queries) sin que nadie haya programado esas integraciones manualmente.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">En 2026, el ecosistema MCP tiene miles de servidores disponibles: bases de datos, APIs de SaaS, herramientas de DevOps, servicios de cloud, y mas. MCP paso de ser una propuesta de Anthropic a convertirse en un estandar de facto adoptado por la mayoria de agentes del mercado. Veremos MCP en detalle en el Modulo 4.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">MCP no reemplaza function calling: se construye ENCIMA de function calling. Los servidores MCP exponen herramientas que internamente se convierten en tool definitions JSON Schema. El LLM no sabe (ni le importa) si una herramienta viene de MCP o esta hardcodeada. Lo que cambia es como se DESCUBREN y DISTRIBUYEN las herramientas, no como el LLM las usa.</p>
    </div>
  </section>

  <!-- THEORY SECTION 6: Best Practices y Anti-patterns -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Best Practices y Anti-patterns</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Despues de ver como funciona tool calling, vamos a consolidar las mejores practicas y los errores mas comunes. Estos patrones vienen directamente de la experiencia de Anthropic, OpenAI, y la comunidad de desarrolladores de agentes.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 5 reglas del buen Tool Design</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-xs font-bold">1</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Nombres descriptivos y especificos</p>
          <p class="text-xs text-agent-muted"><code class="text-agent-highlight bg-agent-darker px-1 rounded">search_codebase</code> en vez de <code class="text-agent-danger bg-agent-darker px-1 rounded">search</code>. <code class="text-agent-highlight bg-agent-darker px-1 rounded">create_github_issue</code> en vez de <code class="text-agent-danger bg-agent-darker px-1 rounded">create</code>.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-xs font-bold">2</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Descripciones que explican CUANDO usar la herramienta</p>
          <p class="text-xs text-agent-muted">No solo QUE hace, sino CUANDO usarla. "Use when you need to find where a function is defined or used" es mejor que "Searches text".</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-xs font-bold">3</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Parametros con tipos estrictos y descripciones claras</p>
          <p class="text-xs text-agent-muted">Usa <code class="text-agent-highlight bg-agent-darker px-1 rounded">enum</code> para valores fijos, <code class="text-agent-highlight bg-agent-darker px-1 rounded">description</code> para cada parametro, y marca los <code class="text-agent-highlight bg-agent-darker px-1 rounded">required</code>.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-xs font-bold">4</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Una herramienta = una responsabilidad</p>
          <p class="text-xs text-agent-muted">No hagas mega-herramientas que hacen 10 cosas. Preferible 10 herramientas pequenas y especificas. El LLM elige mejor entre opciones claras.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-success/20 text-agent-success flex items-center justify-center text-xs font-bold">5</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Mensajes de error informativos en los resultados</p>
          <p class="text-xs text-agent-muted">Cuando una herramienta falla, devuelve un mensaje claro de POR QUE fallo. "File not found: /src/foo.ts" es infinitamente mejor que "Error".</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Los 5 anti-patterns del Tool Calling</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-xs font-bold">&#x2718;</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Mega-tools: una herramienta que hace todo</p>
          <p class="text-xs text-agent-muted"><code class="text-agent-danger bg-agent-darker px-1 rounded">manage_everything(action="read|write|delete|search", target="file|db|api")</code> obliga al LLM a generar parametros complejos en vez de elegir la herramienta correcta.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-xs font-bold">&#x2718;</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Tool spam: 50+ herramientas en un solo request</p>
          <p class="text-xs text-agent-muted">Cada herramienta consume tokens de contexto y confunde al modelo. Mantene el numero bajo 20. Si necesitas mas, filtra por contexto.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-xs font-bold">&#x2718;</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Descripciones vacias o genericas</p>
          <p class="text-xs text-agent-muted">"Does stuff" no le dice nada al LLM. "Searches" no dice QUE busca ni DONDE. Las descripciones son la documentacion del agente.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-xs font-bold">&#x2718;</span>
        <div>
          <p class="text-sm text-agent-text font-bold">No validar parametros en la ejecucion</p>
          <p class="text-xs text-agent-muted">El LLM puede generar parametros invalidos (paths inexistentes, numeros negativos). La app host DEBE validar antes de ejecutar.</p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <span class="shrink-0 w-6 h-6 rounded-full bg-agent-danger/20 text-agent-danger flex items-center justify-center text-xs font-bold">&#x2718;</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Resultados gigantes sin truncar</p>
          <p class="text-xs text-agent-muted">Si una herramienta devuelve 10,000 lineas, todo eso va al context window. Trunca o resume los resultados para no desperdiciar contexto.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El equipo de Claude Code descubrio que agregar descripciones detalladas a las herramientas internas mejoro la precision de seleccion de herramientas en un 30%+. La herramienta <code class="text-agent-highlight bg-agent-darker px-1 rounded">Grep</code> originalmente decia "Search for text". La nueva descripcion explica CUANDO usar Grep vs Read vs Glob: "Use Grep when you need to find files containing a specific pattern. Use Glob when you need to find files by name. Use Read when you already know which file to look at."</p>
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
