<script lang="ts">
  import { courseStore, allBadges } from '$lib/stores/course';
  import { modules } from '$lib/data/modules';
  import BranchingScenario from '$lib/components/BranchingScenario.svelte';
  import ModuleNav from '$lib/components/ModuleNav.svelte';
  import SourcesSection from '$lib/components/SourcesSection.svelte';
  import VocabularyFloat from '$lib/components/VocabularyFloat.svelte';
  import BadgeNotification from '$lib/components/BadgeNotification.svelte';
  import type { Badge } from '$lib/stores/course';
  import type { Source } from '$lib/data/modules';

  const MODULE_ID = 4;
  const mod = modules.find(m => m.id === MODULE_ID)!;

  let completed = $state(false);
  let showBadge = $state(false);
  let earnedBadge = $state<Badge | null>(null);

  let showScenario = $state(false);

  courseStore.startModule(MODULE_ID);

  function handleScenarioComplete(score: number, maxScore: number) {
    courseStore.completeModule(MODULE_ID, score, maxScore);
    // Badge requires 'excellent' or 'good' grade (>=10 of 15 points)
    if (score >= 10) {
      const badge = courseStore.unlockBadge('agent-whisperer');
      if (badge) {
        earnedBadge = badge;
        showBadge = true;
      }
    }
    completed = true;
  }

  // BranchingScenario: "Configura tu Agente para un Proyecto Real"
  const scenarioNodes: Record<string, { id: string; narrative: string; choices?: { text: string; nextId: string; points: number; feedback?: string }[]; outcome?: { title: string; description: string; score: number; maxScore: number; grade: 'excellent' | 'good' | 'needs-work' | 'critical'; lessons: string[] } }> = {
    start: {
      id: 'start',
      narrative: 'Escenario: Acabas de unirte a un equipo que esta construyendo una API en FastAPI. El proyecto tiene 50+ endpoints, usa PostgreSQL, tiene tests con pytest, y CI/CD con GitHub Actions.\n\nTu primera tarea es configurar un agente de codigo para que te ayude a trabajar en el proyecto de manera efectiva.\n\nEmpecemos por lo basico: como configuras las instrucciones del agente para que entienda las convenciones del proyecto?',
      choices: [
        { text: 'Escribo un CLAUDE.md detallado con las reglas del proyecto: stack tecnologico, convenciones de codigo, patrones arquitectonicos, y restricciones especificas', nextId: 'n2-good', points: 3, feedback: 'Excelente. Un rules file detallado es la base de todo. El agente necesita CONTEXTO para tomar buenas decisiones.' },
        { text: 'No configuro nada especial. Los modelos modernos son lo suficientemente inteligentes para entender el proyecto solos', nextId: 'n2-bad', points: 0, feedback: 'Error critico. Sin instrucciones, el agente adivinara convenciones, usara patrones incorrectos, y generara codigo inconsistente con el resto del proyecto.' },
        { text: 'Pongo un comentario al inicio de cada archivo con instrucciones para la IA', nextId: 'n2-ok', points: 1, feedback: 'Funciona parcialmente, pero es fragil y no escalable. Los rules files centralizan las instrucciones en un solo lugar.' },
      ]
    },
    'n2-good': {
      id: 'n2-good',
      narrative: 'Perfecto. Escribiste un CLAUDE.md con esta estructura:\n- Stack: FastAPI + SQLAlchemy 2.0 + Pydantic v2\n- Convenciones: snake_case, type hints obligatorios, docstrings Google style\n- Arquitectura: Repository pattern, DTOs con Pydantic\n- Testing: pytest con fixtures, mocks para DB\n- Restricciones: No usar ORM legacy, no queries raw sin justificacion\n\nAhora el agente entiende el contexto. El equipo menciona que necesitan conectar el agente a la base de datos de documentacion interna y al sistema de issues de Jira. Como lo haces?',
      choices: [
        { text: 'Configuro servidores MCP: uno para la documentacion interna y otro para Jira. Asi el agente puede consultar docs y crear issues directamente', nextId: 'n3-good', points: 3, feedback: 'Perfecto. MCP es exactamente para esto: conectar el agente a fuentes de datos y herramientas externas con un protocolo estandar.' },
        { text: 'Copio toda la documentacion en el repositorio para que el agente la lea directamente', nextId: 'n3-ok', points: 1, feedback: 'Funciona pero es ineficiente. Duplicas datos, la copia se desactualiza rapidamente, y llenas el contexto del agente con informacion que puede no necesitar.' },
        { text: 'Le digo al agente que busque en Google cuando necesite informacion', nextId: 'n3-bad', points: 0, feedback: 'Google no tiene tu documentacion INTERNA. El agente necesita acceso directo a tus fuentes de datos privadas, no a la web publica.' },
      ]
    },
    'n2-bad': {
      id: 'n2-bad',
      narrative: 'Sin configuracion, el agente empezo a generar codigo con patrones inconsistentes. Uso SQLAlchemy 1.x style en un proyecto que usa 2.0, genero endpoints sin type hints, y nombro variables en camelCase cuando el proyecto usa snake_case.\n\nEl tech lead te dice que corrijas esto. Como procedes ahora?',
      choices: [
        { text: 'Ahora si creo un CLAUDE.md detallado con todas las convenciones y reglas del proyecto', nextId: 'n3-recover', points: 2, feedback: 'Bien, nunca es tarde para configurar correctamente. Pero ya generaste codigo inconsistente que alguien tendra que arreglar.' },
        { text: 'Corrijo el codigo manualmente y le digo al agente "sigue este estilo" en cada prompt', nextId: 'n3-bad2', points: 0, feedback: 'Repetir instrucciones en cada prompt es insostenible. Te vas a cansar en el segundo dia y el agente las va a "olvidar" entre sesiones.' },
      ]
    },
    'n2-ok': {
      id: 'n2-ok',
      narrative: 'Los comentarios en archivos individuales funcionan a medias. El agente lee el archivo actual y sigue las instrucciones, pero cuando trabaja con multiples archivos, las instrucciones se pierden.\n\nEl equipo menciona que necesitan conectar el agente a la documentacion interna. Como lo haces?',
      choices: [
        { text: 'Configuro un servidor MCP para la documentacion interna', nextId: 'n3-good', points: 3, feedback: 'Buena eleccion. MCP es el protocolo estandar para esto.' },
        { text: 'Copio los docs al repo para que el agente los encuentre', nextId: 'n3-ok', points: 1, feedback: 'Funciona pero no escala. Los docs se desactualizan rapido.' },
      ]
    },
    'n3-good': {
      id: 'n3-good',
      narrative: 'MCP configurado. El agente ahora puede consultar la documentacion interna y crear issues en Jira sin salir de la terminal.\n\nSiguiente reto: el agente propone refactorizar un modulo completo de autenticacion (12 archivos, 800 lineas). Dice que puede mejorar la seguridad y simplificar el codigo. Que haces?',
      choices: [
        { text: 'Le pido que haga cambios pequenos e incrementales: primero un archivo, revisamos, luego el siguiente. Plan-Act-Reflect en cada paso', nextId: 'n4-good', points: 3, feedback: 'Perfecto. Cambios incrementales = facil de revisar, facil de revertir, y cada paso se valida antes del siguiente. Este es el flujo Plan-Act-Reflect.' },
        { text: 'Acepto la propuesta completa y dejo que refactorice todo de una vez. El agente sabe lo que hace', nextId: 'n4-bad', points: 0, feedback: 'PELIGROSO. 800 lineas de cambios de golpe en autenticacion es una receta para bugs de seguridad. Nunca dejes que un agente haga cambios masivos sin revision incremental.' },
        { text: 'Rechazo la propuesta completa y hago el refactoring yo mismo', nextId: 'n4-ok', points: 1, feedback: 'Conservador pero ineficiente. El agente puede ayudar, solo necesitas dirigirlo con cambios pequenos y revision constante.' },
      ]
    },
    'n3-ok': {
      id: 'n3-ok',
      narrative: 'Copiaste la documentacion al repo. Funciona por ahora, aunque sabes que se desactualizara.\n\nSiguiente reto: el agente propone un refactoring grande del modulo de autenticacion. Que haces?',
      choices: [
        { text: 'Cambios incrementales: un archivo a la vez, revision en cada paso', nextId: 'n4-good', points: 3, feedback: 'Excelente decision. Plan-Act-Reflect en cada paso.' },
        { text: 'Dejo que haga todo el refactoring de una vez', nextId: 'n4-bad', points: 0, feedback: 'Muy riesgoso sin revision incremental.' },
      ]
    },
    'n3-bad': {
      id: 'n3-bad',
      narrative: 'El agente busco en Google y encontro documentacion publica que NO es la de tu proyecto. Genero codigo basado en versiones viejas de tu API interna.\n\nEl agente ahora propone un refactoring del modulo de autenticacion. Que haces?',
      choices: [
        { text: 'Primero configuro bien el acceso a la documentacion, luego procedo con cambios pequenos', nextId: 'n4-good', points: 3, feedback: 'Aprendiste la leccion. Primero contexto correcto, luego cambios incrementales.' },
        { text: 'Le digo que haga el refactoring completo, ya veremos', nextId: 'n4-bad', points: 0, feedback: 'Sin contexto correcto Y sin revision incremental. Doble riesgo.' },
      ]
    },
    'n3-recover': {
      id: 'n3-recover',
      narrative: 'Bien, creaste el CLAUDE.md. Ahora el agente genera codigo consistente.\n\nEl agente propone refactorizar el modulo de autenticacion completo (12 archivos). Que haces?',
      choices: [
        { text: 'Cambios incrementales con revision en cada paso', nextId: 'n4-good', points: 3, feedback: 'Excelente. Aprendiste del error anterior.' },
        { text: 'Dejo que haga todo junto, ahora tiene buenas instrucciones', nextId: 'n4-bad', points: 0, feedback: 'Buenas instrucciones no eliminan la necesidad de revision. Un refactoring de autenticacion necesita supervision humana.' },
      ]
    },
    'n3-bad2': {
      id: 'n3-bad2',
      narrative: 'Repetir instrucciones en cada prompt se volvio insostenible rapidamente.\n\nEl agente ahora propone un refactoring grande. Que haces?',
      choices: [
        { text: 'Primero creo un rules file, luego procedo con cambios pequenos', nextId: 'n4-good', points: 2, feedback: 'Tarde pero correcto. Rules file + cambios incrementales.' },
        { text: 'Le dejo hacer el refactoring, a ver que sale', nextId: 'n4-bad', points: 0, feedback: 'Sin reglas claras y sin revision incremental. El peor escenario posible.' },
      ]
    },
    'n4-good': {
      id: 'n4-good',
      narrative: 'Perfecto enfoque incremental. El agente refactorizo el primer archivo de autenticacion, lo revisaste, encontraste un issue menor con el manejo de tokens JWT, y lo corregiste antes de continuar.\n\nEl codigo generado por el agente pasa todos los tests existentes. Pero notas que NO escribio tests nuevos para las funciones que agrego. Que haces?',
      choices: [
        { text: 'Le pido que escriba tests primero antes de continuar con mas cambios. TDD: primero el test, luego la implementacion', nextId: 'outcome-excellent', points: 3, feedback: 'Fantastico. Tests ANTES de seguir = calidad garantizada. El agente debe generar tests como parte integral del trabajo, no como paso opcional.' },
        { text: 'Yo mismo escribo los tests para las funciones nuevas', nextId: 'outcome-good', points: 2, feedback: 'Los tests se escriben, que es lo importante. Pero desaprovechas la capacidad del agente de generar tests. Mejor pedirle que los escriba y tu los revisas.' },
        { text: 'Los tests existentes pasan, es suficiente. El refactoring no rompio nada', nextId: 'outcome-needs-work', points: 0, feedback: 'Tests existentes solo cubren el codigo viejo. Las funciones NUEVAS no tienen cobertura. Si algo falla en produccion, no hay tests que lo detecten.' },
      ]
    },
    'n4-bad': {
      id: 'n4-bad',
      narrative: 'El agente hizo 800 lineas de cambios en 12 archivos de autenticacion de una sola vez. El diff es imposible de revisar. Los tests pasan, pero no sabes si el agente introdujo vulnerabilidades de seguridad.\n\nUn companero revisa el PR y encuentra que el agente elimino una validacion de tokens JWT critica. Que haces?',
      choices: [
        { text: 'Revierto TODO el refactoring y empiezo de nuevo con cambios incrementales', nextId: 'outcome-needs-work', points: 1, feedback: 'Correcto, pero perdiste horas de trabajo. La leccion: NUNCA aceptes cambios masivos sin revision incremental.' },
        { text: 'Corrijo solo la validacion de JWT y apruebo el resto', nextId: 'outcome-critical', points: 0, feedback: 'Si el agente elimino UNA validacion critica, cuantas mas habraN pasado desapercibidas en 800 lineas? No puedes confiar en un diff que no revisaste.' },
      ]
    },
    'n4-ok': {
      id: 'n4-ok',
      narrative: 'Hiciste el refactoring tu mismo. Funciona, pero tomo 3 dias en lugar de las 4 horas que habria tomado con el agente.\n\nEl codigo no tiene tests nuevos. Que haces?',
      choices: [
        { text: 'Le pido al agente que escriba los tests', nextId: 'outcome-good', points: 2, feedback: 'Buena idea. El agente es excelente para generar tests si le das el contexto correcto.' },
        { text: 'No escribo tests, el codigo funciona', nextId: 'outcome-needs-work', points: 0, feedback: 'Codigo sin tests es una bomba de tiempo. Especialmente en autenticacion.' },
      ]
    },
    // OUTCOMES
    'outcome-excellent': {
      id: 'outcome-excellent',
      narrative: '',
      outcome: {
        title: 'Agent Whisperer Certificado',
        description: 'Dominaste el flujo completo: rules files para contexto, MCP para herramientas, cambios incrementales con revision, y tests como primera clase. Asi es como un profesional trabaja con agentes.',
        score: 15,
        maxScore: 15,
        grade: 'excellent',
        lessons: [
          'Los rules files (CLAUDE.md, .cursorrules) son la BASE de una buena interaccion con agentes',
          'MCP conecta agentes a tus herramientas y datos privados de forma estandar',
          'El flujo Plan-Act-Reflect mantiene el control: cambios pequenos, revision constante',
          'Los tests son parte integral del codigo generado por IA, no un paso opcional',
          'Tratar al agente como un junior talentoso que necesita direccion, no como un senior autonomo'
        ]
      }
    },
    'outcome-good': {
      id: 'outcome-good',
      narrative: '',
      outcome: {
        title: 'Buen Trabajo',
        description: 'Entiendes los principios fundamentales de trabajar con agentes. Algunas decisiones podrian optimizarse, pero el enfoque general es correcto.',
        score: 10,
        maxScore: 15,
        grade: 'good',
        lessons: [
          'Los rules files son fundamentales: configura ANTES de empezar a trabajar',
          'MCP es la forma estandar de conectar agentes a herramientas externas',
          'Los cambios incrementales siempre son preferibles a refactorings masivos',
          'Delega la escritura de tests al agente en lugar de escribirlos tu mismo',
          'El agente es una herramienta: tu decides la estrategia, el ejecuta'
        ]
      }
    },
    'outcome-needs-work': {
      id: 'outcome-needs-work',
      narrative: '',
      outcome: {
        title: 'Necesitas Practica',
        description: 'Cometiste algunos errores comunes al trabajar con agentes. La buena noticia: estos errores son de los que mas se aprende. Revisa los conceptos del modulo.',
        score: 5,
        maxScore: 15,
        grade: 'needs-work',
        lessons: [
          'NUNCA trabajes sin rules files: el agente necesita contexto del proyecto',
          'Los refactorings masivos sin revision son peligrosos, especialmente en seguridad',
          'Tests son obligatorios para codigo generado por IA: 45% tiene vulnerabilidades',
          'MCP > copiar documentacion al repo: es mas limpio y se mantiene actualizado',
          'Plan-Act-Reflect: planifica, deja al agente actuar, revisa criticamente'
        ]
      }
    },
    'outcome-critical': {
      id: 'outcome-critical',
      narrative: '',
      outcome: {
        title: 'Riesgo Critico',
        description: 'Las decisiones tomadas podrian causar problemas serios en produccion. Aceptar codigo de IA sin revision adecuada es el error mas peligroso que puedes cometer. Vuelve a revisar el modulo.',
        score: 1,
        maxScore: 15,
        grade: 'critical',
        lessons: [
          'NUNCA aceptes cambios masivos sin revision linea por linea',
          'Si el agente elimino UNA validacion critica, asume que hay MAS errores ocultos',
          'El 45% del codigo generado por IA tiene fallos de seguridad (GitHub Security Lab)',
          'Tratar al agente como un junior: TODO lo que genera necesita code review',
          'Sin tests, sin rules files, y sin revision = la tormenta perfecta de bugs'
        ]
      }
    },
  };
</script>

<svelte:head>
  <title>Modulo 4: {mod.title} | Agent Mastery</title>
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

  <!-- THEORY SECTION 1: System Prompts y Rules Files -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">System Prompts y Rules Files</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El rules file es como el <strong class="text-agent-highlight">manual de empleado</strong> de tu agente. Le dice quien es, como debe comportarse, que convenciones seguir, y que esta prohibido. Sin rules file, el agente adivina. Y adivinar en software es <strong class="text-agent-text">la causa #1 de bugs</strong>.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card border-t-4 border-t-purple-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">CLAUDE.md</h3>
        <p class="text-xs text-agent-accent mb-2">Claude Code</p>
        <p class="text-sm text-agent-muted">Archivo Markdown en la raiz del proyecto. Claude Code lo lee automaticamente al iniciar. Soporta instrucciones detalladas, listas de convenciones, y reglas de arquitectura.</p>
      </div>
      <div class="card border-t-4 border-t-blue-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">.cursorrules</h3>
        <p class="text-xs text-agent-accent mb-2">Cursor</p>
        <p class="text-sm text-agent-muted">Archivo de reglas especifico de Cursor. Define convenciones del proyecto que Cursor sigue al generar codigo. Formato mas simple.</p>
      </div>
      <div class="card border-t-4 border-t-orange-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">.clinerules</h3>
        <p class="text-xs text-agent-accent mb-2">Cline / Roo Code</p>
        <p class="text-sm text-agent-muted">Reglas para la familia Cline/Roo. Los custom modes de Roo Code permiten reglas diferentes por modo (architect, code, debug).</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Estructura de un buen CLAUDE.md</h3>

    {@html `<pre class="code-block text-xs mb-6"># Proyecto: API de Gestion de Usuarios

## Stack Tecnologico
- FastAPI 0.115+
- SQLAlchemy 2.0 (async)
- Pydantic v2 para DTOs
- PostgreSQL 16
- pytest + pytest-asyncio para tests

## Convenciones de Codigo
- snake_case para variables y funciones
- PascalCase para clases
- Type hints OBLIGATORIOS en todas las funciones
- Docstrings Google style

## Arquitectura
- Repository Pattern para acceso a datos
- DTOs con Pydantic (nunca devolver modelos ORM directo)
- Inyeccion de dependencias con Depends()
- Cada endpoint tiene su propio schema de request/response

## Reglas Estrictas
- NUNCA usar queries SQL raw sin justificacion
- NUNCA commitear .env o credenciales
- Todo endpoint debe tener tests
- Manejo de errores con HTTPException tipados

## Testing
- Fixtures para DB con scope="session"
- Mocks para servicios externos
- Minimo 80% cobertura en logica de negocio</pre>`}

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Tip pro:</p>
      <p class="text-sm text-agent-muted">Versiona tu rules file con Git. Asi todo el equipo comparte las mismas instrucciones para el agente. Cuando cambian las convenciones, el rules file se actualiza en el mismo PR.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: MCP -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">MCP: Model Context Protocol</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      MCP es un <strong class="text-agent-highlight">protocolo abierto</strong> creado por Anthropic que estandariza como los agentes se conectan a fuentes de datos y herramientas externas. Piensalo como un <strong class="text-agent-text">USB universal para agentes IA</strong>: en vez de integrar cada herramienta de forma custom, usas un protocolo estandar.
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-5 mb-6">
      <h3 class="text-agent-accent font-bold mb-3">Arquitectura MCP</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Host</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">La aplicacion que aloja al agente (Claude Code, Cursor, tu app custom)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Client</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Vive dentro del host, se conecta 1:1 con un servidor MCP</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Server</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Expone herramientas y datos. Ejemplo: un MCP server para PostgreSQL, otro para Jira, otro para Slack</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Resources</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Datos que el servidor expone (archivos, registros de DB, documentos)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Tools</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Acciones que el agente puede invocar via el servidor (crear issue, ejecutar query)</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-success font-bold mb-2">Por que importa MCP</h4>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Un servidor MCP funciona con CUALQUIER cliente compatible</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> No necesitas integraciones custom por cada agente</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> La comunidad crea servidores para todo: GitHub, Postgres, S3, Notion...</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Seguridad: los permisos se controlan en el servidor, no en el agente</li>
        </ul>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-warning font-bold mb-2">Limitaciones actuales</h4>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Protocolo joven, aun evolucionando</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> No todos los agentes soportan MCP todavia</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> La calidad de servidores comunitarios varia mucho</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Debugging puede ser complejo si la cadena Host&#x2192;Client&#x2192;Server falla</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 3: Plan-Act-Reflect -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Flujo Plan &#x2192; Act &#x2192; Reflect</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Addy Osmani (referente en ingenieria de software en Google) popularizo este flujo para trabajar efectivamente con agentes de codigo. Es la antitesis de "dale una tarea y acepta lo que salga":
    </p>

    <div class="space-y-6 mb-6">
      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 h-16 rounded-xl bg-agent-info/20 border border-agent-info/30 flex items-center justify-center">
          <span class="text-2xl">&#x1F4CB;</span>
        </div>
        <div>
          <h3 class="text-agent-info font-bold text-lg">PLAN</h3>
          <p class="text-sm text-agent-muted mb-2">Antes de que el agente escriba una linea de codigo, define exactamente que quieres:</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li>* Describe la tarea con especificaciones claras</li>
            <li>* Pide al agente que PROPONGA un plan antes de ejecutar</li>
            <li>* Revisa el plan y ajusta antes de dar luz verde</li>
            <li>* Define que archivos puede tocar y cuales NO</li>
          </ul>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 h-16 rounded-xl bg-agent-accent/20 border border-agent-accent/30 flex items-center justify-center">
          <span class="text-2xl">&#x26A1;</span>
        </div>
        <div>
          <h3 class="text-agent-accent font-bold text-lg">ACT</h3>
          <p class="text-sm text-agent-muted mb-2">Deja al agente ejecutar, pero en pasos controlados:</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li>* Cambios pequenos e incrementales (no mega-refactorings)</li>
            <li>* Un archivo o componente a la vez</li>
            <li>* Tests despues de cada cambio significativo</li>
            <li>* Si algo no se ve bien, para INMEDIATAMENTE</li>
          </ul>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="shrink-0 w-16 h-16 rounded-xl bg-agent-warning/20 border border-agent-warning/30 flex items-center justify-center">
          <span class="text-2xl">&#x1F50D;</span>
        </div>
        <div>
          <h3 class="text-agent-warning font-bold text-lg">REFLECT</h3>
          <p class="text-sm text-agent-muted mb-2">Revisa criticamente CADA resultado antes de continuar:</p>
          <ul class="space-y-1 text-sm text-agent-muted">
            <li>* Lee el codigo generado linea por linea</li>
            <li>* Verifica que siga las convenciones del proyecto</li>
            <li>* Busca vulnerabilidades de seguridad</li>
            <li>* Confirma que los tests cubren los casos edge</li>
            <li>* Si algo no convence, pide al agente que lo rehaga con indicaciones especificas</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-danger/30 rounded-lg p-4">
      <p class="text-sm text-agent-danger font-bold mb-1">El anti-patron que DEBES evitar:</p>
      <p class="text-sm text-agent-muted">"Le di la tarea al agente, acepto todo lo que genero sin revisar, y lo mande a produccion." Segun un estudio de GitHub Security Lab, <strong class="text-agent-text">el 45% del codigo generado por IA tiene vulnerabilidades de seguridad</strong>. Tratar al agente como un senior autonomo es un error critico.</p>
    </div>
  </section>

  <!-- THEORY SECTION 4: Revisar Codigo de IA -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Revisar Codigo Generado por IA</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      El codigo de un agente es como el trabajo de un <strong class="text-agent-highlight">junior muy talentoso pero sin experiencia en tu proyecto</strong>. Puede ser brillante en sintaxis y patrones, pero no conoce las reglas no escritas de tu codebase.
    </p>

    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-danger text-xl shrink-0">1</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Seguridad primero</h4>
          <p class="text-sm text-agent-muted">Busca inyecciones SQL, XSS, credenciales hardcodeadas, validaciones faltantes. El agente no siempre piensa en seguridad.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-warning text-xl shrink-0">2</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Consistencia con el proyecto</h4>
          <p class="text-sm text-agent-muted">Verifica que siga las convenciones del equipo, use los patrones establecidos, y no introduzca dependencias innecesarias.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-info text-xl shrink-0">3</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Tests y edge cases</h4>
          <p class="text-sm text-agent-muted">Los agentes tienden a generar el "happy path" perfecto pero ignoran casos borde. Verifica que haya tests para errores, inputs vacios, y limites.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-xl shrink-0">4</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Cambios pequenos</h4>
          <p class="text-sm text-agent-muted">Mantener los cambios pequenos permite revisiones rapidas y efectivas. Un PR de 50 lineas se revisa en minutos. Un PR de 800 lineas no se revisa, se aprueba con miedo.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 5: Proyectos Agent-Friendly -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Estructurar Proyectos Agent-Friendly</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un proyecto bien estructurado hace que los agentes sean <strong class="text-agent-highlight">drasticamente mas efectivos</strong>. Piensalo asi: si un humano nuevo tarda 2 semanas en entender tu codebase, el agente tambien va a batallar.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark border-agent-success/30">
        <h3 class="text-agent-success font-bold mb-2">Agent-Friendly</h3>
        <ul class="space-y-2 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> README actualizado con setup, arquitectura y convenciones</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Nombres de archivos descriptivos y consistentes</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Tests automatizados que el agente puede correr</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> CI/CD que valida cada cambio</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Codigo modular con responsabilidades claras</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Rules file (CLAUDE.md, .cursorrules) en el repo</li>
        </ul>
      </div>

      <div class="card bg-agent-dark border-agent-danger/30">
        <h3 class="text-agent-danger font-bold mb-2">Agent-Hostile</h3>
        <ul class="space-y-2 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Sin README o README desactualizado</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Archivos gigantes con multiples responsabilidades</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Sin tests: el agente no puede verificar sus cambios</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Sin CI/CD: ningun guardrail automatizado</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Convenciones inconsistentes entre archivos</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Logica de negocio mezclada con infraestructura</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Insight clave:</p>
      <p class="text-sm text-agent-muted">Lo que hace un proyecto "agent-friendly" es EXACTAMENTE lo que hace un proyecto "developer-friendly". Las buenas practicas de ingenieria de software <strong class="text-agent-text">ya eran correctas</strong> antes de los agentes. La IA simplemente hace que las consecuencias de ignorarlas sean mas inmediatas y visibles.</p>
    </div>
  </section>

  <!-- BranchingScenario -->
  <section class="mb-10">
    {#if !showScenario}
      <div class="card bg-agent-dark border-agent-accent/30 text-center">
        <span class="text-4xl block mb-3">&#x1F3AF;</span>
        <h3 class="text-xl font-bold text-agent-text mb-2">Escenario: Configura tu Agente para un Proyecto Real</h3>
        <p class="text-agent-muted mb-4">Pon a prueba todo lo que aprendiste. Tus decisiones determinan si mereces el badge "Agent Whisperer". Necesitas grado "excellent" o "good" (10+ puntos de 15) para desbloquearlo.</p>
        <button onclick={() => showScenario = true} class="btn-primary">
          Comenzar escenario
        </button>
      </div>
    {:else}
      <BranchingScenario
        nodes={scenarioNodes}
        startId="start"
        title="Configura tu Agente para un Proyecto Real"
        onComplete={handleScenarioComplete}
      />
    {/if}
  </section>

  <!-- Completion message -->
  {#if completed}
    <div class="card bg-agent-success/10 border-agent-success/30 text-center mb-8 fade-in">
      <span class="text-4xl block mb-3">&#x1F3AF;</span>
      <h3 class="text-xl font-bold text-agent-success mb-2">Modulo completado!</h3>
      <p class="text-agent-muted">Ahora sabes como trabajar CON agentes de forma profesional. Rules files, MCP, Plan-Act-Reflect, y revision critica: las cuatro herramientas del Agent Whisperer.</p>
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
