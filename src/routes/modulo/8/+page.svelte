<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';

  const MODULE_ID = 8;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);
  let showScenario = $state(false);

  courseStore.startModule(MODULE_ID);

  // ─── BranchingScenario: Design an Orchestration ───
  const scenarioNodes: Record<string, { id: string; narrative: string; choices?: { text: string; nextId: string; points: number; feedback?: string; }[]; outcome?: { title: string; description: string; score: number; maxScore: number; grade: 'excellent' | 'good' | 'needs-work' | 'critical'; lessons: string[]; }; }> = {
    start: {
      id: 'start',
      narrative: 'Tu empresa quiere construir un sistema de IA que haga code review automatizado de Pull Requests. El sistema debe:\n\n1. Analizar la calidad del codigo (estilo, complejidad, DRY)\n2. Verificar seguridad (vulnerabilidades, secrets expuestos)\n3. Comprobar que los tests cubren los cambios\n4. Escribir un resumen de review con recomendaciones\n\nTu primera decision: como organizas los agentes?',
      choices: [
        { text: 'Un orquestador central que asigna tareas a 4 workers especializados (calidad, seguridad, tests, resumen)', nextId: 'orch-worker', points: 3, feedback: 'Excelente! El patron Orchestrator-Worker es ideal: un agente central descompone la tarea y 4 especialistas trabajan en paralelo.' },
        { text: 'Un pipeline secuencial: calidad -> seguridad -> tests -> resumen, donde cada agente pasa su resultado al siguiente', nextId: 'pipeline', points: 1, feedback: 'Funciona pero es suboptimo. Los primeros 3 analisis son independientes: no necesitan esperar uno al otro. Los estas forzando a ser secuenciales.' },
        { text: 'Un solo agente que hace todo: analiza calidad, seguridad, tests y escribe el resumen', nextId: 'single', points: 0, feedback: 'Un solo agente para 4 tareas especializadas? Demasiada responsabilidad, contexto saturado, y si falla en una tarea, falla todo.' },
        { text: 'Cada agente decide a quien pasar el PR usando handoffs sin coordinador central', nextId: 'handoff', points: 1, feedback: 'Posible, pero sin coordinador, quien decide el orden? Quien combina los resultados? Los handoffs sin estructura son impredecibles.' }
      ]
    },
    'orch-worker': {
      id: 'orch-worker',
      narrative: 'Elegiste Orchestrator-Worker. El orquestador descompone la tarea y asigna a 4 workers. Ahora: los analisis de calidad, seguridad y tests son INDEPENDIENTES entre si (no necesitan el resultado del otro). Como los ejecutas?',
      choices: [
        { text: 'En paralelo: los 3 workers de analisis corren simultaneamente, y cuando los 3 terminan, el worker de resumen sintetiza los resultados', nextId: 'parallel-done', points: 3, feedback: 'Perfecto! Como los analisis son independientes, el paralelismo reduce el tiempo total dramaticamente. El resumen espera a que todos terminen para tener la vision completa.' },
        { text: 'Secuencial: uno por uno para mantener el control y ver como avanza', nextId: 'seq-done', points: 1, feedback: 'Funciona pero desperdicias tiempo. Si cada analisis toma 30 segundos, en paralelo son 30 segundos totales vs 90 secuenciales. En produccion, la diferencia importa.' },
        { text: 'En paralelo pero el resumen empieza a escribirse en cuanto cualquier analisis termina (streaming)', nextId: 'stream-done', points: 2, feedback: 'Idea interesante pero arriesgada. Si el resumen empieza sin la informacion completa, puede perder hallazgos criticos que llegan despues. Mejor esperar a que todos terminen.' }
      ]
    },
    pipeline: {
      id: 'pipeline',
      narrative: 'Elegiste Pipeline secuencial. Ahora: el agente de seguridad encontro 3 vulnerabilidades criticas. En un pipeline, el siguiente agente (tests) recibe el resultado. Que deberia pasar?',
      choices: [
        { text: 'El pipeline continua normalmente: tests analiza cobertura y el resumen incluye las vulnerabilidades en la seccion de seguridad', nextId: 'pipeline-continue', points: 2, feedback: 'Razonable. El pipeline es predecible y cada agente agrega su analisis. El resumen final tiene toda la informacion.' },
        { text: 'Se deberia detener el pipeline inmediatamente y rechazar el PR por las vulnerabilidades criticas', nextId: 'pipeline-stop', points: 1, feedback: 'Rechazar sin review completo es agresivo. Las vulnerabilidades criticas son importantes, pero el equipo merece ver el review completo para tomar una decision informada.' },
        { text: 'Convertir a un patron Orchestrator-Worker en este punto porque el pipeline no es optimo', nextId: 'pipeline-switch', points: 1, feedback: 'Cambiar de patron en medio de la ejecucion anade complejidad innecesaria. Si el pipeline no es optimo, la decision se toma en el diseno, no en runtime.' }
      ]
    },
    single: {
      id: 'single',
      narrative: 'Elegiste un solo agente. Despues de analizar calidad y seguridad, el context window esta al 70% y el agente empieza a perder precision en el analisis de tests. Que haces?',
      choices: [
        { text: 'Dividir en multiples agentes especializados - debiste hacer esto desde el principio', nextId: 'single-fix', points: 2, feedback: 'Correcto. Un agente unico no escala con la complejidad. Especializar es la solucion, pero debiste disenar asi desde el inicio en vez de descubrirlo en produccion.' },
        { text: 'Aumentar el context window usando un modelo con mas tokens', nextId: 'single-more-tokens', points: 0, feedback: 'Tirar dinero al problema no es ingenieria. Ademas, mas tokens no garantizan mejor precision: el "lost in the middle" problem empeora con contextos muy largos.' }
      ]
    },
    handoff: {
      id: 'handoff',
      narrative: 'Elegiste Handoffs descentralizados. El agente de calidad termino y hace handoff al agente de seguridad. Pero el agente de seguridad decide que necesita el resultado de tests primero. Deadlock: seguridad espera tests, tests no ha empezado. Como resuelves?',
      choices: [
        { text: 'Agregar un coordinador que defina el orden de ejecucion - basicamente, volver a Orchestrator-Worker', nextId: 'handoff-fix', points: 2, feedback: 'Exacto. Cuando los handoffs descentralizados generan deadlocks, la solucion es un coordinador. Llegaste al Orchestrator-Worker por necesidad - debiste empezar ahi.' },
        { text: 'Hacer que cada agente sea independiente y no dependa de otros', nextId: 'handoff-independent', points: 1, feedback: 'Si son independientes no necesitan handoffs en primer lugar. Entonces lo que quieres es paralelo con orquestador, no handoffs.' }
      ]
    },
    'parallel-done': {
      id: 'parallel-done',
      narrative: 'Los 3 analisis corrieron en paralelo y el resumen los sintetizo. Pero hay un problema: el agente de calidad dice "refactorizar funcion X" y el agente de seguridad dice "no tocar funcion X, tiene validacion critica de input". Contradiccion. Como la manejas?',
      choices: [
        { text: 'El orquestador detecta la contradiccion, lanza un agente "resolver-conflictos" que analiza ambas recomendaciones y genera una recomendacion unificada', nextId: 'conflict-resolver', points: 3, feedback: 'Excelente! Detectar y resolver contradicciones es una responsabilidad natural del orquestador. Un agente dedicado a resolver conflictos con contexto de ambos analisis es la solucion correcta.' },
        { text: 'Priorizar siempre seguridad sobre calidad: ignorar la recomendacion de refactoring', nextId: 'conflict-priority', points: 2, feedback: 'Seguridad primero es un buen principio, pero ignorar completamente la recomendacion de calidad sin analizar es agresivo. La funcion puede tener ambos problemas y necesitar una solucion que atienda los dos.' },
        { text: 'Incluir ambas recomendaciones contradictorias en el resumen y dejar que el desarrollador decida', nextId: 'conflict-user', points: 1, feedback: 'Funciona pero es lazy. El sistema deberia resolver contradicciones en vez de pasar el problema al usuario. Si el review automatizado no puede resolver conflictos, pierde mucho valor.' }
      ]
    },
    'seq-done': {
      id: 'seq-done',
      narrative: 'El pipeline secuencial funciona pero es lento. Un PR que deberia revisarse en 30 segundos toma 2 minutos. Tu equipo se queja. Como optimizas?',
      choices: [
        { text: 'Cambiar a Orchestrator-Worker con ejecucion paralela para los analisis independientes', nextId: 'seq-optimize', points: 3, feedback: 'Correcto! La optimizacion natural es identificar las tareas independientes y paralelizarlas. Calidad, seguridad y tests son independientes: correrlos en paralelo reduce dramaticamente el tiempo.' },
        { text: 'Cachear los resultados de PRs similares para no recalcular', nextId: 'seq-cache', points: 1, feedback: 'El caching ayuda pero no resuelve el problema fundamental: las tareas independientes no deberian ser secuenciales. La mejora seria marginal comparada con paralelizar.' }
      ]
    },
    'stream-done': {
      id: 'stream-done',
      narrative: 'Decidiste que el resumen se escribiera con informacion parcial. En produccion, el resumen a veces omite hallazgos de seguridad criticos porque se genero antes de que el analisis de seguridad terminara. Como arreglas?',
      choices: [
        { text: 'Esperar a que TODOS los analisis terminen antes de generar el resumen, aunque sea un poco mas lento', nextId: 'stream-fix', points: 2, feedback: 'Correcto. La completitud es mas importante que la velocidad en un code review. Un resumen que omite vulnerabilidades criticas es peor que un resumen lento.' },
        { text: 'Hacer que el resumen se actualice incrementalmente cuando llegan nuevos resultados', nextId: 'stream-incremental', points: 1, feedback: 'Interesante pero complejo. El agente de resumen tendria que regenerar parcialmente con cada resultado nuevo, lo que consume mas tokens y puede crear inconsistencias.' }
      ]
    },
    'pipeline-continue': {
      id: 'pipeline-continue',
      narrative: 'El pipeline completo funciona. Ahora quieres agregar un 5to paso: verificar que el PR sigue las convenciones del proyecto (.editorconfig, naming, etc). Donde lo pones en el pipeline?',
      choices: [
        { text: 'Antes del analisis de calidad, porque las convenciones son prerequisito para evaluar calidad', nextId: 'outcome-good-pipeline', points: 2, feedback: 'Razonable! Las convenciones son la base sobre la que se evalua calidad. Ponerlas primero tiene sentido logico.' },
        { text: 'Esto seria mas facil con un Orchestrator-Worker donde simplemente agrego un 5to worker en paralelo', nextId: 'outcome-good-pipeline', points: 3, feedback: 'Excelente reflexion! Agregar pasos a un pipeline es rigido. Con un orquestador, simplemente agregas un worker mas sin restructurar todo.' }
      ]
    },
    'pipeline-stop': {
      id: 'pipeline-stop',
      narrative: 'Rechazaste el PR automaticamente. El equipo se queja: una de las "vulnerabilidades criticas" era un falso positivo del agente de seguridad. Ahora no confian en el sistema. Que haces?',
      choices: [
        { text: 'Agregar un agente de verificacion que confirme las vulnerabilidades antes de rechazar automaticamente', nextId: 'outcome-needs-work', points: 2, feedback: 'Buena idea. Un segundo chequeo reduce falsos positivos. Pero ahora tienes un sistema mas complejo que si hubieras hecho un review completo desde el principio.' },
        { text: 'Nunca rechazar automaticamente: siempre mostrar el review completo y dejar la decision al humano', nextId: 'outcome-needs-work', points: 1, feedback: 'Conservador pero valido. Sin embargo, pierde el valor de la automatizacion. El ideal es un review completo que RECOMIENDE, no que decida unilateralmente.' }
      ]
    },
    'pipeline-switch': {
      id: 'pipeline-switch',
      narrative: 'Intentaste cambiar de patron en runtime. El codigo se volvio espagueti: mitad pipeline, mitad orquestador. Cual es la leccion?',
      choices: [
        { text: 'El patron de orquestacion se elige en el diseno, no en la ejecucion. Voy a redisenar con Orchestrator-Worker desde cero.', nextId: 'outcome-needs-work', points: 2, feedback: 'Correcto! Los patrones de orquestacion son decisiones de arquitectura que se toman en tiempo de diseno. Cambiar en runtime crea complejidad innecesaria.' }
      ]
    },
    'single-fix': {
      id: 'single-fix',
      narrative: 'Decidiste dividir en agentes especializados. Pero ya tienes codigo de produccion con un solo agente y usuarios activos. Como migras?',
      choices: [
        { text: 'Migrar gradualmente: extraer una responsabilidad a la vez, empezando por seguridad (la mas critica)', nextId: 'outcome-needs-work', points: 2, feedback: 'Correcto. Migracion gradual reduce riesgo. Empezar por seguridad tiene sentido porque es la mas independiente y la mas critica.' }
      ]
    },
    'single-more-tokens': {
      id: 'single-more-tokens',
      narrative: 'Aumentaste los tokens pero el agente ahora es 5x mas caro y todavia pierde precision en analisis largos por el "lost in the middle" problem. El CTO pregunta por que el costo se fue al cielo.',
      choices: [
        { text: 'Reconocer que un solo agente no escala y proponer la arquitectura multi-agente correcta', nextId: 'outcome-critical', points: 1, feedback: 'Al menos reconoces el error. Pero llegaste aca despues de gastar dinero y tiempo. La leccion: disenar bien desde el inicio es mas barato que parchear.' }
      ]
    },
    'handoff-fix': {
      id: 'handoff-fix',
      narrative: 'Agregaste un coordinador para resolver los deadlocks. Ahora el sistema funciona pero es basicamente un Orchestrator-Worker que construiste por partes. Reflexion final?',
      choices: [
        { text: 'Deberia haber analizado las dependencias entre tareas ANTES de elegir el patron. Si las tareas son independientes, necesito un coordinador desde el inicio.', nextId: 'outcome-good-handoff', points: 2, feedback: 'Excelente reflexion! El analisis de dependencias es el primer paso antes de elegir un patron. Handoffs descentralizados funcionan cuando el flujo es lineal y claro, no cuando hay tareas paralelas.' }
      ]
    },
    'handoff-independent': {
      id: 'handoff-independent',
      narrative: 'Si los agentes son independientes, no necesitan handoffs. Entonces necesitas un orquestador que lance, coordine y combine resultados.',
      choices: [
        { text: 'Entendido: para tareas independientes, Orchestrator-Worker con ejecucion paralela es el patron correcto', nextId: 'outcome-good-handoff', points: 2, feedback: 'Correcto! Llegaste a la conclusion correcta a traves de la experiencia. Eso es aprendizaje real.' }
      ]
    },
    'conflict-resolver': {
      id: 'conflict-resolver',
      narrative: 'Tu agente de resolucion de conflictos analizo ambas recomendaciones y determino: "La funcion X debe ser refactorizada MANTENIENDO la validacion de input como la primera operacion. Ambas recomendaciones son validas y no son mutuamente excluyentes." El review final es preciso y completo. Cual patron final usaste?',
      choices: [
        { text: 'Orchestrator-Worker con ejecucion paralela y un paso de resolucion de conflictos: el patron mas robusto para este tipo de problema', nextId: 'outcome-excellent', points: 3, feedback: 'Perfecto! Diseñaste una arquitectura robusta: orquestador central, workers paralelos para analisis independientes, y un mecanismo para resolver contradicciones. Produccion-ready.' }
      ]
    },
    'conflict-priority': {
      id: 'conflict-priority',
      narrative: 'Priorizar seguridad funciono en este caso. Pero en otro PR, la recomendacion de calidad era la correcta y la de seguridad era un falso positivo. Necesitas una solucion mas inteligente.',
      choices: [
        { text: 'Agregar un agente de resolucion de conflictos que analice ambas recomendaciones en contexto', nextId: 'outcome-good-orch', points: 2, feedback: 'Ahora si! Un agente dedicado a resolver contradicciones con contexto completo es la solucion correcta. Mejor tarde que nunca.' }
      ]
    },
    'conflict-user': {
      id: 'conflict-user',
      narrative: 'Los desarrolladores se quejan de que el review tiene recomendaciones contradictorias y no saben cual seguir. El sistema pierde credibilidad.',
      choices: [
        { text: 'Necesito un paso de resolucion de conflictos antes de presentar el review final', nextId: 'outcome-good-orch', points: 1, feedback: 'Correcto. Un review profesional no tiene contradicciones. El orquestador debe detectar y resolver conflictos antes de entregar el resultado final.' }
      ]
    },
    'seq-optimize': {
      id: 'seq-optimize',
      narrative: 'Migraste a Orchestrator-Worker con paralelismo. El tiempo bajo de 2 minutos a 40 segundos. El equipo esta feliz.',
      choices: [
        { text: 'La leccion: analizar dependencias entre tareas es clave para elegir entre secuencial y paralelo', nextId: 'outcome-good-orch', points: 2, feedback: 'Exacto! El patron correcto depende de las dependencias entre tareas. Si son independientes, paralelo. Si hay dependencias, secuencial o parcialmente paralelo.' }
      ]
    },
    'seq-cache': {
      id: 'seq-cache',
      narrative: 'El caching ayudo un poco pero los PRs unicos siguen siendo lentos. La solucion fundamental sigue siendo paralelizar las tareas independientes.',
      choices: [
        { text: 'Combinar caching con paralelismo: cachear resultados de analisis de archivos que no cambiaron Y paralelizar los analisis de archivos nuevos', nextId: 'outcome-good-orch', points: 2, feedback: 'Buena combinacion! Caching + paralelismo es poderoso. Pero la mejora principal viene del paralelismo, el caching es la cereza.' }
      ]
    },
    'stream-fix': {
      id: 'stream-fix',
      narrative: 'Ahora el resumen espera a que todos terminen. Funciona correctamente pero podrias haber evitado el problema disenando mejor desde el inicio.',
      choices: [
        { text: 'La leccion: en pipelines de datos, la completitud de la informacion antes de sintetizar es critica', nextId: 'outcome-good-orch', points: 2, feedback: 'Correcto! "garbage in, garbage out" aplica tambien a informacion incompleta. El agente de sintesis necesita ALL data antes de generar el resumen final.' }
      ]
    },
    'stream-incremental': {
      id: 'stream-incremental',
      narrative: 'El resumen incremental consume 3x mas tokens porque se regenera parcialmente con cada resultado nuevo. Ademas, a veces las versiones intermedias contradicen la version final.',
      choices: [
        { text: 'Simplificar: esperar a que todo termine y generar el resumen una sola vez', nextId: 'outcome-good-orch', points: 1, feedback: 'KISS - Keep It Simple. Una generacion completa es mas barata y consistente que multiples generaciones incrementales.' }
      ]
    },
    // ─── OUTCOMES ───
    'outcome-excellent': {
      id: 'outcome-excellent',
      narrative: '',
      outcome: {
        title: 'Arquitecto de Orquestacion',
        description: 'Disenaste un sistema robusto con el patron correcto, ejecucion paralela, y resolucion de conflictos. Produccion-ready.',
        score: 0,
        maxScore: 18,
        grade: 'excellent',
        lessons: [
          'Orchestrator-Worker es el patron mas versatil para tareas con analisis independientes',
          'Las tareas independientes DEBEN ejecutarse en paralelo para minimizar latencia',
          'Un sistema multi-agente necesita un mecanismo para detectar y resolver contradicciones',
          'El patron se elige en el diseno, basandose en el analisis de dependencias entre tareas',
          'El agente de sintesis necesita resultados COMPLETOS antes de generar el output final'
        ]
      }
    },
    'outcome-good-orch': {
      id: 'outcome-good-orch',
      narrative: '',
      outcome: {
        title: 'Buen Enfoque',
        description: 'Llegaste a una solucion funcional, aunque con algunos desvios. Entiendes los patrones pero necesitas afinar la seleccion inicial.',
        score: 0,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Analizar dependencias entre tareas ANTES de elegir el patron de orquestacion',
          'Orchestrator-Worker con paralelismo es optimo para analisis independientes',
          'Las contradicciones entre agentes deben resolverse antes de entregar resultados',
          'El caching y el paralelismo son optimizaciones complementarias',
          'La completitud de datos es prerequisito para la sintesis'
        ]
      }
    },
    'outcome-good-pipeline': {
      id: 'outcome-good-pipeline',
      narrative: '',
      outcome: {
        title: 'Pipeline Funcional',
        description: 'Tu pipeline funciona pero no es optimo. Las tareas independientes deberian correr en paralelo, no en secuencia.',
        score: 0,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Pipeline secuencial es simple y predecible, pero suboptimo para tareas independientes',
          'Agregar pasos a un pipeline es mas rigido que agregar workers a un orquestador',
          'Identificar dependencias entre tareas determina si usar secuencial o paralelo',
          'La velocidad del pipeline esta limitada por la tarea mas lenta'
        ]
      }
    },
    'outcome-good-handoff': {
      id: 'outcome-good-handoff',
      narrative: '',
      outcome: {
        title: 'Aprendiste por Experiencia',
        description: 'Empezaste con handoffs descentralizados y descubriste que necesitabas un coordinador. La leccion esta aprendida.',
        score: 0,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Handoffs descentralizados funcionan para flujos lineales y claros',
          'Sin coordinador, tareas paralelas pueden generar deadlocks',
          'El analisis de dependencias es obligatorio antes de elegir un patron',
          'Orchestrator-Worker es el patron por defecto para tareas independientes'
        ]
      }
    },
    'outcome-needs-work': {
      id: 'outcome-needs-work',
      narrative: '',
      outcome: {
        title: 'Necesitas Mejorar',
        description: 'Tomaste decisiones que crearon problemas evitables. La buena noticia: ahora entiendes POR QUE los patrones existen.',
        score: 0,
        maxScore: 18,
        grade: 'needs-work',
        lessons: [
          'Un solo agente no escala cuando la tarea tiene multiples responsabilidades',
          'Los patrones de orquestacion se eligen en el diseno, no se descubren en produccion',
          'Cambiar de patron en runtime genera codigo espagueti',
          'Analizar dependencias entre subtareas es el primer paso del diseno multi-agente',
          'Mas tokens no es la solucion a problemas de arquitectura'
        ]
      }
    },
    'outcome-critical': {
      id: 'outcome-critical',
      narrative: '',
      outcome: {
        title: 'Error Critico de Arquitectura',
        description: 'Un solo agente para multiples tareas especializadas y tirar dinero al problema no es ingenieria. Repasa los patrones.',
        score: 0,
        maxScore: 18,
        grade: 'critical',
        lessons: [
          'NUNCA uses un solo agente para multiples responsabilidades complejas',
          'Aumentar tokens no resuelve problemas de arquitectura',
          'El "lost in the middle" problem empeora con contextos muy largos',
          'Disenar la arquitectura correcta desde el inicio es MUCHO mas barato que parchear',
          'Cada agente debe tener una responsabilidad clara y acotada (Single Responsibility)'
        ]
      }
    }
  };

  function handleScenarioComplete(score: number, maxScore: number) {
    courseStore.completeModule(MODULE_ID, score, maxScore);
    completed = true;
    // Badge 'orchestrator' on excellent or good
    // The BranchingScenario calls onComplete with the accumulated points
    // We check the grade via the accumulated points
    // excellent path: start(3) + parallel(3) + conflict-resolver(3) + final(3) = 12 out of 18
    // good paths: various combos ~7-9
    // We give badge if score >= 8 (roughly good or excellent)
    if (score >= 8) {
      const badge = courseStore.unlockBadge('orchestrator');
      if (badge) {
        earnedBadge = badge;
        showBadge = true;
      }
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

  <!-- Section 1: Por Que Patrones -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">1. Por Que Patrones de Orquestacion?</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Por la misma razon que existen design patterns en OOP: son <strong class="text-agent-text">soluciones probadas a problemas recurrentes</strong>. No reinventes la rueda cada vez que necesites coordinar agentes. Estos patrones han sido validados por empresas como Anthropic, OpenAI, Microsoft y AWS en produccion real.
    </p>
    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm">El principio guia</p>
      <p class="text-sm text-agent-muted mt-1">Analiza las <strong class="text-agent-text">dependencias entre tareas</strong> ANTES de elegir un patron. Son independientes? Usa paralelo. Una necesita el output de otra? Usa pipeline. Necesitan coordinacion? Usa orquestador.</p>
    </div>
  </section>

  <!-- Section 2: Orchestrator-Worker -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">2. Orchestrator-Worker</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El patron mas comun y versatil. Un <strong class="text-agent-text">agente orquestador</strong> central recibe la tarea, la descompone en subtareas, las asigna a workers especializados, recopila resultados y sintetiza la respuesta final.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">USUARIO: "Haz un review de este PR"

ORQUESTADOR:
├── Analiza el PR y descompone en subtareas
├── Asigna a WORKER 1: Calidad de codigo
├── Asigna a WORKER 2: Seguridad
├── Asigna a WORKER 3: Cobertura de tests
├── Espera resultados de los 3 workers
├── Resuelve contradicciones (si las hay)
└── Sintetiza review final

WORKERS: ejecutan su analisis especializado
ORQUESTADOR: combina y entrega al usuario</pre>`}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Cuando usarlo</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Tareas descomponibles en subtareas independientes</li>
          <li>Necesitas resultados combinados de multiples analisis</li>
          <li>La tarea no es trivial para un solo agente</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">Cuando evitarlo</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>La tarea es simple para un solo agente</li>
          <li>No hay subtareas claras para descomponer</li>
          <li>El overhead de coordinacion > beneficio</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Section 3: Manager Pattern -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">3. Manager Pattern</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Similar al Orchestrator-Worker pero con <strong class="text-agent-text">autoridad jerarquica</strong>. El manager no solo asigna tareas: revisa resultados, puede rechazarlos y pedir retrabajo. Como un tech lead haciendo code review.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">MANAGER: "Worker 1, escribe la funcion de autenticacion"

WORKER 1: entrega implementacion

MANAGER: revisa
├── "El hash de password no usa bcrypt. Rechazado."
├── "Retrabajo: implementa con bcrypt y sal unica."

WORKER 1: entrega version corregida

MANAGER: revisa
├── "Aprobado. Worker 2, ahora escribe los tests."</pre>`}
    </div>
    <div class="bg-agent-warning/10 border border-agent-warning/30 rounded-lg p-4">
      <p class="text-agent-warning font-bold text-sm">Trade-off</p>
      <p class="text-sm text-agent-muted mt-1">Mayor calidad por la revision, pero mas lento y caro (mas iteraciones = mas tokens). Usalo cuando la calidad del output es critica (codigo de produccion, documentacion legal, etc).</p>
    </div>
  </section>

  <!-- Section 4: Handoff Pattern -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">4. Handoff Pattern</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Descentralizado: los agentes <strong class="text-agent-text">transfieren control</strong> a especialistas sin coordinador central. Como un triage de hospital: el medico general evalua y transfiere al especialista correcto.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">AGENTE TRIAGE: "Esta pregunta es sobre seguridad"
    → Handoff a AGENTE SEGURIDAD (con contexto relevante)

AGENTE SEGURIDAD: "Necesito verificar el codigo"
    → Handoff a AGENTE CODIGO (con contexto de seguridad)

AGENTE CODIGO: analiza y devuelve resultado
    → Handoff de vuelta a AGENTE SEGURIDAD (con hallazgos)

AGENTE SEGURIDAD: genera recomendacion final</pre>`}
    </div>
    <p class="text-agent-muted leading-relaxed">
      <strong class="text-agent-text">Clave del handoff:</strong> pasar solo el contexto relevante, no todo el historial. Un handoff con 50K tokens de contexto es ineficiente y caro. Filtra lo que el siguiente agente realmente necesita.
    </p>
  </section>

  <!-- Section 5: Hierarchical Pattern -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">5. Hierarchical Pattern</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Multiples niveles de jerarquia: <strong class="text-agent-text">director > managers > workers</strong>. Para problemas muy complejos que necesitan descomposicion en capas.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">DIRECTOR: "Migrar el monolito a microservicios"
├── MANAGER Backend: descompone en tareas de backend
│   ├── WORKER: Separar auth service
│   ├── WORKER: Separar payment service
│   └── WORKER: Disenar API gateway
├── MANAGER Frontend: descompone en tareas de frontend
│   ├── WORKER: Adaptar llamadas a nuevos endpoints
│   └── WORKER: Implementar service discovery
└── MANAGER Infra: descompone en tareas de infra
    ├── WORKER: Configurar Kubernetes
    └── WORKER: Disenar CI/CD pipelines</pre>`}
    </div>
    <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
      <p class="text-agent-danger font-bold text-sm">Riesgo principal</p>
      <p class="text-sm text-agent-muted mt-1">Perdida de contexto entre niveles. Cada handoff vertical pierde informacion. Si el director pide A, el manager interpreta B, y el worker ejecuta C, el resultado esta roto. Mitigacion: pasar instrucciones explicitas y verificar resultados en cada nivel.</p>
    </div>
  </section>

  <!-- Section 6: Pipeline Pattern -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">6. Pipeline Pattern</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Secuencial y predecible: el <strong class="text-agent-text">output de un agente es el input del siguiente</strong>. Cada agente transforma o enriquece los datos. Facil de debuggear porque sabes exactamente donde fallo.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">AGENTE 1 (Investigacion)
    → output: datos crudos, fuentes, hallazgos
        │
AGENTE 2 (Analisis)
    → output: insights, patrones, conclusiones
        │
AGENTE 3 (Redaccion)
    → output: borrador del documento
        │
AGENTE 4 (Revision)
    → output: documento final editado y verificado</pre>`}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-3">
        <p class="text-agent-success font-bold text-sm">Ventajas</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Simple de entender y debuggear</li>
          <li>Cada paso tiene input/output claro</li>
          <li>Facil de agregar o quitar pasos</li>
        </ul>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-3">
        <p class="text-agent-danger font-bold text-sm">Desventajas</p>
        <ul class="text-xs text-agent-muted mt-1 space-y-1">
          <li>Tiempo total = suma de todos los pasos</li>
          <li>Tareas independientes son forzadas a ser secuenciales</li>
          <li>Un paso lento bloquea todo</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- Section 7: Parallel Execution -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">7. Parallel Execution</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Subtareas <strong class="text-agent-text">genuinamente independientes</strong> corren simultaneamente. Reduce dramaticamente el tiempo total. Pero: las tareas DEBEN ser independientes. Si tienen dependencias, el paralelismo genera race conditions y resultados inconsistentes.
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">    ┌── WORKER A (30s) ──┐
    │                     │
START ── WORKER B (20s) ── JOIN ── RESULTADO (30s total)
    │                     │
    └── WORKER C (25s) ──┘

Secuencial: 30 + 20 + 25 = 75 segundos
Paralelo:   max(30, 20, 25) = 30 segundos
Ahorro:     60% del tiempo</pre>`}
    </div>
    <div class="bg-agent-accent/10 border border-agent-accent/30 rounded-lg p-4">
      <p class="text-agent-accent font-bold text-sm">Regla de oro</p>
      <p class="text-sm text-agent-muted mt-1">Antes de paralelizar, preguntate: "Si el worker B no existiera, el worker A podria hacer su trabajo completo?" Si la respuesta es SI, son independientes y puedes paralelizar. Si es NO, hay una dependencia que debes respetar.</p>
    </div>
  </section>

  <!-- Section 8: Cual Elegir -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">8. Cual Patron Elegir?</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      No hay un patron "mejor". Hay un patron <strong class="text-agent-text">correcto para cada problema</strong>. Usa esta guia de decision:
    </p>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4">
      {@html `<pre class="code-block text-agent-highlight text-sm">Tu problema requiere multiples agentes?
│
├── NO → Un solo agente con buenas herramientas
│
└── SI → Las subtareas son independientes?
    │
    ├── SI → Orchestrator-Worker con ejecucion paralela
    │   └── Necesitas revision de calidad? → Manager Pattern
    │
    └── NO → Hay un flujo lineal claro?
        │
        ├── SI → Pipeline Pattern
        │
        └── NO → Hay un flujo de especializacion?
            │
            ├── SI → Handoff Pattern
            │
            └── NO → El problema tiene multiples niveles?
                │
                ├── SI → Hierarchical Pattern
                │
                └── NO → Necesitas debate/revision?
                    │
                    └── SI → Conversacional (AutoGen)</pre>`}
    </div>
  </section>

  <!-- BranchingScenario -->
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
        <p class="text-agent-muted text-sm">Tu empresa quiere construir un sistema de IA que haga code review automatizado de Pull Requests. Deberas tomar decisiones de arquitectura en cada paso. Tus decisiones determinan la calidad del sistema final.</p>
        <p class="text-sm text-agent-warning mt-2">Necesitas una puntuacion alta (excellent o good) para desbloquear el badge "Orquestador".</p>
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

  <!-- Completion -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl">🎭</span>
      <h3 class="text-xl font-bold text-agent-success mt-2">Modulo completado!</h3>
      <p class="text-agent-muted mt-1">Ahora dominas los patrones de orquestacion multi-agente.</p>
    </div>
  {/if}

  <SourcesSection sources={mod.sources} />
  <ModuleNav currentModule={MODULE_ID} />
</div>

<VocabularyFloat moduleId={MODULE_ID} />

{#if showBadge && earnedBadge}
  <BadgeNotification badge={earnedBadge} onClose={() => showBadge = false} />
{/if}
