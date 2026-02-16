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
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes CLI operan directamente desde tu terminal. Tienen acceso completo al sistema de archivos, pueden ejecutar cualquier comando del SO, y trabajan con el codebase completo del proyecto. Son la opcion mas potente para tareas complejas.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La arquitectura de un agente CLI es elegante en su simplicidad: el agente corre como un proceso en tu terminal, se comunica con la API del LLM via HTTPS, y ejecuta herramientas localmente en tu maquina. No hay intermediarios, no hay UI pesada, no hay latencia de red para operaciones de archivo. Por eso los agentes CLI son consistentemente mas rapidos y potentes que sus contrapartes IDE para tareas complejas.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Los agentes CLI tienen una ventaja fundamental sobre los agentes IDE: acceso COMPLETO al sistema operativo. Un agente CLI puede ejecutar Docker, interactuar con Kubernetes, correr pipelines de CI, manejar bases de datos, y hacer cualquier cosa que hagas en tu terminal. Los agentes IDE estan limitados a lo que la extension API del editor permite.</p>
    </div>

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
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">CLAUDE.md:</strong> Sistema de instrucciones por proyecto que persiste entre sesiones</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Memory persistente:</strong> Archivos de memoria que sobreviven entre conversaciones</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Hooks:</strong> Scripts que se ejecutan automaticamente antes/despues de ciertas acciones</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Arquitectura:</strong> Claude Code es un cliente de terminal escrito en TypeScript que se comunica con la API de Anthropic. Cuando le das una tarea, envia tu prompt + las tool definitions + el historial al modelo. El modelo responde con tool calls que Claude Code ejecuta localmente. El loop se repite hasta que la tarea esta completa.</p>
              <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-accent">Precio:</strong> Requiere Claude Max ($100-200/mes), Team ($30/usuario/mes), o Enterprise. No tiene plan gratuito pero incluye uso ilimitado dentro de limites de fair use.</p>
            </div>
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
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">TUI rica:</strong> Interfaz de terminal con paneles, syntax highlighting, y diffs inline</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">LSP integration:</strong> Se conecta al Language Server Protocol para mejor comprension del codigo</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Arquitectura:</strong> Escrito en Go, lo que le da velocidad nativa en operaciones de I/O. Usa una TUI (Terminal User Interface) con Bubble Tea para la interfaz. Soporta multiples providers de modelos via configuracion, incluyendo modelos locales via Ollama o vLLM.</p>
              <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-accent">Precio:</strong> Completamente gratuito. Solo pagas los tokens del modelo que elijas (que pueden ser $0 si usas modelos locales).</p>
            </div>
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
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Codebase mapping:</strong> Crea un "mapa" del codebase para dar contexto al modelo sin leer todo</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">BYOK:</strong> Bring Your Own Key, usa tus propias API keys de cualquier provider</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Arquitectura:</strong> Escrito en Python. Usa "repo maps" generados con tree-sitter para dar contexto del codebase al modelo sin consumir todo el context window. La integracion nativa con Git significa que cada cambio es un commit atomico que puedes revertir facilmente.</p>
              <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-accent">Precio:</strong> Gratuito. Necesitas API keys de tu provider preferido.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El benchmark Aider Leaderboard es una de las fuentes mas confiables para comparar modelos en tareas de codigo. Se actualiza constantemente y mide la capacidad de cada modelo para hacer ediciones correctas de codigo. En 2026, Claude Opus 4.6 lidera consistentemente en las tareas mas complejas, mientras que modelos mas pequenos como GPT-4o-mini ofrecen una excelente relacion calidad/precio para tareas rutinarias.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: Agentes IDE -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agentes IDE: Inteligencia dentro del editor</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes IDE se integran directamente en tu editor de codigo. Ofrecen una experiencia visual con diffs inline, chat lateral, y autocompletado inteligente. La gran pregunta del 2026: IDE propio vs extension?
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La ventaja fundamental de los agentes IDE es la <strong class="text-agent-highlight">retroalimentacion visual inmediata</strong>. Cuando un agente CLI edita un archivo, ves el resultado en tu terminal. Cuando un agente IDE edita un archivo, ves el diff en colores, con lineas agregadas en verde y eliminadas en rojo, exactamente donde estas mirando. Para muchos desarrolladores, esta experiencia visual es insustituible.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El gran debate del 2026 es: <strong class="text-agent-text">IDE dedicado (Cursor)</strong> vs <strong class="text-agent-text">extension en VS Code existente (Roo/Cline/Kilo)</strong>. Un IDE dedicado puede optimizar la experiencia completa pero te fuerza a migrar. Una extension mantiene tu entorno pero esta limitada por la API de VS Code. No hay respuesta correcta universal: depende de tu workflow y prioridades.</p>
    </div>

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
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Composer:</strong> Cambios multi-archivo coordinados con vista unificada</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Background Agents:</strong> Agentes que trabajan en segundo plano mientras tu haces otra cosa</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Cursor 2.0:</strong> Voice input, mejor integracion con Git, UI rediseñada</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Tab completion:</strong> Autocompletado predictivo que anticipa tu siguiente edicion</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Arquitectura:</strong> Cursor es un fork de VS Code (Electron) con capas de IA integradas en el core del editor. Esto le permite hacer cosas que una extension no puede: interceptar cada keystroke para autocompletado, mostrar diffs inline personalizados, y manejar multiples archivos en una vista coordinada (Composer). La desventaja es que es un IDE separado: no puedes usar tus extensions de VS Code que dependan de APIs internas.</p>
              <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-accent">Precio:</strong> Free (limitado), Pro ($20/mes), Business ($40/mes). El plan Pro incluye requests ilimitados de modelos rapidos.</p>
            </div>
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
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Custom Modes:</strong> Crea roles (Code, Architect, Ask, Debug) con instrucciones y restricciones diferentes</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Multi-provider:</strong> OpenAI, Anthropic, Google, OpenRouter, local</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Se instala EN tu VS Code:</strong> No migras, no pierdes configuracion</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">MCP support:</strong> Puede conectarse a servidores MCP para expandir herramientas</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Comunidad activa:</strong> Actualizaciones frecuentes, documentacion solida</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Arquitectura:</strong> Extension de VS Code que se comunica con multiples APIs de LLM. Los custom modes permiten definir el system prompt, las herramientas habilitadas, y las restricciones para cada modo. Por ejemplo: un modo "Architect" que solo puede leer archivos y hacer sugerencias, pero NO puede editar ni ejecutar comandos.</p>
              <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-accent">Precio:</strong> Completamente gratuito (Apache 2.0). Pagas solo los tokens del proveedor que elijas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Kilo Code -->
      <div class="card border-l-4 border-l-cyan-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F4A0;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Kilo Code</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Open Source</span>
              <span class="text-xs bg-agent-accent/10 text-agent-accent px-2 py-0.5 rounded-full border border-agent-accent/30">VS Code Extension</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">Fork de Roo Code con $8M en funding. Enfocado en soportar 500+ modelos y una experiencia pulida.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">500+ modelos:</strong> La mayor cantidad de modelos soportados de cualquier agente IDE</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Respaldado por VC:</strong> $8M en financiamiento para desarrollo rapido</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">UX refinada:</strong> Enfoque en pulir la experiencia de usuario</li>
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
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Human-in-the-loop:</strong> Disenado para que el humano apruebe cada accion critica</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Terminal access:</strong> Fue el primero en demostrar que una extension de VS Code podia ejecutar comandos de terminal</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Legacy importante:</strong> El arbol genealogico es Cline -> Roo Code -> Kilo Code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El arbol genealogico de los agentes IDE en VS Code es fascinante: Cline fue la extension original. Roo Code nacio como fork de Cline cuando sus desarrolladores quisieron llevar el concepto mas lejos con custom modes. Kilo Code nacio como fork de Roo Code con $8M en VC funding. Es el open source en accion: una idea original que se bifurca, mejora, y diversifica en multiples direcciones.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Agentes Autonomos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Agentes Autonomos: La frontera</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Estos agentes representan el nivel mas alto de autonomia: les das una tarea y la ejecutan de principio a fin sin intervencion. Son la promesa mas ambiciosa y tambien la mas riesgosa.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      La diferencia fundamental con los agentes CLI e IDE es que los agentes autonomos operan en su <strong class="text-agent-highlight">propio entorno aislado</strong>. Tienen su propia terminal, su propio editor, su propio navegador. Le das una tarea ("implementa la feature X") y el agente trabaja como un desarrollador remoto: planifica, codea, debuggea, y te entrega el resultado. Tu no ves el proceso en tiempo real (en la mayoria de los casos).
    </p>

    <div class="space-y-4 mb-6">
      <!-- Devin -->
      <div class="card border-l-4 border-l-amber-700">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F7E4;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">Devin (Cognition Labs)</h3>
              <span class="text-xs bg-agent-warning/10 text-agent-warning px-2 py-0.5 rounded-full border border-agent-warning/30">Propietario</span>
              <span class="text-xs bg-agent-danger/10 text-agent-danger px-2 py-0.5 rounded-full border border-agent-danger/30">$500+/mes</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">El primer "software engineer IA" autonomo. Lanzo en marzo 2024 con una demo viral que genero un terremoto mediatico. Controversial por la brecha entre marketing y resultados reales, pero sigue siendo el pionero del concepto.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Entorno completo:</strong> Terminal, editor de codigo, y navegador web en un sandbox</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Devin 2.0:</strong> Mejoras significativas en planificacion y ejecucion</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Integracion Slack:</strong> Le asignas tareas via Slack y te notifica cuando termina</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Sesiones compartidas:</strong> Puedes "entrar" a la sesion del agente y ver que esta haciendo</li>
            </ul>
            <div class="mt-3 bg-agent-darker rounded-lg p-3">
              <p class="text-xs text-agent-muted"><strong class="text-agent-accent">Controversia:</strong> La demo original de Devin fue criticada por ser engañosa: mostraba tareas que el agente resolvia perfectamente, pero la realidad era mas mixta. En evaluaciones independientes, Devin resolvia ~14% de los issues de SWE-bench, lejos del 100% que el marketing sugeria. Dicho esto, ha mejorado significativamente y Goldman Sachs lo despliega para tareas internas.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- OpenHands -->
      <div class="card border-l-4 border-l-red-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F534;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">OpenHands (ex-OpenDevin)</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">MIT License</span>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Gratuito</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">La alternativa open source a Devin. Renombrado de "OpenDevin" por quejas de trademark de Cognition Labs.</p>
            <ul class="mt-2 space-y-1 text-sm text-agent-muted">
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">50%+ SWE-bench:</strong> Resultados competitivos en benchmarks publicos</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Sandbox Docker:</strong> Cada sesion corre en un contenedor aislado</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">SDK componible:</strong> Puedes usar sus componentes individualmente</li>
              <li class="flex items-start gap-2"><span class="text-agent-accent">*</span> <strong class="text-agent-text">Comunidad fuerte:</strong> Cientos de contribuidores, actualizaciones frecuentes</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- SWE-Agent -->
      <div class="card border-l-4 border-l-indigo-500">
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">&#x1F52C;</span>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-agent-text font-bold text-lg">SWE-Agent (Princeton)</h3>
              <span class="text-xs bg-agent-success/10 text-agent-success px-2 py-0.5 rounded-full border border-agent-success/30">Open Source</span>
              <span class="text-xs bg-agent-info/10 text-agent-info px-2 py-0.5 rounded-full border border-agent-info/30">Research</span>
            </div>
            <p class="text-sm text-agent-muted mt-2">Proyecto de investigacion de Princeton. Notable por Mini-SWE-Agent: una implementacion minima de un agente de codigo en ~100 lineas de Python. Perfecto para entender la arquitectura fundamental.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Pensar que los agentes autonomos son "mejores" que los agentes con supervision. En la practica, el problema del <strong class="text-agent-text">error compounding</strong> es devastador: si el agente toma una decision incorrecta en el paso 5 y nadie lo revisa, los pasos 6-30 se construyen sobre esa base erronea. Cuanta mas autonomia, mas lejos puede ir por un camino equivocado. Por eso Goldman Sachs usa Devin PERO con revision humana antes del merge.</p>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Advertencia sobre agentes autonomos:</p>
      <p class="text-sm text-agent-muted">La autonomia total es un arma de doble filo. Sin revision humana, los errores se acumulan. Un agente autonomo puede pasar 30 minutos construyendo sobre una decision arquitectonica incorrecta. El consenso del 2026: <strong class="text-agent-text">agentes con supervision humana (Nivel 2)</strong> son mas efectivos que agentes 100% autonomos (Nivel 3) para la gran mayoria de tareas de desarrollo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Como Elegir -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Como Elegir tu Agente</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No existe "el mejor agente". Existe el agente correcto para TU situacion. La eleccion depende de tu stack, tu presupuesto, tus requisitos de privacidad, y tu estilo de trabajo.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Matriz de decision por categoria</h3>
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
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">Tareas complejas</td>
            <td class="py-3 px-3 text-agent-success">Excelente</td>
            <td class="py-3 px-3 text-agent-warning">Bueno</td>
            <td class="py-3 px-3 text-agent-success">Excelente</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-accent">Feedback visual</td>
            <td class="py-3 px-3 text-agent-warning">Limitado</td>
            <td class="py-3 px-3 text-agent-success">Excelente</td>
            <td class="py-3 px-3 text-agent-danger">Minimo</td>
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

    <h3 class="text-lg font-bold text-agent-text mb-3">Arbol de decision rapido</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <div class="space-y-3 text-sm text-agent-muted">
        <p><span class="text-agent-accent font-bold">Necesitas privacidad total?</span> &#x2192; <strong class="text-agent-text">OpenCode</strong> con modelo local (Ollama/vLLM)</p>
        <p><span class="text-agent-accent font-bold">Usas VS Code y no quieres migrar?</span> &#x2192; <strong class="text-agent-text">Roo Code</strong> o <strong class="text-agent-text">Kilo Code</strong></p>
        <p><span class="text-agent-accent font-bold">Quieres la mejor experiencia AI-native?</span> &#x2192; <strong class="text-agent-text">Cursor</strong></p>
        <p><span class="text-agent-accent font-bold">Vives en la terminal?</span> &#x2192; <strong class="text-agent-text">Claude Code</strong> o <strong class="text-agent-text">OpenCode</strong></p>
        <p><span class="text-agent-accent font-bold">Necesitas integracion con CI/CD?</span> &#x2192; <strong class="text-agent-text">Claude Code</strong> (modo headless)</p>
        <p><span class="text-agent-accent font-bold">Presupuesto $0?</span> &#x2192; <strong class="text-agent-text">OpenCode</strong> + modelo gratuito o <strong class="text-agent-text">Aider</strong></p>
        <p><span class="text-agent-accent font-bold">Maximo razonamiento posible?</span> &#x2192; <strong class="text-agent-text">Claude Code</strong> (Opus 4.6)</p>
        <p><span class="text-agent-accent font-bold">Quieres custom modes por rol?</span> &#x2192; <strong class="text-agent-text">Roo Code</strong></p>
        <p><span class="text-agent-accent font-bold">Git integrado con cada cambio?</span> &#x2192; <strong class="text-agent-text">Aider</strong></p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tabla de costos comparativa</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Agente</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Licencia</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Costo herramienta</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Costo modelo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Claude Code</td>
            <td class="py-2 px-3">Propietario</td>
            <td class="py-2 px-3">$100-200/mes (Max)</td>
            <td class="py-2 px-3">Incluido</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">OpenCode</td>
            <td class="py-2 px-3">Open Source</td>
            <td class="py-2 px-3">Gratis</td>
            <td class="py-2 px-3">$0 (local) a $$$ (APIs)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Aider</td>
            <td class="py-2 px-3">Open Source</td>
            <td class="py-2 px-3">Gratis</td>
            <td class="py-2 px-3">BYOK (tu API key)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Cursor</td>
            <td class="py-2 px-3">Propietario</td>
            <td class="py-2 px-3">$0-40/mes</td>
            <td class="py-2 px-3">Incluido en plan</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Roo Code</td>
            <td class="py-2 px-3">Apache 2.0</td>
            <td class="py-2 px-3">Gratis</td>
            <td class="py-2 px-3">BYOK (tu API key)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Cline/Kilo</td>
            <td class="py-2 px-3">Open Source</td>
            <td class="py-2 px-3">Gratis</td>
            <td class="py-2 px-3">BYOK (tu API key)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3">Devin</td>
            <td class="py-2 px-3">Propietario</td>
            <td class="py-2 px-3">$500+/mes</td>
            <td class="py-2 px-3">Incluido</td>
          </tr>
          <tr>
            <td class="py-2 px-3">OpenHands</td>
            <td class="py-2 px-3">MIT</td>
            <td class="py-2 px-3">Gratis</td>
            <td class="py-2 px-3">BYOK (tu API key)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Muchas empresas en 2026 usan una combinacion. Un patron comun: <strong class="text-agent-text">Claude Code para tareas complejas</strong> (refactoring, migraciones, debugging profundo) + <strong class="text-agent-text">Roo Code para el dia a dia</strong> (ediciones rapidas, exploracion del codigo, code review). El costo combinado es menor que Devin y la productividad es comparable o superior porque tienes supervision humana en cada paso.</p>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Recomendacion para 2026:</p>
      <p class="text-sm text-agent-muted">La combinacion mas potente es <strong class="text-agent-text">CLI + IDE</strong>: usa Claude Code o OpenCode para tareas complejas de refactoring y arquitectura, y Roo Code o Cursor para ediciones rapidas y exploracion del codigo. No es necesario elegir uno solo. Los agentes no son mutuamente excluyentes.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: El Mapa Completo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Mapa Completo del Ecosistema</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para tener la foto completa, necesitas ver como se organiza todo el ecosistema. No solo existen los agentes que hemos visto: hay todo un mundo de frameworks, herramientas auxiliares, y servicios que orbitan alrededor de ellos.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tabla completa de agentes 2026</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-2 text-agent-accent font-bold">Agente</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Tipo</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Licencia</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Lenguaje</th>
            <th class="text-left py-2 px-2 text-agent-text font-bold">Feature unica</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Claude Code</td>
            <td class="py-2 px-2">CLI</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">TypeScript</td>
            <td class="py-2 px-2">Agent Teams, MCP, Extended Thinking</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">OpenCode</td>
            <td class="py-2 px-2">CLI</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">Go</td>
            <td class="py-2 px-2">75+ modelos, velocidad Go, LSP</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Aider</td>
            <td class="py-2 px-2">CLI</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">Python</td>
            <td class="py-2 px-2">Git-native, codebase mapping</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Cursor</td>
            <td class="py-2 px-2">IDE</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">TypeScript</td>
            <td class="py-2 px-2">Background agents, Composer</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Roo Code</td>
            <td class="py-2 px-2">IDE ext.</td>
            <td class="py-2 px-2">Apache 2.0</td>
            <td class="py-2 px-2">TypeScript</td>
            <td class="py-2 px-2">Custom modes, MCP</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Kilo Code</td>
            <td class="py-2 px-2">IDE ext.</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">TypeScript</td>
            <td class="py-2 px-2">500+ modelos, $8M funding</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Cline</td>
            <td class="py-2 px-2">IDE ext.</td>
            <td class="py-2 px-2">Open Source</td>
            <td class="py-2 px-2">TypeScript</td>
            <td class="py-2 px-2">5M+ installs, el pionero</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">Devin</td>
            <td class="py-2 px-2">Autonomo</td>
            <td class="py-2 px-2">Propietario</td>
            <td class="py-2 px-2">-</td>
            <td class="py-2 px-2">Entorno completo, Slack integration</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-2 text-agent-text font-bold">OpenHands</td>
            <td class="py-2 px-2">Autonomo</td>
            <td class="py-2 px-2">MIT</td>
            <td class="py-2 px-2">Python</td>
            <td class="py-2 px-2">Docker sandbox, SDK componible</td>
          </tr>
          <tr>
            <td class="py-2 px-2 text-agent-text font-bold">SWE-Agent</td>
            <td class="py-2 px-2">Autonomo</td>
            <td class="py-2 px-2">MIT</td>
            <td class="py-2 px-2">Python</td>
            <td class="py-2 px-2">Mini-Agent en 100 lineas, research</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Open Source vs Propietario: la guerra continua</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El ecosistema esta dividido en dos campos. Por un lado, las soluciones <strong class="text-agent-highlight">propietarias</strong> (Claude Code, Cursor, Devin) ofrecen experiencias pulidas, modelos optimizados, y soporte empresarial. Por otro, las soluciones <strong class="text-agent-highlight">open source</strong> (OpenCode, Aider, Roo Code, OpenHands) ofrecen libertad, transparencia, privacidad, y costo cero.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Lo interesante es que en 2026 no hay un ganador claro. Las soluciones propietarias lideran en calidad de razonamiento (porque controlan el modelo). Las open source lideran en flexibilidad y privacidad (porque controlas todo tu). Y muchos desarrolladores usan AMBAS: propietario para las tareas criticas, open source para el dia a dia.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El mercado de agentes de codigo en 2026 se estima en varios billones de dolares anuales. Cursor levanto mas de $900M en funding. Cognition Labs (Devin) levanto $175M. El open source compite con cero funding pero con el poder de miles de contribuidores. Es uno de los campos mas dinamicos y competitivos de la tecnologia actual.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">No te cases con una herramienta. El ecosistema esta evolucionando tan rapido que el mejor agente de hoy puede no serlo en 6 meses. Aprende los CONCEPTOS (agent loop, tool calling, planning) y podras usar CUALQUIER herramienta. Los conceptos son transferibles; las interfaces de usuario no lo son. Eso es exactamente lo que este curso te ensena.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Los frameworks que orbitan el ecosistema</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ademas de los agentes individuales, existe todo un ecosistema de <strong class="text-agent-highlight">frameworks</strong> para construir agentes personalizados. Estos no son agentes de codigo per se, sino herramientas para CREAR agentes especializados. Los veremos en detalle en el Modulo 7, pero vale mencionarlos para completar el mapa:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">Claude SDK (Anthropic)</p>
        <p class="text-xs text-agent-muted">El SDK oficial para construir agentes con Claude. Minimalista: te da el client, los tools, y el loop. Tu construyes la logica.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">OpenAI Agents SDK</p>
        <p class="text-xs text-agent-muted">Framework de OpenAI para agentes. Incluye guardrails nativos, handoffs entre agentes, y tracing integrado.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">LangGraph (LangChain)</p>
        <p class="text-xs text-agent-muted">Framework basado en grafos para workflows complejos. Excelente para agentes con logica condicional y estados.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">CrewAI</p>
        <p class="text-xs text-agent-muted">Framework multi-agente donde cada agente tiene un "rol" definido. Metafora: un equipo de trabajo con roles especializados.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">Strands Agents (AWS)</p>
        <p class="text-xs text-agent-muted">Framework minimalista de AWS. Filosofia: "el agente loop en 4 lineas de codigo". Fuertemente tipado.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-3">
        <p class="text-sm text-agent-text font-bold">Google ADK</p>
        <p class="text-xs text-agent-muted">Agent Development Kit de Google. Integrado con Gemini. Foco en agentes conversacionales y multi-modales.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Benchmarks: como se mide un agente</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para comparar agentes objetivamente, la comunidad usa benchmarks estandarizados. Los mas importantes:
    </p>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-2 px-3 text-agent-accent font-bold">Benchmark</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Que mide</th>
            <th class="text-left py-2 px-3 text-agent-text font-bold">Lider 2026</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">SWE-bench Verified</td>
            <td class="py-2 px-3">Resolver issues reales de repos open source de GitHub</td>
            <td class="py-2 px-3">Claude Code (72.7%)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">HumanEval</td>
            <td class="py-2 px-3">Generar funciones correctas a partir de docstrings</td>
            <td class="py-2 px-3">Claude Opus 4.6 / GPT-4o</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-3 text-agent-text font-bold">Aider Leaderboard</td>
            <td class="py-2 px-3">Editar codigo existente correctamente (refactoring)</td>
            <td class="py-2 px-3">Claude Opus 4.6</td>
          </tr>
          <tr>
            <td class="py-2 px-3 text-agent-text font-bold">Terminal-bench</td>
            <td class="py-2 px-3">Tareas complejas en terminal (Docker, Git, scripts)</td>
            <td class="py-2 px-3">Claude Code</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Elegir un agente SOLO por sus benchmarks. Los benchmarks miden tareas especificas en condiciones controladas. Tu proyecto real tiene complejidades que ningun benchmark captura: la estructura de tu codebase, tus convenciones, tus dependencias, tu CI/CD. Un agente que lidera SWE-bench puede no ser el mejor para TU workflow especifico. Prueba varios con tu proyecto real antes de decidir.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Shopify reporto en 2025 que al evaluar agentes de codigo para su equipo, descubrieron que el agente con mejores benchmarks no era necesariamente el mejor para su codebase de Ruby on Rails. Un agente mas modesto pero con mejor soporte de Ruby les daba mejores resultados en la practica. La leccion: benchmarks como filtro inicial, pruebas reales como decision final.</p>
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
