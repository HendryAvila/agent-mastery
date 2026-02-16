export interface VocabularyTerm {
  term: string;
  definition: string;
  module: number;
  category: string;
}

export const vocabulary: VocabularyTerm[] = [
  // ═══════════════════════════════════════════════════════════
  // Modulo 1: Anatomia de un Agente IA
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Agent Loop',
    definition:
      'Ciclo continuo observe-think-act que ejecuta un agente IA. El agente observa el entorno (input del usuario, resultados de herramientas), razona sobre que hacer a continuacion, ejecuta una accion, y repite hasta completar la tarea o alcanzar un criterio de parada.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'LLM (Large Language Model)',
    definition:
      'Modelo de lenguaje de gran escala entrenado con cantidades masivas de texto. Es el cerebro del agente: recibe instrucciones en lenguaje natural, razona sobre ellas y genera respuestas o decide que herramientas invocar. Ejemplos: Claude, GPT, Gemini.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Autonomia',
    definition:
      'Grado en que un agente puede tomar decisiones y ejecutar acciones sin intervencion humana. Va desde nivel 0 (chatbot que solo responde) hasta nivel 5 (agente completamente autonomo que planifica, ejecuta y se autocorrige sin supervision).',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Tool Use',
    definition:
      'Capacidad de un agente IA para invocar herramientas externas (APIs, bases de datos, sistema de archivos) como parte de su razonamiento. Transforma al LLM de un generador de texto pasivo en un actor que puede modificar el mundo exterior.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Copilot vs Agent',
    definition:
      'Un copilot asiste al humano sugiriendo acciones que el usuario acepta o rechaza manualmente. Un agente actua de forma autonoma: planifica, ejecuta herramientas y toma decisiones sin esperar aprobacion en cada paso. La diferencia clave es quien tiene el control del flujo.',
    module: 1,
    category: 'Fundamentos'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 2: Tool Calling
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Function Calling',
    definition:
      'Mecanismo por el cual un LLM genera una solicitud estructurada (generalmente JSON) para invocar una funcion externa. El modelo no ejecuta la funcion directamente, sino que emite un payload con el nombre de la funcion y sus argumentos, y el sistema host se encarga de la ejecucion real.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'JSON Schema',
    definition:
      'Especificacion estandar para definir la estructura, tipos y restricciones de un objeto JSON. En el contexto de agentes, se usa para describir los parametros que acepta una herramienta, permitiendo al LLM generar llamadas validas y al sistema validar los argumentos antes de ejecutar.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'Tool Definition',
    definition:
      'Descripcion formal de una herramienta que se le proporciona al LLM. Incluye nombre, descripcion en lenguaje natural de que hace y cuando usarla, y el JSON Schema de sus parametros. Una buena definicion es clave para que el modelo elija y use la herramienta correctamente.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'Tool Result',
    definition:
      'Respuesta que devuelve una herramienta despues de ser ejecutada. Se reinyecta en el contexto del LLM para que continue su razonamiento. El modelo usa este resultado para decidir si la tarea esta completa o si necesita invocar mas herramientas.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'Strict Mode',
    definition:
      'Configuracion que fuerza al LLM a generar tool calls que se adhieran exactamente al JSON Schema definido, en lugar de hacer el mejor esfuerzo. Garantiza que los argumentos siempre sean validos y reduce errores de parsing en produccion.',
    module: 2,
    category: 'Herramientas'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 3: El Ecosistema de Agentes 2026
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Coding Agent',
    definition:
      'Agente IA especializado en tareas de programacion: entiende codebases, edita archivos, ejecuta comandos, corre tests y maneja flujos de git. Ejemplos: Claude Code, Cursor, OpenCode, Copilot Workspace. Van mas alla del autocompletado hacia la ejecucion autonoma de tareas.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'CLI Agent',
    definition:
      'Agente de codigo que opera desde la terminal (Command Line Interface). Tiene acceso directo al sistema de archivos, puede ejecutar comandos del sistema operativo y trabaja con el codebase completo. Ejemplos: Claude Code, OpenCode, Aider. Ideal para tareas que requieren contexto amplio del proyecto.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'IDE Agent',
    definition:
      'Agente integrado dentro de un entorno de desarrollo (VS Code, JetBrains). Opera como extension del editor, tiene acceso al archivo actual y archivos abiertos, y ofrece una experiencia visual con diffs inline. Ejemplos: Cursor, Cline, Roo Code, GitHub Copilot.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'Agente Autonomo',
    definition:
      'Agente que puede recibir una tarea de alto nivel y ejecutarla de principio a fin sin intervencion humana continua. Planifica subtareas, ejecuta herramientas, maneja errores y se autocorrige. Ejemplos: Devin, OpenAI Codex, agentes custom con Agent SDK.',
    module: 3,
    category: 'Herramientas'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 4: Trabajar CON Agentes Como un Pro
  // ═══════════════════════════════════════════════════════════
  {
    term: 'System Prompt',
    definition:
      'Instruccion inicial que configura el comportamiento, personalidad y restricciones de un agente antes de que el usuario interactue. Define QUE es el agente, COMO debe comportarse, y QUE puede o no hacer. En proyectos, se implementa via archivos como CLAUDE.md o .cursorrules.',
    module: 4,
    category: 'Herramientas'
  },
  {
    term: 'MCP (Model Context Protocol)',
    definition:
      'Protocolo abierto creado por Anthropic que estandariza como los agentes IA se conectan a fuentes de datos y herramientas externas. Funciona como un USB universal para agentes: un servidor MCP expone capacidades y cualquier cliente MCP compatible puede consumirlas sin integracion custom.',
    module: 4,
    category: 'Herramientas'
  },
  {
    term: 'Rules File',
    definition:
      'Archivo de configuracion que define reglas, convenciones y restricciones para que un agente siga al trabajar en un proyecto especifico. Ejemplos: CLAUDE.md para Claude Code, .cursorrules para Cursor, .github/copilot-instructions.md para Copilot. Es la forma de codificar el conocimiento del equipo.',
    module: 4,
    category: 'Herramientas'
  },
  {
    term: 'Plan-Act-Reflect',
    definition:
      'Flujo de trabajo en tres fases para usar agentes efectivamente. Plan: definir que se quiere lograr con especificaciones claras. Act: dejar al agente ejecutar la implementacion. Reflect: revisar criticamente el resultado, verificar calidad y corregir. Evita el anti-patron de aceptar ciegamente la salida del agente.',
    module: 4,
    category: 'Patrones'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 5: Construye tu Primer Agente
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Agentic Loop',
    definition:
      'Implementacion programatica del ciclo de un agente: recibir input, enviarlo al LLM, verificar si el modelo quiere usar herramientas, ejecutar las herramientas, reinyectar resultados, y repetir hasta que el modelo genere una respuesta final sin tool calls. Es el patron central de cualquier framework de agentes.',
    module: 5,
    category: 'Arquitectura'
  },
  {
    term: 'Context Window',
    definition:
      'Cantidad maxima de tokens que un LLM puede procesar en una sola llamada (input + output). Para Claude Opus 4.6 es 200K tokens (1M en beta). Gestionar esta ventana es critico: si el contexto se llena, el agente pierde informacion. Estrategias incluyen resumen, compresion y seleccion inteligente de contexto.',
    module: 5,
    category: 'Fundamentos'
  },
  {
    term: 'Token',
    definition:
      'Unidad minima de procesamiento de texto para un LLM. Aproximadamente 3/4 de una palabra en ingles. Cada llamada al modelo consume tokens de entrada (prompt + contexto) y genera tokens de salida (respuesta). Los costos de API se calculan por millon de tokens procesados.',
    module: 5,
    category: 'Fundamentos'
  },
  {
    term: 'Retry Pattern',
    definition:
      'Patron de diseno que reintenta automaticamente una operacion fallida (tool call, llamada a API) con estrategias como backoff exponencial, limites de reintentos, y manejo de errores transitorios. Esencial en agentes porque las herramientas externas pueden fallar temporalmente por rate limits, timeouts o errores de red.',
    module: 5,
    category: 'Patrones'
  },
  {
    term: 'Stop Condition',
    definition:
      'Criterio que determina cuando el agentic loop debe detenerse. Puede ser: el modelo genera una respuesta sin tool calls, se alcanza un numero maximo de iteraciones, se supera un presupuesto de tokens, o el agente detecta que la tarea esta completa. Sin stop conditions claras, un agente puede entrar en loops infinitos.',
    module: 5,
    category: 'Arquitectura'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 6: Memoria, Planning y Razonamiento
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Chain-of-Thought (CoT)',
    definition:
      'Tecnica de prompting que hace que el LLM genere pasos de razonamiento intermedios antes de llegar a una respuesta final. Mejora drasticamente el rendimiento en tareas complejas de logica, matematicas y planificacion. Funciona simplemente anadiendo "piensa paso a paso" o ejemplos con razonamiento explicito.',
    module: 6,
    category: 'Patrones'
  },
  {
    term: 'Tree-of-Thought (ToT)',
    definition:
      'Extension de Chain-of-Thought donde el modelo explora multiples caminos de razonamiento en paralelo, evalua cada rama, y selecciona la mas prometedora. Permite backtracking: si un camino no lleva a buen resultado, el agente puede retroceder y probar otra ruta. Util para problemas con multiples soluciones posibles.',
    module: 6,
    category: 'Patrones'
  },
  {
    term: 'ReAct',
    definition:
      'Patron que intercala Razonamiento (Reasoning) y Accion (Acting) en cada paso del agente. El modelo primero piensa en voz alta sobre que hacer y por que (Thought), luego ejecuta una accion (Action), observa el resultado (Observation), y repite. Combina lo mejor de chain-of-thought con tool use.',
    module: 6,
    category: 'Patrones'
  },
  {
    term: 'Memoria Episodica',
    definition:
      'Sistema de memoria que almacena experiencias pasadas completas del agente: que tareas resolvio, que estrategias uso, que errores cometio, y que resultados obtuvo. Permite al agente aprender de su propia experiencia y aplicar soluciones similares a problemas nuevos. Analogia: los recuerdos especificos de una persona.',
    module: 6,
    category: 'Arquitectura'
  },
  {
    term: 'Extended Thinking',
    definition:
      'Capacidad de modelos avanzados (como Claude con thinking habilitado) de realizar razonamiento interno extenso antes de responder. El modelo genera un bloque de pensamiento que puede ser muy largo y detallado, mejorando significativamente la calidad de respuestas en tareas complejas de codigo, matematicas y analisis.',
    module: 6,
    category: 'Fundamentos'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 7: Frameworks Multi-Agente
  // ═══════════════════════════════════════════════════════════
  {
    term: 'SDK (Software Development Kit)',
    definition:
      'Conjunto de herramientas, librerias y documentacion que facilita la construccion de agentes IA. Un Agent SDK abstrae la complejidad del agentic loop, tool calling, y manejo de contexto. Ejemplos: Claude Agent SDK (Anthropic), OpenAI Agents SDK, Strands SDK (AWS). Cada uno con trade-offs diferentes.',
    module: 7,
    category: 'Herramientas'
  },
  {
    term: 'Orchestration Framework',
    definition:
      'Framework que permite definir, coordinar y ejecutar flujos de trabajo complejos con uno o mas agentes. Maneja el estado, el routing de tareas, los handoffs entre agentes, y la persistencia. Ejemplos: LangGraph (grafos de estado), CrewAI (agentes con roles), Strands (model-driven). La eleccion depende del nivel de control necesario.',
    module: 7,
    category: 'Arquitectura'
  },
  {
    term: 'Multi-Agent System',
    definition:
      'Arquitectura donde multiples agentes especializados colaboran para resolver un problema complejo. Cada agente tiene un rol definido (ej: investigador, codificador, revisor) y se comunican entre si. Ventaja: descomposicion de problemas complejos. Desventaja: mayor complejidad de coordinacion y debugging.',
    module: 7,
    category: 'Arquitectura'
  },
  {
    term: 'Agent Handoff',
    definition:
      'Mecanismo por el cual un agente transfiere el control de la conversacion o tarea a otro agente especializado. El agente que hace el handoff pasa el contexto relevante (no todo el historial) al agente receptor. Es critico que la transferencia de contexto sea limpia para evitar perdida de informacion o confusiones.',
    module: 7,
    category: 'Patrones'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 8: Patrones de Orquestacion Multi-Agente
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Orchestrator-Worker',
    definition:
      'Patron donde un agente orquestador central recibe la tarea, la descompone en subtareas, las asigna a agentes workers especializados, recopila resultados y sintetiza la respuesta final. El orquestador decide dinamicamente que workers invocar segun la naturaleza del problema. Patron mas comun en sistemas multi-agente.',
    module: 8,
    category: 'Patrones'
  },
  {
    term: 'Manager Pattern',
    definition:
      'Variante del orchestrator-worker donde el agente manager tiene autoridad jerarquica sobre los workers. El manager no solo asigna tareas sino que revisa resultados, puede rechazarlos y pedir retrabajos, y toma decisiones de escalado. Similar a un tech lead que hace code review del trabajo de su equipo.',
    module: 8,
    category: 'Patrones'
  },
  {
    term: 'Hierarchical Pattern',
    definition:
      'Arquitectura multi-agente con multiples niveles de jerarquia. Un agente director delega a managers, que a su vez delegan a workers. Permite manejar problemas muy complejos descomponiendolos en capas. Riesgo: overhead de comunicacion entre niveles y posible perdida de contexto en la cascada.',
    module: 8,
    category: 'Patrones'
  },
  {
    term: 'Parallel Execution',
    definition:
      'Patron donde multiples agentes trabajan simultaneamente en subtareas independientes. Un orquestador divide el trabajo, lanza agentes en paralelo, espera a que todos terminen, y combina los resultados. Reduce dramaticamente el tiempo total pero requiere que las subtareas sean genuinamente independientes.',
    module: 8,
    category: 'Patrones'
  },
  {
    term: 'Pipeline Pattern',
    definition:
      'Patron donde los agentes se encadenan secuencialmente: la salida de un agente es la entrada del siguiente. Cada agente en el pipeline transforma o enriquece los datos. Ejemplo: Agente 1 investiga, Agente 2 escribe borrador, Agente 3 revisa, Agente 4 formatea. Predecible y facil de debuggear.',
    module: 8,
    category: 'Patrones'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 9: Guardrails, Seguridad y Evaluacion
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Guardrail',
    definition:
      'Mecanismo de proteccion que valida, filtra o restringe las entradas y salidas de un agente. Los input guardrails verifican que el usuario no intente usos maliciosos. Los output guardrails aseguran que las respuestas cumplan politicas. Pueden correr en paralelo con el agente (fail-fast) o de forma bloqueante.',
    module: 9,
    category: 'Seguridad'
  },
  {
    term: 'Prompt Injection',
    definition:
      'Ataque donde un usuario malicioso inserta instrucciones ocultas en su input para manipular el comportamiento del agente, evadir restricciones o extraer informacion sensible. Variantes: directa (en el prompt del usuario) e indirecta (escondida en datos que el agente procesa, como paginas web o documentos).',
    module: 9,
    category: 'Seguridad'
  },
  {
    term: 'SWE-bench',
    definition:
      'Benchmark estandar para evaluar agentes de codigo. Presenta problemas reales tomados de issues de GitHub en repositorios Python populares. El agente debe entender el issue, localizar el codigo relevante, y generar un parche que pase los tests existentes. Mide la capacidad real de un agente para resolver bugs en codigo de produccion.',
    module: 9,
    category: 'Herramientas'
  },
  {
    term: 'Human-in-the-Loop',
    definition:
      'Patron de seguridad donde se requiere aprobacion humana antes de que el agente ejecute acciones criticas o irreversibles (borrar archivos, hacer deploy, enviar emails, modificar bases de datos). El agente propone la accion, el humano la aprueba o rechaza, y entonces se ejecuta. Balance entre autonomia y seguridad.',
    module: 9,
    category: 'Seguridad'
  },
  {
    term: 'Data Exfiltration',
    definition:
      'Vector de ataque donde un agente maliciosamente manipulado extrae informacion sensible del sistema y la envia a un destino externo. Puede ocurrir si el agente tiene acceso a archivos, bases de datos o APIs internas y un atacante logra inyectar instrucciones para que envie esos datos afuera. Se mitiga con permisos minimos y sandboxing.',
    module: 9,
    category: 'Seguridad'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 10: El Entorno del Agent Architect
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Terminal Multiplexer',
    definition:
      'Herramienta que permite ejecutar multiples sesiones de terminal en una sola ventana, dividir paneles, y mantener sesiones persistentes. Esencial para trabajo multi-agente: un panel para Claude Code, otro para OpenCode, otro para logs, otro para tests. Herramientas principales: tmux (clasico), zellij (moderno, con layouts y plugins).',
    module: 10,
    category: 'Herramientas'
  },
  {
    term: 'CoWork',
    definition:
      'Producto de Anthropic que permite a usuarios no-desarrolladores trabajar con Claude de forma agentica. Claude accede a una carpeta del computador del usuario y puede leer, editar y crear archivos. Soporta plugins para tareas especializadas (legal, marketing, analisis de datos). Disponible para suscriptores Pro, Team y Enterprise.',
    module: 10,
    category: 'Herramientas'
  },
  {
    term: 'Agent Teams',
    definition:
      'Capacidad de Claude Code (desde Opus 4.6) para lanzar multiples agentes que trabajan en paralelo sobre un codebase compartido sin intervencion humana activa. Cada agente toma una subtarea del problema principal. Ejemplo: 16 agentes escribieron un compilador C de 100,000 lineas en Rust capaz de compilar el kernel Linux.',
    module: 10,
    category: 'Herramientas'
  },
  {
    term: 'Workspace',
    definition:
      'Configuracion completa del entorno de desarrollo optimizado para trabajo con agentes. Incluye: terminal multiplexer con layouts predefinidos, rules files por proyecto, servidores MCP configurados, IDE con extensiones de agentes, y scripts de automatizacion. Un buen workspace multiplica la productividad con agentes.',
    module: 10,
    category: 'Herramientas'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 11: Agentes en Produccion
  // ═══════════════════════════════════════════════════════════
  {
    term: 'Observabilidad',
    definition:
      'Capacidad de entender el estado interno de un sistema de agentes a traves de sus salidas externas. Incluye tres pilares: logs (eventos textuales), metricas (valores numericos como latencia, tokens usados, tasa de exito) y trazas (seguimiento del flujo completo de una peticion a traves de multiples agentes y herramientas).',
    module: 11,
    category: 'Produccion'
  },
  {
    term: 'Token Budget',
    definition:
      'Limite maximo de tokens que se le asigna a un agente o tarea para evitar gastos descontrolados. Si el agente consume el presupuesto antes de completar la tarea, debe parar o escalar al humano. Critico en produccion donde un agente en loop puede consumir miles de dolares en minutos sin token budget.',
    module: 11,
    category: 'Produccion'
  },
  {
    term: 'Rate Limiting',
    definition:
      'Mecanismo que limita el numero de peticiones que un agente puede hacer a una API en un periodo de tiempo. Protege contra abuso, controla costos, y evita que un agente sobrecargue servicios externos. Se implementa con token buckets, sliding windows o contadores simples. Las APIs de LLMs tienen rate limits propios que el agente debe respetar.',
    module: 11,
    category: 'Produccion'
  },
  {
    term: 'Idempotencia',
    definition:
      'Propiedad de una operacion que produce el mismo resultado sin importar cuantas veces se ejecute. Critica en agentes porque los retries y loops pueden causar ejecuciones duplicadas. Si un agente crea un usuario, la operacion debe ser idempotente para que el retry no cree usuarios duplicados. Se implementa con claves de idempotencia o verificaciones previas.',
    module: 11,
    category: 'Produccion'
  },
  {
    term: 'Tracing',
    definition:
      'Sistema que registra el flujo completo de ejecucion de un agente: cada prompt enviado, cada respuesta recibida, cada tool call ejecutada, tiempos, tokens consumidos y errores. Permite reconstruir exactamente que hizo el agente y por que. Herramientas: OpenAI Traces, LangSmith, Datadog LLM Observability, OpenTelemetry.',
    module: 11,
    category: 'Produccion'
  },

  // ═══════════════════════════════════════════════════════════
  // Modulo 12: Taller Final
  // ═══════════════════════════════════════════════════════════
  {
    term: 'System Design',
    definition:
      'Proceso de definir la arquitectura, componentes, modulos, interfaces y flujos de datos de un sistema para satisfacer requisitos especificos. En el contexto de agentes, incluye decidir cuantos agentes usar, que patron de orquestacion aplicar, que herramientas necesita cada agente, como manejar fallos, y como escalar.',
    module: 12,
    category: 'Arquitectura'
  },
  {
    term: 'Trade-off Analysis',
    definition:
      'Evaluacion sistematica de las ventajas y desventajas de cada decision arquitectonica. En agentes: agente unico vs multi-agente (simplicidad vs capacidad), autonomia total vs human-in-the-loop (velocidad vs seguridad), modelo caro vs barato (calidad vs costo). No hay soluciones perfectas, solo trade-offs bien entendidos.',
    module: 12,
    category: 'Arquitectura'
  },
  {
    term: 'Architecture Decision Record (ADR)',
    definition:
      'Documento corto que registra una decision arquitectonica importante: contexto del problema, opciones evaluadas, decision tomada, y justificacion. En proyectos con agentes, es critico documentar POR QUE se eligio un patron, framework o nivel de autonomia especifico. Permite que el equipo futuro entienda las decisiones sin tener que redescubrirlas.',
    module: 12,
    category: 'Arquitectura'
  },
  {
    term: 'Evaluacion End-to-End',
    definition:
      'Proceso de verificar que un sistema de agentes funciona correctamente de principio a fin, simulando escenarios reales completos. Incluye: precision de las respuestas, manejo de errores, respeto de guardrails, tiempo de ejecucion, costo de tokens, y experiencia de usuario. Se usan datasets de evaluacion y metricas automatizadas.',
    module: 12,
    category: 'Produccion'
  },
  {
    term: 'Complexity Budget',
    definition:
      'Principio que establece un limite a la complejidad arquitectonica de un sistema de agentes. Antes de agregar un agente, patron o herramienta, se debe justificar que la complejidad anadida vale la pena. La regla de Anthropic: empezar con el sistema mas simple posible y solo agregar complejidad cuando la evidencia lo justifique.',
    module: 12,
    category: 'Arquitectura'
  }
];
