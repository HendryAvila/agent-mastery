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

  const MODULE_ID = 5;
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

      const badge = courseStore.unlockBadge('claude-pro');
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

  // ─── BranchingScenario: Bug Fix con Claude Code ───
  const scenarioNodes: Record<string, { id: string; narrative: string; choices?: { text: string; nextId: string; points: number; feedback?: string }[]; outcome?: { title: string; description: string; score: number; maxScore: number; grade: 'excellent' | 'good' | 'needs-work' | 'critical'; lessons: string[] } }> = {
    start: {
      id: 'start',
      narrative: 'Escenario: Son las 9 AM. Te llega un bug report en Jira: "El endpoint /api/invoices devuelve 500 cuando el cliente no tiene direccion de facturacion". El proyecto es una API en FastAPI con 80+ endpoints, SQLAlchemy 2.0, y 400+ tests.\n\nAbris Claude Code en la terminal. Es un proyecto que no tocas hace 2 semanas.\n\n\u00bfCual es tu PRIMER paso?',
      choices: [
        { text: 'Activo Plan Mode (Shift+Tab) y le pido a Claude Code que explore el codebase: estructura del endpoint, modelos de datos, y tests existentes', nextId: 'n2-explore', points: 3, feedback: 'Perfecto. Explore PRIMERO, act DESPUES. Plan Mode te deja entender el codebase sin riesgo de cambios accidentales. Este es el paso 1 del workflow de 4 fases.' },
        { text: 'Le digo directamente: "arregla el bug en /api/invoices que da 500 cuando no hay direccion"', nextId: 'n2-dive', points: 0, feedback: 'Demasiado rapido. Sin entender la estructura, Claude Code va a adivinar donde esta el problema. Podria editar el archivo equivocado o no entender las relaciones entre modelos.' },
        { text: 'Abro el codigo manualmente, busco el endpoint, y le paso el archivo exacto a Claude Code', nextId: 'n2-manual', points: 1, feedback: 'Funciona, pero desaprovechas la capacidad de Claude Code de explorar el codebase por vos. Plan Mode hace exactamente esto, mas rapido y con mas contexto.' },
      ]
    },
    'n2-explore': {
      id: 'n2-explore',
      narrative: 'En Plan Mode, Claude Code exploro el codebase y te muestra:\n\n- El endpoint esta en src/routers/invoices.py linea 47\n- Usa InvoiceService.generate() que llama a BillingAddress.get_or_raise()\n- El modelo BillingAddress no tiene un caso para cliente sin direccion\n- Hay 12 tests en tests/routers/test_invoices.py pero ninguno cubre el caso "sin direccion"\n\nAhora tenes un mapa mental claro del problema. \u00bfComo procedes?',
      choices: [
        { text: 'Salgo de Plan Mode (Shift+Tab), escribo un prompt estructurado: Contexto (lo que explore) + Objetivo (fix el null case) + Constraint (no romper tests existentes)', nextId: 'n3-structured', points: 3, feedback: 'Excelente. El prompt estructurado con Context + Objective + Constraints es la forma mas efectiva de comunicarte con Claude Code. Le das toda la info que necesita sin ambiguedad.' },
        { text: 'Le digo "arregla el bug" sin mas contexto, ya exploro todo', nextId: 'n3-vague', points: 1, feedback: 'Claude Code ya tiene contexto de la exploracion, pero un prompt vago puede llevar a una solucion que no se alinea con lo que vos esperabas. Mejor ser explicito.' },
        { text: 'Le pido que arregle el bug Y refactorice todo el modulo de invoices de paso', nextId: 'n3-kitchen-sink', points: 0, feedback: 'Este es el patron Kitchen Sink: meter todo en un prompt. El bug es una cosa, el refactoring es otra. Mezclarlos lleva a cambios impredecibles y dificiles de revisar.' },
      ]
    },
    'n2-dive': {
      id: 'n2-dive',
      narrative: 'Claude Code intento arreglar el bug directamente. Edito src/routers/invoices.py y agrego un try/except generico que atrapa TODOS los errores y devuelve un 400.\n\nEl bug original se "arregla" pero ahora cualquier error en el endpoint (incluso errores de base de datos) devuelve 400 en vez de 500. Enmascaras errores reales.\n\nEl tech lead te rechaza el PR: "Esto es un band-aid, no un fix".\n\n\u00bfComo replanteamos?',
      choices: [
        { text: 'Uso /clear para limpiar el contexto degradado, activo Plan Mode, y empiezo de nuevo con exploracion', nextId: 'n3-recover', points: 3, feedback: 'Correcto. Cuando una sesion va mal, /clear es tu mejor amigo. Limpia el contexto degradado y te da un fresh start. Mucho mejor que seguir corrigiendo sobre correcciones.' },
        { text: 'Le digo "no, eso esta mal, arreglalo de otra forma" en la misma sesion', nextId: 'n3-spiral', points: 0, feedback: 'Este es el patron Correction Spiral. Cada correccion en la misma sesion degrada mas el contexto. Claude Code ve tus correcciones anteriores, se confunde con instrucciones contradictorias, y el resultado empeora.' },
      ]
    },
    'n2-manual': {
      id: 'n2-manual',
      narrative: 'Encontraste el archivo manualmente. Le pasas el codigo a Claude Code.\n\nTiene el archivo pero no el contexto completo: no sabe que modelo usa, como se llama el servicio, ni que tests existen.\n\n\u00bfComo mejoras la situacion?',
      choices: [
        { text: 'Le pido que explore los modelos y tests relacionados antes de hacer cambios (Plan Mode)', nextId: 'n2-explore', points: 2, feedback: 'Bien, nunca es tarde para explorar. Plan Mode te hubiera dado todo esto en un paso.' },
        { text: 'Le doy el fix exacto que quiero y que lo implemente', nextId: 'n3-vague', points: 1, feedback: 'Si ya sabes el fix, esto funciona. Pero le quitaste la posibilidad de encontrar una solucion mejor o de detectar problemas que no viste.' },
      ]
    },
    'n3-structured': {
      id: 'n3-structured',
      narrative: 'Le escribiste:\n\n"Contexto: BillingAddress.get_or_raise() falla con 500 cuando el cliente no tiene direccion. El endpoint esta en src/routers/invoices.py:47, el servicio en src/services/invoice.py.\n\nObjetivo: Manejar el caso de cliente sin direccion devolviendo un 422 con mensaje descriptivo.\n\nConstraints: No modificar tests existentes. Agregar un test nuevo para este caso. Seguir el patron de error handling que ya usa el proyecto."\n\nClaude Code implementa el fix: modifica el servicio para hacer un check previo y devolver un error tipado. Agrega un test. Los 400+ tests existentes siguen pasando.\n\n\u00bfComo verificas antes de commitear?',
      choices: [
        { text: 'Corro los tests (pytest), verifico el git diff completo, y testeo el endpoint manualmente con curl', nextId: 'n4-verify', points: 3, feedback: 'Triple verificacion: tests automaticos + diff review + test manual. Esta es la practica #1 de todo usuario profesional de Claude Code. "Trust but verify" no es un slogan, es un proceso.' },
        { text: 'Los tests pasan, hago commit directo', nextId: 'n4-skip-verify', points: 1, feedback: 'Los tests pasan, bien. Pero no revisaste el diff. Claude Code podria haber cambiado algo inesperado fuera del scope del bug. Siempre revisa el diff.' },
        { text: 'Le pido a Claude Code que haga el commit automaticamente', nextId: 'n4-auto-commit', points: 0, feedback: 'NUNCA auto-commitees sin revisar. Es como firmar un contrato sin leerlo. El diff review es tu ultima linea de defensa antes de que el codigo entre al repo.' },
      ]
    },
    'n3-vague': {
      id: 'n3-vague',
      narrative: 'Claude Code hace un fix que funciona, pero usa un patron de error handling diferente al del resto del proyecto. El fix esta correcto pero es inconsistente.\n\n\u00bfQue haces?',
      choices: [
        { text: 'Le pido que revise como se manejan errores en otros endpoints y que siga ese patron', nextId: 'n4-verify', points: 2, feedback: 'Buena recuperacion. Si le hubieras dado este constraint desde el principio, no tendrias que corregir.' },
        { text: 'Lo acepto como esta, funciona', nextId: 'n4-skip-verify', points: 1, feedback: 'Funciona pero introduce inconsistencia. Con el tiempo, cada endpoint maneja errores diferente. Tech debt silencioso.' },
      ]
    },
    'n3-kitchen-sink': {
      id: 'n3-kitchen-sink',
      narrative: 'Claude Code intento hacer el bug fix Y el refactoring en un solo paso. Resultado: 47 archivos modificados, 800+ lineas cambiadas.\n\nEl diff es imposible de revisar. Algunos tests fallan porque el refactoring rompio imports. No sabes si el bug esta arreglado porque todo cambio al mismo tiempo.\n\n\u00bfComo salvas la situacion?',
      choices: [
        { text: 'Uso /clear, empiezo de nuevo, y hago SOLO el bug fix. El refactoring sera una tarea separada', nextId: 'n3-recover', points: 3, feedback: 'Perfecto. Una tarea, un prompt, un commit. El Kitchen Sink es el error mas comun y el mas caro. /clear y fresh start.' },
        { text: 'Intento salvar los cambios revertiendo solo los archivos que no necesitaba', nextId: 'n4-skip-verify', points: 1, feedback: 'Cherry-picking cambios de un diff de 800 lineas es un infierno. Es mas rapido empezar de cero con scope claro.' },
      ]
    },
    'n3-recover': {
      id: 'n3-recover',
      narrative: 'Usaste /clear. Contexto limpio. Ahora estas en Plan Mode explorando el codebase correctamente.\n\nDespues de entender la estructura, escribis un prompt estructurado y Claude Code implementa un fix limpio.\n\n\u00bfComo verificas?',
      choices: [
        { text: 'Tests + git diff + prueba manual del endpoint', nextId: 'n4-verify', points: 3, feedback: 'La verificacion triple. Aprendiste de los errores anteriores.' },
        { text: 'Tests pasan, commit directo', nextId: 'n4-skip-verify', points: 1, feedback: 'Mejor que antes, pero el diff review es una practica no-negociable.' },
      ]
    },
    'n3-spiral': {
      id: 'n3-spiral',
      narrative: 'Cuarta correccion en la misma sesion. El contexto esta lleno de tus instrucciones contradictorias. Claude Code ahora mezcla partes de las 4 versiones anteriores.\n\nEl codigo es un Frankenstein. Ningun test pasa.\n\n\u00bfQue haces?',
      choices: [
        { text: '/clear y empezar de cero con Plan Mode + prompt estructurado', nextId: 'n3-recover', points: 3, feedback: 'Finalmente. /clear debio haber sido tu primera reaccion al ver que la sesion iba mal. Cada correccion sobre contexto degradado empeora las cosas.' },
        { text: 'Sigo intentando en la misma sesion, a la quinta sera', nextId: 'outcome-critical', points: 0, feedback: 'El Correction Spiral es infinito. El contexto degradado no se arregla agregando mas contexto degradado. /clear es la unica salida.' },
      ]
    },
    'n4-verify': {
      id: 'n4-verify',
      narrative: 'Verificacion completa:\n\n- pytest: 401/401 tests pasan (incluyendo el nuevo)\n- git diff: solo 3 archivos cambiados, todos dentro del scope\n- curl: GET /api/invoices?client_id=42 devuelve 422 con mensaje descriptivo\n\nTodo limpio. \u00bfComo haces el commit?',
      choices: [
        { text: 'Escribo un commit con conventional commits: "fix(invoices): handle missing billing address with 422 response" con descripcion del cambio', nextId: 'outcome-excellent', points: 3, feedback: 'Impecable. Conventional commits, scope claro, descripcion util. El commit message es documentacion para el futuro.' },
        { text: 'Le pido a Claude Code que genere el commit message por mi', nextId: 'outcome-good', points: 2, feedback: 'Funciona, Claude Code genera buenos commit messages. Pero siempre revisalo antes de confirmar. A veces incluye demasiado detalle o un scope incorrecto.' },
        { text: 'git commit -m "fix bug"', nextId: 'outcome-needs-work', points: 0, feedback: '"fix bug" no dice nada. En 6 meses, cuando busques este commit en el historial, no vas a saber que bug arregla, en que modulo, ni por que.' },
      ]
    },
    'n4-skip-verify': {
      id: 'n4-skip-verify',
      narrative: 'Hiciste commit sin revisar el diff completo. El PR pasa CI, pero un companero nota que Claude Code modifico un archivo de migracion que no deberia haber tocado.\n\nTenes que revertir parte del commit y hacer un fixup. 30 minutos perdidos.\n\n\u00bfLeccion aprendida?',
      choices: [
        { text: 'Siempre revisar git diff antes de commitear. Los 2 minutos de revision te ahorran 30 de cleanup', nextId: 'outcome-needs-work', points: 2, feedback: 'Exacto. El diff review es la inversion de tiempo mas rentable en el workflow con agentes de codigo.' },
        { text: 'El CI deberia haber detectado el problema, no es mi responsabilidad revisar cada linea', nextId: 'outcome-critical', points: 0, feedback: 'El CI detecta errores de build y tests, no cambios fuera de scope. La revision humana del diff detecta cosas que ningun CI puede: cambios innecesarios, archivos que no deberian haberse tocado, y patrones incorrectos.' },
      ]
    },
    'n4-auto-commit': {
      id: 'n4-auto-commit',
      narrative: 'Claude Code hizo el commit. Pero incluyo un cambio en el .env.example que agrega una variable que no existe en produccion. Y el commit message dice "Update invoices module" sin explicar que cambio.\n\nEl PR es rechazado por el equipo. Tenes que revert, limpiar, y volver a hacer el proceso.\n\n\u00bfComo evitas esto la proxima vez?',
      choices: [
        { text: 'Nunca auto-commitear. Siempre: tests + diff review + commit message propio', nextId: 'outcome-needs-work', points: 2, feedback: 'Correcto. El commit es TU responsabilidad, no del agente. Vos firmas el cambio.' },
        { text: 'Agregar una regla en CLAUDE.md para que no toque .env files', nextId: 'outcome-needs-work', points: 1, feedback: 'Eso previene UN caso, pero el problema de fondo es no revisar antes de commitear. La regla ayuda, la revision es obligatoria.' },
      ]
    },
    // OUTCOMES
    'outcome-excellent': {
      id: 'outcome-excellent',
      narrative: '',
      outcome: {
        title: 'Claude Code Pro',
        description: 'Dominaste el workflow completo: Explore con Plan Mode, Plan con prompt estructurado, Implement con verificacion, y Commit con conventional commits. Asi trabaja un profesional con Claude Code.',
        score: 18,
        maxScore: 18,
        grade: 'excellent',
        lessons: [
          'Explore PRIMERO con Plan Mode (Shift+Tab): entende el codebase antes de tocar nada',
          'Prompts estructurados: Context + Objective + Constraints eliminan ambiguedad',
          'Verificacion triple: tests + git diff + prueba manual es no-negociable',
          '/clear entre tareas no relacionadas: contexto limpio = mejores resultados',
          'Conventional commits con scope: documentacion para tu yo futuro'
        ]
      }
    },
    'outcome-good': {
      id: 'outcome-good',
      narrative: '',
      outcome: {
        title: 'Buen Trabajo',
        description: 'Entiendes el workflow profesional con Claude Code. Algunas decisiones podrian optimizarse, pero tu enfoque general es solido.',
        score: 12,
        maxScore: 18,
        grade: 'good',
        lessons: [
          'Plan Mode es tu primer paso: exploracion read-only antes de cualquier cambio',
          'Un prompt vago genera codigo funcional pero inconsistente. Se especifico.',
          'La verificacion no es opcional: tests + diff + prueba manual',
          'Cuando una sesion va mal, /clear es mas rapido que seguir corrigiendo',
          'El commit message es documentacion, no un tramite'
        ]
      }
    },
    'outcome-needs-work': {
      id: 'outcome-needs-work',
      narrative: '',
      outcome: {
        title: 'Necesitas Practica',
        description: 'Cometiste errores comunes que todo usuario nuevo de Claude Code comete. La buena noticia: son faciles de corregir una vez que los reconoces.',
        score: 6,
        maxScore: 18,
        grade: 'needs-work',
        lessons: [
          'NUNCA saltar la fase de exploracion: entender antes de actuar',
          'El Kitchen Sink (todo en un prompt) es el error mas caro',
          'Revisar git diff SIEMPRE: 2 minutos te ahorran 30 de cleanup',
          '/clear cuando la sesion se degrada: no sigas corrigiendo sobre errores',
          'El agente genera codigo, VOS sos responsable de lo que se commitea'
        ]
      }
    },
    'outcome-critical': {
      id: 'outcome-critical',
      narrative: '',
      outcome: {
        title: 'Riesgo Critico',
        description: 'Tu workflow con Claude Code tiene problemas serios. Sin exploracion, sin verificacion, y con correction spirals, el agente te genera mas problemas de los que resuelve. Repasa este modulo.',
        score: 2,
        maxScore: 18,
        grade: 'critical',
        lessons: [
          'El Correction Spiral es infinito: /clear y empezar de cero',
          'Sin Plan Mode, Claude Code adivina. Y adivinar cuesta caro.',
          'El diff review es TU responsabilidad, no del CI ni del agente',
          'Commitear sin revisar es firmar un contrato sin leerlo',
          'Claude Code es una herramienta poderosa: usada mal, es una herramienta de destruccion poderosa'
        ]
      }
    },
  };

  // ─── Quiz ───
  const quizQuestions = [
    {
      question: 'Estas trabajando en un proyecto complejo que no tocas hace semanas. Abris Claude Code. \u00bfCual es el primer paso del workflow profesional?',
      options: [
        { text: 'Escribir el prompt de lo que necesitas y dejar que Claude Code explore por su cuenta', correct: false, explanation: 'Claude Code va a explorar, pero sin Plan Mode puede empezar a editar archivos antes de tener el panorama completo. Vos controlas cuando pasa de lectura a escritura.' },
        { text: 'Activar Plan Mode (Shift+Tab) y explorar: estructura, archivos relevantes, tests existentes', correct: true, explanation: 'Correcto. Plan Mode es read-only: Claude Code puede leer archivos, buscar codigo y analizar estructura, pero NO puede editar ni ejecutar comandos. Explore PRIMERO, act DESPUES.' },
        { text: 'Leer el CLAUDE.md del proyecto para recordar las convenciones', correct: false, explanation: 'Claude Code lee el CLAUDE.md automaticamente al iniciar. No necesitas leerlo vos manualmente. Lo que si necesitas es explorar el estado actual del codigo con Plan Mode.' },
        { text: 'Ejecutar los tests para ver si algo esta roto', correct: false, explanation: 'Correr tests es importante, pero es parte de la fase de verificacion, no de exploracion. Primero entende que vas a cambiar, despues verifica.' },
      ],
      source: 'Claude Code Best Practices',
      sourceUrl: 'https://code.claude.com/docs/en/best-practices'
    },
    {
      question: 'Estas en tu tercer intento de corregir un bug en la misma sesion. Cada correccion introduce un nuevo problema. \u00bfQue patron de fracaso es y como lo solucionas?',
      options: [
        { text: 'Kitchen Sink. Solucion: dividir la tarea en prompts mas pequenos.', correct: false, explanation: 'Kitchen Sink es meter multiples tareas en un prompt. Aqui el problema es diferente: estas corrigiendo repetidamente en una sesion degradada.' },
        { text: 'Correction Spiral. Solucion: usar /clear y empezar de cero con un prompt limpio.', correct: true, explanation: 'Correcto. El Correction Spiral ocurre cuando corriges sobre correcciones en la misma sesion. El contexto se llena de instrucciones contradictorias y el resultado empeora. /clear borra todo y te da un fresh start.' },
        { text: 'Infinite Exploration. Solucion: usar /compact para reducir el contexto.', correct: false, explanation: 'Infinite Exploration es cuando el agente lee demasiados archivos sin actuar. Aqui el problema es lo opuesto: esta actuando (mal) repetidamente.' },
        { text: 'Over-specified CLAUDE.md. Solucion: simplificar las instrucciones del proyecto.', correct: false, explanation: 'El CLAUDE.md no es el problema. El problema es acumular correcciones contradictorias en la misma sesion.' },
      ],
      source: 'Steve Kinney - Claude Code Deep Dive',
      sourceUrl: 'https://www.builder.io/blog/claude-code'
    },
    {
      question: 'Tu equipo usa Claude Code con Opus para todo. El costo mensual se disparo a $2000/desarrollador. \u00bfCual combinacion de tecnicas reduce mas el gasto?',
      options: [
        { text: 'Usar solo Sonnet para todo: es mas barato por token', correct: false, explanation: 'Sonnet es mas barato per-token, pero necesita mas iteraciones en tareas complejas (planning, arquitectura). El costo total puede ser similar o peor.' },
        { text: '/clear entre tareas (50-70% ahorro) + opusplan strategy (Opus para planning, Sonnet para ejecucion)', correct: true, explanation: 'Correcto. /clear evita que el contexto crezca innecesariamente entre tareas no relacionadas (el mayor desperdicio). Opusplan usa Opus donde importa (reasoning) y Sonnet donde es suficiente (ejecucion). Juntos, pueden reducir costos 60-80%.' },
        { text: 'Limitar Claude Code a 10 mensajes por sesion', correct: false, explanation: 'Limites artificiales reducen la productividad sin atacar la causa real del gasto: contexto innecesario y uso de Opus para tareas que no lo necesitan.' },
        { text: 'Usar solo batch API para todo', correct: false, explanation: 'Batch API da 50% de descuento pero solo sirve para tareas no-interactivas (CI/CD, linting, reviews). No podes usarla para desarrollo interactivo diario.' },
      ],
      source: 'Claude Code - Cost Management',
      sourceUrl: 'https://code.claude.com/docs/en/costs'
    },
    {
      question: 'Claude Code termino de implementar un fix. Los tests pasan. \u00bfQue verificacion FALTA antes de commitear?',
      options: [
        { text: 'Nada, si los tests pasan el codigo esta bien', correct: false, explanation: 'Los tests verifican comportamiento, no scope. Claude Code pudo haber modificado archivos fuera del scope del fix (migraciones, configs, .env) que los tests no cubren.' },
        { text: 'Revisar el git diff completo para verificar que solo se modificaron archivos dentro del scope', correct: true, explanation: 'Correcto. El diff review detecta cambios fuera de scope, archivos tocados innecesariamente, y patrones inconsistentes. Es la verificacion que ningun CI puede reemplazar. Tests + diff + prueba manual = verificacion completa.' },
        { text: 'Pedirle a Claude Code que confirme que el cambio es correcto', correct: false, explanation: 'Claude Code SIEMPRE va a decir que su cambio es correcto. No es un revisor objetivo de su propio trabajo. El diff review lo haces VOS.' },
        { text: 'Correr el linter para verificar el estilo', correct: false, explanation: 'El linter es util pero solo verifica estilo y syntax. No verifica que Claude Code haya tocado solo los archivos correctos ni que la logica sea la esperada.' },
      ],
      source: 'incident.io - Shipping Faster with Claude Code',
      sourceUrl: 'https://incident.io/blog/shipping-faster-with-claude-code-and-git-worktrees'
    },
    {
      question: 'Necesitas trabajar en 3 features al mismo tiempo. \u00bfCual es la forma mas eficiente de hacerlo con Claude Code?',
      options: [
        { text: 'Alternar entre ramas en la misma sesion de Claude Code, usando /clear entre features', correct: false, explanation: '/clear entre features esta bien, pero cambiar ramas en la misma terminal genera conflictos y confusion. Hay una solucion mejor.' },
        { text: 'Abrir 3 ventanas de terminal, cada una con una sesion de Claude Code en la misma carpeta', correct: false, explanation: '3 sesiones en la misma carpeta van a pisar los cambios entre si. Cada sesion ve los archivos de las otras y se genera caos.' },
        { text: 'Usar worktrees: "claude -w feature-name" crea un git worktree aislado con su propia sesion', correct: true, explanation: 'Correcto. Git worktrees crean copias aisladas del repo, cada una en su propia rama. Claude Code con -w crea un worktree y abre una sesion ahi. 3-5 sesiones paralelas sin conflictos. Es el patron de Boris Cherny e incident.io.' },
        { text: 'Trabajar las 3 features secuencialmente, una a la vez', correct: false, explanation: 'Funciona pero es la opcion mas lenta. Los worktrees te dejan paralelizar sin riesgo de conflictos.' },
      ],
      source: 'Boris Cherny - 22 Tips for Claude Code',
      sourceUrl: 'https://www.builder.io/blog/claude-code-tips'
    }
  ];
</script>

<svelte:head>
  <title>Modulo 5: {mod.title} | Agent Mastery</title>
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

  <!-- THEORY SECTION 1: El Workflow de 4 Fases -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Workflow de 4 Fases</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Hay una diferencia enorme entre <strong class="text-agent-text">usar</strong> Claude Code y <strong class="text-agent-text">trabajar CON</strong> Claude Code. Usar es abrir la terminal y tirar prompts. Trabajar con es seguir un workflow disciplinado que maximiza la calidad del output y minimiza los errores.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      El workflow profesional tiene 4 fases, y el orden <strong class="text-agent-highlight">no es negociable</strong>. Saltarte una fase es como empezar a construir una casa sin los planos: vas a tener que demoler y reconstruir.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Anthropic mismo documentan este flujo en sus best practices: "Give Claude Code the context it needs before asking it to act." El equipo de incident.io, que corren 4-7 sesiones en paralelo, reportan que saltarse la exploracion duplica el tiempo de las tareas porque el agente va por caminos incorrectos que hay que revertir.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card border-l-4 border-l-agent-accent bg-agent-dark">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128269;</span>
          <h3 class="text-agent-text font-bold">Fase 1: Explore</h3>
        </div>
        <p class="text-xs text-agent-accent font-bold mb-2">Shift+Tab &#8594; Plan Mode</p>
        <p class="text-sm text-agent-muted mb-2">Usa Plan Mode para entender el codebase. Claude Code puede leer archivos, buscar codigo, analizar estructura, pero <strong class="text-agent-text">NO puede editar ni ejecutar comandos</strong>.</p>
        <p class="text-xs text-agent-muted">Pregunta: "Que archivos estan involucrados en el endpoint /api/invoices? Que modelos usa? Que tests existen?"</p>
      </div>

      <div class="card border-l-4 border-l-purple-500 bg-agent-dark">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#128203;</span>
          <h3 class="text-agent-text font-bold">Fase 2: Plan</h3>
        </div>
        <p class="text-xs text-purple-400 font-bold mb-2">Ctrl+G para aceptar plan</p>
        <p class="text-sm text-agent-muted mb-2">Disena la solucion. Claude Code propone un plan basado en la exploracion. Vos lo revisas, ajustas, y aceptas. Para decisiones complejas, activa extended thinking.</p>
        <p class="text-xs text-agent-muted">El plan debe ser lo suficientemente especifico para que la implementacion no tenga ambiguedad.</p>
      </div>

      <div class="card border-l-4 border-l-agent-success bg-agent-dark">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#9881;&#65039;</span>
          <h3 class="text-agent-text font-bold">Fase 3: Implement</h3>
        </div>
        <p class="text-xs text-agent-success font-bold mb-2">Prompt estructurado: C+O+C</p>
        <p class="text-sm text-agent-muted mb-2">Dale a Claude Code un prompt claro con <strong class="text-agent-text">Context</strong> (lo que existe), <strong class="text-agent-text">Objective</strong> (que hacer), y <strong class="text-agent-text">Constraints</strong> (como hacerlo).</p>
        <p class="text-xs text-agent-muted">Verifica cada paso. Si algo sale mal, no corrijas en la misma sesion: usa /clear.</p>
      </div>

      <div class="card border-l-4 border-l-agent-warning bg-agent-dark">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">&#9989;</span>
          <h3 class="text-agent-text font-bold">Fase 4: Commit</h3>
        </div>
        <p class="text-xs text-agent-warning font-bold mb-2">Tests + Diff + Manual = Commit</p>
        <p class="text-sm text-agent-muted mb-2">Corre tests, revisa el git diff <strong class="text-agent-text">completo</strong>, testea manualmente si es UI. Solo despues de la triple verificacion, escribi el commit con conventional commits.</p>
        <p class="text-xs text-agent-muted">NUNCA auto-commitees. El commit es TU firma sobre el codigo.</p>
      </div>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-danger rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun: Saltarse la exploracion</p>
      <p class="text-sm text-agent-muted">El 90% de los problemas con Claude Code vienen de saltarse la Fase 1. Cuando le pedis que implemente algo sin contexto, adivina. Y un agente que adivina es un agente que genera codigo inconsistente, toca archivos que no deberia, y usa patrones equivocados. Plan Mode existe para evitar esto.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: Plan Mode a Fondo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Plan Mode a Fondo</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Plan Mode es la feature mas subestimada de Claude Code. Shift+Tab lo activa, Shift+Tab lo desactiva. Mientras esta activo, Claude Code esta en <strong class="text-agent-highlight">modo lectura</strong>: puede explorar todo el codebase, pero no puede modificar nada.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Pensalo como la diferencia entre ir a una libreria a hojear libros vs ir a comprar. En Plan Mode estas hojeando: lees, entendes, armas un mapa mental. Cuando desactivas Plan Mode, pasas a la accion con toda la informacion.
    </p>

    <div class="card bg-agent-dark mb-6">
      <h3 class="text-agent-text font-bold mb-3">Que puede hacer Claude Code en Plan Mode</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-agent-success font-bold mb-2">&#10003; Permitido (read-only)</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li>&#8226; Leer archivos del proyecto</li>
            <li>&#8226; Buscar codigo con grep/ripgrep</li>
            <li>&#8226; Analizar la estructura del proyecto</li>
            <li>&#8226; Listar directorios</li>
            <li>&#8226; Explicar como funciona el codigo</li>
            <li>&#8226; Proponer un plan de accion</li>
          </ul>
        </div>
        <div>
          <p class="text-xs text-agent-danger font-bold mb-2">&#10007; Bloqueado</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li>&#8226; Editar archivos</li>
            <li>&#8226; Crear archivos nuevos</li>
            <li>&#8226; Ejecutar comandos de terminal</li>
            <li>&#8226; Instalar paquetes</li>
            <li>&#8226; Correr tests</li>
            <li>&#8226; Hacer commits</li>
          </ul>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Prompts de exploracion efectivos</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      No basta con activar Plan Mode; hay que hacer las preguntas correctas. Aca van ejemplos reales de prompts de exploracion que le sacan el jugo a la fase de Explore:
    </p>

    {@html `<pre class="code-block text-xs mb-4"># Para entender un modulo que no tocas hace semanas:
"Explorame el modulo de autenticacion: que archivos lo componen,
que patron arquitectonico usa, y que tests tiene.
Quiero un resumen de 5 lineas."

# Para investigar un bug:
"Busca todos los archivos involucrados en el endpoint
GET /api/invoices. Trazame el flujo desde el router
hasta la query de base de datos. Marcame donde podria
fallar si el cliente no tiene billing address."

# Para entender antes de refactorizar:
"Mapeame todas las dependencias de InvoiceService:
que clases lo usan, que clases usa, y que tests lo cubren.
Quiero saber el blast radius si lo modifico."</pre>`}

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: incident.io</p>
      <p class="text-sm text-agent-muted">El equipo de incident.io reporta que usan Plan Mode como "sesion de onboarding" cada vez que retoman un area del codigo que no tocaron recientemente. Les toma 2-3 minutos de exploracion pero les ahorra 15-20 minutos de backtracking cuando el agente toma caminos incorrectos por falta de contexto.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Plan Mode vs Modo Normal: El modelo mental</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La confusion mas comun es pensar que Plan Mode es "solo para planificar". En realidad, Plan Mode es un <strong class="text-agent-text">sandbox de lectura</strong>. Podes usarlo para cualquier tarea donde necesites informacion sin riesgo de efectos secundarios.
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Escenario</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Plan Mode?</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Por que</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Entender un modulo antes de modificarlo</td>
            <td class="py-3 px-4 text-agent-success">Si</td>
            <td class="py-3 px-4">Necesitas info, no cambios</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Buscar donde se usa una funcion</td>
            <td class="py-3 px-4 text-agent-success">Si</td>
            <td class="py-3 px-4">Busqueda pura, zero edicion</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Evaluar el impacto de un cambio propuesto</td>
            <td class="py-3 px-4 text-agent-success">Si</td>
            <td class="py-3 px-4">Analisis de blast radius sin tocar nada</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Implementar el fix despues de planificar</td>
            <td class="py-3 px-4 text-agent-danger">No</td>
            <td class="py-3 px-4">Necesitas editar archivos</td>
          </tr>
          <tr>
            <td class="py-3 px-4">Correr tests para verificar</td>
            <td class="py-3 px-4 text-agent-danger">No</td>
            <td class="py-3 px-4">Tests requieren ejecutar comandos</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-danger rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun: Plan Mode como muleta</p>
      <p class="text-sm text-agent-muted">Algunos devs se quedan en Plan Mode demasiado tiempo, explorando eternamente sin pasar a la accion. La exploracion debe tener un objetivo claro y un limite. Si despues de 3-4 preguntas en Plan Mode no tenes un plan concreto, el problema es que no sabes que queres hacer, no que te falta informacion.</p>
    </div>
  </section>

  <!-- THEORY SECTION 3: Verificacion como Practica #1 -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Verificacion: La Practica #1</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Si te quedas con una sola idea de este modulo, que sea esta: <strong class="text-agent-highlight">"Trust but verify"</strong>. No es un slogan; es un proceso concreto con 3 pasos que ejecutas CADA VEZ que Claude Code termina de hacer cambios.
    </p>
    <p class="text-agent-muted leading-relaxed mb-4">
      Anthropic lo dice explicitamente en sus best practices: "Always review changes before committing." El equipo de incident.io lo confirma: los desarrolladores que revisan diffs encuentran problemas en el 30% de los cambios generados por agentes. No errores de sintaxis (esos los atrapan los tests), sino cambios fuera de scope, patrones inconsistentes, y archivos tocados innecesariamente.
    </p>

    <div class="card bg-agent-dark mb-6">
      <h3 class="text-agent-text font-bold mb-3">La Triple Verificacion</h3>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <span class="text-agent-accent font-bold text-lg shrink-0">1.</span>
          <div>
            <p class="text-agent-text font-bold">Tests automaticos</p>
            <p class="text-sm text-agent-muted">Corre toda la suite de tests. No solo los tests del archivo que cambio; todos. Un cambio en un servicio puede romper un test en otro modulo.</p>
            {@html `<pre class="code-block text-xs mt-2">pytest                     # Toda la suite
npm run test               # Frontend tests
npm run check              # Type checking</pre>`}
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent font-bold text-lg shrink-0">2.</span>
          <div>
            <p class="text-agent-text font-bold">Git diff completo</p>
            <p class="text-sm text-agent-muted">Revisa CADA archivo modificado. Busca: archivos fuera de scope, cambios en configs que no pediste, imports removidos, y patrones inconsistentes con el resto del proyecto.</p>
            {@html `<pre class="code-block text-xs mt-2">git diff --stat            # Vista rapida: que archivos cambiaron
git diff                   # Diff completo linea por linea</pre>`}
          </div>
        </div>
        <div class="flex items-start gap-3">
          <span class="text-agent-accent font-bold text-lg shrink-0">3.</span>
          <div>
            <p class="text-agent-text font-bold">Prueba manual</p>
            <p class="text-sm text-agent-muted">Si es API: curl o Postman. Si es UI: screenshot o navegador. Si es CLI: ejecuta el comando. Los tests automaticos cubren los happy paths; la prueba manual cubre los edge cases que no pensaste testear.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">La verificacion es tu <strong class="text-agent-text">ultima linea de defensa</strong>. Claude Code es increiblemente capaz, pero opera en un espacio probabilistico. Cada generacion tiene una distribucion de posibles outputs. La verificacion es lo que asegura que el output que obtuviste es el correcto para tu caso.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El checklist de verificacion en la practica</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      No todos los cambios necesitan la misma intensidad de verificacion. Usa esta guia para calibrar cuanto revisar segun el riesgo:
    </p>

    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Tipo de cambio</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Riesgo</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Verificacion minima</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Typo en documentacion</td>
            <td class="py-3 px-4"><span class="text-xs bg-agent-success/20 text-agent-success px-2 py-0.5 rounded">Bajo</span></td>
            <td class="py-3 px-4">git diff (30 seg)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Bug fix en un endpoint</td>
            <td class="py-3 px-4"><span class="text-xs bg-agent-warning/20 text-agent-warning px-2 py-0.5 rounded">Medio</span></td>
            <td class="py-3 px-4">Tests + diff + curl (5 min)</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Refactoring de modulo completo</td>
            <td class="py-3 px-4"><span class="text-xs bg-agent-danger/20 text-agent-danger px-2 py-0.5 rounded">Alto</span></td>
            <td class="py-3 px-4">Tests + diff linea-por-linea + manual + peer review (15 min)</td>
          </tr>
          <tr>
            <td class="py-3 px-4">Cambio en autenticacion/seguridad</td>
            <td class="py-3 px-4"><span class="text-xs bg-agent-danger/20 text-agent-danger px-2 py-0.5 rounded">Critico</span></td>
            <td class="py-3 px-4">Todo lo anterior + security review dedicado</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">Steve Kinney (Builder.io) documenta que el <code class="text-agent-accent">git diff --stat</code> es el comando mas subestimado del workflow con Claude Code. Te muestra en 2 segundos que archivos fueron tocados y cuantas lineas cambiaron. Si esperabas 3 archivos y el diff muestra 12, algo salio mal antes de leer una sola linea de codigo.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Los 5 Patrones de Fracaso -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Los 5 Patrones de Fracaso</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Despues de observar cientos de sesiones de Claude Code (propias, del equipo, y de la comunidad), estos son los 5 patrones que mas dano causan. Conocerlos es la mitad de la batalla. Cada uno tiene un fix concreto.
    </p>

    <!-- Patron 1: Kitchen Sink -->
    <div class="card border-l-4 border-l-agent-danger mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-danger font-bold text-lg">1.</span>
        <h3 class="text-agent-text font-bold">Kitchen Sink</h3>
        <span class="text-xs bg-agent-danger/20 text-agent-danger px-2 py-0.5 rounded ml-auto">Alto impacto</span>
      </div>
      <p class="text-sm text-agent-muted mb-3">Meter todo en un solo prompt: "arregla el bug, refactoriza el modulo, agrega tests, y actualizame la documentacion".</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-agent-danger/10 rounded p-3">
          <p class="text-xs text-agent-danger font-bold mb-1">Problema</p>
          <p class="text-xs text-agent-muted">Claude Code intenta hacer todo a la vez. Genera un diff de 40+ archivos imposible de revisar. Los cambios se mezclan y si algo falla, no sabes que parte fue.</p>
        </div>
        <div class="bg-agent-success/10 rounded p-3">
          <p class="text-xs text-agent-success font-bold mb-1">Fix</p>
          <p class="text-xs text-agent-muted">Una tarea, un prompt, un commit. "Arregla el bug" es un prompt. "Refactoriza el modulo" es otro prompt, otro dia. Divide y conquista.</p>
        </div>
      </div>
    </div>

    <!-- Patron 2: Correction Spiral -->
    <div class="card border-l-4 border-l-agent-danger mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-danger font-bold text-lg">2.</span>
        <h3 class="text-agent-text font-bold">Correction Spiral</h3>
        <span class="text-xs bg-agent-danger/20 text-agent-danger px-2 py-0.5 rounded ml-auto">Alto impacto</span>
      </div>
      <p class="text-sm text-agent-muted mb-3">"No, eso esta mal. Hacelo asi." "Tampoco. Proba de esta otra forma." El contexto se llena de instrucciones contradictorias y cada intento es peor.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-agent-danger/10 rounded p-3">
          <p class="text-xs text-agent-danger font-bold mb-1">Problema</p>
          <p class="text-xs text-agent-muted">Claude Code ve tus 5 intentos anteriores y trata de satisfacer instrucciones contradictorias. El resultado es un Frankenstein de todos los intentos.</p>
        </div>
        <div class="bg-agent-success/10 rounded p-3">
          <p class="text-xs text-agent-success font-bold mb-1">Fix</p>
          <p class="text-xs text-agent-muted">Si el segundo intento falla: <strong class="text-agent-text">/clear</strong>. Empeza de cero con un prompt claro que incorpore las lecciones de los intentos fallidos. Contexto limpio = resultado limpio.</p>
        </div>
      </div>
    </div>

    <!-- Patron 3: Over-specified CLAUDE.md -->
    <div class="card border-l-4 border-l-agent-warning mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-warning font-bold text-lg">3.</span>
        <h3 class="text-agent-text font-bold">Over-specified CLAUDE.md</h3>
        <span class="text-xs bg-agent-warning/20 text-agent-warning px-2 py-0.5 rounded ml-auto">Medio impacto</span>
      </div>
      <p class="text-sm text-agent-muted mb-3">Un CLAUDE.md de 5000 palabras que intenta cubrir cada caso posible. El agente se pierde en un mar de reglas, muchas contradictorias entre si.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-agent-danger/10 rounded p-3">
          <p class="text-xs text-agent-danger font-bold mb-1">Problema</p>
          <p class="text-xs text-agent-muted">Mas instrucciones no significa mejores resultados. Despues de ~2500 tokens de instrucciones, la adherencia del agente empieza a bajar. Demasiadas reglas = ninguna regla se sigue bien.</p>
        </div>
        <div class="bg-agent-success/10 rounded p-3">
          <p class="text-xs text-agent-success font-bold mb-1">Fix</p>
          <p class="text-xs text-agent-muted">CLAUDE.md under 2.5K tokens con las reglas mas importantes. Para reglas especificas de carpetas, usa <code class="text-agent-accent">.claude/rules/</code> con globs que solo aplican a archivos relevantes.</p>
        </div>
      </div>
    </div>

    <!-- Patron 4: Trust-then-Verify Gap -->
    <div class="card border-l-4 border-l-agent-warning mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-warning font-bold text-lg">4.</span>
        <h3 class="text-agent-text font-bold">Trust-then-Verify Gap</h3>
        <span class="text-xs bg-agent-warning/20 text-agent-warning px-2 py-0.5 rounded ml-auto">Medio impacto</span>
      </div>
      <p class="text-sm text-agent-muted mb-3">Aceptar el output de Claude Code sin revisar el diff. "Los tests pasan, debe estar bien."</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-agent-danger/10 rounded p-3">
          <p class="text-xs text-agent-danger font-bold mb-1">Problema</p>
          <p class="text-xs text-agent-muted">Claude Code puede tocar archivos fuera del scope (migraciones, configs, .env). Los tests no detectan cambios de scope, solo comportamiento. Un archivo extra modificado pasa CI silenciosamente.</p>
        </div>
        <div class="bg-agent-success/10 rounded p-3">
          <p class="text-xs text-agent-success font-bold mb-1">Fix</p>
          <p class="text-xs text-agent-muted">La triple verificacion es innegociable: tests + git diff + prueba manual. Los 2 minutos de diff review te ahorran 30 de cleanup cuando el PR es rechazado.</p>
        </div>
      </div>
    </div>

    <!-- Patron 5: Infinite Exploration -->
    <div class="card border-l-4 border-l-agent-info mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-agent-info font-bold text-lg">5.</span>
        <h3 class="text-agent-text font-bold">Infinite Exploration</h3>
        <span class="text-xs bg-agent-info/20 text-agent-info px-2 py-0.5 rounded ml-auto">Bajo impacto</span>
      </div>
      <p class="text-sm text-agent-muted mb-3">El agente lee 30 archivos, analiza 15 dependencias, mapea todo el proyecto... y nunca hace el cambio. Se pierde en el analisis.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-agent-danger/10 rounded p-3">
          <p class="text-xs text-agent-danger font-bold mb-1">Problema</p>
          <p class="text-xs text-agent-muted">El contexto se llena de contenido de archivos que no son relevantes para la tarea. Tokens gastados en leer, no en actuar. El agente pierde foco.</p>
        </div>
        <div class="bg-agent-success/10 rounded p-3">
          <p class="text-xs text-agent-success font-bold mb-1">Fix</p>
          <p class="text-xs text-agent-muted">Acotar el scope: "Solo miremos src/services/invoice.py y sus tests". Si el contexto ya esta inflado, /compact para comprimir. Redirigir al agente: "Suficiente exploracion, implementa X".</p>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 5: Structured Prompting -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Structured Prompting: La Formula C+O+C</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un prompt mal estructurado lleva a resultados ambiguos. Un prompt bien estructurado lleva a resultados predecibles. La formula es simple: <strong class="text-agent-highlight">Context + Objective + Constraints</strong>. Siempre en ese orden.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Prompt vago</p>
        {@html `<pre class="code-block text-xs text-agent-muted">"Arregla el bug de invoices"</pre>`}
        <p class="text-xs text-agent-muted mt-2">Claude Code no sabe que bug, donde buscar, ni que restricciones seguir. Va a explorar todo el modulo y hacer su mejor guess.</p>
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Prompt estructurado (C+O+C)</p>
        {@html `<pre class="code-block text-xs text-agent-muted">"CONTEXTO: El endpoint GET /api/invoices
(src/routers/invoices.py:47) llama a
BillingAddress.get_or_raise() que falla con
500 cuando el cliente no tiene direccion.

OBJETIVO: Manejar el caso sin direccion
devolviendo 422 con mensaje descriptivo.

CONSTRAINTS: No modificar tests existentes.
Agregar test para el nuevo caso. Seguir el
patron de error handling de src/routers/users.py"</pre>`}
        <p class="text-xs text-agent-muted mt-2">Claude Code sabe exactamente donde buscar, que hacer, y como hacerlo. Zero ambiguedad.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Desglose de cada componente</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Componente</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Que incluir</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Ejemplo</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">Context</td>
            <td class="py-3 px-4">Archivos relevantes, estado actual, comportamiento observado</td>
            <td class="py-3 px-4 text-xs">"El servicio en src/services/auth.py usa JWT con PyJWT 2.8"</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">Objective</td>
            <td class="py-3 px-4">Que queres lograr, resultado esperado</td>
            <td class="py-3 px-4 text-xs">"Agregar refresh token con rotacion automatica"</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-highlight">Constraints</td>
            <td class="py-3 px-4">Patrones a seguir, archivos a no tocar, limites</td>
            <td class="py-3 px-4 text-xs">"Seguir el patron de src/services/session.py. No tocar las migraciones."</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-accent rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Tip: La referencia a archivos existentes es tu arma secreta</p>
      <p class="text-sm text-agent-muted">Cuando le decis a Claude Code "seguir el patron de src/services/session.py", va a leer ese archivo y replicar su estilo. Es como darle un ejemplo concreto en lugar de explicar el patron abstractamente. Mas efectivo, menos tokens.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Prompts avanzados: multi-paso y condicionales</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Para tareas mas complejas, el prompt puede incluir pasos secuenciales y condiciones. Esto le da a Claude Code un plan claro que puede seguir sin preguntarte en cada paso:
    </p>

    {@html `<pre class="code-block text-xs mb-4"># Prompt multi-paso con condiciones
"1. Lee src/services/payment.py y mapea todas
   las funciones publicas.

2. Para cada funcion que no tenga docstring,
   agrega una docstring Google style.

3. Si alguna funcion tiene mas de 30 lineas,
   NO la toques — marcala con un TODO.

4. Corre pytest tests/services/test_payment.py
   despues de cada cambio para verificar."</pre>`}

    <div class="bg-agent-dark border-l-4 border-l-agent-info rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: Steve Kinney (Builder.io)</p>
      <p class="text-sm text-agent-muted">Steve Kinney documenta que los prompts mas efectivos tienen 3 caracteristicas: son <strong class="text-agent-text">especificos</strong> (mencionan archivos exactos), son <strong class="text-agent-text">acotados</strong> (una tarea principal), y <strong class="text-agent-text">referencian ejemplos</strong> existentes en el codebase. Los prompts vagos generan resultados "correctos pero no lo que querias". Los prompts estructurados generan exactamente lo que necesitas.</p>
    </div>
  </section>

  <!-- THEORY SECTION 6: Comandos Esenciales -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Los Comandos que Definen tu Productividad</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code tiene comandos que no solo hacen tu vida mas facil, sino que son esenciales para mantener la calidad del output. Saber cuando usar cada uno es la diferencia entre un usuario casual y un profesional.
    </p>

    <div class="space-y-4 mb-6">
      <div class="card bg-agent-dark">
        <div class="flex items-center gap-3 mb-2">
          <code class="text-agent-accent font-bold text-lg">/clear</code>
          <span class="text-xs bg-agent-accent/20 text-agent-accent px-2 py-0.5 rounded">Critico</span>
        </div>
        <p class="text-sm text-agent-muted mb-2">Borra TODO el contexto de la sesion. Es como cerrar y reabrir Claude Code, pero mas rapido. El CLAUDE.md se recarga automaticamente.</p>
        <p class="text-xs text-agent-text font-bold mb-1">Cuando usarlo:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Entre tareas no relacionadas (bug fix &#8594; feature)</li>
          <li>&#8226; Despues de un Correction Spiral (mas de 2 correcciones)</li>
          <li>&#8226; Cuando notas que el output baja de calidad</li>
        </ul>
        <p class="text-xs text-agent-success mt-2">Ahorro estimado: 50-70% de tokens al no arrastrar contexto innecesario entre tareas.</p>
      </div>

      <div class="card bg-agent-dark">
        <div class="flex items-center gap-3 mb-2">
          <code class="text-agent-accent font-bold text-lg">/compact</code>
          <span class="text-xs bg-agent-warning/20 text-agent-warning px-2 py-0.5 rounded">Importante</span>
        </div>
        <p class="text-sm text-agent-muted mb-2">Comprime el contexto actual: resume mensajes largos, herramientas usadas, y resultados. Mantiene el hilo de la conversacion pero reduce el tamano.</p>
        <p class="text-xs text-agent-text font-bold mb-1">Cuando usarlo:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Cuando una tarea larga esta al 60%+ del context window</li>
          <li>&#8226; Cuando queres continuidad pero el contexto esta pesado</li>
          <li>&#8226; Antes de la ultima fase de una tarea compleja</li>
        </ul>
        <p class="text-xs text-agent-muted mt-2">A diferencia de /clear, /compact mantiene un resumen de lo hecho. Es como tomar notas antes de un examen.</p>
      </div>

      <div class="card bg-agent-dark">
        <div class="flex items-center gap-3 mb-2">
          <code class="text-agent-accent font-bold text-lg">/rewind</code>
          <span class="text-xs bg-agent-info/20 text-agent-info px-2 py-0.5 rounded">Util</span>
        </div>
        <p class="text-sm text-agent-muted mb-2">Vuelve a un punto anterior de la conversacion. Los cambios del agente en archivos se revierten. Es un "undo" que deshace tanto el contexto como los cambios en disco.</p>
        <p class="text-xs text-agent-text font-bold mb-1">Cuando usarlo:</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Cuando el agente tomo un camino incorrecto en el ultimo paso</li>
          <li>&#8226; Cuando queres probar una alternativa desde un punto anterior</li>
          <li>&#8226; Cuando el agente modifico un archivo que no deberia haber tocado</li>
        </ul>
        <p class="text-xs text-agent-muted mt-2">Mas quirurgico que /clear: vuelve atras sin perder todo el contexto previo.</p>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">La regla practica</p>
      <p class="text-sm text-agent-muted"><strong class="text-agent-text">/rewind</strong> si el ultimo paso salio mal. <strong class="text-agent-text">/compact</strong> si la sesion esta larga pero queres seguir. <strong class="text-agent-text">/clear</strong> si cambias de tarea o la sesion esta degradada. Cuando tengas dudas: <strong class="text-agent-text">/clear siempre es safe</strong>.</p>
    </div>
  </section>

  <!-- THEORY SECTION 7: Worktrees para Trabajo Paralelo -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Worktrees: Trabajo Paralelo sin Conflictos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Una de las ventajas mas poderosas de Claude Code es que podes correr <strong class="text-agent-highlight">multiples sesiones en paralelo</strong>. Pero no en la misma carpeta (se pisan los cambios). La solucion: git worktrees.
    </p>

    <p class="text-agent-muted leading-relaxed mb-4">
      Un worktree es una copia aislada de tu repo, con su propia rama, en un directorio separado. Claude Code con la flag <code class="text-agent-accent">-w</code> crea un worktree automaticamente y abre una sesion ahi.
    </p>

    {@html `<pre class="code-block text-xs mb-4"># Abrir 3 sesiones paralelas, cada una en su worktree
claude -w feature-auth         # Worktree 1: feature de autenticacion
claude -w fix-invoice-bug      # Worktree 2: bug fix de invoices
claude -w refactor-db-layer    # Worktree 3: refactoring de DB

# Cada worktree tiene su rama, su filesystem, su sesion
# No hay conflictos entre sesiones</pre>`}

    <div class="bg-agent-dark border-l-4 border-l-agent-info rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real: incident.io</p>
      <p class="text-sm text-agent-muted">El equipo de incident.io corre 4-7 sesiones de Claude Code en paralelo usando worktrees. Su workflow: abrir un tmux con 4 panes, cada pane es un worktree con su propia sesion de Claude Code. Un desarrollador puede supervisar 4 tareas simultaneamente, revisando diffs conforme cada sesion termina.</p>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-accent rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Patron Boris Cherny: 3-5 sesiones activas</p>
      <p class="text-sm text-agent-muted">Boris Cherny (autor de "22 Tips for Claude Code") recomienda mantener 3-5 sesiones activas usando worktrees. Su flujo: iniciar una sesion con un prompt bien estructurado, pasar a la siguiente, y volver a revisar cuando cada sesion termina. La clave es que los prompts iniciales sean lo suficientemente buenos para que el agente pueda trabajar de forma autonoma mientras vos atendes otra sesion.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Cuando worktrees, cuando /clear</h3>
    <div class="overflow-x-auto mb-4">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Situacion</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Solucion</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Tareas secuenciales en la misma rama</td>
            <td class="py-3 px-4"><code class="text-agent-accent">/clear</code> entre tareas</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Tareas paralelas en ramas diferentes</td>
            <td class="py-3 px-4"><code class="text-agent-accent">claude -w nombre</code> por tarea</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4">Bug urgente mientras trabajas en una feature</td>
            <td class="py-3 px-4"><code class="text-agent-accent">claude -w hotfix-nombre</code> sin tocar la sesion de feature</td>
          </tr>
          <tr>
            <td class="py-3 px-4">Code review de un PR de otro dev</td>
            <td class="py-3 px-4"><code class="text-agent-accent">claude -w review-pr-123</code> sesion aislada para el review</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- THEORY SECTION 8: Seleccion de Modelo y Costos -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Seleccion de Modelo y Costos</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Claude Code te permite elegir que modelo usa. La estrategia correcta no es "siempre el mas caro" ni "siempre el mas barato". Es usar cada modelo donde brilla.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">La estrategia opusplan</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      La idea es simple: <strong class="text-agent-highlight">Opus para planificar, Sonnet para ejecutar</strong>. Opus tiene mejor reasoning y toma decisiones arquitectonicas superiores. Sonnet es mas rapido y mas barato para tareas de implementacion directa.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark border-t-4 border-t-purple-500">
        <h4 class="text-purple-400 font-bold text-sm mb-2">Opus (planificacion)</h4>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Explorar codebases complejos</li>
          <li>&#8226; Disenar arquitectura</li>
          <li>&#8226; Tomar decisiones de refactoring</li>
          <li>&#8226; Debug de problemas complejos</li>
          <li>&#8226; Code review critico</li>
        </ul>
        <p class="text-xs text-agent-warning mt-2">Mejor reasoning, mas lento, mas caro</p>
      </div>

      <div class="card bg-agent-dark border-t-4 border-t-agent-accent">
        <h4 class="text-agent-accent font-bold text-sm mb-2">Sonnet (ejecucion)</h4>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Implementar planes ya definidos</li>
          <li>&#8226; Escribir tests</li>
          <li>&#8226; Generar boilerplate</li>
          <li>&#8226; Tareas de formato/linting</li>
          <li>&#8226; Cambios simples y repetitivos</li>
        </ul>
        <p class="text-xs text-agent-success mt-2">Mas rapido, mas barato, suficiente para ejecucion</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 4 palancas de ahorro</h3>
    <div class="overflow-x-auto mb-6">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-agent-border">
            <th class="text-left py-3 px-4 text-agent-accent font-bold">Tecnica</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Ahorro</th>
            <th class="text-left py-3 px-4 text-agent-text font-bold">Como</th>
          </tr>
        </thead>
        <tbody class="text-agent-muted">
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">/clear entre tareas</td>
            <td class="py-3 px-4 text-agent-success font-bold">50-70%</td>
            <td class="py-3 px-4">Elimina contexto acumulado que no necesitas</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">opusplan</td>
            <td class="py-3 px-4 text-agent-success font-bold">30-50%</td>
            <td class="py-3 px-4">Opus solo para planning, Sonnet para el resto</td>
          </tr>
          <tr class="border-b border-agent-border/50">
            <td class="py-3 px-4 text-agent-highlight">Batch API</td>
            <td class="py-3 px-4 text-agent-success font-bold">50%</td>
            <td class="py-3 px-4">Para tareas no-interactivas: CI, reviews, linting</td>
          </tr>
          <tr>
            <td class="py-3 px-4 text-agent-highlight">Prompt structures</td>
            <td class="py-3 px-4 text-agent-success font-bold">20-30%</td>
            <td class="py-3 px-4">Prompts claros = menos iteraciones = menos tokens</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave: El costo real no es el per-token</p>
      <p class="text-sm text-agent-muted">El mayor gasto no viene de tokens caros, viene de <strong class="text-agent-text">tokens desperdiciados</strong>: contexto que se arrastra entre tareas, sesiones con correction spirals que no llegan a nada, y exploraciones infinitas que consumen sin producir. Un /clear a tiempo ahorra mas que negociar precios con Anthropic.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Anatomia de una sesion costosa vs una eficiente</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Veamos dos desarrolladores haciendo la misma tarea (un bug fix) con costos radicalmente diferentes:
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Dev A: $4.20 por el bug fix</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Prompt vago &#8594; exploracion excesiva</li>
          <li>&#8226; 3 correction spirals sin /clear</li>
          <li>&#8226; Opus para todo (incluyendo escribir tests)</li>
          <li>&#8226; Contexto de 180K tokens al final</li>
          <li>&#8226; Total: 45 minutos, resultado mediocre</li>
        </ul>
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">Dev B: $0.85 por el mismo fix</p>
        <ul class="text-xs text-agent-muted space-y-1">
          <li>&#8226; Plan Mode &#8594; prompt C+O+C</li>
          <li>&#8226; /clear despues de Plan Mode</li>
          <li>&#8226; Sonnet para implementacion</li>
          <li>&#8226; Contexto de 40K tokens al final</li>
          <li>&#8226; Total: 15 minutos, resultado excelente</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-dark border-l-4 border-l-agent-accent rounded-r-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">La metrica que importa: costo por tarea completada</p>
      <p class="text-sm text-agent-muted">No midas el costo por token ni por sesion. Medi el <strong class="text-agent-text">costo por tarea completada exitosamente</strong>. Un prompt Opus de $2 que resuelve el problema en un intento es mas barato que 5 prompts Sonnet de $0.50 cada uno que no llegan a nada. La eficiencia viene del workflow, no del modelo.</p>
    </div>
  </section>

  <!-- BranchingScenario -->
  <section class="mb-10">
    {#if !showScenario}
      <button onclick={() => showScenario = true} class="btn-primary w-full justify-center">
        Iniciar escenario: Bug Fix con Claude Code
      </button>
    {:else}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Escenario: Arreglar un Bug con Claude Code"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- Quiz -->
  <section class="mb-10">
    {#if !showQuiz}
      <button onclick={() => showQuiz = true} class="btn-primary w-full justify-center">
        Comenzar el quiz
      </button>
    {:else}
      <Quiz questions={quizQuestions} onComplete={handleQuizComplete} />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#128187;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ahora sabes como trabajar CON Claude Code como un profesional: el workflow de 4 fases, Plan Mode, prompts estructurados, verificacion, y las tecnicas para evitar los patrones de fracaso. Tu productividad con agentes de codigo acaba de dar un salto.</p>
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
