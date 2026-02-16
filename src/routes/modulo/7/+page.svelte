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

    <!-- The complexity explosion -->
    <h3 class="text-lg font-bold text-agent-text mb-3">La explosion de complejidad</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Piensa en la complejidad como una funcion exponencial, no lineal. Un agente solo necesita su loop, sus herramientas, y su contexto. Dos agentes necesitan todo eso MAS un protocolo de comunicacion. Cinco agentes necesitan comunicacion, coordinacion, resolucion de conflictos, manejo de errores en cascada, y estado compartido. Es la misma razon por la que un equipo de 2 programadores no necesita reuniones formales, pero un equipo de 10 necesita Scrum, standups, y un project manager.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">1 agente:  loop + tools + context                    = Simple
2 agentes: (loop + tools + context) x 2
           + comunicacion + estado compartido          = Manejable
5 agentes: (loop + tools + context) x 5
           + comunicacion N-a-N + estado compartido
           + resolucion de conflictos + error cascading
           + lifecycle management + coordinacion       = Caos sin framework</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Cada interaccion entre agentes es un punto potencial de fallo. Si tienes N agentes, tienes N*(N-1)/2 posibles canales de comunicacion. Con 5 agentes, son 10 canales. Con 10, son 45. Manejar todo eso a mano es una receta para bugs sutiles e inconsistencias.
    </p>

    <!-- What frameworks abstract -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Lo que un framework abstrae por ti</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-agent-text font-bold text-sm mb-3">Las 6 responsabilidades criticas:</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Agentic loop:</strong> ya implementado y optimizado. No reinventes el while True + LLM call + tool execution.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Tool management:</strong> registrar, validar schemas, ejecutar con error handling, parsear resultados.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">State management:</strong> estado compartido entre agentes sin race conditions ni perdida de datos.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Handoffs:</strong> transferir control entre agentes con el contexto correcto, sin perder informacion critica.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Guardrails:</strong> validacion de input/output como ciudadanos de primera clase, no como parches.</p>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent">&#9654;</span>
          <p class="text-sm text-agent-muted"><strong class="text-agent-text">Observabilidad:</strong> tracing, logging, metricas de latencia, costo por request, debugging.</p>
        </div>
      </div>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      Ademas de estas 6, un buen framework maneja <strong class="text-agent-text">error propagation</strong> (que pasa cuando un worker falla en medio de una orquestacion), <strong class="text-agent-text">context passing</strong> (como filtrar el contexto relevante al pasar de un agente a otro), y <strong class="text-agent-text">lifecycle management</strong> (iniciar, pausar, resumir, y terminar agentes de forma limpia).
    </p>

    <!-- Historical context -->
    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">La evolucion del ecosistema de frameworks ha sido vertiginosa. En 2024, la mayoria del codigo de agentes era custom: cada empresa reinventaba su propio loop, su propio manejo de tools, su propio sistema de handoffs. En 2025, los frameworks principales maduraron (LangGraph, CrewAI, AutoGen) y los proveedores lanzaron sus SDKs oficiales (Claude Agent SDK, OpenAI Agents SDK). En 2026, el ecosistema alcanzo una madurez donde los conceptos se estandarizaron y las APIs convergieron. Hoy, los conceptos que aprendes en un framework se transfieren a otros.</p>
    </div>

    <!-- Anthropic's golden rule -->
    <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4 mb-4">
      <p class="text-agent-warning font-bold text-sm">Principio de Anthropic</p>
      <p class="text-sm text-agent-muted mt-1">"Empieza con el sistema mas simple posible y solo agrega complejidad cuando la evidencia lo justifique." Muchas veces un solo agente con buenas herramientas es suficiente. No uses multi-agente porque suena cool. Cada agente adicional anade latencia, costo, y puntos de fallo.</p>
    </div>

    <!-- Error comun -->
    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Elegir el framework mas complejo porque parece "mas profesional". Un desarrollador que usa LangGraph para un chatbot simple esta agregando complejidad gratuita. Es como disenar una arquitectura de microservicios para un blog personal. El framework correcto no es el mas potente, sino el que <strong class="text-agent-text">resuelve tu problema con la minima complejidad necesaria</strong>. Si un solo agente con Strands resuelve tu caso, no necesitas LangGraph.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Anthropic publico en su guia "Building Effective Agents" que internamente, la mayoria de sus sistemas de produccion NO usan frameworks complejos. Usan patrones simples: un agente con herramientas, o a lo sumo, un pipeline de 2-3 agentes. Solo para los casos mas complejos (como Claude Code con Agent Teams) utilizan orquestacion multi-agente sofisticada. La simplicidad no es debilidad; es disciplina de ingenieria.</p>
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
        <p class="text-xs text-agent-muted mt-1">Un LLM configurado con instrucciones, herramientas y guardrails. Es la unidad basica. Piensa en el como un empleado con un rol, responsabilidades, y reglas.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Tool</p>
        <p class="text-xs text-agent-muted mt-1">Funcion Python decorada que el agente puede invocar. Se registra automaticamente con su schema JSON. El modelo ve la firma y decide cuando usarla.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Handoff</p>
        <p class="text-xs text-agent-muted mt-1">Mecanismo para transferir el control de un agente a otro con contexto relevante. El modelo decide cuando hacer handoff basado en las instrucciones.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Guardrail</p>
        <p class="text-xs text-agent-muted mt-1">Validacion que corre antes o despues de cada accion del agente para garantizar seguridad. Puede abortar la ejecucion si detecta un problema.</p>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      La filosofia del Claude Agent SDK es la <strong class="text-agent-text">confianza en el modelo</strong>. En vez de que el desarrollador defina un grafo rigido de "primero haz A, luego B, luego C", le das herramientas y contexto al modelo, y Claude decide el mejor camino. Esto funciona especialmente bien con modelos de alta capacidad (Claude Opus, Claude Sonnet) que entienden contexto complejo y toman decisiones sofisticadas.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      El sistema de handoffs permite crear redes de agentes especializados. Un agente "triage" puede evaluar la solicitud del usuario y transferir a un agente de soporte tecnico, un agente de ventas, o un agente de billing segun la necesidad. Cada handoff lleva el contexto relevante, no todo el historial, lo que mantiene los costos bajos y la precision alta.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Anthropic usa su propio SDK internamente para construir Claude Code, que es uno de los agentes de coding mas avanzados en produccion. Claude Code opera con un approach model-driven puro: tiene docenas de herramientas (leer archivos, escribir archivos, ejecutar comandos, buscar codigo) y el modelo decide cual usar en cada momento. El feature "Agent Teams" de Claude Code usa multiples agentes en paralelo, cada uno trabajando en una subtarea, coordinados por un orquestador central. Esto demuestra que el approach model-driven funciona incluso para problemas complejos.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Equipos que ya usan Claude API</li>
          <li>Cuando la flexibilidad del modelo es clave</li>
          <li>Problemas que se benefician de razonamiento avanzado</li>
          <li>Prototipado rapido de agentes simples</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Flujos 100% deterministas (usa graph-driven)</li>
          <li>Cuando necesitas reproduciblidad exacta del flujo</li>
          <li>Equipos que requieren vendor-agnostic estricto</li>
          <li>Pipelines donde el orden es rigido e inmutable</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La diferencia entre "model-driven" y "graph-driven" es equivalente a la diferencia entre un equipo autonomo y un proceso de manufactura. En model-driven, le dices al equipo "logra este objetivo" y confias en su juicio. En graph-driven, defines cada paso del proceso. Ambos son validos, pero la eleccion depende de cuanta confianza tienes en el "juicio" del modelo y cuanto control necesitas sobre el flujo.</p>
    </div>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      Lo que hace unico al OpenAI Agents SDK es su enfoque en <strong class="text-agent-text">observabilidad desde el dia uno</strong>. El sistema de tracing registra cada decision del modelo, cada tool call, cada handoff, y cada evaluacion de guardrail. Esto no es un add-on: esta integrado en el core del framework. Cuando algo falla en produccion, puedes rastrear exactamente que paso, en que orden, y por que.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      El patron de <strong class="text-agent-text">ejecucion optimista</strong> de los guardrails es clave para entender la arquitectura. En vez de esperar a que el guardrail apruebe antes de que el agente actue (lo cual seria lento), el agente trabaja MIENTRAS el guardrail analiza en paralelo. Si el guardrail detecta un problema, aborta la ejecucion. Esto es rapido pero implica que las tool calls ya ejecutadas no se revierten.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">AgentKit</strong> agrega un builder visual para crear agentes sin escribir codigo (low-code), util para prototipar rapidamente. Pero no te confundas: AgentKit es para prototipos y demos. Los sistemas de produccion serios se construyen con el SDK programatico donde tienes control total.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Sistemas que requieren seguridad by design</li>
          <li>Cuando necesitas tracing detallado en produccion</li>
          <li>Equipos que valoran guardrails declarativos</li>
          <li>Prototipado rapido con AgentKit + produccion con SDK</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Equipos que necesitan soporte multi-modelo</li>
          <li>Cuando el vendor lock-in con OpenAI es un problema</li>
          <li>Flujos complejos con ciclos y condiciones anidadas</li>
          <li>Presupuestos limitados (los modelos de OpenAI tienden a ser mas caros)</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">OpenAI originalmente tenia un framework llamado "Swarm" que era experimental. El Agents SDK es su evolucion production-ready. La transicion de Swarm a Agents SDK refleja la madurez del ecosistema: lo que empezo como un experimento de investigacion ahora es una herramienta de produccion con tracing, guardrails, y soporte enterprise.</p>
    </div>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      La filosofia de Strands es <strong class="text-agent-text">"model-first"</strong>, que es sutilmente distinta de "model-driven". En model-first, el modelo no solo decide que herramientas usar, sino que el framework entero esta diseado para que el modelo sea el componente central con la minima friccion posible. No hay capas de abstraccion entre tu y el modelo. No hay clases intermedias que aprender. Es Python puro con decoradores.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La decision de ser <strong class="text-agent-text">Apache 2.0</strong> no es trivial. Significa que puedes usar Strands sin ninguna obligacion legal, forkear el codigo, modificarlo, y distribuirlo en productos comerciales. AWS lo diseño asi deliberadamente: quieren que las empresas lo adopten sin friction legal, y despues naturalmente usen AWS Bedrock para el hosting del modelo.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Amazon Q Developer, el asistente de IA de AWS para desarrolladores, esta construido sobre Strands internamente. Cuando Q Developer analiza tu codigo, sugiere mejoras, o genera tests, esta usando agentes Strands que se conectan a los servicios de AWS (CodeWhisperer, Bedrock, etc). Esto significa que Strands no es un framework teorico: esta en produccion a escala de Amazon, procesando millones de requests diarios.</p>
    </div>

    <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4 mb-4">
      <p class="text-agent-success font-bold text-sm">Ventaja clave</p>
      <p class="text-sm text-agent-muted mt-1">Open source real (Apache 2.0), sin vendor lock-in. Funciona con cualquier LLM, no solo modelos de AWS. Integracion nativa con servicios AWS (Bedrock, Lambda, S3). Si tu infraestructura ya es AWS, Strands elimina semanas de trabajo de integracion.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Equipos con infraestructura AWS existente</li>
          <li>Cuando la simplicidad es prioridad #1</li>
          <li>Produccion rapida sin curva de aprendizaje</li>
          <li>Equipos chicos que necesitan algo que funcione HOY</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Orquestaciones multi-agente complejas</li>
          <li>Cuando necesitas grafos de estado con ciclos</li>
          <li>Guardrails avanzados como first-class citizens</li>
          <li>Comunidad mas pequena que LangGraph o CrewAI</li>
        </ul>
      </div>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      La potencia de LangGraph radica en que te da un <strong class="text-agent-text">canvas en blanco</strong>. Tu defines cada nodo (que puede ser una funcion Python, un LLM call, una API call, o cualquier cosa), cada edge (que puede ser condicional basado en el estado), y el estado compartido (un TypedDict que todos los nodos leen y escriben). Esto te da control absoluto sobre el flujo de ejecucion.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La funcionalidad de <strong class="text-agent-text">checkpoints</strong> es unica en LangGraph. Puedes guardar el estado del grafo en cualquier punto y resumirlo despues. Esto es fundamental para flujos que requieren aprobacion humana: el grafo se ejecuta hasta el nodo de aprobacion, se pausa, espera la decision humana, y continua. Ningun otro framework hace esto tan elegantemente.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Sin embargo, esta flexibilidad tiene un costo. El debugging de grafos de estado complejos es notoriamente dificil. Un edge condicional mal configurado puede crear loops infinitos silenciosos. Un nodo que modifica el estado de forma inesperada puede romper todos los nodos downstream. Necesitas disciplina rigurosa en el manejo del estado.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Usar LangGraph para problemas simples. Si tu flujo es "agente A pasa a agente B que pasa a agente C", no necesitas un grafo de estado. Un pipeline simple o handoffs basicos son suficientes. LangGraph brilla cuando tienes ciclos, condiciones complejas, o paralelismo con sincronizacion. Usarlo para un flujo lineal es over-engineering.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Flujos con ciclos y condiciones complejas</li>
          <li>Paralelismo con sincronizacion precisa</li>
          <li>Workflows que requieren checkpoints y pausas</li>
          <li>Equipos experimentados que necesitan control total</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Equipos nuevos en agentes (curva de aprendizaje alta)</li>
          <li>Flujos lineales simples (over-engineering)</li>
          <li>Prototipado rapido (demasiado codigo boilerplate)</li>
          <li>Debugging en produccion sin experiencia (grafos opacos)</li>
        </ul>
      </div>
    </div>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      La metafora del equipo es la mayor fortaleza de CrewAI y tambien su limitacion. Es increiblemente intuitivo: defines roles como harias con personas reales. El "Investigador Senior" con 10 anos de experiencia es un concepto que cualquier product manager entiende. Esto hace que CrewAI sea excelente para comunicar la arquitectura del sistema a stakeholders no tecnicos.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      CrewAI soporta dos modos de ejecucion: <strong class="text-agent-text">sequential</strong> (tareas una tras otra) y <strong class="text-agent-text">hierarchical</strong> (un manager coordina a los workers). El modo jerarquico agrega un agente "manager" que decide el orden de ejecucion y puede reasignar tareas si un worker no produce resultados satisfactorios.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La limitacion principal es el <strong class="text-agent-text">control granular</strong>. No puedes definir condiciones complejas entre tareas, no tienes grafos de estado, y el paralelismo es limitado. Si tu problema encaja en el modelo de "equipo con roles", CrewAI es fantastico. Si no, te vas a sentir atrapado.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Pipelines con roles claros y definidos</li>
          <li>Equipos que quieren algo intuitivo rapidamente</li>
          <li>Comunicar arquitectura a stakeholders no tecnicos</li>
          <li>Workflows de contenido (investigar, escribir, editar)</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Flujos con condiciones complejas o ciclos</li>
          <li>Paralelismo fino con sincronizacion</li>
          <li>Cuando necesitas checkpoints o pausas</li>
          <li>Problemas donde los "roles" no son claros</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">CrewAI fue creado por Joao Moura y crecio rapidamente en la comunidad open source gracias a su API intuitiva. Con mas de 25K stars en GitHub, es uno de los frameworks mas populares. Sin embargo, la comunidad ha notado que CrewAI tiene limitaciones significativas en produccion a escala, particularmente en manejo de errores y observabilidad, areas donde los SDKs de proveedores (Claude, OpenAI) son mas robustos.</p>
    </div>
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

    <p class="text-agent-muted leading-relaxed mb-4">
      El patron conversacional de AutoGen imita como los humanos colaboran: a traves del dialogo. Esto es especialmente poderoso para tareas que requieren <strong class="text-agent-text">deliberacion</strong>. Cuando un agente coder escribe codigo y un agente reviewer lo critica, el intercambio de ida y vuelta mejora iterativamente la calidad del resultado, similar a un code review humano.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      AutoGen soporta <strong class="text-agent-text">human-in-the-loop</strong> como un agente mas en la conversacion. El UserProxyAgent puede representar a un humano que interviene cuando se necesita aprobacion o cuando los agentes estan atascados. Esto crea un modelo hibrido IA-humano muy natural.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La version mas reciente, <strong class="text-agent-text">AutoGen 0.4+ (AG2)</strong>, fue una reescritura significativa que mejoro la modularidad y agrego soporte para multiples modelos y proveedores. Sin embargo, la migracion desde versiones anteriores no es trivial, lo que creo fragmentacion en la comunidad.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Code review y mejora iterativa</li>
          <li>Debate y consenso entre perspectivas</li>
          <li>Tareas que necesitan human-in-the-loop natural</li>
          <li>Revision de documentos con multiples revisores</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Pipelines secuenciales sin interaccion</li>
          <li>Tareas paralelas que no necesitan debate</li>
          <li>Equipos que necesitan estabilidad (version fragmentada)</li>
          <li>Produccion a escala (documentacion inconsistente)</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La conversacion entre agentes es costosa en tokens. Cada intercambio de ida y vuelta consume tokens de input y output para AMBOS agentes. Un debate de 10 turnos entre 2 agentes puede consumir 10-20x mas tokens que un pipeline secuencial equivalente. El trade-off es calidad vs costo: la deliberacion mejora el resultado pero multiplica el gasto.</p>
    </div>
  </section>

  <!-- NEW Section: Google ADK -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">8. Google ADK (Agent Development Kit)</h2>
    <div class="flex items-center gap-2 mb-4">
      <span class="badge bg-blue-400/20 text-blue-300 border border-blue-400/30">Python</span>
      <span class="badge bg-agent-success/20 text-agent-success border border-agent-success/30">Safety-first</span>
      <span class="badge bg-agent-accent/20 text-agent-accent border border-agent-accent/30">Apache 2.0</span>
    </div>
    <p class="text-agent-muted leading-relaxed mb-4">
      Google entro al juego de frameworks con ADK, y su diferenciador es claro: <strong class="text-agent-text">safety como ciudadano de primera clase</strong>. No es un afterthought, no es un plugin: la seguridad esta integrada en la arquitectura fundamental del framework.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      ADK introduce el concepto de <strong class="text-agent-text">callbacks de seguridad</strong> en cada punto critico del ciclo de vida del agente: antes de procesar input, antes de ejecutar tools, despues de generar output. Estos callbacks son obligatorios, no opcionales. El framework te OBLIGA a pensar en seguridad desde el diseno.
    </p>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4">from google.adk import Agent, SafetyConfig

# La seguridad es parte del constructor, no un add-on
agent = Agent(
    model="gemini-2.0-flash",
    safety=SafetyConfig(
        block_dangerous_content=True,
        require_grounding=True,     # Requiere fuentes
        max_tool_calls=10,          # Rate limiting nativo
    ),
    tools=[search, calculator],
)

# La evaluacion tambien es first-class
from google.adk.eval import evaluate
results = evaluate(agent, test_cases=my_eval_suite)</pre>`}

    <p class="text-agent-muted leading-relaxed mb-4">
      Otro aspecto unico de ADK es la integracion con <strong class="text-agent-text">Vertex AI</strong> para evaluacion. Puedes definir suites de evaluacion como parte del pipeline de CI/CD: cada vez que cambias el prompt o las herramientas de tu agente, un pipeline automatizado evalua el impacto en la calidad y seguridad del sistema.
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Google usa ADK internamente para construir agentes en productos como Google Workspace (asistente de Gmail, Google Docs AI). La razon por la que safety es first-class es pragmatica: cuando tu agente opera sobre el email de mil millones de usuarios, no puedes permitirte un incidente de seguridad. ADK nacio de esa necesidad real.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Mejor para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Sistemas que requieren seguridad rigurosa</li>
          <li>Equipos en infraestructura Google Cloud</li>
          <li>Cuando la evaluacion automatizada es critica</li>
          <li>Agentes que procesan datos sensibles de usuarios</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">No ideal para</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Equipos sin infraestructura Google Cloud</li>
          <li>Prototipado rapido (mas boilerplate de seguridad)</li>
          <li>Comunidad mas pequena que otras opciones</li>
          <li>Documentacion aun en fase de maduracion</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Section: Tabla Comparativa (expanded) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">9. Tabla Comparativa</h2>
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
            <th class="text-center text-agent-text py-3 px-3">Google ADK</th>
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
            <td class="py-2 px-3 text-center">Safety-first</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Complejidad</td>
            <td class="py-2 px-3 text-center text-agent-success">Baja</td>
            <td class="py-2 px-3 text-center text-agent-success">Baja</td>
            <td class="py-2 px-3 text-center text-agent-success">Muy baja</td>
            <td class="py-2 px-3 text-center text-agent-danger">Alta</td>
            <td class="py-2 px-3 text-center text-agent-warning">Media</td>
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
            <td class="py-2 px-3 text-center">Callbacks</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Guardrails</td>
            <td class="py-2 px-3 text-center">Si</td>
            <td class="py-2 px-3 text-center text-agent-accent">First-class</td>
            <td class="py-2 px-3 text-center">Manual</td>
            <td class="py-2 px-3 text-center">Manual</td>
            <td class="py-2 px-3 text-center">Limitado</td>
            <td class="py-2 px-3 text-center">Manual</td>
            <td class="py-2 px-3 text-center text-agent-accent">First-class</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Curva aprend.</td>
            <td class="py-2 px-3 text-center text-agent-success">1-2 dias</td>
            <td class="py-2 px-3 text-center text-agent-success">1-2 dias</td>
            <td class="py-2 px-3 text-center text-agent-success">Horas</td>
            <td class="py-2 px-3 text-center text-agent-danger">1-2 semanas</td>
            <td class="py-2 px-3 text-center text-agent-warning">2-3 dias</td>
            <td class="py-2 px-3 text-center text-agent-warning">3-5 dias</td>
            <td class="py-2 px-3 text-center text-agent-warning">2-3 dias</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Documentacion</td>
            <td class="py-2 px-3 text-center text-agent-success">Excelente</td>
            <td class="py-2 px-3 text-center text-agent-success">Buena</td>
            <td class="py-2 px-3 text-center text-agent-warning">Creciendo</td>
            <td class="py-2 px-3 text-center text-agent-success">Extensa</td>
            <td class="py-2 px-3 text-center text-agent-warning">Buena</td>
            <td class="py-2 px-3 text-center text-agent-danger">Fragmentada</td>
            <td class="py-2 px-3 text-center text-agent-warning">Creciendo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Debugging</td>
            <td class="py-2 px-3 text-center">Bueno</td>
            <td class="py-2 px-3 text-center text-agent-accent">Excelente (tracing)</td>
            <td class="py-2 px-3 text-center">Basico</td>
            <td class="py-2 px-3 text-center text-agent-danger">Dificil</td>
            <td class="py-2 px-3 text-center">Regular</td>
            <td class="py-2 px-3 text-center">Regular</td>
            <td class="py-2 px-3 text-center">Bueno</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-text font-medium">Licencia</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">Apache 2.0</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">MIT</td>
            <td class="py-2 px-3 text-center">CC-BY-4.0</td>
            <td class="py-2 px-3 text-center">Apache 2.0</td>
          </tr>
          <tr>
            <td class="py-2 px-4 text-agent-text font-medium">Superpower</td>
            <td class="py-2 px-3 text-center">Integracion Claude</td>
            <td class="py-2 px-3 text-center">Tracing + Guardrails</td>
            <td class="py-2 px-3 text-center">Simplicidad AWS</td>
            <td class="py-2 px-3 text-center">Control total</td>
            <td class="py-2 px-3 text-center">Equipos intuitivos</td>
            <td class="py-2 px-3 text-center">Debate agentes</td>
            <td class="py-2 px-3 text-center">Safety nativo</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- NEW Section: Como Migrar Entre Frameworks -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">10. Como Migrar Entre Frameworks</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Aqui esta la buena noticia: los <strong class="text-agent-text">conceptos son universales</strong>, solo las APIs cambian. Un agente es un agente, una herramienta es una herramienta, un handoff es un handoff. Si entiendes los conceptos de los modulos anteriores, migrar entre frameworks es aprender una nueva API, no aprender una nueva disciplina.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Mapeo de conceptos entre frameworks</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg overflow-x-auto mb-4">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-agent-border bg-agent-dark">
            <th class="text-left text-agent-text py-3 px-4">Concepto</th>
            <th class="text-left text-agent-text py-3 px-3">Claude SDK</th>
            <th class="text-left text-agent-text py-3 px-3">OpenAI SDK</th>
            <th class="text-left text-agent-text py-3 px-3">LangGraph</th>
            <th class="text-left text-agent-text py-3 px-3">CrewAI</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted text-xs">
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-accent">Agente</td>
            <td class="py-2 px-3">Agent()</td>
            <td class="py-2 px-3">Agent()</td>
            <td class="py-2 px-3">Node (funcion)</td>
            <td class="py-2 px-3">Agent(role, goal)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-accent">Herramienta</td>
            <td class="py-2 px-3">@Tool</td>
            <td class="py-2 px-3">function_tool()</td>
            <td class="py-2 px-3">tools=[...]</td>
            <td class="py-2 px-3">tools=[...]</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-accent">Transferencia</td>
            <td class="py-2 px-3">Handoff</td>
            <td class="py-2 px-3">Handoff</td>
            <td class="py-2 px-3">Edge (conditional)</td>
            <td class="py-2 px-3">Task delegation</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-2 px-4 text-agent-accent">Estado</td>
            <td class="py-2 px-3">Context</td>
            <td class="py-2 px-3">RunContext</td>
            <td class="py-2 px-3">StateGraph</td>
            <td class="py-2 px-3">Task output</td>
          </tr>
          <tr>
            <td class="py-2 px-4 text-agent-accent">Seguridad</td>
            <td class="py-2 px-3">Guardrail</td>
            <td class="py-2 px-3">InputGuardrail</td>
            <td class="py-2 px-3">Custom node</td>
            <td class="py-2 px-3">Manual</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-agent-muted leading-relaxed mb-4">
      La clave de una migracion exitosa es separar la <strong class="text-agent-text">logica de negocio</strong> del <strong class="text-agent-text">codigo del framework</strong>. Si tus herramientas (funciones Python que buscan en la base de datos, llaman APIs, procesan archivos) son independientes del framework, migrar es simplemente cambiar como registras y ejecutas esas herramientas. Si toda tu logica esta acoplada a las clases del framework, la migracion sera dolorosa.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Aplica los mismos principios de Clean Architecture que usarias en backend: la logica de negocio no debe depender del framework. Tus herramientas son "use cases", el framework es un "delivery mechanism". Si cambias el mecanismo de delivery (de CrewAI a LangGraph), los use cases no deberian cambiar.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Acoplar la logica de negocio al framework. Si tu funcion de "buscar en la base de datos" recibe un objeto LangGraphState como parametro en vez de un string query, ahora tu funcion de negocio depende de LangGraph y migrar es una reescritura completa. Mantene tus herramientas como funciones Python puras que reciben y devuelven tipos basicos.</p>
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