<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import Quiz from '$lib/components/Quiz.svelte';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';

  const MODULE_ID = 9;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);

  let showScenario = $state(false);
  let showQuiz = $state(false);
  let scenarioDone = $state(false);
  let quizDone = $state(false);
  let scenarioScore = $state(0);
  let scenarioMax = $state(18);
  let quizScore = $state(0);
  let quizMax = $state(5);

  courseStore.startModule(MODULE_ID);

  function checkCompletion() {
    if (scenarioDone && quizDone) {
      const totalScore = quizScore + Math.round((scenarioScore / scenarioMax) * quizMax);
      const totalMax = quizMax + quizMax;
      courseStore.completeModule(MODULE_ID, totalScore, totalMax);

      const badge = courseStore.unlockBadge('orchestrator');
      if (badge) {
        earnedBadge = badge;
        showBadge = true;
      }
      completed = true;
    }
  }

  function handleScenarioComplete(score: number, maxScore: number) {
    scenarioDone = true;
    scenarioScore = score;
    scenarioMax = maxScore;
    checkCompletion();
  }

  function handleQuizComplete(score: number, total: number) {
    quizDone = true;
    quizScore = score;
    quizMax = total;
    checkCompletion();
  }

  // ─── BranchingScenario: Orchestration Design ───
  const scenarioNodes: Record<string, { id: string; narrative: string; choices?: { text: string; nextId: string; points: number; feedback?: string; }[]; outcome?: { title: string; description: string; score: number; maxScore: number; grade: 'excellent' | 'good' | 'needs-work' | 'critical'; lessons: string[]; }; }> = {
    start: {
      id: 'start',
      narrative: 'Eres el tech lead de una startup SaaS con 30 desarrolladores. Tu equipo recibe ~50 PRs/dia y el code review es el cuello de botella. Quieres construir un sistema automatizado que:\n\n1. Analice calidad de codigo (estilo, complejidad, DRY)\n2. Verifique seguridad (vulnerabilidades, secrets expuestos)\n3. Compruebe que los tests cubren los cambios\n4. Escriba un resumen de review con recomendaciones\n\nPrimera decision: como organizas los agentes?',
      choices: [
        { text: 'Un orquestador central que descompone la tarea y asigna a 4 workers especializados (calidad, seguridad, tests, resumen)', nextId: 'orch_worker', points: 3, feedback: 'Excelente! Orchestrator-Worker es el patron ideal: un agente central coordina y 4 especialistas trabajan en lo suyo. Es como Anthropic describe el Multi-Agent Research System.' },
        { text: 'Un pipeline secuencial: calidad \u2192 seguridad \u2192 tests \u2192 resumen, cada agente pasa su resultado al siguiente', nextId: 'pipeline', points: 1, feedback: 'Funciona pero es suboptimo. Los primeros 3 analisis son independientes entre si: no necesitan esperar el resultado del anterior. Los estas forzando a ser secuenciales sin necesidad.' },
        { text: 'Un solo agente Claude Code que haga todo en una sola sesion', nextId: 'single', points: 0, feedback: 'Un solo agente para 4 tareas especializadas satura el context window y pierde precision. El principio de Anthropic: "start simple, but know when to scale".' },
        { text: 'Agent Teams: team lead con 4 teammates que se coordinan via shared task list', nextId: 'teams_early', points: 2, feedback: 'Agent Teams es poderoso pero puede ser overkill para este caso. Los teammates crean worktrees y lock files, lo que agrega overhead. Orchestrator-Worker con sub-agents es mas ligero para 4 tareas paralelas bien definidas.' }
      ]
    },
    orch_worker: {
      id: 'orch_worker',
      narrative: 'Elegiste Orchestrator-Worker. Ahora los analisis de calidad, seguridad y tests son INDEPENDIENTES entre si (ninguno necesita el resultado de otro). El resumen SI necesita los 3 resultados. Como ejecutas los analisis?',
      choices: [
        { text: 'En paralelo: los 3 workers corren simultaneamente, y cuando los 3 terminan, el worker de resumen sintetiza los resultados', nextId: 'parallel_good', points: 3, feedback: 'Perfecto! En Claude Code, esto se logra lanzando multiples Task tool calls en un solo mensaje. Los 3 sub-agents corren en paralelo y el orquestador espera a que todos terminen antes de sintetizar.' },
        { text: 'Secuencial: uno por uno para mantener control y visibilidad', nextId: 'seq_slow', points: 1, feedback: 'Funciona pero desperdicias tiempo. Si cada analisis toma 30 segundos, en paralelo son 30s total vs 90s secuencial. Con 50 PRs/dia, eso es 50 minutos perdidos diarios.' },
        { text: 'En paralelo pero el resumen empieza a escribirse en cuanto cualquier analisis termina (streaming)', nextId: 'stream_risky', points: 1, feedback: 'Idea interesante pero arriesgada. Si el resumen empieza sin la informacion completa, puede omitir hallazgos criticos de seguridad que llegan despues.' }
      ]
    },
    parallel_good: {
      id: 'parallel_good',
      narrative: 'Los 3 analisis corrieron en paralelo y el resumen los sintetizo. Pero hay un conflicto: el agente de calidad recomienda "refactorizar funcion X" y el agente de seguridad dice "no tocar funcion X, tiene validacion critica de input". Contradiccion. Como la manejas?',
      choices: [
        { text: 'El orquestador detecta la contradiccion, usa un agente evaluador que analiza ambas recomendaciones y genera una recomendacion unificada', nextId: 'evaluator', points: 3, feedback: 'Excelente! Esto es el patron Evaluator-Optimizer en accion. El evaluador tiene contexto de ambos analisis y puede generar una recomendacion que atienda calidad Y seguridad. Es como el sistema de investigacion de Anthropic que logro 90.2% de mejora.' },
        { text: 'Priorizar siempre seguridad sobre calidad: ignorar la recomendacion de refactoring', nextId: 'priority_security', points: 2, feedback: 'Seguridad primero es un buen principio, pero ignorar completamente la recomendacion de calidad sin analizar es agresivo. La funcion puede tener ambos problemas y necesitar una solucion que atienda los dos.' },
        { text: 'Incluir ambas recomendaciones contradictorias en el resumen y dejar que el desarrollador decida', nextId: 'pass_to_human', points: 1, feedback: 'Funciona pero es lazy. El sistema deberia resolver contradicciones en vez de pasar el problema al usuario. Si el review automatizado no puede resolver conflictos, pierde mucho de su valor.' }
      ]
    },
    evaluator: {
      id: 'evaluator',
      narrative: 'El agente evaluador resolvio el conflicto: "Refactorizar funcion X MANTENIENDO la validacion de input como primera operacion". Ambas recomendaciones eran validas y no mutuamente excluyentes.\n\nAhora, tu sistema funciona bien para PRs normales. Pero un viernes llegan 15 PRs urgentes del sprint en las ultimas 2 horas. Tu sistema se congela procesando cola. Como escalarías?',
      choices: [
        { text: 'Migrar a Agent Teams: un team lead coordina multiples instancias de Claude Code, cada una procesando un PR en paralelo con worktrees separados', nextId: 'outcome_excellent', points: 3, feedback: 'Perfecto! Agent Teams es exactamente para esto. El team lead crea un equipo, asigna PRs como tareas, y cada teammate usa un git worktree independiente. Asi es como Anthropic construyo el compilador C: 16 agentes, cada uno en su modulo, con lock files para evitar conflictos.' },
        { text: 'Crear un sistema de cola con prioridades y procesar los PRs uno a uno mas rapido', nextId: 'outcome_good_queue', points: 1, feedback: 'Una cola mejora el orden pero no la velocidad. Con 50 PRs/dia y picos de 15/hora, necesitas PARALELISMO real, no solo mejor scheduling.' }
      ]
    },
    priority_security: {
      id: 'priority_security',
      narrative: 'Priorizar seguridad funciono esta vez. Pero en otro PR, la recomendacion de calidad era correcta y la de seguridad era un falso positivo. Los desarrolladores empiezan a ignorar los reviews.\n\nAhora tambien tienes el problema de escala: 50 PRs/dia con picos de 15/hora. El sistema no da abasto.',
      choices: [
        { text: 'Agregar un agente evaluador para resolver conflictos Y migrar a Agent Teams para escalar', nextId: 'outcome_good_late', points: 3, feedback: 'Correcto en ambos frentes! Evaluator-Optimizer resuelve los conflictos, y Agent Teams maneja la escala. Pero hubieras ahorrado tiempo si hubieras incluido el evaluador desde el inicio.' },
        { text: 'Solo resolver la escala con mas instancias, los conflictos se resuelven con una regla fija', nextId: 'outcome_needs_work', points: 1, feedback: 'Las reglas fijas no funcionan para decisiones contextuales. "Siempre seguridad" pierde calidad, "siempre calidad" pierde seguridad. Necesitas un evaluador que analice caso por caso.' }
      ]
    },
    pass_to_human: {
      id: 'pass_to_human',
      narrative: 'Los desarrolladores se quejan: "El review tiene recomendaciones contradictorias y no se cual seguir." El sistema pierde credibilidad.\n\nAdemas, con 50 PRs/dia, los reviews tardan demasiado procesandose uno por uno.',
      choices: [
        { text: 'Implementar un paso de resolucion de conflictos (Evaluator-Optimizer) y escalar con Agent Teams', nextId: 'outcome_good_late', points: 3, feedback: 'Buena correccion. El evaluador resuelve contradicciones y Agent Teams maneja la escala. La leccion: un review profesional no tiene contradicciones, y la escala requiere paralelismo real.' },
        { text: 'Eliminar el analisis de seguridad para evitar conflictos', nextId: 'outcome_critical', points: 0, feedback: 'Eliminar seguridad para evitar conflictos es como quitar los frenos del auto porque hacen ruido. La seguridad NO es negociable.' }
      ]
    },
    pipeline: {
      id: 'pipeline',
      narrative: 'Elegiste Pipeline secuencial. El agente de seguridad encuentra 3 vulnerabilidades criticas. En el pipeline, el siguiente paso (tests) recibe este resultado. Que deberia pasar?',
      choices: [
        { text: 'El pipeline continua: tests analiza cobertura y el resumen incluye todo. El review es completo aunque tarda mas', nextId: 'pipeline_continue', points: 2, feedback: 'Razonable. El pipeline es predecible y cada agente agrega su analisis. Pero con tareas independientes, el pipeline es innecesariamente lento.' },
        { text: 'Detener el pipeline inmediatamente y rechazar el PR por vulnerabilidades criticas', nextId: 'pipeline_stop', points: 1, feedback: 'Rechazar sin review completo es agresivo. Ademas, que pasa si la vulnerabilidad es un falso positivo? El equipo merece el review completo para decidir.' }
      ]
    },
    pipeline_continue: {
      id: 'pipeline_continue',
      narrative: 'El pipeline funciona pero es lento: un PR que deberia revisarse en 30 segundos toma 2 minutos. Con 50 PRs/dia, eso es ~100 minutos solo en reviews. Tu equipo se queja. Como optimizas?',
      choices: [
        { text: 'Cambiar a Orchestrator-Worker con ejecucion paralela para los analisis independientes', nextId: 'outcome_good_pipeline', points: 3, feedback: 'Correcto! La optimizacion natural es identificar tareas independientes y paralelizarlas. Calidad, seguridad y tests no dependen entre si: correrlos en paralelo reduce el tiempo dramaticamente.' },
        { text: 'Cachear los resultados de archivos que no cambiaron entre PRs', nextId: 'outcome_needs_work_pipe', points: 1, feedback: 'El caching ayuda marginalmente pero no resuelve el problema fundamental: las tareas independientes no deberian ser secuenciales. La mejora real viene del paralelismo.' }
      ]
    },
    pipeline_stop: {
      id: 'pipeline_stop',
      narrative: 'Rechazaste el PR automaticamente. Pero una de las "vulnerabilidades criticas" era un falso positivo del agente de seguridad. Los desarrolladores pierden confianza en el sistema.',
      choices: [
        { text: 'Agregar un agente Evaluator que confirme vulnerabilidades antes de rechazar, y completar siempre el review completo', nextId: 'outcome_needs_work_pipe', points: 2, feedback: 'Buena correccion. Un segundo chequeo reduce falsos positivos. Pero ahora tienes un sistema mas complejo que si hubieras disenado bien desde el inicio.' }
      ]
    },
    single: {
      id: 'single',
      narrative: 'Elegiste un solo agente Claude Code. Despues de analizar calidad y seguridad en un PR grande, el context window esta al 75% y el agente empieza a "olvidar" detalles del analisis de calidad cuando llega a los tests. Que haces?',
      choices: [
        { text: 'Dividir en sub-agents especializados via Task tool. Debiste hacer esto desde el principio', nextId: 'single_fix', points: 2, feedback: 'Correcto. Claude Code Sub-Agents es la solucion: cada Task tool call crea un sub-agente con su propio context window. Pero lo descubriste en produccion, no en el diseno.' },
        { text: 'Usar un modelo con context window mas grande y pasar el costo al cliente', nextId: 'outcome_critical', points: 0, feedback: 'Tirar dinero al problema no es ingenieria. Ademas, el "lost in the middle" problem empeora con contextos muy largos. El agente pierde precision en la informacion que esta en el medio del contexto.' }
      ]
    },
    single_fix: {
      id: 'single_fix',
      narrative: 'Migraste a sub-agents. Funciona mejor pero ahora tienes 50 PRs/dia y cada PR consume ~4 minutos de review secuencial. Son mas de 3 horas de procesamiento diario. Como escalas?',
      choices: [
        { text: 'Agent Teams para procesar multiples PRs en paralelo, con worktrees para aislamiento', nextId: 'outcome_good_late', points: 3, feedback: 'Agent Teams resuelve la escala. Cada PR se procesa en un worktree independiente con su propio equipo de sub-agents. Pero hubieras ahorrado semanas si hubieras empezado con la arquitectura correcta.' },
        { text: 'Poner un rate limit de 20 PRs/dia y rechazar el resto', nextId: 'outcome_critical', points: 0, feedback: 'Rechazar PRs porque tu sistema no escala es inaceptable. Los desarrolladores necesitan feedback en TODOS sus PRs, no solo en los primeros 20 del dia.' }
      ]
    },
    teams_early: {
      id: 'teams_early',
      narrative: 'Elegiste Agent Teams. El team lead crea el equipo y asigna tareas via shared task list. Cada teammate tiene un rol (calidad, seguridad, tests, resumen).\n\nPero hay un problema: los teammates crean worktrees y lock files para cada analisis, pero los 4 analisis son sobre el MISMO PR y no modifican archivos. El overhead de aislamiento es innecesario. Como optimizas?',
      choices: [
        { text: 'Usar Sub-Agents (Task tool) para los 4 analisis de un PR, y Agent Teams solo cuando necesites procesar MULTIPLES PRs en paralelo', nextId: 'teams_optimized', points: 3, feedback: 'Exacto! Sub-agents es mas ligero para tareas paralelas dentro de un mismo contexto. Agent Teams brilla cuando necesitas aislamiento real: multiples PRs, multiples features, multiples repositorios.' },
        { text: 'Mantener Agent Teams para todo, el overhead es aceptable', nextId: 'teams_keep', points: 1, feedback: 'Funciona pero pagas un costo de overhead innecesario: worktrees, lock files, y mailbox communication para tareas que solo necesitan leer el mismo diff. Hay una herramienta mas apropiada para este nivel.' }
      ]
    },
    teams_optimized: {
      id: 'teams_optimized',
      narrative: 'Perfecto. Usas Sub-Agents para los analisis dentro de cada PR (paralelo, sin overhead de aislamiento) y Agent Teams para procesar multiples PRs simultaneamente.\n\nAhora, el agente de calidad y el de seguridad dan recomendaciones contradictorias en un PR. Necesitas un mecanismo para resolver conflictos. Que implementas?',
      choices: [
        { text: 'Un quinto sub-agent "evaluador" que recibe ambos analisis y genera una recomendacion unificada (Evaluator-Optimizer)', nextId: 'outcome_excellent', points: 3, feedback: 'Arquitectura completa! Sub-agents para analisis paralelo, Evaluator-Optimizer para conflictos, Agent Teams para escala horizontal. Esto es exactamente como Anthropic estructura sus sistemas de investigacion.' },
        { text: 'Regla fija: si seguridad y calidad contradicen, priorizar seguridad siempre', nextId: 'outcome_good_teams', points: 2, feedback: 'Funcional pero rigido. Una regla fija no puede manejar los matices de cada caso. A veces la recomendacion de calidad es la correcta y la de seguridad es un falso positivo.' }
      ]
    },
    teams_keep: {
      id: 'teams_keep',
      narrative: 'Agent Teams funciona pero con overhead. El team lead tarda 10 segundos extra por PR creando worktrees y lock files innecesarios. Con 50 PRs/dia, son ~8 minutos perdidos.\n\nAhora los agentes de calidad y seguridad contradicen en sus recomendaciones. Como lo resuelves?',
      choices: [
        { text: 'Agregar un agente evaluador al equipo que revise y unifique las recomendaciones', nextId: 'outcome_good_teams', points: 3, feedback: 'Correcto. Un agente evaluador resuelve conflictos con contexto de ambos analisis. Aunque tu sistema tiene overhead innecesario, al menos la logica de resolucion es correcta.' }
      ]
    },
    seq_slow: {
      id: 'seq_slow',
      narrative: 'El sistema funciona pero cada PR toma 2 minutos en vez de 40 segundos. Tu equipo se queja de la lentitud. Ademas, con 50 PRs/dia, el sistema esta atrasado 3 horas al final del dia.',
      choices: [
        { text: 'Paralelizar los 3 analisis independientes via Task tool calls simultaneos', nextId: 'outcome_good_late', points: 3, feedback: 'Correcto! En Claude Code, lanzar multiples Task tool calls en un solo mensaje ejecuta sub-agents en paralelo. Debiste empezar asi, pero al menos lo corregiste.' },
        { text: 'Simplificar los analisis para que sean mas rapidos (menos profundos)', nextId: 'outcome_needs_work', points: 1, feedback: 'Sacrificar profundidad para ganar velocidad es un trade-off pobre. La solucion es paralelismo, no reducir la calidad del review.' }
      ]
    },
    stream_risky: {
      id: 'stream_risky',
      narrative: 'El resumen se genero con informacion parcial. En produccion, a veces omite hallazgos de seguridad criticos porque el analisis de seguridad no habia terminado cuando el resumen se genero. Un PR con una SQL injection paso el review sin mencion de seguridad.',
      choices: [
        { text: 'Esperar a que TODOS los analisis terminen antes de generar el resumen, y paralelizar solo los analisis entre si', nextId: 'outcome_good_late', points: 3, feedback: 'Correcto. La completitud es mas importante que la velocidad en un code review. Los analisis corren en paralelo, pero el resumen espera a todos. Este es el patron correcto.' },
        { text: 'Hacer que el resumen se actualice incrementalmente cuando llegan nuevos resultados', nextId: 'outcome_needs_work', points: 1, feedback: 'Demasiado complejo. El agente de resumen tendria que regenerar con cada resultado, consumiendo 3x tokens y creando inconsistencias entre versiones.' }
      ]
    },
    // ─── OUTCOMES ───
    outcome_excellent: {
      id: 'outcome_excellent',
      narrative: '',
      outcome: {
        title: 'Arquitecto de Orquestacion',
        description: 'Disenaste un sistema robusto: Orchestrator-Worker con sub-agents paralelos, Evaluator-Optimizer para conflictos, y Agent Teams para escala horizontal. Produccion-ready.',
        score: 18,
        maxScore: 18,
        grade: 'excellent',
        lessons: [
          'Sub-agents (Task tool) para tareas paralelas dentro de un contexto. Agent Teams para escala horizontal entre contextos.',
          'Evaluator-Optimizer resuelve contradicciones entre agentes especializados.',
          'Los analisis independientes DEBEN ejecutarse en paralelo. El resumen espera a todos.',
          'El patron se elige analizando dependencias entre tareas, no por preferencia estetica.',
          'Anthropic logro 90.2% de mejora con este patron exacto en su Multi-Agent Research System.'
        ]
      }
    },
    outcome_good_late: {
      id: 'outcome_good_late',
      narrative: '',
      outcome: {
        title: 'Buen Resultado (con Desvios)',
        description: 'Llegaste a una solucion funcional, pero despues de corregir errores de diseno. La leccion: analizar dependencias ANTES de elegir el patron ahorra iteraciones costosas.',
        score: 12,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Analizar dependencias entre tareas ANTES de elegir el patron de orquestacion.',
          'Sub-agents paralelos son mas eficientes que pipelines para tareas independientes.',
          'El context window se satura con un solo agente para multiples tareas complejas.',
          'Agent Teams resuelve problemas de escala horizontal con worktrees y lock files.',
          'Corregir en produccion siempre es mas caro que disenar correctamente.'
        ]
      }
    },
    outcome_good_pipeline: {
      id: 'outcome_good_pipeline',
      narrative: '',
      outcome: {
        title: 'Pipeline Funcional',
        description: 'Tu pipeline funciona pero no es optimo. Identificaste correctamente que las tareas independientes deberian correr en paralelo.',
        score: 11,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Pipeline secuencial es predecible pero suboptimo para tareas independientes.',
          'Agregar pasos a un pipeline es mas rigido que agregar workers a un orquestador.',
          'Identificar dependencias entre tareas determina secuencial vs paralelo.',
          'El patron correcto se elige en el diseno, no se descubre en produccion.'
        ]
      }
    },
    outcome_good_teams: {
      id: 'outcome_good_teams',
      narrative: '',
      outcome: {
        title: 'Agent Teams Funcional',
        description: 'Usaste Agent Teams correctamente para escala, aunque con algo de overhead innecesario para tareas ligeras. Buen uso de la herramienta.',
        score: 12,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Agent Teams brilla para trabajo paralelo con aislamiento (worktrees, lock files).',
          'Sub-agents (Task tool) son mas ligeros para tareas paralelas sin aislamiento.',
          'Combinar ambos: sub-agents dentro de cada PR, Agent Teams entre PRs.',
          'Las reglas fijas para resolver conflictos son fragiles. Un evaluador es mas robusto.'
        ]
      }
    },
    outcome_good_queue: {
      id: 'outcome_good_queue',
      narrative: '',
      outcome: {
        title: 'Cola de Procesamiento',
        description: 'Tu cola mejora el orden pero no la velocidad. Para escalar con 50 PRs/dia necesitas paralelismo real, no solo mejor scheduling.',
        score: 10,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Una cola mejora el orden pero no resuelve problemas de throughput.',
          'Agent Teams permite paralelismo real: multiples PRs procesandose simultaneamente.',
          'El paralelismo real requiere aislamiento (worktrees) para evitar conflictos.',
          'La escala horizontal es la respuesta correcta para cargas de trabajo crecientes.'
        ]
      }
    },
    outcome_needs_work: {
      id: 'outcome_needs_work',
      narrative: '',
      outcome: {
        title: 'Necesitas Mejorar',
        description: 'Tomaste decisiones que crearon problemas evitables. Los patrones de orquestacion existen para evitar estos errores.',
        score: 6,
        maxScore: 18,
        grade: 'needs-work',
        lessons: [
          'Los patrones de orquestacion se eligen en el diseno, no se descubren en produccion.',
          'Reglas fijas no resuelven conflictos contextuales entre agentes.',
          'Simplificar analisis para ganar velocidad es un trade-off pobre. Paralelismo es la respuesta.',
          'Anthropic: "The number of agents is not the measure of sophistication".'
        ]
      }
    },
    outcome_needs_work_pipe: {
      id: 'outcome_needs_work_pipe',
      narrative: '',
      outcome: {
        title: 'Pipeline con Problemas',
        description: 'El pipeline funciona pero tiene limitaciones fundamentales de velocidad y manejo de falsos positivos. La arquitectura necesita revision.',
        score: 7,
        maxScore: 18,
        grade: 'needs-work',
        lessons: [
          'Un pipeline fuerza secuencialidad innecesaria en tareas independientes.',
          'Rechazar automaticamente sin review completo genera desconfianza.',
          'Un agente evaluador reduce falsos positivos verificando hallazgos criticos.',
          'El patron correcto depende de las dependencias, no de la simplicidad de implementacion.'
        ]
      }
    },
    outcome_critical: {
      id: 'outcome_critical',
      narrative: '',
      outcome: {
        title: 'Error Critico de Arquitectura',
        description: 'Las decisiones tomadas no resuelven el problema y crean nuevos. La seguridad no se elimina y el dinero no reemplaza al buen diseno.',
        score: 2,
        maxScore: 18,
        grade: 'critical',
        lessons: [
          'NUNCA elimines la seguridad para simplificar el sistema.',
          'Mas tokens o modelos mas caros no resuelven problemas de arquitectura.',
          'Rechazar PRs porque el sistema no escala es inaceptable.',
          'Disenar correctamente desde el inicio es MUCHO mas barato que parchear.',
          'Anthropic: "Start with the simplest approach, but know when to scale".'
        ]
      }
    }
  };

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Anthropic reporto que su Multi-Agent Research System logro un 90.2% de mejora sobre un agente individual. Cual fue la arquitectura?',
      options: [
        { text: 'Un solo agente Opus con context window de 1M tokens procesando todo', correct: false, explanation: 'Incorrecto. Un solo agente con mas contexto no escala igual que multiples agentes especializados. El "lost in the middle" problem limita la efectividad.' },
        { text: 'Opus como agente lider que descompone la query, Sonnet workers que investigan en paralelo, y Opus sintetiza los resultados (Orchestrator-Worker)', correct: true, explanation: 'Correcto! El patron Orchestrator-Worker con especializacion: Opus para tareas que requieren razonamiento complejo (descomponer y sintetizar), Sonnet para tareas de investigacion paralela (mas rapido y economico). La clave fue la division inteligente del trabajo.' },
        { text: 'Un pipeline de 5 agentes donde cada uno procesa y pasa al siguiente', correct: false, explanation: 'Un pipeline forzaria secuencialidad innecesaria. Las tareas de investigacion eran independientes y se beneficiaron enormemente del paralelismo.' },
        { text: 'Agent Teams con 16 agentes como en el compilador C', correct: false, explanation: 'El Multi-Agent Research System no uso 16 agentes ni Agent Teams. Uso un patron mas simple: un lider Opus + workers Sonnet. 16 agentes fue el compilador C, un proyecto diferente.' }
      ],
      source: 'Anthropic - Multi-Agent Research System',
      sourceUrl: 'https://www.anthropic.com/engineering/multi-agent-research-system'
    },
    {
      question: 'En Claude Code, como implementas el patron Parallelization con sub-agents?',
      options: [
        { text: 'Lanzas multiples Task tool calls en un solo mensaje. Claude Code los ejecuta en paralelo automaticamente', correct: true, explanation: 'Correcto! Cuando Claude Code recibe multiples Task tool calls en un solo mensaje, los ejecuta en paralelo. Cada sub-agent tiene su propio context window y trabaja de forma independiente. El agente principal espera a que todos terminen para continuar.' },
        { text: 'Usas Agent Teams con TeamCreate para crear un equipo de sub-agentes', correct: false, explanation: 'Agent Teams es para trabajo paralelo a mayor escala con aislamiento (worktrees, lock files). Para tareas paralelas dentro de una misma sesion, el Task tool es mas eficiente y ligero.' },
        { text: 'Abres multiples terminales con Claude Code y les das instrucciones manualmente', correct: false, explanation: 'Eso es manual, no programatico. Los sub-agents via Task tool se orquestan desde el agente principal de forma automatica, sin intervencion humana.' },
        { text: 'Usas el flag --parallel al ejecutar Claude Code en modo headless', correct: false, explanation: 'No existe un flag --parallel. La parallelization se logra a traves de multiples Task tool calls en un solo mensaje, que el runtime de Claude Code ejecuta concurrentemente.' }
      ],
      source: 'Claude Code - Sub-Agents',
      sourceUrl: 'https://code.claude.com/docs/en/sub-agents'
    },
    {
      question: 'En el proyecto del compilador C de Anthropic, 16 agentes Claude Code trabajaron en 100,000 lineas de Rust. Cual fue el mecanismo clave para evitar conflictos?',
      options: [
        { text: 'Cada agente usaba un branch de Git separado y hacian merge al final', correct: false, explanation: 'Branches separados requeririan un merge masivo al final, con conflictos potencialmente enormes en 100K lineas. No es escalable.' },
        { text: 'Lock files para archivos compartidos y git worktrees para aislamiento de cada agente', correct: true, explanation: 'Correcto! Cada agente operaba en su propio git worktree (copia independiente del repo). Los lock files prevenian que dos agentes modificaran el mismo archivo simultaneamente. Docker containers proporcionaban aislamiento adicional para build/test.' },
        { text: 'Un agente coordinador revisaba cada cambio antes de aplicarlo al repo central', correct: false, explanation: 'Un coordinador central seria un cuello de botella con 16 agentes. La solucion fue descentralizada: lock files + worktrees permiten trabajo independiente sin coordinacion constante.' },
        { text: 'Solo trabajaban en archivos diferentes, sin archivos compartidos', correct: false, explanation: 'En un compilador C, hay archivos compartidos inevitables (headers, tipos comunes, interfaces). Los lock files manejan el acceso a estos archivos compartidos cuando es necesario.' }
      ],
      source: 'Anthropic - Building a C Compiler',
      sourceUrl: 'https://www.anthropic.com/engineering/building-c-compiler'
    },
    {
      question: 'Tu sistema multi-agente tiene un agente que genera codigo y otro que lo evalua. Despues de 5 iteraciones de generate-evaluate, la calidad sigue sin alcanzar el threshold. Cual es la accion correcta?',
      options: [
        { text: 'Continuar iterando indefinidamente hasta alcanzar el threshold', correct: false, explanation: 'Iteraciones infinitas queman tokens sin garantia de mejora. Si 5 iteraciones no bastaron, probablemente hay un problema mas profundo que mas iteraciones no resuelven.' },
        { text: 'Escalar a un modelo mas potente (ej: de Sonnet a Opus) para la generacion, con max_retries definido', correct: true, explanation: 'Correcto! Si el worker no puede con la tarea despues de N intentos, el problema puede requerir mas capacidad de razonamiento. Escalar el modelo Y tener un max_retries definido evita loops infinitos. Si Opus tampoco puede, escalar a human-in-the-loop.' },
        { text: 'Eliminar el agente evaluador porque es demasiado estricto', correct: false, explanation: 'Eliminar el evaluador baja la calidad del output. El evaluador existe para asegurar calidad. Si el generador no puede cumplir, el problema es del generador, no del evaluador.' },
        { text: 'Bajar el threshold de calidad para que pase', correct: false, explanation: 'Bajar el threshold es aceptar calidad inferior. Si el threshold era correcto, bajarlo solo esconde el problema.' }
      ],
      source: 'Anthropic - Building Effective AI Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/building-effective-agents'
    },
    {
      question: 'Necesitas elegir entre Sub-Agents (Task tool) y Agent Teams para tu proyecto. Cual es el criterio correcto?',
      options: [
        { text: 'Agent Teams siempre es mejor porque es mas reciente y avanzado', correct: false, explanation: 'Mas reciente no significa mejor para todos los casos. Agent Teams tiene overhead (worktrees, lock files, mailbox) que no siempre se justifica.' },
        { text: 'Sub-Agents para tareas paralelas dentro de una sesion. Agent Teams cuando necesitas aislamiento real (worktrees, lock files) para trabajo independiente de larga duracion', correct: true, explanation: 'Correcto! Sub-agents son ligeros: comparten el contexto del agente principal y son ideales para tareas paralelas cortas (analisis, investigacion). Agent Teams proporciona aislamiento real con worktrees y es ideal para features independientes, multiples PRs, o proyectos donde los agentes necesitan modificar archivos sin conflictos.' },
        { text: 'Sub-Agents para tareas simples, Agent Teams para tareas complejas', correct: false, explanation: 'La complejidad de la tarea no es el criterio. El criterio es si necesitas AISLAMIENTO (archivos separados, builds independientes) o no. Un analisis complejo puede usar sub-agents si no necesita aislamiento.' },
        { text: 'Siempre usar Sub-Agents porque Agent Teams es experimental', correct: false, explanation: 'Agent Teams esta en produccion y es como Anthropic construyo el compilador C (100K lineas, 16 agentes). No es experimental; es la herramienta correcta para trabajo paralelo con aislamiento.' }
      ],
      source: 'Claude Code - Agent Teams',
      sourceUrl: 'https://code.claude.com/docs/en/agent-teams'
    }
  ];
</script>

<svelte:head>
  <title>Modulo {MODULE_ID}: {mod.title} | Agent Mastery</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Header -->
  <div class="mb-8 fade-in">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-4xl">{mod.icon}</span>
      <div>
        <p class="text-agent-accent text-sm font-bold uppercase tracking-wider">Modulo {MODULE_ID}</p>
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

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 1: Frameworks Multi-Agente                        -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. Frameworks Multi-Agente</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando un solo agente no es suficiente, necesitas un <strong class="text-agent-text">framework</strong> que te permita orquestar multiples agentes de forma predecible. No todos los frameworks son iguales: algunos te dan control total a costa de complejidad, otros te dan simplicidad a costa de flexibilidad. La decision correcta depende de tu caso de uso, no de cual suena mas impresionante.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      En este modulo usamos <strong class="text-agent-accent">Claude Agent SDK</strong> como framework principal porque es el mas integrado con el ecosistema Claude y porque Claude Code (la herramienta central de este curso) lo usa internamente. Pero conocer las alternativas es importante para poder elegir la herramienta correcta en cada contexto.
    </p>

    <!-- Claude Agent SDK -->
    <h3 class="text-lg font-bold text-agent-text mb-3">Claude Agent SDK</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El SDK oficial de Anthropic para construir agentes. Disponible en <strong class="text-agent-text">Python y TypeScript</strong>. Su filosofia es minimalista: cuatro primitivas que se combinan para resolver cualquier patron de orquestacion. No te fuerza a usar abstracciones pesadas ni grafos complejos. Simplemente defines agentes, herramientas, handoffs y guardrails, y el SDK maneja el agentic loop.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Agent</h4>
        <p class="text-xs text-agent-muted">Un LLM configurado con instrucciones, herramientas y guardrails. Es la unidad basica. Cada agente tiene su system prompt, sus tools disponibles, y sus reglas de seguridad. Multiples agentes pueden coordinar via handoffs.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Tool</h4>
        <p class="text-xs text-agent-muted">Una funcion que el agente puede invocar. Definida con JSON Schema para parametros, descripcion para guiar la seleccion, y logica de ejecucion. El SDK valida automaticamente los argumentos contra el schema.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Handoff</h4>
        <p class="text-xs text-agent-muted">Transferencia de control de un agente a otro. El agente actual decide que otro agente es mas adecuado para la tarea y le pasa el contexto. Nativo en el SDK, no es un hack sobre tools.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Guardrail</h4>
        <p class="text-xs text-agent-muted">Validacion de input u output que puede bloquear la ejecucion si detecta problemas. Se ejecutan en cada iteracion del loop. Pueden ser de input (antes de procesar) o de output (antes de responder).</p>
      </div>
    </div>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># Claude Agent SDK - Ejemplo minimo
from agents import Agent, Tool, Handoff, Runner

# Definir herramientas
search_tool = Tool(
    name="search_docs",
    description="Busca en la documentacion del proyecto",
    params_schema={"query": {"type": "string"}},
    fn=search_documentation
)

# Definir agentes
code_reviewer = Agent(
    name="Code Reviewer",
    instructions="Analiza calidad de codigo. Enfocate en DRY, SOLID, y complejidad ciclomatica.",
    tools=[search_tool]
)

security_auditor = Agent(
    name="Security Auditor",
    instructions="Busca vulnerabilidades: SQL injection, XSS, secrets expuestos, dependencias con CVEs.",
    tools=[search_tool]
)

# Orquestador con handoffs
orchestrator = Agent(
    name="Review Orchestrator",
    instructions="Coordina el review de PRs. Asigna tareas a especialistas.",
    handoffs=[
        Handoff(agent=code_reviewer),
        Handoff(agent=security_auditor)
    ]
)

# Ejecutar
result = await Runner.run(orchestrator, input="Review PR #42")</pre>`}

    <!-- LangGraph -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">LangGraph</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Desarrollado por LangChain. Su filosofia: <strong class="text-agent-text">todo es un grafo de estados</strong>. Defines nodos (agentes o funciones), edges (transiciones), y un estado compartido que se pasa entre nodos. Da <strong class="text-agent-text">control total</strong> sobre el flujo de ejecucion, lo que es poderoso para workflows complejos con bifurcaciones, loops y checkpoints. El trade-off: la curva de aprendizaje es empinada y el codigo se vuelve verboso rapidamente.
    </p>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># LangGraph - Grafo de estados
from langgraph.graph import StateGraph, END

class ReviewState(TypedDict):
    pr_diff: str
    quality_result: str
    security_result: str
    summary: str

graph = StateGraph(ReviewState)

# Nodos = funciones que transforman el estado
graph.add_node("analyze_quality", quality_agent)
graph.add_node("analyze_security", security_agent)
graph.add_node("summarize", summary_agent)

# Edges = transiciones entre nodos
graph.add_edge("analyze_quality", "summarize")
graph.add_edge("analyze_security", "summarize")
graph.add_edge("summarize", END)

# Bifurcacion condicional
graph.add_conditional_edges("start",
    route_by_pr_size,  # funcion que decide
    {"small": "analyze_quality", "large": "analyze_all"}
)

app = graph.compile()</pre>`}

    <!-- CrewAI -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">CrewAI</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El framework mas opinionado: define agentes como <strong class="text-agent-text">roles con personalidad</strong>. Cada agente tiene un goal, un backstory, y un role. Las tareas se asignan a agentes especificos y se ejecutan en secuencia o paralelo. Es el mas facil de aprender y el mas rapido para prototipar. El trade-off: poca flexibilidad para patrones complejos y la abstraccion de "roles" puede ser confusa cuando el agente no necesita una "personalidad".
    </p>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># CrewAI - Roles y Tareas
from crewai import Agent, Task, Crew

reviewer = Agent(
    role="Senior Code Reviewer",
    goal="Encontrar problemas de calidad en el codigo",
    backstory="Tienes 15 anos de experiencia en code review..."
)

security_expert = Agent(
    role="Security Auditor",
    goal="Identificar vulnerabilidades de seguridad",
    backstory="Eres un experto en OWASP Top 10..."
)

review_task = Task(
    description="Analiza la calidad del PR #42",
    agent=reviewer
)

security_task = Task(
    description="Audita la seguridad del PR #42",
    agent=security_expert
)

crew = Crew(
    agents=[reviewer, security_expert],
    tasks=[review_task, security_task],
    process="parallel"  # o "sequential"
)

result = crew.kickoff()</pre>`}

    <!-- Comparison Table -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">Tabla Comparativa</h3>
    <div class="overflow-x-auto mb-4">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead>
          <tr class="bg-agent-card text-agent-text">
            <th class="px-3 py-2 text-left border-b border-agent-border">Feature</th>
            <th class="px-3 py-2 text-left border-b border-agent-border">Claude Agent SDK</th>
            <th class="px-3 py-2 text-left border-b border-agent-border">LangGraph</th>
            <th class="px-3 py-2 text-left border-b border-agent-border">CrewAI</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Filosofia</td>
            <td class="px-3 py-2">4 primitivas combinables</td>
            <td class="px-3 py-2">Todo es un grafo de estados</td>
            <td class="px-3 py-2">Roles con personalidad</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-dark/30">
            <td class="px-3 py-2 font-medium text-agent-text">Lenguajes</td>
            <td class="px-3 py-2">Python, TypeScript</td>
            <td class="px-3 py-2">Python</td>
            <td class="px-3 py-2">Python</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Curva de aprendizaje</td>
            <td class="px-3 py-2 text-agent-success">Baja</td>
            <td class="px-3 py-2 text-agent-danger">Alta</td>
            <td class="px-3 py-2 text-agent-success">Baja</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-dark/30">
            <td class="px-3 py-2 font-medium text-agent-text">Flexibilidad</td>
            <td class="px-3 py-2">Alta (composable)</td>
            <td class="px-3 py-2">Muy alta (total control)</td>
            <td class="px-3 py-2">Limitada (opinionated)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Handoff nativo</td>
            <td class="px-3 py-2 text-agent-success">Si, primitiva core</td>
            <td class="px-3 py-2 text-agent-warning">Via edges condicionales</td>
            <td class="px-3 py-2 text-agent-danger">No nativo</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-dark/30">
            <td class="px-3 py-2 font-medium text-agent-text">Guardrails nativos</td>
            <td class="px-3 py-2 text-agent-success">Si, primitiva core</td>
            <td class="px-3 py-2 text-agent-warning">Custom via nodos</td>
            <td class="px-3 py-2 text-agent-danger">No nativo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Integracion Claude</td>
            <td class="px-3 py-2 text-agent-success">Nativa, optima</td>
            <td class="px-3 py-2 text-agent-warning">Via adaptadores</td>
            <td class="px-3 py-2 text-agent-warning">Via LiteLLM</td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-medium text-agent-text">Ideal para</td>
            <td class="px-3 py-2">Agentes Claude, produccion</td>
            <td class="px-3 py-2">Workflows complejos con estado</td>
            <td class="px-3 py-2">Prototipos rapidos</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Claude Code NO usa ninguno de estos frameworks externamente. Usa el agentic loop interno de Anthropic con las mismas primitivas del Agent SDK pero profundamente integradas en el runtime. Cuando usas Sub-Agents (Task tool) y Agent Teams, estas usando la implementacion de Anthropic directamente, sin capas intermedias.</p>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Elegir un framework porque es popular en Twitter/X en vez de porque resuelve tu problema. LangGraph tiene muchas estrellas en GitHub pero si solo necesitas coordinar 3 agentes con handoffs, el Agent SDK es 10x mas simple. La complejidad de un framework es un costo que pagas en cada feature futura.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 2: Los 5 Patrones de Orquestacion                 -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Los 5 Patrones de Orquestacion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Estos patrones no son inventos academicos: provienen de los papers de <strong class="text-agent-text">Anthropic</strong> ("Building Effective AI Agents") y <strong class="text-agent-text">OpenAI</strong> ("A Practical Guide to Agents"), validados en produccion real. Son al desarrollo de agentes lo que los patrones GoF son al desarrollo orientado a objetos: soluciones probadas a problemas recurrentes.
    </p>

    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4 mb-6">
      <p class="text-agent-accent font-bold text-sm">El principio guia de Anthropic</p>
      <p class="text-sm text-agent-muted mt-1">Analiza las <strong class="text-agent-text">dependencias entre tareas</strong> ANTES de elegir un patron. Son independientes? Usa paralelo. Una necesita el output de otra? Usa pipeline. Necesitan coordinacion compleja? Usa orquestador. Esta decision se toma en la fase de diseno, no se descubre en produccion.</p>
    </div>

    <!-- Pattern 1: Orchestrator-Worker -->
    <h3 class="text-lg font-bold text-agent-text mb-3">2.1 Orchestrator-Worker</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      El patron mas comun y versatil. Un <strong class="text-agent-text">agente central</strong> recibe la tarea, la descompone en subtareas, las asigna a workers especializados, recopila resultados y sintetiza la respuesta final. Es como un director de orquesta: no toca ningun instrumento, pero coordina a todos para que la sinfonia suene coherente.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-3">
      {@html `<pre class="code-block text-agent-highlight text-sm">ORQUESTADOR (Opus):
├── Descompone: "Review PR #42" → 3 subtareas
├── Asigna WORKER 1 (Sonnet): Calidad de codigo
├── Asigna WORKER 2 (Sonnet): Seguridad       ← paralelo
├── Asigna WORKER 3 (Sonnet): Cobertura tests
├── Espera resultados de los 3 workers
├── Detecta y resuelve contradicciones
└── Sintetiza review final unificado</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: Multi-Agent Research System</p>
      <p class="text-sm text-agent-muted">Anthropic reporto un <strong class="text-agent-text">90.2% de mejora</strong> sobre un agente individual en tareas de investigacion compleja. La arquitectura: Opus como lider que descompone la query, multiples Sonnet workers que investigan en paralelo, y Opus sintetiza los resultados. La clave fue la <strong class="text-agent-text">especializacion + paralelizacion + sintesis</strong>.</p>
    </div>

    <!-- Pattern 2: Pipeline -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">2.2 Pipeline</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Cadena secuencial donde el output de un agente es el input del siguiente. Predecible, facil de debuggear, y perfecto para workflows donde cada paso depende del anterior. Piensa en el pipeline de Unix: <code class="text-agent-accent bg-agent-dark px-1.5 py-0.5 rounded text-xs">cat file | grep error | sort | uniq -c</code>.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-3">
      {@html `<pre class="code-block text-agent-highlight text-sm">Research → Draft → Review → Format → Publish

Agente 1: Investiga el tema, produce notas
    ↓ (notas como input)
Agente 2: Escribe un borrador basado en las notas
    ↓ (borrador como input)
Agente 3: Revisa calidad, estilo, precision
    ↓ (borrador revisado como input)
Agente 4: Formatea para publicacion final</pre>`}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Cuando usarlo</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Cada paso NECESITA el resultado del anterior</li>
          <li>El flujo es lineal y predecible</li>
          <li>Necesitas trazabilidad paso a paso</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">Cuando evitarlo</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Las tareas son independientes entre si</li>
          <li>La latencia total es critica (secuencial = lento)</li>
          <li>Una falla en un paso bloquea TODO el pipeline</li>
        </ul>
      </div>
    </div>

    <!-- Pattern 3: Handoff -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">2.3 Handoff</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un agente transfiere control a un especialista. No hay coordinador central: el agente actual decide a quien pasar la tarea basandose en el contexto. En el Agent SDK, es una <strong class="text-agent-text">primitiva nativa</strong>. En Claude Code, se implementa con sub-agents que tienen prompts especializados (custom agents en <code class="text-agent-accent bg-agent-dark px-1.5 py-0.5 rounded text-xs">.claude/agents/</code>).
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-3">
      {@html `<pre class="code-block text-agent-highlight text-sm"># Agent SDK - Handoff nativo
triage = Agent(
    name="Triage",
    instructions="Determina si la solicitud es de ventas, soporte, o billing",
    handoffs=[
        Handoff(agent=sales_agent, description="Preguntas sobre precios y planes"),
        Handoff(agent=support_agent, description="Problemas tecnicos"),
        Handoff(agent=billing_agent, description="Facturacion y cobros")
    ]
)
# El triage decide a quien pasar basandose en el contexto del usuario</pre>`}
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La transferencia de contexto es critica en un handoff. El agente que recibe necesita suficiente contexto para continuar sin pedirle al usuario que repita informacion. En el Agent SDK, el historial de mensajes se pasa automaticamente. En Claude Code, el sub-agent recibe el prompt del agente padre como contexto.</p>
    </div>

    <!-- Pattern 4: Parallelization -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">2.4 Parallelization</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Multiples agentes trabajan simultaneamente en subtareas independientes. Un orquestador divide, espera, y combina resultados. La mejora de latencia es directamente proporcional al numero de tareas paralelas: si 3 tareas toman 30 segundos cada una, en paralelo el total es ~30 segundos en vez de 90.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-3">
      {@html `<pre class="code-block text-agent-highlight text-sm"># En Claude Code: multiples Task tool calls en UN mensaje
# → se ejecutan en PARALELO automaticamente

Mensaje del agente principal:
┌─ Task("Analiza calidad de codigo del PR #42")
├─ Task("Audita seguridad del PR #42")        ← PARALELO
└─ Task("Verifica cobertura de tests del PR #42")

Claude Code ejecuta los 3 sub-agents simultaneamente.
Cuando los 3 terminan, el agente principal continua.</pre>`}
    </div>

    <!-- Pattern 5: Evaluator-Optimizer -->
    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">2.5 Evaluator-Optimizer</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un agente genera, otro evalua. <strong class="text-agent-text">Loop hasta alcanzar el threshold de calidad</strong>. Es el patron detras de la mejora del 90.2% de Anthropic: el evaluador no acepta el primer resultado, pide mejoras iterativas hasta que la calidad sea suficiente.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-3">
      {@html `<pre class="code-block text-agent-highlight text-sm">GENERADOR: produce resultado v1
    ↓
EVALUADOR: analiza calidad
    ↓ "score: 65/100 - le falta manejo de edge cases"
    ↓
GENERADOR: produce v2 con feedback del evaluador
    ↓
EVALUADOR: analiza calidad
    ↓ "score: 88/100 - aprobado, threshold es 80"
    ↓
RESULTADO FINAL: v2

# Maximo N iteraciones para evitar loops infinitos
# Si no alcanza threshold despues de N, escalar</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">El Multi-Agent Research System de Anthropic usa Evaluator-Optimizer como parte de su arquitectura. Los workers Sonnet generan investigacion, y el agente Opus lider evalua la calidad antes de sintetizar. Si un resultado no es suficientemente bueno, se re-asigna. Este loop iterativo es lo que llevo a la mejora del 90.2% sobre la linea base.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 3: Claude Code Sub-Agents                         -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Sub-Agents en Claude Code</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code implementa los patrones de orquestacion a traves de <strong class="text-agent-text">sub-agents</strong>. Cada sub-agent se lanza con el <strong class="text-agent-accent">Task tool</strong> y tiene su propio context window, su propio set de herramientas, y su propio agentic loop. El agente principal orquesta y sintetiza.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Mapeo: Patron → Implementacion en Claude Code</h3>
    <div class="space-y-3 mb-4">
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold">Orchestrator-Worker</span>
          <span class="text-xs bg-agent-accent/20 text-agent-accent px-2 py-0.5 rounded">Task tool</span>
        </div>
        <p class="text-xs text-agent-muted">El agente principal usa <code class="text-agent-accent bg-agent-dark px-1 rounded">Task</code> para lanzar sub-agents especializados. Cada Task call describe la subtarea, y el sub-agent opera de forma independiente con su propio contexto.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold">Pipeline</span>
          <span class="text-xs bg-agent-accent/20 text-agent-accent px-2 py-0.5 rounded">Task secuencial</span>
        </div>
        <p class="text-xs text-agent-muted">Task calls secuenciales donde el resultado de un sub-agent se incluye en el prompt del siguiente. Cada Task recibe el output del anterior como parte de sus instrucciones.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold">Parallelization</span>
          <span class="text-xs bg-agent-accent/20 text-agent-accent px-2 py-0.5 rounded">Multiples Task en 1 mensaje</span>
        </div>
        <p class="text-xs text-agent-muted">Multiples Task tool calls en un <strong class="text-agent-text">solo mensaje</strong> del agente principal. Claude Code los detecta y ejecuta en paralelo automaticamente. Es la forma mas eficiente de paralelizar.</p>
      </div>
      <div class="bg-agent-card border border-agent-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold">Handoff</span>
          <span class="text-xs bg-agent-accent/20 text-agent-accent px-2 py-0.5 rounded">Custom agents en .claude/agents/</span>
        </div>
        <p class="text-xs text-agent-muted">Agentes custom definidos en <code class="text-agent-accent bg-agent-dark px-1 rounded">.claude/agents/*.md</code> con prompts especializados. El agente principal invoca al especialista correcto basandose en el contexto de la tarea.</p>
      </div>
    </div>

    {@html `<pre class="code-block text-agent-highlight text-sm mb-4"># Ejemplo: Orchestrator-Worker en Claude Code
# El agente principal lanza 3 sub-agents en paralelo:

"Necesito hacer review del PR #42. Voy a lanzar 3 analisis en paralelo."

[Task: "Analiza la calidad del codigo en el diff del PR #42.
        Enfocate en: complejidad ciclomatica, DRY, naming conventions.
        Responde con una lista de findings con severidad."]

[Task: "Audita la seguridad del diff del PR #42.
        Busca: SQL injection, XSS, secrets expuestos, dependencias con CVEs.
        Responde con findings y severidad."]

[Task: "Verifica la cobertura de tests para los cambios del PR #42.
        Identifica funciones nuevas/modificadas sin tests.
        Responde con % de cobertura y funciones descubiertas."]

# Los 3 se ejecutan EN PARALELO
# Cuando terminan, el agente principal sintetiza el review</pre>`}

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave: Isolation</p>
      <p class="text-sm text-agent-muted">Cada sub-agent tiene su <strong class="text-agent-text">propio context window</strong>. No comparte memoria con el agente principal ni con otros sub-agents. Esto es una ventaja: evita contaminacion de contexto. El sub-agent no se distrae con informacion de otras tareas. Pero tambien significa que no puede acceder a descubrimientos de otros sub-agents durante su ejecucion.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 4: Agent Teams                                     -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Agent Teams</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Agent Teams es la feature experimental de Claude Code para trabajo paralelo a <strong class="text-agent-text">gran escala</strong>. Mientras que los sub-agents (Task tool) son ligeros y comparten el contexto del agente principal, Agent Teams proporciona <strong class="text-agent-text">aislamiento completo</strong>: cada teammate opera en su propio git worktree, con sus propios archivos, y se comunica via un sistema de mailbox.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anatomia de un Agent Team</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">TEAM LEAD (tu sesion principal de Claude Code)
│
├── TeamCreate: crea el equipo con un nombre
│
├── Task (team_name="review-team"):
│   └── TEAMMATE 1: "Analiza calidad del PR"
│       ├── Opera en su propio git worktree
│       ├── Puede leer/escribir archivos sin conflictos
│       └── Reporta via shared task list
│
├── Task (team_name="review-team"):
│   └── TEAMMATE 2: "Audita seguridad del PR"
│       ├── Opera en OTRO git worktree
│       ├── Lock files previenen conflictos
│       └── Reporta via shared task list
│
├── TaskList: lee el progreso de todos los teammates
├── SendMessage: envia instrucciones adicionales
└── Sintetiza resultados cuando todos terminan</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Herramientas de coordinacion</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">TeamCreate</h4>
        <p class="text-xs text-agent-muted">Crea un equipo con un nombre. Los teammates posteriores se asignan a este equipo. El team lead (tu sesion) coordina.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Task (con team_name)</h4>
        <p class="text-xs text-agent-muted">Lanza un teammate con una tarea especifica. Cada teammate obtiene su propio worktree y opera de forma independiente.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">TaskCreate / TaskList / TaskUpdate</h4>
        <p class="text-xs text-agent-muted">Sistema de tareas compartido. El team lead y los teammates pueden crear, listar y actualizar tareas. Es el mecanismo de coordinacion asincroma.</p>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-accent font-bold text-sm mb-2">SendMessage</h4>
        <p class="text-xs text-agent-muted">Comunicacion directa entre agentes via mailbox. Permite enviar instrucciones adicionales o informacion descubierta durante la ejecucion.</p>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: Compilador C con 16 Agentes</p>
      <p class="text-sm text-agent-muted">Anthropic construyo un compilador C completo usando Agent Teams: <strong class="text-agent-text">16 agentes Claude Code</strong> trabajando en paralelo, cada uno en un modulo del compilador. El resultado: <strong class="text-agent-text">100,000 lineas de Rust</strong> que pueden compilar programas reales, incluyendo partes del kernel de Linux. Los <strong class="text-agent-text">lock files</strong> prevenian conflictos en archivos compartidos (headers, tipos comunes), y <strong class="text-agent-text">Docker containers</strong> proporcionaban aislamiento para build/test de cada modulo.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Sub-Agents vs Agent Teams</h3>
    <div class="overflow-x-auto mb-4">
      <table class="w-full text-sm border border-agent-border rounded-lg overflow-hidden">
        <thead>
          <tr class="bg-agent-card text-agent-text">
            <th class="px-3 py-2 text-left border-b border-agent-border">Criterio</th>
            <th class="px-3 py-2 text-left border-b border-agent-border">Sub-Agents (Task)</th>
            <th class="px-3 py-2 text-left border-b border-agent-border">Agent Teams</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Aislamiento</td>
            <td class="px-3 py-2">Context window propio, filesystem compartido</td>
            <td class="px-3 py-2">Git worktree propio, filesystem aislado</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-dark/30">
            <td class="px-3 py-2 font-medium text-agent-text">Overhead</td>
            <td class="px-3 py-2 text-agent-success">Bajo (solo un nuevo context)</td>
            <td class="px-3 py-2 text-agent-warning">Alto (worktree + lock files + mailbox)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="px-3 py-2 font-medium text-agent-text">Comunicacion</td>
            <td class="px-3 py-2">Via resultado de la Task</td>
            <td class="px-3 py-2">Shared task list + SendMessage</td>
          </tr>
          <tr class="border-b border-agent-border/50 bg-agent-dark/30">
            <td class="px-3 py-2 font-medium text-agent-text">Escala</td>
            <td class="px-3 py-2">3-5 sub-agents tipico</td>
            <td class="px-3 py-2">Hasta 16+ teammates</td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-medium text-agent-text">Ideal para</td>
            <td class="px-3 py-2">Analisis paralelo, investigacion</td>
            <td class="px-3 py-2">Features grandes, multiples PRs, compiladores</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 5: Caso - Multi-Agent Research System               -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Caso: Multi-Agent Research System</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      En febrero de 2025, el equipo de ingenieria de Anthropic publico los resultados de su sistema de investigacion multi-agente. Es el caso de estudio mas detallado de como aplicar patrones de orquestacion para resolver problemas reales de alta complejidad.
    </p>

    <div class="bg-agent-card border-l-4 border-l-agent-accent rounded-r-lg p-4 mb-4">
      <h3 class="text-agent-text font-bold mb-2">El Problema</h3>
      <p class="text-sm text-agent-muted">Las tareas de investigacion complejas requieren buscar informacion en multiples documentos, sintetizar hallazgos, y generar respuestas coherentes. Un solo agente pierde precision cuando el contexto crece y las fuentes son multiples.</p>
    </div>

    <div class="bg-agent-card border-l-4 border-l-agent-success rounded-r-lg p-4 mb-4">
      <h3 class="text-agent-text font-bold mb-2">La Solucion</h3>
      <div class="space-y-2 text-sm text-agent-muted">
        <p><strong class="text-agent-text">Agente Lider (Opus)</strong>: Recibe la query, la descompone en sub-preguntas de investigacion, y decide cuantos workers necesita.</p>
        <p><strong class="text-agent-text">Workers (Sonnet)</strong>: Cada uno investiga una sub-pregunta de forma independiente. Acceden a documentos, buscan informacion, y generan notas de investigacion.</p>
        <p><strong class="text-agent-text">Sintesis (Opus)</strong>: El lider recopila los resultados de todos los workers, detecta contradicciones o gaps, y genera la respuesta final sintetizada.</p>
      </div>
    </div>

    <div class="bg-agent-card border-l-4 border-l-agent-warning rounded-r-lg p-4 mb-4">
      <h3 class="text-agent-text font-bold mb-2">Los Resultados</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <div class="text-center">
          <p class="text-2xl font-bold text-agent-accent">90.2%</p>
          <p class="text-xs text-agent-muted">Mejora sobre agente individual</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-agent-accent">Opus</p>
          <p class="text-xs text-agent-muted">Lider + sintetizador</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-agent-accent">Sonnet</p>
          <p class="text-xs text-agent-muted">Workers paralelos</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-agent-accent">3 patrones</p>
          <p class="text-xs text-agent-muted">Orch + Parallel + Eval</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Key Insight</p>
      <p class="text-sm text-agent-muted">La decision de usar Opus para liderar y Sonnet para workers no fue solo tecnica, sino economica. Sonnet es mas rapido y barato que Opus, ideal para tareas de investigacion que no requieren razonamiento profundo. Opus se reserva para las tareas que SI lo necesitan: descomposicion de queries complejas y sintesis de resultados contradictorios. Este "model routing" interno es una leccion clave.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 6: Caso - Compilador C                             -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Caso: Compilador C con 16 Agentes</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El caso de estudio mas ambicioso publicado por Anthropic en 2025: construir un <strong class="text-agent-text">compilador C completo desde cero</strong> usando Claude Code Agent Teams. No un toy compiler, sino uno que puede compilar programas reales.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="card bg-agent-dark text-center">
        <p class="text-2xl font-bold text-agent-accent">16</p>
        <p class="text-xs text-agent-muted">Agentes en paralelo</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <p class="text-2xl font-bold text-agent-accent">100K</p>
        <p class="text-xs text-agent-muted">Lineas de Rust</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <p class="text-2xl font-bold text-agent-accent">Lock</p>
        <p class="text-xs text-agent-muted">Files para conflictos</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <p class="text-2xl font-bold text-agent-accent">Docker</p>
        <p class="text-xs text-agent-muted">Build/test aislado</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como se organizaron</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">Compilador C = 16 modulos independientes

Agente 1:  Lexer (tokenizacion)
Agente 2:  Parser (AST)
Agente 3:  Semantic Analysis
Agente 4:  Type Checker
Agente 5:  IR Generation
Agente 6:  Optimization Passes
Agente 7:  x86-64 Code Gen
Agente 8:  ARM64 Code Gen
Agente 9:  Linker
Agente 10: Preprocessor
Agente 11: Standard Library
Agente 12: Error Reporting
Agente 13: Debug Info (DWARF)
Agente 14: Test Infrastructure
Agente 15: Benchmarks
Agente 16: Integration Tests

Cada agente: propio worktree + Docker container
Archivos compartidos: lock files para acceso exclusivo</pre>`}
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave: Boundaries Claros</p>
      <p class="text-sm text-agent-muted">El exito de este proyecto dependio de tener <strong class="text-agent-text">interfaces claras entre modulos</strong>. Cada agente sabia exactamente que inputs recibia y que outputs debia producir. Las interfaces (tipos compartidos, headers) estaban definidas ANTES de que los agentes empezaran a implementar. Esto es diseno de software clasico aplicado a agentes.</p>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Leccion para tu trabajo</p>
      <p class="text-sm text-agent-muted">No necesitas 16 agentes para beneficiarte de este patron. Con 3-4 agentes trabajando en modulos independientes de tu codebase (frontend, API, base de datos, tests), ya obtienes el beneficio del paralelismo. La clave no es el numero de agentes, sino la <strong class="text-agent-text">claridad de las interfaces</strong> entre sus areas de trabajo.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- SECTION 7: Cuando Usar Que                                 -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">7. Cuando Usar Que</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La decision entre un solo agente, sub-agents, Agent Teams, o multiples sesiones no deberia ser arbitraria. Aqui esta la guia de decision basada en la complejidad de la tarea y las necesidades de aislamiento.
    </p>

    <div class="space-y-3 mb-4">
      <div class="bg-agent-card border-l-4 border-l-agent-success rounded-r-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-success font-bold">Un solo agente Claude Code</span>
        </div>
        <p class="text-sm text-agent-muted">Tareas simples en un area del codebase. Fix de un bug, implementar una funcion, refactorizar un archivo. No necesitas coordinacion porque no hay paralelismo.</p>
        <p class="text-xs text-agent-accent mt-2">Ejemplo: "Fix el bug en la validacion de email del formulario de registro"</p>
      </div>

      <div class="bg-agent-card border-l-4 border-l-agent-accent rounded-r-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-accent font-bold">Sub-Agents (Task tool)</span>
        </div>
        <p class="text-sm text-agent-muted">Necesitas investigacion paralela, analisis multiples, o especializacion. Los sub-agents comparten el filesystem pero tienen context windows separados. Ideal para 3-5 tareas paralelas de corta duracion.</p>
        <p class="text-xs text-agent-accent mt-2">Ejemplo: "Analiza este PR: calidad + seguridad + tests en paralelo"</p>
      </div>

      <div class="bg-agent-card border-l-4 border-l-agent-warning rounded-r-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-warning font-bold">Agent Teams</span>
        </div>
        <p class="text-sm text-agent-muted">Features grandes, multiples workstreams independientes, o necesitas aislamiento real de filesystem. Cada teammate tiene su worktree. Lock files previenen conflictos. Escala hasta 16+ agentes.</p>
        <p class="text-xs text-agent-accent mt-2">Ejemplo: "Implementa el modulo de autenticacion, el dashboard, y los endpoints de API en paralelo"</p>
      </div>

      <div class="bg-agent-card border-l-4 border-l-agent-danger rounded-r-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-agent-danger font-bold">Multiples sesiones independientes</span>
        </div>
        <p class="text-sm text-agent-muted">Proyectos completamente separados sin dependencias. Cada sesion es una instancia independiente de Claude Code con su propio directorio de trabajo. No hay coordinacion entre sesiones.</p>
        <p class="text-xs text-agent-accent mt-2">Ejemplo: "Un agente trabaja en el backend API, otro en el mobile app, otro en la documentacion"</p>
      </div>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-accent rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-2">Arbol de Decision</p>
      {@html `<pre class="text-xs text-agent-muted font-mono whitespace-pre-wrap">¿La tarea es simple y toca UN area del codigo?
  └── SI → Un solo agente

¿Necesitas analizar/investigar en paralelo SIN modificar archivos?
  └── SI → Sub-Agents (Task tool)

¿Los agentes necesitan MODIFICAR archivos simultaneamente?
  └── SI → ¿Son archivos en el MISMO repo?
            └── SI → Agent Teams (worktrees + lock files)
            └── NO → Multiples sesiones independientes</pre>`}
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Usar Agent Teams para tareas que un solo agente con 3 herramientas resuelve en 2 minutos. Anthropic lo dice claro: <strong class="text-agent-text">"The number of agents is not the measure of sophistication."</strong> Mas agentes = mas overhead, mas latencia, mas costo, mas puntos de falla. Empieza simple y escala solo cuando el agente individual demuestre limitaciones.</p>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- BranchingScenario                                          -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Escenario: Disena la Orquestacion</h2>
      {#if !showScenario}
        <button onclick={() => showScenario = true} class="btn-primary text-xs">
          Iniciar escenario
        </button>
      {/if}
    </div>
    {#if !showScenario}
      <div class="card bg-agent-accent/5 border-agent-accent/20">
        <p class="text-agent-muted text-sm">Eres el tech lead de una startup con 30 desarrolladores y 50 PRs/dia. Tu mision: disenar el sistema de code review automatizado. Cada decision determina la calidad, velocidad y escalabilidad de tu sistema.</p>
        <p class="text-sm text-agent-warning mt-2">4-5 decisiones de arquitectura. Tus elecciones afectan la puntuacion final.</p>
      </div>
    {/if}
    {#if showScenario}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Disena un Sistema de Code Review Multi-Agente"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- ═══════════════════════════════════════════════════════════ -->
  <!-- Quiz                                                       -->
  <!-- ═══════════════════════════════════════════════════════════ -->
  <section class="mb-10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold text-agent-text">Quiz: Orquestacion Multi-Agente</h2>
      {#if !showQuiz}
        <button onclick={() => showQuiz = true} class="btn-primary text-xs">
          Iniciar quiz
        </button>
      {/if}
    </div>
    {#if !showQuiz}
      <div class="card bg-agent-accent/5 border-agent-accent/20">
        <p class="text-agent-muted text-sm">5 preguntas sobre patrones de orquestacion, Agent Teams, el Multi-Agent Research System y cuando usar cada herramienta.</p>
      </div>
    {/if}
    {#if showQuiz}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- Completion -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">&#x1F3AD;</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Dominas los frameworks multi-agente y los patrones de orquestacion. Ahora sabes cuando usar un solo agente, sub-agents, o Agent Teams.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
