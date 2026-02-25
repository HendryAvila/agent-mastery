export interface VocabularyTerm {
  term: string;
  definition: string;
  module: number;
  category: string;
}

export const vocabulary: VocabularyTerm[] = [
  // =============================================
  // Modulo 1: Anatomia de un Agente IA
  // =============================================
  {
    term: 'Agent Loop',
    definition:
      'Ciclo continuo observe-think-act que ejecuta un agente IA. El agente observa el entorno (input del usuario, resultados de herramientas), razona sobre que hacer a continuacion, ejecuta una accion, y repite hasta completar la tarea. En Claude Code, este loop se ejecuta automaticamente con cada mensaje.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'LLM (Large Language Model)',
    definition:
      'Modelo de lenguaje de gran escala entrenado con cantidades masivas de texto. Es el cerebro del agente. En Claude Code, el LLM es Claude Opus 4.6 con 200K tokens de contexto (1M en beta). Recibe instrucciones en lenguaje natural, razona y decide que herramientas invocar.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Autonomia',
    definition:
      'Grado en que un agente puede tomar decisiones y ejecutar acciones sin intervencion humana. Va desde nivel 0 (chatbot que solo responde) hasta nivel 5 (agente completamente autonomo). Claude Code opera en nivel 3-4: ejecuta tareas complejas pero pide permisos para acciones destructivas.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Tool Use',
    definition:
      'Capacidad de un agente IA para invocar herramientas externas como parte de su razonamiento. En Claude Code, las tools incluyen Read, Write, Edit, Bash, Glob, Grep, y cualquier MCP server configurado. Transforma al LLM de un generador de texto en un actor que modifica el mundo real.',
    module: 1,
    category: 'Fundamentos'
  },
  {
    term: 'Copilot vs Agent',
    definition:
      'Un copilot asiste sugiriendo acciones que el usuario acepta o rechaza manualmente (ej: GitHub Copilot autocomplete). Un agente actua de forma autonoma: planifica, ejecuta herramientas y toma decisiones (ej: Claude Code resolviendo un bug). La diferencia clave es quien controla el flujo.',
    module: 1,
    category: 'Fundamentos'
  },

  // =============================================
  // Modulo 2: Tool Calling
  // =============================================
  {
    term: 'Function Calling',
    definition:
      'Mecanismo por el cual un LLM genera una solicitud estructurada (JSON) para invocar una funcion externa. El modelo NO ejecuta la funcion directamente, emite un payload con nombre y argumentos, y el sistema host ejecuta. En Claude Code, cada Read, Write, Bash es una function call.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'MCP (Model Context Protocol)',
    definition:
      'Protocolo abierto de Anthropic que estandariza como los agentes se conectan a herramientas externas. Funciona como un USB universal: un MCP server expone tools y cualquier cliente compatible las consume. Soporta 3 transportes: HTTP, SSE, stdio. Claude Code es el MCP client mas usado.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'JSON Schema',
    definition:
      'Especificacion estandar para definir la estructura y tipos de un objeto JSON. En agentes, describe los parametros de una herramienta para que el LLM genere llamadas validas. Cada tool de Claude Code tiene un JSON Schema interno que define sus parametros.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'Tool Definition',
    definition:
      'Descripcion formal de una herramienta: nombre, descripcion en lenguaje natural, y JSON Schema de parametros. Las 5 reglas de Anthropic: elegir las tools correctas, usar namespacing, dar contexto significativo, ser eficiente en tokens, y prompt-engineer las descripciones.',
    module: 2,
    category: 'Herramientas'
  },
  {
    term: 'Tool Search Tool',
    definition:
      'Tecnica avanzada de Anthropic donde en lugar de cargar todas las tools al contexto, se le da al agente una herramienta que BUSCA tools relevantes por query. Reduce el consumo de tokens un 85% cuando hay muchas herramientas disponibles (50+).',
    module: 2,
    category: 'Herramientas'
  },

  // =============================================
  // Modulo 3: Ecosistema 2026
  // =============================================
  {
    term: 'Coding Agent',
    definition:
      'Agente IA especializado en tareas de programacion: entiende codebases, edita archivos, ejecuta comandos, corre tests y maneja git. Claude Code es el coding agent principal de este curso. Otros: Cursor, OpenCode, Aider, Copilot Workspace.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'CLI Agent',
    definition:
      'Agente que opera desde la terminal con acceso directo al filesystem y comandos del SO. Ejemplos: Claude Code, OpenCode, Aider. Ventaja: contexto completo del proyecto, sin limites de UI. Claude Code es el CLI agent mas avanzado con soporte para sub-agents, hooks, skills.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'IDE Agent',
    definition:
      'Agente integrado en un editor (VS Code, JetBrains). Opera como extension con acceso al archivo actual y diffs inline. Ejemplos: Cursor, Cline, Roo Code. Claude Code tambien tiene extension de VS Code/JetBrains que combina lo mejor de ambos mundos.',
    module: 3,
    category: 'Herramientas'
  },
  {
    term: 'Agente Autonomo',
    definition:
      'Agente que ejecuta tareas de principio a fin sin intervencion continua. Planifica subtareas, ejecuta herramientas, maneja errores y se autocorrige. Devin fue pionero; Claude Code en headless mode puede operar autonomamente en CI/CD.',
    module: 3,
    category: 'Herramientas'
  },

  // =============================================
  // Modulo 4: Context Engineering
  // =============================================
  {
    term: 'Context Engineering',
    definition:
      'Disciplina de disenar y gestionar TODO el contexto que recibe un agente: system prompt, archivos cargados, resultados de tools, memoria, y metadatos. Es mas amplio que prompt engineering: abarca el ciclo de vida completo del contexto, no solo el mensaje del usuario.',
    module: 4,
    category: 'Patrones'
  },
  {
    term: 'Context Rot',
    definition:
      'Fenomeno donde la performance del agente se degrada a medida que el contexto crece. Al llenarse la ventana, el LLM pierde foco, olvida instrucciones tempranas, y comete errores. Mitigacion: /clear entre tareas, compaction, sub-agents con contextos limpios.',
    module: 4,
    category: 'Patrones'
  },
  {
    term: 'CLAUDE.md',
    definition:
      'Archivo de configuracion que Claude Code lee automaticamente al inicio de sesion. Forma una jerarquia de 6 capas: managed policy (Anthropic), user-global (~/.claude/CLAUDE.md), project root, project local, nested (.claude/rules/), y auto memory. Target: < 2.5K tokens.',
    module: 4,
    category: 'Herramientas'
  },
  {
    term: 'Just-In-Time Context',
    definition:
      'Estrategia de carga de contexto donde NO se carga toda la informacion al inicio, sino que se proporcionan identificadores ligeros y el agente carga detalles bajo demanda. Reduce context rot y mejora la performance en tareas largas.',
    module: 4,
    category: 'Patrones'
  },
  {
    term: 'Compaction',
    definition:
      'Tecnica de Claude Code (/compact) que resume la conversacion actual preservando decisiones y contexto critico, pero descartando detalles intermedios. Libera tokens para nuevo trabajo. Alternativa a /clear que preserva continuidad.',
    module: 4,
    category: 'Herramientas'
  },

  // =============================================
  // Modulo 5: Trabajar CON Claude Code
  // =============================================
  {
    term: 'Plan Mode',
    definition:
      'Modo de Claude Code (Shift+Tab) donde el agente explora y planifica en modo read-only sin ejecutar cambios. Ideal para la fase de exploracion: leer archivos, entender la codebase, disenar la solucion. Se sale con Shift+Tab de vuelta a modo normal.',
    module: 5,
    category: 'Herramientas'
  },
  {
    term: 'Worktree',
    definition:
      'Mecanismo de git que crea copias independientes del repositorio para trabajar en multiples features en paralelo. En Claude Code: `claude -w feature-name` o el tool EnterWorktree. Boris Cherny recomienda 3-5 sesiones paralelas con worktrees.',
    module: 5,
    category: 'Herramientas'
  },
  {
    term: 'Opusplan',
    definition:
      'Estrategia de model selection en Claude Code donde se usa Opus (mas caro, mejor razonamiento) para planificacion y Sonnet (mas barato, rapido) para ejecucion. Reduce costos significativamente sin sacrificar calidad en las decisiones arquitectonicas.',
    module: 5,
    category: 'Herramientas'
  },
  {
    term: 'Kitchen Sink Pattern',
    definition:
      'Anti-patron donde se mete todo en un solo prompt: contexto, instrucciones, restricciones, ejemplos, formatos. El agente se confunde por sobrecarga de informacion. Fix: dividir en tareas claras y secuenciales.',
    module: 5,
    category: 'Patrones'
  },
  {
    term: 'Correction Spiral',
    definition:
      'Anti-patron donde se corrige al agente repetidamente en la misma sesion, cada correccion genera mas contexto, y el rendimiento se degrada progresivamente. Fix: usar /clear y empezar una nueva sesion con instrucciones claras desde el inicio.',
    module: 5,
    category: 'Patrones'
  },

  // =============================================
  // Modulo 6: Construir tu Agente
  // =============================================
  {
    term: 'Agent SDK',
    definition:
      'Kit de desarrollo para construir agentes IA. El Claude Agent SDK de Anthropic proporciona 4 primitivas: Agent (modelo + tools + instructions), Tool (funciones externas), Handoff (transferir control), y Guardrail (validacion). Disponible en Python y TypeScript.',
    module: 6,
    category: 'Herramientas'
  },
  {
    term: 'Agentic Loop',
    definition:
      'Implementacion programatica del ciclo del agente: recibir input, enviar al LLM, verificar si quiere usar tools, ejecutar tools, reinyectar resultados, repetir hasta respuesta final. Es el patron central del Agent SDK y cualquier framework de agentes.',
    module: 6,
    category: 'Arquitectura'
  },
  {
    term: 'MCP Server',
    definition:
      'Servidor que expone herramientas y recursos via Model Context Protocol. Puede estar escrito en cualquier lenguaje (Go, Python, TypeScript). Ejemplo: Hoofy es un MCP server en Go que expone 30 tools para memoria persistente y desarrollo spec-driven.',
    module: 6,
    category: 'Arquitectura'
  },
  {
    term: 'Composition Root',
    definition:
      'Patron arquitectonico donde TODA la configuracion y dependencias del sistema se resuelven en un unico punto de entrada. En Hoofy, el main.go es el composition root: inicializa SQLite, crea el bridge, registra las 30 tools, y arranca el servidor MCP.',
    module: 6,
    category: 'Arquitectura'
  },
  {
    term: 'Stop Condition',
    definition:
      'Criterio que determina cuando el agentic loop debe detenerse. Puede ser: respuesta sin tool calls, numero maximo de iteraciones, presupuesto de tokens agotado, o tarea detectada como completa. Sin stop conditions claras, el agente puede entrar en loops infinitos.',
    module: 6,
    category: 'Arquitectura'
  },

  // =============================================
  // Modulo 7: Memoria, Planning y Razonamiento
  // =============================================
  {
    term: 'Think Tool',
    definition:
      'Herramienta especial que le da al modelo un "scratchpad" interno para razonar sin ejecutar acciones. En benchmarks de Anthropic, mejoró un 54% la performance en tareas que requieren politicas complejas. Se usa con extended thinking habilitado.',
    module: 7,
    category: 'Herramientas'
  },
  {
    term: 'Extended Thinking',
    definition:
      'Capacidad de Claude de realizar razonamiento interno extenso antes de responder. El modelo genera un bloque de pensamiento que puede ser muy largo. En Claude Code se configura con MAX_THINKING_TOKENS. Mejora significativamente la calidad en tareas complejas de codigo y analisis.',
    module: 7,
    category: 'Fundamentos'
  },
  {
    term: 'Chain-of-Thought (CoT)',
    definition:
      'Tecnica de prompting que hace que el LLM genere pasos de razonamiento intermedios antes de la respuesta final. Mejora drasticamente el rendimiento en tareas de logica, matematicas y planificacion. En Claude Code, el extended thinking es CoT automatico.',
    module: 7,
    category: 'Patrones'
  },
  {
    term: 'ReAct',
    definition:
      'Patron que intercala Reasoning y Acting en cada paso: el modelo piensa en voz alta (Thought), ejecuta una accion (Action), observa el resultado (Observation), y repite. Combina lo mejor de chain-of-thought con tool use. Es el patron base del agent loop de Claude Code.',
    module: 7,
    category: 'Patrones'
  },
  {
    term: 'Memoria Episodica',
    definition:
      'Sistema que almacena experiencias pasadas del agente: que tareas resolvio, que estrategias uso, que errores cometio. En Claude Code, el auto memory (CLAUDE.md auto-generado) implementa memoria episodica guardando learnings automaticamente entre sesiones.',
    module: 7,
    category: 'Arquitectura'
  },

  // =============================================
  // Modulo 8: Claude Code Deep Dive
  // =============================================
  {
    term: 'Hooks',
    definition:
      'Sistema de Claude Code que ejecuta comandos del sistema en respuesta a 17 eventos: PreToolUse, PostToolUse, Notification, Stop, SubAgentStop, etc. 3 tipos: command, prompt, agent. Exit code 0 = continuar, exit code 2 = bloquear. Se configuran en settings.json.',
    module: 8,
    category: 'Herramientas'
  },
  {
    term: 'Skills (SKILL.md)',
    definition:
      'Sistema de Claude Code para encapsular expertise como archivos Markdown. Un SKILL.md tiene frontmatter YAML (name, description, invocation control) y contenido con instrucciones. Soporta contexto dinamico: $ARGUMENTS y `command` para inyectar datos en runtime.',
    module: 8,
    category: 'Herramientas'
  },
  {
    term: 'Sub-Agents',
    definition:
      'Agentes que Claude Code puede lanzar dentro de una sesion. Built-in: Explore (Haiku, read-only), Plan (hereda modelo, read-only), general-purpose (todas las tools). Custom: definidos en .claude/agents/ con frontmatter YAML especificando modelo, tools y memoria.',
    module: 8,
    category: 'Herramientas'
  },
  {
    term: 'Frontmatter',
    definition:
      'Bloque YAML al inicio de un archivo Markdown (entre ---) que define metadatos. En Claude Code se usa en SKILL.md y agents/ para configurar name, description, allowed-tools, model, y opciones de invocacion. El contenido despues del frontmatter es el prompt.',
    module: 8,
    category: 'Herramientas'
  },
  {
    term: 'Sandbox',
    definition:
      'Sistema de aislamiento de Claude Code que restringe el acceso del agente al filesystem y la red. El filesystem sandbox limita que directorios puede leer/escribir. El network sandbox bloquea conexiones no autorizadas. Reduce los permisos necesarios un 84%.',
    module: 8,
    category: 'Seguridad'
  },
  {
    term: 'Headless Mode',
    definition:
      'Modo de Claude Code sin interfaz interactiva, para CI/CD. Se invoca con `claude -p "query"`. Soporta --max-turns, --allowedTools, --max-budget-usd. Formatos de output: text, json, stream-json. Ideal para GitHub Actions y automatizacion.',
    module: 8,
    category: 'Herramientas'
  },

  // =============================================
  // Modulo 9: Multi-Agent
  // =============================================
  {
    term: 'Orchestrator-Worker',
    definition:
      'Patron donde un agente orquestador central recibe la tarea, la descompone en subtareas, las asigna a workers especializados, recopila resultados y sintetiza la respuesta. El orquestador decide dinamicamente que workers invocar. Patron mas comun en sistemas multi-agente.',
    module: 9,
    category: 'Patrones'
  },
  {
    term: 'Agent Teams',
    definition:
      'Capacidad de Claude Code para lanzar multiples agentes que trabajan en paralelo sobre un codebase compartido. Un team lead coordina a los teammates via shared task list y mailbox. Ejemplo: 16 agentes escribieron un compilador C de 100K lineas en Rust.',
    module: 9,
    category: 'Herramientas'
  },
  {
    term: 'Agent Handoff',
    definition:
      'Mecanismo por el cual un agente transfiere control a otro agente especializado, pasando contexto relevante (no todo el historial). En Claude Agent SDK es una primitiva nativa. En Claude Code, se implementa via sub-agents con prompts de contexto.',
    module: 9,
    category: 'Patrones'
  },
  {
    term: 'Pipeline Pattern',
    definition:
      'Patron donde agentes se encadenan secuencialmente: la salida de uno es la entrada del siguiente. Cada agente transforma o enriquece los datos. Ejemplo: Agente 1 investiga, Agente 2 escribe borrador, Agente 3 revisa. Predecible y facil de debuggear.',
    module: 9,
    category: 'Patrones'
  },
  {
    term: 'Evaluator-Optimizer',
    definition:
      'Patron donde un agente genera una solucion y otro agente la evalua, dando feedback para iterar. Se repite hasta que la evaluacion pasa un threshold. Usado en Anthropic Multi-Agent Research System para lograr 90.2% de mejora sobre single agent.',
    module: 9,
    category: 'Patrones'
  },

  // =============================================
  // Modulo 10: Guardrails, Seguridad y Evaluacion
  // =============================================
  {
    term: 'Guardrail',
    definition:
      'Mecanismo que valida, filtra o restringe entradas y salidas de un agente. Input guardrails verifican usos maliciosos. Output guardrails aseguran cumplimiento de politicas. En Claude Code, los hooks PreToolUse actuan como guardrails bloqueando acciones peligrosas (exit code 2).',
    module: 10,
    category: 'Seguridad'
  },
  {
    term: 'Prompt Injection',
    definition:
      'Ataque donde instrucciones ocultas en el input manipulan el comportamiento del agente. Variantes: directa (en el prompt) e indirecta (en datos que el agente procesa). Claude Code mitiga con sandbox, permisos, y la capacidad del modelo de rechazar instrucciones maliciosas.',
    module: 10,
    category: 'Seguridad'
  },
  {
    term: 'Pass@k / Pass^k',
    definition:
      'Metricas de evaluacion para agentes. Pass@k: al menos 1 de k intentos es correcto (optimista). Pass^k: TODOS los k intentos son correctos (conservadora). La diferencia entre ambas mide la consistencia del agente. Pass^k es mejor para produccion.',
    module: 10,
    category: 'Herramientas'
  },
  {
    term: 'Infrastructure Noise',
    definition:
      'Variabilidad en resultados de evaluaciones causada por factores no relacionados con el agente: latencia de red, rate limits, flakes en CI/CD. Segun Anthropic, "diferencias menores a 3 puntos porcentuales merecen escepticismo". Se mitiga con multiples runs y statistical testing.',
    module: 10,
    category: 'Herramientas'
  },
  {
    term: 'Human-in-the-Loop',
    definition:
      'Patron donde se requiere aprobacion humana antes de acciones criticas: borrar archivos, hacer deploy, modificar bases de datos. En Claude Code, el modelo de permisos (allow/ask/deny) implementa HITL granularmente por tipo de tool y patron de argumento.',
    module: 10,
    category: 'Seguridad'
  },

  // =============================================
  // Modulo 11: Entorno del Agent Architect
  // =============================================
  {
    term: 'Terminal Multiplexer',
    definition:
      'Herramienta que ejecuta multiples sesiones de terminal en una ventana con paneles divididos y sesiones persistentes. Esencial para multi-agent: un panel para Claude Code, otro para tests, otro para logs. Herramientas: tmux (clasico), zellij (moderno con layouts y plugins).',
    module: 11,
    category: 'Herramientas'
  },
  {
    term: 'Workspace',
    definition:
      'Configuracion completa del entorno de desarrollo para trabajo con agentes. Incluye: directorio .claude/ con settings/agents/skills/rules, MCP servers configurados, terminal multiplexer, git worktrees, y scripts de automatizacion. Un buen workspace multiplica la productividad.',
    module: 11,
    category: 'Herramientas'
  },
  {
    term: 'Git Worktrees',
    definition:
      'Feature de git que permite tener multiples copias de trabajo del mismo repositorio, cada una en su propia branch. Ideal para correr multiples sesiones de Claude Code en paralelo sin conflictos. incident.io reporta 4-7 agentes concurrentes con worktrees.',
    module: 11,
    category: 'Herramientas'
  },
  {
    term: 'Multi-Session Pattern',
    definition:
      'Patron de trabajo donde se ejecutan 3-5 sesiones de Claude Code en paralelo, cada una con un worktree y tarea independiente. Boris Cherny (creador de Claude Code) recomienda este patron para maximizar throughput de desarrollo.',
    module: 11,
    category: 'Patrones'
  },

  // =============================================
  // Modulo 12: Agentes en Produccion
  // =============================================
  {
    term: 'Headless CI/CD',
    definition:
      'Ejecutar Claude Code en modo no interactivo dentro de pipelines de CI/CD. `claude -p "query"` con --allowedTools y --max-turns. La Claude Code GitHub Action (anthropics/claude-code-action@v1) automatiza esto para PRs y issues.',
    module: 12,
    category: 'Produccion'
  },
  {
    term: 'Long-Running Harness',
    definition:
      'Patron de Anthropic para tareas de agente que toman horas: un agente inicializador lee el repo y genera un plan, luego un agente ejecutor implementa una feature por sesion con /clear entre cada una. Progress files rastrean el estado entre sesiones.',
    module: 12,
    category: 'Produccion'
  },
  {
    term: 'Token Budget',
    definition:
      'Limite maximo de tokens asignado a un agente para evitar gastos descontrolados. En Claude Code: --max-budget-usd en headless mode, MAX_THINKING_TOKENS para limitar extended thinking. Critico en produccion donde un loop infinito puede costar miles de dolares.',
    module: 12,
    category: 'Produccion'
  },
  {
    term: 'Rainbow Deployment',
    definition:
      'Estrategia de deployment que asigna colores a versiones del sistema. Cuando se despliega una nueva version, los agentes que estan ejecutando en la version anterior continuan sin interrupcion. Solo los nuevos agentes usan la nueva version. Evita romper agentes en medio de una tarea.',
    module: 12,
    category: 'Produccion'
  },
  {
    term: 'Observabilidad',
    definition:
      'Capacidad de entender el estado interno de un sistema de agentes via logs, metricas y trazas. En Claude Code, los hooks Notification permiten emitir eventos a sistemas externos. El output JSON de headless mode facilita la integracion con observabilidad.',
    module: 12,
    category: 'Produccion'
  },

  // =============================================
  // Modulo 13: Taller Final
  // =============================================
  {
    term: 'System Design',
    definition:
      'Proceso de definir la arquitectura, componentes, interfaces y flujos de datos de un sistema de agentes. Incluye: cuantos agentes, que patron de orquestacion, que tools necesita cada uno, como manejar fallos, y como escalar. El taller final pone a prueba esta habilidad.',
    module: 13,
    category: 'Arquitectura'
  },
  {
    term: 'Architecture Decision Record (ADR)',
    definition:
      'Documento corto que registra una decision arquitectonica: contexto, opciones evaluadas, decision tomada, y justificacion. En proyectos con Claude Code, se pueden generar automaticamente con hooks o herramientas como el SDD pipeline de Hoofy.',
    module: 13,
    category: 'Arquitectura'
  },
  {
    term: 'Complexity Budget',
    definition:
      'Principio de Anthropic: empezar con el sistema mas simple posible y solo agregar complejidad cuando la evidencia lo justifique. Antes de agregar un agente, patron o herramienta, justificar que la complejidad anadida vale la pena.',
    module: 13,
    category: 'Arquitectura'
  },
  {
    term: 'Agent Dispatch Table',
    definition:
      'Tabla que define que agente especializado se invoca para cada tipo de tarea. En un CLAUDE.md profesional, mapea: "cuando el usuario pide X, usar agente Y". Ejemplo: bug report → code-quality-debugger, new feature → fullstack-developer.',
    module: 13,
    category: 'Arquitectura'
  },
  {
    term: 'Trade-off Analysis',
    definition:
      'Evaluacion sistematica de ventajas y desventajas de cada decision: agente unico vs multi-agente (simplicidad vs capacidad), autonomia vs HITL (velocidad vs seguridad), modelo caro vs barato (calidad vs costo). No hay soluciones perfectas, solo trade-offs entendidos.',
    module: 13,
    category: 'Arquitectura'
  }
];
