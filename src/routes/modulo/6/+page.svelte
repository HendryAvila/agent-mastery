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

  // ─── InteractiveFlow: How Agents Think ───
  const flowNodes = [
    { id: 'problem', label: 'Problema', description: 'Un problema complejo llega al agente. Dependiendo de la estrategia de razonamiento elegida, el agente procesara el problema de manera radicalmente diferente. La eleccion de estrategia afecta la calidad, velocidad y costo de la respuesta.', icon: '❓', x: 10, y: 50 },
    // CoT path (top)
    { id: 'cot-start', label: 'CoT: Paso 1', description: 'Chain-of-Thought arranca con un razonamiento lineal. El modelo genera el primer paso logico explicito: identifica los datos relevantes del problema y establece que necesita resolver.', icon: '1️⃣', x: 30, y: 15 },
    { id: 'cot-mid', label: 'CoT: Paso 2', description: 'El razonamiento avanza secuencialmente. Cada paso se construye sobre el anterior. El modelo desarrolla la logica intermedia, aplicando reglas o calculando valores.', icon: '2️⃣', x: 50, y: 15 },
    { id: 'cot-end', label: 'CoT: Conclusion', description: 'El razonamiento lineal llega a una conclusion. Es directo y eficiente, pero si un paso intermedio es incorrecto, toda la cadena puede llevar a una respuesta erronea. No hay backtracking.', icon: '🎯', x: 70, y: 15 },
    // ToT path (middle)
    { id: 'tot-branch', label: 'ToT: Ramificar', description: 'Tree-of-Thought genera multiples caminos de razonamiento en paralelo. En vez de un solo hilo de pensamiento, el modelo explora 2-3 rutas diferentes para resolver el mismo problema.', icon: '🌳', x: 30, y: 50 },
    { id: 'tot-eval', label: 'ToT: Evaluar', description: 'Cada rama se evalua: cual es mas prometedora? El modelo puede descartar ramas que no llevan a resultados utiles y profundizar en las que si. Permite backtracking: si una rama falla, se prueba otra.', icon: '⚖️', x: 50, y: 50 },
    { id: 'tot-select', label: 'ToT: Seleccionar', description: 'Se selecciona la rama con el mejor resultado. Mas lento y costoso que CoT, pero significativamente mejor para problemas con multiples soluciones posibles o donde el camino correcto no es obvio.', icon: '✨', x: 70, y: 50 },
    // ReAct path (bottom)
    { id: 'react-think', label: 'ReAct: Thought', description: 'El agente primero piensa en voz alta: "Necesito buscar X porque..." Este paso de razonamiento explicito ANTES de actuar mejora drasticamente la precision de las acciones posteriores.', icon: '💭', x: 30, y: 85 },
    { id: 'react-act', label: 'ReAct: Action', description: 'Basandose en su razonamiento, el agente ejecuta una accion: llama una herramienta, busca informacion, ejecuta codigo. La accion esta justificada por el pensamiento previo.', icon: '⚡', x: 50, y: 85 },
    { id: 'react-observe', label: 'ReAct: Observe', description: 'El agente observa el resultado de su accion y piensa de nuevo: "El resultado fue X, esto significa que..." y decide si necesita mas acciones o ya tiene la respuesta. El loop Thought-Action-Observation se repite.', icon: '👁️', x: 70, y: 85 },
    // Final
    { id: 'answer', label: 'Respuesta', description: 'Todas las estrategias convergen en una respuesta. CoT es rapida y barata pero lineal. ToT es lenta y cara pero explora multiples caminos. ReAct combina razonamiento con acciones reales. La eleccion depende del problema.', icon: '✅', x: 90, y: 50 }
  ];

  const flowEdges = [
    { from: 'problem', to: 'cot-start', label: 'CoT' },
    { from: 'problem', to: 'tot-branch', label: 'ToT' },
    { from: 'problem', to: 'react-think', label: 'ReAct' },
    { from: 'cot-start', to: 'cot-mid' },
    { from: 'cot-mid', to: 'cot-end' },
    { from: 'cot-end', to: 'answer' },
    { from: 'tot-branch', to: 'tot-eval' },
    { from: 'tot-eval', to: 'tot-select' },
    { from: 'tot-select', to: 'answer' },
    { from: 'react-think', to: 'react-act' },
    { from: 'react-act', to: 'react-observe' },
    { from: 'react-observe', to: 'react-think', label: 'Loop' },
    { from: 'react-observe', to: 'answer' }
  ];

  const flowChallenges = [
    { question: 'Cual estrategia permite al agente DESCARTAR un camino de razonamiento y probar otro?', targetNodeId: 'tot-eval', hint: 'Una de las estrategias evalua multiples ramas y permite backtracking.' },
    { question: 'En ReAct, que paso ocurre ANTES de ejecutar cualquier accion?', targetNodeId: 'react-think', hint: 'El agente primero razona sobre que hacer y por que.' },
    { question: 'Que nodo representa el cuello de botella de Chain-of-Thought: si falla, TODO falla?', targetNodeId: 'cot-mid', hint: 'En una cadena lineal, cada paso depende del anterior.' },
    { question: 'Donde convergen las tres estrategias?', targetNodeId: 'answer', hint: 'Todas las rutas llevan al mismo destino final.' }
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Un agente necesita recordar las preferencias del usuario entre sesiones (tema oscuro, idioma, frameworks favoritos). Que tipo de memoria y que tecnologia usarias?',
      options: [
        { text: 'Memoria corta (context window) - simplemente mantener las preferencias en el historial', correct: false, explanation: 'La memoria corta vive solo en el context window de una sesion. Cuando la sesion termina o el contexto se comprime, las preferencias se pierden. No es persistente.' },
        { text: 'Memoria larga en vector database (Pinecone, Weaviate) con embeddings de preferencias', correct: false, explanation: 'Vector databases son excelentes para busqueda semantica, pero las preferencias del usuario son datos estructurados simples (key-value). Usar embeddings aca es matar moscas con un canon.' },
        { text: 'Memoria larga en key-value store (Redis, archivo JSON) para datos estructurados de preferencias', correct: true, explanation: 'Correcto! Las preferencias son datos estructurados simples. Un key-value store es rapido, eficiente, y permite lectura/escritura directa sin necesidad de embeddings. Se carga al inicio de cada sesion en el system prompt o como contexto adicional.' },
        { text: 'Memoria episodica - guardar cada conversacion completa del usuario', correct: false, explanation: 'Guardar conversaciones enteras es excesivo para preferencias. La memoria episodica es util para recordar experiencias pasadas, no para datos de configuracion.' }
      ]
    },
    {
      question: 'Cuando es Tree-of-Thought PEOR que Chain-of-Thought?',
      options: [
        { text: 'Nunca, ToT siempre es superior porque explora mas opciones', correct: false, explanation: 'Falso. ToT genera multiples caminos lo que consume MUCHO mas tokens y tiempo. Para problemas simples, es desperdicio de recursos.' },
        { text: 'Cuando el problema es straightforward y tiene una solucion obvia - ToT anade latencia y costo innecesarios', correct: true, explanation: 'Correcto! Si el problema tiene una solucion clara y lineal (ej: "convierte Celsius a Fahrenheit"), generar 3 ramas de razonamiento paralelas es desperdicio. CoT resuelve en un paso. ToT brilla en problemas ambiguos con multiples caminos posibles (ej: disenar una arquitectura).' },
        { text: 'Cuando el LLM tiene un context window pequeno', correct: false, explanation: 'Si bien ToT consume mas tokens, el context window no es la razon principal por la que es peor. El problema es la relacion costo/beneficio para problemas simples.' },
        { text: 'Cuando se usan herramientas externas', correct: false, explanation: 'ToT puede funcionar perfectamente con herramientas. De hecho, ReAct (que usa herramientas) puede beneficiarse de explorar multiples caminos de accion.' }
      ],
      source: 'Chain-of-Thought Prompting (Wei et al. 2022)',
      sourceUrl: 'https://arxiv.org/abs/2201.11903'
    },
    {
      question: 'Un agente usando ReAct hace 3 observaciones pero llega a una conclusion incorrecta. Cual es el problema MAS probable?',
      options: [
        { text: 'Las herramientas retornaron datos correctos pero el agente interpreto mal las observaciones en su paso de Thought', correct: true, explanation: 'Correcto! El punto debil de ReAct es la fase de Thought (razonamiento). Si las observaciones son correctas pero el razonamiento sobre ellas es incorrecto, el agente llega a conclusiones erroneas. Es un problema de RAZONAMIENTO, no de DATOS. Se mitiga con prompts mas especificos y extended thinking.' },
        { text: 'Las 3 herramientas fallaron silenciosamente y retornaron datos corruptos', correct: false, explanation: 'Posible pero improbable que las 3 fallen. Ademas, con buen error handling, las fallas se detectan. El problema mas comun es el razonamiento, no los datos.' },
        { text: 'El context window se lleno y el agente perdio las primeras observaciones', correct: false, explanation: 'Con solo 3 observaciones, es casi imposible llenar el context window. Este problema ocurre con decenas de iteraciones, no tres.' },
        { text: 'ReAct no funciona bien con mas de 2 observaciones', correct: false, explanation: 'ReAct puede manejar muchas observaciones. No hay un limite magico en 2. El patron esta disenado para loops extensos.' }
      ],
      source: 'ReAct: Synergizing Reasoning and Acting (Yao et al. 2022)',
      sourceUrl: 'https://arxiv.org/abs/2210.03629'
    },
    {
      question: 'Por que extended thinking mejora la calidad pero puede ser problematico en produccion?',
      options: [
        { text: 'Porque los thinking blocks son visibles para el usuario y pueden revelar informacion sensible', correct: false, explanation: 'Los thinking blocks pueden ocultarse al usuario. El problema no es la visibilidad sino el impacto en rendimiento y costos.' },
        { text: 'Porque anade latencia significativa (segundos a minutos) y consume muchos mas tokens, aumentando tanto el tiempo de respuesta como el costo por peticion', correct: true, explanation: 'Correcto! Extended thinking puede generar miles de tokens de razonamiento interno antes de responder. En produccion, esto significa: 3-10x mas latencia, 3-10x mas tokens facturados, y usuarios esperando mucho mas. Se debe usar selectivamente para tareas que realmente lo necesitan, no para todo.' },
        { text: 'Porque solo funciona con Claude y no es portable a otros modelos', correct: false, explanation: 'Aunque la implementacion especifica varia, otros modelos tienen capacidades similares (reasoning de OpenAI, etc). El problema real es practico, no de portabilidad.' },
        { text: 'Porque el thinking no es determinista y puede dar resultados diferentes cada vez', correct: false, explanation: 'La no-determinismo existe con o sin extended thinking. Todos los LLMs son estocasticos por defecto (a menos que uses temperature=0).' }
      ]
    },
    {
      question: 'Estas disenando un sistema de memoria para un agente de soporte tecnico. Cual combinacion de memorias es la MAS efectiva?',
      options: [
        { text: 'Solo memoria corta (context window) - suficiente para resolver tickets', correct: false, explanation: 'La memoria corta no persiste entre sesiones. Si el mismo usuario vuelve con un problema recurrente, el agente no recordara la solucion anterior.' },
        { text: 'Corta (context de sesion) + Larga (vector DB con documentacion) + Episodica (tickets resueltos similares)', correct: true, explanation: 'Correcto! La combinacion ideal: memoria corta para la conversacion actual, memoria larga con la documentacion del producto (RAG con vector DB), y memoria episodica con tickets resueltos para encontrar soluciones a problemas similares. Las tres capas se complementan.' },
        { text: 'Solo memoria larga (guardar todo en vector DB) - buscar todo por similitud', correct: false, explanation: 'Una sola capa de memoria no es suficiente. La conversacion actual necesita estar en contexto directo, no buscada por similitud. Y las experiencias pasadas se buscan diferente que la documentacion.' },
        { text: 'Corta + Episodica sin documentacion', correct: false, explanation: 'Sin acceso a la documentacion del producto, el agente no puede responder preguntas tecnicas que no haya visto antes. La documentacion como memoria larga es esencial para un agente de soporte.' }
      ]
    },
    {
      question: 'Observa este patron ReAct. Cual es el paso que FALTA?',
      codeBlock: `Thought: Necesito encontrar el archivo que causa el error de importacion.
Action: search_codebase("import UserModel")
Observation: Encontrado en 3 archivos: user.py, admin.py, tests.py
[???]
Action: read_file("user.py")`,
      options: [
        { text: 'Falta un Thought que analice la observacion y decida el siguiente paso', correct: true, explanation: 'Correcto! El patron ReAct es estricto: Thought -> Action -> Observation -> THOUGHT -> Action. Despues de cada observacion, el agente DEBE razonar sobre lo que vio: "El import esta en 3 archivos. Voy a leer user.py primero porque es probablemente la definicion original." Sin este paso, las acciones son aleatorias.' },
        { text: 'Falta validar que los 3 archivos existen', correct: false, explanation: 'La validacion de existencia es responsabilidad de la herramienta, no del patron ReAct. Lo que falta es el razonamiento intermedio.' },
        { text: 'Falta un output/log del proceso', correct: false, explanation: 'El logging es buena practica pero no es parte del patron ReAct. Lo que falta es un Thought entre la Observation y la siguiente Action.' },
        { text: 'No falta nada, el agente puede actuar inmediatamente despues de una observacion', correct: false, explanation: 'Actuar sin razonar es exactamente lo que ReAct busca evitar. El Thought intermedio es lo que da nombre al patron: REason + ACT.' }
      ]
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow does not trigger badge
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    // Badge: brain-architect on 80%+ score
    if (score >= total * 0.8) {
      const badge = courseStore.unlockBadge('brain-architect');
      if (badge) {
        earnedBadge = badge;
        showBadge = true;
      }
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

  <!-- Section 1: Tipos de Memoria -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. Tipos de Memoria</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los humanos tenemos multiples sistemas de memoria. Los agentes tambien necesitan diferentes tipos para funcionar efectivamente. <strong class="text-agent-text">No existe "una sola memoria"</strong> — cada tipo cumple un proposito distinto, y la combinacion inteligente de los tres es lo que separa a un agente basico de uno profesional.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">&#x1F9E0;</p>
        <p class="text-agent-accent font-bold">Memoria Corta</p>
        <p class="text-sm text-agent-muted mt-2">El context window de la conversacion actual. Todo lo que el agente "ve" en este momento: mensajes, tool results, instrucciones.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tu RAM</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">&#x1F4BE;</p>
        <p class="text-agent-accent font-bold">Memoria Larga</p>
        <p class="text-sm text-agent-muted mt-2">Almacenamiento persistente: vector databases, archivos de configuracion, bases de datos. Sobrevive entre sesiones y se consulta bajo demanda.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tu disco duro</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">&#x1F4F8;</p>
        <p class="text-agent-accent font-bold">Memoria Episodica</p>
        <p class="text-sm text-agent-muted mt-2">Registro de experiencias pasadas: que tareas resolvio, que estrategias uso, que errores cometio. Permite aprender de la propia experiencia.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tus recuerdos</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Deep dive: Memoria Corta (Context Window)</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      La memoria corta es simplemente el context window de la llamada actual al LLM. Incluye el system prompt, el historial de mensajes, y los tool results. Es <strong class="text-agent-text">volatil</strong>: cuando la sesion termina, desaparece. Su principal limitacion es el tamaño y el costo.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Implementacion: Sliding Window con prioridad</p>
      {@html `<pre class="code-block text-xs">def manage_short_term_memory(messages, max_tokens=100000):
    """Gestiona el context window priorizando mensajes recientes."""
    # System prompt SIEMPRE se mantiene (es la "personalidad")
    system = [m for m in messages if m["role"] == "system"]

    # Los ultimos N mensajes tienen prioridad
    recent = messages[-20:]  # Ultimos 20 mensajes siempre

    # Mensajes antiguos: solo si hay espacio
    old = messages[len(system):-20]
    available = max_tokens - count_tokens(system + recent)

    kept_old = []
    for msg in reversed(old):
        if count_tokens([msg]) <= available:
            kept_old.insert(0, msg)
            available -= count_tokens([msg])
        else:
            break

    return system + kept_old + recent</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Deep dive: Memoria Larga (Persistente)</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      La memoria larga vive fuera del context window y persiste entre sesiones. Hay dos enfoques principales dependiendo del tipo de datos:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Vector Database (busqueda semantica)</p>
        <p class="text-sm text-agent-muted mb-2">Para documentacion, codigo fuente, knowledge bases. Los datos se convierten en "embeddings" (vectores numericos) que permiten buscar por significado, no por palabras exactas.</p>
        {@html `<pre class="code-block text-xs mt-2">## Ejemplo con Chroma (vector DB ligera)
# 1. Guardar documentacion
collection.add(
    documents=["FastAPI usa Pydantic para validacion..."],
    ids=["doc_1"],
    metadatas=[{"source": "docs/api.md"}]
)

# 2. Buscar por significado
results = collection.query(
    query_texts=["como valido datos de entrada"],
    n_results=5
)
# Retorna fragmentos relevantes aunque no usen
# las mismas palabras exactas</pre>`}
        <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-text">Herramientas:</strong> Pinecone (cloud), Chroma (local), Weaviate, Qdrant</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Key-Value Store (datos estructurados)</p>
        <p class="text-sm text-agent-muted mb-2">Para preferencias, configuraciones, datos que necesitas acceder por clave. No necesita embeddings porque los datos son simples y predecibles.</p>
        {@html `<pre class="code-block text-xs mt-2">## Ejemplo con JSON file o Redis
memory = {
    "user_preferences": {
        "theme": "dark",
        "language": "es",
        "framework": "FastAPI"
    },
    "project_conventions": {
        "test_runner": "pytest",
        "db": "PostgreSQL",
        "style": "Google docstrings"
    }
}

# Cargar al inicio de cada sesion
system_prompt += f"\\nContexto del usuario: {json.dumps(memory)}"</pre>`}
        <p class="text-xs text-agent-muted mt-2"><strong class="text-agent-text">Herramientas:</strong> Redis, archivo JSON, SQLite, DynamoDB</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Deep dive: Memoria Episodica (Experiencias)</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      La memoria episodica es la mas fascinante: permite al agente <strong class="text-agent-text">aprender de su propia experiencia</strong>. No es solo "que paso" sino "que funciono, que no funciono, y que hacer diferente la proxima vez".
    </p>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Claude Code implementa memoria episodica con el archivo <code class="text-agent-accent">~/.claude/agent-memory/MEMORY.md</code>. Cuando el agente descubre un patron, resuelve un problema dificil, o comete un error, puede guardar una nota en este archivo. En sesiones futuras, esas notas se cargan automaticamente en el system prompt. Asi el agente "recuerda" que la version de Pydantic en tu proyecto es v2 y no vuelve a generar codigo con syntax v1.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Estructura de una memoria episodica</p>
      {@html `<pre class="code-block text-xs"># Cada "episodio" almacena:
episode = {
    "timestamp": "2026-02-15T14:30:00",
    "task": "Agregar autenticacion JWT al proyecto",
    "outcome": "success",
    "strategy": "Usar python-jose con RS256, claves en env vars",
    "errors_found": [
        "Primer intento uso HS256, inseguro para produccion",
        "Olvide agregar token expiration"
    ],
    "lessons": [
        "Siempre usar RS256 para JWT en produccion",
        "Verificar que los tokens tengan campo 'exp'",
        "Los tests deben cubrir tokens expirados"
    ],
    "files_modified": ["src/auth/jwt.py", "tests/test_jwt.py"]
}</pre>`}
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Guardar TODO en la memoria episodica. Si cada accion trivial se almacena, la memoria se llena de ruido y el agente pierde la señal importante entre datos irrelevantes. La regla es: solo guarda <strong class="text-agent-text">lecciones, errores significativos, y decisiones arquitectonicas</strong>. No guardes "lei el archivo X" o "ejecute pytest".</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Ejemplo concreto: Claude Code</p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Corta:</strong> la conversacion actual y los archivos leidos. <strong class="text-agent-text">Larga:</strong> CLAUDE.md y archivos de configuracion del proyecto. <strong class="text-agent-text">Episodica:</strong> el archivo MEMORY.md donde guarda lecciones aprendidas entre sesiones. Las tres capas trabajan juntas: la memoria larga da contexto del proyecto, la episodica da experiencia previa, y la corta es donde todo se combina con la tarea actual.
      </p>
    </div>
  </section>

  <!-- Section 2: Chain-of-Thought (CoT) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Chain-of-Thought (CoT)</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La tecnica mas simple pero mas poderosa para mejorar el razonamiento de un LLM. Originada en el paper seminal de <strong class="text-agent-text">Wei et al. (2022)</strong> en Google Research, consiste en hacer que el modelo <strong class="text-agent-text">muestre sus pasos intermedios</strong> antes de llegar a una conclusion. Este descubrimiento cambio fundamentalmente como usamos los LLMs.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El paper original de Chain-of-Thought mostro que simplemente agregar "Let's think step by step" al prompt mejoro la precision matematica de PaLM (540B) del <strong class="text-agent-text">17.7% al 58.1%</strong> en el benchmark GSM8K. Esas cinco palabras triplicaron el rendimiento. Fue uno de los descubrimientos mas impactantes en la historia de los LLMs.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Sin CoT (respuesta directa)</p>
        {@html `<pre class="code-block text-sm">Pregunta: Un repositorio tiene 847 archivos.
Se eliminan 3 carpetas con 120, 89 y 43 archivos.
Se agregan 2 carpetas con 67 y 155 archivos.
Cuantos archivos quedan?

Respuesta: 812
(INCORRECTO - la respuesta es 817)</pre>`}
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Con CoT (paso a paso)</p>
        {@html `<pre class="code-block text-sm">Pensemos paso a paso:
1. Inicio: 847 archivos
2. Se eliminan: 120 + 89 + 43 = 252
3. Despues de eliminar: 847 - 252 = 595
4. Se agregan: 67 + 155 = 222
5. Total final: 595 + 222 = 817

Respuesta: 817 archivos
(CORRECTO)</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Dos sabores de CoT</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Zero-shot CoT</p>
        <p class="text-sm text-agent-muted">Solo necesitas agregar "Piensa paso a paso" al prompt. El modelo genera la cadena de razonamiento automaticamente. Simple, rapido, y sorprendentemente efectivo.</p>
        {@html `<pre class="code-block text-xs mt-2"># Simplemente agrega la instruccion
prompt = f"""
{pregunta}

Piensa paso a paso antes de dar tu respuesta final.
"""</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Few-shot CoT</p>
        <p class="text-sm text-agent-muted">Le das al modelo 2-3 ejemplos de razonamiento paso a paso ANTES de la pregunta. El modelo aprende el formato y lo replica. Mas preciso que zero-shot, pero consume mas tokens.</p>
        {@html `<pre class="code-block text-xs mt-2"># Incluyes ejemplos de razonamiento
prompt = f"""
Ejemplo: Si tengo 5 bugs y arreglo 2, quedan 5-2=3 bugs.

Ejemplo: Si deployment toma 10 min y rollback 3 min,
total = 10+3 = 13 min.

Ahora resuelve: {pregunta_real}
"""</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Ejemplo de CoT en codigo</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      CoT no es solo para matematicas. Funciona tambien para debugging:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-xs">Pregunta: Este endpoint retorna 500 cuando se envia un POST
con un body vacio. Que esta mal?

@router.post("/users")
async def create_user(data: UserCreate):
    user = User(**data.model_dump())
    db.add(user)
    await db.commit()
    return user

CoT del modelo:
1. El endpoint espera UserCreate en el body
2. Si el body esta VACIO, Pydantic intenta validar {} contra UserCreate
3. Si UserCreate tiene campos required, Pydantic lanza ValidationError
4. PERO: FastAPI deberia retornar 422 (Validation Error), no 500
5. Si retorna 500, significa que el error NO es de validacion
6. El problema es User(**data.model_dump()) - si data.model_dump()
   retorna campos que User no acepta, SQLAlchemy lanza un error
7. SOLUCION: verificar que los campos de UserCreate coincidan
   exactamente con los de User, o usar un mapper explicito.</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      CoT funciona porque obliga al modelo a <strong class="text-agent-text">descomponer problemas complejos en pasos manejables</strong>. Cada paso se puede verificar individualmente. Cuando NO usar CoT: preguntas factuales simples ("Que version de Python necesito?") no se benefician de razonamiento paso a paso.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">CoT no es solo una tecnica de prompting: es la base de como los agentes "piensan" internamente. Cuando Claude Code decide que herramienta usar, internamente hace una cadena de razonamiento: "El usuario quiere X. Para X necesito leer el archivo Y. Voy a usar la herramienta Read." Ese proceso interno ES Chain-of-Thought.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Resumen visual: cuando usar cada variante</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4 text-center">
        <p class="text-agent-accent font-bold text-sm mb-1">Zero-shot CoT</p>
        <p class="text-xs text-agent-muted">Rapido de implementar. Bueno para la mayoria de casos. Solo agrega "piensa paso a paso" al prompt.</p>
        <p class="text-xs text-agent-success mt-2">Usa cuando: necesitas una mejora rapida y facil</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4 text-center">
        <p class="text-agent-accent font-bold text-sm mb-1">Few-shot CoT</p>
        <p class="text-xs text-agent-muted">Necesita ejemplos preparados. Mas preciso en dominios especificos. Consume mas tokens.</p>
        <p class="text-xs text-agent-success mt-2">Usa cuando: tienes un dominio especifico y necesitas precision maxima</p>
      </div>
    </div>
  </section>

  <!-- Section 3: Tree-of-Thought (ToT) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Tree-of-Thought (ToT)</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Chain-of-Thought es lineal: un solo camino. Pero que pasa si el primer camino no es el correcto? <strong class="text-agent-text">Tree-of-Thought</strong> explora multiples caminos en paralelo, como un jugador de ajedrez que piensa varias jugadas por adelantado. Introducido por Yao et al. (2023) en Princeton.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-3">Los 4 pasos de ToT</p>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold text-sm">1</span>
          <div>
            <p class="text-agent-text font-bold text-sm">Generar: crear multiples caminos de razonamiento</p>
            <p class="text-xs text-agent-muted">"Puedo resolver esto de 3 formas: A, B, o C..."</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold text-sm">2</span>
          <div>
            <p class="text-agent-text font-bold text-sm">Evaluar: determinar cual camino es mas prometedor</p>
            <p class="text-xs text-agent-muted">"El camino A tiene un problema en el paso 2, B parece viable, C es demasiado complejo..."</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold text-sm">3</span>
          <div>
            <p class="text-agent-text font-bold text-sm">Seleccionar: profundizar en el mejor camino</p>
            <p class="text-xs text-agent-muted">"Sigo con B porque es la mejor relacion calidad/complejidad..."</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-8 h-8 rounded-full bg-agent-accent/20 flex items-center justify-center text-agent-accent font-bold text-sm">4</span>
          <div>
            <p class="text-agent-text font-bold text-sm">Backtrack: si el camino elegido falla, volver y probar otro</p>
            <p class="text-xs text-agent-muted">"B no funciono, vuelvo a intentar con C..."</p>
          </div>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Ejemplo practico: Diseñar un sistema de cache</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-xs">Tarea: "Necesitamos cache para los endpoints mas consultados."

ToT genera 3 ramas:

Rama A: Redis como cache distribuido
  -> Pros: rapido, escalable, TTL nativo
  -> Evaluar: requiere infraestructura adicional
  -> Veredicto: bueno para produccion grande

Rama B: Cache en memoria (lru_cache / cachetools)
  -> Pros: zero dependencias, ultra rapido
  -> Evaluar: no comparte entre instancias
  -> Veredicto: bueno para monolitos single-instance

Rama C: CDN cache (CloudFront, Fastly)
  -> Pros: global, reduce carga del servidor
  -> Evaluar: solo para contenido estatico/idem
  -> Veredicto: complemento, no reemplazo

Seleccion: Depende del contexto del proyecto...
Si hay multiples instancias -> Rama A (Redis)
Si es un monolito -> Rama B (in-memory)
Si son APIs publicas leidas -> Rama A + C (ambos)</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Los agentes de planificacion como los que usan Devin o aider internamente aplican una variante de ToT cuando necesitan decidir la estrategia de implementacion. Generan 2-3 enfoques posibles, evaluan cada uno contra los constraints del proyecto (stack tecnologico, complejidad, tiempo), y ejecutan el mas prometedor. Si ese camino falla, "backtrackean" al segundo mejor.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">CoT vs ToT: cuando usar cada uno</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Aspecto</th>
              <th class="text-left text-agent-text py-2 pr-4">Chain-of-Thought</th>
              <th class="text-left text-agent-text py-2">Tree-of-Thought</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Velocidad</td><td class="py-2 pr-4 text-agent-success">Rapido (1 camino)</td><td class="py-2 text-agent-warning">Lento (3-5 caminos)</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Costo tokens</td><td class="py-2 pr-4 text-agent-success">Normal</td><td class="py-2 text-agent-danger">3-5x mas</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Backtracking</td><td class="py-2 pr-4 text-agent-danger">No</td><td class="py-2 text-agent-success">Si</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Problemas simples</td><td class="py-2 pr-4 text-agent-success">Ideal</td><td class="py-2 text-agent-danger">Overkill</td></tr>
            <tr><td class="py-2 pr-4">Problemas ambiguos</td><td class="py-2 pr-4 text-agent-warning">Puede fallar</td><td class="py-2 text-agent-success">Brilla</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4">
      <p class="text-agent-warning font-bold text-sm">Trade-off importante</p>
      <p class="text-sm text-agent-muted mt-1">ToT consume 3-5x mas tokens que CoT y anade latencia significativa. Usalo solo para problemas complejos con multiples soluciones posibles (diseño de arquitectura, decisiones de stack, debugging de problemas ambiguos). Para problemas con una solucion clara (formatear datos, corregir un typo), CoT es suficiente y mucho mas economico.</p>
    </div>
  </section>

  <!-- Section 4: El Patron ReAct -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. El Patron ReAct</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">ReAct</strong> (Reasoning + Acting) es el patron que usan la mayoria de agentes modernos, incluyendo Claude Code. Introducido por <strong class="text-agent-text">Yao et al. (2022)</strong> en Princeton y Google Research, este patron intercala razonamiento y accion: el agente piensa, actua, observa, y repite. Es probablemente el concepto mas importante de todo este curso.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">ReAct es la base de la mayoria de agentes de codigo modernos. Cuando usas Claude Code, Cursor Agent, o aider, internamente estan ejecutando un loop de ReAct: el modelo <strong class="text-agent-text">piensa</strong> (Thought) sobre que hacer, <strong class="text-agent-text">actua</strong> (Action) ejecutando una herramienta, <strong class="text-agent-text">observa</strong> (Observation) el resultado, y repite. Entender ReAct es entender como funcionan TODOS estos agentes.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El paper original: por que funciona</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Yao et al. probaron que combinar razonamiento con acciones produce mejores resultados que hacer solo una de las dos:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Solo actuar (Act-only)</p>
        <p class="text-xs text-agent-muted">El agente ejecuta herramientas sin razonar. Es rapido pero impreciso: actua "a ciegas" y pierde tiempo en acciones irrelevantes.</p>
      </div>
      <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4">
        <p class="text-agent-warning font-bold text-sm mb-2">Solo razonar (CoT)</p>
        <p class="text-xs text-agent-muted">El agente piensa pero no puede actuar. Si necesita informacion que no tiene en el contexto, no puede ir a buscarla. "Alucina" datos que no tiene.</p>
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">ReAct (Reason + Act)</p>
        <p class="text-xs text-agent-muted">El agente piensa Y actua. Razona sobre que informacion necesita, la busca, observa el resultado, y razona de nuevo. Lo mejor de ambos mundos.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Traza completa de un agente ReAct debuggeando</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">8 pasos de razonamiento interleaved con acciones</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">Thought 1: El usuario reporta un TypeError en process_data().
Necesito encontrar la definicion de esa funcion primero.

Action 1: search_codebase("def process_data")
Observation 1: Encontrado en src/pipeline.py linea 45

Thought 2: Voy a leer la funcion para entender que hace
y donde podria ocurrir el TypeError. Un TypeError suele
ser por pasar un tipo incorrecto a una operacion.

Action 2: read_file("src/pipeline.py", lines="40-70")
Observation 2: La funcion recibe 'data' y hace data.split(",")
en la linea 52.

Thought 3: Si 'data' no es un string sino un int o None,
data.split() lanzara TypeError. Necesito verificar que
tipo se esta pasando. Voy a buscar donde se llama.

Action 3: search_codebase("process_data(")
Observation 3: Llamada en main.py linea 23 con el resultado
de fetch_api() que retorna un dict, no un string.

Thought 4: Encontre el bug. fetch_api() retorna un dict pero
process_data() espera un string. La solucion es extraer
el campo correcto del dict. Voy a verificar la estructura
del dict que retorna fetch_api().

Action 4: read_file("src/api.py", lines="15-30")
Observation 4: fetch_api() retorna {"data": "csv_string", "status": 200}

Thought 5: El fix es claro: en main.py, cambiar
process_data(fetch_api()) a process_data(fetch_api()["data"])
Voy a hacer el cambio y escribir un test para este caso.</pre>`}
    </div>

    <p class="text-agent-muted leading-relaxed mb-3">
      Nota como cada <strong class="text-agent-text">Thought</strong> justifica la proxima <strong class="text-agent-text">Action</strong>, y cada <strong class="text-agent-text">Observation</strong> alimenta el siguiente Thought. Este ciclo es lo que hace a ReAct tan efectivo: el agente no actua a ciegas, razona sobre cada paso. Nunca hay una Action sin un Thought previo que la justifique.
    </p>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Saltarse el paso de Thought y pasar directamente de Observation a Action. Si el agente observa "archivo encontrado en 3 ubicaciones" y directamente lee uno sin razonar POR QUE eligio ese, las decisiones se vuelven aleatorias. El Thought intermedio es lo que da nombre al patron: <strong class="text-agent-text">RE</strong>ason + <strong class="text-agent-text">ACT</strong>.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">ReAct vs CoT vs Act-only: comparacion</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Aspecto</th>
              <th class="text-left text-agent-text py-2 pr-4">Act-only</th>
              <th class="text-left text-agent-text py-2 pr-4">CoT (solo razonar)</th>
              <th class="text-left text-agent-text py-2">ReAct</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Puede actuar?</td><td class="py-2 pr-4 text-agent-success">Si</td><td class="py-2 pr-4 text-agent-danger">No</td><td class="py-2 text-agent-success">Si</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Razona antes?</td><td class="py-2 pr-4 text-agent-danger">No</td><td class="py-2 pr-4 text-agent-success">Si</td><td class="py-2 text-agent-success">Si</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Acceso a datos reales?</td><td class="py-2 pr-4 text-agent-success">Si</td><td class="py-2 pr-4 text-agent-danger">No (alucina)</td><td class="py-2 text-agent-success">Si</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Precision</td><td class="py-2 pr-4 text-agent-warning">Media</td><td class="py-2 pr-4 text-agent-warning">Alta (si tiene datos)</td><td class="py-2 text-agent-success">Mas alta</td></tr>
            <tr><td class="py-2 pr-4">Uso en agentes</td><td class="py-2 pr-4 text-agent-danger">Basico</td><td class="py-2 pr-4 text-agent-warning">Limitado</td><td class="py-2 text-agent-success">Estandar</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">ReAct es el patron que Claude Code usa INTERNAMENTE en cada iteracion. Cuando le pides "arregla este bug", el agente: (Thought) razona sobre que informacion necesita, (Action) busca en el codigo, (Observation) ve los resultados, (Thought) razona sobre el problema, (Action) edita el archivo, (Observation) verifica el resultado. Todo esto sucede en el agentic loop del modulo anterior. ReAct es la ESTRATEGIA de razonamiento; el agentic loop es la INFRAESTRUCTURA que la ejecuta.</p>
    </div>
  </section>

  <!-- Section 5: Extended Thinking -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Extended Thinking</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los modelos avanzados como Claude con thinking habilitado pueden generar <strong class="text-agent-text">bloques de pensamiento extenso</strong> antes de responder. Es como darle al modelo tiempo extra para pensar profundamente antes de hablar. En terminos tecnicos, el modelo genera tokens de "pensamiento" internos que no se muestran al usuario pero que mejoran drasticamente la calidad de la respuesta.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como funciona internamente</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Cuando extended thinking esta activado, la respuesta del modelo tiene dos partes:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-xs"># La API retorna algo como:
response = {
    "thinking": [
        "Veamos este problema de concurrencia...",
        "El usuario tiene un race condition porque...",
        "Hay 3 formas de resolverlo: locks, queues, o...",
        "La mejor opcion dado su stack es..."
    ],  # Tokens de pensamiento (no visibles al usuario)

    "content": "Tu race condition se resuelve con..."
    # La respuesta final (visible al usuario)
}

# El parametro budget_tokens controla CUANTO puede pensar:
response = client.messages.create(
    model="claude-opus-4-6",
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # max tokens de pensamiento
    },
    messages=[...]
)</pre>`}
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">En benchmarks de codigo complejo, extended thinking mejora el rendimiento de Claude en un <strong class="text-agent-text">30-50%</strong> en tareas como debugging multi-archivo, diseño de arquitectura, y analisis de seguridad. La mejora no es lineal: para tareas simples (renombrar una variable, formatear JSON), extended thinking no mejora nada y solo agrega latencia y costo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Cuando USARLO</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>&#x2713; Debugging de bugs complejos multi-archivo</li>
          <li>&#x2713; Diseño de arquitectura (evaluando trade-offs)</li>
          <li>&#x2713; Analisis de seguridad (buscando vulnerabilidades)</li>
          <li>&#x2713; Refactoring con cambios de diseño significativos</li>
          <li>&#x2713; Problemas de concurrencia/race conditions</li>
          <li>&#x2713; Code review de logica de negocio compleja</li>
        </ul>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Cuando NO usarlo</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>&#x2717; Leer un archivo y describir que hace</li>
          <li>&#x2717; Renombrar variables o funciones</li>
          <li>&#x2717; Formatear o lintear codigo</li>
          <li>&#x2717; Buscar un patron en el codebase</li>
          <li>&#x2717; Generar boilerplate/scaffolding</li>
          <li>&#x2717; Responder preguntas factuales simples</li>
        </ul>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El trade-off: calidad vs costo vs latencia</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Modo</th>
              <th class="text-left text-agent-text py-2 pr-4">Calidad</th>
              <th class="text-left text-agent-text py-2 pr-4">Latencia</th>
              <th class="text-left text-agent-text py-2">Costo</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Sin thinking</td><td class="py-2 pr-4">Buena para tareas simples</td><td class="py-2 pr-4 text-agent-success">1-3 segundos</td><td class="py-2 text-agent-success">Normal</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Thinking (budget bajo)</td><td class="py-2 pr-4">Mejor para tareas medias</td><td class="py-2 pr-4 text-agent-warning">5-15 segundos</td><td class="py-2 text-agent-warning">2-3x</td></tr>
            <tr><td class="py-2 pr-4">Thinking (budget alto)</td><td class="py-2 pr-4">Optima para tareas complejas</td><td class="py-2 pr-4 text-agent-danger">30s - 2 min</td><td class="py-2 text-agent-danger">5-10x</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm">Regla practica para produccion</p>
      <p class="text-sm text-agent-muted mt-1">Usa un "router" que active extended thinking solo para tareas que lo necesitan. El agente puede decidir automaticamente: si la tarea es simple (buscar, leer), usa el modo rapido. Si es compleja (debugging, arquitectura, seguridad), activa thinking. Esto optimiza tanto el costo como la experiencia del usuario.</p>
    </div>
  </section>

  <!-- Section 6: Disenando un Sistema de Memoria -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Disenando un Sistema de Memoria</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un sistema de memoria bien disenado combina las tres capas: corta, larga y episodica. La clave es saber <strong class="text-agent-text">que guardar, donde, y como recuperarlo</strong>. Un sistema de memoria mal disenado es peor que no tener memoria: agrega ruido, consume tokens, y confunde al agente.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Arquitectura completa de memoria</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">SISTEMA DE MEMORIA
├── Corta (Context Window) ← Todo cabe aqui para funcionar
│   ├── System prompt + instrucciones (SIEMPRE presente)
│   ├── Historial de conversacion actual
│   ├── Tool results recientes
│   └── Contexto recuperado de las otras capas
│
├── Larga (Persistente) ← Se consulta bajo demanda
│   ├── Vector DB (Pinecone, Chroma, Weaviate)
│   │   ├── Documentacion del proyecto (RAG)
│   │   ├── Base de conocimiento tecnico
│   │   └── Embeddings de contenido relevante
│   ├── Key-Value Store (Redis, JSON)
│   │   ├── Preferencias del usuario
│   │   ├── Configuraciones del proyecto
│   │   └── Datos estructurados (stack, deps, etc)
│   └── Archivos de contexto (CLAUDE.md, README, etc)
│
└── Episodica (Experiencias) ← Aprende del pasado
    ├── Tareas resueltas exitosamente
    ├── Errores cometidos y como se corrigieron
    ├── Estrategias que funcionaron
    ├── Patrones recurrentes detectados
    └── Decisiones de arquitectura y sus razones</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Que guardar donde</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Tipo de dato</th>
              <th class="text-left text-agent-text py-2 pr-4">Donde guardar</th>
              <th class="text-left text-agent-text py-2">Por que</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Estructura del proyecto</td><td class="py-2 pr-4 text-agent-accent">Larga (CLAUDE.md)</td><td class="py-2">Cambia poco, se lee al inicio</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Conversacion actual</td><td class="py-2 pr-4 text-agent-accent">Corta (context)</td><td class="py-2">Solo relevante en esta sesion</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Errores pasados y fixes</td><td class="py-2 pr-4 text-agent-accent">Episodica (MEMORY.md)</td><td class="py-2">Evita repetir los mismos errores</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Documentacion tecnica</td><td class="py-2 pr-4 text-agent-accent">Larga (Vector DB)</td><td class="py-2">Busqueda semantica por relevancia</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Preferencias del usuario</td><td class="py-2 pr-4 text-agent-accent">Larga (Key-Value)</td><td class="py-2">Datos simples, acceso por clave</td></tr>
            <tr><td class="py-2 pr-4">Tool results detallados</td><td class="py-2 pr-4 text-agent-accent">Corta (comprimible)</td><td class="py-2">Solo necesarios para la tarea actual</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Estrategias de recuperacion</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Keyword Search</p>
        <p class="text-xs text-agent-muted">Busqueda clasica por palabras exactas. Rapida y predecible. Funciona bien para datos estructurados (nombres de funciones, imports, rutas de archivos).</p>
        <p class="text-xs text-agent-success mt-2">Pro: Precisa y rapida</p>
        <p class="text-xs text-agent-danger">Con: No entiende sinonimos</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Semantic Search</p>
        <p class="text-xs text-agent-muted">Busqueda por significado usando embeddings y vector databases. Encuentra documentos relevantes aunque no usen las mismas palabras exactas.</p>
        <p class="text-xs text-agent-success mt-2">Pro: Entiende contexto</p>
        <p class="text-xs text-agent-danger">Con: Mas lenta, requiere infra</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Hybrid Search</p>
        <p class="text-xs text-agent-muted">Combina keyword + semantic. Usa ambos metodos y fusiona los resultados. Lo mejor de ambos mundos pero mas complejo de implementar.</p>
        <p class="text-xs text-agent-success mt-2">Pro: Mejor precision total</p>
        <p class="text-xs text-agent-danger">Con: Mas complejo</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El costo de la memoria</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Mas memoria en el contexto = mas tokens = mas dinero. La memoria no es gratis. Cada dato que agregas al context window se procesa en CADA llamada al LLM. Si tu system prompt tiene 5,000 tokens de memoria, esos 5,000 tokens se pagan en cada iteracion del agentic loop. Con 30 iteraciones, son 150,000 tokens solo de memoria.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Garbage collection: cuando olvidar</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      No todo merece ser recordado. Un buen sistema de memoria tambien sabe OLVIDAR:
    </p>
    <ul class="space-y-2 text-sm text-agent-muted mb-4">
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> <strong class="text-agent-text">Datos obsoletos:</strong> Si migraste de Flask a FastAPI, la memoria sobre Flask ya no es util. Eliminala.</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> <strong class="text-agent-text">Experiencias contradictorias:</strong> Si una leccion antigua dice "usa Pydantic v1" pero la nueva dice "usa v2", la antigua debe eliminarse.</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> <strong class="text-agent-text">Detalles triviales:</strong> "Lei el archivo README.md" no es una leccion. "El README esta desactualizado, la seccion de deploy es incorrecta" si lo es.</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> <strong class="text-agent-text">TTL (Time-To-Live):</strong> Algunos datos tienen una vida util natural. El estado de un sprint caduca al final del sprint.</li>
    </ul>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Los agentes en produccion de empresas como Replit y Vercel manejan la memoria con un sistema de 3 niveles: (1) cache caliente en el context window (ultimos 10 mensajes + system prompt), (2) cache templado en una DB relacional (sesiones recientes, busquedas frecuentes), y (3) almacenamiento frio en vector DB (toda la documentacion y experiencias). Cuando llega una tarea, el sistema trae solo lo relevante del nivel 2 y 3 al nivel 1. Asi optimizan costo Y relevancia.</p>
    </div>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4">
      <p class="text-agent-text font-bold text-sm mb-2">El flujo de recuperacion completo</p>
      <p class="text-sm text-agent-muted">Cuando llega una nueva tarea: (1) el agente busca en memoria episodica si resolvio algo similar antes, (2) recupera documentacion relevante via RAG (memoria larga), (3) carga preferencias del usuario (key-value), y (4) agrega todo al context window (memoria corta) junto con la tarea actual. Este flujo es lo que permite al agente "recordar" sin tener memoria real: simplemente trae la informacion correcta al lugar correcto en el momento correcto.</p>
    </div>
  </section>

  <!-- InteractiveFlow -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Diagrama: Como Piensan los Agentes</h2>
      {#if !showFlow}
        <button onclick={() => showFlow = true} class="btn-primary text-xs">
          Explorar estrategias
        </button>
      {/if}
    </div>
    {#if showFlow}
      <InteractiveFlow
        nodes={flowNodes}
        edges={flowEdges}
        title="Estrategias de Razonamiento: CoT vs ToT vs ReAct"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- Quiz -->
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
      <p class="text-sm text-agent-warning mb-3">Necesitas 80%+ para desbloquear el badge "Arquitecto Mental"</p>
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- Completion -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">🧠</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ahora entiendes como los agentes piensan, recuerdan y razonan.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
