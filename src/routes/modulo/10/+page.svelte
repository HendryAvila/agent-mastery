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

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en un terminal multiplexer como un <strong class="text-agent-highlight">escritorio virtual dentro de tu terminal</strong>. Asi como tu escritorio tiene ventanas, el multiplexer tiene panes. Pero con una ventaja critica: las sesiones <strong class="text-agent-text">persisten</strong>. Si tu conexion SSH se cae a las 3 AM mientras un agente ejecuta un refactor masivo, la sesion sigue corriendo. Te reconectas y todo esta ahi.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Los desarrolladores profesionales que trabajan con agentes en 2026 tipicamente corren <strong class="text-agent-text">3-4 agentes simultaneamente</strong>: uno para la tarea principal, otro para tests, otro para documentacion, y quizas uno investigando un approach alternativo. Sin un multiplexer, manejar esto seria imposible.</p>
    </div>

    <!-- tmux Deep Dive -->
    <h3 class="text-xl font-bold text-agent-text mb-3">tmux: El Clasico Inquebrantable</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      tmux (Terminal MUltipleXer) ha sido el estandar de facto por mas de una decada. Es keyboard-driven, ultra estable, y funciona en absolutamente cualquier servidor Linux o Mac. Su modelo mental se basa en tres conceptos jerarquicos.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128193;</span>
          <div>
            <h4 class="text-agent-text font-bold">Sessions (Sesiones)</h4>
            <p class="text-sm text-agent-muted">El contenedor de nivel mas alto. Cada sesion es un workspace completo e independiente. Puedes tener una sesion para el proyecto A y otra para el proyecto B. Las sesiones persisten en el servidor aunque te desconectes.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128196;</span>
          <div>
            <h4 class="text-agent-text font-bold">Windows (Ventanas)</h4>
            <p class="text-sm text-agent-muted">Dentro de una sesion, las ventanas son como pestanas de un navegador. Cada una ocupa toda la pantalla. Navegas entre ventanas con Ctrl+B seguido de un numero (0-9) o n/p para siguiente/anterior.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128200;</span>
          <div>
            <h4 class="text-agent-text font-bold">Panes (Paneles)</h4>
            <p class="text-sm text-agent-muted">Dentro de una ventana, puedes dividir la pantalla en multiples panes. Cada pane ejecuta un proceso independiente. Los panes son la unidad mas util para trabajo multi-agente: ves todo simultaneamente.</p>
          </div>
        </div>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      Los keybindings esenciales de tmux (todos empiezan con el prefix <strong class="text-agent-text">Ctrl+B</strong>):
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Keybinding</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Accion</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Uso en Multi-Agente</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B %</td>
            <td class="py-2 px-3">Split vertical</td>
            <td class="py-2 px-3">Agente a la izquierda, output a la derecha</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B "</td>
            <td class="py-2 px-3">Split horizontal</td>
            <td class="py-2 px-3">Tests/logs debajo del agente</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B flecha</td>
            <td class="py-2 px-3">Navegar entre panes</td>
            <td class="py-2 px-3">Cambiar rapidamente entre agentes</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B d</td>
            <td class="py-2 px-3">Detach (desconectar)</td>
            <td class="py-2 px-3">Los agentes siguen corriendo en background</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B z</td>
            <td class="py-2 px-3">Zoom a un pane</td>
            <td class="py-2 px-3">Focus en un agente especifico temporalmente</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B [</td>
            <td class="py-2 px-3">Scroll mode</td>
            <td class="py-2 px-3">Revisar output anterior del agente</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      Un archivo <strong class="text-agent-text">.tmux.conf</strong> optimizado para trabajo multi-agente:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># ~/.tmux.conf optimizado para multi-agente
# Cambiar prefix a Ctrl+A (mas comodo)
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# Splits mas intuitivos
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Navegacion rapida entre panes con Alt+flechas
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# Mouse habilitado (para resize y seleccion)
set -g mouse on

# Historial grande (agentes generan MUCHO output)
set -g history-limit 50000

# Colores correctos (256 colores)
set -g default-terminal "screen-256color"

# Status bar informativa
set -g status-right '#[fg=cyan]#H #[fg=white]| #[fg=yellow]%H:%M'

# Resize agresivo de panes
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# Sync panes (enviar input a TODOS los panes)
# Util para ejecutar el mismo comando en multiples agentes
bind S setw synchronize-panes</pre>`}
    </div>

    <!-- zellij Deep Dive -->
    <h3 class="text-xl font-bold text-agent-text mb-3">zellij: El Moderno que Viene con Todo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      zellij nacio en 2021 como una alternativa moderna a tmux. Escrito en Rust, fue diseñado desde cero pensando en la UX moderna. La filosofia es: <strong class="text-agent-highlight">funcionar bien desde el primer momento sin necesidad de configuracion extensa</strong>. Para trabajo con agentes en 2026, zellij tiene varias ventajas que marcan diferencia.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">Floating Panes</h4>
        <p class="text-xs text-agent-muted">Ventanas flotantes que aparecen ENCIMA del layout principal. Perfectas para ver el output de un comando rapido sin perder tu vista de los agentes. Piensa en ellos como "popups" de la terminal. Con <strong class="text-agent-text">Ctrl+P w</strong> creas un floating pane, lo usas, y lo cierras.</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">Session Manager Nativo</h4>
        <p class="text-xs text-agent-muted">Guarda y restaura sesiones automaticamente. Con <strong class="text-agent-text">zellij attach nombre</strong> vuelves exactamente al estado donde lo dejaste. tmux necesita plugins como tmux-resurrect para esto; en zellij es nativo.</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">WebAssembly Plugins</h4>
        <p class="text-xs text-agent-muted">Plugins escritos en WASM que extienden funcionalidad: status bar personalizado, file manager, session switcher. La barrera de entrada para crear plugins es mas baja que con tmux (cualquier lenguaje que compile a WASM).</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">Layouts Declarativos (.kdl)</h4>
        <p class="text-xs text-agent-muted">Defines tu workspace en un archivo KDL (similar a JSON pero mas legible) y zellij lo levanta con un comando. Es la forma mas poderosa de configurar workspaces repetibles para multi-agente.</p>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      Un layout de zellij optimizado para trabajo con agentes:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap">// ~/.config/zellij/layouts/agent-workspace.kdl
layout {
    // Barra de estado superior
    pane size=1 borderless=true {
        plugin location="tab-bar"
    }

    // Layout principal
    pane split_direction="vertical" {
        // Columna izquierda: 60% - Agente principal
        pane size="60%" {
            pane split_direction="horizontal" {
                // Agente CLI (Claude Code)
                pane size="70%" name="Agent" command="claude" {
                    // Se abre con claude code listo
                }
                // Git status y diffs
                pane size="30%" name="Git" command="watch" {
                    args "-n" "5" "git" "status" "--short"
                }
            }
        }

        // Columna derecha: 40% - Monitoreo
        pane size="40%" {
            pane split_direction="horizontal" {
                // Tests en watch mode
                pane size="40%" name="Tests" command="npm" {
                    args "test" "--" "--watch"
                }
                // Logs del servidor
                pane size="30%" name="Logs" command="tail" {
                    args "-f" "logs/app.log"
                }
                // Terminal libre para comandos ad-hoc
                pane size="30%" name="Terminal"
            }
        }
    }

    // Barra de estado inferior
    pane size=2 borderless=true {
        plugin location="status-bar"
    }
}</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      Para levantar este workspace, solo ejecutas:
    </p>

    <div class="bg-agent-darker rounded-lg p-3 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono">zellij --layout agent-workspace</pre>`}
    </div>

    <!-- Comparison Table -->
    <h3 class="text-xl font-bold text-agent-text mb-3">tmux vs zellij: Comparacion Detallada</h3>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Criterio</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">tmux</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">zellij</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Facilidad de inicio</td>
            <td class="py-2 px-3">Curva de aprendizaje empinada. Necesita .tmux.conf</td>
            <td class="py-2 px-3">Funciona bien out-of-the-box. Hints en pantalla</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Floating panes</td>
            <td class="py-2 px-3">No nativo (hack con popups)</td>
            <td class="py-2 px-3">Nativo. Ctrl+P w</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Session management</td>
            <td class="py-2 px-3">Requiere plugin (tmux-resurrect)</td>
            <td class="py-2 px-3">Nativo y automatico</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Plugins</td>
            <td class="py-2 px-3">tpm (bash scripts)</td>
            <td class="py-2 px-3">WebAssembly (cualquier lenguaje)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Layouts declarativos</td>
            <td class="py-2 px-3">tmuxinator (gem externa)</td>
            <td class="py-2 px-3">.kdl files (nativo)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Estabilidad</td>
            <td class="py-2 px-3">Ultra estable (decadas de uso)</td>
            <td class="py-2 px-3">Estable (menor historial)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Comunidad</td>
            <td class="py-2 px-3">Enorme, madurisima</td>
            <td class="py-2 px-3">Creciendo rapidamente</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Disponibilidad servidores</td>
            <td class="py-2 px-3">Preinstalado en casi todo</td>
            <td class="py-2 px-3">Requiere instalacion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Lenguaje config</td>
            <td class="py-2 px-3">.tmux.conf (syntax propia)</td>
            <td class="py-2 px-3">KDL (moderno, legible)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Multi-agente UX</td>
            <td class="py-2 px-3">Funcional con config manual</td>
            <td class="py-2 px-3">Superior (floating panes, layouts nativos)</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-highlight">Scrollback/historial</td>
            <td class="py-2 px-3">Configurable (copy mode)</td>
            <td class="py-2 px-3">Scrollback nativo con busqueda</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Multi-agent terminal pattern -->
    <h3 class="text-xl font-bold text-agent-text mb-3">El Patron de Terminal Multi-Agente</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El layout que los profesionales usan tipicamente divide la pantalla en 4 zonas especificas. Cada zona tiene un proposito claro.
    </p>

    <div class="grid grid-cols-2 gap-3 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-1">Pane 1: Agente Principal</h4>
        <p class="text-xs text-agent-muted">Claude Code o tu agente CLI principal. Ocupa el pane mas grande (50-60% de la pantalla). Es donde interactuas directamente con el agente.</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-1">Pane 2: Tests Watch</h4>
        <p class="text-xs text-agent-muted">Tests corriendo en modo watch. Cada vez que el agente modifica codigo, los tests se re-ejecutan automaticamente. Feedback inmediato de si los cambios rompen algo.</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <h4 class="text-agent-warning font-bold text-sm mb-1">Pane 3: Logs/Output</h4>
        <p class="text-xs text-agent-muted">Tail de logs del servidor o del proyecto. Si el agente esta construyendo una API, ves los requests en tiempo real. Tambien util para ver errores de compilacion.</p>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-info">
        <h4 class="text-agent-info font-bold text-sm mb-1">Pane 4: Terminal Libre</h4>
        <p class="text-xs text-agent-muted">Para comandos ad-hoc: git status, verificar archivos, ejecutar scripts, o lanzar un segundo agente para una tarea paralela.</p>
      </div>
    </div>

    <!-- Script for workspace setup -->
    <p class="text-agent-muted leading-relaxed mb-3">
      Un script bash para levantar tu workspace tmux multi-agente con un solo comando:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">#!/bin/bash
# agent-workspace.sh — Levanta tmux para trabajo multi-agente
SESSION="agents"

# Si la sesion ya existe, reconectar
tmux has-session -t $SESSION 2>/dev/null
if [ $? == 0 ]; then
    tmux attach-session -t $SESSION
    exit 0
fi

# Crear nueva sesion
tmux new-session -d -s $SESSION -n "main"

# Pane 1: Agente principal (ya esta creado)
tmux send-keys -t $SESSION "cd ~/project && claude" C-m

# Pane 2: Tests en watch mode (split horizontal)
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION "cd ~/project && npm test -- --watch" C-m

# Pane 3: Logs (split vertical en el pane derecho)
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/project && tail -f logs/app.log 2>/dev/null || echo 'No logs yet'" C-m

# Pane 4: Terminal libre (split vertical en el pane izquierdo)
tmux select-pane -t 0
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/project" C-m

# Volver al pane del agente y ajustar tamanos
tmux select-pane -t 0
tmux resize-pane -R 20

# Conectar
tmux attach-session -t $SESSION</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Equipos de startups como Vercel y Railway usan sesiones de tmux/zellij persistentes en servidores de desarrollo para que <strong class="text-agent-text">cualquier miembro del equipo pueda reconectarse</strong> a un workspace de agentes en progreso. Un developer empieza un refactor con el agente por la manana, y su colega en otra timezone puede reconectarse a la misma sesion por la tarde para continuar. Las sesiones de los agentes se tratan como <strong class="text-agent-text">recursos compartidos del equipo</strong>, no como herramientas individuales.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">¿Cual elegir?</p>
      <p class="text-sm text-agent-muted">Si ya sabes tmux y te funciona, quédate con tmux. Si empiezas de cero o quieres algo mas moderno, zellij tiene mejor UX out-of-the-box. Ambos cumplen la funcion esencial: <strong class="text-agent-text">multiples procesos en una terminal con persistencia de sesion</strong>. Lo que NO debes hacer es trabajar sin multiplexer: abrir 4 ventanas de terminal separadas es caos.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: IDEs Agenticos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">IDEs Agenticos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El IDE ya no es solo un editor de texto. Los IDEs modernos integran agentes directamente en el flujo de trabajo, combinando la <strong class="text-agent-highlight">visualizacion del codigo</strong> con la <strong class="text-agent-highlight">capacidad de accion del agente</strong>. En 2026, la linea entre "editor" y "agente" se desdibuja completamente.
    </p>

    <!-- Cursor Deep Dive -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Cursor: El IDE AI-Native</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cursor es un fork de VS Code construido <strong class="text-agent-highlight">desde cero pensando en IA</strong>. No es "VS Code con un plugin de IA"; es un IDE donde la IA esta integrada en cada capa: autocompletado, edicion, terminal, busqueda, y agente autonomo.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#129302;</span>
          <div>
            <h4 class="text-agent-text font-bold">Agent Mode</h4>
            <p class="text-sm text-agent-muted">El agente de Cursor puede editar multiples archivos simultaneamente, ejecutar comandos en la terminal, interpretar errores, y iterar hasta que el codigo funcione. Le das una instruccion de alto nivel ("agrega autenticacion JWT a esta API") y el agente planifica y ejecuta los cambios necesarios en todos los archivos relevantes.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128065;&#65039;</span>
          <div>
            <h4 class="text-agent-text font-bold">Background Agents</h4>
            <p class="text-sm text-agent-muted">Los agentes en background trabajan mientras tu haces otra cosa. Puedes lanzar un background agent para que migre tests a un nuevo framework, y mientras tanto seguir escribiendo codigo. Cuando termina, te muestra un diff con los cambios propuestos.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#127908;</span>
          <div>
            <h4 class="text-agent-text font-bold">Voice Input</h4>
            <p class="text-sm text-agent-muted">Puedes hablarle al agente en lenguaje natural usando voz. Esto cambia la ergonomia: en vez de escribir prompts largos, simplemente describes lo que necesitas hablando. Particularmente util cuando estas pensando en voz alta sobre un approach.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128203;</span>
          <div>
            <h4 class="text-agent-text font-bold">Rules System (.cursorrules)</h4>
            <p class="text-sm text-agent-muted">Un archivo <strong class="text-agent-text">.cursorrules</strong> en la raiz del proyecto define como el agente de Cursor se comporta: que patrones seguir, que evitar, que dependencias usar. Es el equivalente de CLAUDE.md pero para el ecosistema Cursor.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- VS Code + Extensions -->
    <h3 class="text-xl font-bold text-agent-text mb-3">VS Code + Extensiones Agenticas</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si prefieres el ecosistema abierto de VS Code, hay varias extensiones que le agregan capacidades agenticas completas. La ventaja: puedes combinar extensiones, elegir tu modelo, y personalizar todo.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128054;</span>
          <div>
            <h4 class="text-agent-text font-bold">Roo Code (ex Roo-Cline)</h4>
            <p class="text-sm text-agent-muted">Extension con multiples "modos" de operacion: <strong class="text-agent-text">Code</strong> (escribe codigo), <strong class="text-agent-text">Architect</strong> (diseña antes de implementar), <strong class="text-agent-text">Debug</strong> (diagnostica problemas), <strong class="text-agent-text">Ask</strong> (responde preguntas). Soporta multiples proveedores de modelos (Anthropic, OpenAI, local).</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128169;</span>
          <div>
            <h4 class="text-agent-text font-bold">Kilo Code</h4>
            <p class="text-sm text-agent-muted">Fork de Cline enfocado en eficiencia de tokens. Optimiza las llamadas al LLM para reducir costos manteniendo calidad. Ideal si pagas por tokens y quieres maximizar el valor de cada request.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#9654;&#65039;</span>
          <div>
            <h4 class="text-agent-text font-bold">Continue</h4>
            <p class="text-sm text-agent-muted">Extension open-source que se conecta a cualquier modelo (local o cloud). Diseñada para equipos que quieren control total sobre que modelo se usa, donde se procesan los datos, y como se configura el agente. Fuerte en privacidad y compliance.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hybrid approach -->
    <h3 class="text-xl font-bold text-agent-text mb-3">El Approach Hibrido: CLI + IDE</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El setup profesional combina ambos mundos. No son excluyentes; cada uno tiene su <strong class="text-agent-highlight">sweet spot</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Agente CLI (Claude Code, OpenCode, Aider)</h4>
        <p class="text-xs text-agent-muted mb-2">Mejor para:</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Tareas que tocan muchos archivos (refactor masivo)</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Operaciones de shell complejas (scripts, deployments)</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Automatizacion (CI/CD, cron jobs, batch)</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Trabajo en servidores remotos via SSH</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Tareas que requieren acceso al sistema entero</li>
        </ul>
      </div>
      <div class="card border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">Agente IDE (Cursor Agent, Roo Code)</h4>
        <p class="text-xs text-agent-muted mb-2">Mejor para:</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Refactoring contextual (este archivo, esta funcion)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Generacion de codigo inline (autocomplete avanzado)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Code review interactivo con diff visual</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Exploracion de codebase con preguntas</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Trabajo visual con CSS/UI</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Usar SOLO un IDE agent cuando un CLI agent seria mejor (o viceversa). Ejemplo: necesitas ejecutar una migracion de base de datos, correr seeds, y verificar con queries -- eso es territorio de CLI agent, no de IDE agent. Inversamente, ajustar estilos CSS mirando el resultado en tiempo real es territorio de IDE, no de CLI. <strong class="text-agent-text">Usa la herramienta correcta para la tarea correcta.</strong></p>
    </div>

    <!-- Comparison table -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Comparacion: Cursor vs VS Code+Roo vs Windsurf</h3>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Criterio</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Cursor</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">VS Code + Roo</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Windsurf</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Integracion IA</td>
            <td class="py-2 px-3">Nativa (core del producto)</td>
            <td class="py-2 px-3">Extension (add-on)</td>
            <td class="py-2 px-3">Nativa (fork de VS Code)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Agente autonomo</td>
            <td class="py-2 px-3">Cursor Agent (potente)</td>
            <td class="py-2 px-3">Roo Code modes</td>
            <td class="py-2 px-3">Cascade Agent</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Modelos disponibles</td>
            <td class="py-2 px-3">Claude, GPT-4, modelos propios</td>
            <td class="py-2 px-3">Cualquiera (BYO key)</td>
            <td class="py-2 px-3">Claude, GPT-4, modelos propios</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Extensiones VS Code</td>
            <td class="py-2 px-3">Mayoria compatible</td>
            <td class="py-2 px-3">100% compatible</td>
            <td class="py-2 px-3">Mayoria compatible</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight">Precio</td>
            <td class="py-2 px-3">$20/mes (Pro)</td>
            <td class="py-2 px-3">Gratis + costo API</td>
            <td class="py-2 px-3">$10-15/mes</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-highlight">Control/privacidad</td>
            <td class="py-2 px-3">Medio (cloud-first)</td>
            <td class="py-2 px-3">Total (tu API, tu modelo)</td>
            <td class="py-2 px-3">Medio (cloud-first)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">¿CLI + IDE? Si, ambos.</p>
      <p class="text-sm text-agent-muted">El setup profesional combina <strong class="text-agent-text">agente CLI</strong> (Claude Code/OpenCode en la terminal para tareas complejas) con <strong class="text-agent-text">agente IDE</strong> (Cursor/extensiones para tareas contextuales). No son excluyentes: cada uno tiene su sweet spot. La mayoria de los profesionales alternan entre ambos <strong class="text-agent-text">varias veces por hora</strong>.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Claude CoWork -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Claude CoWork</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      CoWork es el producto de Anthropic para <strong class="text-agent-highlight">trabajo autonomo con agentes</strong>. A diferencia de Claude Code (que es para developers), CoWork esta diseñado para que cualquier persona pueda delegar tareas complejas a un agente.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en la diferencia asi: <strong class="text-agent-text">Claude Code = agente para developers</strong> (ejecuta en tu terminal, accede a tu filesystem, corre tests). <strong class="text-agent-text">CoWork = agente para profesionales</strong> (ejecuta en una VM aislada, navega la web, procesa documentos, genera reportes). El nivel de autonomia es similar, pero la audiencia y la interfaz son completamente diferentes.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Autonomia Total</h3>
        <p class="text-xs text-agent-muted">El agente trabaja de forma independiente en una VM con herramientas. Navega la web, edita archivos, usa la terminal, instala software. Tu le das la tarea y el la ejecuta. Piensa en un asistente que puede usar una computadora como un humano.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Plugins Especializados</h3>
        <p class="text-xs text-agent-muted">CoWork se extiende con plugins para tareas especificas: analisis de datos con Python, investigacion web profunda, generacion de presentaciones, procesamiento de documentos legales. El ecosistema de plugins crece semanalmente.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">No-Dev Friendly</h3>
        <p class="text-xs text-agent-muted">Product managers, diseñadores, abogados, analistas: cualquier profesional puede usar agentes sin saber programar. La interfaz es visual, las tareas se describen en lenguaje natural, y los resultados se entregan en formatos familiares.</p>
      </div>
    </div>

    <!-- CoWork vs Claude Code -->
    <h3 class="text-xl font-bold text-agent-text mb-3">CoWork vs Claude Code: ¿Cuando Usar Cada Uno?</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Claude Code</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Audiencia: developers</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Interfaz: terminal CLI</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Entorno: TU maquina (acceso directo)</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Ideal: escribir codigo, tests, refactoring</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Control: maximo (ves todo lo que hace)</li>
        </ul>
      </div>
      <div class="card border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">CoWork</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Audiencia: cualquier profesional</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Interfaz: web visual</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Entorno: VM aislada (sandbox)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Ideal: research, analisis, reportes, datos</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#9656;</span>Control: medio (delegas y verificas resultado)</li>
        </ul>
      </div>
    </div>

    <!-- Use cases -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Casos de Uso de CoWork</h3>
    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <h4 class="text-agent-text font-bold text-sm mb-1">Revision de documentos legales</h4>
        <p class="text-xs text-agent-muted">Un abogado sube un contrato y pide al agente que identifique clausulas problematicas, compare con contratos anteriores, y genere un resumen de riesgos. El agente lee el documento, busca precedentes legales en la web, y produce un reporte estructurado.</p>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <h4 class="text-agent-text font-bold text-sm mb-1">Analisis de marketing</h4>
        <p class="text-xs text-agent-muted">Un marketing manager pide analizar las campañas del ultimo trimestre. El agente descarga los CSV de Google Analytics, procesa los datos con Python, genera graficos, identifica tendencias, y produce un reporte con recomendaciones.</p>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <h4 class="text-agent-text font-bold text-sm mb-1">Procesamiento de datos</h4>
        <p class="text-xs text-agent-muted">Un analista necesita limpiar y cruzar 5 datasets de diferentes fuentes. El agente escribe los scripts de Python necesarios, los ejecuta, identifica inconsistencias en los datos, y produce un dataset limpio con un log de todas las transformaciones.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Empresas como McKinsey y Deloitte estan usando agentes autonomos (tipo CoWork) para que sus consultores procesen datos de clientes en horas en lugar de semanas. Un consultor que antes tardaba 3 dias en analizar datos financieros de un cliente ahora delega la tarea al agente, revisa el resultado en 2 horas, y dedica su tiempo a la estrategia. El agente se encarga del trabajo repetitivo; el humano se enfoca en el <strong class="text-agent-text">juicio de negocio</strong>.</p>
    </div>

    <!-- Future vision -->
    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-2">La Vision del Futuro</p>
      <p class="text-sm text-agent-muted">Estamos evolucionando hacia <strong class="text-agent-text">plataformas de orquestacion de agentes</strong> donde manages una "flota" de agentes como un manager gestiona un equipo. Cada agente tiene su especialidad, su nivel de autonomia, y sus permisos. Tu rol como Agent Architect es diseñar esa flota: decidir cuantos agentes, que hace cada uno, como se comunican, y cuando escalar a un humano. El futuro no es "un agente que lo hace todo". Es <strong class="text-agent-text">un equipo de agentes especializados que colaboran</strong>.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Agent Teams -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agent Teams: Multiples Agentes en Paralelo</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code puede lanzar multiples agentes que trabajan en paralelo sobre una misma codebase. Es como tener un equipo de developers, pero cada uno es un agente con su propio contexto y capacidad de ejecucion.
    </p>

    <!-- How it works -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Mecanismo Tecnico: Cómo Comparten una Codebase</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando lanzas Agent Teams, cada agente NO obtiene una copia del repositorio. Todos trabajan sobre el <strong class="text-agent-highlight">mismo filesystem</strong>. Esto es poderoso pero peligroso.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">¿Como funciona internamente?</p>
      <ol class="space-y-3 text-sm text-agent-muted">
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">1.</span> <strong class="text-agent-text">Task list compartida:</strong> Un agente orquestador analiza tu peticion y la descompone en subtareas independientes. Escribe estas subtareas en un archivo de task list que todos pueden leer. Cada subtarea incluye: descripcion, archivos involucrados, y criterio de completitud.</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">2.</span> <strong class="text-agent-text">Contextos independientes:</strong> Cada agente worker tiene su propia ventana de contexto (conversation history). No comparten "memoria". El worker A no sabe que esta haciendo el worker B en este momento. Solo saben su tarea asignada.</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">3.</span> <strong class="text-agent-text">Ejecucion paralela:</strong> Los workers ejecutan sus subtareas simultaneamente. Cada uno lee y escribe archivos, ejecuta comandos, y produce resultados.</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent font-bold shrink-0">4.</span> <strong class="text-agent-text">Consolidacion:</strong> El orquestador revisa los resultados de cada worker, verifica consistencia, resuelve conflictos si los hay, y produce el resultado final.</li>
      </ol>
    </div>

    <!-- Git Worktrees -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Git Worktrees: La Solucion para Agentes Paralelos</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La forma mas robusta de ejecutar multiples agentes en el mismo repo sin conflictos es usando <strong class="text-agent-highlight">git worktrees</strong>. Un worktree crea una copia de trabajo del repositorio <strong class="text-agent-text">sin duplicar el historial de git</strong>. Cada agente trabaja en su propio worktree (su propia rama y directorio) y al final se hace merge.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Crear worktrees para 3 agentes trabajando en paralelo
cd ~/project

# Worktree 1: Agent que trabaja en el API
git worktree add ../project-agent-api feature/api-refactor

# Worktree 2: Agent que trabaja en tests
git worktree add ../project-agent-tests feature/new-tests

# Worktree 3: Agent que trabaja en docs
git worktree add ../project-agent-docs feature/update-docs

# Cada agente se lanza en su worktree
# En pane 1 de tmux:
cd ../project-agent-api && claude "Refactoriza los endpoints de users"

# En pane 2 de tmux:
cd ../project-agent-tests && claude "Agrega tests para el modulo auth"

# En pane 3 de tmux:
cd ../project-agent-docs && claude "Actualiza la documentacion del API"

# Cuando terminan, merge de cada branch
git merge feature/api-refactor
git merge feature/new-tests
git merge feature/update-docs

# Limpiar worktrees
git worktree remove ../project-agent-api
git worktree remove ../project-agent-tests
git worktree remove ../project-agent-docs</pre>`}
    </div>

    <!-- The 100K line example -->
    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">En demos internas de Anthropic, se mostro como <strong class="text-agent-text">16 agentes trabajando en paralelo</strong> escribieron un compilador de C de mas de 100,000 lineas de codigo. Cada agente se encargaba de un modulo especifico del compilador (lexer, parser, codegen, optimizer, etc.) y un agente orquestador coordinaba la integracion. El proyecto que a un equipo le tomaria semanas se completo en horas. Pero la clave NO fue la velocidad: fue la <strong class="text-agent-text">descomposicion clara de responsabilidades</strong> que evito que los agentes se pisaran.</p>
    </div>

    <!-- Communication patterns -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Patrones de Comunicacion entre Agentes</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes en un team no se "hablan" directamente. Su comunicacion es <strong class="text-agent-highlight">indirecta</strong>, a traves de artefactos compartidos.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-text font-bold text-sm mb-1">Via filesystem</h4>
        <p class="text-xs text-agent-muted">El agente A escribe un archivo que el agente B lee. Ejemplo: A genera una interfaz TypeScript, B genera la implementacion basada en esa interfaz.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-text font-bold text-sm mb-1">Via task list</h4>
        <p class="text-xs text-agent-muted">El orquestador actualiza un archivo de tareas compartido. Los workers lo leen para saber que hacer. Patron "shared todo list".</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-text font-bold text-sm mb-1">Via git commits</h4>
        <p class="text-xs text-agent-muted">Cada agente commitea su trabajo. Otros agentes pueden hacer git pull para ver los cambios. El commit message comunica que se hizo.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-text font-bold text-sm mb-1">Via README/docs</h4>
        <p class="text-xs text-agent-muted">El agente A actualiza un README con decisiones de diseño. El agente B lo lee antes de empezar su tarea. "Documentacion como comunicacion".</p>
      </div>
    </div>

    <!-- Risks and mitigation -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Riesgos y Estrategias de Mitigacion</h3>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <div>
            <h4 class="text-agent-danger font-bold text-sm mb-1">Merge conflicts</h4>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Problema:</strong> Dos agentes editan el mismo archivo de formas incompatibles. <strong class="text-agent-text">Mitigacion:</strong> Definir scope por directorios. Agente A solo toca /src/api/, agente B solo toca /src/tests/. Si necesitan tocar el mismo archivo, hacerlo secuencial, no paralelo.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <div>
            <h4 class="text-agent-danger font-bold text-sm mb-1">Trabajo duplicado</h4>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Problema:</strong> Dos agentes implementan la misma utility function porque no saben del otro. <strong class="text-agent-text">Mitigacion:</strong> El orquestador debe incluir en las instrucciones de cada worker que utilidades ya existen y donde encontrarlas.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <div>
            <h4 class="text-agent-danger font-bold text-sm mb-1">Cambios contradictorios</h4>
            <p class="text-xs text-agent-muted"><strong class="text-agent-text">Problema:</strong> Agente A cambia una interfaz y agente B la consume con la version vieja. <strong class="text-agent-text">Mitigacion:</strong> Review gates: el orquestador valida consistencia despues de cada worker. Los tests de integracion corren en la consolidacion.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Agent Teams es <strong class="text-agent-text">overkill</strong> para tareas que un solo agente puede manejar en su ventana de contexto. Si tu tarea cabe en 100K tokens de contexto, un solo agente es mas simple y menos propenso a errores. Agent Teams brilla cuando la tarea es <strong class="text-agent-text">demasiado grande para un solo contexto</strong>: refactoring de 50+ archivos, generacion de test suites completas, migraciones masivas. Si no necesitas paralelismo, no lo uses.</p>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Cuidado con los conflictos:</p>
      <p class="text-sm text-agent-muted">Si dos agentes editan el mismo archivo, habra conflictos. La clave es <strong class="text-agent-text">definir scope claro</strong>: cada agente trabaja en archivos/directorios diferentes. Para proyectos grandes, combinar Agent Teams con git worktrees es el patron mas robusto.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: Setup Profesional -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Setup Profesional: Las 6 Capas</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El workspace ideal para desarrollo agentico combina multiples herramientas, cada una en su rol. Aqui esta el diagrama completo de un setup profesional, capa por capa, con lo que necesitas saber de cada una.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-6 mb-6">
      <div class="space-y-6">
        <!-- Layer 1 -->
        <div class="pb-4 border-b border-agent-border/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#128421;&#65039;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 1: Terminal Multiplexer (tmux/zellij)</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">El centro de comando. Todo lo demas vive dentro de esta capa. Panes para agentes, tests, logs, y monitoreo. Sesiones que persisten.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            <p class="text-xs text-agent-accent font-mono">zellij --layout agent-workspace  # o tmux + tmuxinator</p>
          </div>
        </div>
        <!-- Layer 2 -->
        <div class="pb-4 border-b border-agent-border/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#128187;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 2: IDE Agentico (Cursor/VS Code + Roo)</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">Visualizacion de codigo, refactoring interactivo, debugging visual. El complemento visual del agente CLI. Abierto en un monitor aparte o en un pane de tmux via terminal.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            <p class="text-xs text-agent-accent font-mono">cursor ~/project  # o code ~/project con Roo Code</p>
          </div>
        </div>
        <!-- Layer 3 -->
        <div class="pb-4 border-b border-agent-border/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#129302;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 3: Agentes CLI (Claude Code, OpenCode, Aider)</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">El cerebro operativo. Acceso directo al filesystem, shell, git, y todas las herramientas del sistema. El agente CLI es donde ocurre el trabajo pesado: refactors masivos, generacion de tests, debugging complejo, integraciones.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            <p class="text-xs text-agent-accent font-mono">claude  # o opencode, aider --model claude-3.5-sonnet</p>
          </div>
        </div>
        <!-- Layer 4 -->
        <div class="pb-4 border-b border-agent-border/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#128203;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 4: Archivos de Reglas (CLAUDE.md, .cursorrules)</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">El "system prompt" versionado con git. Define convenciones del proyecto, patrones prohibidos, estructura esperada, stack tecnologico, y como el agente debe comportarse en ESTE proyecto especifico. Sin estas reglas, el agente opera con defaults genericos.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Estructura tipica de reglas
project/
  CLAUDE.md          # Reglas para Claude Code
  .cursorrules       # Reglas para Cursor
  .clinerules        # Reglas para Cline/Roo
  rules/
    testing.md       # Reglas especificas de testing
    architecture.md  # Decisiones de arquitectura</pre>`}
          </div>
        </div>
        <!-- Layer 5 -->
        <div class="pb-4 border-b border-agent-border/50">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#128268;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 5: Servidores MCP</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">Model Context Protocol: servidores que exponen herramientas y datos al agente de forma estandarizada. MCP filesystem, MCP git, MCP Postgres, MCP GitHub. Extienden las capacidades del agente sin modificar su codigo. Un agente con 5 MCP servers tiene acceso a 5 sistemas diferentes.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># En .claude/settings.json
"mcpServers": {
  "postgres": { "command": "mcp-postgres", "args": ["--db", "myapp"] },
  "github": { "command": "mcp-github" },
  "filesystem": { "command": "mcp-filesystem", "args": ["/project"] }
}</pre>`}
          </div>
        </div>
        <!-- Layer 6 -->
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="text-2xl">&#9881;&#65039;</span>
            <div class="flex-1">
              <p class="text-agent-text font-bold">Capa 6: CI/CD + Monitoring</p>
            </div>
          </div>
          <p class="text-xs text-agent-muted ml-10 mb-2">Pipeline automatizado con agentes integrados. Los agentes corren en el CI para code review automatico de PRs, generacion de tests, y security scanning. El monitoring te dice si los agentes estan funcionando bien en produccion.</p>
          <div class="ml-10 bg-agent-darker rounded p-2">
            {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># GitHub Actions con agente
- name: AI Code Review
  uses: anthropic/claude-code-action@v1
  with:
    model: claude-sonnet-4
    prompt: "Review this PR for security issues"</pre>`}
          </div>
        </div>
      </div>
    </div>

    <!-- Zero to Professional Guide -->
    <h3 class="text-xl font-bold text-agent-text mb-3">De Cero a Workspace Profesional en 30 Minutos</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si empiezas de cero, esta es la secuencia para tener un workspace multi-agente funcional:
    </p>

    <div class="space-y-2 mb-6">
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Instalar zellij (o tmux si prefieres): <span class="text-agent-highlight font-mono text-xs">brew install zellij</span></p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Instalar Claude Code: <span class="text-agent-highlight font-mono text-xs">npm install -g @anthropic-ai/claude-code</span></p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Crear el layout de zellij o el script de tmux para tu workspace multi-pane</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Escribir un CLAUDE.md basico con las convenciones de tu proyecto</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Configurar 1-2 MCP servers (filesystem y git como minimo)</p>
      </div>
      <div class="flex items-center gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm w-12">5 min</span>
        <p class="text-sm text-agent-muted">Instalar herramientas modernas CLI (ripgrep, fd, bat, eza): <span class="text-agent-highlight font-mono text-xs">brew install ripgrep fd bat eza</span></p>
      </div>
    </div>

    <!-- Dotfiles approach -->
    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Los desarrolladores top versionan su configuracion de agentes con <strong class="text-agent-text">dotfiles</strong>. Tu .tmux.conf, layouts de zellij, CLAUDE.md templates, y configuracion MCP van en un repositorio de dotfiles que puedes clonar en cualquier maquina nueva. En 2 minutos tienes tu workspace de agentes identico en un servidor nuevo. Herramientas como <strong class="text-agent-text">GNU stow</strong> o <strong class="text-agent-text">chezmoi</strong> facilitan esto enormemente.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Un developer senior de una fintech en Berlin comparte su workflow diario: se conecta por SSH a su maquina de desarrollo, ejecuta <span class="text-agent-highlight font-mono text-xs">zellij attach work</span> y en 1 segundo tiene su workspace completo: Claude Code en el pane principal con el contexto del ticket de Jira que esta trabajando, tests en watch mode mostrando verde, logs del staging environment en scroll, y un pane con <span class="text-agent-highlight font-mono text-xs">lazygit</span> para gestionar commits. Su CLAUDE.md tiene reglas especificas de la fintech: "nunca logear PII", "siempre usar transacciones en DB", "todo endpoint requiere rate limiting". El agente sigue estas reglas automaticamente en cada tarea.</p>
    </div>
  </section>

  <!-- THEORY SECTION 6: Herramientas Complementarias -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Herramientas Complementarias</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El agente es tan bueno como las herramientas que tiene disponibles. Estas utilidades modernas de la CLI complementan tu flujo de trabajo agentico. Los agentes como Claude Code ya las detectan y usan automaticamente si estan instaladas.
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
            <td class="py-3 px-4">10-100x mas rapido. Respeta .gitignore. Los agentes lo usan para buscar en codebases masivas en milisegundos.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">fd</td>
            <td class="py-3 px-4">find</td>
            <td class="py-3 px-4">Sintaxis intuitiva, rapido, respeta .gitignore. Busqueda de archivos optimizada para proyectos grandes.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">bat</td>
            <td class="py-3 px-4">cat</td>
            <td class="py-3 px-4">Syntax highlighting automatico, numeros de linea, integracion con git. Los agentes generan output mas legible.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">eza</td>
            <td class="py-3 px-4">ls</td>
            <td class="py-3 px-4">Git status integrado, iconos, tree view. Mejor visualizacion de estructura de proyecto.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">delta</td>
            <td class="py-3 px-4">diff (en git)</td>
            <td class="py-3 px-4">Syntax highlighting en diffs, side-by-side view, numeros de linea. Hace los diffs del agente mucho mas legibles.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">httpie / xh</td>
            <td class="py-3 px-4">curl</td>
            <td class="py-3 px-4">Syntax coloreada en JSON, headers legibles. Perfecto para probar APIs que el agente construye.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">jq</td>
            <td class="py-3 px-4">manual parsing</td>
            <td class="py-3 px-4">Procesamiento de JSON en la terminal. Los agentes lo usan para extraer datos de APIs y configs.</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">lazygit</td>
            <td class="py-3 px-4">git CLI</td>
            <td class="py-3 px-4">TUI interactiva para git. Staging parcial, visualizacion de branches, resolve de conflicts visual.</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-highlight">git worktrees</td>
            <td class="py-3 px-4">git clone multiple</td>
            <td class="py-3 px-4">Copias de trabajo aisladas sin duplicar el repo. Clave para agentes paralelos.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Shell aliases -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Shell Aliases para Flujos de Agentes</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Configura aliases en tu shell para operaciones frecuentes con agentes:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># ~/.bashrc o ~/.zshrc — Aliases para trabajo multi-agente

# Workspace de agentes
alias aw="zellij --layout agent-workspace"
alias awx="tmux attach -t agents || tmux new -s agents"

# Git worktrees rapidos
alias gwt="git worktree add"
alias gwtl="git worktree list"
alias gwtr="git worktree remove"

# Claude Code con contexto
alias cc="claude"
alias ccr="claude --resume"  # resumir ultima sesion

# Monitoreo rapido
alias tw="npm test -- --watch"
alias logs="tail -f logs/*.log"

# Estado del proyecto
alias st="git status --short && echo '---' && eza -la --git --no-time"</pre>`}
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Estudios de productividad muestran que developers con un setup de herramientas CLI optimizado (multiplexer + tools modernas + aliases) son <strong class="text-agent-text">hasta 3x mas productivos</strong> con agentes de codigo. No porque las herramientas sean magicas, sino porque reducen la friccion en las operaciones que repites 100 veces al dia. Cada segundo ahorrado en un alias se multiplica por miles de operaciones.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Pro tip:</p>
      <p class="text-sm text-agent-muted">Si usas tmux o zellij, crea un archivo de layout (<strong class="text-agent-text">tmuxinator</strong> para tmux o <strong class="text-agent-text">.kdl</strong> para zellij) que levante todo tu workspace con un solo comando. En 2 segundos tienes agente, tests, logs, y git listos para trabajar. Version esto en tus dotfiles y nunca mas perder tiempo configurando tu entorno.</p>
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