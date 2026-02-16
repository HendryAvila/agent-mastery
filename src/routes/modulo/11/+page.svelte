<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import Timer from '$lib/components/Timer.svelte';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';

  const MODULE_ID = 11;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);

  let showScenario = $state(false);
  let timedOut = $state(false);

  courseStore.startModule(MODULE_ID);

  function handleTimeUp() {
    timedOut = true;
  }

  function handleScenarioComplete(score: number, maxScore: number) {
    let finalScore = score;
    if (timedOut) {
      finalScore = Math.max(0, score - 3);
    }
    courseStore.completeModule(MODULE_ID, finalScore, maxScore);
    completed = true;
  }

  // BranchingScenario: Incidente en Produccion
  const scenarioNodes: Record<string, any> = {
    start: {
      id: 'start',
      narrative: 'Son las 3 AM. Tu telefono suena con una alerta critica.\n\nTu sistema multi-agente que procesa tickets de soporte al cliente esta fallando. El dashboard muestra:\n- Costos de tokens: +500% vs el promedio diario\n- Latencia de respuestas: 10x lo normal (de 2s a 20s)\n- 15% de clientes reciben respuestas incoherentes\n- El sistema procesa 500 tickets/hora normalmente\n\nLos costos ya superaron el budget diario en 3 horas.\n\n¿Que investigas PRIMERO?',
      choices: [
        { text: 'Los traces del agente para ver que esta haciendo exactamente en cada request', nextId: 'traces', points: 3, feedback: 'Excelente instinto. Los traces te dan la pelicula completa de cada request: que tools llamo, cuantas iteraciones del loop hizo, donde se atasco. Con 500% de costo, algo esta iterando de mas.' },
        { text: 'Los logs del servidor buscando errores y excepciones', nextId: 'logs', points: 2, feedback: 'Razonable pero no optimo. Los logs te dicen si algo FALLO pero no te explican POR QUE el agente esta gastando 5x. Necesitas traces para ver el comportamiento del agente, no solo errores de infraestructura.' },
        { text: 'El dashboard de costos para ver que modelo esta consumiendo mas tokens', nextId: 'costs', points: 1, feedback: 'Es informacion util pero superficial. Saber que "el modelo X gasta mucho" no te dice POR QUE. Necesitas ir mas profundo: que HACE el agente con esos tokens.' }
      ]
    },
    traces: {
      id: 'traces',
      narrative: 'Abres el sistema de traces (OpenTelemetry/LangSmith) y ves algo alarmante:\n\nEl agente de clasificacion de tickets esta entrando en un LOOP. Para ciertos tickets con texto ambiguo, el agente:\n1. Clasifica el ticket como "problema tecnico"\n2. El agente de solucion dice "necesito mas contexto"\n3. Vuelve al clasificador, que re-clasifica como "facturacion"\n4. El agente de facturacion dice "esto es tecnico, no es mio"\n5. GOTO paso 1\n\nEste loop se repite 20-50 veces antes de timeout, generando enormes costos.\n\n¿Como resuelves el loop?',
      choices: [
        { text: 'Implementar un circuit breaker: maximo 3 reclasificaciones por ticket. Si se excede, escalar a humano.', nextId: 'circuit_breaker', points: 3, feedback: 'Perfecto. El circuit breaker es el patron correcto aqui: detectar el loop (max iterations), cortar la ejecucion, y tener un fallback (escalacion humana). Simple, efectivo, y robusto.' },
        { text: 'Mejorar el prompt del clasificador para que sea mas preciso con tickets ambiguos', nextId: 'prompt_fix', points: 1, feedback: 'Puede ayudar a largo plazo, pero no resuelve el incidente AHORA. Mientras ajustas prompts, los loops siguen corriendo y quemando dinero. Necesitas una solucion inmediata.' },
        { text: 'Agregar un timeout global de 30 segundos por ticket', nextId: 'timeout', points: 2, feedback: 'Reduce el dano pero no resuelve el problema de raiz. Con timeout de 30s, el loop sigue corriendo y gastando tokens, solo que por menos tiempo. Un circuit breaker es mas quirurgico.' }
      ]
    },
    logs: {
      id: 'logs',
      narrative: 'Los logs del servidor muestran muchos timeouts y retries, pero no errores de aplicacion per se. El sistema "funciona" pero extremadamente lento.\n\nTe das cuenta de que necesitas ver el COMPORTAMIENTO del agente, no solo errores de infraestructura. Abres los traces y descubres el problema: un loop infinito entre el clasificador y los agentes de solucion.\n\nPara ciertos tickets ambiguos, el clasificador y los workers se pasan el ticket de vuelta en un ping-pong interminable.\n\n¿Como lo resuelves?',
      choices: [
        { text: 'Agregar un circuit breaker con maximo 3 iteraciones de reclasificacion', nextId: 'circuit_breaker', points: 3, feedback: 'El circuit breaker es la solucion correcta. Maximo N intentos, despues un fallback predefinido (escalar a humano). Corta el loop sin necesidad de arreglar la ambigüedad del ticket.' },
        { text: 'Implementar una cola de "tickets problematicos" que se revisan manualmente', nextId: 'manual_queue', points: 2, feedback: 'Funciona como solucion temporal, pero sin un circuit breaker, el loop sigue corriendo hasta timeout. Necesitas CORTAR el loop primero, DESPUES enviar a la cola manual.' }
      ]
    },
    costs: {
      id: 'costs',
      narrative: 'El dashboard muestra que el 80% del gasto proviene del modelo del agente clasificador. Esta haciendo 10x mas llamadas de lo normal.\n\nRevisas los traces y descubres un loop: tickets ambiguos rebotan entre el clasificador y los agentes de solucion indefinidamente.\n\n¿Como resuelves esto?',
      choices: [
        { text: 'Implementar un circuit breaker que corte el loop despues de 3 reclasificaciones', nextId: 'circuit_breaker', points: 3, feedback: 'Correcto. El circuit breaker es la solucion clasica para loops en sistemas distribuidos. Simple, efectivo, y predecible.' },
        { text: 'Cambiar a un modelo mas barato para el clasificador', nextId: 'cheap_model', points: 1, feedback: 'Reduce el costo por iteracion pero el loop sigue. Si un ticket genera 50 iteraciones, un modelo barato sigue siendo 50x mas caro de lo necesario. Arregla el loop, no el modelo.' }
      ]
    },
    circuit_breaker: {
      id: 'circuit_breaker',
      narrative: 'Implementas el circuit breaker: maximo 3 reclasificaciones por ticket. Si se excede, el ticket se marca como "ambiguo" y se escala a un humano.\n\nLos loops se detienen inmediatamente. Los costos bajan al nivel normal en 15 minutos.\n\nAhora necesitas el post-mortem. ¿Que medida preventiva implementas para que esto NO vuelva a pasar?',
      choices: [
        { text: 'Alertas automaticas cuando los costos superan el 150% del promedio + dashboards de loop detection + token budgets por ticket', nextId: 'observability', points: 3, feedback: 'Completo. Alertas tempranas (150%, no 500%) + visibilidad (dashboards) + limites duros (budgets) = las tres capas de proteccion contra cost overrun.' },
        { text: 'Solo agregar el budget de tokens por ticket, eso es suficiente', nextId: 'budget_only', points: 1, feedback: 'El budget corta el gasto pero no te AVISA temprano. Sin alertas, no te enteras hasta que el budget se agota y los tickets empiezan a fallar. Necesitas deteccion temprana.' },
        { text: 'Mejorar los prompts de todos los agentes para evitar ambigüedad', nextId: 'prompt_improvement', points: 2, feedback: 'Buena mejora a largo plazo pero no es una medida PREVENTIVA. Los prompts mejorados reducen la probabilidad del loop pero no lo eliminan. Necesitas alertas y budgets como red de seguridad.' }
      ]
    },
    prompt_fix: {
      id: 'prompt_fix',
      narrative: 'Empiezas a iterar sobre el prompt del clasificador. Mientras tanto, los loops siguen corriendo.\n\nEn los 45 minutos que tardas en probar y deployar el nuevo prompt, el sistema gasta $2,400 adicionales en tokens.\n\nEl nuevo prompt mejora la clasificacion un 20%, pero tickets ambiguos SIGUEN generando loops.\n\n¿Que implementas ahora?',
      choices: [
        { text: 'Un circuit breaker con maximo 3 reclasificaciones + alerta automatica cuando se activa', nextId: 'observability', points: 3, feedback: 'Ahora si. El circuit breaker resuelve el problema de raiz (loops) y la alerta te avisa cuando hay tickets ambiguos que necesitan atencion humana.' },
        { text: 'Seguir iterando el prompt hasta que la clasificacion sea 100% precisa', nextId: 'outcome_poor', points: 0, feedback: 'La clasificacion nunca sera 100% con lenguaje natural. Los tickets ambiguos siempre existiran. Necesitas un mecanismo de fallback, no prompts perfectos.' }
      ]
    },
    timeout: {
      id: 'timeout',
      narrative: 'El timeout de 30 segundos ayuda: los loops ya no duran minutos. Pero en 30 segundos, el loop alcanza 8-12 iteraciones. Los costos bajan un 60% pero siguen elevados.\n\nAdemas, los clientes con tickets ambiguos reciben respuestas de timeout en vez de ayuda real.\n\n¿Que ajustas?',
      choices: [
        { text: 'Reemplazar el timeout por un circuit breaker: maximo 3 reclasificaciones, despues escalar a humano con contexto del intento', nextId: 'observability', points: 3, feedback: 'Mucho mejor. El circuit breaker es mas quirurgico que un timeout: corta el LOOP especificamente, no todo el procesamiento. Y la escalacion humana asegura que el cliente reciba ayuda.' },
        { text: 'Reducir el timeout a 10 segundos', nextId: 'outcome_poor', points: 1, feedback: 'Con 10 segundos, muchos tickets LEGITIMOS no se procesan a tiempo. Estas penalizando a todos los clientes por un problema de loop. El circuit breaker es mas preciso.' }
      ]
    },
    cheap_model: {
      id: 'cheap_model',
      narrative: 'Cambias al modelo barato. Los costos por iteracion bajan un 70%, pero el modelo barato es PEOR clasificando, asi que los loops se vuelven mas frecuentes.\n\nTerminas gastando lo mismo porque hay mas loops aunque cada iteracion es mas barata.\n\n¿Que haces ahora?',
      choices: [
        { text: 'Implementar circuit breaker + volver al modelo original que clasifica mejor', nextId: 'circuit_breaker', points: 3, feedback: 'Correcto. Mejor modelo = menos loops. Circuit breaker = los loops que queden se cortan rapido. El modelo barato EMPEORO el problema.' },
        { text: 'Buscar un modelo intermedio en precio y calidad', nextId: 'outcome_poor', points: 1, feedback: 'Optimizar el modelo no resuelve el problema de diseño. El LOOP es el bug, no el modelo. Arregla la arquitectura primero, despues optimiza costos.' }
      ]
    },
    manual_queue: {
      id: 'manual_queue',
      narrative: 'Creas una cola manual para tickets problematicos. Pero el agente sigue iterando en loop ANTES de enviar a la cola. Solo cuando alcanza el timeout se redirige.\n\n¿Que falta en tu solucion?',
      choices: [
        { text: 'Un circuit breaker que corte el loop ANTES del timeout y envie directamente a la cola manual', nextId: 'observability', points: 3, feedback: 'Exacto. El circuit breaker detecta el loop temprano (despues de 3 intentos, no 50) y redirige inmediatamente a la cola. Ahorro de tokens + mejor experiencia.' },
        { text: 'Reducir el timeout para que llegue mas rapido a la cola', nextId: 'outcome_decent', points: 1, feedback: 'Funciona pero es un hack. Un timeout bajo afecta todos los tickets, no solo los que estan en loop. El circuit breaker es especifico al problema.' }
      ]
    },
    observability: {
      id: 'observability',
      narrative: 'Implementas el paquete completo de observabilidad:\n\n1. Circuit breaker: max 3 reclasificaciones, despues escalacion humana\n2. Alertas: notificacion cuando costos superan 150% del promedio\n3. Dashboard: visualizacion en tiempo real de loops, latencias, y costos\n4. Token budget: maximo de tokens por ticket individual\n\nUltima pregunta: ¿como comunicas este incidente al equipo?',
      choices: [
        { text: 'Post-mortem formal: timeline, root cause (loop por tickets ambiguos sin circuit breaker), impacto ($X en costos), acciones tomadas, y medidas preventivas implementadas', nextId: 'outcome_excellent', points: 3, feedback: 'Perfecto. Un post-mortem blameless documenta QUE paso, POR QUE, y COMO se previene en el futuro. Es la practica de oro en ingenieria de confiabilidad.' },
        { text: 'Un mensaje en Slack diciendo "ya se arreglo el problema de costos"', nextId: 'outcome_good', points: 1, feedback: 'Comunicar que se resolvio es lo minimo. Pero sin un post-mortem formal, las lecciones se pierden y el mismo patron podria repetirse en otro componente del sistema.' }
      ]
    },
    prompt_improvement: {
      id: 'prompt_improvement',
      narrative: 'Mejoras los prompts y la calidad de clasificacion sube un 25%. Pero siguen existiendo tickets ambiguos que generan loops.\n\nSin alertas tempranas, el proximo incidente tardara en detectarse tanto como este.\n\n¿Que agregas?',
      choices: [
        { text: 'Alertas automaticas a 150% del promedio + dashboards de observabilidad + post-mortem formal', nextId: 'outcome_good', points: 3, feedback: 'Ahora tienes el paquete completo: prevencion (circuit breaker) + mejora (prompts) + deteccion (alertas) + visibilidad (dashboard) + aprendizaje (post-mortem).' },
        { text: 'Confiar en que los prompts mejorados previenen el problema', nextId: 'outcome_poor', points: 0, feedback: 'Los prompts NUNCA son suficientes como unica defensa. La ambigüedad en lenguaje natural es inevitable. Necesitas defensas programaticas.' }
      ]
    },
    budget_only: {
      id: 'budget_only',
      narrative: 'Implementas un budget de tokens por ticket. Los loops se cortan cuando agotan el budget.\n\nPero sin alertas, el equipo no se entera de que hay tickets fallando por budget agotado hasta que los clientes se quejan 3 horas despues.\n\n¿Que agregas?',
      choices: [
        { text: 'Alertas tempranas (150% del promedio) + dashboard de tickets cortados por budget', nextId: 'outcome_good', points: 3, feedback: 'Bien. Budget + alertas + dashboard = las tres capas minimas. El budget corta el dano, la alerta te avisa, el dashboard te da visibilidad.' },
        { text: 'Solo revisar el dashboard manualmente cada mañana', nextId: 'outcome_decent', points: 1, feedback: 'La revision manual es lenta e inconsistente. A las 3 AM nadie revisa dashboards. Las alertas AUTOMATICAS son innegociables para sistemas en produccion.' }
      ]
    },
    outcome_excellent: {
      id: 'outcome_excellent',
      narrative: '',
      outcome: {
        title: 'Ingeniero de Produccion Experto',
        description: 'Diagnosticaste rapidamente el loop, implementaste un circuit breaker, configuraste observabilidad completa, y documentaste todo en un post-mortem. Tu sistema ahora es mas resiliente que antes del incidente.',
        score: 15,
        maxScore: 15,
        grade: 'excellent',
        lessons: [
          'Los TRACES son tu mejor amigo para diagnosticar problemas de agentes. Los logs te dicen QUE fallo, los traces te dicen POR QUE.',
          'Circuit breakers son OBLIGATORIOS en cualquier sistema multi-agente. Los loops son inevitables.',
          'Observabilidad = Logs + Metricas + Traces. Las tres juntas, no una sola.',
          'Token budgets por request evitan cost overruns catastroficos.',
          'Post-mortems blameless son la practica de oro para aprender de incidentes.'
        ]
      }
    },
    outcome_good: {
      id: 'outcome_good',
      narrative: '',
      outcome: {
        title: 'Buena Respuesta al Incidente',
        description: 'Resolviste el problema e implementaste mejoras. Algunos pasos podrian haberse optimizado pero el resultado final es un sistema mas robusto.',
        score: 10,
        maxScore: 15,
        grade: 'good',
        lessons: [
          'Ante un incidente de costos, investiga el COMPORTAMIENTO del agente (traces), no solo metricas superficiales.',
          'Circuit breakers cortan loops. Timeouts son el plan B, no el plan A.',
          'Las alertas automaticas son mas confiables que la revision manual.',
          'Mejoras de prompts son utiles pero NUNCA deben ser tu unica defensa.',
          'Documenta incidentes formalmente: las lecciones no documentadas se olvidan.'
        ]
      }
    },
    outcome_decent: {
      id: 'outcome_decent',
      narrative: '',
      outcome: {
        title: 'Resolucion Parcial',
        description: 'Resolviste el incidente inmediato pero te faltan medidas preventivas robustas. El proximo incidente similar podria tardar en detectarse.',
        score: 6,
        maxScore: 15,
        grade: 'needs-work',
        lessons: [
          'Los traces > logs para diagnosticar problemas de agentes.',
          'Circuit breakers son obligatorios en sistemas multi-agente.',
          'La observabilidad no es opcional: alertas + dashboards + budgets como minimo.',
          'Los hacks (timeouts cortos, modelos baratos) no resuelven problemas de diseño.',
          'Un post-mortem formal previene la repeticion del mismo error.'
        ]
      }
    },
    outcome_poor: {
      id: 'outcome_poor',
      narrative: '',
      outcome: {
        title: 'Resolucion Insuficiente',
        description: 'El incidente se prolongo mas de lo necesario y las medidas tomadas no previenen recurrencia. En produccion, esto genera perdida de confianza del equipo y de los clientes.',
        score: 3,
        maxScore: 15,
        grade: 'critical',
        lessons: [
          'NUNCA dependas solo de prompts para prevenir problemas sistematicos. Los prompts son sugerencias, no garantias.',
          'Los loops en sistemas multi-agente son INEVITABLES. Disena para ellos con circuit breakers.',
          'La observabilidad (traces + metricas + alertas) es tan importante como el codigo del agente.',
          'Optimizar costos (modelo barato) no resuelve bugs de diseño (loops).',
          'Cada minuto sin actuar en un incidente de produccion multiplica el impacto.'
        ]
      }
    }
  };
</script>

<svelte:head>
  <title>Modulo 11: {mod.title} | Agent Mastery</title>
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

  <!-- THEORY SECTION 1: El Abismo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Abismo entre Demo y Produccion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      <strong class="text-agent-highlight">"It works on my laptop"</strong> es la frase mas peligrosa en ingenieria de software. Aplica doblemente para agentes IA. Un agente que funciona perfecto en tu demo con 10 requests puede colapsar con 10,000 requests reales.
    </p>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128170;</span>
        <h3 class="text-agent-danger font-bold text-sm">Fiabilidad</h3>
        <p class="text-xs text-agent-muted">Los agentes son probabilisticos. El mismo input puede dar diferente output. ¿Como garantizas consistencia?</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128176;</span>
        <h3 class="text-agent-danger font-bold text-sm">Costos</h3>
        <p class="text-xs text-agent-muted">Un loop infinito puede generar $10,000 en tokens en horas. Sin budgets, tu factura es impredecible.</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#9889;</span>
        <h3 class="text-agent-danger font-bold text-sm">Latencia</h3>
        <p class="text-xs text-agent-muted">Cada tool call es un round trip al LLM. 5 tool calls = 10-20 segundos. ¿Tus usuarios esperan tanto?</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128274;</span>
        <h3 class="text-agent-danger font-bold text-sm">Seguridad</h3>
        <p class="text-xs text-agent-muted">Prompt injection, data exfiltration, privilege escalation. Los vectores de ataque se multiplican en produccion.</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128065;&#65039;</span>
        <h3 class="text-agent-danger font-bold text-sm">Observabilidad</h3>
        <p class="text-xs text-agent-muted">Si no puedes ver QUE hace el agente en cada request, no puedes debuggear problemas en produccion.</p>
      </div>
      <div class="card bg-agent-dark text-center">
        <span class="text-2xl block mb-1">&#128220;</span>
        <h3 class="text-agent-danger font-bold text-sm">Compliance</h3>
        <p class="text-xs text-agent-muted">GDPR, SOC2, HIPAA. ¿Tus logs capturan datos de PII? ¿Puedes explicar por que el agente tomo una decision?</p>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 2: Observabilidad -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Observabilidad: Los 3 Pilares</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No puedes arreglar lo que no puedes ver. La observabilidad de agentes se basa en tres pilares complementarios. Necesitas los TRES, no uno solo.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128220;</span>
          <h3 class="text-agent-text font-bold">Logs (Que HIZO el agente)</h3>
        </div>
        <p class="text-sm text-agent-muted mb-2">Logging estructurado de cada accion del agente: que herramienta llamo, con que parametros, que resultado obtuvo, que decidio hacer despues.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          {@html `<pre class="text-xs text-agent-accent font-mono whitespace-pre-wrap">{
  "timestamp": "2026-02-16T03:15:42Z",
  "agent": "ticket-classifier",
  "action": "tool_call",
  "tool": "classify_ticket",
  "input": {"ticket_id": "TK-4521"},
  "output": {"category": "billing"},
  "tokens_used": 342,
  "latency_ms": 1250
}</pre>`}
        </div>
      </div>

      <div class="card border-l-4 border-l-agent-success">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128200;</span>
          <h3 class="text-agent-text font-bold">Metricas (CUANTO cuesta y tarda)</h3>
        </div>
        <p class="text-sm text-agent-muted mb-2">Numeros agregados: latencia promedio, tokens por request, tasa de exito, costo por hora, loops detectados. Se visualizan en dashboards y se usan para alertas.</p>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Latencia P95</p>
            <p class="text-sm font-bold text-agent-accent">2.4s</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Tokens/request</p>
            <p class="text-sm font-bold text-agent-accent">1,847</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Tasa exito</p>
            <p class="text-sm font-bold text-agent-success">97.3%</p>
          </div>
          <div class="bg-agent-darker rounded-lg p-2 text-center">
            <p class="text-xs text-agent-muted">Costo/hora</p>
            <p class="text-sm font-bold text-agent-warning">$12.40</p>
          </div>
        </div>
      </div>

      <div class="card border-l-4 border-l-agent-warning">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128204;</span>
          <h3 class="text-agent-text font-bold">Traces (la pelicula COMPLETA)</h3>
        </div>
        <p class="text-sm text-agent-muted mb-2">El camino completo de un request a traves del sistema: desde la entrada del usuario, cada decision del agente, cada tool call, hasta la respuesta final. Los traces son la herramienta MAS valiosa para debuggear agentes.</p>
        <div class="bg-agent-darker rounded-lg p-3">
          <p class="text-xs text-agent-muted mb-1">Trace de un request tipico:</p>
          <div class="space-y-1 text-xs font-mono">
            <p class="text-agent-accent">&#9500; [0ms] User input recibido</p>
            <p class="text-agent-text">&#9500; [50ms] LLM: clasificar ticket → "billing"</p>
            <p class="text-agent-text">&#9500; [1200ms] Tool: query_billing_db → OK</p>
            <p class="text-agent-text">&#9500; [1800ms] LLM: generar respuesta</p>
            <p class="text-agent-success">&#9492; [2400ms] Respuesta enviada al usuario</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Herramientas de observabilidad para agentes:</p>
      <p class="text-sm text-agent-muted"><strong class="text-agent-text">OpenTelemetry</strong> (estandar abierto, vendor-neutral), <strong class="text-agent-text">LangSmith</strong> (especifico para LLMs, excelente para traces), <strong class="text-agent-text">Datadog LLM Observability</strong> (enterprise, integra logs+metricas+traces), <strong class="text-agent-text">Weights & Biases</strong> (tracking de experimentos y evaluaciones).</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Gestion de Costos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Gestion de Costos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los tokens cuestan dinero. Cada tool call es un round trip al LLM. Un agente ineficiente puede multiplicar tu factura por 10. La gestion de costos no es optimizacion prematura: es <strong class="text-agent-highlight">supervivencia</strong>.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-agent-border">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Token Budgets</h3>
        <p class="text-xs text-agent-muted">Limites de tokens por request, por usuario, y por periodo. Si un request consume mas de X tokens, se corta y se escala. Previene cost overruns catastroficos.</p>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Model Routing</h3>
        <p class="text-xs text-agent-muted">Usa modelos baratos (Haiku, GPT-4o-mini) para tareas simples (clasificacion, extraccion). Reserva modelos caros (Opus, GPT-4) para tareas complejas (razonamiento, generacion). Un router inteligente puede reducir costos 60-80%.</p>
      </div>
      <div class="card bg-agent-dark border-agent-border">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Caching</h3>
        <p class="text-xs text-agent-muted">Prompts identicos generan respuestas identicas. Cache de resultados de tool calls frecuentes. Prompt caching (Anthropic/OpenAI nativo) para system prompts largos. Puede eliminar el 30-50% de las llamadas al LLM.</p>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-2">Ejemplo de calculo de costos:</p>
      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left py-2 px-3 text-agent-text">Componente</th>
              <th class="text-right py-2 px-3 text-agent-text">Tokens/req</th>
              <th class="text-right py-2 px-3 text-agent-text">Costo/req</th>
              <th class="text-right py-2 px-3 text-agent-text">1000 req/dia</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50">
              <td class="py-2 px-3">System prompt</td>
              <td class="text-right py-2 px-3">2,000</td>
              <td class="text-right py-2 px-3">$0.006</td>
              <td class="text-right py-2 px-3">$6.00</td>
            </tr>
            <tr class="border-b border-agent-border/50">
              <td class="py-2 px-3">3 tool calls (promedio)</td>
              <td class="text-right py-2 px-3">4,500</td>
              <td class="text-right py-2 px-3">$0.014</td>
              <td class="text-right py-2 px-3">$14.00</td>
            </tr>
            <tr class="border-b border-agent-border/50">
              <td class="py-2 px-3">Respuesta final</td>
              <td class="text-right py-2 px-3">800</td>
              <td class="text-right py-2 px-3">$0.012</td>
              <td class="text-right py-2 px-3">$12.00</td>
            </tr>
            <tr class="font-bold">
              <td class="py-2 px-3 text-agent-text">Total</td>
              <td class="text-right py-2 px-3 text-agent-accent">7,300</td>
              <td class="text-right py-2 px-3 text-agent-accent">$0.032</td>
              <td class="text-right py-2 px-3 text-agent-warning">$32.00/dia</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-agent-muted mt-2">Con prompt caching y model routing, este costo puede bajar a $10-15/dia. Sin optimizacion y con loops, puede subir a $200+/dia.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: CI/CD con Agentes -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">CI/CD con Agentes</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes no solo se deployean CON CI/CD. Los agentes pueden ser PARTE del pipeline. Hay dos perspectivas.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent">
        <h3 class="text-agent-text font-bold mb-2">Agentes EN el pipeline</h3>
        <p class="text-sm text-agent-muted mb-2">El agente corre como un step del CI/CD:</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Code review automatico de PRs</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Generacion de tests para codigo nuevo</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Security scanning con contexto</li>
          <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">&#9656;</span>Documentacion automatica de cambios</li>
        </ul>
      </div>
      <div class="card border-l-4 border-l-agent-warning">
        <h3 class="text-agent-text font-bold mb-2">Agentes COMO el pipeline</h3>
        <p class="text-sm text-agent-muted mb-2">El agente gestiona el deployment completo:</p>
        <ul class="space-y-1 text-xs text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">&#9656;</span>Decide si un PR esta listo para merge</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">&#9656;</span>Ejecuta el deployment</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">&#9656;</span>Monitorea post-deployment</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">&#9656;</span>Hace rollback si detecta problemas</li>
        </ul>
        <p class="text-xs text-agent-danger mt-2">RIESGO: Un agente con permisos de deploy puede causar dano irreversible. Requiere guardrails estrictos y human-in-the-loop.</p>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 5: Cuando NO Usar Agentes -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Cuando NO Usar Agentes</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No todo necesita un agente. Usar un agente cuando un <strong class="text-agent-highlight">if/else</strong> resuelve el problema es sobre-ingenieria costosa. Aqui esta la regla de decision.
    </p>

    <div class="space-y-3 mb-6">
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#10060;</span>
          <div>
            <h3 class="text-agent-text font-bold">Logica deterministica</h3>
            <p class="text-sm text-agent-muted">Si la respuesta correcta se puede determinar con reglas fijas (if/else, switch, lookup table), usa codigo. Un agente es LENTO y COSTOSO para lo que un diccionario Python resuelve en microsegundos.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#10060;</span>
          <div>
            <h3 class="text-agent-text font-bold">Tareas de bajo stake sin ambigüedad</h3>
            <p class="text-sm text-agent-muted">Formatear un CSV, convertir unidades, validar un email. No hay ambigüedad, no hay razonamiento. Un agente es overkill.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-danger">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#10060;</span>
          <div>
            <h3 class="text-agent-text font-bold">High-stakes sin observabilidad</h3>
            <p class="text-sm text-agent-muted">Si no puedes monitorear que hace el agente y las acciones son irreversibles (transferencias financieras, borrar datos), NO uses agentes hasta que tengas observabilidad completa.</p>
          </div>
        </div>
      </div>
      <div class="card bg-agent-dark border-l-4 border-l-agent-success">
        <div class="flex items-start gap-3">
          <span class="text-xl shrink-0">&#9989;</span>
          <div>
            <h3 class="text-agent-text font-bold">SI usa agente: tareas ambiguas que requieren razonamiento + herramientas</h3>
            <p class="text-sm text-agent-muted">Analizar un ticket de soporte, diagnosticar un bug, escribir codigo en contexto de un proyecto, investigar un topic. Aqui es donde los agentes brillan.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 6: Patterns de Produccion -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Patterns de Produccion</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Estos patrones de ingenieria de confiabilidad son tan relevantes para agentes como para microservicios. Aprendelos, implementalos, duermete tranquilo.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Retry con Backoff</h3>
        <p class="text-xs text-agent-muted">Si una tool call falla, reintenta con delay creciente (1s, 2s, 4s, 8s). Evita saturar APIs externas. Maximo 3-5 retries.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Circuit Breaker</h3>
        <p class="text-xs text-agent-muted">Si detectas un loop o fallas consecutivas, abre el circuito: deja de intentar y usa un fallback. Se cierra gradualmente cuando el sistema se estabiliza.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Fallback Chains</h3>
        <p class="text-xs text-agent-muted">Si el modelo A falla, usa el B. Si B falla, usa una respuesta predeterminada. Nunca dejes al usuario sin respuesta.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Graceful Degradation</h3>
        <p class="text-xs text-agent-muted">Si el agente no puede dar la respuesta completa, da una respuesta parcial. Mejor "no tengo toda la info pero aqui va lo que se" que un error 500.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Kill Switch</h3>
        <p class="text-xs text-agent-muted">Un boton que detiene TODOS los agentes inmediatamente. No es un lujo, es un requisito. Si algo va mal a las 3 AM, necesitas poder actuar en segundos.</p>
      </div>
      <div class="card bg-agent-dark">
        <h3 class="text-agent-accent font-bold text-sm mb-2">Canary Deployment</h3>
        <p class="text-xs text-agent-muted">Despliega cambios al 5% del trafico primero. Si las metricas son buenas, sube gradualmente. Si no, rollback automatico.</p>
      </div>
    </div>
  </section>

  <!-- Timer + BranchingScenario -->
  <section class="mb-10">
    {#if !showScenario}
      <div class="card bg-agent-dark border-agent-warning/30 text-center">
        <span class="text-4xl block mb-3">&#9888;&#65039;</span>
        <h3 class="text-lg font-bold text-agent-warning mb-2">Simulacion: Incidente en Produccion a las 3 AM</h3>
        <p class="text-agent-muted mb-4 text-sm">Tienes 8 minutos para diagnosticar y resolver un incidente critico en tu sistema multi-agente. Si se acaba el tiempo, perderas puntos.</p>
        <button onclick={() => showScenario = true} class="btn-primary">
          Iniciar incidente (8 minutos)
        </button>
      </div>
    {:else}
      <div class="mb-4">
        <Timer duration={480} onTimeUp={handleTimeUp} autoStart={true} label="Tiempo para resolver el incidente" />
      </div>
      {#if timedOut}
        <div class="card bg-agent-danger/10 border-agent-danger/30 mb-4 fade-in">
          <p class="text-sm text-agent-danger font-bold">Se acabo el tiempo. En produccion, cada minuto sin resolver cuesta dinero y confianza. Se aplicara una penalizacion de -3 puntos al resultado final.</p>
        </div>
      {/if}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Incidente: Sistema Multi-Agente Fuera de Control"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#127981;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">
        {#if timedOut}
          Resolviste el incidente pero se te acabo el tiempo. En produccion, la velocidad es critica. Practica la toma de decisiones rapida bajo presion.
        {:else}
          Ahora sabes como llevar agentes a produccion con observabilidad, gestion de costos, y patrones de resiliencia. La diferencia entre una demo y un sistema real es exactamente esto.
        {/if}
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
