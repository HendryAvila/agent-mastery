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
    <p class="text-agent-muted leading-relaxed">
      El <strong class="text-agent-text">loop es el corazon</strong> de todo agente. Cada iteracion: (1) se envia el historial completo al LLM, (2) el modelo decide si usar herramientas o responder, (3) si usa herramientas, se ejecutan y el resultado vuelve al historial, (4) se repite hasta que el modelo decide que termino.
    </p>
  </section>

  <!-- Section 2: Definiendo Herramientas -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Definiendo Herramientas</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas son funciones que le das al LLM para que pueda actuar en el mundo real. Pero el modelo no las ejecuta directamente: genera un <strong class="text-agent-text">JSON estructurado</strong> que tu sistema interpreta y ejecuta.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Anatomia de una buena tool definition</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">{
  "name": "search_codebase",
  "description": "Busca patrones en el codigo fuente del proyecto usando regex. Retorna los archivos y lineas que coinciden. Usar cuando el usuario pregunta sobre implementaciones existentes o busca donde se usa una funcion.",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "Patron regex a buscar en los archivos"
      },
      "file_type": {
        "type": "string",
        "enum": ["py", "js", "ts", "all"],
        "description": "Tipo de archivo a filtrar"
      },
      "max_results": {
        "type": "integer",
        "default": 10,
        "description": "Numero maximo de resultados"
      }
    },
    "required": ["pattern"]
  }
}</pre>`}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Buenas practicas</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Nombre descriptivo (verbo + dominio)</li>
          <li>Descripcion con QUE hace, QUE retorna, CUANDO usarla</li>
          <li>Parametros tipados con descripciones</li>
          <li>Constraintes claros (enums, defaults, required)</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Anti-patrones</p>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li>Nombres vagos: "do_stuff", "helper"</li>
          <li>Descripcion: "hace cosas"</li>
          <li>Parametros sin tipos ni descripcion</li>
          <li>Una herramienta que hace 10 cosas diferentes</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Section 3: El Context Window -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. El Context Window</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El <strong class="text-agent-text">context window</strong> es la cantidad maxima de tokens que el LLM puede procesar en una sola llamada (input + output combinados). Es el cuello de botella numero 1 de cualquier agente.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-3">Context windows actuales (2026)</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Modelo</th>
              <th class="text-left text-agent-text py-2 pr-4">Context Window</th>
              <th class="text-left text-agent-text py-2">Aprox. en texto</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Claude Opus 4.6</td><td class="py-2 pr-4">200K tokens</td><td class="py-2">~150K palabras</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">GPT-4.1</td><td class="py-2 pr-4">1M tokens</td><td class="py-2">~750K palabras</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">Gemini 2.5 Pro</td><td class="py-2 pr-4">1M tokens</td><td class="py-2">~750K palabras</td></tr>
            <tr><td class="py-2 pr-4">Claude con extended context</td><td class="py-2 pr-4">1M tokens (beta)</td><td class="py-2">~750K palabras</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="text-agent-muted leading-relaxed mb-3">
      <strong class="text-agent-text">Estrategias de gestion de contexto:</strong>
    </p>
    <div class="space-y-3">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Sliding Window</p>
        <p class="text-sm text-agent-muted mt-1">Mantener solo los ultimos N mensajes. Simple pero pierde contexto antiguo que puede ser relevante.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">Summarization</p>
        <p class="text-sm text-agent-muted mt-1">Usar el LLM para resumir periodicamente el historial, reemplazando mensajes detallados con un resumen compacto.</p>
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-accent font-bold text-sm">RAG (Retrieval-Augmented Generation)</p>
        <p class="text-sm text-agent-muted mt-1">Almacenar informacion en una base de datos vectorial y recuperar solo los fragmentos relevantes para cada iteracion.</p>
      </div>
    </div>
  </section>

  <!-- Section 4: Error Handling para Tool Calls -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Error Handling para Tool Calls</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Las herramientas fallan. APIs caidas, rate limits, timeouts, parametros invalidos. Un agente sin manejo de errores es una bomba de tiempo.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Patron de retry con backoff exponencial</p>
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
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">🔄</p>
        <p class="text-agent-text font-bold text-sm">Retry</p>
        <p class="text-xs text-agent-muted mt-1">Errores transitorios (rate limit, timeout)</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">🔀</p>
        <p class="text-agent-text font-bold text-sm">Fallback</p>
        <p class="text-xs text-agent-muted mt-1">Tool alternativa si la principal falla</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4 text-center">
        <p class="text-2xl mb-1">🛑</p>
        <p class="text-agent-text font-bold text-sm">Graceful Degradation</p>
        <p class="text-xs text-agent-muted mt-1">Informar al usuario y continuar sin la tool</p>
      </div>
    </div>
  </section>

  <!-- Section 5: El Agente Minimo Viable -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. El Agente Minimo Viable</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Combinemos todo: definiciones de herramientas + agentic loop + error handling + gestion de contexto = un agente funcional.
    </p>
    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Agente completo en pseudocodigo</p>
      {@html `<pre class="code-block text-agent-highlight text-sm">class MinimalAgent:
    def __init__(self, tools, system_prompt, max_iterations=25):
        self.tools = tools
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations

    def run(self, user_task):
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_task}
        ]

        for i in range(self.max_iterations):
            # 1. Llamar al LLM
            response = llm.generate(
                messages=messages,
                tools=self.tools
            )
            messages.append(response.message)

            # 2. Verificar si hay tool_calls
            if not response.tool_calls:
                return response.text  # Tarea completa

            # 3. Ejecutar cada tool_call
            for tool_call in response.tool_calls:
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
    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm mb-2">Lo que acabas de ver:</p>
      <ul class="space-y-1 text-sm text-agent-muted">
        <li><span class="text-agent-accent">1.</span> System prompt para configurar el comportamiento</li>
        <li><span class="text-agent-accent">2.</span> Agentic loop con limite de iteraciones (stop condition)</li>
        <li><span class="text-agent-accent">3.</span> Manejo de multiples tool_calls por respuesta</li>
        <li><span class="text-agent-accent">4.</span> Retries para errores transitorios</li>
        <li><span class="text-agent-accent">5.</span> Compresion de contexto cuando se acerca al limite</li>
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
