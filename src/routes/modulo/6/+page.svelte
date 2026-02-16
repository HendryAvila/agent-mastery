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
      Los humanos tenemos multiples sistemas de memoria. Los agentes tambien necesitan diferentes tipos para funcionar efectivamente. <strong class="text-agent-text">No existe "una sola memoria"</strong> — cada tipo cumple un proposito distinto.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">🧠</p>
        <p class="text-agent-accent font-bold">Memoria Corta</p>
        <p class="text-sm text-agent-muted mt-2">El context window de la conversacion actual. Todo lo que el agente "ve" en este momento: mensajes, tool results, instrucciones.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tu RAM</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">💾</p>
        <p class="text-agent-accent font-bold">Memoria Larga</p>
        <p class="text-sm text-agent-muted mt-2">Almacenamiento persistente: vector databases, archivos de configuracion, bases de datos. Sobrevive entre sesiones y se consulta bajo demanda.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tu disco duro</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-5">
        <p class="text-2xl mb-2">📸</p>
        <p class="text-agent-accent font-bold">Memoria Episodica</p>
        <p class="text-sm text-agent-muted mt-2">Registro de experiencias pasadas: que tareas resolvio, que estrategias uso, que errores cometio. Permite aprender de la propia experiencia.</p>
        <p class="text-xs text-agent-text mt-3 font-mono bg-agent-dark rounded px-2 py-1">Analogia: tus recuerdos</p>
      </div>
    </div>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Ejemplo concreto: Claude Code</p>
      <p class="text-sm text-agent-muted">
        <strong class="text-agent-text">Corta:</strong> la conversacion actual y los archivos leidos. <strong class="text-agent-text">Larga:</strong> CLAUDE.md y archivos de configuracion del proyecto. <strong class="text-agent-text">Episodica:</strong> el archivo MEMORY.md donde guarda lecciones aprendidas entre sesiones.
      </p>
    </div>
  </section>

  <!-- Section 2: Chain-of-Thought (CoT) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Chain-of-Thought (CoT)</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La tecnica mas simple pero mas poderosa para mejorar el razonamiento de un LLM. Originada en el paper de Wei et al. (2022), consiste en hacer que el modelo <strong class="text-agent-text">muestre sus pasos intermedios</strong> antes de llegar a una conclusion.
    </p>
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
    <p class="text-agent-muted leading-relaxed">
      CoT funciona porque obliga al modelo a <strong class="text-agent-text">descomponer problemas complejos en pasos manejables</strong>. Cada paso se puede verificar individualmente. Se activa con frases como "piensa paso a paso" o "razona antes de responder".
    </p>
  </section>

  <!-- Section 3: Tree-of-Thought (ToT) -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Tree-of-Thought (ToT)</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Chain-of-Thought es lineal: un solo camino. Pero que pasa si el primer camino no es el correcto? <strong class="text-agent-text">Tree-of-Thought</strong> explora multiples caminos en paralelo, como un jugador de ajedrez que piensa varias jugadas por adelantado.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-3">Como funciona ToT</p>
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
            <p class="text-xs text-agent-muted">"Sigo con B porque..."</p>
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
    <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4">
      <p class="text-agent-warning font-bold text-sm">Trade-off importante</p>
      <p class="text-sm text-agent-muted mt-1">ToT consume 3-5x mas tokens que CoT y anade latencia significativa. Usalo solo para problemas complejos con multiples soluciones posibles. Para problemas simples, CoT es suficiente y mucho mas economico.</p>
    </div>
  </section>

  <!-- Section 4: El Patron ReAct -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. El Patron ReAct</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-text">ReAct</strong> (Reasoning + Acting) es el patron que usan la mayoria de agentes modernos. Intercala razonamiento y accion: el agente piensa, actua, observa, y repite.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Ejemplo: un agente resolviendo un bug</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">Thought: El usuario reporta un TypeError en la funcion process_data().
Necesito encontrar la definicion de esa funcion primero.

Action: search_codebase("def process_data")
Observation: Encontrado en src/pipeline.py linea 45

Thought: Voy a leer la funcion para entender que hace y donde
podria ocurrir el TypeError. Un TypeError suele ser por
pasar un tipo incorrecto a una operacion.

Action: read_file("src/pipeline.py", lines="40-70")
Observation: La funcion recibe 'data' y hace data.split(",")
en la linea 52.

Thought: Si 'data' no es un string sino un int o None,
data.split() lanzara TypeError. Necesito verificar que
tipo se esta pasando. Voy a buscar donde se llama la funcion.

Action: search_codebase("process_data(")
Observation: Llamada en main.py linea 23 con el resultado
de fetch_api() que retorna un dict, no un string.

Thought: Encontre el bug. fetch_api() retorna un dict pero
process_data() espera un string. La solucion es convertir
o extraer el campo correcto del dict antes de pasarlo.</pre>`}
    </div>
    <p class="text-agent-muted leading-relaxed">
      Nota como cada <strong class="text-agent-text">Thought</strong> justifica la proxima <strong class="text-agent-text">Action</strong>, y cada <strong class="text-agent-text">Observation</strong> alimenta el siguiente Thought. Este ciclo es lo que hace a ReAct tan efectivo: el agente no actua a ciegas, razona sobre cada paso.
    </p>
  </section>

  <!-- Section 5: Extended Thinking -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Extended Thinking</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los modelos avanzados como Claude con thinking habilitado pueden generar <strong class="text-agent-text">bloques de pensamiento extenso</strong> antes de responder. Es como darle al modelo tiempo para pensar profundamente antes de hablar.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Beneficios</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Razonamiento mucho mas profundo y preciso</li>
          <li>Mejor para problemas de codigo complejos</li>
          <li>Reduce errores en tareas de logica</li>
          <li>Auto-verificacion antes de responder</li>
        </ul>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Costos</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Latencia significativa (segundos a minutos)</li>
          <li>3-10x mas tokens consumidos</li>
          <li>Mayor costo por peticion</li>
          <li>No siempre necesario para tareas simples</li>
        </ul>
      </div>
    </div>
    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm">Cuando usarlo en produccion</p>
      <p class="text-sm text-agent-muted mt-1">Reserva extended thinking para tareas que realmente lo necesitan: debugging complejo, diseno de arquitectura, analisis de seguridad. Para tareas simples (formatear texto, buscar un archivo), el modelo estandar es suficiente y mucho mas rapido.</p>
    </div>
  </section>

  <!-- Section 6: Disenando un Sistema de Memoria -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Disenando un Sistema de Memoria</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un sistema de memoria bien disenado combina las tres capas: corta, larga y episodica. La clave es saber <strong class="text-agent-text">que guardar, donde, y como recuperarlo</strong>.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Arquitectura practica de memoria</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">SISTEMA DE MEMORIA
├── Corta (Context Window)
│   ├── System prompt + instrucciones
│   ├── Historial de conversacion actual
│   └── Tool results recientes
│
├── Larga (Persistente)
│   ├── Vector DB (Pinecone, Chroma, Weaviate)
│   │   ├── Documentacion del proyecto
│   │   ├── Base de conocimiento
│   │   └── Embeddings de contenido relevante
│   ├── Key-Value Store (Redis, JSON)
│   │   ├── Preferencias del usuario
│   │   ├── Configuraciones
│   │   └── Datos estructurados
│   └── Archivos de contexto (CLAUDE.md, etc)
│
└── Episodica (Experiencias)
    ├── Tareas resueltas exitosamente
    ├── Errores cometidos y como se corrigieron
    ├── Estrategias que funcionaron
    └── Patrones recurrentes detectados</pre>`}
    </div>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4">
      <p class="text-agent-text font-bold text-sm mb-2">El flujo de recuperacion</p>
      <p class="text-sm text-agent-muted">Cuando llega una nueva tarea: (1) el agente busca en memoria episodica si resolvio algo similar antes, (2) recupera documentacion relevante via RAG (memoria larga), (3) carga preferencias del usuario (key-value), y (4) agrega todo al context window (memoria corta) junto con la tarea actual.</p>
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
