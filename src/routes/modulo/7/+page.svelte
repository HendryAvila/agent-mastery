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

  const MODULE_ID = 7;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let showQuiz = $state(false);
  let showFlow = $state(false);

  courseStore.startModule(MODULE_ID);

  // ─── InteractiveFlow: Memory Hierarchy of Claude Code ───
  const flowNodes = [
    { id: 'system-prompt', label: 'System Prompt', description: 'Capa 1: el prompt de sistema gestionado por Anthropic. Contiene las reglas de seguridad, capacidades base, identidad del modelo y las instrucciones fundamentales que definen el comportamiento de Claude. Es permanente e inmutable por el usuario. Piensa en el como el ADN del agente: siempre esta ahi, establece los limites, y no puedes modificarlo.', icon: '\u{1F512}', x: 10, y: 50 },
    { id: 'claude-md', label: 'CLAUDE.md', description: 'Capa 2: archivos CLAUDE.md definidos por el usuario o el proyecto. Existen en 3 niveles: ~/.claude/CLAUDE.md (global, aplica a todos tus proyectos), ./CLAUDE.md (proyecto, compartido via git), y ./.claude/CLAUDE.md (local, ignorado por git). Se inyectan al inicio de cada sesion. Es la memoria persistente MAS importante porque TU la controlas.', icon: '\u{1F4DD}', x: 30, y: 15 },
    { id: 'conversation', label: 'Conversacion', description: 'Capa 3: el historial de la conversacion actual. Incluye todos los mensajes del usuario, respuestas del modelo, resultados de herramientas, y archivos leidos. Es la working memory del agente: lo que "recuerda" durante ESTA sesion. Limitada por el context window (200K tokens, 1M en beta). Cuando se llena, se pierde informacion del principio.', icon: '\u{1F4AC}', x: 50, y: 50 },
    { id: 'thinking', label: 'Extended Thinking', description: 'Capa 4: el scratchpad interno de razonamiento. Cuando extended thinking esta habilitado, Claude genera un bloque de pensamiento antes de responder. Es como el "borrador mental" donde el agente razona paso a paso. Se genera por turno: no persiste entre turnos. Se configura con MAX_THINKING_TOKENS. Los tokens de pensamiento se cobran a tarifa de input (mas barato que output).', icon: '\u{1F9E0}', x: 70, y: 15 },
    { id: 'auto-memory', label: 'Auto Memory', description: 'Capa 5: memoria auto-generada que persiste entre sesiones. Claude Code aprende de tus patrones, preferencias y decisiones, y los guarda automaticamente en archivos de memoria. Implementa memoria episodica: "la ultima vez que intentamos X, fallo por Y". Es la unica capa que permite al agente aprender de experiencias pasadas SIN que el usuario tenga que escribir manualmente.', icon: '\u{1F4BE}', x: 90, y: 50 },
    { id: 'mcp-state', label: 'MCP State', description: 'Capa 6: estado externo gestionado por MCP servers. Incluye queries a bases de datos, estado de archivos del filesystem, resultados de APIs externas, y cualquier informacion que los MCP servers proporcionan. Es la conexion del agente con el "mundo real". No es memoria del agente, sino informacion del entorno que el agente consulta on-demand.', icon: '\u{1F30D}', x: 50, y: 88 }
  ];

  const flowEdges = [
    { from: 'system-prompt', to: 'claude-md', label: 'Permanente' },
    { from: 'claude-md', to: 'conversation', label: 'Por proyecto' },
    { from: 'conversation', to: 'thinking', label: 'Por turno' },
    { from: 'thinking', to: 'auto-memory', label: 'Cross-session' },
    { from: 'auto-memory', to: 'mcp-state', label: 'Externo' },
    { from: 'mcp-state', to: 'conversation', label: 'On-demand' }
  ];

  const flowChallenges = [
    { question: 'Quieres que tu agente recuerde las convenciones de tu equipo (naming, patterns, stack) en TODOS los proyectos. Que capa de memoria usas?', targetNodeId: 'claude-md', hint: 'Una capa que persiste por proyecto y que TU controlas directamente como archivos.' },
    { question: 'El agente esta razonando sobre una decision de arquitectura compleja y necesita un "borrador mental" para evaluar opciones. Que capa se activa?', targetNodeId: 'thinking', hint: 'Una capa que genera razonamiento interno antes de responder, como un scratchpad.' },
    { question: 'Necesitas que el agente consulte el estado actual de tu base de datos PostgreSQL. Que capa proporciona esta informacion?', targetNodeId: 'mcp-state', hint: 'Una capa que conecta al agente con sistemas externos via servidores especializados.' },
    { question: 'El agente "recuerda" que la semana pasada un refactor de auth causo un bug en middleware. De donde viene ese conocimiento?', targetNodeId: 'auto-memory', hint: 'Una capa que persiste aprendizajes ENTRE sesiones, sin que el usuario escriba manualmente.' }
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Segun el blog de ingenieria de Anthropic, que mejora porcentual logra el Think Tool en tareas que requieren adherencia a politicas complejas?',
      options: [
        { text: '25% de mejora sobre el baseline sin Think Tool', correct: false, explanation: 'Incorrecto. La mejora es significativamente mayor. El Think Tool permite al modelo razonar explicitamente antes de actuar, lo cual tiene un impacto dramatico en tareas con reglas complejas.' },
        { text: '54% de mejora en tareas con politicas complejas', correct: true, explanation: 'Correcto! Segun el blog de Anthropic "The Think Tool", el modelo mejoro un 54% en tareas que requieren adherencia a politicas complejas cuando usa el Think Tool como scratchpad de razonamiento. Es uno de los datos mas impactantes sobre razonamiento agentico.' },
        { text: '39% de mejora general en todas las tareas', correct: false, explanation: 'El 39% es otro dato real, pero se refiere a la mejora lograda por memory + context editing en tareas de larga duracion (del paper "Effective Harnesses for Long-Running Agents"). No confundas las dos metricas.' },
        { text: '80% de mejora pero solo en tareas matematicas', correct: false, explanation: 'El Think Tool no se limita a matematicas. Su mayor impacto es en tareas con multiples reglas y restricciones que el modelo debe seguir simultaneamente.' }
      ],
      source: 'Anthropic - The Think Tool',
      sourceUrl: 'https://www.anthropic.com/engineering/claude-think-tool'
    },
    {
      question: 'En la jerarquia de 6 capas de memoria de Claude Code, cual es la UNICA capa que permite al agente aprender de experiencias pasadas entre sesiones SIN intervencion manual del usuario?',
      options: [
        { text: 'CLAUDE.md: porque persiste entre sesiones y contiene las convenciones del proyecto', correct: false, explanation: 'CLAUDE.md persiste entre sesiones, pero requiere que TU lo escribas y mantengas manualmente. No es aprendizaje automatico del agente.' },
        { text: 'Extended Thinking: porque el razonamiento profundo genera aprendizaje permanente', correct: false, explanation: 'Extended Thinking se genera por turno y NO persiste entre turnos ni entre sesiones. Es un scratchpad temporal, no memoria persistente.' },
        { text: 'Auto Memory: memoria auto-generada que persiste patrones y decisiones entre sesiones automaticamente', correct: true, explanation: 'Correcto! Auto Memory es la unica capa donde el agente APRENDE automaticamente. Detecta patrones, preferencias y decisiones, y los persiste sin que el usuario tenga que escribir nada. Es memoria episodica real: "la ultima vez que hicimos X, paso Y".' },
        { text: 'MCP State: porque los MCP servers mantienen estado externo persistente', correct: false, explanation: 'MCP State es informacion del entorno externo (bases de datos, APIs), no memoria del agente. El agente consulta MCP on-demand pero no "aprende" de ello automaticamente.' }
      ]
    },
    {
      question: 'Estas en una sesion larga con Claude Code. El context window esta al 75% y necesitas seguir trabajando en la misma tarea. Que estrategia usas?',
      options: [
        { text: '/clear: borra todo y empieza desde cero con un contexto limpio', correct: false, explanation: '/clear borra TODO el contexto. Si necesitas continuidad en la misma tarea, perderias decisiones y contexto acumulado. /clear es para CAMBIAR de tarea, no para continuar la misma.' },
        { text: '/compact: resume el contexto preservando decisiones clave, liberando tokens para seguir trabajando', correct: true, explanation: 'Correcto! /compact es la herramienta correcta aqui. Resume el contexto manteniendo las decisiones y el progreso, libera espacio en el context window, y permite seguir trabajando con continuidad. Es la diferencia entre "borrar la pizarra" (/clear) y "resumir los apuntes" (/compact).' },
        { text: 'Lanzar un sub-agent para que haga el trabajo restante en un contexto limpio', correct: false, explanation: 'Los sub-agents son utiles para tareas de investigacion paralela, pero si TU necesitas seguir trabajando en la misma tarea con todo el contexto, un sub-agent no tiene ese contexto acumulado. Perderia toda la continuidad.' },
        { text: 'No hacer nada: Claude Code gestiona automaticamente el context overflow', correct: false, explanation: 'Claude Code si hace auto-compaction cuando el contexto se acerca al limite, pero esperar a que pase automaticamente es arriesgado. Hacerlo proactivamente con /compact te da mas control sobre que se preserva.' }
      ]
    },
    {
      question: 'El patron ReAct (Reasoning + Acting) se diferencia de Chain-of-Thought puro porque:',
      options: [
        { text: 'ReAct es mas rapido ya que no necesita razonar antes de actuar', correct: false, explanation: 'Al contrario, ReAct SIEMPRE razona antes de actuar. La "R" en ReAct es Reasoning. La diferencia no es velocidad sino que intercala razonamiento con acciones reales.' },
        { text: 'ReAct intercala Thought -> Action -> Observation en cada paso, combinando razonamiento con ejecucion real de herramientas', correct: true, explanation: 'Correcto! ReAct = Reasoning + Acting intercalados. En cada paso: (1) Thought - el modelo razona sobre que hacer, (2) Action - ejecuta una herramienta, (3) Observation - procesa el resultado. Repite hasta completar. Esto es EXACTAMENTE el agent loop de Claude Code: piensa, ejecuta una tool, observa el resultado, piensa de nuevo.' },
        { text: 'ReAct solo funciona con modelos que soportan tool calling nativo', correct: false, explanation: 'El paper original de ReAct (Yao et al. 2022) funciono con modelos que NO tenian tool calling nativo. El patron es independiente de la implementacion: se puede lograr con prompting o con tool calling.' },
        { text: 'CoT y ReAct son sinonimos, solo que ReAct es la version moderna', correct: false, explanation: 'No son sinonimos. CoT es razonamiento PURO sin acciones externas. ReAct COMBINA razonamiento con acciones. Es como la diferencia entre pensar en voz alta vs pensar y luego experimentar. Son complementarios, no intercambiables.' }
      ],
      source: 'ReAct: Synergizing Reasoning and Acting (Yao et al. 2022)',
      sourceUrl: 'https://arxiv.org/abs/2210.03629'
    },
    {
      question: 'Segun el paper de Anthropic "Effective Harnesses for Long-Running Agents", que mejora porcentual se logra al combinar memory + context editing en agentes de larga duracion?',
      options: [
        { text: '15% de mejora: es un beneficio marginal', correct: false, explanation: 'El beneficio es mucho mayor que marginal. Memory + context editing es una de las tecnicas mas impactantes para agentes de larga duracion.' },
        { text: '39% de mejora en tareas de larga duracion al combinar memory con context editing', correct: true, explanation: 'Correcto! El paper de Anthropic "Effective Harnesses" reporta una mejora del 39% al combinar memoria persistente con edicion activa del contexto (compaction, note-taking, sub-agents). Es evidencia empirica de que gestionar activamente el contexto no es opcional: es critico para agentes que corren durante horas.' },
        { text: '54% de mejora: el mismo dato que el Think Tool', correct: false, explanation: 'El 54% es la mejora del Think Tool en tareas de politicas complejas, no la mejora de memory + context editing. Son dos metricas de dos papers diferentes.' },
        { text: '90% de mejora: casi duplica el rendimiento', correct: false, explanation: 'El 90.2% es la mejora del Multi-Agent Research System de Anthropic, no de memory + context editing. Cada dato tiene su fuente especifica.' }
      ],
      source: 'Anthropic - Effective Harnesses for Long-Running Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow does not trigger module completion
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    const badge = courseStore.unlockBadge('memory-architect');
    if (badge) {
      earnedBadge = badge;
      showBadge = true;
    }
  }
</script>

<svelte:head>
  <title>{mod.title} | Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 fade-in">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <span class="text-xs text-agent-accent uppercase tracking-wider font-bold">Modulo {MODULE_ID}</span>
        <h1 class="text-3xl font-bold text-agent-text">{mod.title}</h1>
      </div>
    </div>
    <p class="text-agent-muted mt-2">{mod.subtitle}</p>
    <div class="flex items-center gap-4 mt-3">
      <span class="badge bg-agent-accent/20 text-agent-accent">{mod.duration}</span>
      <span class="badge bg-agent-card text-agent-muted border border-agent-border">{mod.type}</span>
    </div>
  </div>

  <!-- Objectives -->
  <div class="card mb-8 fade-in">
    <h2 class="text-lg font-bold text-agent-text mb-3">Objetivos de aprendizaje</h2>
    <ul class="space-y-2">
      {#each mod.objectives as obj}
        <li class="flex items-start gap-2 text-agent-muted">
          <span class="text-agent-accent shrink-0 mt-0.5">&#9654;</span>
          {obj}
        </li>
      {/each}
    </ul>
  </div>

  <!-- ================================================================ -->
  <!-- Section 1: Tipos de Memoria en Agentes -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. Tipos de Memoria en Agentes</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un agente sin memoria es como un cirujano con amnesia: puede ejecutar procedimientos brillantemente, pero olvida todo entre operaciones. No recuerda que el paciente es alergico, no recuerda que la semana pasada el mismo procedimiento causo complicaciones, y no recuerda las preferencias del equipo. La memoria es lo que transforma a un agente de un <strong class="text-agent-text">ejecutor de instrucciones</strong> en un <strong class="text-agent-text">colaborador que aprende</strong>.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      En la investigacion de agentes IA, la memoria se clasifica en tres tipos fundamentales. Cada tipo cumple un rol diferente y persiste de manera diferente. Entender estas distinciones es critico para disenar agentes que realmente aprenden y mejoran con el tiempo.
    </p>

    <!-- Three memory types -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x26A1;</span>
          <h3 class="text-agent-accent font-bold">Short-term (Working Memory)</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Lo que el agente "recuerda" durante <strong class="text-agent-text">esta conversacion</strong>. Es el context window actual: mensajes del usuario, respuestas del modelo, resultados de herramientas.
        </p>
        <div class="bg-agent-dark rounded-lg p-3 mb-3">
          <p class="text-xs text-agent-accent font-bold mb-1">En Claude Code:</p>
          <p class="text-xs text-agent-muted">El historial de la sesion actual. Si lees un archivo, Claude lo "recuerda" hasta que el contexto se llena (200K tokens) o haces /clear.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-agent-warning/20 text-agent-warning border border-agent-warning/30">Efimera</span>
          <span class="text-xs px-2 py-0.5 rounded bg-agent-info/20 text-agent-info border border-agent-info/30">200K tokens</span>
        </div>
      </div>

      <div class="bg-agent-card border border-agent-success/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x1F4BE;</span>
          <h3 class="text-agent-success font-bold">Long-term (Persistent)</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Informacion almacenada <strong class="text-agent-text">entre sesiones</strong>. No desaparece cuando cierras la terminal. El agente puede acceder a ella en cualquier sesion futura.
        </p>
        <div class="bg-agent-dark rounded-lg p-3 mb-3">
          <p class="text-xs text-agent-accent font-bold mb-1">En Claude Code:</p>
          <p class="text-xs text-agent-muted">CLAUDE.md (tus convenciones), auto memory (patrones aprendidos), archivos del proyecto. Persisten en disco.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-agent-success/20 text-agent-success border border-agent-success/30">Persistente</span>
          <span class="text-xs px-2 py-0.5 rounded bg-agent-info/20 text-agent-info border border-agent-info/30">Ilimitada</span>
        </div>
      </div>

      <div class="bg-agent-card border border-purple-500/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x1F4DA;</span>
          <h3 class="text-purple-400 font-bold">Episodic</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Experiencias pasadas especificas. "La ultima vez que intentamos X, se rompio Y." El agente recuerda <strong class="text-agent-text">que paso y como lo resolvio</strong>.
        </p>
        <div class="bg-agent-dark rounded-lg p-3 mb-3">
          <p class="text-xs text-agent-accent font-bold mb-1">En Claude Code:</p>
          <p class="text-xs text-agent-muted">Auto memory aprende de sesiones pasadas. Si un patron causo un bug antes, lo recuerda. Es como un diario de experiencias tecnicas.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Experiencial</span>
          <span class="text-xs px-2 py-0.5 rounded bg-agent-info/20 text-agent-info border border-agent-info/30">Cross-session</span>
        </div>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La analogia mas precisa es con la memoria humana. Tu <strong class="text-agent-text">working memory</strong> es lo que tienes "en la cabeza" ahora mismo mientras lees esto: puedes manejar 5-7 chunks de informacion simultaneamente. Tu <strong class="text-agent-text">memoria a largo plazo</strong> son todos los conceptos que aprendiste a lo largo de tu carrera: sabes que es una base de datos, que es REST, como funciona git. Tu <strong class="text-agent-text">memoria episodica</strong> es especifica: recuerdas esa vez que un deploy fallo a las 3AM porque olvidaste migrar la base de datos.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Antes de los sistemas de memoria persistente, cada sesion con un agente IA empezaba desde cero. Era como trabajar con un colega que sufre amnesia cada manana: brillante durante el dia, pero al dia siguiente no recuerda nada. Los sistemas modernos como el auto memory de Claude Code resolvieron esto almacenando patrones y decisiones automaticamente. Segun datos de Anthropic, agentes con memoria persistente + edicion de contexto logran un <strong class="text-agent-text">39% de mejora</strong> en tareas de larga duracion.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Tratar toda la informacion como igualmente importante para la memoria. Si guardas TODO (cada archivo leido, cada comando ejecutado, cada decision trivial), la memoria se convierte en ruido. La clave es <strong class="text-agent-text">guardar decisiones, patrones y errores, NO estado temporal</strong>. Nadie escribe en su diario "hoy respire" porque no es informacion util. El mismo principio aplica a la memoria de agentes: selectividad > volumen.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 2: La Jerarquia de Memoria de Claude Code -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. La Jerarquia de Memoria de Claude Code</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code no tiene "una memoria". Tiene <strong class="text-agent-text">6 capas de memoria</strong> que operan en conjunto, cada una con diferente persistencia, control y proposito. Entender esta jerarquia es fundamental para trabajar efectivamente: saber donde poner cada tipo de informacion determina si tu agente la recordara por un turno, una sesion, o para siempre.
    </p>

    <!-- 6-layer table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm text-left border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-dark text-agent-accent">
          <tr>
            <th class="py-3 px-4">Capa</th>
            <th class="py-3 px-4">Mecanismo</th>
            <th class="py-3 px-4">Persistencia</th>
            <th class="py-3 px-4">Ejemplo</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-agent-border bg-agent-card">
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">1. System Prompt</td>
            <td class="py-3 px-4 text-agent-muted">Anthropic managed</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-agent-success/20 text-agent-success">Permanente</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Reglas de seguridad, capacidades del modelo, identidad</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">2. CLAUDE.md</td>
            <td class="py-3 px-4 text-agent-muted">Archivos user/project</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-agent-accent/20 text-agent-accent">Per-project</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Tech stack, convenciones, reglas del equipo</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">3. Conversacion</td>
            <td class="py-3 px-4 text-agent-muted">Sesion actual</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-agent-warning/20 text-agent-warning">Session-only</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Mensajes, tool results, archivos leidos</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">4. Extended Thinking</td>
            <td class="py-3 px-4 text-agent-muted">Scratchpad interno</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-agent-danger/20 text-agent-danger">Per-turn</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Razonamiento complejo paso a paso</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">5. Auto Memory</td>
            <td class="py-3 px-4 text-agent-muted">Auto-generada</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Cross-session</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Patrones aprendidos, preferencias, decisiones</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-text font-medium">6. MCP State</td>
            <td class="py-3 px-4 text-agent-muted">MCP servers</td>
            <td class="py-3 px-4"><span class="text-xs px-2 py-0.5 rounded bg-agent-info/20 text-agent-info">Externo</span></td>
            <td class="py-3 px-4 text-agent-muted text-xs">Queries a DB, estado de archivos, APIs externas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Las capas 1-2 se cargan <strong class="text-agent-text">antes de que veas el primer mensaje</strong>. El system prompt de Anthropic y tus archivos CLAUDE.md se inyectan automaticamente al inicio de cada sesion. Esto significa que cuando escribes tu primer mensaje, Claude ya "sabe" las reglas de seguridad (capa 1) y las convenciones de tu proyecto (capa 2). La capa 3 crece con cada interaccion. La capa 4 se genera y descarta en cada turno. La capa 5 persiste entre sesiones. La capa 6 es informacion que existe fuera de Claude.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Capa 2 en profundidad: la jerarquia de CLAUDE.md</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      CLAUDE.md es la capa mas importante que <strong class="text-agent-text">TU</strong> controlas. Existe en 3 niveles, cada uno con diferente alcance:
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">~/.claude/CLAUDE.md          # Global: aplica a TODOS tus proyectos
                                # Ejemplo: "Usa conventional commits", "Nunca auto-commit"

./CLAUDE.md                   # Proyecto: compartido via git con el equipo
                                # Ejemplo: Tech stack, patrones, estructura de directorios

./.claude/CLAUDE.md           # Local: solo para ti, ignorado por .gitignore
                                # Ejemplo: Tu configuracion personal, atajos, preferencias</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los tres niveles se fusionan en orden: global primero, luego proyecto, luego local. Si hay conflicto, el mas especifico gana. Esto permite que el equipo tenga convenciones compartidas (proyecto) mientras cada desarrollador tiene sus preferencias personales (local) y sus reglas universales (global).
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Capa 5 en profundidad: Auto Memory</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Auto Memory es donde Claude Code se vuelve genuinamente inteligente. No es solo un historial: es un sistema que <strong class="text-agent-text">extrae patrones de tus sesiones</strong> y los persiste para uso futuro. Cuando Claude Code nota que siempre usas un patron especifico (por ejemplo, siempre escribes tests con vitest en vez de jest), lo guarda. La proxima sesion, ya "sabe" tu preferencia sin que la repitas.
    </p>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># Ejemplo de lo que Auto Memory guarda automaticamente:

## Patron aprendido: Testing
- El usuario prefiere vitest sobre jest
- Los tests van en __tests__/ co-located con el codigo fuente
- Siempre usa describe/it (no test())

## Decision arquitectonica
- Proyecto usa Clean Architecture con 3 capas
- La capa de dominio NO depende de la infraestructura
- Los DTOs se definen con Zod, no con interfaces TypeScript

## Bug resuelto
- Error con middleware de auth: el token JWT expiraba
  pero el refresh token no se renovaba automaticamente.
  Solucion: agregar interceptor en axios que renueva antes
  de que expire.</pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La diferencia entre capa 2 (CLAUDE.md) y capa 5 (Auto Memory) es <strong class="text-agent-text">quien escribe</strong>. CLAUDE.md lo escribes TU: es intencional, curado, y revisado. Auto Memory lo escribe CLAUDE: es automatico, basado en patrones detectados, y puede incluir ruido. Ambos son valiosos, pero para diferentes propositos. CLAUDE.md es tu "constitucion". Auto Memory es tu "diario de campo".</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">En proyectos con CLAUDE.md bien diseñado, el tiempo de onboarding de un nuevo desarrollador al equipo se reduce drasticamente. El agente ya sabe las convenciones, los patrones de testing, la estructura del proyecto, y las decisiones arquitectonicas. En vez de que el nuevo desarrollador lea paginas de documentacion, le pide a Claude Code "agrega un nuevo endpoint de usuarios" y el agente aplica automaticamente todos los patrones del equipo: el ORM correcto, la estructura de carpetas, los tests en el formato esperado, los error handlers estandar.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 3: Think Tool — El Superpoder Oculto -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Think Tool: El Superpoder Oculto</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Imagina que un agente necesita decidir si debe ejecutar un comando potencialmente destructivo. Tiene 5 reglas de seguridad que evaluar, 3 condiciones del contexto, y 2 excepciones. Sin un mecanismo de razonamiento explicito, el modelo intenta hacer todo "en su cabeza" mientras genera la respuesta, lo cual es propenso a errores. El <strong class="text-agent-text">Think Tool</strong> resuelve esto dandole al modelo un espacio dedicado para razonar.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-5 mb-6">
      <h3 class="text-agent-accent font-bold text-lg mb-3">Que es el Think Tool?</h3>
      <p class="text-sm text-agent-muted mb-3">
        Es una herramienta especial que le da al modelo un <strong class="text-agent-text">"scratchpad"</strong> para razonar sin ejecutar acciones. El modelo invoca el Think Tool, escribe su razonamiento completo, y LUEGO decide que accion tomar. Es como un cirujano que se detiene antes de cortar para revisar mentalmente el plan de cirugia.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-agent-accent font-bold mb-2">Como funciona:</p>
          <ol class="text-sm text-agent-muted space-y-1 list-decimal list-inside">
            <li>El agente recibe una tarea compleja</li>
            <li>En vez de actuar inmediatamente, invoca el Think Tool</li>
            <li>Escribe su razonamiento paso a paso en el scratchpad</li>
            <li>Evalua opciones, chequea restricciones, considera edge cases</li>
            <li>LUEGO procede a actuar con una decision informada</li>
          </ol>
        </div>
        <div>
          <p class="text-sm text-agent-accent font-bold mb-2">Cuando usarlo:</p>
          <ul class="text-sm text-agent-muted space-y-1">
            <li>&#9654; Decisiones con multiples reglas o politicas</li>
            <li>&#9654; Razonamiento multi-paso complejo</li>
            <li>&#9654; Cuando el agente necesita "pensar antes de actuar"</li>
            <li>&#9654; Evaluacion de seguridad pre-ejecucion</li>
            <li>&#9654; Planificacion de tareas con dependencias</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- The 54% data point -->
    <div class="bg-gradient-to-r from-agent-accent/10 to-purple-500/10 border border-agent-accent/30 rounded-lg p-5 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-5xl font-black text-agent-accent">54%</span>
        <div>
          <p class="text-agent-text font-bold">Mejora en tareas de politicas complejas</p>
          <p class="text-xs text-agent-muted">Segun el blog de ingenieria de Anthropic, "The Think Tool"</p>
        </div>
      </div>
      <p class="text-sm text-agent-muted">
        En benchmarks internos, el modelo con Think Tool mejoro un <strong class="text-agent-text">54%</strong> en tareas que requieren adherencia a multiples politicas simultaneas comparado con el baseline sin Think Tool. Esto no es un truco de prompting: es un cambio arquitectonico en como el modelo procesa decisiones complejas.
      </p>
    </div>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># Ejemplo conceptual del Think Tool en accion

## Tarea: El usuario pide "borra todos los archivos .log del proyecto"

## Sin Think Tool:
# El agente ejecuta rm -rf *.log inmediatamente
# Problema: podria borrar archivos criticos de produccion

## Con Think Tool:
# Step 1: El agente invoca think()
# Step 2: Razona:
#   - "El usuario pide borrar .log files"
#   - "Regla de seguridad: nunca borrar sin confirmar"
#   - "Regla de contexto: estamos en directorio de produccion"
#   - "Exception: archivos .log en /tmp/ son seguros de borrar"
#   - "Decision: listar primero, mostrar al usuario, pedir confirmacion"
# Step 3: Ejecuta ls *.log (listado, no borrado)
# Step 4: Presenta la lista al usuario y pregunta</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      La intuicion detras del Think Tool es que los modelos de lenguaje son mejores razonando cuando <strong class="text-agent-text">escriben su razonamiento explicitamente</strong> en vez de hacerlo "en silencio". Es el mismo principio del paper Chain-of-Thought (Wei et al. 2022): pedirle al modelo que piense paso a paso mejora la calidad de la decision final. El Think Tool formaliza este principio como una herramienta del agente.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Confundir el Think Tool con "hacer que el agente sea mas lento". El Think Tool no agrega latencia significativa: el modelo ya esta "pensando" internamente. Lo que cambia es que ese pensamiento se hace <strong class="text-agent-text">explicito y estructurado</strong> en vez de implicito y fragmentado. Es la diferencia entre un piloto que hace el checklist antes de despegar vs uno que "se acuerda de todo mentalmente".</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El Think Tool no genera tokens visibles para el usuario. El razonamiento queda en el scratchpad interno y solo la decision final se comunica. Esto significa que el usuario ve una respuesta limpia sin el "pensamiento en voz alta" del modelo. Es elegante: el agente piensa profundamente pero habla concisamente.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 4: Extended Thinking en Claude Code -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Extended Thinking en Claude Code</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si el Think Tool es el concepto general, <strong class="text-agent-text">extended thinking</strong> es la implementacion de Claude. Cuando esta habilitado, Claude genera un bloque de pensamiento interno (a veces muy largo) antes de producir su respuesta. En Claude Code, esto se traduce en mejores decisiones de arquitectura, debugging mas preciso, y code reviews mas profundos.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como configurarlo</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm"># Opcion 1: Variable de entorno
export MAX_THINKING_TOKENS=10000   # Limita tokens de pensamiento

# Opcion 2: En settings de Claude Code
# Settings > Extended Thinking > Enable

# Opcion 3: API directa (para builders)
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # Presupuesto para pensar
    },
    messages=[{"role": "user", "content": "..."}]
)</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Cuando usar extended thinking</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Ideal para</p>
        <ul class="text-sm text-agent-muted space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Decisiones de arquitectura:</strong> evaluar trade-offs entre patrones, elegir stack, disenar APIs</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Debugging complejo:</strong> trazar flujos de datos, encontrar race conditions, analizar stack traces</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Code review profundo:</strong> analizar seguridad, performance, edge cases, deuda tecnica</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Planificacion de tareas:</strong> descomponer features complejas, ordenar dependencias</span>
          </li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">No necesario para</p>
        <ul class="text-sm text-agent-muted space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Tareas simples:</strong> renombrar una variable, agregar un import, formatear codigo</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Generacion mecanica:</strong> crear un CRUD basico, boilerplate, tests unitarios simples</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Preguntas factuales:</strong> "que hace Array.map?", "cual es la sintaxis de async/await?"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Cuando el costo importa:</strong> para tareas triviales, thinking tokens son gasto innecesario</span>
          </li>
        </ul>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Implicacion de costos</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los tokens de pensamiento se cobran a <strong class="text-agent-text">tarifa de input</strong> (significativamente mas barata que output). Esto es un detalle critico de la economia del extended thinking: pensar mas profundamente es proporcionalmente barato comparado con generar respuestas largas. Es como pagar por la planificacion de un arquitecto (barato) vs pagar por la reconstruccion despues de un error (caro).
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-agent-accent">$3</p>
          <p class="text-xs text-agent-muted">Input (por 1M tokens)</p>
          <p class="text-xs text-agent-accent">= thinking tokens</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-agent-warning">$15</p>
          <p class="text-xs text-agent-muted">Output (por 1M tokens)</p>
          <p class="text-xs text-agent-warning">5x mas caro</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-agent-success">5x</p>
          <p class="text-xs text-agent-muted">Pensar vs Escribir</p>
          <p class="text-xs text-agent-success">Pensar es 5x mas barato</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Extended thinking es la version integrada del Think Tool en Claude Code. No necesitas configurar una herramienta especial: es una capacidad nativa del modelo. La diferencia practica es que el Think Tool es una herramienta que el agente <strong class="text-agent-text">decide invocar</strong> (on-demand), mientras que extended thinking esta <strong class="text-agent-text">siempre activo</strong> cuando se habilita, generando razonamiento en cada turno. Piensa en el Think Tool como "pedir una segunda opinion" y extended thinking como "pensar siempre antes de hablar".</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 5: Chain-of-Thought y ReAct -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Chain-of-Thought y ReAct</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El Think Tool y extended thinking son implementaciones de conceptos mas fundamentales de razonamiento en IA. Los dos patrones mas importantes son <strong class="text-agent-text">Chain-of-Thought (CoT)</strong> y <strong class="text-agent-text">ReAct</strong>. Entenderlos te permite reconocer COMO piensa tu agente y POR QUE toma las decisiones que toma.
    </p>

    <!-- CoT -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Chain-of-Thought (CoT)</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El paper original de Wei et al. (2022) demostro algo sorprendente: si le pides a un LLM que <strong class="text-agent-text">"piense paso a paso"</strong>, la precision en tareas de razonamiento mejora dramaticamente. En tareas de matematicas con GSM8K, paso de 17.7% a 58.1% con solo agregar "Let's think step by step" al prompt.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm"># Sin CoT:
# Pregunta: "Un granjero tiene 15 ovejas. 8 se escapan. Compra 3 mas. Cuantas tiene?"
# Respuesta directa: "10" (el modelo adivina sin razonar)

# Con CoT:
# Pregunta: "Piensa paso a paso: Un granjero tiene 15 ovejas..."
# Paso 1: El granjero empieza con 15 ovejas
# Paso 2: 8 se escapan: 15 - 8 = 7
# Paso 3: Compra 3 mas: 7 + 3 = 10
# Respuesta: 10

# En Claude Code, extended thinking ES CoT automatico.
# No necesitas pedirle "piensa paso a paso": ya lo hace.</pre>`}
    </div>

    <!-- Tree-of-Thought -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Tree-of-Thought (ToT)</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      CoT es un razonamiento <strong class="text-agent-text">lineal</strong>: paso 1, paso 2, paso 3. Pero que pasa cuando hay multiples caminos posibles? Tree-of-Thought explora <strong class="text-agent-text">multiples ramas de razonamiento en paralelo</strong>, evalua cada una, y elige la mejor. Es como un ajedrecista que analiza 3 jugadas posibles antes de mover.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">CoT: lineal</p>
        {@html `<pre class="text-xs text-agent-muted">Problema
  └── Paso 1
       └── Paso 2
            └── Paso 3
                 └── Respuesta</pre>`}
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">ToT: ramificado</p>
        {@html `<pre class="text-xs text-agent-muted">Problema
  ├── Rama A → evaluar → Score: 7/10
  ├── Rama B → evaluar → Score: 9/10 ✓
  └── Rama C → evaluar → Score: 4/10
                 └── Elegir Rama B</pre>`}
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      En la practica, herramientas como Devin y aider usan variantes de ToT cuando necesitan evaluar multiples estrategias para resolver un bug. El agente genera 2-3 hipotesis de causa raiz, evalua la probabilidad de cada una, y prueba la mas prometedora primero. Si falla, retrocede y prueba la siguiente. Esto es <strong class="text-agent-text">backtracking con evaluacion</strong>.
    </p>

    <!-- ReAct -->
    <h3 class="text-lg font-bold text-agent-text mb-3">ReAct: Reasoning + Acting</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El paper de Yao et al. (2022) introdujo el patron que define a los agentes modernos: <strong class="text-agent-text">intercalar razonamiento con acciones reales</strong>. En vez de razonar completamente y luego actuar, el agente alterna entre pensar y ejecutar. Esto le permite ajustar su razonamiento basandose en los resultados reales de cada accion.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm"># El patron ReAct en accion (Claude Code debugging):

# Thought: "El test falla con 'undefined is not a function'.
#           Necesito ver el archivo que causa el error."
# Action:  Read(src/auth/middleware.ts)
# Observation: El archivo importa 'verifyToken' de './jwt.ts'

# Thought: "El import existe. El error sugiere que la funcion
#           no se exporta correctamente. Verifico el archivo fuente."
# Action:  Read(src/auth/jwt.ts)
# Observation: La funcion se llama 'validateToken', no 'verifyToken'

# Thought: "Encontre el bug: nombre incorrecto en el import.
#           Debo cambiar 'verifyToken' a 'validateToken'."
# Action:  Edit(src/auth/middleware.ts, ...)
# Observation: Archivo editado correctamente

# Thought: "Verifico que el test pasa ahora."
# Action:  Bash(npm test)
# Observation: All tests passed ✓</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Esto es <strong class="text-agent-text">exactamente</strong> el agent loop de Claude Code. Cada turno sigue el patron: <strong class="text-agent-text">Thought</strong> (razonar sobre que hacer), <strong class="text-agent-text">Action</strong> (ejecutar una herramienta: Read, Write, Bash, etc.), <strong class="text-agent-text">Observation</strong> (procesar el resultado), y luego <strong class="text-agent-text">Thought</strong> de nuevo para decidir el siguiente paso. Claude Code no es un sistema propietario misterioso: es una implementacion sofisticada de ReAct con herramientas especializadas.
    </p>

    <!-- Comparison table -->
    <div class="overflow-x-auto mb-4">
      <table class="w-full text-sm text-left border border-agent-border rounded-lg overflow-hidden">
        <thead class="bg-agent-dark text-agent-accent">
          <tr>
            <th class="py-3 px-4">Patron</th>
            <th class="py-3 px-4">Mecanismo</th>
            <th class="py-3 px-4">Fortaleza</th>
            <th class="py-3 px-4">En Claude Code</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-agent-border bg-agent-card">
          <tr>
            <td class="py-2 px-4 text-agent-text font-medium">CoT</td>
            <td class="py-2 px-4 text-agent-muted">Razonamiento lineal paso a paso</td>
            <td class="py-2 px-4 text-agent-muted">Logica, matematicas, planificacion</td>
            <td class="py-2 px-4 text-agent-muted">Extended Thinking</td>
          </tr>
          <tr>
            <td class="py-2 px-4 text-agent-text font-medium">ToT</td>
            <td class="py-2 px-4 text-agent-muted">Explorar multiples ramas, evaluar, elegir</td>
            <td class="py-2 px-4 text-agent-muted">Decisiones con alternativas</td>
            <td class="py-2 px-4 text-agent-muted">Dentro de extended thinking</td>
          </tr>
          <tr>
            <td class="py-2 px-4 text-agent-text font-medium">ReAct</td>
            <td class="py-2 px-4 text-agent-muted">Think &#8594; Act &#8594; Observe &#8594; Repeat</td>
            <td class="py-2 px-4 text-agent-muted">Tareas con herramientas reales</td>
            <td class="py-2 px-4 text-agent-muted">El agent loop completo</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Cuando Claude Code resuelve un bug, puedes observar ReAct en tiempo real en la terminal. Cada linea que ves es una fase del patron: primero Claude razona ("voy a leer el archivo de error"), luego ejecuta (Read tool), luego observa el resultado, y razona de nuevo ("el problema esta en la linea 42, el import es incorrecto"). Entender ReAct te permite <strong class="text-agent-text">predecir que hara el agente</strong> y darle mejor contexto cuando se atasca.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 6: Compaction vs /clear vs Sub-agents -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Compaction vs /clear vs Sub-agents</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La gestion del context window es uno de los problemas mas pragmaticos al trabajar con agentes. Tu conversacion crece con cada interaccion: cada archivo leido, cada comando ejecutado, cada respuesta. Eventualmente, el contexto se llena. Tienes tres herramientas para manejar esto, y elegir la correcta depende de la situacion.
    </p>

    <!-- Three strategies -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-agent-card border border-agent-danger/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x1F9F9;</span>
          <h3 class="text-agent-danger font-bold">/clear</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Borra <strong class="text-agent-text">todo</strong> el contexto de la sesion. Empieza desde cero. Solo se mantienen las capas persistentes (CLAUDE.md, Auto Memory).
        </p>
        <p class="text-xs text-agent-accent font-bold mb-1">Usa cuando:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#9654; Cambias completamente de tarea</li>
          <li>&#9654; El contexto actual es irrelevante</li>
          <li>&#9654; Quieres optimizar costos agresivamente</li>
        </ul>
        <p class="text-xs text-agent-danger mt-2 italic">Pierdes TODO el contexto de la sesion.</p>
      </div>

      <div class="bg-agent-card border border-agent-warning/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x1F4E6;</span>
          <h3 class="text-agent-warning font-bold">/compact</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Resume el contexto preservando <strong class="text-agent-text">decisiones y progreso</strong>. Libera tokens sin perder continuidad. El agente "recuerda" lo importante.
        </p>
        <p class="text-xs text-agent-accent font-bold mb-1">Usa cuando:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#9654; El contexto esta creciendo (70%+) pero necesitas continuidad</li>
          <li>&#9654; Quieres seguir con la misma tarea</li>
          <li>&#9654; Has tomado decisiones que no quieres perder</li>
        </ul>
        <p class="text-xs text-agent-warning mt-2 italic">Pierde detalles pero mantiene lo esencial.</p>
      </div>

      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">&#x1F916;</span>
          <h3 class="text-agent-accent font-bold">Sub-agents</h3>
        </div>
        <p class="text-sm text-agent-muted mb-3">
          Lanza un agente hijo con <strong class="text-agent-text">contexto propio y limpio</strong>. Investiga, analiza, y retorna un resumen al agente principal.
        </p>
        <p class="text-xs text-agent-accent font-bold mb-1">Usa cuando:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#9654; Necesitas investigar algo sin contaminar tu contexto</li>
          <li>&#9654; La tarea de investigacion es independiente</li>
          <li>&#9654; Quieres paralelizar (Agent Teams)</li>
        </ul>
        <p class="text-xs text-agent-accent mt-2 italic">Tu contexto se mantiene intacto.</p>
      </div>
    </div>

    <!-- The 39% data point -->
    <div class="bg-gradient-to-r from-agent-success/10 to-agent-accent/10 border border-agent-success/30 rounded-lg p-5 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-5xl font-black text-agent-success">39%</span>
        <div>
          <p class="text-agent-text font-bold">Mejora con memory + context editing</p>
          <p class="text-xs text-agent-muted">Paper de Anthropic: "Effective Harnesses for Long-Running Agents"</p>
        </div>
      </div>
      <p class="text-sm text-agent-muted">
        Agentes que combinan <strong class="text-agent-text">memoria persistente</strong> (guardar decisiones entre sesiones) con <strong class="text-agent-text">edicion activa del contexto</strong> (compaction, note-taking, sub-agents) logran un <strong class="text-agent-text">39% de mejora</strong> en tareas de larga duracion comparado con agentes que simplemente dejan que el contexto crezca sin gestionarlo.
      </p>
    </div>

    <!-- Decision tree -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Arbol de decision</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">¿Cambias de tarea completamente?
  ├── SI → /clear (contexto limpio, ahorra costos)
  └── NO → ¿El contexto esta al 70%+?
              ├── SI → ¿Necesitas continuidad?
              │         ├── SI → /compact (resume, preserva decisiones)
              │         └── NO → /clear (mas barato que compact)
              └── NO → Sigue trabajando normalmente
                        ¿Necesitas investigar algo paralelo?
                        ├── SI → Sub-agent (contexto aislado)
                        └── NO → Todo bien, sigue</pre>`}
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Las tres estrategias no compiten: <strong class="text-agent-text">se complementan</strong>. Un flujo profesional usa /clear al cambiar de tarea, /compact cuando una tarea larga consume demasiado contexto, y sub-agents para investigacion paralela. El equipo de incident.io reporto que manejan 4-7 agentes concurrentes con git worktrees, donde cada agente usa /clear agresivamente para mantener contextos limpios y costos bajos.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- Section 7: Diseno de un Sistema de Memoria -->
  <!-- ================================================================ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">7. Diseno de un Sistema de Memoria</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ya entiendes los tipos de memoria y las capas de Claude Code. Ahora la pregunta practica: si estas diseñando un agente (o configurando Claude Code para tu equipo), <strong class="text-agent-text">que guardar, donde, y en que formato</strong>? Estas son las directrices basadas en la evidencia del paper de harnesses de Anthropic y la experiencia de equipos en produccion.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Que guardar vs que NO guardar</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">GUARDAR</p>
        <ul class="text-sm text-agent-muted space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Decisiones arquitectonicas:</strong> "elegimos PostgreSQL porque necesitamos ACID"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Bug fixes con causa raiz:</strong> "el auth fallo porque el token expiraba sin refresh"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Patrones del equipo:</strong> "siempre usamos repository pattern para data access"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-success shrink-0">&#10003;</span>
            <span><strong class="text-agent-text">Preferencias del usuario:</strong> "prefiere vitest, conventional commits, TypeScript strict"</span>
          </li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">NO GUARDAR</p>
        <ul class="text-sm text-agent-muted space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Estado temporal:</strong> "estoy en medio de refactorizar el archivo X"</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Trabajo en progreso:</strong> especulaciones no verificadas, hipotesis descartadas</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Contenido de archivos:</strong> no guardes el contenido de un archivo; guardalo en disco</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-agent-danger shrink-0">&#10007;</span>
            <span><strong class="text-agent-text">Conclusiones prematuras:</strong> "creo que el bug es en X" (verificalo primero)</span>
          </li>
        </ul>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Formato estructurado: What / Why / Where / Learned</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La evidencia muestra que la memoria estructurada es significativamente mas util que texto libre. Un formato probado es el <strong class="text-agent-text">What/Why/Where/Learned</strong> que usa Hoofy (el MCP server que estudiamos en el modulo 6):
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm"># Ejemplo de observacion de memoria bien estructurada:

**What**: Implementamos rate limiting con Redis sliding window
**Why**: El endpoint de /api/search recibia 500 req/s en picos,
         degradando la DB. Fixed con sliding window de 100 req/min.
**Where**: src/middleware/rateLimiter.ts, redis config en .env
**Learned**: sliding window es mejor que fixed window para APIs
             con trafico irregular. Token bucket era overkill para
             nuestro caso.</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Este formato funciona porque es <strong class="text-agent-text">buscable</strong> (puedes buscar por "rate limiting" o "Redis" y encontrarlo), <strong class="text-agent-text">contextual</strong> (sabes el por que, no solo el que), y <strong class="text-agent-text">accionable</strong> (incluye la leccion aprendida, no solo el hecho).
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Topic keys: evitar duplicados en decisiones que evolucionan</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Algunas decisiones no son estaticas: evolucionan con el tiempo. Por ejemplo, la decision de que ORM usar puede cambiar de "Prisma" a "Drizzle" cuando descubres limitaciones. Si guardas cada version como una observacion separada, terminas con memoria duplicada y contradictoria. La solucion es <strong class="text-agent-text">topic keys</strong>: un identificador estable que permite actualizar (upsert) la misma observacion en vez de crear una nueva.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm"># Sin topic key (problema: duplicados):
[2024-01-15] "Elegimos Prisma como ORM"
[2024-02-20] "Migramos a Drizzle, Prisma era lento con joins"
# → Ahora la memoria dice AMBAS cosas. Confusion.

# Con topic key (solucion: upsert):
topic_key: "architecture/orm-choice"
[2024-02-20] "Usamos Drizzle como ORM (antes Prisma,
              migrado por performance en joins complejos)"
# → Una sola observacion actualizada. Claridad.</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El protocolo de memoria de Hoofy (que vimos en el modulo 6) implementa exactamente este patron. Antes de guardar una observacion, sugiere un topic_key estable (por ejemplo, "architecture/auth-model" o "pattern/error-handling"). Si ya existe una observacion con ese topic key, la actualiza en vez de crear una nueva. Esto mantiene la memoria limpia, sin duplicados, y con la informacion mas reciente. Es la diferencia entre un wiki bien mantenido y una pila de sticky notes.</p>
    </div>
  </section>

  <!-- ================================================================ -->
  <!-- InteractiveFlow -->
  <!-- ================================================================ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Jerarquia de Memoria de Claude Code</h2>
      {#if !showFlow}
        <button onclick={() => showFlow = true} class="btn-primary text-xs">
          Explorar jerarquia
        </button>
      {/if}
    </div>
    {#if showFlow}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Las 6 Capas de Memoria de Claude Code"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ================================================================ -->
  <!-- Quiz -->
  <!-- ================================================================ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Memoria, Planning y Razonamiento</h2>
      {#if !showQuiz}
        <button onclick={() => showQuiz = true} class="btn-primary text-xs">
          Iniciar quiz
        </button>
      {/if}
    </div>
    {#if showQuiz}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- ================================================================ -->
  <!-- Completion -->
  <!-- ================================================================ -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">&#x1F9E0;</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Dominas la memoria, el razonamiento y la jerarquia de contexto de Claude Code.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
