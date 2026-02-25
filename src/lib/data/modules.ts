export interface Source {
  name: string;
  url: string;
}

export interface ModuleInfo {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  duration: string;
  type: string;
  description: string;
  objectives: string[];
  sources: Source[];
}

export const modules: ModuleInfo[] = [
  {
    id: 1,
    title: 'Anatomia de un Agente IA',
    subtitle: 'El ciclo observe-think-act y Claude Code como implementacion de referencia',
    icon: '\u{1F9EC}',
    duration: '35 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Que es un agente IA, como funciona internamente, y como Claude Code implementa cada componente',
    objectives: [
      'Definir que es un agente IA vs un chatbot',
      'Explicar el agent loop (observe-think-act)',
      'Identificar los 4 componentes core (LLM, Tools, Memory, Planning)',
      'Mapear cada componente a su implementacion en Claude Code',
      'Clasificar niveles de autonomia'
    ],
    sources: [
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/engineering/building-effective-agents'
      },
      {
        name: 'Anthropic - Building Agents with Claude Agent SDK',
        url: 'https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk'
      },
      {
        name: 'Claude Code - Overview',
        url: 'https://code.claude.com/docs/en/overview'
      },
      {
        name: 'ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al. 2022)',
        url: 'https://arxiv.org/abs/2210.03629'
      }
    ]
  },
  {
    id: 2,
    title: 'Tool Calling — El Superpoder del Agente',
    subtitle: 'Function calling, MCP, y los 5 principios de diseno de herramientas',
    icon: '\u{1F527}',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'El corazon tecnico de todo agente: como el LLM llama herramientas, MCP, y como disenar tools efectivos',
    objectives: [
      'Explicar function calling y el flujo prompt-tool_call-result-response',
      'Entender MCP: protocolo, transportes (HTTP, SSE, stdio) y scopes',
      'Aplicar los 5 principios de tool design de Anthropic',
      'Conocer Tool Search Tool y su reduccion del 85% en tokens',
      'Disenar tool definitions con JSON Schema'
    ],
    sources: [
      {
        name: 'Anthropic - Writing Effective Tools for Agents',
        url: 'https://www.anthropic.com/engineering/writing-tools-for-agents'
      },
      {
        name: 'Anthropic - Advanced Tool Use',
        url: 'https://www.anthropic.com/engineering/advanced-tool-use'
      },
      {
        name: 'Claude Code - MCP',
        url: 'https://code.claude.com/docs/en/mcp'
      },
      {
        name: 'Anthropic - Tool Use with Claude',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview'
      }
    ]
  },
  {
    id: 3,
    title: 'El Ecosistema de Agentes 2026',
    subtitle: 'Claude Code como protagonista, y el mapa completo del universo agentico',
    icon: '\u{1F310}',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Claude Code como agente principal del curso, comparacion con CLI/IDE/autonomos, y por que es el foco',
    objectives: [
      'Entender por que Claude Code es el agente principal de este curso',
      'Comparar agentes CLI vs IDE vs autonomos',
      'Conocer las superficies de Claude Code (CLI, IDE, SDK, API)',
      'Evaluar criterios de seleccion entre herramientas',
      'Identificar tendencias del mercado agentico 2026'
    ],
    sources: [
      {
        name: 'Claude Code - Overview',
        url: 'https://code.claude.com/docs/en/overview'
      },
      {
        name: 'Anthropic - Claude Code Best Practices',
        url: 'https://code.claude.com/docs/en/best-practices'
      },
      {
        name: 'Faros AI - Best AI Coding Agents for 2026',
        url: 'https://www.faros.ai/blog/best-ai-coding-agents-2026'
      },
      {
        name: 'Qodo - Roo Code vs Cline: Best AI Coding Agents for VS Code (2026)',
        url: 'https://www.qodo.ai/blog/roo-code-vs-cline/'
      }
    ]
  },
  {
    id: 4,
    title: 'Context Engineering',
    subtitle: 'CLAUDE.md, context rot, y las 3 tecnicas para tareas largas',
    icon: '\u{1F3AF}',
    duration: '45 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'El arte de disenar el contexto que recibe el agente: CLAUDE.md, just-in-time context, compaction y sub-agents',
    objectives: [
      'Diferenciar context engineering de prompt engineering',
      'Dominar la jerarquia de 6 capas de CLAUDE.md',
      'Aplicar la estrategia just-in-time para cargar contexto',
      'Usar las 3 tecnicas para tareas largas: compaction, note-taking, sub-agents',
      'Entender la regla del 60% y el impacto de /clear en costos'
    ],
    sources: [
      {
        name: 'Anthropic - Effective Context Engineering for AI Agents',
        url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents'
      },
      {
        name: 'Anthropic - Effective Harnesses for Long-Running Agents',
        url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
      },
      {
        name: 'Anthropic - Managing Context on Developer Platform',
        url: 'https://www.anthropic.com/news/context-management'
      },
      {
        name: 'Claude Code - Memory',
        url: 'https://code.claude.com/docs/en/memory'
      },
      {
        name: 'Claude Code - Best Practices',
        url: 'https://code.claude.com/docs/en/best-practices'
      },
      {
        name: 'Boris Cherny - 22 Tips for Claude Code',
        url: 'https://www.builder.io/blog/claude-code-tips'
      }
    ]
  },
  {
    id: 5,
    title: 'Trabajar CON Claude Code',
    subtitle: 'El workflow de 4 fases, Plan Mode, y los 5 patrones de fracaso',
    icon: '\u{1F4BB}',
    duration: '50 min',
    type: 'Teoria + Escenario Ramificado + Quiz',
    description:
      'Como trabajar efectivamente con Claude Code: workflow profesional, verificacion, patrones de fracaso, y optimizacion de costos',
    objectives: [
      'Aplicar el workflow de 4 fases: Explore, Plan, Implement, Commit',
      'Usar Plan Mode (Shift+Tab) para exploracion read-only',
      'Identificar y evitar los 5 patrones de fracaso comunes',
      'Estructurar prompts con Context + Objective + Constraints',
      'Optimizar costos con /clear, /compact, opusplan y batch API'
    ],
    sources: [
      {
        name: 'Claude Code - Best Practices',
        url: 'https://code.claude.com/docs/en/best-practices'
      },
      {
        name: 'Claude Code - Common Workflows',
        url: 'https://code.claude.com/docs/en/tutorials'
      },
      {
        name: 'Steve Kinney - Claude Code Deep Dive (Builder.io)',
        url: 'https://www.builder.io/blog/claude-code'
      },
      {
        name: 'incident.io - Shipping Faster with Claude Code',
        url: 'https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees'
      },
      {
        name: 'Claude Code - Cost Management',
        url: 'https://code.claude.com/docs/en/costs'
      }
    ]
  },
  {
    id: 6,
    title: 'Construir tu Agente',
    subtitle: 'Claude Agent SDK, MCP servers, y Hoofy como caso de estudio',
    icon: '\u26A1',
    duration: '50 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Construir agentes con el ecosistema Claude: Agent SDK, MCP servers, y un caso de estudio real',
    objectives: [
      'Implementar el ciclo de 4 fases del Agent SDK: Gather Context, Take Action, Verify, Iterate',
      'Entender la estructura de un MCP server y sus tools',
      'Analizar Hoofy como caso de estudio: composition root, bridge pattern, knowledge graph',
      'Decidir cuando usar Agent SDK vs Claude Code directo',
      'Aplicar retry y error handling en agentic loops'
    ],
    sources: [
      {
        name: 'Anthropic - Building Agents with Claude Agent SDK',
        url: 'https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk'
      },
      {
        name: 'Anthropic - Code Execution with MCP',
        url: 'https://www.anthropic.com/engineering/code-execution-with-mcp'
      },
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/engineering/building-effective-agents'
      },
      {
        name: 'Hoofy MCP - GitHub',
        url: 'https://github.com/HendryAvila/Hoofy'
      }
    ]
  },
  {
    id: 7,
    title: 'Memoria, Planning y Razonamiento',
    subtitle: 'Think Tool, extended thinking, y la jerarquia de memoria de Claude Code',
    icon: '\u{1F9E0}',
    duration: '45 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Sistemas de memoria, estrategias de razonamiento, Think Tool, y como Claude Code gestiona el contexto',
    objectives: [
      'Diferenciar los 6 niveles de memoria en Claude Code',
      'Explicar Think Tool y su mejora del 54% en tareas complejas',
      'Configurar extended thinking y MAX_THINKING_TOKENS',
      'Aplicar Chain-of-Thought y ReAct como patrones de razonamiento',
      'Entender el impacto de memory + context editing (39% mejora)'
    ],
    sources: [
      {
        name: 'Anthropic - The Think Tool',
        url: 'https://www.anthropic.com/engineering/claude-think-tool'
      },
      {
        name: 'Claude Code - Memory',
        url: 'https://code.claude.com/docs/en/memory'
      },
      {
        name: 'Anthropic - Effective Harnesses for Long-Running Agents',
        url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
      },
      {
        name: 'ReAct: Synergizing Reasoning and Acting (Yao et al. 2022)',
        url: 'https://arxiv.org/abs/2210.03629'
      },
      {
        name: 'Chain-of-Thought Prompting (Wei et al. 2022)',
        url: 'https://arxiv.org/abs/2201.11903'
      }
    ]
  },
  {
    id: 8,
    title: 'Claude Code Deep Dive',
    subtitle: 'Hooks, skills, sub-agents, permisos y modo headless',
    icon: '\u{1F52C}',
    duration: '50 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Domina la arquitectura interna de Claude Code: directorio .claude/, hooks, skills, sub-agents, permisos y headless mode',
    objectives: [
      'Navegar la estructura completa del directorio .claude/',
      'Configurar hooks (17 eventos, 3 tipos, exit codes, matchers)',
      'Crear skills con SKILL.md, frontmatter y contexto dinamico',
      'Usar sub-agents (built-in + custom) con isolation y memoria',
      'Configurar permisos (allow/ask/deny) y sandbox',
      'Ejecutar Claude Code en modo headless para CI/CD'
    ],
    sources: [
      {
        name: 'Claude Code - Hooks Reference',
        url: 'https://code.claude.com/docs/en/hooks'
      },
      {
        name: 'Claude Code - Hooks Guide',
        url: 'https://code.claude.com/docs/en/hooks-guide'
      },
      {
        name: 'Claude Code - Skills',
        url: 'https://code.claude.com/docs/en/skills'
      },
      {
        name: 'Claude Code - Sub-Agents',
        url: 'https://code.claude.com/docs/en/sub-agents'
      },
      {
        name: 'Claude Code - Settings',
        url: 'https://code.claude.com/docs/en/settings'
      },
      {
        name: 'Claude Code - Permissions',
        url: 'https://code.claude.com/docs/en/permissions'
      },
      {
        name: 'Claude Code - Headless Mode',
        url: 'https://code.claude.com/docs/en/headless'
      },
      {
        name: 'Anthropic - Claude Code Sandboxing',
        url: 'https://www.anthropic.com/engineering/claude-code-sandboxing'
      }
    ]
  },
  {
    id: 9,
    title: 'Multi-Agent: Frameworks y Orquestacion',
    subtitle: 'Claude Agent SDK, 5 patrones, Agent Teams, y casos reales',
    icon: '\u{1F3AD}',
    duration: '50 min',
    type: 'Teoria + Escenario Ramificado + Quiz',
    description:
      'Frameworks multi-agente, patrones de orquestacion, Agent Teams, y casos de estudio reales de Anthropic',
    objectives: [
      'Comparar Claude Agent SDK vs LangGraph vs CrewAI',
      'Aplicar los 5 patrones: Orchestrator-Worker, Pipeline, Handoff, Parallelization, Evaluator-Optimizer',
      'Entender Agent Teams: team lead, teammates, shared task list',
      'Analizar el Multi-Agent Research System (90.2% mejora)',
      'Estudiar el compilador C de 16 agentes (100K lineas Rust)'
    ],
    sources: [
      {
        name: 'Anthropic - Multi-Agent Research System',
        url: 'https://www.anthropic.com/engineering/multi-agent-research-system'
      },
      {
        name: 'Anthropic - Building a C Compiler',
        url: 'https://www.anthropic.com/engineering/building-c-compiler'
      },
      {
        name: 'Claude Code - Agent Teams',
        url: 'https://code.claude.com/docs/en/agent-teams'
      },
      {
        name: 'Claude Code - Sub-Agents',
        url: 'https://code.claude.com/docs/en/sub-agents'
      },
      {
        name: 'Addy Osmani - Claude Code Agent Teams',
        url: 'https://addyosmani.com/blog/claude-code-agent-teams/'
      }
    ]
  },
  {
    id: 10,
    title: 'Guardrails, Seguridad y Evaluacion',
    subtitle: 'Permisos de Claude Code, sandbox, hooks como guardrails, y evals',
    icon: '\u{1F6E1}\uFE0F',
    duration: '45 min',
    type: 'Teoria + Quiz + Escenario Ramificado',
    description:
      'Proteger y evaluar agentes: modelo de permisos de Claude Code, sandbox, hooks preventivos, y framework de evaluacion',
    objectives: [
      'Implementar guardrails como concepto first-class',
      'Configurar el modelo de permisos de Claude Code (allow/ask/deny)',
      'Entender sandbox: aislamiento de filesystem y red',
      'Usar hooks PreToolUse como guardrails preventivos',
      'Disenar evaluaciones: 3 tipos de graders, pass@k, pass^k',
      'Entender infrastructure noise y su impacto en benchmarks'
    ],
    sources: [
      {
        name: 'Anthropic - Claude Code Sandboxing',
        url: 'https://www.anthropic.com/engineering/claude-code-sandboxing'
      },
      {
        name: 'Anthropic - Demystifying Evals for AI Agents',
        url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents'
      },
      {
        name: 'Anthropic - Infrastructure Noise in Evaluations',
        url: 'https://www.anthropic.com/engineering/infrastructure-noise'
      },
      {
        name: 'Claude Code - Permissions',
        url: 'https://code.claude.com/docs/en/permissions'
      },
      {
        name: 'OWASP Top 10 for LLM Applications 2025',
        url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'
      }
    ]
  },
  {
    id: 11,
    title: 'Entorno del Agent Architect',
    subtitle: 'Workspace Claude Code, worktrees, multi-sesion, y caso incident.io',
    icon: '\u{1F5A5}\uFE0F',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Configurar el entorno profesional: workspace Claude Code (70%), terminal multiplexer (30%), worktrees y multi-session',
    objectives: [
      'Configurar un workspace completo de Claude Code (.claude/, MCP, settings)',
      'Usar git worktrees para trabajo paralelo con multiples sesiones',
      'Implementar patrones multi-session (Boris Cherny: 3-5 sesiones)',
      'Analizar el caso incident.io: 4-7 agentes concurrentes, fast tooling',
      'Conocer el ecosistema de plugins: compound-engineering, ContextKit'
    ],
    sources: [
      {
        name: 'incident.io - Shipping Faster with Claude Code and Git Worktrees',
        url: 'https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees'
      },
      {
        name: 'Claude Code - Common Workflows',
        url: 'https://code.claude.com/docs/en/tutorials'
      },
      {
        name: 'Boris Cherny - 22 Tips for Claude Code',
        url: 'https://www.builder.io/blog/claude-code-tips'
      },
      {
        name: 'Zellij - Terminal Workspace',
        url: 'https://zellij.dev/'
      }
    ]
  },
  {
    id: 12,
    title: 'Agentes en Produccion',
    subtitle: 'GitHub Actions, headless mode, harnesses, y gestion de costos',
    icon: '\u{1F3ED}',
    duration: '45 min',
    type: 'Teoria + Escenario con Timer',
    description:
      'Llevar agentes a produccion: CI/CD con Claude Code, harnesses para tareas largas, costos, y observabilidad',
    objectives: [
      'Configurar Claude Code GitHub Action con trigger phrases',
      'Usar headless mode en CI: -p, --allowedTools, --max-turns',
      'Disenar harnesses para agentes de larga duracion (initializer, progress files)',
      'Gestionar costos: opusplan, MAX_THINKING_TOKENS, batch API (50% ahorro)',
      'Implementar rainbow deployments para no interrumpir agentes en ejecucion'
    ],
    sources: [
      {
        name: 'Claude Code - GitHub Actions',
        url: 'https://code.claude.com/docs/en/github-actions'
      },
      {
        name: 'Anthropic - Effective Harnesses for Long-Running Agents',
        url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
      },
      {
        name: 'Claude Code - Headless Mode',
        url: 'https://code.claude.com/docs/en/headless'
      },
      {
        name: 'Claude Code - Cost Management',
        url: 'https://code.claude.com/docs/en/costs'
      }
    ]
  },
  {
    id: 13,
    title: 'Taller Final — Disena tu Sistema con Claude Code',
    subtitle: 'Pon a prueba todo: CLAUDE.md, hooks, agents, orquestacion bajo presion',
    icon: '\u{1F3C6}',
    duration: '60 min',
    type: 'Simulacion con Timer + Escenario Ramificado',
    description:
      'Simulacion completa: disena un sistema de code review para 200 PRs/dia usando Claude Code, hooks, agents y orquestacion',
    objectives: [
      'Sintetizar los 12 modulos previos en una solucion integral',
      'Disenar un CLAUDE.md profesional para un equipo real',
      'Configurar agent dispatch table y hooks de seguridad',
      'Seleccionar el patron de orquestacion correcto bajo presion',
      'Demostrar dominio integral de Claude Code como plataforma'
    ],
    sources: [
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/engineering/building-effective-agents'
      },
      {
        name: 'Claude Code - Best Practices',
        url: 'https://code.claude.com/docs/en/best-practices'
      },
      {
        name: 'Anthropic - Multi-Agent Research System',
        url: 'https://www.anthropic.com/engineering/multi-agent-research-system'
      },
      {
        name: 'Claude Code - Hooks Reference',
        url: 'https://code.claude.com/docs/en/hooks'
      },
      {
        name: 'Claude Code - Agent Teams',
        url: 'https://code.claude.com/docs/en/agent-teams'
      }
    ]
  }
];
