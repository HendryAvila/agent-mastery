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

  const MODULE_ID = 5;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let showQuiz = $state(false);
  let showFlow = $state(false);

  courseStore.startModule(MODULE_ID);

  // ─── InteractiveFlow: Minimal Agent Architecture ───
  const flowNodes = [
    { id: 'user', label: 'Usuario', description: 'El usuario envia una tarea o pregunta al agente. Este es el punto de entrada de cualquier interaccion agentica. El input puede ser texto libre, un comando estructurado, o una tarea de alto nivel.', icon: '👤', x: 8, y: 50 },
    { id: 'parse', label: 'Parser de Input', description: 'Valida y normaliza el input del usuario antes de enviarlo al LLM. Puede incluir sanitizacion, extraccion de intenciones, o expansion de contexto con informacion del sistema (fecha, estado del proyecto, etc).', icon: '📋', x: 22, y: 50 },
    { id: 'llm', label: 'Llamada al LLM', description: 'Se envia el historial de mensajes + definiciones de herramientas al modelo. El LLM decide si responder directamente con texto o si necesita invocar una herramienta para completar la tarea. Este es el cerebro del agente.', icon: '🧠', x: 40, y: 30 },
    { id: 'decision', label: 'Decision', description: 'Checkpoint critico: se analiza la respuesta del LLM. Si contiene un tool_call, el flujo va hacia la ejecucion de herramientas. Si es texto plano sin tool_calls, la tarea esta completa y se devuelve al usuario.', icon: '🔀', x: 55, y: 50 },
    { id: 'toolexec', label: 'Ejecutar Tool', description: 'Se extrae el nombre de la herramienta y los argumentos del tool_call, se validan contra el JSON Schema, se ejecuta la funcion correspondiente, y se captura el resultado (exito o error). Aqui vive la logica de retry y error handling.', icon: '⚙️', x: 70, y: 30 },
    { id: 'result', label: 'Procesar Resultado', description: 'El resultado de la herramienta se formatea y se agrega al historial de mensajes como un tool_result. Esto permite al LLM ver que paso y decidir el siguiente paso. Incluye manejo de errores y truncamiento si el resultado es muy largo.', icon: '📊', x: 70, y: 70 },
    { id: 'context', label: 'Gestion Contexto', description: 'Antes de la siguiente iteracion, se verifica el tamano del contexto. Si esta cerca del limite, se aplican estrategias: resumir mensajes antiguos, eliminar tool_results detallados, o comprimir el historial. Sin esto, el agente se queda sin ventana de contexto.', icon: '📏', x: 40, y: 70 },
    { id: 'response', label: 'Respuesta Final', description: 'El LLM genero texto sin tool_calls, indicando que la tarea esta completa. Se devuelve la respuesta al usuario. El agente puede incluir metadata adicional: herramientas usadas, tokens consumidos, tiempo total.', icon: '✅', x: 92, y: 50 }
  ];

  const flowEdges = [
    { from: 'user', to: 'parse', label: 'Input' },
    { from: 'parse', to: 'llm', label: 'Mensajes' },
    { from: 'llm', to: 'decision', label: 'Respuesta' },
    { from: 'decision', to: 'toolexec', label: 'tool_call' },
    { from: 'decision', to: 'response', label: 'Texto final' },
    { from: 'toolexec', to: 'result', label: 'Resultado' },
    { from: 'result', to: 'context', label: 'Agregar al historial' },
    { from: 'context', to: 'llm', label: 'Siguiente iteracion' }
  ];

  const flowChallenges = [
    { question: 'Donde ocurre la decision de usar herramientas o responder con texto?', targetNodeId: 'decision', hint: 'Es el punto de bifurcacion del flujo, donde se analiza si hay tool_calls en la respuesta.' },
    { question: 'Que componente evita que el agente se quede sin tokens?', targetNodeId: 'context', hint: 'Gestiona el tamano del historial antes de cada nueva llamada al LLM.' },
    { question: 'Si una herramienta falla, en que nodo se maneja el error?', targetNodeId: 'toolexec', hint: 'Es donde se ejecuta la herramienta y se implementan los retries.' },
    { question: 'Donde se valida el input del usuario antes de enviarlo al modelo?', targetNodeId: 'parse', hint: 'Es el primer paso despues de recibir el input del usuario.' }
  ];

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Tu agente tiene un context window de 128K tokens. Despues de 50 tool calls, el contexto esta al 80%. Cual es la MEJOR estrategia?',
      options: [
        { text: 'Detener el agente inmediatamente y devolver lo que tenga', correct: false, explanation: 'Detener abruptamente pierde todo el trabajo acumulado. Hay estrategias mas inteligentes.' },
        { text: 'Resumir los tool_results antiguos manteniendo solo las conclusiones clave, y continuar', correct: true, explanation: 'Correcto. La compresion selectiva mantiene el contexto relevante mientras libera espacio. Se resumen los resultados detallados de herramientas antiguas conservando los hallazgos importantes.' },
        { text: 'Borrar todo el historial y empezar de cero', correct: false, explanation: 'Borrar todo el historial pierde el contexto de la tarea completa. El agente no sabria que ya hizo ni que falta.' },
        { text: 'Aumentar el context window pagando mas tokens', correct: false, explanation: 'No siempre es posible aumentar el context window (tiene un maximo fijo), y simplemente tirar dinero al problema no es una estrategia de ingenieria.' }
      ],
      source: 'Anthropic - Building Effective AI Agents',
      sourceUrl: 'https://www.anthropic.com/research/building-effective-agents'
    },
    {
      question: 'Observa este pseudocodigo de un agentic loop. Cual es el BUG?',
      codeBlock: `while True:
    response = llm.generate(messages, tools)
    if response.tool_call:
        result = execute_tool(response.tool_call)
        messages.append({"role": "tool", "content": result})
    else:
        return response.text`,
      options: [
        { text: 'Falta agregar la respuesta del LLM (assistant message) al historial antes de agregar el tool_result', correct: true, explanation: 'Correcto! La API requiere que el mensaje del asistente (con el tool_call) se agregue al historial ANTES del tool_result. Sin esto, el modelo no sabe a que tool_call corresponde el resultado. El flujo correcto es: messages.append(response.message) y LUEGO messages.append(tool_result).' },
        { text: 'El while True deberia ser un for loop con un maximo de iteraciones', correct: false, explanation: 'Tener un max_iterations es buena practica pero no es un bug funcional - el agente eventualmente responde sin tool_calls y sale del loop via return.' },
        { text: 'Falta validar que response.tool_call tenga parametros validos', correct: false, explanation: 'La validacion de parametros es buena practica pero no es el bug principal. El codigo puede funcionar sin ella si el LLM genera parametros correctos.' },
        { text: 'El execute_tool no maneja errores con try/except', correct: false, explanation: 'El manejo de errores es critico en produccion pero no es el bug del agentic loop en si. El flujo del mensaje es incorrecto.' }
      ]
    },
    {
      question: 'Por que un agente NO deberia reintentar indefinidamente una tool call fallida?',
      options: [
        { text: 'Porque es caro en tokens, puede sobrecargar servicios externos, y si la herramienta falla consistentemente, el agente necesita una estrategia alternativa (fallback tool o informar al usuario)', correct: true, explanation: 'Correcto. Los retries infinitos consumen tokens sin limite, pueden violar rate limits de APIs externas, y si el error es permanente (API dada de baja, parametros invalidos), reintentar nunca va a funcionar. La practica correcta: maximo 3 retries con backoff exponencial, luego fallback o escalamiento.' },
        { text: 'Porque el LLM podria olvidar lo que estaba haciendo entre retries', correct: false, explanation: 'El LLM no olvida entre retries - mantiene el contexto en el historial de mensajes. Mientras el contexto este, el modelo sabe que estaba haciendo.' },
        { text: 'Porque las herramientas solo pueden ejecutarse una vez', correct: false, explanation: 'Las herramientas pueden ejecutarse multiples veces. El problema no es tecnico sino estrategico y economico.' },
        { text: 'Porque viola el principio de single responsibility', correct: false, explanation: 'El patron de retry no tiene relacion con SRP. El problema es practico: costo, rate limits y la posibilidad de errores permanentes.' }
      ]
    },
    {
      question: 'Que sucede si el LLM genera un tool_call con parametros invalidos segun el JSON Schema?',
      options: [
        { text: 'El sistema host debe validar contra el schema, rechazar la llamada, y enviar un mensaje de error al LLM para que corrija los parametros en la siguiente iteracion', correct: true, explanation: 'Correcto! El sistema host es responsable de validar los argumentos contra el JSON Schema ANTES de ejecutar la herramienta. Si son invalidos, se le devuelve al LLM un mensaje de error descriptivo para que pueda autocorregirse. Esto es parte fundamental del agentic loop.' },
        { text: 'La herramienta se ejecuta igual y se espera que maneje el error internamente', correct: false, explanation: 'Ejecutar una herramienta con parametros invalidos es peligroso y puede causar efectos secundarios inesperados. La validacion debe ocurrir ANTES de la ejecucion.' },
        { text: 'El LLM nunca genera parametros invalidos si el schema esta bien definido', correct: false, explanation: 'Falso. Incluso con schemas bien definidos, los LLMs pueden generar parametros invalidos ocasionalmente, especialmente en casos edge o con herramientas complejas. La validacion siempre es necesaria.' },
        { text: 'Se ignora el tool_call y se pide al LLM que genere otro', correct: false, explanation: 'Ignorar silenciosamente el tool_call no le da al LLM informacion sobre que salio mal. Sin feedback, el modelo probablemente cometeria el mismo error.' }
      ]
    },
    {
      question: 'Cual es el componente MAS critico que diferencia un agente de un chatbot?',
      options: [
        { text: 'La interfaz de usuario', correct: false, explanation: 'La interfaz es irrelevante para la diferencia funcional. Un chatbot puede tener la misma UI que un agente.' },
        { text: 'El agentic loop con capacidad de ejecutar herramientas y re-evaluar', correct: true, explanation: 'Correcto! Lo que define a un agente es el LOOP: la capacidad de llamar al LLM, ejecutar herramientas basandose en su decision, reinyectar los resultados, y repetir hasta completar la tarea. Un chatbot es una sola llamada al LLM. Un agente es un LOOP de llamadas con acciones intermedias.' },
        { text: 'El modelo de lenguaje subyacente (LLM)', correct: false, explanation: 'El mismo LLM puede ser un chatbot o un agente dependiendo de como se use. El modelo es necesario pero no suficiente.' },
        { text: 'La capacidad de recordar conversaciones previas', correct: false, explanation: 'La memoria es importante pero no es lo que define a un agente. Un chatbot puede tener memoria de conversacion y seguir siendo un chatbot.' }
      ]
    },
    {
      question: 'Estas disenando las herramientas para tu agente. Cual de estas definiciones es la MEJOR practica?',
      codeBlock: `# Opcion A:
{"name": "search", "description": "busca cosas"}

# Opcion B:
{"name": "search_documentation",
 "description": "Busca en la documentacion del proyecto usando palabras clave. Retorna los 5 fragmentos mas relevantes con path del archivo y numero de linea. Usar cuando el usuario pregunta sobre funcionalidad existente.",
 "parameters": {"query": {"type": "string", "description": "Palabras clave de busqueda"}}}`,
      options: [
        { text: 'Opcion A: es mas simple y el LLM es lo suficientemente inteligente para entender', correct: false, explanation: 'Los LLMs NO son magos. Una descripcion vaga como "busca cosas" no le dice al modelo CUANDO usar la herramienta, QUE busca, ni QUE retorna. Vas a tener errores de seleccion de herramienta constantes.' },
        { text: 'Opcion B: nombre descriptivo, descripcion precisa con que retorna y cuando usarla, y parametros tipados', correct: true, explanation: 'Correcto! Las buenas definiciones de herramientas incluyen: nombre que indica accion y dominio, descripcion que explica que hace, que retorna, y cuando usarla, y parametros con tipos y descripciones. Esto reduce errores dramaticamente.' },
        { text: 'Ninguna: es mejor usar nombres de una sola letra para ahorrar tokens', correct: false, explanation: 'Los tokens de las definiciones de herramientas son una fraccion minima del costo total. Ahorrar unos tokens ahi a cambio de ambiguedad genera mucho mas gasto en retries y errores.' },
        { text: 'Depende del modelo: Claude necesita mas detalle, GPT menos', correct: false, explanation: 'TODOS los modelos se benefician de definiciones claras y detalladas. Es una buena practica universal, no especifica de un modelo.' }
      ],
      source: 'Composio - How to Build Great Tools for AI Agents',
      sourceUrl: 'https://composio.dev/blog/how-to-build-tools-for-ai-agents-a-field-guide'
    }
  ];

  function handleFlowComplete(score: number, total: number) {
    // Flow doesn't trigger badge, just tracks
  }

  function handleQuizComplete(score: number, total: number) {
    courseStore.completeModule(MODULE_ID, score, total);
    completed = true;
    const badge = courseStore.unlockBadge('builder');
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

  <!-- Section 1: La Arquitectura Minima -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. La Arquitectura Minima</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Construir un agente suena intimidante, pero la realidad es que la arquitectura minima tiene solo <strong class="text-agent-text">tres componentes</strong>: una API de LLM, definiciones de herramientas, y un loop. Eso es todo. No necesitas un framework complejo para empezar.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La diferencia fundamental entre un chatbot y un agente es el <strong class="text-agent-text">agentic loop</strong>. Un chatbot es una sola llamada al LLM: pregunta &#x2192; respuesta. Un agente es un LOOP de llamadas donde el modelo puede ejecutar acciones intermedias, observar resultados, y decidir el siguiente paso. El loop es lo que le da al agente la capacidad de actuar en el mundo.</p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">El agentic loop en pseudocodigo</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">messages = [{"role": "user", "content": tarea}]
tools = [definir_herramientas()]

while not done:
    response = llm.generate(
        messages=messages,
        tools=tools
    )

    # Agregar la respuesta del asistente al historial
    messages.append(response.message)

    if response.has_tool_call:
        # Ejecutar la herramienta
        result = execute_tool(response.tool_call)
        # Agregar el resultado al historial
        messages.append({
            "role": "tool",
            "content": result
        })
    else:
        # Sin tool_call = tarea completa
        return response.text</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las tres decisiones del loop</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      En cada iteracion del agentic loop, el LLM toma tres decisiones criticas:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-4 text-center">
        <p class="text-2xl mb-2">&#x2753;</p>
        <p class="text-agent-accent font-bold text-sm">Necesito una herramienta?</p>
        <p class="text-xs text-agent-muted mt-2">El modelo evalua si puede responder con su conocimiento interno o si necesita informacion/acciones externas.</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-4 text-center">
        <p class="text-2xl mb-2">&#x1F527;</p>
        <p class="text-agent-accent font-bold text-sm">Cual herramienta uso?</p>
        <p class="text-xs text-agent-muted mt-2">Si necesita una herramienta, elige entre las disponibles basandose en sus descripciones y la tarea actual.</p>
      </div>
      <div class="bg-agent-card border border-agent-accent/30 rounded-lg p-4 text-center">
        <p class="text-2xl mb-2">&#x2705;</p>
        <p class="text-agent-accent font-bold text-sm">Ya termine?</p>
        <p class="text-xs text-agent-muted mt-2">Despues de cada accion, decide si la tarea esta completa o si necesita mas pasos. Si no hay tool_call, la tarea esta lista.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Comparacion: script simple vs agente</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-muted font-bold text-sm mb-2">Script tradicional (while True)</p>
        {@html `<pre class="code-block text-xs text-agent-muted"># Script: secuencia FIJA de pasos
while True:
    line = input()
    if "buscar" in line:
        result = search(line)
    elif "crear" in line:
        result = create(line)
    print(result)

# Problema: los pasos estan hardcodeados.
# No puede adaptarse a tareas nuevas.
# No puede encadenar acciones dinamicamente.</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm mb-2">Agente (agentic loop)</p>
        {@html `<pre class="code-block text-xs text-agent-muted"># Agente: el LLM DECIDE los pasos
while not done:
    response = llm.generate(messages, tools)
    messages.append(response.message)
    if response.tool_call:
        result = execute(response.tool_call)
        messages.append(tool_result)

# Ventaja: el LLM decide QUE hacer, CUANDO,
# y en QUE ORDEN. Se adapta a cualquier tarea.
# Encadena acciones dinamicamente.</pre>`}
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted"><strong class="text-agent-text">Mini-SWE-Agent</strong> es un agente de apenas 100 lineas de Python que logro un 74% en SWE-bench Lite, un benchmark de resolucion de bugs reales en repositorios open-source. Demuestra que no necesitas un framework masivo para construir un agente efectivo. La clave esta en el loop, no en la complejidad.</p>
    </div>

    <p class="text-agent-muted leading-relaxed">
      El <strong class="text-agent-text">loop es el corazon</strong> de todo agente. Cada iteracion: (1) se envia el historial completo al LLM, (2) el modelo decide si usar herramientas o responder, (3) si usa herramientas, se ejecutan y el resultado vuelve al historial, (4) se repite hasta que el modelo decide que termino.
    </p>
  </section>

  <!-- Section 2: Definiendo Herramientas -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Definiendo Herramientas</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas son funciones que le das al LLM para que pueda actuar en el mundo real. Pero el modelo no las ejecuta directamente: genera un <strong class="text-agent-text">JSON estructurado</strong> que tu sistema interpreta y ejecuta. La calidad de tus definiciones de herramientas determina la calidad de las decisiones del agente.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">5 herramientas: de simple a compleja</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Veamos como progresan las definiciones de herramientas en complejidad:
    </p>

    <div class="space-y-4 mb-6">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Tool 1: read_file (basica)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">{
  "name": "read_file",
  "description": "Lee el contenido de un archivo. Retorna el texto completo con numeros de linea. Usar para inspeccionar codigo fuente o archivos de configuracion.",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {"type": "string", "description": "Ruta absoluta al archivo"}
    },
    "required": ["path"]
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2">Simple: un parametro, una accion, un resultado.</p>
      </div>

      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Tool 2: search_codebase (con enums)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">{
  "name": "search_codebase",
  "description": "Busca patrones en el codigo fuente usando regex. Retorna archivos y lineas que coinciden. Usar cuando necesitas encontrar donde se usa una funcion o una clase.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {"type": "string", "description": "Patron regex a buscar"},
      "file_type": {"type": "string", "enum": ["py", "js", "ts", "all"], "description": "Filtrar por tipo de archivo"},
      "max_results": {"type": "integer", "default": 10, "description": "Maximo de resultados"}
    },
    "required": ["pattern"]
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2">Intermedia: enum para controlar opciones validas, default para parametros opcionales.</p>
      </div>

      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Tool 3: run_command (con restricciones de seguridad)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">{
  "name": "run_command",
  "description": "Ejecuta un comando de terminal. SOLO para comandos de build, test, y lint. NO ejecuta comandos destructivos (rm -rf, drop, etc). Retorna stdout y stderr.",
  "parameters": {
    "type": "object",
    "properties": {
      "command": {"type": "string", "description": "Comando a ejecutar (ej: pytest, npm test)"},
      "working_dir": {"type": "string", "description": "Directorio de trabajo"},
      "timeout": {"type": "integer", "default": 30, "description": "Timeout en segundos (max 120)"}
    },
    "required": ["command"]
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2">Con seguridad: la descripcion define explicita los LIMITES de lo que puede hacer.</p>
      </div>

      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Tool 4: create_pull_request (compleja, multiples params)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">{
  "name": "create_pull_request",
  "description": "Crea un Pull Request en GitHub. Requiere que los cambios esten commiteados en una rama. Retorna la URL del PR creado.",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {"type": "string", "description": "Titulo del PR (max 72 chars)"},
      "body": {"type": "string", "description": "Descripcion con formato Markdown"},
      "base": {"type": "string", "default": "main", "description": "Rama base"},
      "head": {"type": "string", "description": "Rama con los cambios"},
      "labels": {"type": "array", "items": {"type": "string"}, "description": "Labels a asignar"},
      "draft": {"type": "boolean", "default": false, "description": "Crear como draft PR"}
    },
    "required": ["title", "body", "head"]
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2">Compleja: multiples tipos (string, array, boolean), defaults, y solo 3 requeridos de 6.</p>
      </div>

      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <p class="text-xs text-agent-danger uppercase tracking-wider font-bold mb-2">Tool 5: deploy_to_staging (peligrosa, necesita confirmacion)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">{
  "name": "deploy_to_staging",
  "description": "ACCION DESTRUCTIVA: Despliega la rama actual al entorno de staging. Esto sobreescribe el deploy anterior. SIEMPRE pedir confirmacion al usuario antes de ejecutar.",
  "parameters": {
    "type": "object",
    "properties": {
      "branch": {"type": "string", "description": "Rama a desplegar"},
      "confirm": {"type": "boolean", "description": "DEBE ser true. El agente debe pedir confirmacion explicita al usuario antes de pasar true."}
    },
    "required": ["branch", "confirm"]
  }
}</pre>`}
        <p class="text-xs text-agent-muted mt-2">Peligrosa: la descripcion dice "ACCION DESTRUCTIVA" y requiere confirmacion explicita.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El principio "La descripcion es rey"</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El LLM decide que herramienta usar basandose PRINCIPALMENTE en la descripcion. Una descripcion pobre = malas decisiones. Veamos tres versiones de la misma herramienta:
    </p>

    <div class="space-y-3 mb-4">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-xs mb-1">Mala: "busca cosas"</p>
        <p class="text-xs text-agent-muted">El modelo no sabe QUE busca, DONDE busca, ni QUE retorna. Habra errores constantes de seleccion de herramienta.</p>
      </div>
      <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-3">
        <p class="text-agent-warning font-bold text-xs mb-1">Regular: "Busca archivos en el proyecto"</p>
        <p class="text-xs text-agent-muted">Mejor, pero no dice COMO busca (por nombre? por contenido?) ni QUE formato tiene el resultado.</p>
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-xs mb-1">Buena: "Busca patrones regex en el codigo fuente. Retorna archivos y numeros de linea que coinciden. Usar cuando el usuario pregunta donde se define o se usa una funcion."</p>
        <p class="text-xs text-agent-muted">Dice QUE hace, COMO busca, QUE retorna, y CUANDO usarla. El modelo puede decidir correctamente.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Crear herramientas con demasiados parametros opcionales "por si acaso". Cada parametro que agregas es una decision mas que el modelo tiene que tomar. Si tu herramienta tiene 15 parametros, el modelo va a equivocarse frecuentemente. Mejor: herramientas enfocadas con 2-5 parametros cada una.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Anthropic recomienda que cada herramienta tenga un "uso sugerido" en la descripcion: <strong class="text-agent-text">"Usar cuando..."</strong>. Esto le dice al modelo CUANDO elegir esta herramienta en lugar de otra. Sin esta guia, el modelo a veces usa search_codebase cuando deberia usar read_file, o viceversa. La frase "Usar cuando..." reduce estos errores de seleccion significativamente.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tipos de parametros disponibles</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Tipo</th>
              <th class="text-left text-agent-text py-2 pr-4">Ejemplo</th>
              <th class="text-left text-agent-text py-2">Cuando usar</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">string</td><td class="py-2 pr-4">"src/main.py"</td><td class="py-2">Texto libre: paths, queries, nombres</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">integer</td><td class="py-2 pr-4">10, 50, 100</td><td class="py-2">Limites, conteos, lineas</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">boolean</td><td class="py-2 pr-4">true / false</td><td class="py-2">Flags on/off: dry_run, verbose</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">enum</td><td class="py-2 pr-4">["py", "js", "ts"]</td><td class="py-2">Opciones restringidas predefinidas</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">array</td><td class="py-2 pr-4">["tag1", "tag2"]</td><td class="py-2">Listas de items: labels, files</td></tr>
            <tr><td class="py-2 pr-4 text-agent-accent">object</td><td class="py-2 pr-4">&#x7B;"key": "val"&#x7D;</td><td class="py-2">Datos anidados: configs, metadata</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Buenas practicas</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Nombre descriptivo (verbo + dominio)</li>
          <li>Descripcion con QUE hace, QUE retorna, CUANDO usarla</li>
          <li>Parametros tipados con descripciones</li>
          <li>Constraints claros (enums, defaults, required)</li>
          <li>Herramientas pequeñas y enfocadas (SRP)</li>
          <li>Marcar acciones peligrosas en la descripcion</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Anti-patrones</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Nombres vagos: "do_stuff", "helper"</li>
          <li>Descripcion: "hace cosas"</li>
          <li>Parametros sin tipos ni descripcion</li>
          <li>Una herramienta que hace 10 cosas diferentes</li>
          <li>15+ parametros opcionales</li>
          <li>Sin indicar acciones destructivas</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El SDK de Anthropic para agentes define las herramientas de Claude Code con nombres como <code class="text-agent-accent">Read</code>, <code class="text-agent-accent">Write</code>, <code class="text-agent-accent">Edit</code>, <code class="text-agent-accent">Bash</code>, <code class="text-agent-accent">Grep</code>. Cada una hace UNA cosa bien. No hay una herramienta "FileManager" que lea, escriba, busque, y borre. La granularidad permite al modelo elegir la accion correcta con mayor precision. Menos ambiguedad = menos errores.</p>
    </div>
  </section>

  <!-- Section 3: El Context Window -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. El Context Window</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El <strong class="text-agent-text">context window</strong> es la cantidad maxima de tokens que el LLM puede procesar en una sola llamada (input + output combinados). Es el cuello de botella numero 1 de cualquier agente. Pero el verdadero cuello de botella no es solo el tamaño: es el <strong class="text-agent-highlight">costo</strong>.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Que es un token?</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un token es la unidad basica que procesa un LLM. No es exactamente una palabra ni un caracter. En ingles, 1 token &#x2248; 4 caracteres &#x2248; 0.75 palabras. En codigo, los tokens son mas "caros": una linea de Python puede ser 10-20 tokens. Los simbolos especiales, imports, y nombres largos de funciones consumen mas tokens de lo que esperas.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-3">Context windows y costos actuales (2026)</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Modelo</th>
              <th class="text-left text-agent-text py-2 pr-4">Context Window</th>
              <th class="text-left text-agent-text py-2 pr-4">Input/1M tokens</th>
              <th class="text-left text-agent-text py-2">Output/1M tokens</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Claude Opus 4.6</td><td class="py-2 pr-4">200K tokens</td><td class="py-2 pr-4">$15</td><td class="py-2">$75</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Claude Sonnet 4</td><td class="py-2 pr-4">200K tokens</td><td class="py-2 pr-4">$3</td><td class="py-2">$15</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">GPT-4.1</td><td class="py-2 pr-4">1M tokens</td><td class="py-2 pr-4">$2</td><td class="py-2">$8</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Gemini 2.5 Pro</td><td class="py-2 pr-4">1M tokens</td><td class="py-2 pr-4">$1.25</td><td class="py-2">$10</td></tr>
            <tr><td class="py-2 pr-4">Claude Haiku 3.5</td><td class="py-2 pr-4">200K tokens</td><td class="py-2 pr-4">$0.80</td><td class="py-2">$4</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Rakuten uso agentes de codigo en un codebase de <strong class="text-agent-text">12.5 millones de lineas</strong>. El desafio no fue el context window sino la seleccion inteligente de QUE meter en el contexto. Usaron una combinacion de indices de codigo, busqueda semantica, y mapas de dependencias para que el agente solo viera los archivos relevantes para cada tarea. Sin esta estrategia, llenar el contexto con codigo irrelevante degradaba dramaticamente la calidad.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El verdadero problema: costo, no tamaño</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Tener 1M tokens de contexto suena genial, pero llenar esos 1M tokens cuesta dinero en cada llamada. Un agente que hace 30 iteraciones con 500K tokens de contexto puede costar $50+ por tarea. La gestion inteligente del contexto no es solo tecnica, es <strong class="text-agent-text">financiera</strong>.
    </p>

    <p class="text-agent-muted leading-relaxed mb-3">
      <strong class="text-agent-text">Estrategias de gestion de contexto:</strong>
    </p>
    <div class="space-y-3 mb-4">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Sliding Window</p>
        <p class="text-sm text-agent-muted mt-1">Mantener solo los ultimos N mensajes. Simple pero pierde contexto antiguo que puede ser relevante.</p>
        {@html `<pre class="code-block text-xs mt-2">def sliding_window(messages, max_tokens=50000):
    """Mantiene los ultimos mensajes hasta el limite de tokens."""
    total = 0
    result = []
    for msg in reversed(messages):
        tokens = count_tokens(msg)
        if total + tokens > max_tokens:
            break
        result.insert(0, msg)
        total += tokens
    return result</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Summarization</p>
        <p class="text-sm text-agent-muted mt-1">Usar el LLM para resumir periodicamente el historial, reemplazando mensajes detallados con un resumen compacto. Mantiene la esencia sin los detalles.</p>
        {@html `<pre class="code-block text-xs mt-2">def compress_context(messages, threshold=0.8):
    """Cuando el contexto pasa el umbral, resume mensajes antiguos."""
    if count_tokens(messages) / MAX_CONTEXT < threshold:
        return messages
    # Tomar los mensajes mas viejos (excepto system prompt)
    old = messages[1:-10]  # Mantener system + ultimos 10
    summary = llm.summarize(old)
    return [messages[0], {"role": "system", "content": summary}] + messages[-10:]</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">RAG (Retrieval-Augmented Generation)</p>
        <p class="text-sm text-agent-muted mt-1">Almacenar informacion en una base de datos vectorial y recuperar solo los fragmentos relevantes para cada iteracion. Ideal para grandes bases de codigo.</p>
        {@html `<pre class="code-block text-xs mt-2">def rag_retrieve(query, top_k=5):
    """Busca los fragmentos mas relevantes en la vector DB."""
    embedding = embed(query)
    results = vector_db.search(embedding, top_k=top_k)
    context = "\\n---\\n".join([r.text for r in results])
    return {"role": "system", "content": f"Contexto relevante:\\n{context}"}</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Cuando el contexto se agota</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Que pasa cuando un agente se queda sin context window en medio de una tarea? Hay varias estrategias de recuperacion:
    </p>
    <ul class="space-y-2 text-sm text-agent-muted mb-4">
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">1.</span> <strong class="text-agent-text">Checkpoint y resume:</strong> Guardar el estado actual de la tarea, resumir lo hecho, y empezar una nueva sesion con el resumen como contexto.</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">2.</span> <strong class="text-agent-text">Divide and conquer:</strong> Dividir la tarea grande en sub-tareas que quepan cada una en el context window.</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">3.</span> <strong class="text-agent-text">Graceful degradation:</strong> Informar al usuario que la tarea es demasiado grande y sugerir como partirla.</li>
    </ul>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Claude Code usa una estrategia avanzada de compresion de contexto: cuando se acerca al limite, <strong class="text-agent-text">resume automaticamente los tool results antiguos</strong> manteniendo solo las conclusiones clave. Un tool result que mostraba 500 lineas de un archivo se comprime a "Lei src/main.py: contiene el endpoint principal con 3 rutas GET y 2 POST". Asi libera miles de tokens manteniendo la informacion esencial.</p>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La regla del 80%: nunca dejes que el contexto supere el 80% de su capacidad. Reserva siempre un 20% para la respuesta del modelo y posibles tool results inesperadamente largos. Si tu context window es de 200K tokens, empieza a comprimir cuando llegues a 160K. Esperar hasta el 95% es jugartela: un tool result grande puede exceder el limite y causar un error.</p>
    </div>
  </section>

  <!-- Section 4: Error Handling para Tool Calls -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Error Handling para Tool Calls</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas fallan. APIs caidas, rate limits, timeouts, parametros invalidos. Un agente sin manejo de errores es una bomba de tiempo. La pregunta no es SI va a fallar, sino CUANDO y COMO reacciona.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Patron 1: Retry con backoff exponencial</h3>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Para errores transitorios (rate limits, timeouts temporales)</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">MAX_RETRIES = 3
BASE_DELAY = 1  # segundos

def execute_tool_with_retry(tool_call):
    for attempt in range(MAX_RETRIES):
        try:
            result = execute_tool(tool_call)
            return {"status": "success", "data": result}

        except RateLimitError:
            delay = BASE_DELAY * (2 ** attempt)  # 1s, 2s, 4s
            sleep(delay)

        except ValidationError as e:
            # Error permanente: no reintentar
            return {"status": "error",
                    "message": f"Parametros invalidos: {e}"}

        except TimeoutError:
            if attempt == MAX_RETRIES - 1:
                return {"status": "error",
                        "message": "Herramienta no respondio"}

    return {"status": "error",
            "message": "Max retries alcanzado"}</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Patron 2: Circuit breaker</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Si una herramienta falla repetidamente, el circuit breaker la "desconecta" temporalmente para evitar desperdiciar tokens y tiempo en retries inutiles:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=60):
        self.failures = 0
        self.threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.state = "CLOSED"      # Normal: permite llamadas
        self.last_failure = None

    def call(self, tool_func, *args):
        if self.state == "OPEN":
            # Circuito abierto: no intentar
            if time.now() - self.last_failure > self.reset_timeout:
                self.state = "HALF_OPEN"  # Probar de nuevo
            else:
                return {"status": "error",
                        "message": "Herramienta temporalmente deshabilitada"}

        try:
            result = tool_func(*args)
            self.failures = 0
            self.state = "CLOSED"
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure = time.now()
            if self.failures >= self.threshold:
                self.state = "OPEN"  # Abrir circuito
            raise e</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Patron 3: Fallback chain</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Si la herramienta principal falla, intenta con una alternativa. Si esa tambien falla, pide ayuda al humano:
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">def search_with_fallback(query):
    # Intento 1: busqueda semantica (rapida, precisa)
    try:
        return vector_search(query)
    except VectorDBError:
        pass

    # Intento 2: busqueda por regex (mas lenta, menos precisa)
    try:
        return regex_search(query)
    except SearchError:
        pass

    # Intento 3: graceful degradation
    return {
        "status": "partial",
        "message": f"No pude buscar '{query}' automaticamente. "
                   f"Podrias buscar manualmente en el proyecto?"
    }</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El kill switch: siempre ten una salida de emergencia</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Todo agente necesita un mecanismo para DETENERSE. Sin un kill switch, un agente puede entrar en un loop infinito consumiendo tokens sin limite. Dos mecanismos basicos:
    </p>
    <ul class="space-y-2 text-sm text-agent-muted mb-4">
      <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">!</span> <strong class="text-agent-text">Max iteraciones:</strong> El agente se detiene despues de N iteraciones del loop, sin importar que. (ej: max_iterations=25)</li>
      <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">!</span> <strong class="text-agent-text">Token budget:</strong> El agente se detiene cuando ha consumido X tokens totales. Esto controla el costo maximo por tarea.</li>
    </ul>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Crear un agente con <code class="text-agent-accent">while True</code> sin condicion de salida. Si la herramienta falla con un error que no se maneja, o el LLM entra en un loop de tool calls repetitivas, el agente puede consumir miles de dolares en tokens antes de que alguien se de cuenta. SIEMPRE pon un max_iterations y un token_budget.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F504;</p>
        <p class="text-agent-text font-bold text-sm">Retry</p>
        <p class="text-xs text-agent-muted mt-1">Errores transitorios (rate limit, timeout). Max 3 intentos con backoff.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F500;</p>
        <p class="text-agent-text font-bold text-sm">Fallback</p>
        <p class="text-xs text-agent-muted mt-1">Tool alternativa si la principal falla. Degradacion gradual.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">&#x1F6D1;</p>
        <p class="text-agent-text font-bold text-sm">Kill Switch</p>
        <p class="text-xs text-agent-muted mt-1">Detencion forzada: max iteraciones o token budget excedido.</p>
      </div>
    </div>
  </section>

  <!-- Section 5: El Agente Minimo Viable -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. El Agente Minimo Viable</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Combinemos todo: definiciones de herramientas + agentic loop + error handling + gestion de contexto = un agente funcional. Este es el esqueleto que subyace a TODOS los agentes, desde los mas simples hasta Claude Code.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Agente completo en pseudocodigo</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">class MinimalAgent:
    def __init__(self, tools, system_prompt, max_iterations=25,
                 token_budget=100000):
        self.tools = tools
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations
        self.token_budget = token_budget
        self.tokens_used = 0

    def run(self, user_task):
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_task}
        ]

        for i in range(self.max_iterations):
            # 0. Verificar presupuesto de tokens
            if self.tokens_used > self.token_budget:
                return "Token budget excedido. Tarea parcial."

            # 1. Llamar al LLM
            response = llm.generate(
                messages=messages,
                tools=self.tools
            )
            messages.append(response.message)
            self.tokens_used += response.usage.total_tokens

            # 2. Verificar si hay tool_calls
            if not response.tool_calls:
                return response.text  # Tarea completa

            # 3. Ejecutar cada tool_call
            for tool_call in response.tool_calls:
                # Validar parametros contra el schema
                if not validate_params(tool_call):
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": "Error: parametros invalidos"
                    })
                    continue

                result = execute_with_retry(tool_call)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result)
                })

            # 4. Gestionar contexto
            if count_tokens(messages) > MAX_CONTEXT * 0.8:
                messages = compress_context(messages)

        return "Max iteraciones alcanzado"</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Recorrido linea por linea</h3>
    <div class="space-y-2 mb-4">
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">__init__</span>
        <p class="text-xs text-agent-muted">Configura las herramientas disponibles, el system prompt (personalidad del agente), limites de iteraciones y presupuesto de tokens.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">run()</span>
        <p class="text-xs text-agent-muted">Recibe la tarea del usuario, inicializa el historial de mensajes, y arranca el loop principal.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">Paso 0</span>
        <p class="text-xs text-agent-muted">Kill switch financiero: si el agente ya gasto demasiados tokens, se detiene antes de hacer otra llamada al LLM.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">Paso 1</span>
        <p class="text-xs text-agent-muted">Envia TODO el historial + herramientas al LLM. El modelo ve la conversacion completa y decide que hacer.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">Paso 2</span>
        <p class="text-xs text-agent-muted">Si el LLM NO hizo tool_calls, significa que quiere responder con texto. La tarea esta completa. Se sale del loop.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">Paso 3</span>
        <p class="text-xs text-agent-muted">Valida parametros, ejecuta cada herramienta con retry, y agrega los resultados al historial para que el LLM los vea en la siguiente iteracion.</p>
      </div>
      <div class="flex items-start gap-3 p-2 bg-agent-dark rounded border border-agent-border">
        <span class="text-agent-accent text-xs font-mono shrink-0 mt-0.5">Paso 4</span>
        <p class="text-xs text-agent-muted">Si el contexto esta al 80% de capacidad, comprime mensajes antiguos para liberar espacio antes de la siguiente iteracion.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tu agente minimo vs Claude Code: la brecha</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El agente minimo que acabas de ver tiene las mismas piezas fundamentales que Claude Code. La diferencia esta en la sofisticacion de cada pieza:
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Aspecto</th>
              <th class="text-left text-agent-text py-2 pr-4">Tu agente minimo</th>
              <th class="text-left text-agent-text py-2">Claude Code</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Tools</td><td class="py-2 pr-4">2-5 herramientas</td><td class="py-2">20+ herramientas especializadas</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Error handling</td><td class="py-2 pr-4">Retry basico</td><td class="py-2">Circuit breaker + fallback + human escalation</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Memoria</td><td class="py-2 pr-4">Solo context window</td><td class="py-2">Context + CLAUDE.md + MEMORY.md (episodica)</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Seguridad</td><td class="py-2 pr-4">Basica</td><td class="py-2">Sandbox, permisos, confirmacion de acciones</td></tr>
            <tr><td class="py-2 pr-4">Observabilidad</td><td class="py-2 pr-4">Ninguna</td><td class="py-2">Logs, metricas, trazas de cada accion</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El consejo de Anthropic es claro: <strong class="text-agent-text">empieza simple y agrega complejidad solo cuando la necesites</strong>. No construyas un framework de 10,000 lineas para tu primer agente. Empieza con el loop minimo, agrega una herramienta, prueba que funciona, y luego agrega otra. La complejidad prematura es el enemigo de los agentes que realmente funcionan.</p>
    </div>

    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm mb-2">Resumen de componentes del agente minimo:</p>
      <ul class="space-y-1 text-sm text-agent-muted">
        <li><span class="text-agent-accent">1.</span> System prompt para configurar el comportamiento</li>
        <li><span class="text-agent-accent">2.</span> Agentic loop con limite de iteraciones (stop condition)</li>
        <li><span class="text-agent-accent">3.</span> Validacion de parametros contra JSON Schema</li>
        <li><span class="text-agent-accent">4.</span> Manejo de multiples tool_calls por respuesta</li>
        <li><span class="text-agent-accent">5.</span> Retries para errores transitorios</li>
        <li><span class="text-agent-accent">6.</span> Token budget como kill switch financiero</li>
        <li><span class="text-agent-accent">7.</span> Compresion de contexto cuando se acerca al limite</li>
      </ul>
    </div>
  </section>

  <!-- InteractiveFlow -->
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
        title="Arquitectura del Agentic Loop"
        challenges={flowChallenges}
        onComplete={handleFlowComplete}
      />
    {/if}
  </section>

  <!-- Quiz -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Construye tu Primer Agente</h2>
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
      <span class="text-4xl">⚡</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ya conoces la arquitectura para construir un agente desde cero.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
