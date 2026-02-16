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

  const MODULE_ID = 10;
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
    completed = true;
  }

  // InteractiveFlow: Professional Agent Workspace
  const flowNodes = [
    { id: 'terminal', label: 'Terminal Multiplexer', description: 'tmux o zellij como centro de comando. Multiples panes: uno para el agente CLI, otro para logs, otro para tests, otro para git. Las sesiones persisten si se cae SSH. Zellij es mas moderno: floating panes, WebAssembly plugins, session management nativo.', icon: '\u{1F5A5}\uFE0F', x: 15, y: 10 },
    { id: 'ide', label: 'IDE Agentico', description: 'Cursor (AI-native, fork de VS Code con IA integrada profundamente) o VS Code con extensiones agenticas (Roo Code, Kilo Code, Cline, Continue). El IDE es donde visualizas el codigo y las sugerencias del agente.', icon: '\u{1F4DD}', x: 85, y: 10 },
    { id: 'agent_cli', label: 'Agente CLI', description: 'Claude Code u OpenCode corriendo en la terminal. Acceso directo al filesystem, shell, y herramientas del sistema. Maximo poder y flexibilidad. Ideal para tareas complejas que requieren multiples herramientas.', icon: '\u{1F916}', x: 15, y: 40 },
    { id: 'agent_ide', label: 'Agente IDE', description: 'Cursor Agent, Roo Code, o Cline corriendo dentro del IDE. Integracion visual con el editor. Ideal para refactoring, generacion de codigo, y tareas contextuales al archivo actual.', icon: '\u{2728}', x: 85, y: 40 },
    { id: 'rules', label: 'Archivos de Reglas', description: 'CLAUDE.md, .cursorrules, .clinerules, rules/ directory. Definen como debe comportarse el agente en este proyecto: patrones, convenciones, restricciones. Son el "system prompt" pero versionado con git.', icon: '\u{1F4CB}', x: 15, y: 70 },
    { id: 'mcp', label: 'Servidores MCP', description: 'Model Context Protocol: servidores que exponen herramientas y datos al agente. MCP filesystem, MCP git, MCP database, MCP custom. Extienden las capacidades del agente sin modificar su codigo.', icon: '\u{1F50C}', x: 50, y: 85 },
    { id: 'ci', label: 'CI/CD Pipeline', description: 'GitHub Actions, GitLab CI, o similar. Los agentes pueden correr EN el pipeline (code review automatico, generacion de tests) o SER deployeados POR el pipeline. La integracion continua incluye ahora al agente como actor.', icon: '\u{2699}\uFE0F', x: 85, y: 70 },
    { id: 'cowork', label: 'Claude CoWork / Agent Teams', description: 'Multiples agentes trabajando en paralelo en la misma codebase. Claude CoWork permite a no-devs usar agentes. Agent Teams divide tareas complejas entre agentes especializados con contextos independientes.', icon: '\u{1F465}', x: 50, y: 40 }
  ];

  const flowEdges = [
    { from: 'terminal', to: 'agent_cli', label: 'ejecuta' },
    { from: 'ide', to: 'agent_ide', label: 'integra' },
    { from: 'agent_cli', to: 'rules', label: 'lee reglas' },
    { from: 'agent_ide', to: 'rules', label: 'lee reglas' },
    { from: 'agent_cli', to: 'mcp', label: 'conecta' },
    { from: 'agent_ide', to: 'mcp', label: 'conecta' },
    { from: 'agent_cli', to: 'ci', label: 'pushea' },
    { from: 'cowork', to: 'agent_cli', label: 'coordina' },
    { from: 'cowork', to: 'agent_ide', label: 'coordina' },
  ];

  const flowChallenges = [
    { question: '¿Donde configurarias las reglas de comportamiento del agente para que se versionen con el proyecto?', targetNodeId: 'rules', hint: 'Piensa en archivos que van en el repositorio y definen convenciones del proyecto.' },
    { question: '¿Que herramienta te permite ejecutar multiples agentes trabajando en paralelo en la misma codebase?', targetNodeId: 'cowork', hint: 'Es un producto de Anthropic para trabajo colaborativo con agentes.' },
    { question: '¿Que protocolo usan los agentes para conectarse a herramientas y datos externos de forma estandarizada?', targetNodeId: 'mcp', hint: 'Es un protocolo abierto creado por Anthropic para estandarizar la conexion agente-herramientas.' },
    { question: '¿Donde correria un agente que necesita acceso directo al shell del sistema para ejecutar comandos complejos?', targetNodeId: 'agent_cli', hint: 'Piensa en agentes que corren en la terminal, no en el IDE.' }
  ];

  // Quiz questions
  const quizQuestions = [
    {
      question: 'Necesitas 3 agentes trabajando en paralelo en el mismo repositorio sin que se sobreescriban archivos entre si. ¿Que combinacion de herramientas usas?',
      options: [
        { text: 'Tres instancias de Claude Code en el mismo directorio', correct: false, explanation: 'Sin aislamiento, tres agentes editando el mismo directorio generan conflictos constantes. Un agente puede sobreescribir cambios de otro.' },
        { text: 'Git worktrees para que cada agente tenga su copia de trabajo + un multiplexer para verlos simultaneamente', correct: true, explanation: 'Correcto. Git worktrees crean copias de trabajo independientes del mismo repo sin duplicar el historial. Cada agente trabaja en su worktree y al final se hace merge. El multiplexer (tmux/zellij) te permite monitorear los tres en paralelo.' },
        { text: 'Un solo agente con Claude Agent Teams que lo hace todo internamente', correct: false, explanation: 'Agent Teams es una opcion, pero la pregunta pide 3 agentes sin sobreescrituras. Agent Teams aun puede tener conflictos si no se aislan los workspaces.' },
        { text: 'Tres repos separados y despues copiar los cambios manualmente', correct: false, explanation: 'Copiar cambios manualmente es error-prone y pierde el historial de git. Git worktrees es la solucion pensada exactamente para este caso.' }
      ],
      source: 'Claude Code - Documentacion Oficial',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
    },
    {
      question: '¿Por que zellij es preferible a tmux para trabajo multi-agente en 2026?',
      options: [
        { text: 'Porque zellij es mas rapido que tmux en procesamiento de texto', correct: false, explanation: 'La velocidad de procesamiento de texto es similar. La ventaja de zellij esta en la UX y las funcionalidades para trabajo moderno.' },
        { text: 'Porque tiene floating panes, session management nativo, WebAssembly plugins, y una UX moderna que facilita monitorear multiples agentes simultaneamente', correct: true, explanation: 'Exacto. Los floating panes permiten popups temporales para ver output de un agente sin perder la vista principal. Los plugins WebAssembly permiten extender funcionalidad. Y el session management nativo facilita guardar y restaurar layouts complejos de trabajo multi-agente.' },
        { text: 'Porque tmux ya no se mantiene y esta deprecated', correct: false, explanation: 'tmux sigue activamente mantenido y es excelente. Zellij ofrece una UX mas moderna pero tmux sigue siendo una opcion solida.' },
        { text: 'Porque zellij tiene integracion nativa con Claude Code', correct: false, explanation: 'No hay integracion nativa especifica. La ventaja esta en las funcionalidades generales de zellij que benefician cualquier flujo de trabajo multi-proceso.' }
      ],
      source: 'Zellij - Terminal Workspace',
      sourceUrl: 'https://zellij.dev/'
    },
    {
      question: '¿Cual es el RIESGO principal de usar Agent Teams (multiples agentes en el mismo codebase) sin configurar reglas claras?',
      options: [
        { text: 'Los agentes se vuelven lentos porque comparten recursos de CPU', correct: false, explanation: 'El cuello de botella con LLMs es la API call, no el CPU local. Los agentes no compiten significativamente por recursos locales.' },
        { text: 'Los agentes pueden hacer cambios contradictorios, sobreescribir el trabajo del otro, o generar conflictos de merge inresolvibles', correct: true, explanation: 'Correcto. Sin reglas claras de scope (que archivos/directorios puede tocar cada agente), dos agentes pueden editar el mismo archivo de maneras incompatibles. Es como tener dos desarrolladores editando la misma funcion sin comunicarse.' },
        { text: 'Se excede el rate limit de la API de Claude', correct: false, explanation: 'Rate limits son un problema logistico, no arquitectonico. Se resuelve con plan adecuado. El riesgo real es la coordinacion entre agentes.' },
        { text: 'Los agentes se coordinan automaticamente, no hay riesgo', correct: false, explanation: 'Los agentes NO se coordinan magicamente. Cada uno tiene su propio contexto y no sabe que estan haciendo los otros. La coordinacion debe ser diseñada explicitamente.' }
      ],
      source: 'Claude Code - Documentacion Oficial',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
    },
    {
      question: 'Tu equipo usa Cursor para desarrollo diario pero necesitas automatizar tareas nocturnas (regenerar tests, actualizar docs, linting masivo). ¿Que herramienta usas para las tareas nocturnas?',
      options: [
        { text: 'Cursor en modo headless corriendo en un servidor', correct: false, explanation: 'Cursor es un IDE con interfaz grafica. No tiene un modo headless productivo para automatizacion. Necesitas un agente CLI.' },
        { text: 'Un agente CLI (Claude Code/OpenCode) corriendo en un CI pipeline o un cron job en el servidor', correct: true, explanation: 'Correcto. Los agentes CLI son ideales para automatizacion: no necesitan GUI, se integran con cron/CI, pueden correr en cualquier servidor. Cursor es para trabajo interactivo diurno, CLI agents para automatizacion.' },
        { text: 'GitHub Copilot con auto-complete programado', correct: false, explanation: 'Copilot es un sistema de sugerencias inline. No puede ejecutar tareas autonomas como regenerar tests o actualizar documentacion.' },
        { text: 'Un script bash que llame a la API de OpenAI directamente', correct: false, explanation: 'Reinventar la rueda. Los agentes CLI ya manejan tool calling, contexto, retry, y todas las complejidades. Un script bash seria fragil y limitado.' }
      ],
      source: 'Addy Osmani - My LLM Coding Workflow',
      sourceUrl: 'https://addyosmani.com/blog/ai-coding-workflow/'
    },
    {
      question: 'Estas configurando tu workspace multi-agente. ¿Cual de estos archivos de reglas es el MAS importante para incluir en el repositorio?',
      options: [
        { text: '.gitignore — para excluir archivos del agente del control de versiones', correct: false, explanation: '.gitignore es importante pero no es "de reglas del agente". Es configuracion general de git.' },
        { text: 'CLAUDE.md (o equivalente) en la raiz del proyecto — define convenciones, patrones prohibidos, estructura esperada, y como el agente debe trabajar en ESTE proyecto', correct: true, explanation: 'Correcto. CLAUDE.md (o .cursorrules, etc.) es el archivo mas critico porque define el COMPORTAMIENTO del agente en el contexto de tu proyecto. Sin el, el agente opera con defaults genericos que pueden no ser apropiados para tu codebase.' },
        { text: 'package.json — para que el agente sepa que dependencias usar', correct: false, explanation: 'package.json es configuracion del proyecto, no reglas de comportamiento del agente. El agente lo lee automaticamente, no necesitas reglas especiales.' },
        { text: 'tsconfig.json — para que el agente genere TypeScript correcto', correct: false, explanation: 'tsconfig es configuracion de TypeScript. El agente lo usa automaticamente. Las REGLAS del agente definen comportamiento de alto nivel: patrones, convenciones, restricciones.' }
      ],
      source: 'Claude Code - Documentacion Oficial',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
    }
  ];
</script>

<svelte:head>
  <title>Modulo 10: {mod.title} | Agent Mastery</title>
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

  <!-- THEORY SECTION 1: Terminal Multiplexers -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Terminal Multiplexers: Tu Centro de Comando</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando trabajas con agentes de codigo, necesitas <strong class="text-agent-highlight">multiples procesos corriendo simultaneamente</strong>: el agente en un pane, los tests en otro, logs en otro, y quizas un segundo agente en otro mas. Un terminal multiplexer es tu centro de comando para todo esto.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128187;</span>
          <h3 class="text-agent-text font-bold">tmux</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">El clasico. Keyboard-driven, ultra estable, funciona en cualquier servidor. Las sesiones persisten aunque se caiga tu conexion SSH.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Layout tipico multi-agente
tmux new-session -s agents
# Pane 1: Claude Code
# Pane 2: Tests en watch mode
# Pane 3: Logs del servidor
# Pane 4: Git status</pre>`}
        </div>
        <p class="text-xs text-agent-muted mt-2">Ventaja: comunidad enorme, plugins maduros (tpm), funciona en cualquier Linux/Mac.</p>
      </div>

      <div class="card border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#10024;</span>
          <h3 class="text-agent-text font-bold">zellij</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">El moderno. Floating panes, mejor UX por defecto, session management nativo, plugins en WebAssembly.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap"># zellij viene con layouts declarativos
# layout.kdl define tu workspace
layout {
  pane split_direction="vertical" {
    pane command="claude" // agente
    pane split_direction="horizontal" {
      pane command="npm" { args "test" "--" "--watch" }
      pane command="tail" { args "-f" "logs/app.log" }
    }
  }
}</pre>`}
        </div>
        <p class="text-xs text-agent-muted mt-2">Ventaja: floating panes para popups temporales, mejor para monitorear multiples agentes.</p>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">¿Cual elegir?</p>
      <p class="text-sm text-agent-muted">Si ya sabes tmux y te funciona, quédate con tmux. Si empiezas de cero o quieres algo mas moderno, zellij tiene mejor UX out-of-the-box. Ambos cumplen la funcion esencial: <strong class="text-agent-text">multiples procesos en una terminal con persistencia de sesion</strong>.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: IDEs Agenticos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">IDEs Agenticos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El IDE ya no es solo un editor de texto. Los IDEs modernos integran agentes directamente en el flujo de trabajo, combinando la <strong class="text-agent-highlight">visualizacion del codigo</strong> con la <strong class="text-agent-highlight">capacidad de accion del agente</strong>.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128640;</span>
          <div>
            <h3 class="text-agent-text font-bold">Cursor</h3>
            <p class="text-sm text-agent-muted">AI-native: construido DESDE CERO pensando en IA. Fork de VS Code pero con IA integrada profundamente. Cursor Agent puede editar multiples archivos, correr comandos, y iterar sobre errores. Tab completion predictivo que "entiende" tu siguiente movimiento.</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128736;&#65039;</span>
          <div>
            <h3 class="text-agent-text font-bold">VS Code + Extensiones Agenticas</h3>
            <p class="text-sm text-agent-muted">El ecosistema abierto. Roo Code (formerly Roo-Cline), Kilo Code, Cline, Continue: extensiones que agregan capacidades agenticas a VS Code. Ventaja: puedes combinar multiples extensiones y personalizar tu setup exacto.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">¿CLI + IDE? Si, ambos.</p>
      <p class="text-sm text-agent-muted">El setup profesional combina <strong class="text-agent-text">agente CLI</strong> (Claude Code/OpenCode en la terminal para tareas complejas) con <strong class="text-agent-text">agente IDE</strong> (Cursor/extensiones para tareas contextuales). No son excluyentes: cada uno tiene su sweet spot.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Claude CoWork -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Claude CoWork</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      CoWork es el producto de Anthropic para <strong class="text-agent-highlight">trabajo autonomo con agentes</strong>. A diferencia de Claude Code (que es para developers), CoWork esta diseñado para que cualquier persona pueda delegar tareas complejas a un agente.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Autonomia</h3>
        <p class="text-xs text-agent-muted">El agente trabaja de forma independiente en una VM con herramientas. Navega la web, edita archivos, usa la terminal, instala software. Tu le das la tarea y el la ejecuta.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Plugins</h3>
        <p class="text-xs text-agent-muted">CoWork se extiende con plugins para tareas especializadas: analisis de datos, investigacion web, generacion de reportes. El ecosistema de plugins crece semanalmente.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">No-Dev Friendly</h3>
        <p class="text-xs text-agent-muted">Product managers, diseñadores, y otros roles pueden usar agentes sin saber programar. Democratiza el acceso al poder de los agentes autonomos.</p>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 4: Agent Teams -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agent Teams: Multiples Agentes en Paralelo</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code puede lanzar multiples agentes que trabajan en paralelo sobre una misma codebase. Es como tener un equipo de developers, pero cada uno es un agente con su propio contexto y capacidad de ejecucion.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">¿Como funciona?</p>
      <ol class="space-y-2 text-sm text-agent-muted">
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">1.</span> <strong class="text-agent-text">Task list compartida:</strong> Un agente orquestador descompone la tarea en subtareas.</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">2.</span> <strong class="text-agent-text">Contextos independientes:</strong> Cada agente worker tiene su propia ventana de contexto. No comparten "memoria".</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">3.</span> <strong class="text-agent-text">Ejecucion paralela:</strong> Los workers ejecutan sus subtareas simultaneamente.</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">4.</span> <strong class="text-agent-text">Consolidacion:</strong> El orquestador revisa los resultados y hace merge.</li>
      </ol>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Cuidado con los conflictos:</p>
      <p class="text-sm text-agent-muted">Si dos agentes editan el mismo archivo, habra conflictos. La clave es <strong class="text-agent-text">definir scope claro</strong>: cada agente trabaja en archivos/directorios diferentes. Para proyectos grandes, combinar Agent Teams con git worktrees es el patron mas robusto.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: Setup Profesional -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Setup Profesional</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El workspace ideal para desarrollo agentico combina multiples herramientas, cada una en su rol. Aqui esta el diagrama completo de un setup profesional.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-6 mb-6">
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-agent-border/50">
          <span class="text-2xl">&#128421;&#65039;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 1: Terminal (zellij/tmux)</p>
            <p class="text-xs text-agent-muted">Centro de comando. Panes para agentes, tests, logs, y monitoreo.</p>
          </div>
        </div>
        <div class="flex items-center gap-3 pb-3 border-b border-agent-border/50">
          <span class="text-2xl">&#128187;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 2: IDE (Cursor/VS Code)</p>
            <p class="text-xs text-agent-muted">Visualizacion de codigo, refactoring interactivo, debugging visual.</p>
          </div>
        </div>
        <div class="flex items-center gap-3 pb-3 border-b border-agent-border/50">
          <span class="text-2xl">&#129302;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 3: Agentes (Claude Code + Cursor Agent)</p>
            <p class="text-xs text-agent-muted">CLI agent para tareas complejas, IDE agent para tareas contextuales.</p>
          </div>
        </div>
        <div class="flex items-center gap-3 pb-3 border-b border-agent-border/50">
          <span class="text-2xl">&#128203;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 4: Reglas (CLAUDE.md + .cursorrules)</p>
            <p class="text-xs text-agent-muted">Convenciones del proyecto versionadas con git. System prompt persistente.</p>
          </div>
        </div>
        <div class="flex items-center gap-3 pb-3 border-b border-agent-border/50">
          <span class="text-2xl">&#128268;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 5: MCP Servers</p>
            <p class="text-xs text-agent-muted">Herramientas externas: filesystem, git, database, APIs custom.</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-2xl">&#9881;&#65039;</span>
          <div class="flex-1">
            <p class="text-agent-text font-bold">Capa 6: CI/CD</p>
            <p class="text-xs text-agent-muted">Pipeline automatizado con agentes integrados para review y testing.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 6: Herramientas Complementarias -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Herramientas Complementarias</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El agente es tan bueno como las herramientas que tiene disponibles. Estas utilidades modernas de la CLI complementan tu flujo de trabajo agentico.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Herramienta</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Reemplaza</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Ventaja para Agentes</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">ripgrep (rg)</td>
            <td class="py-3 px-4">grep</td>
            <td class="py-3 px-4">10-100x mas rapido. Respeta .gitignore. Los agentes lo usan para buscar en codebases.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">fd</td>
            <td class="py-3 px-4">find</td>
            <td class="py-3 px-4">Sintaxis intuitiva, rapido, respeta .gitignore. Busqueda de archivos optimizada.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">bat</td>
            <td class="py-3 px-4">cat</td>
            <td class="py-3 px-4">Syntax highlighting automatico. Los agentes generan output mas legible.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">eza</td>
            <td class="py-3 px-4">ls</td>
            <td class="py-3 px-4">Git status integrado, iconos, tree view. Mejor visualizacion de estructura de proyecto.</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-highlight">git worktrees</td>
            <td class="py-3 px-4">git clone multiple</td>
            <td class="py-3 px-4">Copias de trabajo aisladas sin duplicar el repo. Clave para agentes paralelos.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Pro tip:</p>
      <p class="text-sm text-agent-muted">Si usas tmux o zellij, crea un archivo de layout (<strong class="text-agent-text">tmuxinator</strong> para tmux o <strong class="text-agent-text">.kdl</strong> para zellij) que levante todo tu workspace con un solo comando. En 2 segundos tienes agente, tests, logs, y git listos para trabajar.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el workspace profesional interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="El Workspace Profesional del Agent Architect"
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
      <span class="text-4xl block mb-3">&#128421;&#65039;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ya conoces el setup profesional para trabajo con agentes: terminal multiplexers, IDEs agenticos, Agent Teams, y todas las herramientas que complementan tu flujo de trabajo.</p>
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
