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

  const MODULE_ID = 12;
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

      const badge = courseStore.unlockBadge('production-ready');
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

  // ===== BranchingScenario: Claude Code GitHub Action Cost Spike =====
  const scenarioNodes: Record<string, any> = {
    start: {
      id: 'start',
      narrative: 'Tu equipo de 15 developers implemento Claude Code GitHub Action hace 2 semanas. Los PRs se revisan automaticamente cuando alguien escribe "@claude review this" en un comentario.\n\nHoy lunes, el CTO te llama:\n- La factura de Anthropic del fin de semana fue $1,200 (vs $120 promedio semanal)\n- Varios developers se quejan de que los reviews son "genericos e inutiles"\n- Un PR de seguridad critica paso sin que el agente detectara un SQL injection obvio\n\n\u00bfQue investigas PRIMERO?',
      choices: [
        { text: 'Los logs del GitHub Action: ver que PRs se procesaron, cuantos tokens consumieron, y que modelo se uso', nextId: 'logs_action', points: 3, feedback: 'Excelente. Los logs del Action te dan la foto completa: que PRs dispararon el costo, cuantos turns uso cada uno, y si hay un patron (PRs enormes, loops, o triggers inadecuados). Datos primero, hipotesis despues.' },
        { text: 'Los comentarios de los developers para entender que no les gusta de los reviews', nextId: 'feedback_first', points: 1, feedback: 'El feedback cualitativo es util pero no te dice POR QUE los costos se dispararon 10x. Necesitas datos cuantitativos primero para entender la raiz del problema.' },
        { text: 'La configuracion del workflow YAML para buscar errores de configuracion', nextId: 'config_check', points: 2, feedback: 'Razonable pero saltas al "como arreglar" antes de entender "que paso". Los logs te diran si el problema es de config o de uso. Diagnostico antes de solucion.' }
      ]
    },
    logs_action: {
      id: 'logs_action',
      narrative: 'Los logs revelan tres problemas claros:\n\n1. Un developer configuro un workflow que dispara el Action en CADA push (no solo en PR comments). Esto genero 340 ejecuciones innecesarias el fin de semana.\n2. El Action usa Opus para TODO, incluyendo PRs de 1 linea (cambio de typo en README).\n3. No hay --max-turns configurado: un PR de 2000 lineas consumio 47 turns y $89 solo.\n\n\u00bfComo priorizas las correcciones?',
      choices: [
        { text: 'Arreglar los 3 problemas en orden de impacto: primero limitar triggers, luego agregar max-turns, y finalmente implementar model routing', nextId: 'fix_triggers', points: 3, feedback: 'Perfecto. Limitar triggers elimina el 70% del gasto innecesario (340 ejecuciones). Max-turns pone un techo al costo por PR. Model routing optimiza el costo por ejecucion. Impacto descendente.' },
        { text: 'Cambiar a Sonnet para todo y listo, es mas barato', nextId: 'sonnet_only', points: 1, feedback: 'Sonnet es mas barato por token pero no resuelve el problema de fondo: 340 ejecuciones innecesarias y PRs sin limite de turns. Ademas, Sonnet puede ser insuficiente para reviews de seguridad complejos.' },
        { text: 'Desactivar el Action completamente hasta tener una configuracion mejor', nextId: 'disable_action', points: 2, feedback: 'Detiene el sangrado pero elimina el valor que el Action estaba dando. Los 15 developers vuelven a esperar 4-8h por reviews humanos. Mejor arreglar quirurgicamente que apagar todo.' }
      ]
    },
    feedback_first: {
      id: 'feedback_first',
      narrative: 'Los developers te dicen:\n- "Los reviews son superficiales, solo dice que el codigo se ve bien"\n- "Tarda mucho en PRs grandes y el resultado no vale la pena"\n- "El Action se dispara en pushes random que no son PRs"\n\nRevisas los logs y confirmas: triggers mal configurados + sin max-turns + sin model routing.\n\n\u00bfComo corriges?',
      choices: [
        { text: 'Limitar triggers a PR comments con @claude + agregar max-turns 10 + usar CLAUDE.md con instrucciones especificas de review', nextId: 'fix_triggers', points: 3, feedback: 'Correcto. Los triggers correctos eliminan ejecuciones innecesarias. Max-turns controla el costo. CLAUDE.md mejora la calidad del review con instrucciones especificas para tu codebase.' },
        { text: 'Solo mejorar el prompt del Action para que haga mejores reviews', nextId: 'prompt_only', points: 1, feedback: 'El prompt no arregla 340 ejecuciones innecesarias ni el costo de $89 en un solo PR. Necesitas cambios de configuracion, no solo de prompting.' }
      ]
    },
    config_check: {
      id: 'config_check',
      narrative: 'Revisas el YAML y encuentras:\n- El trigger es `on: [push, pull_request, issue_comment]` (demasiado amplio)\n- No hay `max_turns` configurado\n- El modelo es `claude-opus-4` para todo\n- No hay `allowed_tools` restringidos\n- No hay `custom_prompt` con instrucciones especificas\n\nRevisas los logs y confirmas: 340 ejecuciones innecesarias el fin de semana.\n\n\u00bfQue corriges primero?',
      choices: [
        { text: 'Restringir triggers + agregar max_turns + configurar model routing (Haiku para PRs simples, Opus para seguridad)', nextId: 'fix_triggers', points: 3, feedback: 'La triada correcta. Triggers correctos = menos ejecuciones. Max turns = costo predecible. Model routing = calidad donde importa, ahorro donde no.' },
        { text: 'Solo restringir los triggers, eso es suficiente', nextId: 'triggers_only', points: 2, feedback: 'Elimina las ejecuciones innecesarias pero sin max_turns, un PR complejo puede seguir costando $89. Y sin model routing, pagas Opus por reviews de typos.' }
      ]
    },
    fix_triggers: {
      id: 'fix_triggers',
      narrative: 'Implementas la configuracion corregida:\n- Trigger solo en `issue_comment` con filtro "@claude"\n- `max_turns: 10` para limitar iteraciones\n- Prompt personalizado con CLAUDE.md del repo\n- `--max-budget-usd 5` como safety net por ejecucion\n\nLos costos bajan un 85%. Pero el CTO quiere mas: "Quiero que el Action revise PRs automaticamente sin que nadie escriba @claude. Pero solo los PRs que tocan archivos criticos (seguridad, auth, payments)."\n\n\u00bfComo lo implementas?',
      choices: [
        { text: 'Agregar un trigger en pull_request con path filters (src/auth/**, src/payments/**) + usar un modelo potente solo para esos PRs + headless mode con --allowedTools Read,Grep,Glob', nextId: 'auto_review', points: 3, feedback: 'Excelente. Path filters aseguran que solo PRs criticos se revisan automaticamente. Modelo potente donde importa. Read-only tools porque el review no necesita modificar codigo.' },
        { text: 'Activar el trigger en todos los PRs pero filtrar en el step del workflow con un if condition', nextId: 'auto_review', points: 2, feedback: 'Funciona pero es menos eficiente: el workflow se ejecuta (consume CI minutes) para luego decidir que no hace nada. Los path filters en el trigger son mas eficientes porque ni siquiera inician el job.' },
        { text: 'Hacer que el Action revise TODOS los PRs automaticamente', nextId: 'all_prs', points: 0, feedback: 'Volveras al problema original: cientos de ejecuciones innecesarias. PRs de documentacion, typos, y formatting no necesitan review de IA. Selectividad es clave.' }
      ]
    },
    sonnet_only: {
      id: 'sonnet_only',
      narrative: 'Cambias todo a Sonnet. Los costos bajan un 70% pero:\n- Las 340 ejecuciones innecesarias siguen\n- Los reviews de seguridad son peores (Sonnet no detecto el SQL injection que Opus habria encontrado)\n- Sin max-turns, PRs grandes siguen siendo caros\n\n\u00bfQue corriges ahora?',
      choices: [
        { text: 'Limitar triggers + agregar max-turns + usar Opus SOLO para PRs de seguridad (model routing)', nextId: 'auto_review', points: 3, feedback: 'Ahora si. No es "un modelo para todo" sino el modelo correcto para cada situacion. Sonnet para reviews generales, Opus para seguridad y archivos criticos.' },
        { text: 'Mantener Sonnet para todo pero mejorar el prompt', nextId: 'prompt_only', points: 1, feedback: 'Un prompt mejor no compensa las limitaciones del modelo para tareas de seguridad. Y las 340 ejecuciones innecesarias siguen quemando dinero.' }
      ]
    },
    disable_action: {
      id: 'disable_action',
      narrative: 'Desactivas el Action. Los developers vuelven a esperar 4-8 horas por reviews humanos. La productividad cae.\n\nDespues de 3 dias, decides reconfigurarlo.\n\n\u00bfComo lo configuras esta vez?',
      choices: [
        { text: 'Trigger selectivo (solo @claude en comments + path filters para archivos criticos) + max-turns 10 + budget limit $5/ejecucion + CLAUDE.md con instrucciones de review', nextId: 'auto_review', points: 3, feedback: 'Esta vez lo haces bien. Triggers selectivos, limites de costo, y contexto personalizado. La configuracion defensiva que debio existir desde el dia 1.' },
        { text: 'La misma configuracion pero con Sonnet en vez de Opus', nextId: 'prompt_only', points: 1, feedback: 'Si no arreglas los triggers y limites, repetiras el mismo problema solo que mas barato. La configuracion es el problema, no el modelo.' }
      ]
    },
    triggers_only: {
      id: 'triggers_only',
      narrative: 'Los triggers corregidos eliminan el 70% del gasto. Pero un developer abre un PR con 3,000 lineas (refactor grande). El Action ejecuta 38 turns y cuesta $72.\n\n\u00bfQue agregas?',
      choices: [
        { text: 'max-turns: 10 + --max-budget-usd 5 como limite por ejecucion', nextId: 'auto_review', points: 3, feedback: 'Dos safety nets complementarios: max-turns limita las iteraciones del agente, max-budget limita el gasto monetario. Cinturon y tiradores.' },
        { text: 'Un mensaje pidiendo al developer que divida PRs grandes', nextId: 'auto_review', points: 1, feedback: 'Pedir PRs mas chicos es buena practica pero no puedes depender de la disciplina humana como safety net. Los limites programaticos son mas confiables.' }
      ]
    },
    prompt_only: {
      id: 'prompt_only',
      narrative: 'Mejoras el prompt pero los problemas de fondo persisten: triggers excesivos, sin limites de costo, sin model routing.\n\nEl proximo fin de semana, otro pico de costos. El CTO ya no esta contento.\n\n\u00bfQue implementas de una vez?',
      choices: [
        { text: 'Triggers correctos + max-turns + budget limit + model routing + CLAUDE.md personalizado', nextId: 'auto_review', points: 3, feedback: 'La solucion completa que debiste implementar desde el principio. Cada capa resuelve un problema diferente: triggers (cuando ejecutar), limits (cuanto gastar), routing (que modelo usar), CLAUDE.md (que revisar).' }
      ]
    },
    all_prs: {
      id: 'all_prs',
      narrative: 'La primera semana, la factura sube a $800. 60% del gasto es en PRs de documentacion y cambios triviales.\n\n\u00bfQue corriges?',
      choices: [
        { text: 'Path filters para auto-review solo en archivos criticos + @claude manual para el resto', nextId: 'auto_review', points: 3, feedback: 'La selectividad es clave. Auto-review para lo critico (seguridad, payments, auth). Review manual con @claude para el resto solo cuando el developer lo pide.' }
      ]
    },
    auto_review: {
      id: 'auto_review',
      narrative: 'El sistema esta estabilizado. Los costos son predecibles ($15-20/dia), la calidad mejoro, y los developers estan contentos.\n\nUltima pregunta: el equipo quiere implementar un harness para que Claude Code haga refactors grandes (que toman horas). \u00bfComo lo disenan?',
      choices: [
        { text: 'Initializer agent que lee el repo y genera un plan + Executor agent que implementa UN feature por sesion + progress file que trackea estado entre sesiones + /clear entre cada sesion', nextId: 'outcome_excellent', points: 3, feedback: 'Perfecto. Este es el patron de harness de Anthropic: el initializer planifica, el executor implementa de a poco, el progress file mantiene estado, y /clear previene context rot. 39% de mejora comprobada vs approach naive.' },
        { text: 'Un solo agente con un prompt largo que haga todo el refactor de una vez', nextId: 'outcome_decent', points: 1, feedback: 'Los refactors grandes exceden el context window. El agente pierde coherencia despues de miles de lineas. El patron de harness existe precisamente porque "hacerlo todo de una" no funciona para tareas largas.' },
        { text: 'Dividir el refactor en tareas manuales y usar Claude Code para cada una independientemente', nextId: 'outcome_good', points: 2, feedback: 'Funciona pero pierde la automatizacion. El harness con initializer/executor automatiza la division en tareas Y la ejecucion. Tu approach requiere supervision humana constante.' }
      ]
    },
    outcome_excellent: {
      id: 'outcome_excellent',
      narrative: '',
      outcome: {
        title: 'Production Engineer Experto',
        description: 'Diagnosticaste el problema con datos, implementaste una configuracion defensiva con multiples safety nets, y disenaste un harness para tareas de larga duracion. Estas listo para operar agentes en produccion.',
        score: 18,
        maxScore: 18,
        grade: 'excellent',
        lessons: [
          'Siempre diagnostica con DATOS (logs, metricas) antes de cambiar configuracion.',
          'Los triggers del GitHub Action deben ser selectivos: @claude para manual, path filters para automatico.',
          'max-turns + max-budget-usd son safety nets OBLIGATORIOS en cualquier Action.',
          'Model routing: Opus para seguridad, Sonnet para reviews generales, Haiku para triaje.',
          'El patron de harness (initializer + executor + progress file + /clear) mejora un 39% las tareas largas.',
          'CLAUDE.md personalizado con instrucciones de review mejora drasticamente la calidad.'
        ]
      }
    },
    outcome_good: {
      id: 'outcome_good',
      narrative: '',
      outcome: {
        title: 'Buena Configuracion',
        description: 'Resolviste los problemas principales y el sistema funciona. Algunos aspectos de automatizacion podrian mejorarse pero la base es solida.',
        score: 12,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Los datos de logs son la fuente de verdad para diagnosticar problemas de costo.',
          'Los limites programaticos (max-turns, budget) son mas confiables que la disciplina humana.',
          'El modelo correcto para la tarea correcta reduce costos sin sacrificar calidad.',
          'Los harnesses de Anthropic son el patron probado para tareas que exceden el context window.',
          'La configuracion defensiva (limites, triggers, routing) debe existir desde el dia 1.'
        ]
      }
    },
    outcome_decent: {
      id: 'outcome_decent',
      narrative: '',
      outcome: {
        title: 'Resolucion Parcial',
        description: 'Arreglaste algunos problemas pero la configuracion tiene gaps que podrian causar sorpresas. Necesitas capas adicionales de proteccion.',
        score: 7,
        maxScore: 18,
        grade: 'needs-work',
        lessons: [
          'Diagnostica con datos, no con intuicion. Los logs del Action son tu mejor herramienta.',
          'Cambiar de modelo NO arregla problemas de configuracion (triggers, limites).',
          'Sin max-turns ni budget limit, un solo PR puede costar mas que todo un mes.',
          'Las tareas largas necesitan un harness estructurado, no un prompt largo.',
          'La configuracion defensiva debe tener MULTIPLES capas: triggers + limits + routing + monitoring.'
        ]
      }
    }
  };

  // ===== Quiz Questions =====
  const quizQuestions = [
    {
      question: '\u00bfCual es la configuracion MINIMA recomendada para claude-code-action en produccion?',
      options: [
        { text: 'Solo anthropic_api_key, el Action se configura solo', correct: false, explanation: 'Sin limites, el Action puede consumir tokens sin control. La API key sola es una configuracion de demo, no de produccion.' },
        { text: 'API key + max_turns + max-budget-usd + trigger selectivo (issue_comment con filtro)', correct: true, explanation: 'Correcto. La API key es obligatoria, max_turns limita iteraciones, max-budget-usd limita gasto, y el trigger selectivo evita ejecuciones innecesarias. Son las 4 safety nets minimas.' },
        { text: 'API key + modelo Haiku para minimizar costos', correct: false, explanation: 'Haiku es barato pero puede ser insuficiente para reviews de seguridad. Ademas, sin limites de turns ni budget, incluso Haiku puede generar costos inesperados en PRs grandes.' },
        { text: 'API key + allowed_tools restringidos a Read solamente', correct: false, explanation: 'Restringir tools es buena practica pero no controla el costo ni los triggers. Puedes tener un Action read-only que se ejecute 300 veces al dia innecesariamente.' }
      ],
      source: 'Claude Code - GitHub Actions',
      sourceUrl: 'https://code.claude.com/docs/en/github-actions'
    },
    {
      question: '\u00bfQue flag de headless mode permite obtener output estructurado que se puede parsear programaticamente?',
      options: [
        { text: '--verbose para obtener mas detalle en la salida', correct: false, explanation: '--verbose agrega mas texto pero no estructura. Para integracion en CI necesitas un formato parseable, no mas texto.' },
        { text: '--output-format json para obtener JSON con tool calls, resultados y mensaje final', correct: true, explanation: 'Correcto. --output-format json retorna un JSON estructurado que incluye cada tool call, su resultado, y el mensaje final. Perfecto para parsear en scripts de CI y extraer metricas.' },
        { text: '--format yaml porque YAML es mas legible que JSON', correct: false, explanation: 'Claude Code headless no soporta output en YAML. JSON es el formato estandar para output estructurado.' },
        { text: '--log-file output.txt para guardar los resultados en un archivo', correct: false, explanation: 'Un log file es texto plano, no estructurado. Para parsear resultados programaticamente necesitas JSON.' }
      ],
      source: 'Claude Code - Headless Mode',
      sourceUrl: 'https://code.claude.com/docs/en/headless'
    },
    {
      question: '\u00bfCual es el patron correcto para tareas que exceden el context window segun Anthropic?',
      options: [
        { text: 'Usar el modelo con mayor context window disponible y esperar que alcance', correct: false, explanation: 'Incluso con 200K tokens, tareas que toman horas generan mas contexto del que cabe. El tamanio del window no resuelve el problema de coherencia a largo plazo.' },
        { text: 'Initializer agent genera plan + Executor agent implementa UN feature por sesion + progress file + /clear entre sesiones', correct: true, explanation: 'Correcto. Este es el patron de harness documentado por Anthropic. El initializer planifica, el executor trabaja en chunks, el progress file mantiene estado entre sesiones, y /clear previene context rot. 39% de mejora vs approach naive.' },
        { text: 'Dividir el trabajo en sub-agents paralelos que trabajan simultaneamente', correct: false, explanation: 'Sub-agents paralelos funcionan para tareas independientes (como code review). Pero para tareas secuenciales (un refactor grande), necesitas el patron de harness con sesiones secuenciales y estado compartido.' },
        { text: 'Comprimir el contexto periodicamente con /compact y continuar en la misma sesion', correct: false, explanation: '/compact ayuda pero no resuelve el problema fundamental: despues de horas de trabajo, el contexto acumulado pierde coherencia. El patron de /clear + progress file es mas robusto porque empieza fresco cada sesion.' }
      ],
      source: 'Anthropic - Effective Harnesses for Long-Running Agents',
      sourceUrl: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents'
    },
    {
      question: '\u00bfCual de estas estrategias de costo tiene el mayor impacto segun la documentacion de Anthropic?',
      options: [
        { text: 'Usar Haiku para todo: es el modelo mas barato', correct: false, explanation: 'Haiku es barato pero insuficiente para muchas tareas. El ahorro por token se pierde si el modelo necesita mas iteraciones o produce resultados incorrectos que requieren correccion.' },
        { text: '/clear entre tareas independientes: 50-70% de ahorro en tokens al no cargar contexto stale', correct: true, explanation: 'Correcto. /clear es la optimizacion de mayor impacto segun Anthropic. Eliminar contexto acumulado de tareas anteriores ahorra 50-70% de tokens de input. Facil de implementar, impacto inmediato.' },
        { text: 'Batch API con 50% de descuento para todas las consultas', correct: false, explanation: 'Batch API ofrece 50% de descuento pero solo para workloads no interactivos (nightly builds, analisis batch). No puedes usarla para interacciones en tiempo real.' },
        { text: 'MAX_THINKING_TOKENS bajo para reducir el costo de razonamiento', correct: false, explanation: 'Reducir thinking tokens ahorra en tareas simples pero puede degradar la calidad en tareas complejas. Es una optimizacion secundaria, no la de mayor impacto.' }
      ],
      source: 'Claude Code - Cost Management',
      sourceUrl: 'https://code.claude.com/docs/en/costs'
    },
    {
      question: '\u00bfEn cual de estos casos NO deberias usar un agente IA?',
      options: [
        { text: 'Code review automatizado de PRs para un equipo de 20 developers', correct: false, explanation: 'Code review es un caso de uso excelente para agentes: tareas repetitivas, con contexto variable, donde la IA aporta valor real (revision rapida, consistencia).' },
        { text: 'Una transformacion de datos bien definida: CSV a JSON con reglas fijas', correct: true, explanation: 'Correcto. Si las reglas son fijas y bien definidas, un script de 20 lineas es mas rapido, barato, determinista y facil de mantener que un agente. Los agentes brillan en tareas ambiguas que requieren razonamiento, no en transformaciones mecanicas.' },
        { text: 'Triaje automatico de issues de GitHub segun urgencia y area', correct: false, explanation: 'El triaje requiere interpretar lenguaje natural ambiguo y asignar categorias, algo donde los agentes son significativamente mejores que reglas fijas.' },
        { text: 'Generacion de tests unitarios para funciones existentes', correct: false, explanation: 'Generacion de tests requiere entender la logica del codigo y generar casos variados, una tarea donde la IA aporta valor real sobre templates estaticos.' }
      ]
    }
  ];
</script>

<svelte:head>
  <title>Modulo 12: {mod.title} | Agent Mastery</title>
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

  <!-- ============================================================= -->
  <!-- THEORY SECTION 1: Claude Code GitHub Action                    -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Claude Code GitHub Action</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      La forma mas directa de poner un agente IA en produccion es <strong class="text-agent-highlight">integrarlo en tu pipeline de CI/CD</strong>. Anthropic ofrece un GitHub Action oficial que permite que Claude Code revise PRs, responda a issues, y ejecute tareas directamente desde GitHub. No necesitas infraestructura propia: GitHub ejecuta el agente por ti.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que</p>
      <p class="text-sm text-agent-muted">Anthropic usa internamente el Claude Code GitHub Action para revisar sus propios PRs. Cada pull request en los repos internos de Anthropic pasa por un review automatizado antes de que un humano lo vea. Esto reduce el tiempo de review de horas a minutos y permite que los reviewers humanos se enfoquen en decisiones de arquitectura, no en detectar bugs obvios.</p>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">El Action: anthropics/claude-code-action@v1</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El Action se dispara en tres contextos principales: cuando alguien comenta "@claude" en un PR, cuando se crea un nuevo PR, o cuando se abre un nuevo issue. En cada caso, Claude Code tiene acceso completo al repositorio y puede leer archivos, buscar patrones, y generar respuestas contextualizadas.
    </p>

    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Trigger 1</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Comentarios con @claude</p>
          <p class="text-xs text-agent-muted">"@claude review this PR" — el agente analiza los cambios y deja un review. "@claude fix the failing test" — el agente intenta arreglar el problema y pushea un commit.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Trigger 2</span>
        <div>
          <p class="text-sm text-agent-text font-bold">PR creation</p>
          <p class="text-xs text-agent-muted">Automaticamente cuando se abre un PR. Ideal con path filters: solo se activa si el PR toca archivos criticos como auth/, payments/, o security/.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Trigger 3</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Nuevos issues</p>
          <p class="text-xs text-agent-muted">Triaje automatico de issues: clasificacion por area, estimacion de complejidad, sugerencia de solucion, asignacion a equipo.</p>
        </div>
      </div>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">Workflow YAML completo</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Este es un workflow de produccion con todas las safety nets necesarias. Observa las configuraciones clave: el trigger selectivo, el modelo, los limites de turns y budget, y las herramientas permitidas.
    </p>

    <div class="bg-agent-darker rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">name: Claude Code Review

on:
  # Trigger manual: developer escribe "@claude" en un comentario
  issue_comment:
    types: [created]

  # Trigger automatico: PRs que tocan archivos criticos
  pull_request:
    paths:
      - 'src/auth/**'
      - 'src/payments/**'
      - 'src/security/**'
      - '**/migrations/**'

# Permisos minimos necesarios
permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  claude-review:
    # Solo ejecutar si el comentario menciona @claude
    # O si es un PR automatico (no un comment)
    if: |
      (github.event_name == 'issue_comment' &&
       contains(github.event.comment.body, '@claude')) ||
      github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          # API key desde GitHub Secrets
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}

          # Modelo: Sonnet para reviews generales
          # Cambia a claude-opus-4 para archivos criticos
          model: "claude-sonnet-4-20250514"

          # Limites de seguridad
          max_turns: 10
          # max-budget-usd no es un param directo,
          # se configura via custom_prompt o env

          # Herramientas permitidas (read-only para review)
          allowed_tools: "Read,Grep,Glob,WebSearch"

          # Instrucciones personalizadas
          custom_prompt: |
            Lee CLAUDE.md del repo para contexto del proyecto.
            Enfocate en:
            1. Bugs potenciales y edge cases
            2. Vulnerabilidades de seguridad (OWASP Top 10)
            3. Performance: queries N+1, memory leaks
            4. Adherencia a los patrones del proyecto
            No comentes sobre estilo/formatting (eso es del linter).
            Se especifico: indica linea, archivo, y sugerencia de fix.</pre>`}
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El <strong class="text-agent-text">custom_prompt</strong> es el equivalente a CLAUDE.md para el GitHub Action. Sin el, el agente hace un review generico. CON el, el agente entiende tu stack, tus patrones, y tus prioridades. La diferencia en calidad es enorme: un review generico dice "este codigo podria mejorar"; un review personalizado dice "esta query N+1 en linea 47 de UserService.ts va a causar problemas con mas de 1000 usuarios, usa un JOIN".</p>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">Casos de uso en produccion</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128270;</span>
        <h4 class="text-agent-accent font-bold text-sm mb-1">Auto Code Review</h4>
        <p class="text-xs text-agent-muted">Review automatico de cada PR que toca archivos criticos. Detecta bugs, security issues, y violaciones de patrones antes del review humano.</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128295;</span>
        <h4 class="text-agent-accent font-bold text-sm mb-1">Auto Fix</h4>
        <p class="text-xs text-agent-muted">"@claude fix the failing test" — el agente analiza el error, modifica el codigo, y pushea un commit con el fix directamente al PR.</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128203;</span>
        <h4 class="text-agent-accent font-bold text-sm mb-1">Issue Triage</h4>
        <p class="text-xs text-agent-muted">Cuando se abre un issue, el agente lo clasifica (bug/feature/question), estima complejidad, sugiere archivos relevantes, y asigna labels.</p>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Configurar el Action con trigger <code class="text-agent-accent bg-agent-darker px-1 rounded">on: [push]</code> sin filtros. Esto ejecuta el agente en CADA push a CUALQUIER branch, incluyendo commits de WIP, formatting, y documentacion. Un equipo de 15 developers haciendo 20 pushes diarios = 300 ejecuciones/dia. A $0.50/ejecucion promedio = <strong class="text-agent-text">$150/dia en reviews inutiles</strong>. Siempre usa triggers selectivos.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 2: Headless Mode en CI                         -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Headless Mode en CI</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El GitHub Action es conveniente pero no es la unica forma de ejecutar Claude Code en CI/CD. El <strong class="text-agent-highlight">modo headless</strong> te permite ejecutar Claude Code como un proceso no-interactivo, controlado completamente por linea de comandos. Es mas flexible que el Action y te da control total sobre el flujo.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      En modo headless, Claude Code se comporta como una herramienta CLI estandar: recibe un prompt, ejecuta, y retorna un resultado. No hay interfaz interactiva, no hay preguntas de confirmacion, no hay prompts de permisos. Todo se configura via flags.
    </p>

    <h3 class="text-xl font-bold text-agent-text mb-3">Flags esenciales</h3>
    <div class="space-y-3 mb-6">
      <div class="bg-agent-darker rounded-lg p-4">
        {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Ejecucion basica: un prompt, una respuesta
claude -p "Analiza src/auth/login.ts y reporta posibles vulnerabilidades"

# Output estructurado para parsear en CI
claude -p "Lista todos los TODOs del proyecto" --output-format json

# Limitar iteraciones del agent loop
claude -p "Refactoriza UserService.ts" --max-turns 10

# Restringir herramientas (read-only = seguro para CI)
claude -p "Review de seguridad" --allowedTools "Read,Grep,Glob"

# Limite de costo por ejecucion
claude -p "Genera tests para auth/" --max-budget-usd 5

# Pipe de input (util en scripts)
echo "Revisa este diff y sugiere mejoras" | claude -p -

# Combinacion completa para CI
claude -p "Analiza los cambios en este PR y genera un reporte" \\
  --output-format json \\
  --max-turns 10 \\
  --allowedTools "Read,Grep,Glob" \\
  --max-budget-usd 3</pre>`}
      </div>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">Output JSON estructurado</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Con <code class="text-agent-accent bg-agent-darker px-1 rounded">--output-format json</code>, el output incluye cada tool call que hizo el agente, sus resultados, y el mensaje final. Esto permite a tu script de CI parsear el resultado y tomar acciones programaticas.
    </p>

    <div class="bg-agent-darker rounded-lg p-4 mb-6">
      {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">{
  "messages": [
    {
      "role": "assistant",
      "content": "Voy a analizar el archivo de autenticacion...",
      "tool_calls": [
        {
          "name": "Read",
          "input": {"file_path": "src/auth/login.ts"},
          "output": "// archivo completo..."
        },
        {
          "name": "Grep",
          "input": {"pattern": "password", "path": "src/"},
          "output": "src/auth/login.ts:42: ..."
        }
      ]
    }
  ],
  "result": "Encontre 2 vulnerabilidades potenciales...",
  "usage": {
    "input_tokens": 4521,
    "output_tokens": 1203,
    "total_cost_usd": 0.047
  }
}</pre>`}
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">Ejemplo: CI pipeline con headless mode</p>
      {@html `<pre class="text-xs text-agent-muted font-mono whitespace-pre-wrap"># En tu GitHub Actions workflow o script de CI
RESULT=$(claude -p "Analiza los archivos modificados en este PR.
Busca: bugs, security issues, performance problems.
Reporta en formato: SEVERITY | FILE:LINE | DESCRIPCION" \\
  --output-format json \\
  --max-turns 8 \\
  --allowedTools "Read,Grep,Glob" \\
  --max-budget-usd 2)

# Parsear el resultado con jq
ISSUES=$(echo "$RESULT" | jq -r '.result')
COST=$(echo "$RESULT" | jq -r '.usage.total_cost_usd')

# Postear como comentario en el PR
gh pr comment $PR_NUMBER --body "## Claude Code Review\\n$ISSUES\\n\\n*Cost: \$$COST*"

# Fallar el CI si hay issues criticos
if echo "$ISSUES" | grep -q "CRITICAL"; then
  echo "::error::Critical issues found by Claude Code"
  exit 1
fi</pre>`}
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Un equipo de fintech usa headless mode en su pipeline de CI para validar que cada PR cumple con regulaciones SOC2. El script ejecuta Claude Code con un prompt que lista los 15 controles SOC2 relevantes, analiza los cambios del PR contra cada control, y genera un reporte de compliance. Si algun control falla, el PR se bloquea automaticamente. Costo promedio: <strong class="text-agent-text">$0.12 por PR</strong>. Tiempo: 45 segundos. Antes, un auditor humano tardaba 2 horas.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 3: Long-Running Agent Harnesses                -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Harnesses para Agentes de Larga Duracion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Hay tareas que toman horas, no minutos: migrar una codebase de JavaScript a TypeScript, refactorizar 50 archivos para un nuevo patron, o implementar una feature compleja con 20+ archivos. Estas tareas <strong class="text-agent-highlight">exceden el context window</strong> de cualquier modelo. El agente pierde coherencia, repite errores, y "olvida" decisiones que tomo hace 2000 lineas.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      La solucion no es un modelo con mas tokens. Es un <strong class="text-agent-highlight">harness estructurado</strong> que divide la tarea en sesiones manejables, mantiene estado entre sesiones, y asegura que cada sesion empiece con contexto fresco y relevante.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Datos de Anthropic</p>
      <p class="text-sm text-agent-muted">Segun el blog "Effective Harnesses for Long-Running Agents", el patron de <strong class="text-agent-text">memory + context editing</strong> (progress files + /clear entre sesiones) mejora el rendimiento en un <strong class="text-agent-text">39%</strong> comparado con el approach naive de "dejar al agente correr hasta que termine". La razon: el agente con contexto fresco toma mejores decisiones que uno con 100K tokens de contexto acumulado.</p>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">El patron Initializer + Executor</h3>
    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128205;</span>
          <h4 class="text-agent-text font-bold">Fase 1: Initializer Agent</h4>
        </div>
        <p class="text-sm text-agent-muted mb-3">Un agente que lee el repositorio completo, entiende la tarea, y genera un <strong class="text-agent-text">plan detallado</strong>. Este plan se guarda en un archivo (plan.md) que persiste entre sesiones.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># El initializer lee el repo y genera el plan
claude -p "Lee todo el proyecto. La tarea es migrar
de Express.js a Fastify. Genera un plan detallado en
plan.md con:
1. Lista ordenada de archivos a migrar
2. Dependencias entre archivos (cual migrar primero)
3. Tests que necesitan actualizarse
4. Riesgos identificados por archivo
NO implementes nada, solo planifica." \\
  --max-turns 15 \\
  --allowedTools "Read,Grep,Glob,Write"</pre>`}
        </div>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#9997;&#65039;</span>
          <h4 class="text-agent-text font-bold">Fase 2: Executor Agent (N sesiones)</h4>
        </div>
        <p class="text-sm text-agent-muted mb-3">Un agente que lee el plan y el archivo de progreso, implementa <strong class="text-agent-text">UN feature o archivo por sesion</strong>, y actualiza el progreso. Despues de cada sesion: <code class="text-agent-accent bg-agent-darker px-1 rounded">/clear</code>, contexto fresco.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Cada sesion del executor
claude -p "Lee plan.md y progress.md.
Implementa el SIGUIENTE item pendiente del plan.
Despues de implementar:
1. Ejecuta los tests relevantes
2. Actualiza progress.md marcando el item como DONE
3. Anota cualquier blocker o decision tomada
NO avances al siguiente item. Solo UNO por sesion." \\
  --max-turns 20 \\
  --allowedTools "Read,Write,Grep,Glob,Bash"</pre>`}
        </div>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128196;</span>
          <h4 class="text-agent-text font-bold">Progress File: El Cerebro Externo</h4>
        </div>
        <p class="text-sm text-agent-muted mb-3">El archivo de progreso es el mecanismo de memoria entre sesiones. Cada sesion lo lee al inicio y lo actualiza al final. Contiene: que esta hecho, que falta, que decisiones se tomaron, y que problemas se encontraron.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># progress.md - actualizado por el executor
## Estado: 7/15 archivos migrados

### Completados
- [x] src/server.ts - migrado a Fastify ✓
- [x] src/routes/users.ts - migrado, tests pasan ✓
- [x] src/routes/auth.ts - migrado ✓
- [x] src/middleware/cors.ts - reemplazado por @fastify/cors ✓
- [x] src/middleware/helmet.ts - reemplazado por @fastify/helmet ✓
- [x] src/routes/products.ts - migrado ✓
- [x] src/routes/orders.ts - migrado ✓

### Siguiente
- [ ] src/middleware/rateLimit.ts

### Decisiones tomadas
- Usamos @fastify/rate-limit en vez de express-rate-limit
- Los decorators de Fastify reemplazan el middleware chain

### Blockers
- tests/integration/auth.test.ts falla por cookie handling
  diferente en Fastify (necesita investigacion)</pre>`}
        </div>
      </div>
    </div>

    <h3 class="text-xl font-bold text-agent-text mb-3">La regla de oro: UN feature por sesion</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La tentacion es dejar al agente hacer todo en una sola sesion. Resiste esa tentacion. Despues de miles de tokens de contexto acumulado, el agente sufre <strong class="text-agent-highlight">context rot</strong>: pierde coherencia, repite errores ya corregidos, y "olvida" convenciones que estaba siguiendo. La regla es: <strong class="text-agent-text">una sesion = un archivo/feature, despues /clear y empezar fresco</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-danger font-bold text-sm mb-2">Approach naive (sin harness)</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Un solo prompt: "migra todo el proyecto"</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Contexto crece hasta 200K+ tokens</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Calidad se degrada despues del archivo 5</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Si falla en el archivo 12, pierdes TODO</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Costo impredecible (puede ser $50+)</li>
        </ul>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-success font-bold text-sm mb-2">Harness estructurado (+39% mejora)</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Plan detallado generado por initializer</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Contexto fresco en cada sesion (/clear)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Calidad consistente archivo tras archivo</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Si falla en el 12, retomas desde ahi</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Costo predecible ($2-5 por sesion)</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">No usar <code class="text-agent-accent bg-agent-darker px-1 rounded">/clear</code> entre sesiones del executor. Cada sesion arrastra el contexto de las anteriores. Despues de 5 sesiones, tienes 100K+ tokens de contexto stale que confunden al agente y cuestan dinero. El <code class="text-agent-accent bg-agent-darker px-1 rounded">/clear</code> entre sesiones ahorra <strong class="text-agent-text">50-70% de tokens</strong> y mejora la calidad del output.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 4: Gestion de Costos                           -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Gestion de Costos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes IA cuestan dinero real. Cada token de input y output tiene un precio. Un equipo de 15 developers usando agentes agresivamente puede generar facturas de $500-2000/mes facilmente. La gestion de costos no es "optimizacion prematura", es <strong class="text-agent-highlight">planificacion financiera basica</strong>.
    </p>

    <h3 class="text-xl font-bold text-agent-text mb-3">Las 5 estrategias de optimizacion</h3>

    <div class="space-y-4 mb-6">
      <!-- Strategy 1: opusplan -->
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-agent-text font-bold">1. opusplan: Opus planifica, Sonnet ejecuta</h4>
          <span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded">~40% ahorro</span>
        </div>
        <p class="text-sm text-agent-muted mb-3">Usa el modelo mas potente (Opus) para las decisiones que importan: arquitectura, planning, analisis de requirements. Usa un modelo mas barato (Sonnet) para la ejecucion: escribir codigo, correr tests, hacer cambios mecanicos. La calidad se mantiene porque las decisiones criticas se toman con el mejor modelo.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Fase de planning con Opus (decisiones criticas)
claude -p "Analiza el codebase y diseña la arquitectura
para el nuevo sistema de pagos. Genera plan.md" \\
  --model claude-opus-4

# Fase de ejecucion con Sonnet (implementacion)
claude -p "Lee plan.md e implementa el paso 1" \\
  --model claude-sonnet-4</pre>`}
        </div>
      </div>

      <!-- Strategy 2: MAX_THINKING_TOKENS -->
      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-agent-text font-bold">2. MAX_THINKING_TOKENS: Limitar el razonamiento</h4>
          <span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded">Variable</span>
        </div>
        <p class="text-sm text-agent-muted mb-3">Extended thinking es poderoso pero costoso. Para tareas simples (formatting, renaming, typos), el agente no necesita "pensar" mucho. Limitar los thinking tokens reduce el costo sin afectar la calidad en tareas sencillas. Para tareas complejas (arquitectura, debugging), dejar los thinking tokens altos.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Tarea simple: thinking minimo
MAX_THINKING_TOKENS=1024 claude -p "Renombra userId a user_id en todo el proyecto"

# Tarea compleja: thinking completo (default)
claude -p "Debuggea por que el test de integracion falla intermitentemente"</pre>`}
        </div>
      </div>

      <!-- Strategy 3: Batch API -->
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-agent-text font-bold">3. Batch API: 50% de descuento</h4>
          <span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded">50% ahorro</span>
        </div>
        <p class="text-sm text-agent-muted mb-3">Para workloads que no necesitan respuesta inmediata (nightly builds, analisis batch, generacion de documentacion, test generation), la Batch API ofrece un 50% de descuento. Encolas los prompts, Anthropic los procesa cuando tiene capacidad, y te entrega los resultados despues.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># Nightly batch: generar tests para todos los archivos sin coverage
# Crear archivo de batch con multiples requests
cat > batch_requests.jsonl << 'EOF'
{"custom_id": "test-auth", "method": "POST", "url": "/v1/messages", "body": {"model": "claude-sonnet-4-20250514", "max_tokens": 4096, "messages": [{"role": "user", "content": "Genera tests para src/auth/login.ts"}]}}
{"custom_id": "test-users", "method": "POST", "url": "/v1/messages", "body": {"model": "claude-sonnet-4-20250514", "max_tokens": 4096, "messages": [{"role": "user", "content": "Genera tests para src/routes/users.ts"}]}}
EOF

# Enviar batch (resultados en ~1 hora, 50% mas barato)
curl https://api.anthropic.com/v1/messages/batches \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -d @batch_requests.jsonl</pre>`}
        </div>
      </div>

      <!-- Strategy 4: /clear -->
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-agent-text font-bold">4. /clear entre tareas: MAYOR impacto</h4>
          <span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded">50-70% ahorro</span>
        </div>
        <p class="text-sm text-agent-muted mb-3">Cada mensaje que envias a Claude Code acumula contexto. Despues de 30 minutos de trabajo, puedes tener 50K+ tokens de contexto que se envian en CADA request. Si cambias de tarea (de implementar feature A a debuggear bug B), ese contexto es <strong class="text-agent-text">completamente inutil pero sigues pagando por el</strong>. Un <code class="text-agent-accent bg-agent-darker px-1 rounded">/clear</code> entre tareas independientes es la optimizacion de mayor impacto.</p>
      </div>

      <!-- Strategy 5: Token monitoring -->
      <div class="card bg-agent-dark border-l-4 border-l-agent-info">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-agent-text font-bold">5. Token Monitoring: Medir para mejorar</h4>
          <span class="text-xs bg-agent-info/20 text-agent-info px-2 py-0.5 rounded">Visibilidad</span>
        </div>
        <p class="text-sm text-agent-muted">Trackea tokens consumidos por sesion, por proyecto, y por developer. Sin datos no puedes optimizar. Los hooks de Claude Code pueden enviar eventos de uso a tu sistema de metricas. Identifica patrones: hay developers que gastan 5x mas que otros? Hay tareas que consistentemente exceden el budget? Los datos revelan donde optimizar.</p>
      </div>
    </div>

    <!-- Cost strategy table -->
    <h3 class="text-xl font-bold text-agent-text mb-3">Tabla de estrategias de costo</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-3 text-agent-accent font-bold">Estrategia</th>
            <th class="text-center py-3 px-3 text-agent-text font-bold">Ahorro</th>
            <th class="text-center py-3 px-3 text-agent-text font-bold">Complejidad</th>
            <th class="text-left py-3 px-3 text-agent-text font-bold">Cuando usarla</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-highlight">/clear entre tareas</td>
            <td class="text-center py-3 px-3"><span class="text-agent-success font-bold">50-70%</span></td>
            <td class="text-center py-3 px-3">Baja</td>
            <td class="py-3 px-3">Siempre, entre tareas independientes</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-highlight">Batch API</td>
            <td class="text-center py-3 px-3"><span class="text-agent-success font-bold">50%</span></td>
            <td class="text-center py-3 px-3">Media</td>
            <td class="py-3 px-3">Nightly builds, analisis no interactivo</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-highlight">opusplan (model routing)</td>
            <td class="text-center py-3 px-3"><span class="text-agent-success font-bold">~40%</span></td>
            <td class="text-center py-3 px-3">Baja</td>
            <td class="py-3 px-3">Tareas con fase de planning separada</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-highlight">MAX_THINKING_TOKENS</td>
            <td class="text-center py-3 px-3"><span class="text-agent-warning font-bold">10-30%</span></td>
            <td class="text-center py-3 px-3">Baja</td>
            <td class="py-3 px-3">Tareas simples y mecanicas</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-3 text-agent-highlight">Token monitoring</td>
            <td class="text-center py-3 px-3"><span class="text-agent-info font-bold">Indirecto</span></td>
            <td class="text-center py-3 px-3">Media</td>
            <td class="py-3 px-3">Siempre, para identificar oportunidades</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La optimizacion de costos NO es usar el modelo mas barato para todo. Es usar <strong class="text-agent-text">el modelo correcto para cada tarea</strong>. Opus para arquitectura ($15/1M output). Sonnet para implementacion ($15/1M output, pero mucho mas rapido y eficiente en tokens). Haiku para triaje y tareas simples ($1.25/1M output). Un equipo que hace model routing inteligente gasta 40% menos que uno que usa Opus para todo, con la misma calidad en resultados finales.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 5: Observabilidad para Agentes                 -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Observabilidad para Agentes en CI/CD</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Cuando tu agente corre en tu laptop, lo ves trabajar en tiempo real. Cuando corre en un GitHub Action a las 3 AM, necesitas <strong class="text-agent-highlight">instrumentacion</strong> para saber que hizo, cuanto costo, y si funciono bien. La observabilidad para agentes en CI tiene particularidades que no existen en observabilidad de aplicaciones tradicionales.
    </p>

    <h3 class="text-xl font-bold text-agent-text mb-3">Tres pilares adaptados a CI</h3>
    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128220;</span>
          <h4 class="text-agent-text font-bold">Logs: Headless JSON como structured logs</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">El output JSON del headless mode ES tu structured log. Cada ejecucion produce un JSON con tool calls, tokens, y resultado. Envia ese JSON directamente a tu sistema de logging (Datadog, CloudWatch, ELK) para buscar y correlacionar.</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Que herramientas uso y con que parametros</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Cuantos tokens consumio (input + output)</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Cuantos turns necesito para completar la tarea</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Si alcanzo max-turns o max-budget</li>
        </ul>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128200;</span>
          <h4 class="text-agent-text font-bold">Metricas: Lo que medir cada semana</h4>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Tokens/semana</p>
            <p class="text-sm font-bold text-agent-accent">~420K</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Costo/semana</p>
            <p class="text-sm font-bold text-agent-warning">$85</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">PRs revisados</p>
            <p class="text-sm font-bold text-agent-accent">147</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Bugs detectados</p>
            <p class="text-sm font-bold text-agent-success">23</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Tasa de exito</p>
            <p class="text-sm font-bold text-agent-success">96.4%</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Costo/PR</p>
            <p class="text-sm font-bold text-agent-accent">$0.58</p>
          </div>
        </div>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128276;</span>
          <h4 class="text-agent-text font-bold">Alertas: Hooks de Claude Code para notificaciones</h4>
        </div>
        <p class="text-sm text-agent-muted mb-2">Los hooks de Claude Code pueden enviar eventos a sistemas externos. Configura un Notification hook que dispare alertas cuando un agente en CI alcanza limites o falla.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap"># .claude/settings.json - hook de notificacion
{
  "hooks": {
    "Notification": [{
      "matcher": {},
      "hooks": [{
        "type": "command",
        "command": "curl -X POST $SLACK_WEBHOOK -d '{\"text\": \"Claude Code CI: $CLAUDE_NOTIFICATION\"}'",
        "timeout": 5000
      }]
    }]
  }
}</pre>`}
        </div>
      </div>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Un equipo de e-commerce implemento un dashboard semanal que muestra: costo total de agentes por proyecto, top 5 PRs mas caros (para investigar si hay problemas), tasa de "reviews aceptados" por developers (que tan util es el review del agente), y tendencia de costos mes a mes. En 3 meses, identificaron que el 40% del gasto venia de PRs de documentacion que no necesitaban review de IA. Agregaron path filters y el costo bajo un 35%.</p>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 6: Rainbow Deployments                         -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Rainbow Deployments</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Imagina este escenario: tu agente esta en medio de un refactor que toma 45 minutos (harness con 8 sesiones). Despues de la sesion 4, alguien despliega una nueva version del codebase. La sesion 5 del agente lee archivos que ya no existen o que cambiaron de lugar. El agente se confunde, genera codigo incorrecto, y corrompe 3 archivos.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Los <strong class="text-agent-highlight">Rainbow Deployments</strong> son una estrategia de despliegue disenada para agentes de larga duracion. Es similar a blue-green deployment pero con multiples "colores" (versiones) coexistiendo simultaneamente.
    </p>

    <h3 class="text-xl font-bold text-agent-text mb-3">Como funciona</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Paso 1</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Asignar color a la version</p>
          <p class="text-xs text-agent-muted">Cada deploy se etiqueta con un color (o hash). Los agentes que ya estan corriendo mantienen su color asignado.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Paso 2</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Nuevos agentes usan nueva version</p>
          <p class="text-xs text-agent-muted">Cualquier agente que inicia DESPUES del deploy usa la nueva version. Los que ya estan corriendo siguen con la version anterior.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Paso 3</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Drain: esperar a que los viejos terminen</p>
          <p class="text-xs text-agent-muted">La version anterior se mantiene activa hasta que todos los agentes en esa version completen su trabajo. Sin interrupciones, sin corrupcion.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border/50">
        <span class="text-agent-accent font-bold text-sm shrink-0">Paso 4</span>
        <div>
          <p class="text-sm text-agent-text font-bold">Cleanup</p>
          <p class="text-xs text-agent-muted">Cuando todos los agentes en la version vieja terminan, se limpia. Solo queda la version nueva.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El mismo principio aplica a <strong class="text-agent-text">MCP servers</strong>. Si tu agente depende de un MCP server (por ejemplo, para acceder a una base de datos), no reinicies ese MCP server mientras haya agentes conectados. Un reinicio abrupto del MCP server causa que los tool calls en vuelo fallen, y el agente pierde el resultado de minutos de trabajo. <strong class="text-agent-text">Drena las conexiones antes de reiniciar.</strong></p>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-2">Cuando necesitas rainbow deployments:</p>
      <ul class="space-y-1 text-xs text-agent-muted">
        <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Agentes que corren harnesses de 30+ minutos</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Multiples agentes paralelos usando Agent Teams</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>MCP servers con estado (caches, conexiones de DB)</li>
        <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Pipelines de CI donde el agente interactua con el codebase durante minutos</li>
      </ul>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- THEORY SECTION 7: Cuando NO Usar Agentes                      -->
  <!-- ============================================================= -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Cuando NO Usar Agentes</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Despues de 11 modulos aprendiendo sobre agentes, es tentador verlos como solucion a todo. Pero la senal de un profesional maduro no es saber USAR agentes, es saber <strong class="text-agent-highlight">cuando NO usarlos</strong>. El principio es simple: <strong class="text-agent-text">usa la solucion mas simple que funcione</strong>.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128683;</span>
          <h4 class="text-agent-text font-bold">CRUD simple y bien definido</h4>
        </div>
        <p class="text-sm text-agent-muted">Si tu tarea es "crear un endpoint que guarde un usuario en la base de datos", no necesitas un agente. Un template, un scaffold, o 20 lineas de codigo son mas rapidos, baratos, y predecibles. Los agentes brillan en tareas con <strong class="text-agent-text">ambiguedad</strong>, no en tareas mecanicas.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128683;</span>
          <h4 class="text-agent-text font-bold">Transformaciones deterministas</h4>
        </div>
        <p class="text-sm text-agent-muted">CSV a JSON con reglas fijas. XML a YAML con schema definido. Renombrar archivos con patron regex. Estas tareas tienen una solucion DETERMINISTA que siempre produce el mismo resultado. Un script de 10 lineas es infinitamente mas confiable que un agente que "intenta" hacer la transformacion y puede equivocarse.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128683;</span>
          <h4 class="text-agent-text font-bold">Latencia critica (tiempo real)</h4>
        </div>
        <p class="text-sm text-agent-muted">Si tu SLA es "respuesta en menos de 100ms", un agente con tool calls que toma 2-10 segundos no es viable. APIs de trading, real-time multiplayer, health monitoring systems. La latencia de LLM + tool calls hace que los agentes sean inadecuados para sistemas de tiempo real estricto.</p>
      </div>

      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">&#128683;</span>
          <h4 class="text-agent-text font-bold">Seguridad con zero tolerance</h4>
        </div>
        <p class="text-sm text-agent-muted">Sistemas donde un error del agente puede causar dano irreversible Y no hay forma de verificar el resultado: dispensacion de medicamentos, control de infraestructura critica, decisiones legales vinculantes. En estos casos, el human-in-the-loop no es suficiente: <strong class="text-agent-text">el humano debe ser el actor principal</strong>, no el revisor de un agente.</p>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">El principio del presupuesto de complejidad</p>
      <p class="text-sm text-agent-muted">Cada sistema tiene un "presupuesto de complejidad". Un agente consume una porcion significativa de ese presupuesto: no-determinismo, costos variables, latencia, necesidad de observabilidad, riesgo de loops, necesidad de guardrails. Si la tarea se puede resolver con un script, una regla, o un template, <strong class="text-agent-text">estas gastando presupuesto de complejidad innecesariamente</strong>. Reserva los agentes para los problemas donde realmente aportan valor: tareas ambiguas, con contexto variable, que requieren razonamiento.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-success font-bold text-sm mb-2">Usa un agente cuando...</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>La tarea requiere interpretar lenguaje natural ambiguo</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>El contexto cambia en cada ejecucion (PRs diferentes)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>Necesitas razonamiento multi-paso (analizar + decidir)</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>El costo del error es bajo o hay review humano</li>
          <li class="flex items-start gap-2"><span class="text-agent-success shrink-0">&#10003;</span>La tarea manual toma horas y es repetitiva</li>
        </ul>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-danger font-bold text-sm mb-2">Usa un script cuando...</h4>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>Las reglas son fijas y bien definidas</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>El mismo input siempre debe dar el mismo output</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>La latencia es critica (&lt;100ms)</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>El costo del error es catastrofico e irreversible</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger shrink-0">&#10007;</span>La tarea se resuelve en 20 lineas de codigo</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ============================================================= -->
  <!-- BRANCHING SCENARIO                                             -->
  <!-- ============================================================= -->
  <section class="mb-10">
    {#if !showScenario}
      <div class="card bg-agent-dark border-agent-accent/30 text-center">
        <span class="text-4xl block mb-3">&#128161;</span>
        <h3 class="text-lg font-bold text-agent-accent mb-2">Escenario: Claude Code GitHub Action fuera de control</h3>
        <p class="text-agent-muted mb-4 text-sm">Tu equipo implemento Claude Code GitHub Action pero los costos se dispararon, la calidad es inconsistente, y un bug de seguridad paso desapercibido. Diagnostica, corrige, y optimiza.</p>
        <button onclick={() => showScenario = true} class="btn-primary">
          Iniciar escenario
        </button>
      </div>
    {:else}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Escenario: Claude Code GitHub Action en Produccion"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- ============================================================= -->
  <!-- QUIZ                                                           -->
  <!-- ============================================================= -->
  <section class="mb-10">
    {#if !showQuiz}
      <div class="card bg-agent-dark border-agent-accent/30 text-center">
        <span class="text-4xl block mb-3">&#128218;</span>
        <h3 class="text-lg font-bold text-agent-accent mb-2">Quiz: Agentes en Produccion</h3>
        <p class="text-agent-muted mb-4 text-sm">5 preguntas sobre GitHub Actions, headless mode, harnesses, costos, y cuando NO usar agentes.</p>
        <button onclick={() => showQuiz = true} class="btn-primary">
          Iniciar quiz
        </button>
      </div>
    {:else}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- ============================================================= -->
  <!-- COMPLETION MESSAGE                                             -->
  <!-- ============================================================= -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#127981;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">
        Ahora sabes como llevar agentes a produccion: GitHub Actions para CI, headless mode para automatizacion, harnesses para tareas largas, y gestion de costos para que tu factura sea predecible. Sabes cuando un agente aporta valor real y cuando un script es mejor.
      </p>
    </div>
  {/if}

  <!-- Sources -->
  <SourcesSection sources={mod.sources} />

  <!-- Nav -->
  <ModuleNav currentModule={MODULE_ID} />
</div>

<!-- Vocabulary Float -->
<VocabularyFloat moduleId={MODULE_ID} />

<!-- Badge Notification -->
{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
