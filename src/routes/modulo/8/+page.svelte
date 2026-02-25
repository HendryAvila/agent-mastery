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

  const MODULE_ID = 8;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let showQuiz = $state(false);
  let showFlow = $state(false);

  courseStore.startModule(MODULE_ID);

  // ─── InteractiveFlow: .claude/ Ecosystem ───
  const flowNodes = [
    { id: 'dotclaude', label: '.claude/', description: 'El directorio raiz de configuracion de Claude Code. Vive en la raiz de tu proyecto (o en ~/). Contiene settings.json, agents/, skills/, commands/ y rules/. Es el equivalente a un .vscode/ o .github/ pero para tu agente IA. Todo lo que define como se comporta Claude Code en tu proyecto esta aqui.', icon: '\u{1F4C1}', x: 50, y: 10 },
    { id: 'settings', label: 'settings.json', description: 'El archivo de configuracion central. Define permisos (allow/ask/deny con patrones glob), variables de entorno, MCP servers, y la configuracion de hooks. Existe en 3 niveles: proyecto (.claude/settings.json), local (.claude/settings.local.json gitignored), y usuario (~/.claude/settings.json). Los niveles se fusionan con precedencia local > proyecto > usuario.', icon: '\u2699\uFE0F', x: 15, y: 30 },
    { id: 'hooks', label: 'Hooks System', description: 'El sistema de extension mas poderoso de Claude Code. 17 eventos (PreToolUse, PostToolUse, Notification, Stop, SubAgentStop, etc.) con 3 tipos de handler: command (ejecuta shell, stdout vuelve como contexto), prompt (envia a modelo como turno de usuario), agent (lanza sub-agente). Exit code 2 = BLOQUEAR la accion. Matchers filtran por nombre de herramienta con regex.', icon: '\u{1F517}', x: 85, y: 30 },
    { id: 'skills', label: 'Skills', description: 'Expertise empaquetada en archivos SKILL.md con frontmatter YAML. Campos: name, description, user-invocable, disable-model-invocation, keep-context-instructions. Se invocan con /nombre o automaticamente por el modelo. Soportan contexto dinamico: $ARGUMENTS para input del usuario y `comando` (backticks) para inyectar output de shell en tiempo de carga.', icon: '\u{1F4DA}', x: 15, y: 65 },
    { id: 'agents', label: 'Sub-Agents', description: 'Agentes dentro del agente, definidos en .claude/agents/. Built-in: Explore (Haiku, read-only, rapido y barato), Plan (hereda modelo, read-only, para arquitectura), general-purpose (todas las tools). Custom: archivo .md con frontmatter (model, allowed-tools, description) y body como system prompt. Cada sub-agente tiene su propio contexto aislado.', icon: '\u{1F916}', x: 85, y: 65 },
    { id: 'permissions', label: 'Permisos', description: 'Modelo de seguridad de 3 niveles: allow (auto-ejecutar), ask (preguntar al usuario), deny (nunca permitir). Sintaxis: ToolName(pattern) con globs. Ejemplo: Bash(npm test) permite solo npm test. Edit("src/**/*.ts") permite editar solo TypeScript en src/. Resultado: 84% menos prompts de permisos con sandbox bien configurado.', icon: '\u{1F512}', x: 50, y: 50 },
    { id: 'headless', label: 'Headless Mode', description: 'Claude Code sin interfaz, para CI/CD. claude -p "query" ejecuta un solo prompt y sale. Flags: --output-format text|json|stream-json, --max-turns N, --allowedTools tool1,tool2, --max-budget-usd N. Ideal para GitHub Actions, pipelines automatizados, y automatizacion de tareas recurrentes.', icon: '\u{1F4DF}', x: 50, y: 85 },
    { id: 'commands', label: 'Commands', description: 'Slash commands simples definidos en .claude/commands/. Cada archivo .md es un template de prompt. El usuario escribe /nombre y el contenido se inyecta como prompt. Mas simple que skills: no tienen frontmatter complejo ni contexto dinamico. Ideal para acciones frecuentes y repetitivas como /review, /test, /deploy.', icon: '\u{1F4AC}', x: 30, y: 85 },
    { id: 'rules', label: 'Rules', description: 'Reglas path-specific en .claude/rules/. Cada archivo .md tiene frontmatter YAML con globs que definen a que archivos aplica. Cuando Claude Code edita un archivo que matchea el glob, las reglas se inyectan automaticamente como contexto. Ideal para convenciones por carpeta: "en src/api/ siempre usa Zod para validacion".', icon: '\u{1F4CF}', x: 70, y: 85 }
  ];

  const flowEdges = [
    { from: 'dotclaude', to: 'settings', label: 'Configuracion' },
    { from: 'dotclaude', to: 'hooks', label: 'Eventos' },
    { from: 'settings', to: 'permissions', label: 'Define permisos' },
    { from: 'settings', to: 'hooks', label: 'Configura hooks' },
    { from: 'hooks', to: 'agents', label: 'Puede lanzar' },
    { from: 'hooks', to: 'skills', label: 'Puede invocar' },
    { from: 'permissions', to: 'agents', label: 'Gate de seguridad' },
    { from: 'permissions', to: 'headless', label: 'Restringe tools' },
    { from: 'agents', to: 'skills', label: 'Usan skills' },
    { from: 'dotclaude', to: 'commands', label: 'Slash commands' },
    { from: 'dotclaude', to: 'rules', label: 'Path rules' }
  ];

  const flowChallenges = [
    { question: 'Quieres que Claude Code auto-formatee el codigo cada vez que edita un archivo. Que componente del ecosistema usas?', targetNodeId: 'hooks', hint: 'Necesitas reaccionar a un evento (PostToolUse en Edit/Write) y ejecutar un comando shell.' },
    { question: 'Tu equipo tiene convenciones diferentes para src/api/ (usa Zod) y src/components/ (usa Svelte 5 runes). Donde defines esas convenciones path-specific?', targetNodeId: 'rules', hint: 'Necesitas reglas que se apliquen solo cuando Claude Code toca archivos en paths especificos.' },
    { question: 'Necesitas que Claude Code pueda ejecutar npm test pero NO npm publish. Donde configuras esto?', targetNodeId: 'permissions', hint: 'El sistema que define allow/ask/deny con patrones de herramientas.' },
    { question: 'Quieres empaquetar tu framework de testing como expertise reutilizable que cualquier developer del equipo pueda invocar con un slash command. Que sistema usas?', targetNodeId: 'skills', hint: 'Expertise encapsulada con frontmatter YAML, invocable por el usuario o por el modelo automaticamente.' },
    { question: 'Necesitas ejecutar Claude Code en un GitHub Action para revisar PRs automaticamente, sin interfaz de usuario. Que modo usas?', targetNodeId: 'headless', hint: 'El modo que permite ejecutar Claude Code desde la terminal con -p y flags de control.' }
  ];

  // ─── Quiz: Claude Code Deep Dive ───
  const quizQuestions = [
    {
      question: 'Configuras un hook PreToolUse para el evento Bash. El script del hook hace una validacion y sale con exit code 2. Que sucede?',
      options: [
        { text: 'Claude Code procede normalmente y agrega el stdout del hook como contexto adicional', correct: false, explanation: 'Exit code 0 es el que permite proceder normalmente con stdout como contexto. Exit code 2 tiene un comportamiento completamente diferente.' },
        { text: 'Claude Code BLOQUEA la ejecucion del comando Bash. La accion no se ejecuta y el modelo recibe una notificacion de bloqueo', correct: true, explanation: 'Correcto! Exit code 2 es el mecanismo de seguridad critico de los hooks: BLOQUEA la accion. Es asi como puedes prevenir que Claude Code toque archivos protegidos, ejecute comandos peligrosos, o acceda a paths sensibles. Exit 0 = proceder, Exit 2 = bloquear.' },
        { text: 'Claude Code reinicia la sesion y vuelve a intentar la accion', correct: false, explanation: 'Los hooks no reinician sesiones. Son interceptores que permiten (exit 0) o bloquean (exit 2) acciones especificas.' },
        { text: 'El hook falla silenciosamente y Claude Code ignora el resultado', correct: false, explanation: 'Los exit codes de hooks nunca se ignoran. Son parte critica del flujo de control. Un exit code no reconocido se trata como error, no como silencioso.' }
      ],
      source: 'Claude Code - Hooks Reference',
      sourceUrl: 'https://code.claude.com/docs/en/hooks'
    },
    {
      question: 'Necesitas crear un SKILL.md que el usuario pueda invocar con /deploy pero que el modelo NO pueda invocar automaticamente. Cual es el frontmatter correcto?',
      codeBlock: 'Opcion A:\n---\nname: deploy\ndescription: Deploy to production\nuser-invocable: true\ndisable-model-invocation: true\n---\n\nOpcion B:\n---\nname: deploy\ndescription: Deploy to production\nuser-invocable: false\ndisable-model-invocation: false\n---\n\nOpcion C:\n---\nname: deploy\ndescription: Deploy to production\nallow-model-invocation: false\nuser-command: /deploy\n---',
      options: [
        { text: 'Opcion A: user-invocable: true + disable-model-invocation: true', correct: true, explanation: 'Correcto! user-invocable: true permite al usuario escribir /deploy. disable-model-invocation: true impide que el modelo lo invoque por su cuenta. Esta combinacion es ideal para acciones sensibles como deploy: quieres que el humano decida cuando ejecutarlo, no que el agente lo haga autonomamente.' },
        { text: 'Opcion B: user-invocable: false + disable-model-invocation: false', correct: false, explanation: 'Esto es lo opuesto: el usuario NO puede invocarlo pero el modelo SI puede. user-invocable: false bloquea el slash command.' },
        { text: 'Opcion C: allow-model-invocation y user-command son campos validos', correct: false, explanation: 'Esos campos no existen en el frontmatter de SKILL.md. Los campos correctos son user-invocable, disable-model-invocation y keep-context-instructions. Revisar la documentacion oficial es crucial.' }
      ],
      source: 'Claude Code - Skills',
      sourceUrl: 'https://code.claude.com/docs/en/skills'
    },
    {
      question: 'Claude Code tiene 3 sub-agentes built-in. Cual usarias para investigar la estructura de un codebase nuevo SIN riesgo de modificar nada?',
      options: [
        { text: 'El sub-agente general-purpose porque tiene acceso a todas las herramientas y puede hacer una investigacion completa', correct: false, explanation: 'General-purpose tiene TODAS las tools incluyendo Write, Edit y Bash. Si solo quieres investigar, darle acceso de escritura es riesgo innecesario. Principio de menor privilegio.' },
        { text: 'El sub-agente Explore: usa Haiku (rapido y barato), tiene solo herramientas read-only, y devuelve un resumen al agente principal', correct: true, explanation: 'Correcto! Explore es perfecto para investigacion: (1) usa Claude Haiku = rapido y 10x mas barato, (2) solo tiene Read, Glob, Grep y otras tools de lectura = CERO riesgo de modificacion, (3) devuelve un resumen conciso que no contamina el contexto principal.' },
        { text: 'El sub-agente Plan porque esta disenado para analizar antes de actuar', correct: false, explanation: 'Plan es read-only (correcto) pero hereda el modelo actual (Sonnet/Opus = mas caro). Explore usa Haiku, que es mucho mas barato para tareas de lectura rapida. Ademas, Plan esta disenado para planificacion arquitectonica, no para exploracion de codebase.' },
        { text: 'No usarias sub-agentes, le pedirias al agente principal que explore', correct: false, explanation: 'Usar el agente principal para exploracion contamina su contexto con detalles de bajo nivel que no necesita. Los sub-agentes mantienen el contexto principal limpio al devolver solo un resumen.' }
      ],
      source: 'Claude Code - Sub-Agents',
      sourceUrl: 'https://code.claude.com/docs/en/sub-agents'
    },
    {
      question: 'Quieres que Claude Code pueda ejecutar npm test y npm run lint, pero NADA mas con Bash. Cual es la configuracion correcta de permisos?',
      codeBlock: 'Opcion A (settings.json):\n"permissions": {\n  "allow": ["Bash(npm test)", "Bash(npm run lint)"],\n  "deny": ["Bash"]\n}\n\nOpcion B (settings.json):\n"permissions": {\n  "allow": ["Bash(npm test)", "Bash(npm run lint)"]\n}\n\nOpcion C (settings.json):\n"permissions": {\n  "allow": ["Bash(*)"]\n}',
      options: [
        { text: 'Opcion A: allow los comandos especificos + deny Bash general', correct: true, explanation: 'Correcto! Los permisos se evaluan de mas especifico a menos especifico. allow Bash(npm test) permite ese comando exacto. deny Bash bloquea todo lo demas. Sin el deny general, otros comandos Bash pasarian al modo "ask" por defecto, no serian bloqueados.' },
        { text: 'Opcion B: solo allow sin deny es suficiente', correct: false, explanation: 'Sin deny Bash, cualquier otro comando Bash (como rm -rf o curl) caeria en el modo por defecto "ask" en vez de ser bloqueado. El usuario veria un prompt pero podria aceptar accidentalmente. El deny explicito es mas seguro.' },
        { text: 'Opcion C: allow Bash(*) permite todo lo que necesites', correct: false, explanation: 'Bash(*) permite CUALQUIER comando Bash sin restriccion. Esto incluye rm -rf /, curl a endpoints maliciosos, etc. Es la configuracion mas peligrosa posible. Siempre usa patrones especificos.' }
      ],
      source: 'Claude Code - Permissions',
      sourceUrl: 'https://code.claude.com/docs/en/permissions'
    },
    {
      question: 'Necesitas ejecutar Claude Code en un GitHub Action para generar changelogs automaticos. Cual es el comando correcto para modo headless con limite de costo de $0.50 y maximo 5 iteraciones del agent loop?',
      options: [
        { text: 'claude -p "Generate changelog" --output-format json --max-turns 5 --max-budget-usd 0.50', correct: true, explanation: 'Correcto! -p activa el modo headless (single prompt, no interactivo). --output-format json da output estructurado para parsing en CI. --max-turns 5 limita las iteraciones del agent loop. --max-budget-usd 0.50 pone un tope de costo. Esta combinacion es ideal para CI/CD: predecible, limitada y parseable.' },
        { text: 'claude --headless "Generate changelog" --format json --iterations 5 --budget 0.50', correct: false, explanation: 'Los flags no existen. No hay --headless (se usa -p), no hay --format (se usa --output-format), no hay --iterations (se usa --max-turns), no hay --budget (se usa --max-budget-usd). Los nombres exactos importan en CLI.' },
        { text: 'claude -p "Generate changelog" --max-budget-usd 0.50 (los otros flags no son necesarios)', correct: false, explanation: 'Sin --max-turns, el agente podria iterar indefinidamente (hasta el budget). Sin --output-format, el output es texto plano que es dificil de parsear en un pipeline de CI. Ambos flags son importantes para automatizacion predecible.' },
        { text: 'No se puede usar Claude Code en CI/CD, necesitas la API directamente', correct: false, explanation: 'Claude Code tiene soporte oficial para CI/CD via modo headless (-p) y una GitHub Action oficial (anthropics/claude-code-action). Es un caso de uso principal, no un hack.' }
      ],
      source: 'Claude Code - Headless Mode',
      sourceUrl: 'https://code.claude.com/docs/en/headless'
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow does not trigger completion, only the quiz does
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    const badge = courseStore.unlockBadge('deep-diver');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">

  <!-- Header -->
  <header class="mb-10">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <p class="text-agent-accent text-sm font-mono tracking-wider uppercase">Modulo {MODULE_ID}</p>
        <h1 class="text-3xl md:text-4xl font-bold text-agent-text">{mod.title}</h1>
      </div>
    </div>
    <p class="text-agent-muted text-lg mt-2">{mod.subtitle}</p>
    <div class="flex gap-4 mt-4 text-sm text-agent-muted">
      <span>&#x23F1;&#xFE0F; {mod.duration}</span>
      <span>&#x1F4CB; {mod.type}</span>
    </div>
  </header>

  <!-- Objectives -->
  <section class="card mb-10">
    <h2 class="text-xl font-bold text-agent-accent mb-3">Objetivos del modulo</h2>
    <ul class="space-y-2">
      {#each mod.objectives as obj}
        <li class="flex items-start gap-2 text-agent-muted">
          <span class="text-agent-accent mt-1">&#x25B8;</span>
          <span>{obj}</span>
        </li>
      {/each}
    </ul>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 1: La estructura .claude/ -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. La estructura <code class="text-agent-accent">.claude/</code></h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Si has trabajado con <code class="text-agent-accent">.vscode/</code>, <code class="text-agent-accent">.github/</code> o <code class="text-agent-accent">.husky/</code>, entiendes el concepto: un directorio en la raiz de tu proyecto que configura una herramienta. El directorio <code class="text-agent-accent">.claude/</code> es lo mismo, pero para tu agente IA. Todo lo que define como se comporta Claude Code en tu proyecto vive aqui. Es la diferencia entre un agente generico y un agente que entiende <strong class="text-agent-text">tu</strong> proyecto.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      A diferencia de otros agentes que dependen de un solo archivo de configuracion, Claude Code tiene un ecosistema completo. Cada directorio tiene un proposito especifico, y entender cuando usar cada uno es lo que separa a un usuario casual de un power user. Veamos la estructura completa:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code>.claude/
├── settings.json          # Configuracion central (permisos, env, MCP, hooks)
├── settings.local.json    # Overrides locales (gitignored, para tu maquina)
├── agents/                # Definiciones de sub-agentes custom
│   ├── reviewer.md        # Agente especializado en code review
│   └── deployer.md        # Agente especializado en deployment
├── skills/                # Expertise empaquetada
│   └── react-19/
│       └── SKILL.md       # Frontmatter YAML + instrucciones
├── commands/              # Slash commands simples
│   ├── review.md          # Template para /review
│   └── test.md            # Template para /test
└── rules/                 # Reglas path-specific
    ├── api-rules.md       # Reglas para src/api/** (YAML globs)
    └── ui-rules.md        # Reglas para src/components/**</code></pre>`}

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x2699;&#xFE0F; settings.json</h4>
        <p class="text-sm text-agent-muted">
          La <strong class="text-agent-text">configuracion central</strong>. Define permisos (allow/ask/deny), variables de entorno, servidores MCP, y hooks. Existe en 3 niveles con fusion: <code class="text-agent-accent">~/.claude/settings.json</code> (usuario) &lt; <code class="text-agent-accent">.claude/settings.json</code> (proyecto) &lt; <code class="text-agent-accent">.claude/settings.local.json</code> (local, gitignored). El nivel mas especifico gana.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F517; hooks/</h4>
        <p class="text-sm text-agent-muted">
          No es un directorio sino una <strong class="text-agent-text">seccion en settings.json</strong>. Los hooks reaccionan a 17 eventos del ciclo de vida del agente. Son el mecanismo de extension mas poderoso: puedes auto-formatear, bloquear acciones, notificar, o re-inyectar contexto.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4DA; skills/</h4>
        <p class="text-sm text-agent-muted">
          <strong class="text-agent-text">Expertise empaquetada</strong> como archivos SKILL.md. Cada skill tiene frontmatter YAML con metadatos y un body con instrucciones. El usuario los invoca con <code class="text-agent-accent">/nombre</code> o el modelo los carga automaticamente. Ideal para frameworks, convenciones, o patrones de tu equipo.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F916; agents/</h4>
        <p class="text-sm text-agent-muted">
          <strong class="text-agent-text">Sub-agentes custom</strong>. Cada archivo .md define un agente con su propio modelo, tools permitidas, y system prompt. Corren con su propio contexto aislado y devuelven un resumen al agente principal. Ideal para tareas especializadas o paralelismo.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4AC; commands/</h4>
        <p class="text-sm text-agent-muted">
          <strong class="text-agent-text">Slash commands simples</strong>. Cada archivo .md es un template de prompt. El usuario escribe <code class="text-agent-accent">/nombre</code> y el contenido se inyecta como prompt. Sin frontmatter complejo, sin logica. Perfecto para acciones frecuentes: <code class="text-agent-accent">/review</code>, <code class="text-agent-accent">/test</code>, <code class="text-agent-accent">/deploy</code>.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4CF; rules/</h4>
        <p class="text-sm text-agent-muted">
          <strong class="text-agent-text">Reglas path-specific</strong>. Cada archivo .md tiene frontmatter con globs que definen a que archivos aplica. Cuando Claude Code edita un archivo que matchea, las reglas se inyectan automaticamente. Ejemplo: "en src/api/ siempre valida con Zod y usa try/catch".
        </p>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que</p>
      <p class="text-sm text-agent-muted">
        La diferencia entre <strong class="text-agent-text">commands</strong> y <strong class="text-agent-text">skills</strong> es la complejidad. Un command es un simple template de prompt (un archivo .md plano). Un skill tiene frontmatter YAML con control sobre invocacion (quien puede invocarlo, como se comporta), contexto dinamico ($ARGUMENTS, backtick commands), y la opcion keep-context-instructions para persistir instrucciones despues de compaction. Si solo necesitas un atajo, usa commands. Si necesitas encapsular expertise con control fino, usa skills.
      </p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Una pregunta comun: <strong class="text-agent-text">que va en settings.json vs en CLAUDE.md?</strong> La respuesta es simple: settings.json es para <strong class="text-agent-text">configuracion tecnica</strong> (permisos, hooks, MCP servers, variables de entorno) y CLAUDE.md es para <strong class="text-agent-text">instrucciones en lenguaje natural</strong> (convenciones, patrones, reglas de negocio, workflow). Settings.json se parsea como JSON. CLAUDE.md se inyecta como contexto al modelo. Ambos son complementarios, no sustitutos.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Poner instrucciones en lenguaje natural dentro de settings.json o configuracion tecnica (permisos, MCP) dentro de CLAUDE.md. El modelo no parsea settings.json para instrucciones, y CLAUDE.md no se evalua como configuracion. Cada archivo tiene su funcion.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 2: Hooks System -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Hooks System — El mecanismo de extension mas poderoso</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los hooks son interceptores que se ejecutan en momentos especificos del ciclo de vida de Claude Code. Piensa en ellos como <strong class="text-agent-text">middleware para tu agente</strong>: no modifican el modelo, sino que reaccionan a lo que el modelo hace. Hay <strong class="text-agent-accent">17 eventos</strong> disponibles, <strong class="text-agent-accent">3 tipos de handler</strong>, y el mecanismo de <strong class="text-agent-accent">exit codes</strong> para controlar el flujo.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Los 17 eventos</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los hooks se disparan en momentos clave del agent loop. Los mas importantes para empezar:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Evento</th>
            <th class="text-left py-2 px-3 text-agent-accent">Cuando se dispara</th>
            <th class="text-left py-2 px-3 text-agent-accent">Caso de uso tipico</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">PreToolUse</td>
            <td class="py-2 px-3">Antes de ejecutar cualquier herramienta</td>
            <td class="py-2 px-3">Bloquear acceso a archivos protegidos</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">PostToolUse</td>
            <td class="py-2 px-3">Despues de ejecutar una herramienta</td>
            <td class="py-2 px-3">Auto-formatear codigo despues de Write/Edit</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">Notification</td>
            <td class="py-2 px-3">Cuando el agente genera una notificacion</td>
            <td class="py-2 px-3">Enviar mensaje a Slack/Discord</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">Stop</td>
            <td class="py-2 px-3">Cuando el agente principal termina su turno</td>
            <td class="py-2 px-3">Log de actividad, metricas de sesion</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">SubAgentStop</td>
            <td class="py-2 px-3">Cuando un sub-agente termina</td>
            <td class="py-2 px-3">Consolidar resultados de sub-agentes</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">PostCompact</td>
            <td class="py-2 px-3">Despues de compactar el contexto</td>
            <td class="py-2 px-3">Re-inyectar instrucciones criticas perdidas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Los 3 tipos de handler</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando un evento se dispara, el hook ejecuta un handler. Hay 3 tipos, cada uno con un proposito diferente:
    </p>

    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="card border-agent-accent/30">
        <h4 class="text-agent-accent font-bold mb-2">1. command</h4>
        <p class="text-sm text-agent-muted mb-2">Ejecuta un <strong class="text-agent-text">shell command</strong>. El stdout se inyecta de vuelta como contexto al modelo. Ideal para auto-formateo, linting, o recoleccion de informacion.</p>
        <p class="text-xs text-agent-muted font-mono bg-agent-darker rounded p-2">
          Ejemplo: "prettier --write $FILE"
        </p>
      </div>
      <div class="card border-agent-accent/30">
        <h4 class="text-agent-accent font-bold mb-2">2. prompt</h4>
        <p class="text-sm text-agent-muted mb-2">Envia el stdout del comando como un <strong class="text-agent-text">turno de usuario</strong> al modelo. El modelo procesa el output y responde. Ideal para re-inyectar contexto critico.</p>
        <p class="text-xs text-agent-muted font-mono bg-agent-darker rounded p-2">
          Ejemplo: Re-inyectar CLAUDE.md post-compaction
        </p>
      </div>
      <div class="card border-agent-accent/30">
        <h4 class="text-agent-accent font-bold mb-2">3. agent</h4>
        <p class="text-sm text-agent-muted mb-2">Lanza un <strong class="text-agent-text">sub-agente</strong> con el output del hook como prompt. El sub-agente tiene su propio contexto aislado. Ideal para tareas complejas post-accion.</p>
        <p class="text-xs text-agent-muted font-mono bg-agent-darker rounded p-2">
          Ejemplo: Lanzar un agente de testing post-edit
        </p>
      </div>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Exit codes: el mecanismo de control</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los exit codes de un hook determinan que pasa despues. Esto es <strong class="text-agent-text">critico para seguridad</strong>:
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-success/5 border-agent-success/30">
        <p class="text-agent-success font-bold text-lg mb-1">Exit 0 — Proceder</p>
        <p class="text-sm text-agent-muted">La accion continua normalmente. Si el hook es tipo <code class="text-agent-accent">command</code>, el stdout se inyecta como contexto adicional. Es el flujo normal: "vi lo que vas a hacer, todo bien, continua".</p>
      </div>
      <div class="card bg-agent-danger/5 border-agent-danger/30">
        <p class="text-agent-danger font-bold text-lg mb-1">Exit 2 — BLOQUEAR</p>
        <p class="text-sm text-agent-muted">La accion se <strong class="text-agent-text">DETIENE</strong>. No se ejecuta. El modelo recibe una notificacion de que fue bloqueada. Es el guardrail definitivo: "esta accion no esta permitida". Usa esto para proteger archivos sensibles, bloquear comandos peligrosos, o prevenir accesos no autorizados.</p>
      </div>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Matchers: filtrar por herramienta</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      No todos los hooks necesitan dispararse en todas las herramientas. Los <strong class="text-agent-text">matchers</strong> filtran por nombre de herramienta usando regex. Un hook con matcher <code class="text-agent-accent">Bash</code> solo se dispara cuando Claude Code va a ejecutar un comando shell, no cuando edita un archivo.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Ejemplo completo: configuracion de hooks en settings.json</h3>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code>{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -q \"\\.env\\\\|secrets\\\\|credentials\"; then echo \"BLOCKED: archivo sensible\" >&2; exit 2; fi'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$TOOL_INPUT_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -X POST -H 'Content-Type: application/json' -d '{\"text\": \"Claude Code: $NOTIFICATION_MESSAGE\"}' $SLACK_WEBHOOK_URL"
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "prompt",
            "command": "cat CLAUDE.md"
          }
        ]
      }
    ]
  }
}</code></pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Este ejemplo muestra 4 patrones comunes: <strong class="text-agent-text">(1)</strong> un PreToolUse que <strong class="text-agent-text">bloquea</strong> (exit 2) si Claude intenta editar archivos sensibles como .env o credentials, <strong class="text-agent-text">(2)</strong> un PostToolUse que auto-formatea con Prettier despues de cada edicion, <strong class="text-agent-text">(3)</strong> una Notification que envia a Slack cuando el agente genera un aviso, y <strong class="text-agent-text">(4)</strong> un PostCompact que re-inyecta CLAUDE.md como turno de usuario despues de que el contexto se compacta (para no perder instrucciones criticas).
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El hook <strong class="text-agent-text">PostCompact + type prompt</strong> es uno de los patrones mas poderosos. Cuando Claude Code compacta el contexto (para liberar tokens), puede perder instrucciones importantes de CLAUDE.md. Con este hook, el contenido de CLAUDE.md se re-inyecta automaticamente como un turno de usuario, asegurando que las instrucciones criticas nunca se pierdan. Anthropic lo recomienda como best practice para sesiones largas.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El equipo de incident.io usa hooks PreToolUse para bloquear acceso a archivos de infraestructura critica. Cuando un agente intenta editar un archivo en <code class="text-agent-accent">deploy/</code> o <code class="text-agent-accent">terraform/</code>, el hook sale con exit code 2 y el agente recibe un mensaje: "No tienes permiso para modificar infraestructura directamente. Crea un PR y pide review humano." Esto elimino accidentes en produccion.</p>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Patrones avanzados de hooks</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Mas alla de los 4 patrones basicos, los hooks habilitan workflows sofisticados que transforman a Claude Code en una plataforma extensible:
    </p>

    <div class="space-y-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F6E1;&#xFE0F; Guardrail de seguridad en Bash</h4>
        <p class="text-sm text-agent-muted mb-2">Un hook PreToolUse con matcher <code class="text-agent-accent">Bash</code> que parsea el comando antes de ejecutarlo. Si contiene patrones peligrosos (<code class="text-agent-accent">rm -rf</code>, <code class="text-agent-accent">DROP TABLE</code>, <code class="text-agent-accent">curl | bash</code>), sale con exit code 2. Es tu primera linea de defensa contra comandos destructivos.</p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4CA; Metricas de observabilidad</h4>
        <p class="text-sm text-agent-muted mb-2">Un hook Stop que al terminar cada turno registra: tokens consumidos, herramientas usadas, archivos modificados, y tiempo de ejecucion. Envia estos datos a un dashboard (Grafana, Datadog). Permite medir el ROI de tu inversion en agentes y detectar regresiones de performance.</p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F504; Auto-test despues de edicion</h4>
        <p class="text-sm text-agent-muted mb-2">Un hook PostToolUse con matcher <code class="text-agent-accent">Edit|Write</code> que detecta si el archivo modificado tiene un archivo de test asociado (ej: <code class="text-agent-accent">utils.ts</code> tiene <code class="text-agent-accent">utils.test.ts</code>). Si existe, ejecuta solo ese test y devuelve el resultado como contexto. El agente ve inmediatamente si rompio algo.</p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4DD; Documentacion automatica</h4>
        <p class="text-sm text-agent-muted mb-2">Un hook PostToolUse tipo <code class="text-agent-accent">agent</code> que lanza un sub-agente documentador cada vez que se crea una funcion publica. El sub-agente lee la funcion, genera JSDoc/docstring, y la agrega. La documentacion se genera como efecto colateral del desarrollo, no como una tarea separada.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Crear hooks que son demasiado lentos. Cada hook se ejecuta <strong class="text-agent-text">sincronicamente</strong> antes o despues de la accion. Si tu hook PreToolUse tarda 5 segundos en ejecutar (porque hace una llamada de red, o ejecuta un linter pesado), esos 5 segundos se agregan a CADA accion del agente. Un hook de formateo que tarda 200ms es aceptable. Uno que tarda 5 segundos destruye la experiencia. Mide siempre el tiempo de ejecucion de tus hooks.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 3: Skills System -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Skills — Expertise empaquetada</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Un skill es un <strong class="text-agent-text">paquete de expertise</strong> que Claude Code puede cargar bajo demanda. Piensa en skills como <strong class="text-agent-text">"libros de referencia"</strong> que el agente consulta solo cuando los necesita, en vez de tener todo en memoria permanentemente. Esto es clave para la gestion eficiente del contexto: en vez de cargar 50 paginas de instrucciones en CLAUDE.md (que consumirian tokens constantemente), encapsulas cada area de expertise como un skill independiente.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Estructura de un SKILL.md</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Un skill tiene dos partes: <strong class="text-agent-text">frontmatter YAML</strong> (metadatos y configuracion) y <strong class="text-agent-text">body Markdown</strong> (las instrucciones). Veamos un ejemplo completo:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code># .claude/skills/react-19/SKILL.md
---
name: react-19
description: "React 19 patterns: Server Components, Actions, use() hook, ref as prop"
user-invocable: true
disable-model-invocation: false
keep-context-instructions: true
---

# React 19 Patterns

## CRITICAL Rules
- Use Server Components by default. Add 'use client' ONLY when you need interactivity.
- Use the \`use()\` hook for reading promises and context (replaces useContext).
- Pass refs as regular props (no forwardRef needed in React 19).
- Use Actions (useActionState, useFormStatus) for form handling.

## File Structure
\`current project structure\`
\`tree src/components -L 2\`

## Component Template
When creating new components, follow this pattern:
- TypeScript with explicit Props interface
- Server Component by default
- Error boundary wrapping for client components
- Tailwind CSS for styling (no CSS modules)</code></pre>`}

    <h3 class="text-xl font-semibold text-agent-text mb-3">Campos del frontmatter</h3>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Campo</th>
            <th class="text-left py-2 px-3 text-agent-accent">Tipo</th>
            <th class="text-left py-2 px-3 text-agent-accent">Descripcion</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">name</td>
            <td class="py-2 px-3">string</td>
            <td class="py-2 px-3">Nombre del skill. Se usa como identificador para invocacion.</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">description</td>
            <td class="py-2 px-3">string</td>
            <td class="py-2 px-3">Descripcion corta. El modelo la lee para decidir si invocar el skill.</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">user-invocable</td>
            <td class="py-2 px-3">boolean</td>
            <td class="py-2 px-3">Si <code class="text-agent-accent">true</code>, el usuario puede invocar con <code class="text-agent-accent">/nombre</code>.</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">disable-model-invocation</td>
            <td class="py-2 px-3">boolean</td>
            <td class="py-2 px-3">Si <code class="text-agent-accent">true</code>, el modelo NO puede invocarlo automaticamente (solo el usuario).</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">keep-context-instructions</td>
            <td class="py-2 px-3">boolean</td>
            <td class="py-2 px-3">Si <code class="text-agent-accent">true</code>, las instrucciones persisten tras compaction del contexto.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Contexto dinamico</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los skills no son estaticos. Tienen dos mecanismos de contexto dinamico que se resuelven <strong class="text-agent-text">en tiempo de carga</strong>:
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">$ARGUMENTS</h4>
        <p class="text-sm text-agent-muted">Cuando el usuario invoca <code class="text-agent-accent">/skill-name esto es el argumento</code>, el texto despues del nombre se inyecta donde aparezca <code class="text-agent-accent">$ARGUMENTS</code> en el body del skill. Ideal para skills parametricos.</p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">`comando` (backticks)</h4>
        <p class="text-sm text-agent-muted">Un comando entre backticks se ejecuta como shell y su stdout se inyecta en su lugar. Ejemplo: <code class="text-agent-accent">`tree src -L 2`</code> se reemplaza por la estructura real del directorio. Permite que el skill tenga contexto actualizado del proyecto.</p>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que</p>
      <p class="text-sm text-agent-muted">
        Los skills son la razon por la que tu CLAUDE.md no necesita ser un documento de 500 lineas. En vez de poner TODAS las convenciones de tu proyecto en CLAUDE.md (consumiendo tokens constantemente), creas skills especializados que se cargan solo cuando son relevantes. CLAUDE.md mantiene las instrucciones globales (workflow, reglas generales) y los skills manejan el detalle especifico (React 19 patterns, testing conventions, API design).
      </p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Crear un solo skill gigante con todas las instrucciones del proyecto. Esto es igual de malo que un CLAUDE.md enorme: consume tokens y el modelo tiene que filtrar lo relevante. Crea skills pequenos y enfocados: un skill para React, otro para la API, otro para testing. Cada uno se carga solo cuando es necesario.</p>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Skills en accion: el flujo completo</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Para entender como funciona un skill en la practica, veamos el flujo completo desde la invocacion hasta la ejecucion:
    </p>

    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3">
        <span class="text-agent-accent font-bold text-sm mt-1 shrink-0">1.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Trigger</strong>: El usuario escribe <code class="text-agent-accent">/react-19 create a new form component for user registration</code></p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-accent font-bold text-sm mt-1 shrink-0">2.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Load</strong>: Claude Code encuentra <code class="text-agent-accent">.claude/skills/react-19/SKILL.md</code>, lee el frontmatter (user-invocable: true), y procede</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-accent font-bold text-sm mt-1 shrink-0">3.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Resolve</strong>: <code class="text-agent-accent">$ARGUMENTS</code> se reemplaza por "create a new form component for user registration". Los backtick commands (<code class="text-agent-accent">`tree src/components -L 2`</code>) se ejecutan y su output se inyecta</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-accent font-bold text-sm mt-1 shrink-0">4.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Inject</strong>: El body resuelto del skill se inyecta como contexto al modelo, junto con el argumento del usuario</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-accent font-bold text-sm mt-1 shrink-0">5.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Execute</strong>: El modelo ahora tiene las instrucciones de React 19 (Server Components, Actions, use() hook) y la tarea del usuario. Genera el componente siguiendo los patrones definidos en el skill</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Eficiencia de tokens</p>
      <p class="text-sm text-agent-muted">Si tienes 5 skills de ~2000 tokens cada uno (React, Tailwind, Testing, API, DB), son 10K tokens de instrucciones especializadas. Si todo estuviera en CLAUDE.md, esos 10K tokens se cargarian en <strong class="text-agent-text">cada mensaje</strong>, sin importar si son relevantes. Con skills, solo se cargan los que se necesitan. Si estas trabajando en un componente React, se carga solo el skill de React (~2000 tokens). El ahorro es de hasta <strong class="text-agent-text">80% en tokens de contexto</strong> por sesion.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 4: Sub-Agents -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Sub-Agents — Agentes dentro del agente</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los sub-agentes son una de las capacidades mas avanzadas de Claude Code. Permiten al agente principal <strong class="text-agent-text">delegar tareas</strong> a agentes especializados que corren con su propio contexto aislado. Esto resuelve dos problemas criticos: <strong class="text-agent-text">contaminacion de contexto</strong> (el agente principal no se llena de detalles de bajo nivel) y <strong class="text-agent-text">especializacion</strong> (cada sub-agente puede tener herramientas y modelos optimizados para su tarea).
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Sub-agentes built-in</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code viene con 3 sub-agentes integrados, cada uno optimizado para un caso de uso especifico:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Sub-agente</th>
            <th class="text-left py-2 px-3 text-agent-accent">Modelo</th>
            <th class="text-left py-2 px-3 text-agent-accent">Tools</th>
            <th class="text-left py-2 px-3 text-agent-accent">Caso de uso</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">Explore</td>
            <td class="py-2 px-3">Haiku (rapido, barato)</td>
            <td class="py-2 px-3">Read, Glob, Grep (solo lectura)</td>
            <td class="py-2 px-3">Investigar codebase, buscar archivos, entender estructura</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">Plan</td>
            <td class="py-2 px-3">Hereda el modelo actual</td>
            <td class="py-2 px-3">Read, Glob, Grep (solo lectura)</td>
            <td class="py-2 px-3">Planificacion arquitectonica, diseno de solucion</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">General-purpose</td>
            <td class="py-2 px-3">Hereda el modelo actual</td>
            <td class="py-2 px-3">Todas las herramientas disponibles</td>
            <td class="py-2 px-3">Tareas completas que requieren lectura y escritura</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">Explore</strong> es el mas usado. Al usar Haiku (10x mas barato que Opus), puedes investigar un codebase entero gastando centavos. Ideal para responder preguntas como "encuentra todos los archivos que importan este modulo" o "que patron usa la API de autenticacion". El sub-agente devuelve solo un <strong class="text-agent-text">resumen</strong> al agente principal, manteniendo el contexto limpio.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Sub-agentes custom</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Puedes definir tus propios sub-agentes en <code class="text-agent-accent">.claude/agents/</code>. Cada archivo .md define un agente con su personalidad, herramientas y modelo:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code># .claude/agents/reviewer.md
---
model: claude-sonnet-4-20250514
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(npm test)
  - Bash(npm run lint)
description: "Agente especializado en code review. Analiza calidad, seguridad y tests."
---

# Eres un Code Reviewer Senior

## Tu rol
Analizas Pull Requests con foco en:
1. **Calidad**: complejidad ciclomatica, DRY, naming conventions
2. **Seguridad**: OWASP Top 10, secrets expuestos, inyecciones
3. **Tests**: cobertura de los cambios, edge cases faltantes

## Reglas
- NUNCA edites archivos. Solo lees y reportas.
- Ejecuta tests para verificar que pasan.
- Prioriza hallazgos: Critical > High > Medium > Low.
- Incluye SIEMPRE linea y archivo para cada hallazgo.
- Si no encuentras problemas, dilo explicitamente.</code></pre>`}

    <h3 class="text-xl font-semibold text-agent-text mb-3">Foreground vs Background</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los sub-agentes pueden correr en dos modos:
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">Foreground (bloquea)</h4>
        <p class="text-sm text-agent-muted">El agente principal espera a que el sub-agente termine. Util cuando necesitas el resultado antes de continuar. Ejemplo: el agente principal pide a Explore que investigue la estructura antes de empezar a implementar.</p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">Background (paralelo)</h4>
        <p class="text-sm text-agent-muted">El sub-agente corre en paralelo mientras el agente principal continua. Util para tareas independientes. Ejemplo: lanzar un agente de tests en background mientras el principal sigue implementando. Es la base de los Agent Teams.</p>
      </div>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Memory isolation</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Cada sub-agente tiene su <strong class="text-agent-text">propio contexto aislado</strong>. No comparte el historial de mensajes del agente principal. Cuando termina, devuelve un <strong class="text-agent-text">resumen</strong> al padre. Esto es intencional: protege el contexto del agente principal de desbordarse con detalles de tareas delegadas. Si un sub-agente Explore lee 50 archivos, el agente principal solo ve un resumen de 200 tokens, no los 50 archivos completos.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En el proyecto de compilador C de Anthropic (100K lineas de Rust generadas por agentes), usaron 16 sub-agentes en paralelo. Cada uno se encargaba de un subsistema del compilador (lexer, parser, codegen, optimizer, etc.). El agente orquestador solo recibia resumenes de progreso, manteniendo su contexto limpio para decisiones de alto nivel. Sin sub-agentes, el contexto se habria agotado en la primera iteracion.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La decision de cuando usar sub-agentes sigue la <strong class="text-agent-text">regla del contexto</strong>: si la tarea requiere leer mucha informacion que el agente principal no necesita retener, usa un sub-agente. Si la tarea es corta y el resultado es necesario inmediatamente, hazlo directamente. No abuses de los sub-agentes para tareas triviales: el overhead de lanzar un contexto nuevo tiene costo.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 5: Permission Model -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Permission Model — Seguridad a traves de permisos</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      El modelo de permisos de Claude Code es una de sus fortalezas principales frente a otros agentes. En vez de confiar ciegamente en el modelo, define un sistema de <strong class="text-agent-accent">3 niveles</strong> que balancea productividad con seguridad. Cada herramienta puede ser configurada independientemente.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Los 3 niveles</h3>

    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="card bg-agent-success/5 border-agent-success/30">
        <p class="text-agent-success font-bold text-lg mb-1">allow</p>
        <p class="text-sm text-agent-muted">Auto-ejecutar sin preguntar. Para acciones seguras que haces constantemente. Ejemplo: <code class="text-agent-accent">Bash(npm test)</code>, <code class="text-agent-accent">Read("**/*")</code>.</p>
      </div>
      <div class="card bg-agent-warning/5 border-agent-warning/30">
        <p class="text-agent-warning font-bold text-lg mb-1">ask</p>
        <p class="text-sm text-agent-muted">Preguntar al usuario cada vez. El modo por defecto. Para acciones que necesitan supervision humana. Ejemplo: <code class="text-agent-accent">Edit("**/*.ts")</code>.</p>
      </div>
      <div class="card bg-agent-danger/5 border-agent-danger/30">
        <p class="text-agent-danger font-bold text-lg mb-1">deny</p>
        <p class="text-sm text-agent-muted">Nunca permitir, ni siquiera si el usuario lo aprueba. Para acciones que JAMAS deben ejecutarse. Ejemplo: <code class="text-agent-accent">Bash(rm -rf)</code>.</p>
      </div>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Sintaxis: ToolName(pattern)</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los permisos usan la sintaxis <code class="text-agent-accent">ToolName(pattern)</code> donde el pattern es un glob que matchea contra el argumento de la herramienta. Esto permite un control granular:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code>// settings.json - ejemplo de permisos bien configurados
{
  "permissions": {
    "allow": [
      "Read",                          // Leer cualquier archivo
      "Glob",                          // Buscar archivos
      "Grep",                          // Buscar en contenido
      "Bash(npm test)",                // Solo npm test
      "Bash(npm run lint)",            // Solo npm run lint
      "Bash(npm run build)",           // Solo npm run build
      "Edit(\\"src/**/*.ts\\")",       // Editar solo TypeScript en src/
      "Edit(\\"src/**/*.svelte\\")",   // Editar solo Svelte en src/
      "Write(\\"src/**/*.ts\\")",      // Crear solo TypeScript en src/
      "Write(\\"src/**/*.svelte\\")"   // Crear solo Svelte en src/
    ],
    "deny": [
      "Bash(rm -rf *)",               // NUNCA borrar recursivo
      "Bash(git push --force)",        // NUNCA force push
      "Edit(\\".env*\\")",            // NUNCA editar .env
      "Edit(\\"*.pem\\")",            // NUNCA editar certificados
      "Edit(\\"deploy/**\\")"         // NUNCA editar deployment
    ]
  }
}</code></pre>`}

    <h3 class="text-xl font-semibold text-agent-text mb-3">Permission modes</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Ademas de los permisos granulares, Claude Code tiene <strong class="text-agent-text">modos globales</strong> que cambian el comportamiento general:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Modo</th>
            <th class="text-left py-2 px-3 text-agent-accent">Comportamiento</th>
            <th class="text-left py-2 px-3 text-agent-accent">Riesgo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">plan</td>
            <td class="py-2 px-3">Solo lectura. No puede editar ni ejecutar.</td>
            <td class="py-2 px-3 text-agent-success">Minimo</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">askEdits</td>
            <td class="py-2 px-3">Pregunta antes de cada edicion.</td>
            <td class="py-2 px-3 text-agent-warning">Bajo</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">acceptEdits</td>
            <td class="py-2 px-3">Auto-acepta ediciones, pregunta en Bash.</td>
            <td class="py-2 px-3 text-agent-warning">Medio</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">bypassPermissions</td>
            <td class="py-2 px-3">Todo permitido sin preguntar. Solo para testing.</td>
            <td class="py-2 px-3 text-agent-danger">Alto</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Dato clave</p>
      <p class="text-sm text-agent-muted">Segun los datos de Anthropic, un archivo settings.json bien configurado reduce los prompts de permisos en un <strong class="text-agent-text">84%</strong>. Esto no es solo conveniencia: cada prompt de permisos interrumpe el flujo del agente y del developer. Un sandbox bien configurado te permite trabajar en modo "auto-pilot" con confianza, porque sabes que las acciones peligrosas estan bloqueadas de antemano.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 6: Sandbox -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Sandbox — Aislamiento para seguridad</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      El sandbox es la capa de seguridad mas profunda de Claude Code. Mientras los permisos controlan <strong class="text-agent-text">que herramientas</strong> puede usar el agente, el sandbox controla <strong class="text-agent-text">que recursos del sistema</strong> puede acceder. Son dos dimensiones complementarias de seguridad.
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F4C2; Filesystem Sandbox</h4>
        <p class="text-sm text-agent-muted mb-2">
          Restringe <strong class="text-agent-text">que directorios</strong> puede leer y escribir el agente. Por defecto, Claude Code solo puede acceder al directorio del proyecto y sus subdirectorios. No puede leer <code class="text-agent-accent">/etc/passwd</code>, tu home directory, ni otros proyectos.
        </p>
        <p class="text-xs text-agent-muted">
          En macOS usa Apple Seatbelt (sandbox-exec). En Linux usa namespaces. En Docker, el container ya provee aislamiento.
        </p>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">&#x1F310; Network Sandbox</h4>
        <p class="text-sm text-agent-muted mb-2">
          Bloquea <strong class="text-agent-text">conexiones de red</strong> no autorizadas. El agente no puede hacer curl a endpoints arbitrarios, descargar binarios, o exfiltrar datos a servidores externos. Solo las conexiones necesarias (API de Anthropic, MCP servers configurados) estan permitidas.
        </p>
        <p class="text-xs text-agent-muted">
          Esto previene ataques de exfiltracion donde codigo malicioso en el repo intenta enviar datos via el agente.
        </p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La combinacion de filesystem + network sandbox crea un entorno donde el agente puede trabajar con confianza: tiene acceso a lo que necesita (tu proyecto) y esta bloqueado de lo que no (el resto del sistema). Segun el blog de ingenieria de Anthropic, esta arquitectura de sandboxing fue fundamental para habilitar el modo <strong class="text-agent-text">acceptEdits</strong> de forma segura.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Del blog de Anthropic</p>
      <p class="text-sm text-agent-muted">"El sandboxing de Claude Code fue disenado con el principio de menor privilegio. El agente solo tiene acceso a los recursos minimos necesarios para completar su tarea. Esto no es solo una buena practica de seguridad: es lo que permite que los usuarios confien en el agente para hacer ediciones automaticas sin supervision constante."</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 7: Headless Mode -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">7. Headless Mode — Claude Code sin UI</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      El modo headless transforma a Claude Code de una herramienta interactiva a un <strong class="text-agent-text">componente de automatizacion</strong>. En vez de abrir una sesion interactiva, le envias un prompt, el agente ejecuta su loop, y devuelve el resultado. Esto abre la puerta a CI/CD, GitHub Actions, scripts de automatizacion, y cualquier workflow que no requiera intervencion humana.
    </p>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Anatomia del comando headless</h3>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code># Basico: un prompt, una respuesta
claude -p "Explica que hace este proyecto"

# Con formato de output para CI
claude -p "Genera changelog desde el ultimo tag" --output-format json

# Con limites de seguridad
claude -p "Refactoriza src/utils.ts" \\
  --max-turns 10 \\
  --max-budget-usd 1.00 \\
  --allowedTools Read,Glob,Grep,Edit

# Con herramientas restringidas (solo lectura)
claude -p "Audita la seguridad del proyecto" \\
  --allowedTools Read,Glob,Grep \\
  --output-format json

# Streaming para monitoreo en tiempo real
claude -p "Implementa la feature descrita en TASK.md" \\
  --output-format stream-json \\
  --max-turns 20</code></pre>`}

    <h3 class="text-xl font-semibold text-agent-text mb-3">Flags principales</h3>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Flag</th>
            <th class="text-left py-2 px-3 text-agent-accent">Descripcion</th>
            <th class="text-left py-2 px-3 text-agent-accent">Ejemplo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">-p</td>
            <td class="py-2 px-3">Activa modo headless. Un prompt, ejecuta, sale.</td>
            <td class="py-2 px-3 font-mono">-p "Genera tests"</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">--output-format</td>
            <td class="py-2 px-3">Formato del output: text, json, stream-json</td>
            <td class="py-2 px-3 font-mono">--output-format json</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">--max-turns</td>
            <td class="py-2 px-3">Limite de iteraciones del agent loop</td>
            <td class="py-2 px-3 font-mono">--max-turns 10</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">--allowedTools</td>
            <td class="py-2 px-3">Herramientas permitidas (comma-separated)</td>
            <td class="py-2 px-3 font-mono">--allowedTools Read,Grep</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3 font-mono text-agent-text">--max-budget-usd</td>
            <td class="py-2 px-3">Tope de costo en dolares</td>
            <td class="py-2 px-3 font-mono">--max-budget-usd 2.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-xl font-semibold text-agent-text mb-3">Caso de uso: GitHub Action para code review</h3>

    <p class="text-agent-muted leading-relaxed mb-4">
      Uno de los casos de uso mas comunes del modo headless es el code review automatico en CI/CD. Anthropic provee una GitHub Action oficial (<code class="text-agent-accent">anthropics/claude-code-action</code>) que lo simplifica:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code># .github/workflows/claude-review.yml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Revisa este PR. Enfocate en:
            1. Bugs potenciales
            2. Vulnerabilidades de seguridad
            3. Mejoras de performance
            Deja comentarios inline en los archivos relevantes.
          max_turns: 15
          max_budget_usd: 2.00
          allowed_tools: "Read,Glob,Grep,Bash(npm test)"
        env:
          ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}</code></pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">En modo headless, <strong class="text-agent-text">siempre</strong> configura los 3 limites de seguridad: <code class="text-agent-accent">--max-turns</code> (evita loops infinitos), <code class="text-agent-accent">--max-budget-usd</code> (evita costos descontrolados), y <code class="text-agent-accent">--allowedTools</code> (principio de menor privilegio). Sin estos limites, un agente headless podria iterar indefinidamente, gastar cientos de dolares, o ejecutar comandos peligrosos sin supervision humana.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Ejecutar Claude Code en headless con <code class="text-agent-accent">--allowedTools</code> sin restriccion (o sea, con todas las tools). En CI/CD no hay un humano supervisando, asi que el agente tiene <strong class="text-agent-text">carta blanca</strong>. Si algo sale mal (hallucina un comando rm, intenta push a main), nadie lo detiene. Siempre restringe tools al minimo necesario para la tarea.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 8: Putting It All Together -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">8. Uniendo todo: un .claude/ profesional</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Veamos como se ve un directorio .claude/ completo y bien configurado para un proyecto real:
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code>.claude/
├── settings.json            # Permisos + hooks + MCP
├── settings.local.json      # API keys locales (gitignored)
├── agents/
│   ├── reviewer.md          # Code review especializado
│   ├── tester.md            # Generador de tests
│   └── deployer.md          # Asistente de deploy (user-invocable only)
├── skills/
│   ├── react-19/SKILL.md    # Patrones de React 19
│   ├── tailwind-4/SKILL.md  # Convenciones de Tailwind v4
│   └── testing/SKILL.md     # Framework de testing del equipo
├── commands/
│   ├── review.md            # /review - shortcut para code review
│   ├── test.md              # /test - generar tests del archivo actual
│   └── commit.md            # /commit - commit con conventional format
└── rules/
    ├── api-rules.md          # Reglas para src/api/** (Zod, try/catch)
    └── components-rules.md   # Reglas para src/components/** (Svelte 5)</code></pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      La clave es la <strong class="text-agent-text">separacion de responsabilidades</strong>:
    </p>

    <div class="grid md:grid-cols-2 gap-4 mb-6">
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">CLAUDE.md</h4>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x25B8; Workflow del equipo (4 fases)</li>
          <li>&#x25B8; Reglas generales (nunca force push)</li>
          <li>&#x25B8; Dispatch table de agentes</li>
          <li>&#x25B8; Convenciones de naming</li>
          <li>&#x25B8; Estructura del proyecto</li>
        </ul>
      </div>
      <div class="card">
        <h4 class="text-agent-accent font-bold mb-2">.claude/</h4>
        <ul class="text-sm text-agent-muted space-y-1">
          <li>&#x25B8; Permisos tecnicos (allow/deny)</li>
          <li>&#x25B8; Hooks automaticos</li>
          <li>&#x25B8; Agentes especializados</li>
          <li>&#x25B8; Skills por framework</li>
          <li>&#x25B8; Commands frecuentes</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; La formula profesional</p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">CLAUDE.md</strong> = instrucciones en lenguaje natural (que el modelo lee como contexto)<br>
        <strong class="text-agent-text">settings.json</strong> = configuracion tecnica (que el sistema parsea como JSON)<br>
        <strong class="text-agent-text">skills/</strong> = expertise on-demand (se carga solo cuando es relevante)<br>
        <strong class="text-agent-text">agents/</strong> = especializacion (contexto aislado para tareas complejas)<br>
        <strong class="text-agent-text">hooks</strong> = automatizacion (reaccion a eventos del ciclo de vida)<br>
        <strong class="text-agent-text">rules/</strong> = convenciones path-specific (se inyectan automaticamente por glob)<br>
        <strong class="text-agent-text">commands/</strong> = atajos simples (templates de prompt para acciones frecuentes)
      </p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 9: Rules -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">9. Rules — Convenciones path-specific</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Las rules son el mecanismo para definir convenciones que se aplican <strong class="text-agent-text">automaticamente</strong> cuando Claude Code toca archivos en paths especificos. A diferencia de skills (que se cargan bajo demanda) o CLAUDE.md (que siempre esta presente), las rules se inyectan <strong class="text-agent-text">contextualmente</strong> basandose en globs.
    </p>

    {@html `<pre class="code-block text-sm mb-6 overflow-x-auto"><code># .claude/rules/api-rules.md
---
globs:
  - "src/api/**/*.ts"
  - "src/routes/api/**/*.ts"
---

# API Development Rules

## ALWAYS:
- Validate ALL inputs with Zod schemas before processing
- Wrap every handler in try/catch with proper error responses
- Return standardized error format: { error: string, code: number, details?: unknown }
- Log errors with structured context (requestId, userId, endpoint)

## NEVER:
- Return raw database errors to the client
- Use any/unknown types in API contracts
- Skip authentication middleware on protected routes

## Response Format:
- 200: Success with data
- 201: Created with new resource
- 400: Validation error (include Zod parse errors)
- 401: Unauthorized
- 404: Not found
- 500: Internal error (log full error, return generic message)</code></pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando Claude Code edita un archivo que matchea <code class="text-agent-accent">src/api/**/*.ts</code>, estas reglas se inyectan automaticamente como contexto. El agente aplica Zod, try/catch, y el formato de error estandarizado <strong class="text-agent-text">sin que tengas que pedirlo</strong>. Es como tener un linter inteligente que entiende convenciones de negocio, no solo reglas sintacticas.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">&#x1F4A1; Sabias que</p>
      <p class="text-sm text-agent-muted">Puedes tener multiples rules que aplican al mismo archivo. Si un archivo esta en <code class="text-agent-accent">src/api/components/</code> y tienes rules para <code class="text-agent-accent">src/api/**</code> y <code class="text-agent-accent">src/**/components/**</code>, ambas se inyectan. Las rules se <strong class="text-agent-text">acumulan</strong>, no se sobreescriben. Esto permite composicion: reglas generales de API + reglas especificas de componentes API.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- SECTION 10: Mental Model -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <h2 class="text-2xl font-bold text-agent-text mb-4">10. Modelo mental: cuando usar cada pieza</h2>

    <p class="text-agent-muted leading-relaxed mb-4">
      Con tantas piezas disponibles (hooks, skills, agents, rules, commands, permissions), la pregunta natural es: <strong class="text-agent-text">cuando uso cada una?</strong> Aqui tienes un arbol de decision rapido:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent">Necesitas...</th>
            <th class="text-left py-2 px-3 text-agent-accent">Usa...</th>
            <th class="text-left py-2 px-3 text-agent-accent">Porque</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Reaccionar a una accion del agente</td>
            <td class="py-2 px-3 font-mono text-agent-text">hooks</td>
            <td class="py-2 px-3">Pre/PostToolUse interceptan acciones automaticamente</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Encapsular expertise de un framework</td>
            <td class="py-2 px-3 font-mono text-agent-text">skills</td>
            <td class="py-2 px-3">Se cargan on-demand, ahorran tokens, tienen contexto dinamico</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Delegar una tarea compleja</td>
            <td class="py-2 px-3 font-mono text-agent-text">sub-agents</td>
            <td class="py-2 px-3">Contexto aislado, herramientas especificas, paralelismo</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Aplicar convenciones a un path</td>
            <td class="py-2 px-3 font-mono text-agent-text">rules</td>
            <td class="py-2 px-3">Se inyectan automaticamente por glob, sin invocacion manual</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Un shortcut de prompt frecuente</td>
            <td class="py-2 px-3 font-mono text-agent-text">commands</td>
            <td class="py-2 px-3">Simple, sin frontmatter, /nombre y listo</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Controlar que puede hacer el agente</td>
            <td class="py-2 px-3 font-mono text-agent-text">permissions</td>
            <td class="py-2 px-3">allow/ask/deny con granularidad de herramienta y glob</td>
          </tr>
          <tr class="border-b border-agent-border/30">
            <td class="py-2 px-3">Automatizar sin interfaz de usuario</td>
            <td class="py-2 px-3 font-mono text-agent-text">headless</td>
            <td class="py-2 px-3">-p para CI/CD, GitHub Actions, scripts</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El principio rector es <strong class="text-agent-text">"just-in-time context"</strong>: cargar solo la informacion que el agente necesita, cuando la necesita. CLAUDE.md da el contexto global (siempre presente). Skills dan expertise especifica (cargada bajo demanda). Rules dan convenciones de path (inyectadas automaticamente). Hooks dan automatizacion (ejecutada por eventos). Cada pieza existe para evitar sobrecargar el contexto del agente con informacion irrelevante.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- InteractiveFlow -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Ecosistema .claude/</h2>
      {#if !showFlow}
        <button onclick={() => showFlow = true} class="btn-primary text-xs">
          Explorar ecosistema
        </button>
      {/if}
    </div>
    {#if showFlow}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Arquitectura del ecosistema .claude/"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- Quiz -->
  <!-- ═══════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Claude Code Deep Dive</h2>
      {#if !showQuiz}
        <button onclick={() => showQuiz = true} class="btn-primary text-xs">
          Iniciar quiz
        </button>
      {/if}
    </div>
    <p class="text-sm text-agent-muted mb-4">
      Este quiz contribuye al badge <strong class="text-agent-accent">Claude Code Master</strong> — necesitas 90%+ en los modulos 4, 5 y 8.
    </p>
    {#if showQuiz}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- ═══════════════════════════════════════════════════════ -->
  <!-- Completion -->
  <!-- ═══════════════════════════════════════════════════════ -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">&#x1F52C;</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ahora dominas hooks, skills, sub-agents y el ecosistema completo de .claude/</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
