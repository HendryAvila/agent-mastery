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
    subtitle: 'El ciclo observe-think-act que lo cambia todo',
    icon: '🧬',
    duration: '35 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Que es un agente IA, como funciona internamente, diferencia entre chat/copilot/agente autonomo',
    objectives: [
      'Definir que es un agente IA vs un chatbot',
      'Explicar el agent loop (observe-think-act)',
      'Identificar los 4 componentes core (LLM, Tools, Memory, Planning)',
      'Clasificar niveles de autonomia'
    ],
    sources: [
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/research/building-effective-agents'
      },
      {
        name: 'OpenAI - A Practical Guide to Building Agents',
        url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf'
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
    subtitle: 'Function calling, JSON Schema, y como el LLM ejecuta acciones',
    icon: '🔧',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'El corazon tecnico de todo agente: como el LLM llama herramientas externas',
    objectives: [
      'Explicar function calling y como funciona',
      'Disenar tool definitions con JSON Schema',
      'Entender el flujo prompt-tool_call-result-response',
      'Identificar buenas y malas definiciones de herramientas'
    ],
    sources: [
      {
        name: 'OpenAI - Function Calling Documentation',
        url: 'https://platform.openai.com/docs/guides/function-calling'
      },
      {
        name: 'Anthropic - Tool Use with Claude',
        url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview'
      },
      {
        name: 'Composio - Tool Calling Explained: The Core of AI Agents (2026 Guide)',
        url: 'https://composio.dev/blog/ai-agent-tool-calling-guide'
      }
    ]
  },
  {
    id: 3,
    title: 'El Ecosistema de Agentes 2026',
    subtitle: 'Claude Code, OpenCode, Cursor, y el resto del universo',
    icon: '🌐',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Mapa completo de los agentes de codigo actuales y cuando usar cada uno',
    objectives: [
      'Identificar los principales coding agents del mercado',
      'Comparar agentes CLI vs IDE vs autonomos',
      'Evaluar criterios de seleccion de herramientas',
      'Entender las diferencias entre open source y propietario'
    ],
    sources: [
      {
        name: 'OpenCode - Documentacion Oficial',
        url: 'https://opencode.ai/docs/'
      },
      {
        name: 'Claude Code - Documentacion Oficial',
        url: 'https://code.claude.com/docs/en/overview'
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
    title: 'Trabajar CON Agentes Como un Pro',
    subtitle: 'System prompts, MCP, y el arte de dirigir agentes',
    icon: '🎯',
    duration: '45 min',
    type: 'Teoria + Escenario Ramificado',
    description:
      'Mejores practicas para trabajar efectivamente con agentes de codigo',
    objectives: [
      'Escribir system prompts efectivos',
      'Entender MCP (Model Context Protocol)',
      'Estructurar proyectos agent-friendly',
      'Aplicar el flujo Plan-Act-Reflect'
    ],
    sources: [
      {
        name: 'Anthropic - Model Context Protocol (MCP)',
        url: 'https://modelcontextprotocol.io/'
      },
      {
        name: 'Addy Osmani - My LLM Coding Workflow Going Into 2026',
        url: 'https://addyosmani.com/blog/ai-coding-workflow/'
      },
      {
        name: 'RAOGY Guide - Code Review in 2026: Reviewing the AI, Not the Human',
        url: 'https://raogy.guide/blog/ai-code-review-2026'
      }
    ]
  },
  {
    id: 5,
    title: 'Construye tu Primer Agente',
    subtitle: 'De cero a un agente funcional',
    icon: '⚡',
    duration: '50 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Arquitectura minima para construir un agente desde cero',
    objectives: [
      'Implementar un agentic loop basico',
      'Definir herramientas programaticamente',
      'Manejar el contexto y la ventana de conversacion',
      'Aplicar retry y error handling para tool calls'
    ],
    sources: [
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/research/building-effective-agents'
      },
      {
        name: 'OpenAI Agents SDK - Documentacion Oficial',
        url: 'https://openai.github.io/openai-agents-python/'
      },
      {
        name: 'Composio - How to Build Great Tools for AI Agents: A Field Guide',
        url: 'https://composio.dev/blog/how-to-build-tools-for-ai-agents-a-field-guide'
      }
    ]
  },
  {
    id: 6,
    title: 'Memoria, Planning y Razonamiento',
    subtitle: 'Como los agentes piensan y recuerdan',
    icon: '🧠',
    duration: '45 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Sistemas de memoria, estrategias de razonamiento, y como los agentes planifican',
    objectives: [
      'Diferenciar memoria corta/larga/episodica',
      'Explicar Chain-of-Thought y Tree-of-Thought',
      'Aplicar el patron ReAct',
      'Disenar un sistema de memoria para un agente'
    ],
    sources: [
      {
        name: 'ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al. 2022)',
        url: 'https://arxiv.org/abs/2210.03629'
      },
      {
        name: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al. 2022)',
        url: 'https://arxiv.org/abs/2201.11903'
      },
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/research/building-effective-agents'
      }
    ]
  },
  {
    id: 7,
    title: 'Frameworks Multi-Agente',
    subtitle: 'Claude SDK, OpenAI SDK, Strands, CrewAI y mas',
    icon: '🔗',
    duration: '50 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Comparacion agnostica de los frameworks para construir sistemas multi-agente',
    objectives: [
      'Comparar los principales frameworks multi-agente',
      'Identificar casos de uso para cada framework',
      'Evaluar trade-offs de complejidad vs control',
      'Disenar un criterio de seleccion de framework'
    ],
    sources: [
      {
        name: 'Claude Agent SDK - Documentacion Oficial',
        url: 'https://platform.claude.com/docs/en/agent-sdk/overview'
      },
      {
        name: 'OpenAI Agents SDK - Documentacion Oficial',
        url: 'https://openai.github.io/openai-agents-python/'
      },
      {
        name: 'AWS Strands Agents SDK - Documentacion Oficial',
        url: 'https://strandsagents.com/latest/'
      },
      {
        name: 'LangGraph - Documentacion Oficial',
        url: 'https://www.langchain.com/langgraph'
      }
    ]
  },
  {
    id: 8,
    title: 'Patrones de Orquestacion Multi-Agente',
    subtitle: 'Orchestrator, Handoff, Hierarchical y mas',
    icon: '🎭',
    duration: '50 min',
    type: 'Teoria + Escenario Ramificado',
    description:
      'Los patrones arquitectonicos para coordinar multiples agentes',
    objectives: [
      'Aplicar el patron Orchestrator-Worker',
      'Implementar handoffs entre agentes',
      'Disenar jerarquias de agentes',
      'Elegir el patron correcto para cada problema'
    ],
    sources: [
      {
        name: 'OpenAI - A Practical Guide to Building Agents',
        url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf'
      },
      {
        name: 'Microsoft Azure - AI Agent Orchestration Patterns',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns'
      },
      {
        name: 'Vellum - The 2026 Guide to AI Agent Workflows',
        url: 'https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns'
      }
    ]
  },
  {
    id: 9,
    title: 'Guardrails, Seguridad y Evaluacion',
    subtitle: 'Porque un agente sin limites es un agente peligroso',
    icon: '🛡️',
    duration: '45 min',
    type: 'Teoria + Quiz + Escenario Ramificado',
    description:
      'Como proteger, limitar, y evaluar agentes autonomos',
    objectives: [
      'Implementar guardrails como concepto first-class',
      'Identificar vectores de ataque (prompt injection, data exfiltration)',
      'Disenar un pipeline de evaluacion',
      'Entender benchmarks (SWE-bench, HumanEval)'
    ],
    sources: [
      {
        name: 'Google ADK - Safety and Security for AI Agents',
        url: 'https://google.github.io/adk-docs/safety/'
      },
      {
        name: 'OpenAI Agents SDK - Guardrails',
        url: 'https://openai.github.io/openai-agents-python/guardrails/'
      },
      {
        name: 'OWASP Top 10 for LLM Applications 2025',
        url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'
      },
      {
        name: 'Prompt Engineering Guide - Prompting Guide',
        url: 'https://www.promptingguide.ai/'
      }
    ]
  },
  {
    id: 10,
    title: 'El Entorno del Agent Architect',
    subtitle: 'Terminales, IDEs, y el setup definitivo',
    icon: '🖥️',
    duration: '40 min',
    type: 'Teoria + Quiz + Diagrama Interactivo',
    description:
      'Herramientas, terminales y configuraciones para trabajo multi-agente',
    objectives: [
      'Configurar terminales para multi-agente (tmux, zellij)',
      'Entender Claude CoWork y Agent Teams',
      'Optimizar el flujo IDE + CLI + agentes',
      'Disenar un workspace profesional para desarrollo agentico'
    ],
    sources: [
      {
        name: 'Zellij - Terminal Workspace',
        url: 'https://zellij.dev/'
      },
      {
        name: 'Claude Code - Documentacion Oficial',
        url: 'https://code.claude.com/docs/en/overview'
      },
      {
        name: 'Claude CoWork - Introducing Cowork',
        url: 'https://claude.com/blog/cowork-research-preview'
      },
      {
        name: 'Anthropic - Introducing Claude Opus 4.6',
        url: 'https://www.anthropic.com/news/claude-opus-4-6'
      }
    ]
  },
  {
    id: 11,
    title: 'Agentes en Produccion',
    subtitle: 'CI/CD, costos, observabilidad y lo que nadie te dice',
    icon: '🏭',
    duration: '45 min',
    type: 'Teoria + Escenario con Timer',
    description:
      'Llevando agentes a produccion: las lecciones duras',
    objectives: [
      'Disenar pipelines CI/CD con agentes',
      'Implementar observabilidad y logging',
      'Gestionar costos de tokens y APIs',
      'Decidir cuando NO usar agentes'
    ],
    sources: [
      {
        name: 'Prompt Engineering Institute - Agents At Work: The 2026 Playbook',
        url: 'https://promptengineering.org/agents-at-work-the-2026-playbook-for-building-reliable-agentic-workflows/'
      },
      {
        name: 'Addy Osmani - My LLM Coding Workflow Going Into 2026',
        url: 'https://addyosmani.com/blog/ai-coding-workflow/'
      },
      {
        name: 'Skywork - Best Practices for Multi-Agent Orchestration and Reliable Handoffs',
        url: 'https://skywork.ai/blog/ai-agent-orchestration-best-practices-handoffs/'
      }
    ]
  },
  {
    id: 12,
    title: 'Taller Final — Disena tu Sistema de Agentes',
    subtitle: 'Pon a prueba todo lo que aprendiste',
    icon: '🏆',
    duration: '60 min',
    type: 'Simulacion con Timer',
    description:
      'Simulacion completa donde debes disenar la arquitectura multi-agente correcta bajo presion',
    objectives: [
      'Analizar un problema real y proponer una arquitectura',
      'Seleccionar frameworks y patrones correctos',
      'Disenar guardrails y estrategia de evaluacion',
      'Demostrar comprension integral del curso'
    ],
    sources: [
      {
        name: 'Anthropic - Building Effective AI Agents',
        url: 'https://www.anthropic.com/research/building-effective-agents'
      },
      {
        name: 'OpenAI - A Practical Guide to Building Agents',
        url: 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf'
      },
      {
        name: 'Microsoft Azure - AI Agent Orchestration Patterns',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns'
      },
      {
        name: 'OWASP Top 10 for LLM Applications 2025',
        url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'
      }
    ]
  }
];
