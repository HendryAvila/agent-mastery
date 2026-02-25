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

  const MODULE_ID = 3;
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
    const badge = courseStore.unlockBadge('ecosystem-explorer');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
    completed = true;
  }

  // InteractiveFlow: Claude Code Ecosystem + Broader Agent Map
  const flowNodes = [
    // Center: Claude Code as protagonist
    { id: 'claude-code', label: 'Claude Code', description: 'El agente protagonista de este curso. Basado en Claude Opus 4.6, el modelo de codigo mas potente disponible. Ofrece 4 superficies (CLI, VS Code, JetBrains, SDK), Agent Teams para trabajo paralelo, hooks para automatizacion, skills para contexto dinamico, y modo headless para CI/CD. Es el agente mas extensible y completo del ecosistema.', icon: '\u{1F7E3}', x: 50, y: 45 },
    // Claude Code surfaces
    { id: 'cc-cli', label: 'CLI (Terminal)', description: 'La superficie principal de Claude Code. Un proceso local que corre en tu terminal con acceso completo al filesystem, ejecucion de comandos, y gestion de Git. Potencia maxima: sin limites de la API de un editor. Perfecto para tareas complejas, refactoring masivo, y trabajo profundo.', icon: '\u{1F4BB}', x: 28, y: 20 },
    { id: 'cc-vscode', label: 'VS Code Extension', description: 'Claude Code integrado en VS Code como extension. Combina la potencia del agente CLI con la experiencia visual del editor: diffs inline, navegacion de archivos, y terminal integrado. Ideal para quienes quieren lo mejor de ambos mundos sin salir del IDE.', icon: '\u{1F4DD}', x: 72, y: 20 },
    { id: 'cc-sdk', label: 'SDK / API / Headless', description: 'Claude Code como plataforma programable. El SDK permite construir agentes custom. El modo headless (-p, --print) ejecuta tareas sin interaccion humana, perfecto para CI/CD con GitHub Actions. La API permite integracion con cualquier sistema.', icon: '\u{2699}\uFE0F', x: 50, y: 10 },
    // Key capabilities
    { id: 'agent-teams', label: 'Agent Teams', description: 'Lanza multiples instancias de Claude Code que trabajan en paralelo sobre el mismo codebase. Un team lead coordina, los teammates ejecutan subtareas. Ejemplo: un agente escribe tests mientras otro implementa la feature. Comunicacion via shared task list y filesystem.', icon: '\u{1F465}', x: 15, y: 50 },
    { id: 'mcp-hooks', label: 'MCP + Hooks + Skills', description: 'MCP conecta a servidores externos (Jira, GitHub, DBs). Hooks ejecutan scripts automaticamente antes/despues de acciones (PreToolUse, PostToolUse). Skills cargan contexto especializado bajo demanda. Juntos, hacen de Claude Code el agente mas extensible del mercado.', icon: '\u{1F9E9}', x: 85, y: 50 },
    // Other categories
    { id: 'cli-others', label: 'Otros CLI', description: 'OpenCode (Go, 100K+ estrellas, 75+ modelos, gratuito), Aider (Python, Git-native, codebase mapping). Alternativas open source solidas, especialmente si necesitas privacidad total con modelos locales o presupuesto $0.', icon: '\u{1F7E2}', x: 8, y: 80 },
    { id: 'ide-agents', label: 'Agentes IDE', description: 'Cursor (IDE propio, Background Agents, $20-40/mes), Roo Code (extension VS Code, custom modes, Apache 2.0), Cline/Kilo Code (el pionero y su fork con funding). Ofrecen experiencia visual con diffs inline, pero menor extensibilidad que los CLI.', icon: '\u{1F535}', x: 50, y: 82 },
    { id: 'autonomous', label: 'Agentes Autonomos', description: 'Devin ($500+/mes, entorno completo, controversial), OpenHands (MIT, Docker sandbox, 50%+ SWE-bench). Maxima autonomia pero con riesgo de error compounding: sin supervision, los errores se acumulan sin correccion.', icon: '\u{1F680}', x: 92, y: 80 },
  ];

  const flowEdges = [
    { from: 'claude-code', to: 'cc-cli', label: 'primary' },
    { from: 'claude-code', to: 'cc-vscode', label: 'visual' },
    { from: 'claude-code', to: 'cc-sdk', label: 'platform' },
    { from: 'claude-code', to: 'agent-teams', label: 'parallel' },
    { from: 'claude-code', to: 'mcp-hooks', label: 'extensible' },
    { from: 'claude-code', to: 'cli-others' },
    { from: 'claude-code', to: 'ide-agents' },
    { from: 'claude-code', to: 'autonomous' },
  ];

  const flowChallenges = [
    { question: 'Cual superficie de Claude Code usarias para integrarlo en un pipeline de CI/CD con GitHub Actions?', targetNodeId: 'cc-sdk', hint: 'Necesitas ejecucion sin interaccion humana, programatica.' },
    { question: 'Que capacidad permite lanzar multiples instancias de Claude Code trabajando en paralelo?', targetNodeId: 'agent-teams', hint: 'Un team lead coordina, los teammates ejecutan subtareas.' },
    { question: 'Donde encontrarias alternativas open source y gratuitas a Claude Code en la terminal?', targetNodeId: 'cli-others', hint: 'OpenCode y Aider son las opciones principales.' },
    { question: 'Que componente permite conectar Claude Code a servidores externos como Jira, GitHub, o bases de datos?', targetNodeId: 'mcp-hooks', hint: 'Es un protocolo estandar + scripts automaticos + contexto dinamico.' },
  ];

  // Quiz data
  const quizQuestions = [
    {
      question: 'Claude Code tiene 4 superficies. Si necesitas ejecutar una migracion masiva de base de datos que requiere acceso al filesystem, ejecucion de scripts SQL, y gestion de Git, cual superficie es la mas adecuada?',
      options: [
        { text: 'La extension de VS Code, porque necesitas ver los diffs visualmente', correct: false, explanation: 'Los diffs visuales son utiles pero no criticos para una migracion. La extension esta limitada por la API de VS Code para operaciones pesadas del filesystem.' },
        { text: 'El CLI (terminal), porque tiene acceso completo al filesystem, puede ejecutar cualquier comando, y no tiene las limitaciones de un editor', correct: true, explanation: 'Correcto. El CLI es la superficie principal y mas potente. Para tareas que requieren acceso profundo al sistema (scripts SQL, migraciones, Git), el CLI no tiene las restricciones de una extension de editor.' },
        { text: 'El SDK/API, porque es mas programable', correct: false, explanation: 'El SDK es para integracion programatica (CI/CD, apps). Para una tarea interactiva como una migracion con supervision humana, el CLI es mas apropiado.' },
        { text: 'Cualquiera de las 4 superficies funciona igual', correct: false, explanation: 'Cada superficie tiene trade-offs distintos. El CLI tiene acceso completo al SO; la extension tiene limites de la API de VS Code; el SDK es para automatizacion.' },
      ],
      source: 'Claude Code - Overview',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
    },
    {
      question: 'Un equipo evalua Claude Code vs OpenCode. El CTO dice: "OpenCode tiene 100K estrellas y es gratis, Claude Code es propietario y cuesta $100+/mes. No hay razon para pagar." Que le responderias?',
      options: [
        { text: 'Tiene razon: open source siempre es mejor', correct: false, explanation: 'Open source tiene ventajas (costo, transparencia, privacidad) pero "siempre mejor" es una generalizacion. La calidad del modelo subyacente importa enormemente.' },
        { text: 'El precio de Claude Code incluye acceso exclusivo a Opus 4.6 (mejor modelo de codigo) + Agent Teams + hooks/skills. OpenCode usa modelos de terceros cuyo costo y calidad varian. El trade-off real es calidad de razonamiento vs flexibilidad/costo.', correct: true, explanation: 'Exacto. Claude Code no es "solo una herramienta CLI" — incluye el mejor modelo de codigo (Opus 4.6) y un ecosistema de extensibilidad unico. OpenCode es excelente para flexibilidad y privacidad, pero la calidad de razonamiento depende del modelo que elijas.' },
        { text: 'Claude Code es mejor en todo, punto', correct: false, explanation: 'Claude Code tiene debilidades reales: costo alto, requiere comodidad con CLI, depende de Anthropic como proveedor unico. Ser honesto sobre trade-offs es mas util que fanboyismo.' },
        { text: 'Las estrellas de GitHub no significan nada', correct: false, explanation: 'Las estrellas reflejan interes comunitario, que correlaciona con documentacion, contribuciones, y adopcion. Son un indicador valido aunque no perfecto.' },
      ],
    },
    {
      question: 'Necesitas que Claude Code ejecute un linter automaticamente ANTES de cada commit que haga. Que mecanismo usarias?',
      options: [
        { text: 'Escribirlo en el system prompt: "siempre corre el linter antes de hacer commit"', correct: false, explanation: 'Los prompts son instrucciones "blandas" que el LLM puede ignorar. Necesitas una garantia ESTRUCTURAL, no una sugerencia.' },
        { text: 'Configurar un hook PreToolUse que intercepte la herramienta de bash antes de ejecutar git commit y corra el linter primero', correct: true, explanation: 'Correcto. Los hooks de Claude Code son scripts que se ejecutan AUTOMATICAMENTE en eventos especificos. Un hook PreToolUse con matcher para "git commit" te da garantia estructural: el linter corre siempre, sin depender de que el LLM "recuerde".' },
        { text: 'Usar Agent Teams: un agente hace commits y otro corre el linter', correct: false, explanation: 'Agent Teams es para paralelismo de tareas complejas, no para una validacion simple pre-commit. Un hook es la solucion correcta y mucho mas ligera.' },
        { text: 'Usar un Git hook normal (.git/hooks/pre-commit) y no involucrar a Claude Code', correct: false, explanation: 'Un Git hook normal funciona pero no le da feedback al agente. Con un hook de Claude Code, el agente VE el resultado del linter y puede corregir antes de reintentar.' },
      ],
      source: 'Claude Code - Hooks',
      sourceUrl: 'https://code.claude.com/docs/en/hooks'
    },
    {
      question: 'Tu companyero dice: "Cursor es mejor que Claude Code porque tiene interfaz grafica y Background Agents". Que matiz importante le falta?',
      options: [
        { text: 'Cursor no tiene IA, solo es un editor bonito', correct: false, explanation: 'Cursor absolutamente tiene IA integrada — es su propuesta de valor principal.' },
        { text: 'Claude Code y Cursor no son mutuamente excluyentes. Claude Code es extensible (hooks, skills, MCP, agent teams, headless) de formas que Cursor no soporta. Muchos devs usan AMBOS: Cursor para ediciones rapidas, Claude Code para tareas complejas y CI/CD.', correct: true, explanation: 'Exacto. Es un falso dilema. Claude Code no compite con Cursor — lo complementa. Cursor es excelente para la experiencia visual del dia a dia. Claude Code es superior para tareas complejas, automatizacion, y extensibilidad. Usar ambos es la combinacion mas productiva en 2026.' },
        { text: 'Claude Code tambien tiene interfaz grafica via la extension de VS Code', correct: false, explanation: 'La extension de VS Code de Claude Code existe, pero la comparacion del companyero era CLI vs IDE nativo. El punto clave es que no son mutuamente excluyentes.' },
        { text: 'Background Agents de Cursor son lo mismo que Agent Teams de Claude Code', correct: false, explanation: 'Son conceptos diferentes. Background Agents de Cursor trabajan en segundo plano dentro del IDE. Agent Teams de Claude Code son multiples procesos CLI independientes coordinados por un team lead.' },
      ],
      source: 'Claude Code - Best Practices',
      sourceUrl: 'https://code.claude.com/docs/en/best-practices'
    },
    {
      question: 'Una empresa necesita privacidad absoluta: ningun caracter de su codigo puede tocar servidores externos. Cual es la UNICA opcion viable y por que Claude Code queda descartado para este caso?',
      options: [
        { text: 'Claude Code con configuracion de privacidad activada', correct: false, explanation: 'Claude Code SIEMPRE se comunica con la API de Anthropic. No tiene modo offline ni soporte para modelos locales. La configuracion de privacidad no evita que el codigo viaje al servidor.' },
        { text: 'Cursor con plan Enterprise', correct: false, explanation: 'Cursor tambien envia codigo a servidores externos para procesarlo con IA. El plan Enterprise mejora la gestion pero no elimina la transferencia de datos.' },
        { text: 'OpenCode con un modelo local (Ollama/vLLM), porque todo se procesa en tu infraestructura sin que ningun dato salga de la red', correct: true, explanation: 'Correcto. OpenCode + modelo local es la unica combinacion donde CERO datos salen de tu red. Claude Code depende de la API de Anthropic (siempre cloud). Esto es una debilidad real de Claude Code que hay que reconocer honestamente.' },
        { text: 'Devin con contrato enterprise', correct: false, explanation: 'Devin opera en la nube de Cognition Labs. Tu codigo se ejecuta en sus servidores. Incompatible con privacidad absoluta.' },
      ],
      source: 'Faros AI - Best AI Coding Agents',
      sourceUrl: 'https://www.faros.ai/blog/best-ai-coding-agents-2026'
    },
  ];
</script>

<svelte:head>
  <title>Modulo 3: {mod.title} | Agent Mastery</title>
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

  <!-- THEORY SECTION 1: El Mapa del Ecosistema -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El mapa del ecosistema de agentes 2026</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El mercado de agentes de codigo en 2026 es un campo de batalla con decenas de herramientas compitiendo por la atencion de los desarrolladores. Cursor levanto $900M+, Cognition Labs (Devin) $175M, y el open source compite con cero funding pero miles de contribuidores. Para no perderte, necesitas un mapa mental claro.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      El ecosistema se organiza en <strong class="text-agent-highlight">tres categorias fundamentales</strong>, cada una con trade-offs distintos en control, experiencia visual, y autonomia:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card border-t-4 border-t-agent-accent">
        <h3 class="text-agent-accent font-bold mb-2">&#x1F4BB; CLI Agents</h3>
        <p class="text-sm text-agent-muted mb-2">Operan desde la terminal con acceso completo al SO. Maxima potencia y extensibilidad.</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li><strong class="text-agent-text">Claude Code</strong> — Anthropic, Opus 4.6</li>
          <li><strong class="text-agent-text">OpenCode</strong> — Go, 100K+ estrellas</li>
          <li><strong class="text-agent-text">Aider</strong> — Python, Git-native</li>
        </ul>
      </div>
      <div class="card border-t-4 border-t-blue-500">
        <h3 class="text-blue-400 font-bold mb-2">&#x1F4DD; IDE Agents</h3>
        <p class="text-sm text-agent-muted mb-2">Integrados en el editor. Experiencia visual con diffs inline y autocompletado.</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li><strong class="text-agent-text">Cursor</strong> — IDE propio, AI-native</li>
          <li><strong class="text-agent-text">Roo Code</strong> — VS Code ext, custom modes</li>
          <li><strong class="text-agent-text">Cline / Kilo Code</strong> — El pionero + fork</li>
        </ul>
      </div>
      <div class="card border-t-4 border-t-orange-500">
        <h3 class="text-orange-400 font-bold mb-2">&#x1F680; Agentes Autonomos</h3>
        <p class="text-sm text-agent-muted mb-2">Trabajan solos de principio a fin. Maxima autonomia, maximo riesgo.</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li><strong class="text-agent-text">Devin</strong> — Cognition Labs, $500+/mes</li>
          <li><strong class="text-agent-text">OpenHands</strong> — MIT, ex-OpenDevin</li>
          <li><strong class="text-agent-text">SWE-Agent</strong> — Princeton, research</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Este curso usa <strong class="text-agent-text">Claude Code como herramienta principal</strong>, pero te ensena los <strong class="text-agent-text">conceptos que son transferibles</strong> a cualquier agente: agent loop, tool calling, context engineering, guardrails. Si manana aparece un agente mejor, los conceptos que aprendes aqui siguen siendo validos. Las interfaces cambian; los principios no.</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      El patron mas comun en equipos de alto rendimiento en 2026 no es elegir UNO sino combinar: <strong class="text-agent-highlight">Claude Code para tareas complejas</strong> (refactoring, migraciones, debugging profundo, CI/CD) + <strong class="text-agent-highlight">un agente IDE para el dia a dia</strong> (ediciones rapidas, exploracion, code review visual). No son mutuamente excluyentes.
    </p>
  </section>

  <!-- THEORY SECTION 2: Claude Code — El Protagonista (60% of content) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Claude Code: el protagonista</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code es el agente de codigo de Anthropic. No es "otro agente CLI" — es una <strong class="text-agent-highlight">plataforma completa para desarrollo asistido por IA</strong> con multiples superficies de interaccion, un ecosistema de extensibilidad, y el modelo de codigo mas potente del mercado detras. Es el foco de este curso por razones tecnicas concretas que vamos a desglosar.
    </p>

    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-agent-accent font-bold text-lg mb-2">Claude Code no es solo un chat en tu terminal.</p>
      <p class="text-agent-muted text-sm">Es un agente completo con acceso al filesystem, ejecucion de comandos, gestion de Git, conexion a servicios externos via MCP, automatizacion via hooks, contexto especializado via skills, trabajo paralelo via agent teams, y ejecucion sin interaccion humana via headless mode. Todo impulsado por Claude Opus 4.6.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 4 superficies de Claude Code</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      A diferencia de la mayoria de agentes que tienen UNA interfaz, Claude Code ofrece <strong class="text-agent-highlight">4 formas de interactuar</strong> con el mismo motor, cada una optimizada para un contexto diferente:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-purple-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#x1F4BB;</span>
          <h4 class="text-agent-text font-bold">1. CLI (Terminal) — Superficie principal</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">El modo mas potente. Claude Code corre como un proceso local en tu terminal. Acceso completo al filesystem, ejecucion de cualquier comando del SO, gestion de Git. No hay limites impuestos por la API de un editor.</p>
        {@html `<pre class="code-block text-xs">$ claude
> Refactoriza el modulo de autenticacion para usar JWT
# Claude Code lee archivos, planifica, ejecuta cambios,
# corre tests, y commitea — todo desde tu terminal</pre>`}
      </div>
      <div class="card border-l-4 border-l-blue-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#x1F4DD;</span>
          <h4 class="text-agent-text font-bold">2. Extension VS Code</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">Claude Code integrado en VS Code. Combina la potencia del motor CLI con la experiencia visual del editor: diffs inline, navegacion de archivos, terminal integrado. Lo mejor de ambos mundos.</p>
        <p class="text-xs text-agent-muted">Ideal para quienes prefieren la retroalimentacion visual pero quieren la potencia de Claude Code. Usa el mismo motor y el mismo modelo.</p>
      </div>
      <div class="card border-l-4 border-l-indigo-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#x2699;&#xFE0F;</span>
          <h4 class="text-agent-text font-bold">3. Plugin JetBrains</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">Para equipos que usan IntelliJ, PyCharm, WebStorm u otros IDEs de JetBrains. Misma potencia de Claude Code dentro del ecosistema JetBrains.</p>
        <p class="text-xs text-agent-muted">Amplifica el alcance: no importa si tu equipo usa VS Code o JetBrains, todos pueden usar Claude Code.</p>
      </div>
      <div class="card border-l-4 border-l-green-500">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#x1F527;</span>
          <h4 class="text-agent-text font-bold">4. SDK / API / Headless</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">Claude Code como plataforma programable. El modo headless (<code class="text-agent-highlight bg-agent-darker px-1 rounded">-p</code>, <code class="text-agent-highlight bg-agent-darker px-1 rounded">--print</code>) ejecuta tareas sin interaccion. Perfecto para CI/CD: review automatico de PRs, migraciones, tests.</p>
        {@html `<pre class="code-block text-xs">$ claude -p "revisa este PR y sugiere mejoras" \\
    --allowedTools Read,Grep \\
    --max-turns 10</pre>`}
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">La GitHub Action oficial de Claude Code permite asignar issues y PRs directamente al agente. Configurando trigger phrases como <code class="text-agent-highlight bg-agent-darker px-1 rounded">@claude-code</code> en comentarios de PR, el agente revisa el codigo, sugiere cambios, o los implementa automaticamente. Equipos como incident.io reportan que corren 4-7 agentes concurrentes en paralelo usando git worktrees.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Capacidades que lo diferencian</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Lo que hace unico a Claude Code no es UNA feature sino la <strong class="text-agent-highlight">combinacion y profundidad del ecosistema completo</strong>. Veamos las capacidades principales:
    </p>

    <div class="space-y-4 mb-6">
      <!-- Context Window -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F4D0;</span>
          <h4 class="text-agent-text font-bold">Context window masivo: 200K tokens (1M en beta)</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">
          200K tokens equivalen a ~400 paginas de codigo. Eso significa que Claude Code puede tener en "mente" cientos de archivos simultaneamente, entender relaciones entre modulos distantes, y hacer refactoring que toca docenas de archivos con coherencia. El modo de 1M tokens (en beta) escala esto a codebases enterprise completos.
        </p>
        <p class="text-sm text-agent-muted">
          Pero atencion: mas contexto no siempre es mejor. Anthropic recomienda la <strong class="text-agent-text">regla del 60%</strong> — si usas mas del 60% del context window, la calidad empieza a degradarse. Por eso Claude Code implementa context compaction automatica y la estrategia just-in-time de cargar solo lo necesario.
        </p>
      </div>

      <!-- Sub-agents -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F465;</span>
          <h4 class="text-agent-text font-bold">Sub-agents y Agent Teams</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">
          Claude Code puede lanzar <strong class="text-agent-text">sub-agents</strong>: instancias secundarias con scope limitado para tareas especificas. Cada sub-agent tiene su propio contexto, no contamina al principal. Ejemplo: el agente principal lee 50 archivos buscando un patron, y lanza un sub-agent que solo ve los 3 archivos relevantes para hacer el cambio.
        </p>
        <p class="text-sm text-agent-muted">
          <strong class="text-agent-text">Agent Teams</strong> va mas alla: multiples instancias coordinadas trabajando en paralelo. Un team lead asigna tareas, los teammates ejecutan. Comparten filesystem pero tienen contextos independientes. Anthropic reporta equipos usando esto para compilar un compiler C de 100K lineas de Rust con 16 agentes simultaneos.
        </p>
      </div>

      <!-- Hooks -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F517;</span>
          <h4 class="text-agent-text font-bold">Hooks: automatizacion estructural</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">
          Los hooks son scripts que se ejecutan <strong class="text-agent-text">automaticamente</strong> en eventos especificos: antes de usar una herramienta (PreToolUse), despues de usar una herramienta (PostToolUse), al iniciar una sesion, o al recibir notificaciones. No dependen de que el LLM "recuerde" — son garantias estructurales.
        </p>
        <p class="text-sm text-agent-muted">
          Ejemplo practico: un hook PreToolUse que intercepta cualquier llamada a <code class="text-agent-highlight bg-agent-darker px-1 rounded">bash</code> con <code class="text-agent-highlight bg-agent-darker px-1 rounded">rm -rf</code> y la bloquea. No importa que tan convincente sea el razonamiento del LLM — el hook la bloquea SIEMPRE. Esto es seguridad por diseno, no por confianza.
        </p>
      </div>

      <!-- Skills -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F3AF;</span>
          <h4 class="text-agent-text font-bold">Skills: contexto especializado bajo demanda</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">
          Los skills son archivos Markdown (<code class="text-agent-highlight bg-agent-darker px-1 rounded">SKILL.md</code>) que Claude Code carga dinamicamente cuando detecta que la tarea lo requiere. Ejemplo: un skill de "React 19" que se activa automaticamente cuando editas un archivo .tsx. El skill contiene reglas, patrones, y convenciones que el agente debe seguir.
        </p>
        <p class="text-sm text-agent-muted">
          La clave es que los skills son <strong class="text-agent-text">just-in-time</strong>: solo se cargan cuando son relevantes, no ocupan contexto permanente. Puedes tener 50 skills en tu proyecto y Claude Code solo carga los 2-3 que aplican a la tarea actual.
        </p>
      </div>

      <!-- MCP -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F30D;</span>
          <h4 class="text-agent-text font-bold">MCP: conectividad universal</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">
          Model Context Protocol (MCP) es un estandar abierto creado por Anthropic que permite conectar Claude Code a <strong class="text-agent-text">cualquier servicio externo</strong>: Jira, GitHub, bases de datos, Slack, APIs internas. En lugar de que cada agente implemente integraciones propias (N*M problema), MCP estandariza la conexion: un servidor MCP para Jira funciona con cualquier cliente MCP.
        </p>
        <p class="text-sm text-agent-muted">
          En 2026, MCP ha sido adoptado por OpenAI, Google, y docenas de herramientas. Pero Claude Code fue el primero en implementarlo nativamente y sigue siendo el cliente con soporte mas maduro. La configuracion es simple: un JSON que declara los servidores disponibles.
        </p>
      </div>

      <!-- Headless -->
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold text-lg">&#x1F916;</span>
          <h4 class="text-agent-text font-bold">Headless mode: agente sin humano</h4>
        </div>
        <p class="text-sm text-agent-muted">
          Con el flag <code class="text-agent-highlight bg-agent-darker px-1 rounded">-p</code> (o <code class="text-agent-highlight bg-agent-darker px-1 rounded">--print</code>), Claude Code ejecuta una tarea sin ningun input interactivo. Esto lo hace ideal para CI/CD: review automatico de PRs, generacion de changelog, deteccion de vulnerabilidades, migraciones programadas. La GitHub Action oficial lo empaqueta para integracion directa en pipelines.
        </p>
      </div>
    </div>

    <!-- CLAUDE.md -->
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-accent font-bold text-lg">&#x1F4C4;</span>
        <h4 class="text-agent-text font-bold">CLAUDE.md: instrucciones persistentes por proyecto</h4>
      </div>
      <p class="text-sm text-agent-muted mb-2">
        Cada proyecto puede tener un archivo <code class="text-agent-highlight bg-agent-darker px-1 rounded">CLAUDE.md</code> en la raiz que Claude Code lee automaticamente al iniciar una sesion. Contiene reglas, convenciones, patrones, y contexto del proyecto. Es como un "onboarding document" para el agente: le explica como funciona TU proyecto, que patrones seguir, que evitar, y como comunicarse contigo.
      </p>
      <p class="text-sm text-agent-muted">
        La jerarquia de CLAUDE.md es poderosa: hay 6 niveles (user global, enterprise, project root, subdirectories, .claude/CLAUDE.md, e inline con <code class="text-agent-highlight bg-agent-darker px-1 rounded">/add-dir</code>). Cada nivel puede inyectar contexto. Esto es lo que diferencia "usar Claude Code" de "dominar Claude Code" — y es el tema completo del Modulo 4.
      </p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La combinacion de CLAUDE.md + hooks + skills + MCP es lo que hace de Claude Code una <strong class="text-agent-text">plataforma</strong> y no solo una herramienta. Puedes configurar un entorno donde el agente sigue tus convenciones (CLAUDE.md), ejecuta validaciones automaticas (hooks), carga contexto especializado (skills), y se conecta a tus servicios (MCP). Ningun otro agente ofrece este nivel de personalizacion.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El modelo detras: Claude Opus 4.6</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code esta impulsado por <strong class="text-agent-highlight">Claude Opus 4.6</strong>, el modelo mas potente de Anthropic y consistentemente el lider en benchmarks de codigo. Lo que hace a Opus 4.6 especial no es solo que escribe codigo — es que <strong class="text-agent-highlight">razona sobre codigo</strong> a un nivel que otros modelos no alcanzan:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Benchmark</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Que mide</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Opus 4.6</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">SWE-bench Verified</td>
            <td class="py-2 px-3">Resolver issues reales de repos de GitHub</td>
            <td class="py-2 px-3 text-agent-success font-bold">72.7% (lider)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Aider Polyglot</td>
            <td class="py-2 px-3">Editar codigo existente en multiples lenguajes</td>
            <td class="py-2 px-3 text-agent-success font-bold">#1 ranking</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Terminal-bench</td>
            <td class="py-2 px-3">Tareas complejas en terminal (Docker, Git, scripts)</td>
            <td class="py-2 px-3 text-agent-success font-bold">#1 ranking</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-text font-bold">Extended Thinking</td>
            <td class="py-2 px-3">Razonamiento profundo con "budget" de tokens</td>
            <td class="py-2 px-3 text-agent-accent">+54% mejora en tareas complejas (Think Tool)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Opus 4.6 no solo es bueno escribiendo codigo — es el mejor <strong class="text-agent-highlight">razonando sobre codigo</strong>. Puede analizar un codebase complejo, entender la arquitectura, identificar problemas, y proponer soluciones que respetan los patrones existentes. Esto es lo que separa a un agente que "genera codigo" de uno que "entiende tu proyecto".
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En el blog de Anthropic, describen como internamente usaron Claude Code con Agent Teams de 16 instancias para construir un compilador C a Rust de 100,000+ lineas. Cada agente tenia un sub-modulo asignado, trabajaban en paralelo via git worktrees, y un agente coordinador verificaba la coherencia. El resultado fue un compilador funcional que pasa miles de tests de conformidad.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Arquitectura: como funciona por dentro</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La arquitectura de Claude Code es elegante en su simplicidad:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-5 mb-6">
      <div class="space-y-3 text-sm text-agent-muted">
        <p><span class="text-agent-accent font-bold">1.</span> <strong class="text-agent-text">Tu terminal</strong> ejecuta el proceso <code class="text-agent-highlight bg-agent-darker px-1 rounded">claude</code> (Node.js/TypeScript)</p>
        <p><span class="text-agent-accent font-bold">2.</span> El proceso lee <strong class="text-agent-text">CLAUDE.md</strong> + settings + memoria para construir el system prompt</p>
        <p><span class="text-agent-accent font-bold">3.</span> Tu mensaje + contexto se envian a la <strong class="text-agent-text">API de Anthropic</strong> via HTTPS</p>
        <p><span class="text-agent-accent font-bold">4.</span> Opus 4.6 procesa y responde con <strong class="text-agent-text">texto + tool calls</strong></p>
        <p><span class="text-agent-accent font-bold">5.</span> Claude Code ejecuta las tool calls <strong class="text-agent-text">localmente en tu maquina</strong></p>
        <p><span class="text-agent-accent font-bold">6.</span> Los resultados se envian de vuelta al modelo &#x2192; <strong class="text-agent-text">loop hasta completar</strong></p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      El punto clave: <strong class="text-agent-highlight">las herramientas se ejecutan localmente</strong>. Claude Code lee tus archivos, ejecuta comandos, y edita codigo en TU maquina. Lo unico que viaja al servidor de Anthropic es el texto (tu prompt, el codigo relevante que el agente decide leer, y los resultados de las herramientas). El procesamiento de IA ocurre en la nube; la ejecucion ocurre local.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Modelo de precios</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-warning">
        <h4 class="text-agent-text font-bold text-sm mb-1">Max Personal</h4>
        <p class="text-2xl text-agent-warning font-bold mb-1">$100-200<span class="text-xs text-agent-muted font-normal">/mes</span></p>
        <p class="text-xs text-agent-muted">Uso ilimitado* dentro de fair use. Ideal para desarrolladores individuales que usan Claude Code intensivamente.</p>
      </div>
      <div class="card border-l-4 border-l-agent-accent">
        <h4 class="text-agent-text font-bold text-sm mb-1">Team</h4>
        <p class="text-2xl text-agent-accent font-bold mb-1">$30<span class="text-xs text-agent-muted font-normal">/usuario/mes</span></p>
        <p class="text-xs text-agent-muted">Para equipos. Incluye admin controls, SSO, y limites compartidos. Mas economico por persona.</p>
      </div>
      <div class="card border-l-4 border-l-agent-success">
        <h4 class="text-agent-text font-bold text-sm mb-1">API directa</h4>
        <p class="text-2xl text-agent-success font-bold mb-1">Pay-per-token</p>
        <p class="text-xs text-agent-muted">Pagas exactamente lo que consumes. Opus 4.6: $15/1M input tokens, $75/1M output tokens. Ideal para CI/CD headless.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Honestidad sobre el costo</p>
      <p class="text-sm text-agent-muted">Claude Code no es barato. $100-200/mes es significativo, especialmente para desarrolladores independientes o startups tempranas. Si tu presupuesto es limitado, OpenCode con un modelo mas economico (o local) es una alternativa solida. La calidad de razonamiento sera menor, pero el costo sera $0 por la herramienta. El trade-off es real y no hay que ignorarlo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Por que Claude Code es el foco -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Por que Claude Code es el foco de este curso</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      De todos los agentes disponibles, elegimos Claude Code como eje del curso por 5 razones tecnicas concretas. No es fanboyismo — es una evaluacion objetiva de cual herramienta cubre mejor el espectro de conceptos que necesitas aprender:
    </p>

    <div class="space-y-4 mb-6">
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold">1</div>
        <div>
          <h4 class="text-agent-text font-bold mb-1">El mas extensible</h4>
          <p class="text-sm text-agent-muted">Hooks (17 eventos, 3 tipos), Skills (contexto dinamico), Sub-agents (scope aislado), MCP (conectividad universal), Agent Teams (paralelismo), CLAUDE.md (instrucciones persistentes). Ningun otro agente ofrece tantos puntos de extension. Esto significa que cada concepto del curso se puede <strong class="text-agent-text">demostrar con una implementacion concreta</strong> en Claude Code.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold">2</div>
        <div>
          <h4 class="text-agent-text font-bold mb-1">El mejor documentado</h4>
          <p class="text-sm text-agent-muted"><a href="https://code.claude.com" class="text-agent-accent hover:underline">code.claude.com</a> tiene documentacion exhaustiva de cada feature, con ejemplos, best practices, y troubleshooting. Ademas, el blog de Anthropic Engineering publica articulos tecnicos profundos sobre como funciona por dentro. Esto permite aprender con fuentes primarias, no con tutoriales de terceros.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold">3</div>
        <div>
          <h4 class="text-agent-text font-bold mb-1">El modelo mas potente</h4>
          <p class="text-sm text-agent-muted">Opus 4.6 lidera consistentemente en SWE-bench, Aider Leaderboard, y Terminal-bench. Cuando ensenas conceptos como planning, razonamiento multi-paso, o context engineering, necesitas un modelo que pueda <strong class="text-agent-text">demostrar esas capacidades al maximo nivel</strong>. Con modelos menores, algunos conceptos avanzados simplemente no funcionan bien.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold">4</div>
        <div>
          <h4 class="text-agent-text font-bold mb-1">Ecosistema completo</h4>
          <p class="text-sm text-agent-muted">CLI + VS Code + JetBrains + SDK + Headless + Agent Teams = puedes cubrir TODOS los escenarios de uso. Desde un desarrollador solo en su terminal hasta un equipo enterprise con CI/CD automatizado. No necesitas saltar entre herramientas para demostrar diferentes conceptos.</p>
        </div>
      </div>
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-10 h-10 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold">5</div>
        <div>
          <h4 class="text-agent-text font-bold mb-1">Ritmo de desarrollo mas rapido</h4>
          <p class="text-sm text-agent-muted">Anthropic lanza actualizaciones para Claude Code constantemente: Agent Teams, skills, hooks mejorados, nuevos eventos, integracion JetBrains — todo en los ultimos meses. El ecosistema esta creciendo a un ritmo que las alternativas no igualan en 2026.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-2">Pero no somos ciegos:</p>
      <p class="text-sm text-agent-muted">Claude Code tiene debilidades reales. Es caro ($100-200/mes). Requiere comodidad con la terminal. Depende al 100% de Anthropic como proveedor (vendor lock-in). No soporta modelos locales (cero privacidad on-premise). Y su interfaz de terminal puede intimidar a desarrolladores acostumbrados a IDEs visuales. Estas debilidades importan y las abordamos honestamente en la comparacion.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Comparacion Honesta -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Comparacion honesta: CLI vs IDE vs Autonomo</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No existe "el mejor agente universal". Cada categoria tiene trade-offs fundamentales. Esta tabla compara las tres categorias de forma honesta, incluyendo donde Claude Code pierde:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 border-agent-accent/50">
            <th class="text-left py-3 px-3 text-agent-accent font-bold">Criterio</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">CLI (Claude Code)</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">IDE (Cursor/Roo)</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">Autonomo (Devin)</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Context window</td>
            <td class="py-3 px-3 text-agent-success">200K-1M tokens</td>
            <td class="py-3 px-3 text-agent-warning">32K-128K tipico</td>
            <td class="py-3 px-3 text-agent-warning">Variable</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Extensibilidad</td>
            <td class="py-3 px-3 text-agent-success">Maxima (hooks, skills, MCP, sub-agents)</td>
            <td class="py-3 px-3 text-agent-warning">Media (custom modes en Roo)</td>
            <td class="py-3 px-3 text-agent-danger">Baja (caja negra)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Autonomia</td>
            <td class="py-3 px-3 text-agent-warning">Media (human-in-the-loop)</td>
            <td class="py-3 px-3 text-agent-warning">Baja-Media</td>
            <td class="py-3 px-3 text-agent-success">Alta (trabaja solo)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Costo mensual</td>
            <td class="py-3 px-3 text-agent-danger">$100-200 (Max)</td>
            <td class="py-3 px-3 text-agent-success">$0-40</td>
            <td class="py-3 px-3 text-agent-danger">$500+</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Curva de aprendizaje</td>
            <td class="py-3 px-3 text-agent-danger">Alta (terminal requerido)</td>
            <td class="py-3 px-3 text-agent-success">Baja (visual)</td>
            <td class="py-3 px-3 text-agent-success">Baja (le das la tarea)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Feedback visual</td>
            <td class="py-3 px-3 text-agent-danger">Limitado (texto)</td>
            <td class="py-3 px-3 text-agent-success">Excelente (diffs inline)</td>
            <td class="py-3 px-3 text-agent-danger">Minimo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">CI/CD nativo</td>
            <td class="py-3 px-3 text-agent-success">Si (headless + GitHub Action)</td>
            <td class="py-3 px-3 text-agent-danger">No</td>
            <td class="py-3 px-3 text-agent-warning">Limitado</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent font-bold">Privacidad on-premise</td>
            <td class="py-3 px-3 text-agent-danger">No (cloud obligatorio)</td>
            <td class="py-3 px-3 text-agent-warning">Parcial (Roo + local)</td>
            <td class="py-3 px-3 text-agent-danger">No</td>
          </tr>
          <tr>
            <td class="py-3 px-3 text-agent-accent font-bold">Mejor caso de uso</td>
            <td class="py-3 px-3">Tareas complejas, refactoring, CI/CD, multi-agent</td>
            <td class="py-3 px-3">Edicion rapida, exploracion, code review visual</td>
            <td class="py-3 px-3">Features completas de bajo riesgo, prototipos</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">Las debilidades reales de Claude Code</p>
      <ul class="text-sm text-agent-muted space-y-1 mt-2">
        <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> <strong class="text-agent-text">Costo:</strong> $100-200/mes es 5x mas que Cursor y infinitamente mas que herramientas open source gratuitas</li>
        <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> <strong class="text-agent-text">Terminal obligatorio:</strong> Si no te sientes comodo en la terminal, la curva de aprendizaje es empinada</li>
        <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> <strong class="text-agent-text">Vendor lock-in:</strong> 100% atado a Anthropic. Si sus servidores caen, no puedes trabajar</li>
        <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> <strong class="text-agent-text">Sin privacidad local:</strong> Tu codigo SIEMPRE viaja al servidor de Anthropic para procesamiento</li>
        <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> <strong class="text-agent-text">Sin modelo local:</strong> No puedes usar Ollama, vLLM, ni ningun modelo on-premise</li>
      </ul>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Donde Claude Code gana claramente</p>
      <ul class="text-sm text-agent-muted space-y-1 mt-2">
        <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> <strong class="text-agent-text">Extensibilidad:</strong> Hooks + Skills + MCP + Sub-agents + Agent Teams. Ningun competidor se acerca</li>
        <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> <strong class="text-agent-text">Modelo:</strong> Opus 4.6 es el mejor modelo de codigo disponible, punto</li>
        <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> <strong class="text-agent-text">CI/CD:</strong> Headless mode + GitHub Action = el unico agente con integracion CI/CD madura</li>
        <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> <strong class="text-agent-text">Contexto:</strong> 200K-1M tokens. Los agentes IDE operan con 32K-128K tipicamente</li>
        <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> <strong class="text-agent-text">Documentacion:</strong> code.claude.com + blog de Anthropic = las mejores docs del ecosistema</li>
      </ul>
    </div>
  </section>

  <!-- Practical comparison by tool -->
  <section class="mb-10 fade-in">
    <h3 class="text-lg font-bold text-agent-text mb-3">Tabla comparativa por herramienta</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Mas alla de las categorias, aqui tienes la comparacion directa herramienta por herramienta para los agentes mas relevantes:
    </p>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-2 text-agent-accent font-bold">Agente</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Tipo</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Licencia</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Costo</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Feature unica</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50 bg-agent-accent/5">
            <td class="py-2 px-2 text-agent-accent font-bold">Claude Code</td>
            <td class="py-2 px-2">CLI + IDE + SDK</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">$100-200/mes</td>
            <td class="py-2 px-2">Agent Teams, hooks, skills, MCP, headless</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">OpenCode</td>
            <td class="py-2 px-2">CLI</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">Gratis + API key</td>
            <td class="py-2 px-2">75+ modelos, Go speed, LSP, privacidad total</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Aider</td>
            <td class="py-2 px-2">CLI</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">Gratis + API key</td>
            <td class="py-2 px-2">Git-native (cada cambio = commit), repo maps</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Cursor</td>
            <td class="py-2 px-2">IDE propio</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">$0-40/mes</td>
            <td class="py-2 px-2">Background Agents, Composer, Tab completion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Roo Code</td>
            <td class="py-2 px-2">VS Code ext.</td>
            <td class="py-2 px-2">Apache 2.0</td>
            <td class="py-2 px-2">Gratis + API key</td>
            <td class="py-2 px-2">Custom modes, MCP, se instala en TU VS Code</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Devin</td>
            <td class="py-2 px-2">Autonomo</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">$500+/mes</td>
            <td class="py-2 px-2">Entorno completo, Slack integration</td>
          </tr>
          <tr>
            <td class="py-2 px-2 text-agent-text font-bold">OpenHands</td>
            <td class="py-2 px-2">Autonomo</td>
            <td class="py-2 px-2">MIT</td>
            <td class="py-2 px-2">Gratis + API key</td>
            <td class="py-2 px-2">Docker sandbox, 50%+ SWE-bench</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El patron mas comun en equipos productivos de 2026: <strong class="text-agent-text">Claude Code para tareas complejas</strong> (refactoring, migraciones, CI/CD, debugging profundo) + <strong class="text-agent-text">Roo Code o Cursor para el dia a dia</strong> (ediciones rapidas, exploracion, review visual). El costo combinado es menor que Devin y la productividad es comparable o superior, porque tienes supervision humana en cada paso.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: CLI vs IDE — Cuando Usar Cada Uno -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">CLI vs IDE: cuando usar cada uno</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La respuesta honesta es: <strong class="text-agent-highlight">depende de la tarea</strong>. No es "Claude Code siempre" — es saber cuando cada herramienta brilla. Aqui va la guia practica:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-purple-500">
        <h3 class="text-agent-text font-bold mb-3">Usa Claude Code CLI cuando...</h3>
        <ul class="space-y-2 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Refactoring que toca 20+ archivos</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Migraciones de base de datos o dependencias</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Debugging que requiere correr tests, leer logs, y modificar codigo</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Configurar CI/CD, Docker, infraestructura</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Tareas que necesitan acceso completo al SO</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Cuando necesitas hooks o skills especializados</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent">&#x2192;</span> Agent Teams para trabajo paralelo</li>
        </ul>
      </div>
      <div class="card border-l-4 border-l-blue-500">
        <h3 class="text-agent-text font-bold mb-3">Usa un IDE agent cuando...</h3>
        <ul class="space-y-2 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Ediciones rapidas en 1-3 archivos</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Necesitas ver diffs visualmente antes de aceptar</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Exploracion del codigo ("explicame esta funcion")</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Code review con contexto visual</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Autocompletado inteligente mientras escribes</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Cuando la terminal te intimida (aun)</li>
          <li class="flex items-start gap-2"><span class="text-blue-400">&#x2192;</span> Presupuesto limitado (Roo Code es gratis)</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-5 mb-6">
      <h4 class="text-agent-accent font-bold mb-2">La extension de VS Code de Claude Code: lo mejor de ambos mundos</h4>
      <p class="text-sm text-agent-muted mb-2">
        Si no puedes decidir entre CLI e IDE, la extension de VS Code de Claude Code te da la potencia del motor CLI dentro de tu editor. Tienes diffs visuales, terminal integrado, y acceso a todas las capacidades de Claude Code (hooks, skills, MCP) desde VS Code.
      </p>
      <p class="text-sm text-agent-muted">
        La diferencia con Cursor: Cursor es un IDE DIFERENTE (tienes que migrar). La extension de Claude Code se instala en TU VS Code existente, con todas tus extensiones, keybindings, y configuracion intactas.
      </p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El patron mas productivo en 2026 es <strong class="text-agent-text">"CLI para construir, IDE para explorar"</strong>. Usas Claude Code CLI para implementar features complejas, y tu editor favorito (con o sin agente IDE) para navegar el resultado, hacer ajustes finos, y revisar. No es un OR — es un AND.</p>
    </div>
  </section>

  <!-- THEORY SECTION 6: Tendencias 2026 -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Tendencias del ecosistema 2026</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El ecosistema de agentes esta evolucionando a una velocidad vertiginosa. Estas son las tendencias que definen el mercado en 2026 y que determinaran las herramientas de 2027:
    </p>

    <div class="space-y-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <h4 class="text-agent-text font-bold mb-2">&#x1F465; Multi-agent y Agent Teams</h4>
        <p class="text-sm text-agent-muted">La tendencia mas clara: de un agente a multiples agentes coordinados. Claude Code lo implementa con Agent Teams. Anthropic publico su Multi-Agent Research System con 90.2% de mejora sobre single-agent. Google, OpenAI, y AWS tambien tienen frameworks multi-agent. El 2026 es el ano donde "un agente solo no es suficiente" se volvio consenso.</p>
      </div>

      <div class="card border-l-4 border-l-green-500">
        <h4 class="text-agent-text font-bold mb-2">&#x1F916; Headless y CI/CD nativo</h4>
        <p class="text-sm text-agent-muted">Los agentes dejan de ser solo herramientas interactivas y se convierten en componentes de infraestructura. Claude Code con GitHub Actions puede revisar PRs, generar tests, y hacer migraciones sin intervencion humana. incident.io reporta que sus pipelines con agentes headless redujeron el tiempo de review de PRs en un 60%.</p>
      </div>

      <div class="card border-l-4 border-l-orange-500">
        <h4 class="text-agent-text font-bold mb-2">&#x1F30D; MCP como estandar universal</h4>
        <p class="text-sm text-agent-muted">Model Context Protocol empezo como una iniciativa de Anthropic pero en 2026 fue adoptado por OpenAI, Google, y docenas de herramientas. Se esta convirtiendo en el "USB de los agentes": un conector universal que conecta cualquier agente con cualquier servicio. El ecosistema de servidores MCP crece semanalmente.</p>
      </div>

      <div class="card border-l-4 border-l-purple-500">
        <h4 class="text-agent-text font-bold mb-2">&#x1F504; Convergencia CLI + IDE</h4>
        <p class="text-sm text-agent-muted">La linea entre CLI e IDE se desdibuja. Claude Code lanza extension de VS Code y JetBrains. Cursor integra terminal. Los agentes del futuro seran "surface-agnostic": el mismo motor con multiples interfaces. La eleccion sera interfaz, no motor.</p>
      </div>

      <div class="card border-l-4 border-l-yellow-500">
        <h4 class="text-agent-text font-bold mb-2">&#x1F4B0; Deflacion de costos</h4>
        <p class="text-sm text-agent-muted">Los costos de inferencia caen ~10x cada 18 meses. Lo que hoy cuesta $200/mes, en 2 anos podria costar $20/mes. OpenCode y los modelos open source (Llama, Qwen, DeepSeek) se acercan a la calidad de modelos propietarios. La barrera de entrada economica se reduce constantemente.</p>
      </div>

      <div class="card border-l-4 border-l-red-500">
        <h4 class="text-agent-text font-bold mb-2">&#x1F6E1;&#xFE0F; Seguridad como first-class citizen</h4>
        <p class="text-sm text-agent-muted">Con agentes ejecutando comandos en produccion, la seguridad dejo de ser opcional. Claude Code implementa permisos granulares (allow/ask/deny), sandbox, y hooks como guardrails. OWASP publico el Top 10 para LLM Applications. El mercado demanda herramientas que sean potentes PERO seguras.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">GitHub Copilot evoluciono de autocompletar lineas (2021) a agente completo (2025) a multi-agent con Copilot Workspace (2026). La misma evolucion que vimos con ChatGPT &#x2192; GPT Actions &#x2192; Agent SDK. La tendencia es clara: todo se mueve hacia agentes con mayor autonomia, pero con controles de seguridad mas sofisticados.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">En 2026, se estima que mas del 40% del codigo en produccion esta siendo asistido o generado por agentes de IA. Pero la clave es "asistido": el humano sigue siendo responsable de la arquitectura, las decisiones de diseno, y la revision final. Los agentes no reemplazan al desarrollador — amplifican su capacidad. Y eso es exactamente lo que este curso te ensena a dominar.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Lo que NO va a cambiar</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      En medio de toda esta evolucion, hay principios que permanecen constantes. Estos son los que este curso prioriza:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold mb-1">El agent loop sigue siendo observe-think-act</p>
        <p class="text-xs text-agent-muted">Todos los agentes, de cualquier tipo, siguen este patron fundamental. Es lo primero que aprendiste en el Modulo 1 y seguira siendo relevante dentro de 10 anos.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold mb-1">Tool calling es el mecanismo universal</p>
        <p class="text-xs text-agent-muted">Todos los agentes usan function calling para interactuar con el mundo. Las interfaces cambian, pero el JSON Schema subyacente no. Lo que aprendiste en el Modulo 2 aplica a cualquier agente.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold mb-1">Context engineering determina la calidad</p>
        <p class="text-xs text-agent-muted">El input que le das al agente determina la calidad del output. Esto es verdad para Claude Code, OpenCode, Cursor, o cualquier herramienta futura. Un buen CLAUDE.md hoy sera un buen "config file" manana.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold mb-1">La supervision humana sigue siendo critica</p>
        <p class="text-xs text-agent-muted">Los agentes autonomos mejoran, pero la supervision humana sigue siendo la mejor defensa contra error compounding. El humano que entiende los conceptos es insustituible.</p>
      </div>
    </div>

    <div class="bg-agent-dark border-2 border-agent-accent/30 rounded-lg p-5">
      <p class="text-agent-accent font-bold text-lg mb-2">El mensaje central de este modulo:</p>
      <p class="text-agent-muted text-sm">Aprende los <strong class="text-agent-text">conceptos</strong> (agent loop, tool calling, context engineering, guardrails) y podras usar <strong class="text-agent-text">cualquier herramienta</strong>. Practicamos con Claude Code porque es la mas completa, pero si manana usas OpenCode, Cursor, o una herramienta que aun no existe, los fundamentos que aprendes aqui seguiran siendo validos. Las interfaces son temporales; los principios son permanentes.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el ecosistema interactivo de Claude Code
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Claude Code y el Ecosistema de Agentes 2026"
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
      <span class="text-4xl block mb-3">&#x1F310;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ahora entiendes el ecosistema completo y por que Claude Code es el protagonista de este curso. Conoces sus fortalezas, sus debilidades, y cuando usar cada tipo de agente.</p>
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
