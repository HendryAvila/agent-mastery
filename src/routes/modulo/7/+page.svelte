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

  // ─── InteractiveFlow: Framework Comparison Map ───
  const flowNodes = [
    { id: 'problem', label: 'Tu Problema', description: 'El punto de partida: tienes un problema que requiere agentes IA. La eleccion del framework depende de la complejidad del problema, el control que necesitas, la experiencia de tu equipo, y tu infraestructura existente. No hay un "mejor" framework universal.', icon: '🎯', x: 50, y: 50 },
    { id: 'claude-sdk', label: 'Claude Agent SDK', description: 'SDK oficial de Anthropic para construir agentes con Claude. Model-driven: el modelo decide que herramientas usar y cuando. Concepto clave: Agent + Tool + Handoff + Guardrail. Python nativo. Ideal si ya usas Claude API y quieres la integracion mas directa con las capacidades del modelo.', icon: '🟣', x: 15, y: 15 },
    { id: 'openai-sdk', label: 'OpenAI Agents SDK', description: 'Framework de OpenAI con agentes, handoffs y guardrails como first-class citizens. Incluye AgentKit para builder visual. Soporta tracing nativo. Input/Output guardrails integrados. Ideal si ya usas OpenAI API y quieres herramientas de observabilidad integradas.', icon: '🟢', x: 50, y: 10 },
    { id: 'strands', label: 'AWS Strands', description: 'SDK open source (Apache 2.0) de AWS. Filosofia model-first: prompt + tools = agent. Usado internamente por Amazon Q Developer. Simple por diseno. Ideal para equipos que ya estan en AWS y quieren algo que funcione en produccion sin complejidad innecesaria.', icon: '🟠', x: 85, y: 15 },
    { id: 'langgraph', label: 'LangGraph', description: 'El mas flexible. Define agentes como grafos de estado: nodos son funciones, edges son condiciones. Permite flujos de control complejos, ciclos, y paralelismo. El mas potente PERO el mas complejo de mantener. Ideal para flujos no lineales y orquestaciones complejas.', icon: '🔵', x: 15, y: 85 },
    { id: 'crewai', label: 'CrewAI', description: 'Agentes basados en roles, como un equipo. Cada agente tiene: role (que es), goal (que busca), backstory (contexto). Intuitivo para modelar equipos humanos. Workflow secuencial o jerarquico. Ideal para problemas donde los roles estan claros y bien definidos.', icon: '🟡', x: 50, y: 90 },
    { id: 'autogen', label: 'AutoGen', description: 'Framework de Microsoft donde agentes conversan entre si. Patron conversacional: agentes debaten, revisan el trabajo de otros, y llegan a consenso. Soporta human-in-the-loop como un agente mas en la conversacion. Ideal para revision de pares y tareas que requieren debate.', icon: '🔴', x: 85, y: 85 }
  ];

  const flowEdges = [
    { from: 'problem', to: 'claude-sdk', label: 'Simple + Claude' },
    { from: 'problem', to: 'openai-sdk', label: 'Simple + OpenAI' },
    { from: 'problem', to: 'strands', label: 'Simple + AWS' },
    { from: 'problem', to: 'langgraph', label: 'Flujos complejos' },
    { from: 'problem', to: 'crewai', label: 'Equipos con roles' },
    { from: 'problem', to: 'autogen', label: 'Debate entre agentes' }
  ];

  const flowChallenges = [
    { question: 'Tu empresa necesita un pipeline secuencial simple: investigar, escribir, revisar. Cual framework seria el MAS facil de implementar?', targetNodeId: 'crewai', hint: 'Un framework que modela agentes como miembros de un equipo con roles definidos.' },
    { question: 'Necesitas que agentes debatan entre si para llegar a un consenso sobre una decision de arquitectura. Cual framework esta disenado para conversaciones entre agentes?', targetNodeId: 'autogen', hint: 'Microsoft creo este framework con un patron conversacional nativo.' },
    { question: 'Tu flujo necesita ciclos, condiciones complejas y paralelismo. Cual te da el maximo control sobre el grafo de ejecucion?', targetNodeId: 'langgraph', hint: 'El framework que modela agentes como grafos de estado con nodos y edges.' },
    { question: 'Tu equipo ya usa AWS y necesita algo simple que funcione en produccion sin curva de aprendizaje alta. Que framework es open source y model-first?', targetNodeId: 'strands', hint: 'Fue creado por AWS y es usado internamente por Amazon Q Developer.' }
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Necesitas un sistema donde 3 agentes especializados (investigador, codificador, tester) trabajan en paralelo y un cuarto agente sintetiza los resultados. Cual framework elegirías y por que?',
      options: [
        { text: 'LangGraph: puedo modelar el paralelismo y la sincronizacion como un grafo de estado con nodos paralelos y un nodo de union', correct: true, explanation: 'Correcto! LangGraph es el unico framework que da control granular sobre flujos paralelos con sincronizacion. Puedes definir 3 nodos en paralelo (fork) que convergen en un nodo de sintesis (join). CrewAI soporta paralelo pero con menos control sobre la sincronizacion.' },
        { text: 'CrewAI: defino 4 agentes con roles y uso el modo jerarquico', correct: false, explanation: 'CrewAI soporta jerarquico, pero su paralelismo es limitado. No te da control fino sobre la sincronizacion de cuando los 3 terminan para que el cuarto empiece.' },
        { text: 'Claude Agent SDK: uso handoffs para pasar el trabajo entre agentes', correct: false, explanation: 'Los handoffs son secuenciales por naturaleza: un agente pasa control a otro. No estan disenados para 3 agentes trabajando simultaneamente.' },
        { text: 'AutoGen: los 4 agentes conversan y se sincronizan naturalmente', correct: false, explanation: 'AutoGen es conversacional, no paralelico. Los agentes toman turnos hablando, no trabajan simultaneamente en tareas separadas.' }
      ]
    },
    {
      question: 'Tu empresa usa AWS, necesita agentes en produccion YA, y el equipo no tiene experiencia con LangChain. Que recomendarias?',
      options: [
        { text: 'LangGraph: es el framework mas completo y flexible, vale la pena la curva de aprendizaje', correct: false, explanation: 'LangGraph tiene la curva de aprendizaje mas alta. Si el equipo no conoce LangChain y necesitan algo en produccion rapido, no es la mejor opcion. La complejidad agregara semanas al timeline.' },
        { text: 'AWS Strands: simple, open source, ya integrado con servicios AWS, y con la filosofia prompt + tools = agent', correct: true, explanation: 'Correcto! Strands es ideal aqui: (1) es de AWS asi que la integracion con servicios existentes es directa, (2) la filosofia model-first es simple de aprender, (3) es lo que usa Amazon Q Developer internamente, y (4) Apache 2.0 sin vendor lock-in.' },
        { text: 'CrewAI: es el mas intuitivo para equipos nuevos', correct: false, explanation: 'CrewAI es intuitivo, pero no tiene integracion nativa con servicios AWS. Tendrias que construir esos conectores, lo cual anade complejidad innecesaria.' },
        { text: 'Construir un framework propio: asi controlas todo', correct: false, explanation: 'Construir un framework propio cuando necesitas algo en produccion YA es la peor decision. Tardarias meses en replicar lo que un framework maduro ya resuelve.' }
      ],
      source: 'AWS Strands Agents SDK',
      sourceUrl: 'https://strandsagents.com/latest/'
    },
    {
      question: 'Por que LangGraph es mas flexible que CrewAI pero tambien mas dificil de mantener?',
      options: [
        { text: 'Porque LangGraph usa Python puro y CrewAI usa YAML', correct: false, explanation: 'Ambos son Python. La diferencia no es el lenguaje sino el nivel de abstraccion.' },
        { text: 'Porque en LangGraph defines el flujo completo como un grafo (nodos, edges, condiciones, estado), lo que da maximo control pero requiere manejar manualmente todo lo que CrewAI abstrae automaticamente', correct: true, explanation: 'Correcto! LangGraph te da un canvas en blanco: tu defines cada nodo (funcion), cada edge (condicion), el estado compartido, y el flujo de control. CrewAI abstrae todo esto con roles y tareas predefinidos. Mas flexibilidad = mas codigo que mantener = mas posibilidades de bugs en la orquestacion.' },
        { text: 'Porque LangGraph requiere una licencia enterprise y CrewAI es gratuito', correct: false, explanation: 'LangGraph es open source. La dificultad de mantenimiento no tiene que ver con licencias sino con la complejidad inherente del modelo de grafos de estado.' },
        { text: 'Porque LangGraph solo funciona con modelos de OpenAI', correct: false, explanation: 'LangGraph es model-agnostic. Funciona con cualquier LLM. La dificultad es arquitectonica, no de proveedor.' }
      ]
    },
    {
      question: 'Un colega quiere usar AutoGen para un pipeline donde los agentes NO necesitan interactuar entre si, solo procesar datos secuencialmente. Que le dirias?',
      options: [
        { text: 'Perfecto, AutoGen funciona bien para pipelines secuenciales', correct: false, explanation: 'AutoGen esta disenado para conversaciones entre agentes. Usarlo para un pipeline secuencial sin interaccion es como usar un Formula 1 para ir al supermercado.' },
        { text: 'AutoGen es para patrones conversacionales (debate, revision). Para un pipeline secuencial, usa algo mas simple como Strands o el SDK nativo del proveedor de LLM', correct: true, explanation: 'Correcto! Cada framework tiene su sweet spot. AutoGen brilla cuando los agentes necesitan debatir, revisar trabajo de otros, o llegar a consenso. Para procesar datos secuencialmente, un pipeline simple con cualquier SDK basico es mas eficiente y facil de mantener.' },
        { text: 'AutoGen no puede hacer pipelines, solo conversaciones', correct: false, explanation: 'AutoGen PUEDE hacer pipelines, pero no es su caso de uso ideal. Es como decir que un cuchillo no puede atornillar - tecnicamente puedes forzarlo, pero hay herramientas mejores.' },
        { text: 'No importa el framework, todos hacen lo mismo', correct: false, explanation: 'Absolutamente falso. Cada framework tiene trade-offs distintos. Elegir el incorrecto puede multiplicar la complejidad innecesariamente.' }
      ]
    },
    {
      question: 'Cual es la principal ventaja del patron de guardrails como first-class citizen en el OpenAI Agents SDK?',
      options: [
        { text: 'Son mas rapidos que implementar validaciones manuales', correct: false, explanation: 'La velocidad no es la ventaja principal. Los guardrails como first-class corren en paralelo con el agente, pero su valor esta en la arquitectura, no en la velocidad.' },
        { text: 'Los guardrails se definen declarativamente, corren en paralelo con el agente, y pueden abortar la ejecucion antes de que el agente genere output peligroso o procese input malicioso', correct: true, explanation: 'Correcto! Al ser first-class, los guardrails no son un afterthought: se definen como parte de la arquitectura del agente, corren en paralelo (fail-fast), y pueden interceptar tanto input (prompt injection) como output (contenido peligroso) ANTES de que lleguen al usuario. Es seguridad by design, no seguridad parcheada.' },
        { text: 'Solo funcionan con modelos de OpenAI, lo que garantiza mejor integracion', correct: false, explanation: 'Los guardrails como concepto son independientes del modelo. Otros frameworks tambien los implementan. La ventaja es arquitectonica.' },
        { text: 'Eliminan completamente la posibilidad de prompt injection', correct: false, explanation: 'Ningun sistema elimina COMPLETAMENTE el prompt injection. Los guardrails reducen significativamente el riesgo, pero no son infalibles. Son una capa de defensa, no una solucion perfecta.' }
      ],
      source: 'OpenAI Agents SDK - Guardrails',
      sourceUrl: 'https://openai.github.io/openai-agents-python/guardrails/'
    },
    {
      question: 'Que diferencia fundamental hay entre el approach "model-driven" (Claude SDK, Strands) y el approach "graph-driven" (LangGraph)?',
      options: [
        { text: 'Model-driven usa LLMs y graph-driven no', correct: false, explanation: 'Ambos usan LLMs. La diferencia no es si usan modelos, sino QUIEN decide el flujo de ejecucion.' },
        { text: 'En model-driven, el LLM decide dinamicamente que herramientas usar y en que orden. En graph-driven, el desarrollador predefine el flujo de ejecucion como un grafo de nodos y condiciones', correct: true, explanation: 'Correcto! Esta es la diferencia arquitectonica fundamental. Model-driven: "le doy herramientas al modelo y el decide". Graph-driven: "yo defino el flujo, las condiciones, y donde entra el modelo". Model-driven es mas simple y flexible. Graph-driven es mas predecible y controlable. Elige segun cuanto control necesitas.' },
        { text: 'Graph-driven es siempre mejor porque tienes mas control', correct: false, explanation: 'Mas control no es siempre mejor. Implica mas codigo, mas mantenimiento, y mas puntos de falla. Para muchos casos, dejar que el modelo decida es mas eficiente.' },
        { text: 'Model-driven solo funciona para agentes simples de una sola herramienta', correct: false, explanation: 'Model-driven funciona perfectamente con decenas de herramientas. Claude Code, que es model-driven, maneja un codebase completo con multiples herramientas. La complejidad no es el limitante.' }
      ]
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow does not trigger completion
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    // No badge for module 7
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

  <!-- Section 1: Por Que Frameworks -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. Por Que Frameworks?</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      En el modulo anterior construiste un agente minimo desde cero. Funciona para un solo agente. Pero cuando necesitas <strong class="text-agent-text">multiples agentes que colaboren</strong>, la complejidad explota: comunicacion entre agentes, estado compartido, tool sharing, error propagation, manejo de handoffs...
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-agent-text font-bold text-sm mb-3">Lo que un framework abstrae por ti:</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Agentic loop:</strong> ya implementado y optimizado</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Tool management:</strong> registrar, validar, ejecutar</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">State management:</strong> estado compartido entre agentes</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Handoffs:</strong> transferir control entre agentes</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Guardrails:</strong> validacion de input/output</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Observabilidad:</strong> tracing, logging, metricas</p>
        </div>
      </div>
    </div>
    <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4">
      <p class="text-agent-warning font-bold text-sm">Principio de Anthropic</p>
      <p class="text-sm text-agent-muted mt-1">"Empieza con el sistema mas simple posible y solo agrega complejidad cuando la evidencia lo justifique." Muchas veces un solo agente con buenas herramientas es suficiente. No uses multi-agente porque suena cool.</p>
    </div>
  </section>

  <!-- Section 2: Claude Agent SDK -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Claude Agent SDK (Anthropic)</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">Python</span>
      <span class="badge bg-agent-success/20 text-agent-success border border-agent-success/30">Model-driven</span>
      <span class="badge bg-agent-accent/20 text-agent-accent border border-agent-accent/30">Oficial Anthropic</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      El SDK oficial de Anthropic adopta un enfoque <strong class="text-agent-text">model-driven</strong>: le das herramientas al modelo y Claude decide que usar y cuando. Los conceptos clave son cuatro:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Agent</p>
        <p class="text-xs text-agent-muted mt-1">Un LLM configurado con instrucciones, herramientas y guardrails. Es la unidad basica.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Tool</p>
        <p class="text-xs text-agent-muted mt-1">Funcion Python decorada que el agente puede invocar. Se registra automaticamente con su schema.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Handoff</p>
        <p class="text-xs text-agent-muted mt-1">Mecanismo para transferir el control de un agente a otro con contexto relevante.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Guardrail</p>
        <p class="text-xs text-agent-muted mt-1">Validacion que corre antes o despues de cada accion del agente para garantizar seguridad.</p>
      </div>
    </div>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from claude_agent_sdk import Agent, Tool

@Tool
def search_docs(query: str) -> str:
    """Busca en la documentacion del proyecto."""
    return vector_db.search(query)

agent = Agent(
    model="claude-opus-4-6",
    instructions="Eres un asistente de desarrollo...",
    tools=[search_docs],
)</pre>`}
  </section>

  <!-- Section 3: OpenAI Agents SDK -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. OpenAI Agents SDK + AgentKit</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-green-500/20 text-green-400 border border-green-500/30">Python</span>
      <span class="badge bg-agent-success/20 text-agent-success border border-agent-success/30">Model-driven</span>
      <span class="badge bg-agent-info/20 text-agent-info border border-agent-info/30">Tracing nativo</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      Comparte filosofia con Claude SDK pero con <strong class="text-agent-text">guardrails como ciudadanos de primera clase</strong> y tracing integrado. Conceptos: Agent, Runner, Handoff, InputGuardrail, OutputGuardrail.
    </p>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from agents import Agent, Runner, InputGuardrail

# Guardrail de input que corre en PARALELO con el agente
safety_guardrail = InputGuardrail(
    name="content_filter",
    agent=Agent(instructions="Detecta contenido malicioso...")
)

agent = Agent(
    name="coding_assistant",
    instructions="Asiste con tareas de codigo...",
    tools=[search_code, edit_file],
    input_guardrails=[safety_guardrail]
)

result = Runner.run(agent, "Refactoriza esta funcion")</pre>`}
    <p class="text-agent-muted leading-relaxed">
      <strong class="text-agent-text">AgentKit</strong> agrega un builder visual para crear agentes sin escribir codigo (low-code), util para prototipar rapidamente.
    </p>
  </section>

  <!-- Section 4: AWS Strands Agents -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. AWS Strands Agents</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-orange-500/20 text-orange-400 border border-orange-500/30">Python</span>
      <span class="badge bg-agent-success/20 text-agent-success border border-agent-success/30">Model-first</span>
      <span class="badge bg-agent-accent/20 text-agent-accent border border-agent-accent/30">Apache 2.0</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      La propuesta de AWS es la simplicidad radical: <strong class="text-agent-text">prompt + tools = agent</strong>. Sin grafos, sin configuraciones complejas. Usado internamente por Amazon Q Developer.
    </p>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from strands import Agent
from strands.tools import tool

@tool
def get_weather(city: str) -> str:
    """Obtiene el clima de una ciudad."""
    return weather_api.get(city)

# Asi de simple
agent = Agent(
    system_prompt="Eres un asistente util...",
    tools=[get_weather]
)

response = agent("Que clima hace en Buenos Aires?")</pre>`}
    <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
      <p class="text-agent-success font-bold text-sm">Ventaja clave</p>
      <p class="text-sm text-agent-muted mt-1">Open source real (Apache 2.0), sin vendor lock-in. Funciona con cualquier LLM, no solo modelos de AWS. Integracion nativa con servicios AWS (Bedrock, Lambda, S3).</p>
    </div>
  </section>

  <!-- Section 5: LangGraph -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. LangGraph (LangChain)</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">Python / JS</span>
      <span class="badge bg-agent-warning/20 text-agent-warning border border-agent-warning/30">Graph-driven</span>
      <span class="badge bg-agent-danger/20 text-agent-danger border border-agent-danger/30">Complejidad alta</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      LangGraph modela agentes como <strong class="text-agent-text">grafos de estado</strong>. Los nodos son funciones, los edges son condiciones. Es el mas flexible: soporta ciclos, paralelismo, checkpoints. Pero la curva de aprendizaje es la mas pronunciada.
    </p>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from langgraph.graph import StateGraph

# Estado compartido entre nodos
class AgentState(TypedDict):
    messages: list
    next_step: str

# Definir grafo
graph = StateGraph(AgentState)
graph.add_node("research", research_agent)
graph.add_node("code", coding_agent)
graph.add_node("review", review_agent)

# Edges condicionales
graph.add_edge("research", "code")
graph.add_conditional_edges("code", should_review)
graph.add_edge("review", "code")  # Ciclo de revision

app = graph.compile()</pre>`}
  </section>

  <!-- Section 6: CrewAI -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. CrewAI</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Python</span>
      <span class="badge bg-agent-success/20 text-agent-success border border-agent-success/30">Role-based</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      CrewAI modela agentes como <strong class="text-agent-text">miembros de un equipo</strong>. Cada agente tiene un rol, un objetivo y una historia de fondo. Es el mas intuitivo para personas que piensan en terminos de equipos.
    </p>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from crewai import Agent, Task, Crew

researcher = Agent(
    role="Investigador Senior",
    goal="Encontrar informacion precisa y relevante",
    backstory="Tienes 10 anos de experiencia en research..."
)

writer = Agent(
    role="Technical Writer",
    goal="Escribir documentacion clara y precisa",
    backstory="Eres especialista en comunicar conceptos tecnicos..."
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process="sequential"  # o "hierarchical"
)</pre>`}
  </section>

  <!-- Section 7: AutoGen -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">7. AutoGen (Microsoft)</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-red-500/20 text-red-400 border border-red-500/30">Python</span>
      <span class="badge bg-agent-info/20 text-agent-info border border-agent-info/30">Conversacional</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      AutoGen crea agentes que <strong class="text-agent-text">conversan entre si</strong>. El patron es: agente A propone algo, agente B revisa y responde, A corrige, B aprueba. Ideal para revision de pares y debate.
    </p>
    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from autogen import AssistantAgent, UserProxyAgent

coder = AssistantAgent(
    name="Coder",
    system_message="Escribes codigo Python limpio..."
)

reviewer = AssistantAgent(
    name="Reviewer",
    system_message="Revisas codigo buscando bugs y mejoras..."
)

# El reviewer inicia una conversacion con el coder
reviewer.initiate_chat(
    coder,
    message="Necesito una funcion para parsear CSV..."
)</pre>`}
  </section>

  <!-- Section 8: Tabla Comparativa -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">8. Tabla Comparativa</h2>
    <div class="bg-agent-card border border-agent-border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-agent-border bg-agent-dark">
            <th class="text-left text-agent-text py-3 px-4">Feature</th>
            <th class="text-center text-agent-text py-3 px-3">Claude SDK</th>
            <th class="text-center text-agent-text py-3 px-3">OpenAI SDK</th>
            <th class="text-center text-agent-text py-3 px-3">Strands</th>
            <th class="text-center text-agent-text py-3 px-3">LangGraph</th>
            <th class="text-center text-agent-text py-3 px-3">CrewAI</th>
            <th class="text-center text-agent-text py-3 px-3">AutoGen</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Approach</td>
            <td class="py-2 px-3 text-center">Model-driven</td>
            <td class="py-2 px-3 text-center">Model-driven</td>
            <td class="py-2 px-3 text-center">Model-first</td>
            <td class="py-2 px-3 text-center">Graph-driven</td>
            <td class="py-2 px-3 text-center">Role-based</td>
            <td class="py-2 px-3 text-center">Conversacional</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Complejidad</td>
            <td class="py-2 px-3 text-center text-agent-success">Baja</td>
            <td class="py-2 px-3 text-center text-agent-success">Baja</td>
            <td class="py-2 px-3 text-center text-agent-success">Muy baja</td>
            <td class="py-2 px-3 text-center text-agent-danger">Alta</td>
            <td class="py-2 px-3 text-center text-agent-warning">Media</td>
            <td class="py-2 px-3 text-center text-agent-warning">Media</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Flexibilidad</td>
            <td class="py-2 px-3 text-center">Media</td>
            <td class="py-2 px-3 text-center">Media</td>
            <td class="py-2 px-3 text-center">Media</td>
            <td class="py-2 px-3 text-center text-agent-accent">Maxima</td>
            <td class="py-2 px-3 text-center">Media</td>
            <td class="py-2 px-3 text-center">Media</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Multi-agent</td>
            <td class="py-2 px-3 text-center">Handoffs</td>
            <td class="py-2 px-3 text-center">Handoffs</td>
            <td class="py-2 px-3 text-center">Basico</td>
            <td class="py-2 px-3 text-center">Grafos</td>
            <td class="py-2 px-3 text-center">Crews</td>
            <td class="py-2 px-3 text-center">Chats</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Guardrails</td>
            <td class="py-2 px-3 text-center">Si</td>
            <td class="py-2 px-3 text-center text-agent-accent">First-class</td>
            <td class="py-2 px-3 text-center">Manual</td>
            <td class="py-2 px-3 text-center">Manual</td>
            <td class="py-2 px-3 text-center">Limitado</td>
            <td class="py-2 px-3 text-center">Manual</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Licencia</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">Apache 2.0</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">CC-BY-4.0</td>
          </tr>
          <tr>
            <td class="py-2 px-4 text-agent-text font-medium">Superpower</td>
            <td class="py-2 px-3 text-center">Integracion Claude</td>
            <td class="py-2 px-3 text-center">Tracing + Guardrails</td>
            <td class="py-2 px-3 text-center">Simplicidad AWS</td>
            <td class="py-2 px-3 text-center">Control total</td>
            <td class="py-2 px-3 text-center">Equipos intuitivos</td>
            <td class="py-2 px-3 text-center">Debate entre agentes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- InteractiveFlow -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Mapa de Frameworks</h2>
      {#if !showFlow}
        <button onclick={() => showFlow = true} class="btn-primary text-xs">
          Explorar frameworks
        </button>
      {/if}
    </div>
    {#if showFlow}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Mapa de Frameworks Multi-Agente"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- Quiz -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Frameworks Multi-Agente</h2>
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
      <span class="text-4xl">🔗</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ya conoces el ecosistema completo de frameworks multi-agente.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
