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

  const MODULE_ID = 6;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let showQuiz = $state(false);
  let showFlow = $state(false);

  courseStore.startModule(MODULE_ID);

  // ─── InteractiveFlow: Agent SDK Architecture ───
  const flowNodes = [
    { id: 'user', label: 'Request', description: 'Una peticion llega al sistema: puede ser un usuario humano, un webhook, una tarea programada, o incluso otro agente. El request incluye la tarea a resolver y cualquier contexto inicial relevante.', icon: '\u{1F4E8}', x: 8, y: 50 },
    { id: 'agent', label: 'Agent', description: 'El nodo central del Agent SDK. Un Agent combina tres cosas: el modelo LLM a usar, las instrucciones (system prompt), y las herramientas disponibles. Es la primitiva principal del SDK. Se define con Agent(model, instructions, tools).', icon: '\u{1F916}', x: 22, y: 50 },
    { id: 'gather', label: 'Gather Context', description: 'Fase 1 del ciclo: el agente lee archivos, busca codigo, consulta documentacion, revisa el estado del sistema. El objetivo es ENTENDER el problema antes de actuar. Un agente que actua sin contexto comete errores evitables.', icon: '\u{1F50D}', x: 38, y: 25 },
    { id: 'action', label: 'Take Action', description: 'Fase 2: el agente ejecuta herramientas para realizar cambios. Cada Tool es una funcion externa con nombre, descripcion y JSON Schema de parametros. El LLM genera la llamada; el SDK ejecuta la funcion real y devuelve el resultado.', icon: '\u26A1', x: 55, y: 25 },
    { id: 'verify', label: 'Verify', description: 'Fase 3: el agente verifica que su accion fue correcta. Corre tests, revisa output, valida que no rompio nada. Esta fase es lo que separa un agente profesional de uno que "escribe codigo y reza". Sin verificacion, los errores se acumulan.', icon: '\u2705', x: 72, y: 25 },
    { id: 'iterate', label: 'Iterate', description: 'Fase 4: si la verificacion falla, el agente vuelve a Gather Context con nueva informacion (el error). Este loop feedback es el corazon del Agent SDK. Continua hasta que la verificacion pasa o se alcanza un limite de iteraciones.', icon: '\u{1F504}', x: 55, y: 70 },
    { id: 'handoff', label: 'Handoff', description: 'Primitiva del SDK que permite transferir control a otro agente especializado. El agente actual pasa contexto relevante (no todo el historial) al agente destino. Ejemplo: un agente de triage transfiere a un agente de debugging.', icon: '\u{1F91D}', x: 38, y: 75 },
    { id: 'guardrail', label: 'Guardrail', description: 'Primitiva de validacion que se ejecuta en paralelo con el agente. Verifica inputs (prompt injection?) y outputs (datos sensibles? formato correcto?). Si un guardrail falla, puede bloquear la accion ANTES de que se ejecute.', icon: '\u{1F6E1}\uFE0F', x: 22, y: 25 },
    { id: 'result', label: 'Resultado', description: 'El agente completo su tarea: la verificacion paso, no quedan acciones pendientes. Se devuelve el resultado al solicitante. El SDK registra metricas: tokens usados, herramientas invocadas, iteraciones del loop, tiempo total.', icon: '\u{1F3C1}', x: 92, y: 50 }
  ];

  const flowEdges = [
    { from: 'user', to: 'agent', label: 'Tarea' },
    { from: 'agent', to: 'gather', label: 'Fase 1' },
    { from: 'agent', to: 'guardrail', label: 'Validar' },
    { from: 'guardrail', to: 'gather' },
    { from: 'gather', to: 'action', label: 'Fase 2' },
    { from: 'action', to: 'verify', label: 'Fase 3' },
    { from: 'verify', to: 'result', label: 'OK' },
    { from: 'verify', to: 'iterate', label: 'Fallo' },
    { from: 'iterate', to: 'gather', label: 'Retry' },
    { from: 'iterate', to: 'handoff', label: 'Delegar' },
    { from: 'handoff', to: 'agent', label: 'Otro agente' }
  ];

  const flowChallenges = [
    { question: 'Que primitiva del Agent SDK permite que un agente transfiera control a otro agente especializado?', targetNodeId: 'handoff', hint: 'Es el mecanismo de delegacion entre agentes, pasa contexto relevante al destino.' },
    { question: 'Que fase del ciclo determina si el agente debe seguir iterando o devolver el resultado?', targetNodeId: 'verify', hint: 'Es la fase que corre tests y valida la salida antes de considerar la tarea completa.' },
    { question: 'Que componente valida inputs y outputs en paralelo con el agente para bloquear acciones peligrosas?', targetNodeId: 'guardrail', hint: 'Funciona como un sistema de seguridad que intercepta antes de ejecutar.' },
    { question: 'A donde vuelve el agente cuando la verificacion falla y necesita mas informacion?', targetNodeId: 'gather', hint: 'Es la primera fase del ciclo, donde el agente lee y entiende el problema.' }
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'El Claude Agent SDK tiene 4 primitivas fundamentales. Si necesitas que un agente de triage transfiera un bug report a un agente de debugging especializado, cual primitiva usas?',
      options: [
        { text: 'Tool: defines una herramienta que ejecuta el agente de debugging', correct: false, explanation: 'Un Tool ejecuta una funcion externa y devuelve un resultado. No transfiere control ni contexto conversacional a otro agente. El agente de triage seguiria activo.' },
        { text: 'Handoff: transfiere control y contexto relevante al agente de debugging', correct: true, explanation: 'Correcto! Handoff es la primitiva de delegacion del Agent SDK. Transfiere el control al agente destino pasando contexto relevante (no todo el historial). El agente de triage "sale de escena" y el de debugging toma el mando.' },
        { text: 'Guardrail: valida que el bug report sea legitimo antes de procesarlo', correct: false, explanation: 'Los Guardrails validan inputs/outputs pero no transfieren control entre agentes. Son un mecanismo de seguridad, no de delegacion.' },
        { text: 'Agent: creas un nuevo Agent con las instrucciones del debugger', correct: false, explanation: 'Crear un Agent define su configuracion (modelo, tools, instrucciones), pero no maneja la transferencia de control ni el paso de contexto desde otro agente. Necesitas Handoff para eso.' }
      ],
      source: 'Anthropic - Building Agents with Claude Agent SDK',
      sourceUrl: 'https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk'
    },
    {
      question: 'Observa este agentic loop. Cual es el problema CRITICO?',
      codeBlock: `while True:
    response = llm.generate(messages, tools)
    messages.append(response.message)
    if response.tool_call:
        result = execute_tool(response.tool_call)
        messages.append(tool_result(result))
    else:
        return response.text`,
      options: [
        { text: 'Falta un limite de iteraciones (max_iterations) y un presupuesto de tokens para evitar loops infinitos y costos descontrolados', correct: true, explanation: 'Correcto! Un while True sin stop conditions es una bomba de tiempo. Si el agente entra en un loop donde siempre hace tool_calls (ej: busca un archivo que no existe y reintenta eternamente), consumira tokens infinitamente. Siempre necesitas: max_iterations, token_budget, y/o timeout.' },
        { text: 'Falta agregar la respuesta del asistente al historial', correct: false, explanation: 'El codigo SI agrega la respuesta: messages.append(response.message) esta en la linea 3.' },
        { text: 'Falta validar los parametros del tool_call contra el JSON Schema', correct: false, explanation: 'La validacion de parametros es buena practica, pero no es el problema CRITICO. Sin ella el agente puede tener errores; sin stop conditions puede gastar miles de dolares.' },
        { text: 'El else deberia lanzar una excepcion en vez de retornar', correct: false, explanation: 'Retornar el texto cuando no hay tool_calls es el comportamiento correcto. Es la stop condition natural del loop.' }
      ]
    },
    {
      question: 'Estas construyendo un MCP server que expone una herramienta de busqueda. Cual es el elemento MAS importante de la definicion del tool?',
      options: [
        { text: 'El nombre: debe ser corto y tecnico para ahorrar tokens', correct: false, explanation: 'Un nombre corto y críptico como "s" o "qry" no le dice al LLM cuando usar la herramienta ni que hace. Los tokens ahorrados en el nombre causan errores de seleccion que cuestan mucho mas.' },
        { text: 'La descripcion: debe explicar que hace, cuando usarla, que retorna, y cuando NO usarla', correct: true, explanation: 'Correcto! Anthropic llama a esto "prompt engineering your tools". La descripcion es lo que el LLM lee para decidir si usar la herramienta. Debe incluir: que hace, cuando es apropiada, que formato tiene la respuesta, y edge cases. Una buena descripcion reduce errores dramaticamente.' },
        { text: 'El input schema: debe tener tipos estrictos con validaciones complejas', correct: false, explanation: 'El input schema es importante para validar parametros, pero sin una buena descripcion el LLM ni siquiera sabra cuando usar la herramienta o que parametros pasar. La descripcion es mas critica.' },
        { text: 'El handler: debe ser extremadamente rapido para minimizar latencia', correct: false, explanation: 'La velocidad del handler importa, pero si la definicion es mala, el LLM llamara la herramienta equivocada o con parametros incorrectos. De nada sirve un handler rapido si nunca se invoca correctamente.' }
      ],
      source: 'Anthropic - Writing Effective Tools for Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/writing-tools-for-agents'
    },
    {
      question: 'Hoofy usa un Bridge Pattern para separar el protocolo MCP de la logica de negocio. Cual es la ventaja PRINCIPAL de este patron?',
      options: [
        { text: 'Permite ejecutar el servidor mas rapido porque hay menos capas', correct: false, explanation: 'El Bridge Pattern anade una capa de abstraccion, no las reduce. Su ventaja no es rendimiento sino mantenibilidad y testabilidad.' },
        { text: 'Puedes testear la logica de negocio sin necesitar un cliente MCP, y cambiar el protocolo sin tocar el dominio', correct: true, explanation: 'Correcto! El Bridge separa "como llegan las peticiones" (MCP, HTTP, CLI) de "que hacen" (guardar observacion, buscar memoria, crear pipeline). Puedes testear toda la logica de negocio con unit tests simples, sin montar un servidor MCP. Y si manana cambias de protocolo, la logica no se toca.' },
        { text: 'Reduce la cantidad de codigo porque todo esta en un solo archivo', correct: false, explanation: 'Al contrario, el Bridge Pattern distribuye el codigo en multiples capas. La ventaja es la separacion de responsabilidades, no la reduccion de codigo.' },
        { text: 'Es el unico patron que funciona con MCP', correct: false, explanation: 'MCP funciona con cualquier arquitectura. El Bridge es una decision de diseno, no un requisito del protocolo.' }
      ]
    },
    {
      question: 'Un colega quiere construir un bot de Slack que responda preguntas sobre la codebase usando Claude. Que herramienta le recomiendas?',
      options: [
        { text: 'Claude Code directo: ya tiene todas las herramientas para leer codigo y responder', correct: false, explanation: 'Claude Code es un agente interactivo de terminal/IDE. No esta disenado para ser embebido en un bot de Slack. No tiene API para integracion con servicios de mensajeria.' },
        { text: 'Un MCP server que le de a Claude Code acceso a Slack', correct: false, explanation: 'Un MCP server amplía las herramientas de Claude Code, pero el problema no es darle acceso a Slack sino construir un producto que VIVA en Slack. Claude Code sigue siendo un agente de terminal.' },
        { text: 'Claude Agent SDK: construye un agente custom con tools de busqueda de codigo y la API de Slack como interfaz', correct: true, explanation: 'Correcto! El Agent SDK es para construir PRODUCTOS que embeben agentes. Defines un Agent con tools de busqueda de codigo (grep, read_file), lo conectas a la API de Slack como interfaz, y tienes un bot custom. El SDK da control total sobre el loop, las tools, y la integracion.' },
        { text: 'La API de Claude directa sin ningun SDK: es mas simple', correct: false, explanation: 'La API directa requiere que implementes el agentic loop manualmente: iteraciones, tool execution, error handling, stop conditions. El Agent SDK ya resuelve todo esto. Usarlo es mas simple, no mas complejo.' }
      ]
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow does not trigger badge, just tracks engagement
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    const badge = courseStore.unlockBadge('agent-builder');
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

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 1: El Ciclo de 4 Fases del Agente          -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. El Ciclo de 4 Fases del Agente</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      En el modulo anterior vimos el agentic loop basico: recibir input, llamar al LLM, ejecutar tools, repetir. Pero Anthropic, al construir el Claude Agent SDK, descubrio que los agentes efectivos siguen un patron mas especifico con <strong class="text-agent-text">4 fases claramente diferenciadas</strong>. Este ciclo es la base de todo agente bien construido.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F50D;</span>
          <p class="text-agent-accent font-bold">Fase 1: Gather Context</p>
        </div>
        <p class="text-sm text-agent-muted">Lee archivos, busca codigo, consulta documentacion. El agente necesita <strong class="text-agent-text">entender el problema</strong> antes de actuar. Si actua sin contexto, comete errores costosos que despues tiene que deshacer.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: un cirujano lee el expediente ANTES de operar</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x26A1;</span>
          <p class="text-agent-accent font-bold">Fase 2: Take Action</p>
        </div>
        <p class="text-sm text-agent-muted">Ejecuta herramientas para realizar cambios: edita archivos, ejecuta comandos, crea recursos. Cada accion esta <strong class="text-agent-text">informada por el contexto</strong> recopilado en la fase anterior.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: el cirujano opera con plan claro</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x2705;</span>
          <p class="text-agent-accent font-bold">Fase 3: Verify</p>
        </div>
        <p class="text-sm text-agent-muted">Corre tests, revisa output, valida resultados. Esta fase es lo que separa agentes profesionales de agentes "escribe y reza". <strong class="text-agent-text">Sin verificacion, los errores se acumulan</strong> silenciosamente.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: el cirujano verifica signos vitales</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F504;</span>
          <p class="text-agent-accent font-bold">Fase 4: Iterate</p>
        </div>
        <p class="text-sm text-agent-muted">Si la verificacion falla, el agente <strong class="text-agent-text">vuelve a Gather Context</strong> con nueva informacion (el error, el test fallido). Este loop de feedback es lo que hace que el agente se autocorrija.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: ajusta la estrategia con datos nuevos</p>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La fase mas descuidada es <strong class="text-agent-text">Verify</strong>. Muchos desarrolladores construyen agentes que generan codigo pero nunca lo testean. El resultado: errores que se propagan. Anthropic descubrio que forzar la verificacion despues de cada accion mejora drasticamente la calidad del output. Es la diferencia entre "funciona a veces" y "funciona consistentemente".</p>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Este ciclo de 4 fases no es exclusivo del Agent SDK. Claude Code lo implementa internamente: cuando le pides "arregla este bug", primero lee archivos (Gather), luego edita codigo (Action), despues corre tests (Verify), y si fallan, analiza el error y reintenta (Iterate). La diferencia con el Agent SDK es que tu <strong class="text-agent-text">controlas explicitamente cada fase</strong>.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Segun Anthropic, los agentes que incluyen la fase de verificacion resuelven tareas de codigo con <strong class="text-agent-text">significativamente menos errores acumulados</strong> que los que actuan sin verificar. El patron "actua, verifica, corrige" es tan efectivo que esta integrado como comportamiento por defecto en Claude Code: despues de editar un archivo, el agente automaticamente corre linting y tests si estan configurados.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El ciclo visualizado</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Las 4 fases en un bug fix real</p>
      {@html `<pre class="code-block text-xs">
## Tarea: "Arregla el error de autenticacion en /api/login"

GATHER CONTEXT:
  ├── read_file("src/auth/login.py")          # Leer el codigo actual
  ├── read_file("tests/test_auth.py")          # Leer los tests existentes
  ├── search_code("JWT", "src/")               # Buscar donde se genera el JWT
  └── read_file("src/config/settings.py")      # Revisar configuracion de auth

TAKE ACTION:
  ├── edit_file("src/auth/login.py", ...)      # Corregir la validacion del token
  └── edit_file("src/auth/middleware.py", ...)  # Actualizar el middleware

VERIFY:
  ├── run_tests("tests/test_auth.py")          # Correr tests de auth
  └── run_linter("src/auth/")                  # Verificar codigo limpio

ITERATE (si test fallo):
  ├── read_file(test_output)                   # Leer QUE fallo
  ├── gather_context(error_trace)              # Entender POR QUE fallo
  └── → volver a TAKE ACTION con nueva info    # Corregir y reintentar</pre>`}
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 2: Claude Agent SDK                         -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Claude Agent SDK</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El Claude Agent SDK es el kit oficial de Anthropic para construir agentes programaticos. Si Claude Code es un agente <strong class="text-agent-text">listo para usar</strong>, el Agent SDK es el conjunto de piezas para <strong class="text-agent-text">construir tu propio agente</strong>. Disponible en Python y TypeScript, se estructura alrededor de 4 primitivas.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-card border border-agent-border rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F916;</span>
          <p class="text-agent-accent font-bold text-sm">Agent</p>
        </div>
        <p class="text-sm text-agent-muted">La primitiva central. Combina un modelo LLM, instrucciones (system prompt), y herramientas disponibles. Un Agent es la unidad minima que puede razonar y actuar.</p>
        {@html `<pre class="code-block text-xs mt-3">agent = Agent(
    model="claude-sonnet-4-20250514",
    instructions="Eres un code reviewer...",
    tools=[search_code, read_file, write_review]
)</pre>`}
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F527;</span>
          <p class="text-agent-accent font-bold text-sm">Tool</p>
        </div>
        <p class="text-sm text-agent-muted">Una funcion externa que el agente puede invocar. Tiene nombre, descripcion (que el LLM lee para decidir cuando usarla), y un handler que ejecuta la logica real.</p>
        {@html `<pre class="code-block text-xs mt-3">@tool
def search_code(query: str, path: str) -> str:
    """Busca texto en el codigo fuente.
    Retorna matches con archivo y linea."""
    return grep(query, path)</pre>`}
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F91D;</span>
          <p class="text-agent-accent font-bold text-sm">Handoff</p>
        </div>
        <p class="text-sm text-agent-muted">Transfiere control de un agente a otro, pasando contexto relevante. Permite construir sistemas multi-agente donde cada agente se especializa en un dominio.</p>
        {@html `<pre class="code-block text-xs mt-3">triage = Agent(
    tools=[handoff_to_debugger,
           handoff_to_reviewer]
)
# El agente de triage decide A QUIEN
# delegar segun el tipo de tarea</pre>`}
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F6E1;&#xFE0F;</span>
          <p class="text-agent-accent font-bold text-sm">Guardrail</p>
        </div>
        <p class="text-sm text-agent-muted">Validacion que se ejecuta en paralelo con el agente. Verifica inputs (prompt injection?) y outputs (datos sensibles?). Si falla, bloquea la accion.</p>
        {@html `<pre class="code-block text-xs mt-3">@guardrail
def check_no_secrets(output: str) -> bool:
    """Bloquea respuestas que contengan
    tokens, passwords o API keys."""
    patterns = [r"sk-[a-z0-9]+", ...]
    return not any(re.search(p, output))</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Creando tu primer agente con el SDK</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Con estas 4 primitivas, puedes construir un agente completo en sorprendentemente pocas lineas. Veamos el esqueleto basico:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Agente con Agent SDK (pseudocodigo Python)</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">from agent_sdk import Agent, Tool, Guardrail, Runner

# 1. Definir herramientas
@Tool
def read_file(path: str) -> str:
    """Lee un archivo del proyecto. Retorna el contenido completo.
    Usar para entender codigo existente antes de hacer cambios."""
    with open(path) as f:
        return f.read()

@Tool
def run_tests(test_path: str) -> str:
    """Ejecuta tests con pytest. Retorna output con pass/fail.
    Usar despues de hacer cambios para verificar que no rompiste nada."""
    return subprocess.run(["pytest", test_path], capture_output=True)

# 2. Definir guardrails
@Guardrail
def no_production_writes(tool_call):
    """Bloquea escrituras a archivos en /prod/"""
    if tool_call.name == "write_file" and "/prod/" in tool_call.args["path"]:
        return {"blocked": True, "reason": "No se permite escribir en /prod/"}

# 3. Crear el agente
agent = Agent(
    model="claude-sonnet-4-20250514",
    instructions="""Eres un agente de debugging. Sigue este ciclo:
    1. GATHER: Lee el archivo con el error y los tests relacionados
    2. ACTION: Corrige el bug
    3. VERIFY: Corre los tests
    4. ITERATE: Si fallan, analiza por que y reintenta""",
    tools=[read_file, write_file, run_tests, search_code],
    guardrails=[no_production_writes]
)

# 4. Ejecutar
result = Runner.run(agent, "Arregla el bug en src/auth/login.py")</pre>`}
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Muchos desarrolladores definen herramientas con descripciones vagas como <code class="text-agent-accent text-xs">@Tool def search(q)</code> sin explicar que busca, donde busca, ni que retorna. El LLM <strong class="text-agent-text">lee la descripcion para decidir cuando usarla</strong>. Una descripcion pobre genera llamadas incorrectas. Siempre incluye: que hace, cuando usarla, y que formato tiene la respuesta.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Agent SDK vs OpenAI Agents SDK</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Ambos SDKs siguen un modelo similar, lo que refleja una convergencia en la industria sobre como estructurar agentes:
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Concepto</th>
              <th class="text-left text-agent-text py-2 pr-4">Claude Agent SDK</th>
              <th class="text-left text-agent-text py-2">OpenAI Agents SDK</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Agente</td><td class="py-2 pr-4">Agent(model, instructions, tools)</td><td class="py-2">Agent(model, instructions, tools)</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Herramientas</td><td class="py-2 pr-4">@Tool decorator</td><td class="py-2">@function_tool decorator</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Delegacion</td><td class="py-2 pr-4">Handoff (primitiva nativa)</td><td class="py-2">handoff() helper</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Seguridad</td><td class="py-2 pr-4">Guardrail (primitiva nativa)</td><td class="py-2">Guardrail (input/output)</td></tr>
            <tr><td class="py-2 pr-4 font-medium">Ejecucion</td><td class="py-2 pr-4">Runner.run(agent, input)</td><td class="py-2">Runner.run(agent, input)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="text-agent-muted leading-relaxed">
      La similitud no es coincidencia: ambas companias convergieron en las mismas abstracciones porque el problema subyacente es el mismo. Un agente necesita: un cerebro (LLM + instrucciones), manos (herramientas), la capacidad de delegar, y un sistema de seguridad. El SDK que elijas depende del modelo que prefieras, no de la arquitectura.
    </p>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 3: Construir un MCP Server                  -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Construir un MCP Server</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si el Agent SDK es para construir agentes, un MCP server es para <strong class="text-agent-text">ampliar las capacidades de agentes existentes</strong>. En vez de construir un agente desde cero, le das nuevas herramientas a Claude Code u otro cliente MCP. Es como instalar un plugin: el agente sigue siendo el mismo, pero ahora puede hacer cosas nuevas.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anatomia de un MCP Server</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un MCP server tiene una estructura sorprendentemente simple. Son solo tres piezas: la definicion del servidor, el registro de herramientas, y las funciones handler que implementan cada herramienta.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Estructura basica de un MCP server (pseudocodigo)</p>
      {@html `<pre class="code-block text-agent-highlight text-sm"># ─── 1. Definir el servidor ───
server = MCPServer(
    name="mi-mcp-server",
    version="1.0.0"
)

# ─── 2. Registrar herramientas ───
@server.tool(
    name="search_documentation",
    description="""Busca en la documentacion del proyecto por palabras clave.
    Retorna los 5 fragmentos mas relevantes con path y numero de linea.
    Usar cuando necesites entender como funciona una feature existente.""",
    input_schema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Palabras clave de busqueda"
            },
            "max_results": {
                "type": "integer",
                "default": 5,
                "description": "Maximo de resultados a retornar"
            }
        },
        "required": ["query"]
    }
)
async def search_docs(query: str, max_results: int = 5):
    """Handler: ejecuta la logica real de busqueda."""
    results = index.search(query, limit=max_results)
    return format_results(results)

# ─── 3. Iniciar con transporte ───
server.run(transport="stdio")  # Local: Claude Code lo ejecuta
# server.run(transport="http", port=8080)  # Remoto: cloud</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Los dos transportes</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x1F4BB; stdio (local)</p>
        <p class="text-sm text-agent-muted mb-2">El cliente MCP (Claude Code) ejecuta el servidor como un proceso hijo y se comunica via stdin/stdout. Es el mas comun para herramientas de desarrollo.</p>
        {@html `<pre class="code-block text-xs mt-2">// En .claude/settings.json
{
  "mcpServers": {
    "mi-server": {
      "command": "node",
      "args": ["./mcp-server/index.js"]
    }
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-text">Pros:</strong> Sin red, sin autenticacion, rapido. <strong class="text-agent-text">Contras:</strong> Solo local.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x1F310; HTTP (remoto)</p>
        <p class="text-sm text-agent-muted mb-2">El servidor corre como un servicio independiente y se comunica via HTTP. Para servidores compartidos en la nube accesibles por multiples usuarios.</p>
        {@html `<pre class="code-block text-xs mt-2">// En .claude/settings.json
{
  "mcpServers": {
    "mi-server-cloud": {
      "url": "https://mcp.miempresa.com/v1"
    }
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-text">Pros:</strong> Compartido, centralizado. <strong class="text-agent-text">Contras:</strong> Necesita autenticacion y red.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El blog de Anthropic sobre <strong class="text-agent-text">Code Execution with MCP</strong> muestra como construyeron un MCP server que le da a Claude la capacidad de ejecutar codigo en un sandbox seguro. El server expone herramientas como <code class="text-agent-accent text-xs">execute_python</code> y <code class="text-agent-accent text-xs">execute_javascript</code>, cada una con validaciones de seguridad integradas. En vez de que Claude genere codigo y espere que el usuario lo ejecute, el MCP server permite ejecucion directa con aislamiento.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anatomia de un Tool en MCP</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Cada herramienta que expone un MCP server tiene 4 componentes esenciales:
    </p>
    <div class="space-y-2 mb-4">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">name</span>
        <p class="text-xs text-agent-muted">Identificador unico. Debe ser descriptivo: <code class="text-agent-accent">search_documentation</code> en vez de <code class="text-agent-accent">search</code>. El LLM lo usa para elegir entre herramientas disponibles.</p>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">description</span>
        <p class="text-xs text-agent-muted">Texto que el LLM lee para decidir CUANDO usar la herramienta. Incluye: que hace, que retorna, y cuando es apropiada. Es <strong class="text-agent-text">prompt engineering aplicada a tools</strong>.</p>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">input_schema</span>
        <p class="text-xs text-agent-muted">JSON Schema que define los parametros: tipos, validaciones, valores por defecto. El LLM genera argumentos que cumplen con este schema. El servidor valida antes de ejecutar.</p>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">handler</span>
        <p class="text-xs text-agent-muted">La funcion que ejecuta la logica real. Recibe los argumentos validados y retorna el resultado como string o JSON. Aqui vive tu codigo de negocio.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Buenas y malas definiciones de tools</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      La calidad de las definiciones de herramientas determina directamente la calidad del agente. Comparemos dos formas de definir la misma herramienta:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">&#x274C; Definicion pobre</p>
        {@html `<pre class="code-block text-xs">@server.tool(
    name="search",
    description="busca cosas",
    input_schema={
        "properties": {
            "q": {"type": "string"}
        }
    }
)
# Problemas:
# - Nombre generico: busca DONDE? archivos? BD? web?
# - Descripcion inutil: el LLM no sabe CUANDO usarla
# - Parametro "q" sin descripcion
# - No dice que RETORNA</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">&#x2705; Definicion profesional</p>
        {@html `<pre class="code-block text-xs">@server.tool(
    name="search_project_docs",
    description="""Busca en la documentacion del
    proyecto por palabras clave. Retorna los 5
    fragmentos mas relevantes con path de archivo
    y numero de linea. Usar cuando necesites
    entender funcionalidad existente.
    NO usar para buscar en codigo fuente
    (usa search_code para eso).""",
    input_schema={
        "properties": {
            "query": {
                "type": "string",
                "description": "Palabras clave"
            }
        }
    }
)</pre>`}
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Anthropic lo llama <strong class="text-agent-text">"prompt engineering your tools"</strong>. La descripcion de una herramienta es un mini-prompt que guia al LLM. Incluir <strong class="text-agent-text">cuando usarla</strong> y <strong class="text-agent-text">cuando NO usarla</strong> reduce dramaticamente las llamadas incorrectas. No escatimes tokens en las descripciones: los tokens ahorrados ahi se pierden multiplicados en retries y errores.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">MCP en el ecosistema actual</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      MCP se ha convertido en un estandar de facto. La adopcion ha sido rapida porque resuelve un problema real: el problema <strong class="text-agent-text">N x M</strong>. Sin MCP, si tienes 5 agentes y 10 herramientas, necesitas 50 integraciones individuales. Con MCP, necesitas 10 MCP servers y 5 clientes MCP. El protocolo desacopla ambos lados.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Aspecto</th>
              <th class="text-left text-agent-text py-2">Detalle</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Protocolo</td><td class="py-2">JSON-RPC 2.0 sobre stdio o HTTP</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Clientes</td><td class="py-2">Claude Code, Cursor, VS Code (Roo Code), Windsurf, OpenAI (anunciado)</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Lenguajes</td><td class="py-2">SDKs oficiales en TypeScript, Python. Comunidad: Go, Rust, Java, C#</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium">Servidores</td><td class="py-2">Miles en el registro oficial. Jira, GitHub, PostgreSQL, Slack, etc.</td></tr>
            <tr><td class="py-2 pr-4 font-medium">Seguridad</td><td class="py-2">OAuth 2.1 para autenticacion, scoped permissions por herramienta</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 4: Hoofy como Caso de Estudio               -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Hoofy como Caso de Estudio</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La teoria es importante, pero ver un MCP server real en produccion es invaluable. <strong class="text-agent-text">Hoofy</strong> es un MCP server escrito en Go que le da a Claude Code memoria persistente y un pipeline de desarrollo spec-driven. Con 30 herramientas registradas, es un caso de estudio perfecto para ver como se aplican los patrones que hemos discutido.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Composition Root: todo empieza en main.go</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El primer patron arquitectonico que destaca en Hoofy es el <strong class="text-agent-text">Composition Root</strong>. Toda la inicializacion del sistema ocurre en un unico punto de entrada: <code class="text-agent-accent text-xs">main.go</code>. Ahi se crea la base de datos SQLite, se inicializa la capa de negocio, se conectan las 30 herramientas al protocolo MCP, y se arranca el servidor.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Composition Root simplificado</p>
      {@html `<pre class="code-block text-xs">func main() {
    // 1. Infraestructura: crear/abrir base de datos
    db := sqlite.Open("hoofy.db")
    db.RunMigrations()

    // 2. Capa de negocio: logica pura, sin saber de MCP
    memoryService := memory.NewService(db)
    pipelineService := pipeline.NewService(db)

    // 3. Bridge: conecta negocio con protocolo MCP
    bridge := mcp.NewBridge(memoryService, pipelineService)

    // 4. Registrar las 30 herramientas
    server := mcp.NewServer("hoofy", "1.0.0")
    bridge.RegisterTools(server)  // mem_save, mem_search, sdd_change...

    // 5. Arrancar con transporte stdio
    server.Run(transport.Stdio())
}</pre>`}
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      La ventaja del Composition Root es que <strong class="text-agent-text">las dependencias fluyen en una sola direccion</strong>: main.go conoce todo, pero la capa de negocio no sabe que existe MCP, y la base de datos no sabe que existe la logica de negocio. Si manana cambias SQLite por PostgreSQL, solo tocas la capa de infraestructura.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Bridge Pattern: separar protocolo de negocio</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El segundo patron clave es el <strong class="text-agent-text">Bridge</strong>. En Hoofy, hay una capa intermedia que traduce entre el protocolo MCP (request JSON-RPC con tool_name y args) y la logica de negocio (funciones Go con tipos nativos). La capa de negocio <strong class="text-agent-text">no importa ningun paquete de MCP</strong>.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F4E1;</p>
        <p class="text-agent-accent font-bold text-sm">Protocolo MCP</p>
        <p class="text-xs text-agent-muted mt-2">Recibe JSON-RPC, valida schema, despacha a la funcion correcta.</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F309;</p>
        <p class="text-agent-accent font-bold text-sm">Bridge</p>
        <p class="text-xs text-agent-muted mt-2">Traduce: extrae argumentos del JSON, llama al servicio, formatea la respuesta.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F9E0;</p>
        <p class="text-agent-accent font-bold text-sm">Logica de Negocio</p>
        <p class="text-xs text-agent-muted mt-2">Funciones Go puras. No sabe que MCP existe. Testeable con unit tests simples.</p>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El principio detras del Bridge Pattern es <strong class="text-agent-text">composition over inheritance</strong>. En vez de que los tools hereden de una clase base MCP (acoplamiento fuerte), se componen a traves de una capa intermedia (acoplamiento debil). El resultado: puedes testear toda la logica de memoria sin montar un servidor MCP, y puedes cambiar el protocolo sin tocar el dominio.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Knowledge Graph: relaciones tipadas</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El sistema de memoria de Hoofy no es una lista plana de notas. Es un <strong class="text-agent-text">knowledge graph</strong> donde las observaciones (decisiones, bugs, patrones, descubrimientos) se conectan con relaciones tipadas.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Knowledge Graph: ejemplo de navegacion</p>
      {@html `<pre class="code-block text-xs"># Observacion: "Migramos de REST a GraphQL"
#   ├── relates_to → "Elegimos SQLAlchemy 2.0 como ORM"
#   ├── caused_by  → "Los endpoints N+1 degradaron performance"
#   ├── implements  → "RFC-003: API Redesign"
#   └── depends_on → "Graphene configurado con async resolvers"
#
# mem_build_context(observation_id=42, depth=2)
# → Devuelve TODAS las observaciones conectadas hasta 2 niveles
# → El agente entiende no solo QUE se decidio, sino POR QUE

Tipos de relacion disponibles:
  relates_to   → Conexion general entre conceptos
  implements   → Esta observacion implementa la otra
  depends_on   → Requiere que la otra exista primero
  caused_by    → Esta observacion fue causada por la otra
  supersedes   → Reemplaza una decision anterior
  part_of      → Es una parte de un todo mas grande</pre>`}
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando Claude Code pregunta "por que se tomo esta decision?", el grafo le permite navegar desde la decision hasta sus causas, dependencias e implementaciones. Es <strong class="text-agent-text">memoria con contexto</strong>, no solo memoria con busqueda.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Adaptive Pipeline: 12 variantes de flujo</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El pipeline de desarrollo de Hoofy no es unico. Son <strong class="text-agent-text">12 variantes diferentes</strong> generadas por la combinacion de tipo (feature, fix, refactor, enhancement) y tamano (small, medium, large). Un fix pequeno no necesita las mismas fases que una feature grande.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Tamano</th>
              <th class="text-left text-agent-text py-2 pr-4">Fases</th>
              <th class="text-left text-agent-text py-2">Ejemplo</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium text-agent-accent">Small (3)</td><td class="py-2 pr-4">plan &#x2192; implement &#x2192; verify</td><td class="py-2">Fix de un typo, rename de variable</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 font-medium text-agent-accent">Medium (4)</td><td class="py-2 pr-4">plan &#x2192; design &#x2192; implement &#x2192; verify</td><td class="py-2">Agregar un endpoint, refactor de modulo</td></tr>
            <tr><td class="py-2 pr-4 font-medium text-agent-accent">Large (5-6)</td><td class="py-2 pr-4">spec &#x2192; clarify &#x2192; design &#x2192; tasks &#x2192; implement &#x2192; verify</td><td class="py-2">Feature completa, nueva arquitectura</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Leccion de Hoofy</p>
      <p class="text-sm text-agent-muted">Los tres patrones de Hoofy (Composition Root, Bridge, Knowledge Graph) comparten una filosofia: <strong class="text-agent-text">separar responsabilidades y componer piezas simples</strong>. El main.go compone las dependencias. El Bridge compone protocolo con negocio. El Knowledge Graph compone observaciones con relaciones. Cuando construyas tu propio MCP server, empieza por definir donde vive cada responsabilidad.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 5: Cuando Agent SDK vs Claude Code          -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Cuando Agent SDK vs Claude Code Directo</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Una de las preguntas mas frecuentes es: "Deberia usar Claude Code directamente o construir algo con el Agent SDK?" La respuesta depende de <strong class="text-agent-text">que estas construyendo y para quien</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F4BB;</span>
          <p class="text-agent-accent font-bold text-sm">Claude Code Directo</p>
        </div>
        <p class="text-sm text-agent-muted mb-3">Cuando TU necesitas hacer trabajo de desarrollo.</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li>&#x2022; Modificar codigo en un proyecto</li>
          <li>&#x2022; Correr tests y debugging</li>
          <li>&#x2022; Explorar y entender codebases</li>
          <li>&#x2022; Gestionar git y deploys</li>
          <li>&#x2022; Tareas interactivas con feedback</li>
        </ul>
        <p class="text-xs text-agent-accent mt-3 font-medium">Eres el usuario; Claude Code es tu herramienta.</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x26A1;</span>
          <p class="text-agent-accent font-bold text-sm">Agent SDK</p>
        </div>
        <p class="text-sm text-agent-muted mb-3">Cuando construyes un PRODUCTO que embebe un agente.</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li>&#x2022; Bot de Slack que responde preguntas</li>
          <li>&#x2022; Sistema de code review automatico</li>
          <li>&#x2022; Pipeline de procesamiento de datos</li>
          <li>&#x2022; Herramienta SaaS con agente interno</li>
          <li>&#x2022; Control total del loop y las tools</li>
        </ul>
        <p class="text-xs text-agent-accent mt-3 font-medium">Tus USUARIOS usan tu agente; tu controlas todo.</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#x1F50C;</span>
          <p class="text-agent-accent font-bold text-sm">MCP Server</p>
        </div>
        <p class="text-sm text-agent-muted mb-3">Cuando quieres ampliar un agente existente.</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li>&#x2022; Dar a Claude Code acceso a tu BD</li>
          <li>&#x2022; Integrar con APIs internas</li>
          <li>&#x2022; Agregar herramientas custom a IDEs</li>
          <li>&#x2022; Compartir herramientas con el equipo</li>
          <li>&#x2022; Sin tocar el agente base</li>
        </ul>
        <p class="text-xs text-agent-accent mt-3 font-medium">Extiendes un agente existente; no construyes uno nuevo.</p>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Arbol de decision</p>
      {@html `<pre class="code-block text-xs">
¿Necesitas que el agente opere en TU codebase?
  ├── SI → ¿Es una tarea interactiva que necesita tu feedback?
  │         ├── SI → Claude Code directo
  │         └── NO → Claude Code headless (CI/CD)
  │
  └── NO → ¿Construyes un producto para OTROS usuarios?
            ├── SI → Agent SDK (control total del loop y UX)
            └── NO → ¿Quieres agregar herramientas a un agente existente?
                      ├── SI → MCP Server
                      └── NO → API de Claude directa (mas simple)</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El equipo de <strong class="text-agent-text">incident.io</strong> usa Claude Code directo para desarrollo diario (4-7 sesiones paralelas con worktrees). Pero cuando construyeron su bot interno que clasifica incidentes automaticamente, usaron el Agent SDK porque necesitaban control total sobre el flujo: recibir un webhook de PagerDuty &#x2192; clasificar &#x2192; asignar equipo &#x2192; crear canal de Slack. El Agent SDK les dio el control del loop; Claude Code les dio la velocidad de desarrollo.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El mismo problema, tres enfoques</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Para que la diferencia sea concreta, veamos como resolverias el mismo problema ("necesito que al hacer push a main, se genere un resumen del PR automaticamente") con cada herramienta:
    </p>
    <div class="space-y-3 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x1F4BB; Claude Code (headless en CI)</p>
        <p class="text-xs text-agent-muted">Configuras la GitHub Action de Claude Code con un trigger phrase. Cuando alguien abre un PR, Claude Code lee el diff, entiende los cambios, y escribe un resumen como comentario. <strong class="text-agent-text">Cero codigo propio</strong>, solo configuracion.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x26A1; Agent SDK</p>
        <p class="text-xs text-agent-muted">Construyes un microservicio: webhook de GitHub &#x2192; tu agente lee el diff con tools custom &#x2192; genera el resumen &#x2192; llama la API de GitHub para postear el comentario. <strong class="text-agent-text">Control total pero mas codigo</strong>. Ideal si necesitas logica custom (categorizar cambios, detectar breaking changes, notificar por Slack).</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x1F50C; MCP Server</p>
        <p class="text-xs text-agent-muted">Creas un MCP server que expone <code class="text-agent-accent text-xs">get_pr_diff</code> y <code class="text-agent-accent text-xs">post_pr_comment</code>. Ahora Claude Code puede hacerlo manualmente cuando se lo pides. <strong class="text-agent-text">No esta automatizado</strong>, pero extiende lo que Claude Code puede hacer en tu flujo diario.</p>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">La recomendacion de Anthropic es clara: <strong class="text-agent-text">"Start with the simplest solution that could work."</strong> Si Claude Code headless resuelve tu caso, no construyas un Agent SDK custom. Si un MCP server basta, no construyas un pipeline completo. Escala la complejidad solo cuando la evidencia lo justifique. Muchos equipos sobre-ingenieran soluciones con agentes cuando un prompt bien escrito en la GitHub Action bastaba.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Section 6: El Agentic Loop en Detalle               -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. El Agentic Loop en Detalle</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Ya vimos el loop basico en el modulo anterior y las 4 fases al inicio de este modulo. Ahora vamos a construir un agentic loop <strong class="text-agent-text">production-ready</strong> que incluya error handling, retries, y stop conditions. Estas son las piezas que separan un prototipo de un agente que realmente funciona.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">El loop completo con error handling</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Agentic loop production-ready (pseudocodigo)</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">class ProductionAgent:
    def __init__(self, tools, instructions,
                 max_iterations=25, token_budget=150000):
        self.tools = tools
        self.instructions = instructions
        self.max_iterations = max_iterations
        self.token_budget = token_budget
        self.tokens_used = 0

    def run(self, task: str) -> str:
        messages = [
            {"role": "system", "content": self.instructions},
            {"role": "user", "content": task}
        ]

        for iteration in range(self.max_iterations):
            # ── Stop condition 1: token budget ──
            if self.tokens_used > self.token_budget:
                return self.graceful_exit(messages,
                    "Token budget excedido")

            # ── Llamada al LLM ──
            response = llm.generate(messages, self.tools)
            messages.append(response.message)
            self.tokens_used += response.usage.total_tokens

            # ── Stop condition 2: respuesta sin tools ──
            if not response.tool_calls:
                return response.text  # Tarea completa

            # ── Ejecutar cada tool call ──
            for tool_call in response.tool_calls:
                result = self.execute_with_retry(
                    tool_call, max_retries=3
                )
                messages.append(tool_result(
                    tool_call.id, result
                ))

            # ── Gestion de contexto ──
            if count_tokens(messages) > MAX_CONTEXT * 0.8:
                messages = self.compress(messages)

        # ── Stop condition 3: max iteraciones ──
        return self.graceful_exit(messages,
            "Max iteraciones alcanzado")

    def execute_with_retry(self, tool_call, max_retries=3):
        """Ejecuta con backoff exponencial."""
        for attempt in range(max_retries):
            try:
                # Validar parametros contra schema
                validate(tool_call.args, tool_call.schema)
                return self.tools[tool_call.name](
                    **tool_call.args
                )
            except TransientError as e:
                # Error transitorio: reintentar
                wait = 2 ** attempt  # 1s, 2s, 4s
                sleep(wait)
            except PermanentError as e:
                # Error permanente: no reintentar
                return {"error": str(e)}
        return {"error": "Max retries excedidos"}

    def graceful_exit(self, messages, reason):
        """Salida limpia: resumen de lo logrado."""
        summary = llm.generate([
            *messages,
            {"role": "user",
             "content": f"Detente. {reason}. Resume lo logrado."}
        ])
        return summary.text</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 3 stop conditions criticas</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un agentic loop sin stop conditions es una bomba de tiempo. Estas son las tres paradas de emergencia que todo agente necesita:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F4AC;</p>
        <p class="text-agent-accent font-bold text-sm">Sin tool_calls</p>
        <p class="text-xs text-agent-muted mt-2">La stop condition natural: el LLM decidio que la tarea esta completa y responde con texto. Es la salida feliz.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F504;</p>
        <p class="text-agent-accent font-bold text-sm">Max iteraciones</p>
        <p class="text-xs text-agent-muted mt-2">Limite duro de iteraciones del loop. Previene que el agente se quede atascado en ciclos infinitos de tool calls fallidas.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F4B0;</p>
        <p class="text-agent-accent font-bold text-sm">Token budget</p>
        <p class="text-xs text-agent-muted mt-2">Kill switch financiero. Si el agente ya gasto N tokens, se detiene antes de la siguiente llamada al LLM. Critico en produccion.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Retry con backoff exponencial</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      No todos los errores merecen un retry. La distincion clave es entre errores <strong class="text-agent-text">transitorios</strong> (red caida, rate limit, timeout) y <strong class="text-agent-text">permanentes</strong> (archivo no existe, permisos insuficientes, parametros invalidos).
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">&#x1F504; Errores transitorios (reintentar)</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li>&#x2022; HTTP 429: Rate limit exceeded</li>
          <li>&#x2022; HTTP 503: Service temporarily unavailable</li>
          <li>&#x2022; Timeout de red</li>
          <li>&#x2022; Connection reset</li>
        </ul>
        <p class="text-xs text-agent-text mt-2">Backoff: 1s &#x2192; 2s &#x2192; 4s (max 3 intentos)</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">&#x274C; Errores permanentes (no reintentar)</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li>&#x2022; HTTP 404: Recurso no existe</li>
          <li>&#x2022; HTTP 403: Permisos insuficientes</li>
          <li>&#x2022; Parametros invalidos contra schema</li>
          <li>&#x2022; API key expirada o invalida</li>
        </ul>
        <p class="text-xs text-agent-text mt-2">Devolver error al LLM para que se adapte</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Reintentar errores permanentes es uno de los bugs mas costosos en agentes. Si un archivo no existe, reintentarlo 3 veces con backoff solo gasta tokens y tiempo sin cambiar el resultado. <strong class="text-agent-text">Siempre clasifica el error antes de decidir si reintentar</strong>. Los errores permanentes deben devolverse al LLM como feedback para que busque una alternativa.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Graceful exit: cuando parar con dignidad</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando un agente alcanza un limite (max iteraciones o token budget), la peor opcion es terminar abruptamente sin explicacion. Un agente profesional hace un <strong class="text-agent-text">graceful exit</strong>: resume lo que logro, lo que falta, y por que se detuvo. Esto le da al usuario (o al sistema orquestador) suficiente contexto para decidir el siguiente paso.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Ejemplo de graceful exit</p>
      {@html `<pre class="code-block text-xs">## Salida del agente (max iteraciones alcanzado):
{
  "status": "partial",
  "reason": "Max iteraciones (25) alcanzado",
  "completed": [
    "Identifique el bug en src/auth/login.py linea 42",
    "Corregi la validacion del JWT token",
    "2 de 4 tests pasan ahora"
  ],
  "pending": [
    "test_login_expired_token aun falla",
    "test_login_invalid_signature aun falla"
  ],
  "recommendation": "Reiniciar con contexto del error de los 2 tests restantes"
}</pre>`}
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Interactive Flow                                    -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Diagrama Interactivo</h2>
      {#if !showFlow}
        <button onclick={() => showFlow = true} class="btn-primary text-xs">
          Explorar arquitectura
        </button>
      {/if}
    </div>
    {#if showFlow}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Arquitectura del Agent SDK: ciclo de 4 fases"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- Quiz                                                -->
  <!-- ═══════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Construir tu Agente</h2>
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

  <!-- Completion -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">&#x26A1;</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ya conoces las herramientas para construir agentes: Agent SDK, MCP servers, y los patrones de produccion.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
