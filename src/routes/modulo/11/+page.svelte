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

  const MODULE_ID = 11;
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
    const badge = courseStore.unlockBadge('workspace-master');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
  }

  // InteractiveFlow: Workspace Architecture
  const flowNodes = [
    { id: 'terminal', label: 'Terminal Multiplexer', description: 'tmux o zellij como base. Multiples panes para monitorear agentes, tests, logs y git simultaneamente. Las sesiones persisten si se cae la conexion SSH. El multiplexer es tu centro de comando visual para todo lo que corre en la terminal.', icon: '\u{1F5A5}\uFE0F', x: 10, y: 15 },
    { id: 'claude_session', label: 'Sesion Claude Code', description: 'El agente CLI corriendo en un pane del multiplexer. Lee CLAUDE.md al iniciar, conecta a MCP servers, y usa tools del proyecto. Cada sesion tiene su propio contexto y worktree aislado. Es la unidad base de trabajo.', icon: '\u{1F916}', x: 50, y: 10 },
    { id: 'dot_claude', label: '.claude/ Config', description: 'El directorio .claude/ en la raiz del proyecto: settings.json (permisos, modelo), agents/ (agentes custom), skills/ (SKILL.md con frontmatter), commands/ (slash commands), rules/ (reglas adicionales). Es el cerebro de configuracion del workspace.', icon: '\u{2699}\uFE0F', x: 90, y: 15 },
    { id: 'mcp_servers', label: 'MCP Servers', description: 'Servidores MCP configurados en .mcp.json (proyecto) o ~/.claude/settings.json (usuario). Exponen herramientas y datos al agente: Jira, GitHub, bases de datos, filesystem. Son el puente entre Claude Code y tus sistemas externos.', icon: '\u{1F50C}', x: 90, y: 50 },
    { id: 'worktrees', label: 'Git Worktrees', description: 'Copias de trabajo independientes del mismo repo, cada una en una rama distinta. Cada worktree tiene su propia sesion de Claude Code. No duplican el historial git. Permiten 3-5 features en paralelo sin merge conflicts. Es el secreto de la productividad multi-sesion.', icon: '\u{1F333}', x: 50, y: 50 },
    { id: 'parallel', label: 'Sesiones Paralelas', description: 'Multiples sesiones de Claude Code corriendo simultaneamente, cada una en su worktree. Patrones: feature+feature, research+implementation, CI watcher+fixer, review+implement. Boris Cherny recomienda 3-5 sesiones; incident.io usa 4-7.', icon: '\u{1F465}', x: 10, y: 50 },
    { id: 'plugins', label: 'Plugins y Ecosistema', description: 'Extensiones de terceros: compound-engineering (workflows complejos), ContextKit (contexto mejorado), awesome-claude-code (lista curada de MCP servers, hooks, skills). Evalua trust, permisos y sandboxing antes de instalar.', icon: '\u{1F9E9}', x: 50, y: 85 }
  ];

  const flowEdges = [
    { from: 'terminal', to: 'claude_session', label: 'ejecuta' },
    { from: 'claude_session', to: 'dot_claude', label: 'lee config' },
    { from: 'dot_claude', to: 'mcp_servers', label: 'conecta' },
    { from: 'worktrees', to: 'claude_session', label: 'aisla contexto' },
    { from: 'parallel', to: 'worktrees', label: 'usa' },
    { from: 'parallel', to: 'terminal', label: 'monitorea en' },
    { from: 'plugins', to: 'mcp_servers', label: 'extiende' },
    { from: 'plugins', to: 'dot_claude', label: 'configura' }
  ];

  const flowChallenges = [
    { question: 'Necesitas que 3 sesiones de Claude Code trabajen en features distintas sin conflictos. Que componente del workspace lo hace posible?', targetNodeId: 'worktrees', hint: 'Piensa en una funcionalidad de git que crea copias de trabajo independientes sin duplicar el repositorio.' },
    { question: 'Donde configuras los permisos, agentes custom, skills y reglas especificas de tu proyecto para Claude Code?', targetNodeId: 'dot_claude', hint: 'Es un directorio oculto en la raiz del proyecto que contiene toda la configuracion de Claude Code.' },
    { question: 'Quieres que Claude Code pueda leer tickets de Jira y crear PRs en GitHub. Que componente necesitas configurar?', targetNodeId: 'mcp_servers', hint: 'Es un protocolo que conecta agentes con herramientas y datos externos.' },
    { question: 'Estas corriendo 5 sesiones de Claude Code y necesitas ver el output de todas simultaneamente. Que herramienta usas como base?', targetNodeId: 'terminal', hint: 'Piensa en una herramienta que divide tu terminal en multiples paneles persistentes.' }
  ];

  // Quiz questions
  const quizQuestions = [
    {
      question: 'Tu equipo quiere adoptar git worktrees con Claude Code. Un desarrollador pregunta: "por que no simplemente clonar el repo 5 veces?" Cual es la ventaja principal de worktrees sobre multiples clones?',
      options: [
        { text: 'Los worktrees son mas rapidos de crear porque no descargan archivos de la red', correct: false, explanation: 'Un clone local (git clone --local) tampoco descarga de la red. La velocidad de creacion no es la diferencia clave.' },
        { text: 'Los worktrees comparten el mismo repositorio git (.git), lo que significa un solo historial, menos espacio en disco, y que un merge en un worktree se refleja en todos los demas instantaneamente', correct: true, explanation: 'Correcto. Worktrees son "vistas" del mismo repo. Un solo .git/ compartido = un solo historial, una sola fuente de verdad. Multiples clones duplican todo el historial git y no estan sincronizados entre si.' },
        { text: 'Los worktrees tienen mejor rendimiento de lectura/escritura porque usan symlinks', correct: false, explanation: 'Los worktrees no se basan en symlinks. Usan un directorio de trabajo real con un archivo .git que apunta al repositorio principal.' },
        { text: 'Los worktrees permiten hacer push directo sin necesidad de remote', correct: false, explanation: 'Tanto worktrees como clones locales pueden pushear a un remote. Esa no es una diferencia entre ambos.' }
      ],
      source: 'incident.io - Shipping Faster with Claude Code and Git Worktrees',
      sourceUrl: 'https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees'
    },
    {
      question: 'Segun el caso de incident.io, cual fue el factor MAS critico para que su adopcion de multiples agentes concurrentes funcionara?',
      options: [
        { text: 'Usar el modelo mas potente disponible (Opus) para todas las sesiones', correct: false, explanation: 'incident.io no menciona que el modelo sea el factor critico. Un modelo potente ayuda pero no resuelve cuellos de botella de tooling.' },
        { text: '"Fast tooling is a prerequisite" - CI rapido y herramientas que no hagan esperar al agente son condicion necesaria', correct: true, explanation: 'Exacto. incident.io enfatiza que si tu CI tarda 20 minutos, da igual cuantos agentes tengas: todos estaran esperando. El tooling rapido (CI en minutos, tests rapidos, deploys agiles) es lo que desbloquea el valor de multiples agentes.' },
        { text: 'Tener un CLAUDE.md extremadamente detallado de 5000+ palabras', correct: false, explanation: 'Un CLAUDE.md detallado ayuda, pero incident.io destaca fast tooling como prerequisito. Un CLAUDE.md perfecto con CI lento sigue siendo ineficiente.' },
        { text: 'Contratar desarrolladores senior que supervisen cada sesion', correct: false, explanation: 'incident.io menciona que nuevos empleados ("new hires") estaban shipping code on day 2 usando Claude Code. No requiere supervision senior constante.' }
      ],
      source: 'incident.io - Shipping Faster with Claude Code and Git Worktrees',
      sourceUrl: 'https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees'
    },
    {
      question: 'Estas configurando el directorio .claude/ para un nuevo proyecto. Cual de estas estructuras es CORRECTA segun la documentacion oficial?',
      options: [
        { text: '.claude/config.yml con agents, skills, y rules como secciones YAML', correct: false, explanation: 'Claude Code no usa YAML para configuracion. El formato es JSON (settings.json) y Markdown (SKILL.md, agentes).' },
        { text: '.claude/settings.json para permisos + agents/ para agentes custom + skills/ con SKILL.md + commands/ para slash commands', correct: true, explanation: 'Correcto. settings.json define permisos y modelo. agents/ contiene archivos .md que definen agentes con personalidad e instrucciones. skills/ tiene SKILL.md con frontmatter YAML para contexto dinamico. commands/ tiene archivos .md para slash commands custom.' },
        { text: '.claude/claude.config.js exportando un objeto de configuracion como en ESLint', correct: false, explanation: 'Claude Code no usa archivos JavaScript para configuracion. Usa JSON para settings y Markdown para agentes, skills y commands.' },
        { text: '.claude/agents.json con un array de agentes, cada uno con tools y model definidos', correct: false, explanation: 'Los agentes se definen como archivos Markdown individuales en .claude/agents/, no como un JSON centralizado. Cada archivo .md es un agente.' }
      ],
      source: 'Claude Code - Settings',
      sourceUrl: 'https://code.claude.com/docs/en/settings'
    },
    {
      question: 'Estas trabajando en una feature con Claude Code en un worktree. Simultaneamente quieres que otra sesion investigue un approach alternativo sin escribir codigo. Cual es el patron correcto?',
      options: [
        { text: 'Abrir otra terminal y correr claude en el mismo directorio con --read-only', correct: false, explanation: 'No existe un flag --read-only. Ademas, dos sesiones en el mismo directorio pueden generar conflictos de archivos.' },
        { text: 'Crear un segundo worktree, iniciar una sesion de Claude Code ahi, y usar Shift+Tab (Plan Mode) para que solo lea y analice sin modificar archivos', correct: true, explanation: 'Correcto. Un worktree separado aisla el filesystem. Plan Mode (Shift+Tab) le dice a Claude Code que solo lea, analice y planifique sin ejecutar cambios. Es el patron research+implementation: una sesion investiga, otra implementa.' },
        { text: 'Usar claude --agent researcher que automaticamente opera en modo read-only', correct: false, explanation: 'No existe un flag --agent. Los agentes custom se configuran en .claude/agents/ y se invocan desde dentro de la sesion, no via CLI.' },
        { text: 'Pedir en el primer prompt "no modifiques ningun archivo, solo investiga" y confiar en que lo cumpla', correct: false, explanation: 'Depender de una instruccion en el prompt es fragil. Plan Mode es un mecanismo formal que restringe las herramientas disponibles. Es mas confiable que una instruccion de texto.' }
      ],
      source: 'Boris Cherny - 22 Tips for Claude Code',
      sourceUrl: 'https://www.builder.io/blog/claude-code-tips'
    },
    {
      question: 'Quieres instalar un plugin de terceros para Claude Code que encontraste en awesome-claude-code. Cual es la consideracion de seguridad MAS importante?',
      options: [
        { text: 'Verificar que el plugin tenga mas de 100 estrellas en GitHub', correct: false, explanation: 'Las estrellas no garantizan seguridad. Un repo popular puede tener vulnerabilidades, y un repo nuevo puede ser seguro. Las estrellas miden popularidad, no seguridad.' },
        { text: 'Revisar que herramientas y permisos requiere el plugin: MCP servers tienen acceso a filesystem, red, y APIs. Un MCP server malicioso podria leer archivos sensibles o enviar datos a un servidor externo', correct: true, explanation: 'Correcto. Los MCP servers corren con los permisos de tu usuario. Un MCP server con acceso a filesystem puede leer .env, SSH keys, y cualquier archivo. Uno con acceso a red puede exfiltrar datos. Siempre revisa el codigo fuente, los permisos que pide, y usa sandboxing cuando sea posible.' },
        { text: 'Asegurarse de que el plugin es compatible con la version actual de Claude Code', correct: false, explanation: 'La compatibilidad es importante funcionalmente, pero no es una consideracion de SEGURIDAD. Un plugin compatible pero malicioso sigue siendo peligroso.' },
        { text: 'Solo instalar plugins que esten en el marketplace oficial de Anthropic', correct: false, explanation: 'No existe un marketplace oficial de Anthropic para plugins de Claude Code (a febrero 2026). Los MCP servers son open source y cualquiera puede crear uno. La responsabilidad de evaluar seguridad es tuya.' }
      ],
      source: 'Claude Code - MCP',
      sourceUrl: 'https://code.claude.com/docs/en/mcp'
    }
  ];
</script>

<svelte:head>
  <title>Modulo 11: {mod.title} | Agent Mastery</title>
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

  <!-- ================================================================== -->
  <!-- SECTION 1: Terminal Setup (30% of module) -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Terminal Multiplexer: Lo Esencial</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando trabajas con multiples sesiones de Claude Code en paralelo, necesitas <strong class="text-agent-highlight">ver todo simultaneamente</strong>: un agente implementando una feature, otro corriendo tests, otro monitoreando git status. Un terminal multiplexer divide tu terminal en paneles independientes y, lo mas importante, las sesiones <strong class="text-agent-text">persisten</strong> aunque cierres la terminal o se caiga la conexion SSH.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">&#128161; Concepto clave</p>
      <p class="text-sm text-agent-muted">No necesitas dominar el multiplexer. Solo necesitas saber: crear panes, navegar entre ellos, y hacer detach/attach. El 90% del valor viene de esas 3 acciones. El objetivo es monitorear agentes, no convertirte en experto en tmux.</p>
    </div>

    <!-- tmux essentials -->
    <h3 class="text-xl font-bold text-agent-text mb-3">tmux: El Clasico en 5 Minutos</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      tmux organiza tu terminal en tres niveles: <strong class="text-agent-text">sessions</strong> (contenedores independientes), <strong class="text-agent-text">windows</strong> (pestanas dentro de una session), y <strong class="text-agent-text">panes</strong> (divisiones de una window). Para trabajo con agentes, los panes son lo que mas usaras. Todos los comandos empiezan con el prefix <strong class="text-agent-highlight">Ctrl+B</strong>.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Comando</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Accion</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Cuando usarlo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B %</td>
            <td class="py-2 px-3">Split vertical</td>
            <td class="py-2 px-3">Agente izquierda, tests derecha</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B "</td>
            <td class="py-2 px-3">Split horizontal</td>
            <td class="py-2 px-3">Git status debajo del agente</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B c</td>
            <td class="py-2 px-3">Nueva window</td>
            <td class="py-2 px-3">Segundo worktree en otra pestana</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B flecha</td>
            <td class="py-2 px-3">Navegar panes</td>
            <td class="py-2 px-3">Cambiar entre agentes</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-mono">Ctrl+B d</td>
            <td class="py-2 px-3">Detach</td>
            <td class="py-2 px-3">Desconectarte sin matar sesiones</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-highlight font-mono">tmux attach -t 0</td>
            <td class="py-2 px-3">Reconectar</td>
            <td class="py-2 px-3">Volver a tu workspace despues de un break</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      El layout recomendado para trabajo con agentes:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Crear una sesion y configurar el layout
tmux new-session -s agent-work

# Split: panel principal (60%) + panel derecho (40%)
Ctrl+B %

# En el panel derecho, split horizontal para tests y git
Ctrl+B "

# Resultado:
# +-------------------------------+-------------------+
# |                               |    tests/logs     |
# |   Claude Code (agente)        +-------------------+
# |   (panel principal 60%)       |   git status      |
# |                               |   (panel 40%)     |
# +-------------------------------+-------------------+</pre>`}
    </div>

    <!-- zellij -->
    <h3 class="text-xl font-bold text-agent-text mb-3">zellij: La Alternativa Moderna</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      zellij es un multiplexer escrito en Rust que destaca por tres cosas: <strong class="text-agent-text">floating panes</strong> (ventanas emergentes sobre el layout), <strong class="text-agent-text">layouts declarativos</strong> en formato KDL, y una UX que muestra los keybindings en pantalla. Instalacion: <span class="text-agent-highlight font-mono">cargo install zellij</span> o <span class="text-agent-highlight font-mono">brew install zellij</span>.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap">// ~/.config/zellij/layouts/agent-workspace.kdl
layout {
    pane size=1 borderless=true {
        plugin location="tab-bar"
    }
    pane split_direction="vertical" {
        pane size="60%" name="Claude Code" focus=true
        pane size="40%" {
            pane size="50%" name="Tests"
            pane size="50%" name="Git/Logs"
        }
    }
    pane size=2 borderless=true {
        plugin location="status-bar"
    }
}

// Levantar: zellij --layout agent-workspace</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La ventaja de zellij para multi-agente: sus floating panes te permiten abrir una terminal temporal encima de tu layout (con <strong class="text-agent-highlight">Ctrl+P w</strong>) para ejecutar un comando rapido sin reorganizar nada. Cuando terminas, cierras el floating pane y tu layout sigue intacto.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">&#9888;&#65039; tmux vs zellij: la recomendacion</p>
      <p class="text-sm text-agent-muted">Ambos funcionan. tmux es universal (esta en cualquier servidor Linux), zellij es mas ergonomico. Si ya sabes tmux, no cambies. Si empiezas de cero, zellij tiene menos curva de aprendizaje. <strong class="text-agent-text">Lo que importa es tener un multiplexer, no cual.</strong></p>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- SECTION 2: Claude Code Workspace (70% of module) -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Workspace Completo de Claude Code</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un workspace profesional de Claude Code no es solo "instalar claude y correr". Es un ecosistema configurado con <strong class="text-agent-highlight">reglas, agentes, skills, MCP servers, y permisos</strong> que hacen que el agente trabaje como un miembro mas del equipo. El directorio <strong class="text-agent-text">.claude/</strong> en la raiz del proyecto es donde vive toda esta configuracion.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-info font-bold mb-1">&#128218; Analogia</p>
      <p class="text-sm text-agent-muted">Piensa en el workspace de Claude Code como el onboarding de un nuevo desarrollador. Cuando alguien se une a tu equipo, le das: las reglas del equipo (CLAUDE.md), acceso a herramientas (MCP servers), roles especificos (agents/), conocimiento del proyecto (skills/), y permisos apropiados (settings.json). Es exactamente lo mismo, pero para un agente.</p>
    </div>

    <!-- Project Structure -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Estructura del Directorio .claude/</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cada archivo y directorio dentro de <strong class="text-agent-text">.claude/</strong> cumple un rol especifico. Esta es la estructura completa de un proyecto profesional:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">proyecto/
├── CLAUDE.md                  # Reglas globales del agente (siempre se carga)
├── .mcp.json                  # MCP servers del proyecto
├── .claude/
│   ├── settings.json          # Permisos, modelo, configuracion
│   ├── agents/
│   │   ├── reviewer.md        # Agente: review de codigo
│   │   ├── tester.md          # Agente: generador de tests
│   │   └── documenter.md      # Agente: documentacion
│   ├── skills/
│   │   └── django-drf/
│   │       └── SKILL.md       # Skill: patrones Django REST
│   ├── commands/
│   │   ├── review-pr.md       # /review-pr → analiza PR actual
│   │   └── deploy-check.md    # /deploy-check → pre-deploy checklist
│   └── rules/
│       ├── security.md        # Reglas de seguridad
│       └── testing.md         # Reglas de testing
└── src/                       # Tu codigo...</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Cada componente se carga en momentos diferentes. <strong class="text-agent-text">CLAUDE.md</strong> se lee al iniciar cada sesion. <strong class="text-agent-text">settings.json</strong> configura el comportamiento base. Los <strong class="text-agent-text">agents/</strong> y <strong class="text-agent-text">skills/</strong> se cargan cuando el agente los necesita (just-in-time). Las <strong class="text-agent-text">rules/</strong> se cargan segun contexto.
    </p>

    <!-- settings.json -->
    <h3 class="text-xl font-bold text-agent-text mb-3">settings.json: Permisos y Modelo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Este archivo define que puede y que no puede hacer Claude Code en tu proyecto. Es tu primera linea de defensa: permisos granulares por herramienta, modelo a usar, y comportamiento general.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm test*)",
      "Bash(npm run lint*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)"
    ],
    "deny": [
      "Bash(rm -rf*)",
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(curl*)",
      "Bash(wget*)"
    ]
  },
  "model": "claude-sonnet-4-20250514"
}</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La logica es simple: <strong class="text-agent-text">allow</strong> lista lo que puede hacer sin preguntar, <strong class="text-agent-text">deny</strong> lo que nunca puede hacer, y todo lo demas le pregunta al usuario (modo "ask"). Esto evita que el agente ejecute comandos destructivos o haga network requests no autorizados.
    </p>

    <!-- MCP Configuration -->
    <h3 class="text-xl font-bold text-agent-text mb-3">MCP: Conectar Herramientas Externas</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los MCP servers son el puente entre Claude Code y tus sistemas externos. Hay dos niveles de configuracion: <strong class="text-agent-text">.mcp.json</strong> en la raiz del proyecto (herramientas del equipo, se commitea) y <strong class="text-agent-text">~/.claude/settings.json</strong> a nivel usuario (herramientas personales, no se commitea).
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">// .mcp.json — Nivel proyecto (se commitea en git)
{
  "mcpServers": {
    "jira": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://tu-empresa.atlassian.net",
        "JIRA_USERNAME": "JIRA_USERNAME",
        "JIRA_API_TOKEN": "JIRA_API_TOKEN"
      }
    },
    "github": {
      "command": "gh",
      "args": ["copilot", "mcp-server"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp"]
    }
  }
}</pre>`}
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap">// ~/.claude/settings.json — Nivel usuario (NO se commitea)
{
  "mcpServers": {
    "memory": {
      "command": "hoofy",
      "args": ["--db", "~/.hoofy/memory.db"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-filesystem", "/home/user/docs"]
    }
  }
}</pre>`}
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">&#128161; Regla de oro</p>
      <p class="text-sm text-agent-muted">MCP servers del proyecto van en <strong class="text-agent-text">.mcp.json</strong> (todos los devs los necesitan). MCP servers personales van en <strong class="text-agent-text">~/.claude/settings.json</strong> (solo tu los usas). Nunca pongas tokens/API keys en .mcp.json; usa variables de entorno referenciadas.</p>
    </div>

    <!-- Custom Agents -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Agentes Custom: Especialistas del Equipo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes custom son archivos Markdown en <strong class="text-agent-text">.claude/agents/</strong>. Cada archivo define un agente con personalidad, instrucciones, y restricciones. Se invocan desde dentro de una sesion de Claude Code con el Agent tool.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># .claude/agents/reviewer.md

Eres un reviewer de codigo estricto pero constructivo.

## Reglas
- Analiza SIEMPRE: seguridad, rendimiento, legibilidad, tests
- Formato: lista de hallazgos con severidad (critical/warning/info)
- Nunca modifiques codigo. Solo lee y comenta.
- Si encuentras un bug potencial, muestra el escenario exacto que lo dispara
- Verifica que cada cambio tenga tests correspondientes

## Output esperado
1. Resumen ejecutivo (1-2 lineas)
2. Hallazgos criticos (si hay)
3. Warnings
4. Sugerencias de mejora
5. Veredicto: APPROVE, REQUEST_CHANGES, o COMMENT</pre>`}
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap"># .claude/agents/tester.md

Eres un generador de tests experto.

## Reglas
- Lee el codigo fuente y genera tests exhaustivos
- Cubre: happy path, edge cases, error handling, boundary values
- Usa el framework de testing del proyecto (detectalo de package.json)
- Cada test debe ser independiente (no depender de otros tests)
- Incluye tests de integracion cuando la funcion interactua con APIs o DB

## Patron
1. Lee la funcion
2. Identifica inputs, outputs, y side effects
3. Genera tests en orden: happy path → edge cases → errors
4. Verifica que los tests pasen antes de terminar</pre>`}
    </div>

    <!-- Skills -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Skills: Conocimiento Just-in-Time</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las skills son archivos <strong class="text-agent-text">SKILL.md</strong> dentro de <strong class="text-agent-text">.claude/skills/</strong>. La diferencia con los agentes es que las skills se cargan <strong class="text-agent-highlight">automaticamente segun el contexto</strong> del archivo que estas editando. El frontmatter YAML define cuando se activa:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># .claude/skills/svelte5/SKILL.md
---
globs:
  - "**/*.svelte"
  - "src/lib/**/*.ts"
description: "Svelte 5 runes patterns for this project"
---

# Svelte 5 Patterns

## Runes (NOT Svelte 4)
- State: \`let x = $state(initialValue)\`
- Derived: \`let y = $derived(expression)\`
- Props: \`let { prop1, prop2 }: Props = $props()\`
- Effects: \`$effect(() => { ... })\`

## CRITICAL: Template code blocks
- ALL code with { } or &lt; must use \`{@html \\\`&lt;pre>...&lt;/pre>\\\`}\`
- Unicode escapes \\u{XXXX} CANNOT be used in templates
- Use HTML entities &amp;#xXXXX; instead

## Component pattern
Always: Header > Theory > Interactive > Quiz > ModuleNav</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando Claude Code abre un archivo <strong class="text-agent-text">.svelte</strong>, automaticamente carga esta skill porque el glob coincide. No necesitas decirle "usa las reglas de Svelte"; se inyecta automaticamente en su contexto. Esto es <strong class="text-agent-highlight">context engineering en accion</strong>: el conocimiento correcto llega al agente en el momento correcto.
    </p>

    <!-- Complete workspace example -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Ejemplo: Workspace desde Cero</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Veamos como configurar un workspace completo para un proyecto real. Estos son los comandos y archivos para crear todo el andamiaje:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># 1. Crear estructura del workspace
mkdir -p .claude/agents .claude/skills .claude/commands .claude/rules

# 2. Crear CLAUDE.md (reglas globales)
cat &lt;&lt; 'EOF' > CLAUDE.md
# Mi Proyecto — CLAUDE.md

## Stack
- Python 3.12 + Django 5.1 + DRF
- PostgreSQL 16 + Redis 7
- pytest + factory_boy para tests

## Reglas
- Nunca usar print(). Siempre logging.
- Tests obligatorios para todo endpoint nuevo.
- Conventional commits: feat:, fix:, refactor:
- Nunca commitear .env ni secrets.
EOF

# 3. Crear settings.json con permisos
cat &lt;&lt; 'EOF' > .claude/settings.json
{
  "permissions": {
    "allow": ["Read", "Glob", "Grep", "Bash(pytest*)"],
    "deny": ["Bash(rm -rf*)", "Bash(git push --force*)"]
  }
}
EOF

# 4. Crear .mcp.json para herramientas del proyecto
cat &lt;&lt; 'EOF' > .mcp.json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp"]
    }
  }
}
EOF

# 5. Verificar que funciona
claude  # Inicia sesion — debe cargar CLAUDE.md</pre>`}
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">&#128680; Error comun</p>
      <p class="text-sm text-agent-muted">No commitees <strong class="text-agent-text">~/.claude/settings.json</strong> (configuracion personal) ni pongas API keys directamente en <strong class="text-agent-text">.mcp.json</strong>. Usa variables de entorno: <span class="text-agent-highlight font-mono">"JIRA_API_TOKEN": "JIRA_API_TOKEN"</span> hace que Claude Code lea la variable de entorno con ese nombre, no el string literal.</p>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- SECTION 3: Git Worktrees -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Git Worktrees: Trabajo Paralelo sin Conflictos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los <strong class="text-agent-highlight">git worktrees</strong> son una funcionalidad nativa de git que crea <strong class="text-agent-text">copias de trabajo independientes</strong> del mismo repositorio, cada una en una rama distinta. A diferencia de clonar el repo multiples veces, los worktrees comparten el mismo directorio <strong class="text-agent-text">.git/</strong>. Esto significa: un solo historial, menos espacio en disco, y cambios que se reflejan inmediatamente al hacer merge.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Para trabajo con Claude Code, los worktrees son transformadores: cada worktree tiene su propio directorio de trabajo, asi que puedes correr <strong class="text-agent-text">una sesion de Claude Code por worktree</strong> sin que se pisen los archivos entre si. Es la base del trabajo multi-sesion.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Crear worktrees para trabajo paralelo
# Desde el directorio principal del repo:

# Worktree 1: feature de autenticacion
git worktree add ../mi-proyecto-auth feature/auth

# Worktree 2: fix de performance
git worktree add ../mi-proyecto-perf fix/slow-query

# Worktree 3: refactor de API
git worktree add ../mi-proyecto-api refactor/api-v2

# Estructura resultante en disco:
# ~/projects/mi-proyecto/          ← main (rama principal)
# ~/projects/mi-proyecto-auth/     ← feature/auth
# ~/projects/mi-proyecto-perf/     ← fix/slow-query
# ~/projects/mi-proyecto-api/      ← refactor/api-v2
#
# Todos comparten el mismo .git/ → un solo historial</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Ahora, abres 3 panes en tu multiplexer, cada uno en un worktree diferente, y corres <strong class="text-agent-text">claude</strong> en cada uno. Tres agentes trabajando en tres features simultaneamente, con <strong class="text-agent-highlight">cero riesgo de conflictos de archivos</strong>.
    </p>

    <!-- Claude Code worktree integration -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Worktrees con Claude Code</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code tiene integracion directa con worktrees. Desde dentro de una sesion, puedes usar la herramienta <strong class="text-agent-text">EnterWorktree</strong> para crear un worktree y cambiar tu sesion a el automaticamente:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Desde Claude Code, al decir "trabaja en un worktree":
# Claude usa EnterWorktree internamente

# O desde la CLI directamente:
claude -w feature-name  # Crea worktree y abre sesion ahi

# Listar worktrees existentes:
git worktree list
# /home/user/mi-proyecto           abcdef1 [main]
# /home/user/mi-proyecto-auth      1234567 [feature/auth]
# /home/user/mi-proyecto-perf      89abcde [fix/slow-query]

# Cuando terminas, limpiar worktrees:
git worktree remove ../mi-proyecto-auth
git worktree remove ../mi-proyecto-perf

# O limpiar todos los worktrees que ya no tienen rama:
git worktree prune</pre>`}
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">&#128161; El patron Boris Cherny</p>
      <p class="text-sm text-agent-muted">Boris Cherny (autor de "22 Tips for Claude Code") recomienda mantener <strong class="text-agent-text">3-5 sesiones paralelas</strong> como rango optimo. Menos de 3 y no aprovechas el paralelismo. Mas de 5 y el overhead de monitorear y coordinar supera los beneficios. El sweet spot esta en 3 worktrees activos: una feature principal, una secundaria, y una para investigacion/research.</p>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- SECTION 4: incident.io Case Study -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Caso: incident.io y el Poder de los Worktrees</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-highlight">incident.io</strong> es una plataforma de gestion de incidentes que adoptó Claude Code con git worktrees como parte central de su flujo de desarrollo. Su experiencia es uno de los casos mas documentados del impacto real de esta combinacion.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl font-bold text-agent-accent block">4-7</span>
        <p class="text-xs text-agent-muted mt-1">Sesiones concurrentes por desarrollador</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl font-bold text-agent-accent block">Day 2</span>
        <p class="text-xs text-agent-muted mt-1">Nuevos empleados shipping code</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl font-bold text-agent-success block">0</span>
        <p class="text-xs text-agent-muted mt-1">Merge conflicts por worktrees</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl font-bold text-agent-warning block">Fast</span>
        <p class="text-xs text-agent-muted mt-1">CI como prerequisito critico</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Insights Clave</h3>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-2">"Fast tooling is a prerequisite"</h4>
        <p class="text-sm text-agent-muted">El insight mas importante de incident.io: <strong class="text-agent-text">si tu CI tarda 20 minutos, no importa cuantos agentes tengas</strong>. Todos estaran esperando. Invirtieron en hacer su pipeline de CI extremadamente rapido antes de escalar el numero de agentes. Un agente bloqueado esperando CI es un agente quemando tokens sin producir valor.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">New hires shipping code on day 2</h4>
        <p class="text-sm text-agent-muted">Uno de los beneficios inesperados: los <strong class="text-agent-text">nuevos empleados</strong> podian contribuir codigo productivo desde su segundo dia usando Claude Code. El agente ya conocia el codebase (via CLAUDE.md y skills), las convenciones, y los patrones. El onboarding paso de semanas a horas. Claude Code funciona como un "mentor virtual" del proyecto.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <h4 class="text-agent-warning font-bold text-sm mb-2">Git worktrees eliminaron los merge conflicts</h4>
        <p class="text-sm text-agent-muted">Antes de worktrees, multiples desarrolladores (o agentes) editando el mismo directorio causaba conflictos constantes. Con worktrees, <strong class="text-agent-text">cada sesion tiene su propio filesystem aislado</strong>. Los merges ocurren en git, donde son manejables, no en el filesystem, donde son caos. El patron: "un worktree por feature, un merge al terminar".</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-info">
        <h4 class="text-agent-info font-bold text-sm mb-2">4-7 sesiones concurrentes como workflow normal</h4>
        <p class="text-sm text-agent-muted">Los desarrolladores de incident.io corren rutinariamente entre 4 y 7 sesiones de Claude Code en paralelo. Cada sesion en su worktree, cada una con una tarea especifica. El multiplexer (tmux) les permite monitorear todas las sesiones y saltar entre ellas. Es como tener un equipo de 4-7 desarrolladores junior trabajando bajo tu supervision.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">&#128680; La leccion que nadie menciona</p>
      <p class="text-sm text-agent-muted">incident.io no llego a 7 sesiones el dia 1. Empezaron con 1-2, aprendieron los patrones, optimizaron su CI, mejoraron su CLAUDE.md, y gradualmente escalaron. <strong class="text-agent-text">Escalar agentes sin las bases (fast CI, buen CLAUDE.md, worktrees) amplifica problemas, no productividad.</strong></p>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- SECTION 5: Multi-Session Patterns -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Patrones Multi-Sesion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Correr multiples sesiones de Claude Code no es solo "abrir mas terminales". Hay <strong class="text-agent-highlight">patrones especificos</strong> que maximizan el valor de cada sesion. Aqui los cinco patrones mas usados por equipos profesionales:
    </p>

    <div class="space-y-4 mb-6">
      <!-- Pattern 1 -->
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128640;</span>
          <div>
            <h4 class="text-agent-text font-bold">Patron 1: Features en Paralelo</h4>
            <p class="text-sm text-agent-muted mb-2">Cada worktree = una feature branch = una sesion de Claude Code. El patron mas comun y el que usa incident.io.</p>
            <div class="bg-agent-darker rounded-lg p-3">
              {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Worktree 1: feature/user-auth     → Claude Code implementando login
# Worktree 2: feature/api-v2        → Claude Code migrando endpoints
# Worktree 3: fix/search-perf       → Claude Code optimizando queries
# Main:       sin cambios, limpio para PR reviews</pre>`}
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern 2 -->
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128269;</span>
          <div>
            <h4 class="text-agent-text font-bold">Patron 2: Research + Implementation</h4>
            <p class="text-sm text-agent-muted mb-2">Una sesion investiga con <strong class="text-agent-text">Plan Mode</strong> (Shift+Tab): lee codigo, analiza opciones, escribe un plan. Otra sesion implementa siguiendo ese plan. El researcher no modifica archivos; el implementer no pierde tiempo investigando.</p>
            <div class="bg-agent-darker rounded-lg p-3">
              {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap"># Sesion 1 (Research): "analiza el schema de auth y propon 3 opciones"
#   → Plan Mode activado, solo lee archivos, genera documento
# Sesion 2 (Implement): "implementa la opcion 2 del plan de auth"
#   → Worktree separado, escribe codigo basado en el research</pre>`}
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern 3 -->
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128680;</span>
          <div>
            <h4 class="text-agent-text font-bold">Patron 3: CI Watcher + Fixer</h4>
            <p class="text-sm text-agent-muted mb-2">Una sesion monitorea el output de tests/CI. Cuando un test falla, otra sesion recibe el error y lo arregla. Ciclo continuo de green/red/fix.</p>
            <div class="bg-agent-darker rounded-lg p-3">
              {@html `<pre class="text-xs text-agent-warning font-mono whitespace-pre-wrap"># Pane 1: npm test -- --watch  (monitorea tests)
# Pane 2: Claude Code  (implementa features)
# Workflow: test falla → copias error al agente → arregla → test pasa</pre>`}
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern 4 -->
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128065;&#65039;</span>
          <div>
            <h4 class="text-agent-text font-bold">Patron 4: Review Session</h4>
            <p class="text-sm text-agent-muted mb-2">Una sesion con el agente <strong class="text-agent-text">reviewer</strong> (custom agent) revisa PRs, genera comentarios, y sugiere mejoras. Corre en paralelo a tu trabajo normal.</p>
            <div class="bg-agent-darker rounded-lg p-3">
              {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Sesion Review: "usa el agente reviewer para analizar PR #42"
#   → Lee el diff, analiza seguridad/calidad/tests
#   → Genera reporte estructurado con hallazgos
# Tu sesion principal: sigues trabajando en tu feature</pre>`}
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern 5 -->
      <div class="card bg-agent-dark border-agent-border">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#128202;</span>
          <div>
            <h4 class="text-agent-text font-bold">Patron 5: Documentacion Continua</h4>
            <p class="text-sm text-agent-muted mb-2">Una sesion dedicada a mantener docs actualizados. Cada vez que otra sesion hace un cambio significativo, la sesion de docs actualiza README, API docs, o changelogs.</p>
            <div class="bg-agent-darker rounded-lg p-3">
              {@html `<pre class="text-xs text-agent-success font-mono whitespace-pre-wrap"># Sesion Docs: "monitorea los cambios recientes y actualiza la documentacion"
#   → Lee git log, identifica cambios publicos
#   → Actualiza API docs, README, CHANGELOG</pre>`}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- When to use what -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Multi-sesion vs Agent Teams vs Sub-agents</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      No siempre necesitas multiples sesiones. La decision depende de si las tareas son <strong class="text-agent-highlight">independientes o coordinadas</strong>:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Approach</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Cuando usarlo</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Ejemplo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-bold">Multi-sesion + worktrees</td>
            <td class="py-2 px-3">Tareas independientes en archivos distintos</td>
            <td class="py-2 px-3">3 features en paralelo, cada una en su rama</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-highlight font-bold">Agent Teams</td>
            <td class="py-2 px-3">Tareas que necesitan coordinacion via shared task list</td>
            <td class="py-2 px-3">Migrar un modulo: schema, API, tests, docs coordinados</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-highlight font-bold">Sub-agents</td>
            <td class="py-2 px-3">Subtareas delegadas desde una sesion principal</td>
            <td class="py-2 px-3">Pedir al reviewer que analice un archivo especifico</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- SECTION 6: Plugins and Ecosystem -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Plugins y Ecosistema</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code no existe en el vacio. Un ecosistema creciente de herramientas, MCP servers, y recursos de terceros extiende sus capacidades. Conocer las opciones y saber evaluar su seguridad es parte del skillset del Agent Architect.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-2">awesome-claude-code</h4>
        <p class="text-sm text-agent-muted">Lista curada en GitHub con MCP servers, hooks, skills, commands, y agentes creados por la comunidad. Es el punto de partida para descubrir extensiones. Incluye categorias como: developer tools, database, documentation, testing, CI/CD, y mas. <strong class="text-agent-text">Tip</strong>: filtra por estrellas y fecha de ultima actualizacion para encontrar las herramientas mantenidas.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <h4 class="text-agent-success font-bold text-sm mb-2">compound-engineering</h4>
        <p class="text-sm text-agent-muted">Herramientas para workflows de ingenieria complejos con Claude Code. Incluye patrones para CI/CD agentico, review automatizado, y pipelines de calidad. Util para equipos que quieren ir mas alla del uso basico y crear flujos de trabajo sofisticados.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <h4 class="text-agent-warning font-bold text-sm mb-2">ContextKit</h4>
        <p class="text-sm text-agent-muted">MCP server especializado en gestion de contexto mejorado. Permite cargar archivos, snippets, y conocimiento de forma estructurada. Complementa las skills nativas de Claude Code con capacidades adicionales de inyeccion de contexto.</p>
      </div>
    </div>

    <!-- Security -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Seguridad al Extender el Workspace</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de instalar cualquier extension, aplica estas tres verificaciones:
    </p>

    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3">
        <span class="text-agent-danger font-bold shrink-0">1.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Revisa el codigo fuente</strong> — Un MCP server tiene acceso a todo lo que su proceso puede ver: archivos, variables de entorno, red. Lee el codigo antes de instalarlo. Si esta ofuscado o no es open source, no lo instales.</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-danger font-bold shrink-0">2.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Permisos minimos</strong> — Si un MCP server solo necesita leer archivos, no le des acceso a red. Si solo necesita una base de datos, no le des acceso a todo el filesystem. Principio de least privilege.</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-agent-danger font-bold shrink-0">3.</span>
        <p class="text-sm text-agent-muted"><strong class="text-agent-text">Sandboxing</strong> — Usa Docker o contenedores para aislar MCP servers de terceros. Claude Code soporta sandbox mode que limita lo que los procesos hijos pueden hacer. Activalo para servers que no son de tu organizacion.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-1">&#128680; El riesgo real</p>
      <p class="text-sm text-agent-muted">Un MCP server malicioso puede: leer tus SSH keys (<strong class="text-agent-text">~/.ssh/</strong>), leer tu archivo .env con API keys, enviar archivos de tu proyecto a un servidor externo, o ejecutar codigo arbitrario en tu maquina. No es teoria: estos vectores de ataque son reales. <strong class="text-agent-text">Trata cada MCP server como codigo que corre con TUS permisos.</strong></p>
    </div>
  </section>

  <!-- ================================================================== -->
  <!-- INTERACTIVE FLOW -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Diagrama Interactivo: Arquitectura del Workspace</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Explora como se conectan los componentes del workspace profesional. Haz clic en cada nodo para entender su rol, y luego activa el modo challenge para poner a prueba tu comprension.
    </p>

    {#if !showFlow}
      <button class="btn-primary w-full" onclick={() => showFlow = true}>
        &#9654; Iniciar Diagrama Interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Workspace del Agent Architect"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ================================================================== -->
  <!-- QUIZ -->
  <!-- ================================================================== -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Quiz: Workspace Profesional</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      5 preguntas sobre worktrees, configuracion del workspace, patrones multi-sesion, y el caso incident.io. Cada pregunta tiene una sola respuesta correcta con explicacion detallada.
    </p>

    {#if !showQuiz}
      <button class="btn-primary w-full" onclick={() => showQuiz = true}>
        &#9654; Iniciar Quiz (5 preguntas)
      </button>
    {:else}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- ================================================================== -->
  <!-- COMPLETION -->
  <!-- ================================================================== -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 mb-8 fade-in text-center">
      <span class="text-4xl block mb-2">&#127942;</span>
      <h2 class="text-xl font-bold text-agent-text mb-2">Modulo Completado</h2>
      <p class="text-agent-muted">
        Ya tienes las bases para configurar un workspace profesional de Claude Code. Desde el multiplexer hasta los worktrees, los agentes custom y los MCP servers, cada pieza del entorno potencia tu productividad como Agent Architect.
      </p>
    </div>
  {/if}

  <!-- ================================================================== -->
  <!-- SOURCES + NAV -->
  <!-- ================================================================== -->
  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<!-- ================================================================== -->
<!-- FLOATING COMPONENTS (outside main div) -->
<!-- ================================================================== -->
<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
