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

  // InteractiveFlow: The Agent Ecosystem Map
  const flowNodes = [
    // Center hub
    { id: 'center', label: 'Agentes de Codigo 2026', description: 'El ecosistema de agentes de codigo en 2026 se divide en tres grandes categorias: agentes CLI (terminal), agentes IDE (editor integrado), y agentes autonomos (trabajan solos). Cada categoria tiene trade-offs distintos.', icon: '\u{1F916}', x: 50, y: 50 },
    // CLI agents
    { id: 'cli-hub', label: 'CLI Agents', description: 'Agentes que operan desde la terminal. Tienen acceso completo al sistema de archivos, pueden ejecutar comandos del SO, y trabajan con todo el codebase. Ideales para tareas complejas que requieren contexto amplio del proyecto.', icon: '\u{1F4BB}', x: 18, y: 20 },
    { id: 'claude-code', label: 'Claude Code', description: 'Agente CLI de Anthropic. Basado en Claude Opus 4.6. Soporta Agent Teams para trabajo paralelo. MCP integrado. Modo headless para CI/CD. El mas potente en razonamiento complejo. Requiere suscripcion Max/Team/Enterprise.', icon: '\u{1F7E3}', x: 5, y: 40 },
    { id: 'opencode', label: 'OpenCode', description: 'Agente CLI open source escrito en Go. 100K+ estrellas en GitHub. Soporta 75+ modelos (OpenAI, Anthropic, Google, local). Extremadamente rapido por estar en Go. Gratuito. El rival open source de Claude Code.', icon: '\u{1F7E2}', x: 5, y: 65 },
    { id: 'aider', label: 'Aider', description: 'Agente CLI open source en Python. Pionero del concepto "AI pair programming en terminal". Soporta multiples modelos. Integracion nativa con Git: cada cambio es un commit. Buena documentacion y comunidad activa.', icon: '\u{1F7E1}', x: 18, y: 80 },
    // IDE agents
    { id: 'ide-hub', label: 'IDE Agents', description: 'Agentes integrados en editores de codigo. Operan dentro del IDE con acceso al archivo actual y archivos abiertos. Ofrecen experiencia visual con diffs inline, chat lateral, y autocompletado inteligente.', icon: '\u{1F4DD}', x: 82, y: 20 },
    { id: 'cursor', label: 'Cursor', description: 'IDE completo basado en VS Code, construido desde cero para IA. Agent mode, Composer para cambios multi-archivo, background agents. Propietario, suscripcion mensual. El IDE AI-native mas popular.', icon: '\u{1F535}', x: 95, y: 40 },
    { id: 'roo', label: 'Roo Code', description: 'Extension de VS Code, Apache 2.0 (open source). Destacado por sus "custom modes" para tareas especificas (code, architect, debug). Soporta multiples providers. Fork de Cline con mejoras significativas. Comunidad muy activa.', icon: '\u{1F7E0}', x: 95, y: 60 },
    { id: 'cline', label: 'Cline', description: 'El OG de los agentes en VS Code. 5M+ instalaciones. Open source. Primer agente en VS Code que podia ejecutar comandos de terminal. Roo Code y Kilo Code son forks de Cline.', icon: '\u26AA', x: 82, y: 80 },
    // Autonomous agents
    { id: 'auto-hub', label: 'Agentes Autonomos', description: 'Agentes que reciben una tarea de alto nivel y la ejecutan de principio a fin sin intervencion humana. Planifican, ejecutan, debuggean y entregan. El nivel mas alto de autonomia, con los mayores riesgos.', icon: '\u{1F680}', x: 50, y: 15 },
    { id: 'devin', label: 'Devin', description: 'De Cognition Labs. Presentado como "el primer software engineer IA". Opera en un entorno de desarrollo completo (terminal, editor, navegador). Controversial: promesas ambiciosas, resultados mixtos. Caro pero innovador.', icon: '\u{1F7E4}', x: 35, y: 5 },
    { id: 'openhands', label: 'OpenHands', description: 'Antes conocido como "OpenDevin" (renombrado por quejas de trademark de Cognition Labs). Open source. Alternativa comunitaria a Devin. Entorno sandboxed completo. Fuerte apoyo de la comunidad open source.', icon: '\u{1F534}', x: 65, y: 5 },
  ];

  const flowEdges = [
    { from: 'center', to: 'cli-hub', label: 'Terminal' },
    { from: 'center', to: 'ide-hub', label: 'Editor' },
    { from: 'center', to: 'auto-hub', label: 'Autonomo' },
    { from: 'cli-hub', to: 'claude-code' },
    { from: 'cli-hub', to: 'opencode' },
    { from: 'cli-hub', to: 'aider' },
    { from: 'ide-hub', to: 'cursor' },
    { from: 'ide-hub', to: 'roo' },
    { from: 'ide-hub', to: 'cline' },
    { from: 'auto-hub', to: 'devin' },
    { from: 'auto-hub', to: 'openhands' },
  ];

  const flowChallenges = [
    { question: 'Cual de estos agentes es CLI-native, basado en Go, y tiene 100K+ estrellas?', targetNodeId: 'opencode', hint: 'Es open source y soporta 75+ modelos.' },
    { question: 'Cual agente fue renombrado por quejas de trademark de Cognition Labs?', targetNodeId: 'openhands', hint: 'Antes se llamaba "OpenDevin" y es open source.' },
    { question: 'Cual extension de VS Code es conocida por sus "custom modes" para tareas especificas?', targetNodeId: 'roo', hint: 'Es Apache 2.0 (open source) y es un fork de Cline.' },
    { question: 'Cual agente soporta Agent Teams para trabajo paralelo con multiples instancias?', targetNodeId: 'claude-code', hint: 'Es de Anthropic y usa Claude Opus 4.6.' },
  ];

  // Quiz data
  const quizQuestions = [
    {
      question: 'Necesitas un agente para un proyecto con datos sensibles de salud (HIPAA compliant). El codigo NO puede salir de tus servidores bajo ninguna circunstancia. Cual opcion es la MAS segura?',
      options: [
        { text: 'Cursor, porque es un IDE profesional con seguridad empresarial', correct: false, explanation: 'Cursor envia codigo a sus servidores para procesarlo con IA. Aunque tienen politicas de privacidad, el codigo SALE de tus servidores. No apto para HIPAA estricto.' },
        { text: 'OpenCode con un modelo local (Ollama/vLLM), porque todo se ejecuta en tu infraestructura y ningun dato sale', correct: true, explanation: 'Correcto. OpenCode + modelo local = cero datos salen de tu red. Todo el procesamiento ocurre en tu infraestructura. Es la unica opcion que garantiza que el codigo nunca toca servidores externos.' },
        { text: 'Devin, porque es el agente mas avanzado y seguro', correct: false, explanation: 'Devin opera en la nube de Cognition Labs. Tu codigo se ejecuta en sus servidores. Incompatible con requisitos HIPAA estrictos de no-transferencia de datos.' },
        { text: 'Claude Code, porque Anthropic es la empresa mas segura', correct: false, explanation: 'Claude Code envia tu codigo a las APIs de Anthropic para procesarlo. Aunque Anthropic tiene buenas practicas de privacidad, el codigo sale de tus servidores.' },
      ],
      source: 'OpenCode Docs',
      sourceUrl: 'https://opencode.ai/docs/'
    },
    {
      question: 'Tu equipo usa VS Code exclusivamente y quiere un agente con custom modes para que los arquitectos lo usen diferente a los juniors. Cual es la mejor opcion?',
      options: [
        { text: 'Cursor, porque es el IDE mas popular con IA', correct: false, explanation: 'Cursor requiere ABANDONAR VS Code y usar su IDE propio. Si el equipo esta comprometido con VS Code, no es opcion. Ademas no tiene el concepto de "custom modes".' },
        { text: 'Roo Code, que tiene custom modes nativos: puedes crear modos como "architect", "debug", "review" con instrucciones y restricciones diferentes', correct: true, explanation: 'Exacto. Roo Code se destaca precisamente por sus custom modes. Puedes crear un modo "architect" que solo analiza y sugiere sin modificar codigo, y un modo "implement" que ejecuta cambios. Todo dentro de VS Code.' },
        { text: 'Cline, porque fue el primer agente de VS Code', correct: false, explanation: 'Cline fue pionero pero no tiene custom modes nativos como Roo Code. Es mas generalista sin la capacidad de crear roles especializados.' },
        { text: 'Instalar Claude Code como extension de VS Code', correct: false, explanation: 'Claude Code es CLI, no es una extension de VS Code. Puedes usarlo desde el terminal integrado de VS Code pero no tiene integracion IDE nativa con custom modes.' },
      ],
      source: 'Qodo - Roo Code vs Cline',
      sourceUrl: 'https://www.qodo.ai/blog/roo-code-vs-cline/'
    },
    {
      question: 'Estas eligiendo un agente para un startup temprano con 3 desarrolladores. Presupuesto limitado, necesitan productividad maxima. Cual es el trade-off PRINCIPAL entre Claude Code y OpenCode?',
      options: [
        { text: 'Claude Code es mas rapido, OpenCode es mas lento', correct: false, explanation: 'La velocidad de ejecucion depende mas del modelo usado que de la herramienta. OpenCode en Go puede ser mas rapido en operaciones locales.' },
        { text: 'Claude Code tiene mejor razonamiento (Opus 4.6) pero cuesta dinero. OpenCode soporta modelos baratos/gratuitos pero con menos calidad de razonamiento.', correct: true, explanation: 'Exacto. Claude Code amarra al mejor modelo de Anthropic (calidad maxima de razonamiento) pero requiere suscripcion. OpenCode te deja elegir: usar modelos gratuitos con menor calidad o pagar por APIs de modelos premium. El trade-off es calidad de razonamiento vs costo.' },
        { text: 'Claude Code es open source, OpenCode es propietario', correct: false, explanation: 'Es al reves. OpenCode es open source (Apache 2.0 / MIT). Claude Code tiene codigo fuente visible pero licencia propietaria.' },
        { text: 'Claude Code solo funciona en Mac, OpenCode en Linux', correct: false, explanation: 'Ambos funcionan en Mac, Linux y Windows. El sistema operativo no es un factor diferenciador.' },
      ],
    },
    {
      question: 'Un companyero dice: "Cursor es mejor que Roo Code porque Cursor tiene su propio IDE optimizado para IA". Que matiz importante le falta a ese argumento?',
      options: [
        { text: 'Cursor no tiene IA, solo es un editor bonito', correct: false, explanation: 'Cursor absolutamente tiene IA. Es literalmente su propuesta de valor principal.' },
        { text: 'Tener un IDE propio es una DESVENTAJA para equipos que ya tienen configuraciones de VS Code, extensions y workflows establecidos. Roo Code se integra EN tu VS Code existente.', correct: true, explanation: 'Exacto. Cursor requiere migrar a su IDE. Si tu equipo tiene anos de configuracion en VS Code (extensions, keybindings, snippets, settings), migrar a Cursor tiene un costo. Roo Code se instala como extension y tu workflow no cambia. El "IDE propio" puede ser ventaja o desventaja segun el contexto.' },
        { text: 'Roo Code es mas caro que Cursor', correct: false, explanation: 'Roo Code es open source (Apache 2.0) y gratuito. Solo pagas por los tokens del modelo que uses. Cursor tiene suscripcion mensual.' },
        { text: 'No hay diferencia, ambos hacen lo mismo', correct: false, explanation: 'Hay diferencias significativas en modelo de distribucion (IDE propio vs extension), flexibilidad (modelos soportados), y costo (suscripcion vs open source).' },
      ],
    },
    {
      question: 'Los agentes autonomos como Devin prometen "darte una tarea y que la resuelvan solos". Cual es el riesgo PRINCIPAL de este nivel de autonomia?',
      options: [
        { text: 'Son muy lentos porque hacen demasiados pasos', correct: false, explanation: 'La lentitud es un problema secundario. El riesgo principal es mas fundamental que la velocidad.' },
        { text: 'Son caros por el consumo de tokens', correct: false, explanation: 'El costo es una preocupacion practica pero no el riesgo PRINCIPAL desde el punto de vista de ingenieria.' },
        { text: 'Sin supervision humana, los errores se acumulan sin correccion. El agente puede construir sobre decisiones incorrectas durante muchas iteraciones antes de que alguien lo detecte.', correct: true, explanation: 'Correcto. Este es el problema de "error compounding". Si el agente toma una decision arquitectonica incorrecta en el paso 3 y nadie lo revisa, los pasos 4-20 se construyen sobre esa base erronea. Cuanto mas autonomo, mas lejos puede llegar por un camino equivocado antes de que un humano intervenga.' },
        { text: 'No pueden acceder a APIs externas', correct: false, explanation: 'Los agentes autonomos generalmente SI pueden acceder a APIs, navegadores y terminales. Eso es parte de lo que los hace potentes (y riesgosos).' },
      ],
      source: 'Anthropic - Building Effective Agents',
      sourceUrl: 'https://www.anthropic.com/research/building-effective-agents'
    },
    {
      question: 'Quieres usar un agente de codigo en un pipeline de CI/CD (integracion continua) para que revise PRs automaticamente. Que tipo de agente necesitas?',
      options: [
        { text: 'Un agente IDE como Cursor, porque tiene la mejor interfaz', correct: false, explanation: 'CI/CD no tiene interfaz grafica. Necesitas algo que corra en un servidor sin pantalla.' },
        { text: 'Un agente CLI con modo headless/no-interactivo, como Claude Code con --print o OpenCode con su API', correct: true, explanation: 'Correcto. En CI/CD necesitas un agente que pueda ejecutarse sin interaccion humana, sin GUI, en un servidor. Claude Code soporta modo headless con --print. Los agentes CLI son ideales para automatizacion en pipelines.' },
        { text: 'Devin, porque es el mas autonomo', correct: false, explanation: 'Devin es demasiado para una revision de PR. Ademas opera en su propio entorno cloud, lo cual complica la integracion con tu pipeline existente.' },
        { text: 'Cualquier agente funciona igual en CI/CD', correct: false, explanation: 'No todos los agentes tienen modo headless. Un agente IDE necesita una ventana grafica. La capacidad de operar sin interaccion humana es un requisito especifico de CI/CD.' },
      ],
      source: 'Claude Code - Documentacion Oficial',
      sourceUrl: 'https://code.claude.com/docs/en/overview'
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

  <!-- THEORY SECTION 1: Agentes CLI -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agentes CLI: El poder de la terminal</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Los agentes CLI operan directamente desde tu terminal. Tienen acceso completo al sistema de archivos, pueden ejecutar cualquier comando del SO, y trabajan con el codebase completo del proyecto. Son la opcion mas potente para tareas complejas.
    </p>

    <div class="space-y-4 mb-6">
      <!-- Claude Code -->
      <div class="card border-l-4 border-l-purple-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F7E3;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Claude Code</h3>
              <span class="text-xs bg-agent-accent/10 text-agent-accent px-2 py-0.5 rounded-full border border-agent-accent/30">Anthropic</span>
              <span class="text-xs bg-agent-warning/10 text-agent-warning px-2 py-0.5 rounded-full border border-agent-warning/30">Propietario</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">El agente CLI mas potente del mercado. Basado en Claude Opus 4.6 con razonamiento de nivel superior. Caracteristicas unicas:</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Agent Teams:</strong> Lanza multiples agentes en paralelo sobre el mismo codebase</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">MCP integrado:</strong> Conecta a cualquier servidor MCP para expandir herramientas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Modo headless:</strong> Ejecuta en CI/CD sin interaccion con <code class="text-agent-highlight bg-agent-darker px-1 rounded">--print</code></li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Extended thinking:</strong> Razonamiento profundo antes de actuar</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- OpenCode -->
      <div class="card border-l-4 border-l-green-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F7E2;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">OpenCode</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Open Source</span>
              <span class="text-xs bg-agent-info/10 text-agent-info px-2 py-0.5 rounded-full border border-agent-info/30">Go</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">El rival open source con 100K+ estrellas en GitHub. Escrito en Go para maxima velocidad.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">75+ modelos:</strong> OpenAI, Anthropic, Google, Ollama (local), y mas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Gratuito:</strong> Solo pagas por los tokens del modelo que elijas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Velocidad Go:</strong> Arranque instantaneo, operaciones de archivo ultra-rapidas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Privacidad:</strong> Puedes usarlo con modelos locales, ningun dato sale de tu maquina</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Aider -->
      <div class="card border-l-4 border-l-yellow-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F7E1;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Aider</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Open Source</span>
              <span class="text-xs bg-agent-warning/10 text-agent-warning px-2 py-0.5 rounded-full border border-agent-warning/30">Python</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">Pionero del "AI pair programming" en terminal. Cada cambio de codigo se convierte automaticamente en un commit de Git.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Git-native:</strong> Cada edicion es un commit, facil de revertir</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Multi-modelo:</strong> Funciona con GPT-4, Claude, Gemini, modelos locales</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Leaderboard:</strong> Mantiene benchmarks publicos de rendimiento de modelos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 2: Agentes IDE -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agentes IDE: Inteligencia dentro del editor</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Los agentes IDE se integran directamente en tu editor de codigo. Ofrecen una experiencia visual con diffs inline, chat lateral, y autocompletado inteligente. La gran pregunta del 2026: IDE propio vs extension?
    </p>

    <div class="space-y-4 mb-6">
      <!-- Cursor -->
      <div class="card border-l-4 border-l-blue-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F535;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Cursor</h3>
              <span class="text-xs bg-agent-warning/10 text-agent-warning px-2 py-0.5 rounded-full border border-agent-warning/30">Propietario</span>
              <span class="text-xs bg-agent-info/10 text-agent-info px-2 py-0.5 rounded-full border border-agent-info/30">IDE Propio</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">El IDE AI-native mas popular. Construido sobre VS Code pero con integracion IA profunda.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Agent Mode:</strong> Modo agente que ejecuta acciones autonomamente</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Composer:</strong> Cambios multi-archivo coordinados</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Background Agents:</strong> Agentes que trabajan en segundo plano</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Trade-off:</strong> Requiere abandonar tu VS Code y migrar a su IDE</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Roo Code -->
      <div class="card border-l-4 border-l-orange-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F7E0;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Roo Code</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Apache 2.0</span>
              <span class="text-xs bg-agent-accent/10 text-agent-accent px-2 py-0.5 rounded-full border border-agent-accent/30">VS Code Extension</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">Fork de Cline con mejoras significativas. Su killer feature son los custom modes.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Custom Modes:</strong> Crea roles (architect, debug, review) con instrucciones especificas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Multi-provider:</strong> OpenAI, Anthropic, Google, OpenRouter, local</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Se instala EN tu VS Code:</strong> No migras, no pierdes configuracion</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Cline -->
      <div class="card border-l-4 border-l-gray-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x26AA;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Cline</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Open Source</span>
              <span class="text-xs bg-agent-muted/20 text-agent-muted px-2 py-0.5 rounded-full border border-agent-border">5M+ installs</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">El pionero. La extension original que demostro que un agente completo podia vivir dentro de VS Code. Roo Code y Kilo Code nacieron como forks de Cline.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 3: Agentes Autonomos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agentes Autonomos: La frontera</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Estos agentes representan el nivel mas alto de autonomia: les das una tarea y la ejecutan de principio a fin sin intervencion. Son la promesa mas ambiciosa y tambien la mas riesgosa.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-agent-warning/30 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-2">&#x1F7E4; Devin (Cognition Labs)</h3>
        <p class="text-sm text-agent-muted">El primer "software engineer IA" autonomo. Opera en un entorno completo con terminal, editor y navegador. Controversial por la brecha entre marketing y resultados reales.</p>
        <p class="text-xs text-agent-warning mt-2">Precio: Enterprise ($500+/mes)</p>
      </div>

      <div class="card border-agent-danger/30 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-2">&#x1F534; OpenHands (ex-OpenDevin)</h3>
        <p class="text-sm text-agent-muted">Alternativa open source a Devin. Renombrado despues de quejas de trademark. Entorno sandboxed completo. La comunidad open source construyendo la alternativa libre.</p>
        <p class="text-xs text-agent-success mt-2">Precio: Gratuito (open source)</p>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Advertencia sobre agentes autonomos:</p>
      <p class="text-sm text-agent-muted">La autonomia total es un arma de doble filo. Sin revision humana, los errores se acumulan. Un agente autonomo puede pasar 30 minutos construyendo sobre una decision arquitectonica incorrecta. El consenso del 2026: <strong class="text-agent-text">agentes con supervision humana</strong> son mas efectivos que agentes 100% autonomos.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Como Elegir -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Como Elegir tu Agente</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No existe "el mejor agente". Existe el agente correcto para TU situacion. Usa esta matriz de decision:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-3 text-agent-accent font-bold">Criterio</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">CLI</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">IDE</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">Autonomo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">Privacidad</td>
            <td class="py-3 px-3 text-agent-success">Alta (modelos locales)</td>
            <td class="py-3 px-3 text-agent-warning">Variable</td>
            <td class="py-3 px-3 text-agent-danger">Baja (cloud)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">Control</td>
            <td class="py-3 px-3 text-agent-success">Maximo</td>
            <td class="py-3 px-3 text-agent-success">Alto</td>
            <td class="py-3 px-3 text-agent-danger">Minimo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">Curva de aprendizaje</td>
            <td class="py-3 px-3 text-agent-warning">Media</td>
            <td class="py-3 px-3 text-agent-success">Baja</td>
            <td class="py-3 px-3 text-agent-success">Baja</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">CI/CD</td>
            <td class="py-3 px-3 text-agent-success">Nativo</td>
            <td class="py-3 px-3 text-agent-danger">No</td>
            <td class="py-3 px-3 text-agent-warning">Limitado</td>
          </tr>
          <tr>
            <td class="py-3 px-3 text-agent-accent">Costo</td>
            <td class="py-3 px-3">Gratis a $$$</td>
            <td class="py-3 px-3">Gratis a $$</td>
            <td class="py-3 px-3">$$$+</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Recomendacion para 2026:</p>
      <p class="text-sm text-agent-muted">La combinacion mas potente es <strong class="text-agent-text">CLI + IDE</strong>: usa Claude Code o OpenCode para tareas complejas de refactoring y arquitectura, y Roo Code o Cursor para ediciones rapidas y exploracion del codigo. No es necesario elegir uno solo.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
  <section class="mb-10">
    {#if !showFlow}
      <button onclick={() => showFlow = true} class="btn-primary w-full justify-center">
        Explorar el mapa del ecosistema interactivo
      </button>
    {:else}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="El Ecosistema de Agentes de Codigo 2026"
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
      <p class="text-agent-muted">Ahora conoces el ecosistema completo de agentes de codigo en 2026. Sabes que herramienta usar para cada situacion y los trade-offs de cada opcion.</p>
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
