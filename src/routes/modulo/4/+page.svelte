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

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Sin rules files, el agente usa sus valores por defecto. TU proyecto no es un proyecto por defecto. Cada equipo tiene convenciones, patrones arquitectonicos y restricciones unicas. El rules file es lo que transforma un agente generico en un agente que ENTIENDE tu codebase.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card border-t-4 border-t-purple-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">CLAUDE.md</h3>
        <p class="text-xs text-agent-accent mb-2">Claude Code</p>
        <p class="text-sm text-agent-muted">Archivo Markdown en la raiz del proyecto. Claude Code lo lee automaticamente al iniciar. Soporta instrucciones detalladas, listas de convenciones, y reglas de arquitectura. Tambien soporta un archivo global en <code class="text-agent-accent">~/.claude/CLAUDE.md</code> para instrucciones que aplican a TODOS tus proyectos.</p>
      </div>
      <div class="card border-t-4 border-t-blue-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">.cursorrules</h3>
        <p class="text-xs text-agent-accent mb-2">Cursor</p>
        <p class="text-sm text-agent-muted">Archivo de reglas especifico de Cursor. Define convenciones del proyecto que Cursor sigue al generar codigo. Cursor tambien soporta "Project Rules" desde su UI, que se guardan en <code class="text-agent-accent">.cursor/rules/</code>. Formato mas simple que CLAUDE.md pero igualmente efectivo.</p>
      </div>
      <div class="card border-t-4 border-t-orange-500 bg-agent-dark">
        <h3 class="text-agent-text font-bold mb-1">.clinerules</h3>
        <p class="text-xs text-agent-accent mb-2">Cline / Roo Code</p>
        <p class="text-sm text-agent-muted">Reglas para la familia Cline/Roo. Los custom modes de Roo Code permiten reglas diferentes por modo (architect, code, debug). Puedes tener un set de reglas para cuando diseñas arquitectura y otro para cuando depuras.</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El estandar emergente: AGENTS.md</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      La comunidad esta convergiendo hacia un archivo estandarizado llamado <strong class="text-agent-text">AGENTS.md</strong> que cualquier agente de codigo pueda leer, sin importar si es Claude Code, Cursor, Cline o cualquier otro. La idea es simple: asi como <code class="text-agent-accent">.editorconfig</code> estandarizo la configuracion de editores, AGENTS.md busca estandarizar las instrucciones para agentes IA.
    </p>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-6">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">El concepto de AGENTS.md fue propuesto por la comunidad open-source como solucion al "vendor lock-in" de rules files. En lugar de tener .cursorrules, CLAUDE.md y .clinerules por separado, un solo archivo AGENTS.md serviria para todos. Aun esta evolucionando, pero varios proyectos ya lo estan adoptando.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Estructura de un buen CLAUDE.md</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un buen rules file no es solo una lista de tecnologias. Es un documento estructurado que cubre identidad, convenciones, restricciones, y ejemplos. Piensalo como el onboarding document que le darias a un nuevo desarrollador en su primer dia.
    </p>

    {@html `<pre class="code-block text-xs mb-4"># Proyecto: API de Gestion de Usuarios

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
- Imports ordenados: stdlib, third-party, local (isort compatible)
- Lineas max 100 caracteres

## Arquitectura
- Repository Pattern para acceso a datos
- DTOs con Pydantic (nunca devolver modelos ORM directo)
- Inyeccion de dependencias con Depends()
- Cada endpoint tiene su propio schema de request/response
- Services layer entre routers y repositories
- No poner logica de negocio en los routers

## Estructura de Carpetas
- src/routers/       → Endpoints de la API
- src/services/      → Logica de negocio
- src/repositories/  → Acceso a datos
- src/schemas/       → Pydantic models (request/response)
- src/models/        → SQLAlchemy models
- tests/             → Misma estructura que src/

## Reglas Estrictas
- NUNCA usar queries SQL raw sin justificacion
- NUNCA commitear .env o credenciales
- Todo endpoint debe tener tests
- Manejo de errores con HTTPException tipados
- No imports circulares entre modulos
- No usar "from module import *"

## Testing
- Fixtures para DB con scope="session"
- Mocks para servicios externos
- Minimo 80% cobertura en logica de negocio
- Cada test debe ser independiente (no depender del orden)

## Ejemplos
- Endpoint correcto: ver src/routers/users.py como referencia
- Schema correcto: ver src/schemas/user.py
- Test correcto: ver tests/routers/test_users.py</pre>`}

    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">Antes vs Despues: El impacto del rules file</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Mira la diferencia dramatica entre un agente SIN reglas y uno CON reglas cuando se le pide "crea un endpoint para obtener un usuario por ID":
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">SIN rules file</p>
        {@html `<pre class="code-block text-xs text-agent-muted">@app.get("/user/{id}")
def get_user(id):
    user = db.query("SELECT * FROM users WHERE id = " + str(id))
    return user</pre>`}
        <ul class="space-y-1 text-xs text-agent-danger mt-3">
          <li>* SQL injection vulnerable</li>
          <li>* Sin type hints</li>
          <li>* Devuelve modelo ORM directo</li>
          <li>* Sin manejo de errores</li>
          <li>* Sin validacion de parametros</li>
        </ul>
      </div>
      <div class="bg-agent-success/10 border border-agent-success/30 rounded-lg p-4">
        <p class="text-agent-success font-bold text-sm mb-2">CON rules file</p>
        {@html `<pre class="code-block text-xs text-agent-muted">@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Obtiene un usuario por ID."""
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404)
    return UserResponse.model_validate(user)</pre>`}
        <ul class="space-y-1 text-xs text-agent-success mt-3">
          <li>* Type hints en todo</li>
          <li>* Inyeccion de dependencias</li>
          <li>* DTO con Pydantic (no ORM directo)</li>
          <li>* Manejo de 404</li>
          <li>* Async correctamente</li>
        </ul>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Tips para escribir instrucciones efectivas</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0">1</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Se especifico, no generico</h4>
          <p class="text-sm text-agent-muted">Mal: "Escribe buen codigo". Bien: "Usa type hints en todas las funciones. Usa Pydantic v2 para validacion. No uses Any como tipo."</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0">2</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Incluye ejemplos concretos</h4>
          <p class="text-sm text-agent-muted">Los agentes aprenden mejor de ejemplos que de reglas abstractas. Incluye "ver archivo X como referencia" para que el agente tenga un modelo a seguir.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0">3</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Define limites y prohibiciones</h4>
          <p class="text-sm text-agent-muted">Las reglas negativas son tan importantes como las positivas: "NUNCA modificar archivos de migracion existentes", "NUNCA usar print() para logging".</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0">4</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Estructura del proyecto explicita</h4>
          <p class="text-sm text-agent-muted">Incluye donde van los archivos nuevos. Sin esto, el agente puede crear un endpoint directamente en main.py en lugar de en el router correspondiente.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0">5</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Mantelo actualizado</h4>
          <p class="text-sm text-agent-muted">Un rules file desactualizado es peor que no tener uno. Si migras de SQLAlchemy 1.x a 2.0 pero no actualizas el rules file, el agente generara codigo legacy.</p>
        </div>
      </div>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Tip pro:</p>
      <p class="text-sm text-agent-muted">Versiona tu rules file con Git. Asi todo el equipo comparte las mismas instrucciones para el agente. Cuando cambian las convenciones, el rules file se actualiza en el mismo PR. Algunos equipos incluso incluyen una seccion "Changelog" dentro del rules file para trackear cambios importantes.</p>
    </div>
  </section>

  <!-- THEORY SECTION 2: MCP -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">MCP: Model Context Protocol</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      MCP es un <strong class="text-agent-highlight">protocolo abierto</strong> creado por Anthropic que estandariza como los agentes se conectan a fuentes de datos y herramientas externas. Piensalo como un <strong class="text-agent-text">USB universal para agentes IA</strong>: en vez de integrar cada herramienta de forma custom, usas un protocolo estandar.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">El Problema N x M</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Antes de MCP, cada combinacion de agente + herramienta necesitaba una integracion custom. Si tienes <strong class="text-agent-text">N modelos</strong> (Claude, GPT, Gemini...) y <strong class="text-agent-text">M herramientas</strong> (GitHub, Jira, Postgres, Slack...), necesitabas <strong class="text-agent-highlight">N x M integraciones</strong>. Con 5 modelos y 10 herramientas = 50 integraciones diferentes. MCP reduce esto a <strong class="text-agent-accent">N + M</strong>: cada modelo implementa el cliente MCP UNA vez, cada herramienta implementa el servidor MCP UNA vez, y todas las combinaciones funcionan automaticamente. De 50 integraciones a 15.
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
          <span class="text-sm text-agent-muted">Vive dentro del host, se conecta 1:1 con un servidor MCP. Cada servidor tiene su propio client</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Server</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Expone herramientas y datos via JSON-RPC 2.0. Ejemplo: un MCP server para PostgreSQL, otro para Jira, otro para Slack</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Resources</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Datos que el servidor expone al agente (archivos, registros de DB, documentos). Lectura pasiva</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Tools</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Acciones que el agente puede invocar via el servidor (crear issue, ejecutar query). Acciones activas</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-24 text-right text-sm font-bold text-agent-text">Prompts</span>
          <span class="text-agent-accent">&#x2192;</span>
          <span class="text-sm text-agent-muted">Templates pre-construidos que el servidor ofrece al host. El usuario puede seleccionarlos como atajos</span>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Como funciona el protocolo internamente</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      MCP usa <strong class="text-agent-text">JSON-RPC 2.0</strong> como protocolo de transporte. El cliente y el servidor se comunican con mensajes estructurados. Hay dos tipos de transporte: <strong class="text-agent-accent">stdio</strong> (para servidores locales que se ejecutan como procesos) y <strong class="text-agent-accent">HTTP con SSE</strong> (Server-Sent Events, para servidores remotos).
    </p>

    {@html `<pre class="code-block text-xs mb-4">// Ejemplo simplificado de configuracion MCP en Claude Code
// Archivo: .mcp.json en la raiz del proyecto
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres",
               "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "/home/user/docs"]
    }
  }
}</pre>`}

    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">Servidores MCP populares</h3>
    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Servidor</th>
              <th class="text-left text-agent-text py-2 pr-4">Que hace</th>
              <th class="text-left text-agent-text py-2">Caso de uso</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">Filesystem</td><td class="py-2 pr-4">Lee/escribe archivos fuera del proyecto</td><td class="py-2">Acceder a docs, configs externas</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">GitHub</td><td class="py-2 pr-4">Issues, PRs, repos, code search</td><td class="py-2">Automatizar workflow de Git</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">PostgreSQL</td><td class="py-2 pr-4">Queries, schemas, tablas</td><td class="py-2">Explorar y consultar la BD</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">Slack</td><td class="py-2 pr-4">Enviar/leer mensajes, canales</td><td class="py-2">Notificaciones, busqueda en chat</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4 text-agent-accent">Puppeteer</td><td class="py-2 pr-4">Navegacion web, screenshots</td><td class="py-2">Testing visual, scraping</td></tr>
            <tr><td class="py-2 pr-4 text-agent-accent">Sentry</td><td class="py-2 pr-4">Errores, eventos, stack traces</td><td class="py-2">Debugging con context real</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-accent/5 border border-agent-accent/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Sabias que?</p>
      <p class="text-sm text-agent-muted">OpenAI anuncio soporte para MCP en su SDK de Agents en 2025, y Google lo integro en Gemini. El protocolo que empezo como una creacion de Anthropic se esta convirtiendo en el estandar de facto de la industria. Esto valida la apuesta: construir MCP servers hoy es una inversion a futuro.</p>
    </div>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Un equipo de backend configuro 3 MCP servers: GitHub (para crear issues y PRs automaticamente), PostgreSQL (para que el agente consultara schemas y datos de prueba), y su documentacion interna via Filesystem. El resultado: el agente podia recibir un bug report, consultar la DB para reproducirlo, encontrar el codigo relevante, y crear un PR con el fix. Lo que antes tomaba 45 minutos de contexto switching ahora lo hacia el agente en 5.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Seguridad en MCP</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Darle a un agente acceso a tu base de datos o tu cuenta de GitHub suena arriesgado, y lo es si no tomas precauciones. Principios basicos de seguridad MCP:
    </p>
    <ul class="space-y-2 text-sm text-agent-muted mb-4">
      <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">!</span> <strong class="text-agent-text">Minimo privilegio:</strong> Si el agente solo necesita LEER la DB, no le des permisos de escritura. Crea un usuario de DB con READ ONLY.</li>
      <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">!</span> <strong class="text-agent-text">Tokens con scope limitado:</strong> Usa GitHub tokens con SOLO los permisos que el agente necesita (ej: solo acceso a repos, no a org settings).</li>
      <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">!</span> <strong class="text-agent-text">Paths restringidos:</strong> El MCP de Filesystem permite limitar a que carpetas tiene acceso. No le des acceso a todo el sistema de archivos.</li>
      <li class="flex items-start gap-2"><span class="text-agent-warning shrink-0">!</span> <strong class="text-agent-text">Aprobacion humana para acciones destructivas:</strong> Configura que operaciones como DELETE o DROP requieran confirmacion del usuario antes de ejecutarse.</li>
    </ul>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="card bg-agent-dark">
        <h4 class="text-agent-success font-bold mb-2">Por que importa MCP</h4>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Un servidor MCP funciona con CUALQUIER cliente compatible</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> No necesitas integraciones custom por cada agente</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> La comunidad crea servidores para todo: GitHub, Postgres, S3, Notion...</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Seguridad: los permisos se controlan en el servidor, no en el agente</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Resuelve el problema N x M de integraciones</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">+</span> Protocolo abierto respaldado por la industria</li>
        </ul>
      </div>
      <div class="card bg-agent-dark">
        <h4 class="text-agent-warning font-bold mb-2">Limitaciones actuales</h4>
        <ul class="space-y-1 text-sm text-agent-muted">
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Protocolo joven, aun evolucionando (especificacion cambiando)</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> No todos los agentes soportan MCP todavia</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> La calidad de servidores comunitarios varia mucho</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Debugging puede ser complejo si la cadena Host&#x2192;Client&#x2192;Server falla</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Configuracion inicial requiere conocimiento tecnico</li>
          <li class="flex items-start gap-2"><span class="text-agent-warning">!</span> Overhead de latencia en cada llamada al servidor</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- THEORY SECTION 3: Plan-Act-Reflect -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">El Flujo Plan &#x2192; Act &#x2192; Reflect</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Addy Osmani (referente en ingenieria de software en Google) popularizo este flujo para trabajar efectivamente con agentes de codigo. Es la antitesis de "dale una tarea y acepta lo que salga". En esencia: <strong class="text-agent-text">tu diriges, el agente ejecuta, y tu validas</strong>. Nunca al reves.
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

    <h3 class="text-lg font-bold text-agent-text mb-3">Ejemplo completo del ciclo</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Imagina que necesitas agregar autenticacion con JWT a tu API. Asi se ve el flujo completo:
    </p>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-info uppercase tracking-wider font-bold mb-2">Fase PLAN</p>
      {@html `<pre class="code-block text-xs text-agent-muted">Tu: "Necesito agregar autenticacion JWT a la API.
Antes de escribir codigo, propone un plan con:
- Que archivos vamos a crear/modificar
- Que dependencias necesitamos
- El flujo de autenticacion completo
- NO toques los endpoints existentes todavia"

Agente: "Plan propuesto:
1. Instalar python-jose y passlib
2. Crear src/auth/jwt_handler.py (crear/verificar tokens)
3. Crear src/auth/dependencies.py (Depends para proteger rutas)
4. Crear src/schemas/auth.py (LoginRequest, TokenResponse)
5. Crear src/routers/auth.py (POST /login, POST /refresh)
6. Agregar tests para cada componente
Flujo: login -> verificar credenciales -> generar JWT
       request -> extraer JWT del header -> validar -> permitir/denegar"

Tu: "El plan se ve bien. Empieza por el paso 2 solamente."</pre>`}
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-accent uppercase tracking-wider font-bold mb-2">Fase ACT</p>
      {@html `<pre class="code-block text-xs text-agent-muted">Tu: "OK, ejecuta solo el paso 2: crea jwt_handler.py"

Agente: *crea el archivo con create_token() y verify_token()*

Tu: "Ahora crea los tests para jwt_handler antes de continuar."

Agente: *crea tests/auth/test_jwt_handler.py*</pre>`}
    </div>

    <div class="bg-agent-dark border border-agent-border rounded-lg p-4 mb-4">
      <p class="text-xs text-agent-warning uppercase tracking-wider font-bold mb-2">Fase REFLECT</p>
      {@html `<pre class="code-block text-xs text-agent-muted">Tu: "Corre los tests y muestrame el resultado."

Agente: *5 tests passed*

Tu: "Revisando el codigo... Veo que usas HS256 con una
secret key hardcodeada. Cambiala a RS256 con keys desde
variables de entorno. Tambien falta el campo 'exp' en el
token para que expire."

Agente: *corrige segun feedback*

Tu: "Perfecto. Ahora continuemos con el paso 3."</pre>`}
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3 mt-6">El concepto de "chunk size"</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      El tamaño de cada cambio que le pides al agente es critico. Los estudios de Anthropic y la experiencia de la comunidad convergen en lo mismo: <strong class="text-agent-text">cambios mas pequeños = mejor calidad</strong>. Un cambio ideal es uno que puedas revisar en menos de 5 minutos. Si el diff es tan grande que necesitas 30 minutos para revisarlo, el cambio fue demasiado grande.
    </p>

    <div class="bg-agent-card border border-agent-border rounded-lg p-4 mb-4">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-agent-border">
              <th class="text-left text-agent-text py-2 pr-4">Tamaño del cambio</th>
              <th class="text-left text-agent-text py-2 pr-4">Calidad esperada</th>
              <th class="text-left text-agent-text py-2">Facilidad de revision</th>
            </tr>
          </thead>
          <tbody class="text-agent-muted">
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">1-30 lineas</td><td class="py-2 pr-4 text-agent-success">Alta: facil de verificar</td><td class="py-2 text-agent-success">2-5 minutos</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">30-100 lineas</td><td class="py-2 pr-4 text-agent-warning">Media: requiere atencion</td><td class="py-2 text-agent-warning">10-15 minutos</td></tr>
            <tr class="border-b border-agent-border/50"><td class="py-2 pr-4">100-300 lineas</td><td class="py-2 pr-4 text-agent-danger">Baja: facil perder errores</td><td class="py-2 text-agent-danger">30+ minutos</td></tr>
            <tr><td class="py-2 pr-4">300+ lineas</td><td class="py-2 pr-4 text-agent-danger">Muy baja: revision superficial</td><td class="py-2 text-agent-danger">Se aprueba con miedo</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-agent-danger/5 border border-agent-danger/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-danger font-bold mb-1">Error comun</p>
      <p class="text-sm text-agent-muted">Dejar que el agente haga demasiado de una sola vez. "Implementa el sistema de autenticacion completo" parece eficiente, pero produce un diff de 500+ lineas que nadie va a revisar en detalle. Si hay un bug de seguridad en la linea 347, lo vas a pasar por alto. Mejor: "Implementa SOLO la funcion que genera el JWT token, con sus tests."</p>
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
      El codigo de un agente es como el trabajo de un <strong class="text-agent-highlight">junior muy talentoso pero sin experiencia en tu proyecto</strong>. Puede ser brillante en sintaxis y patrones, pero no conoce las reglas no escritas de tu codebase. Revisar el codigo de IA no es opcional, es tu <strong class="text-agent-text">responsabilidad profesional</strong>.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las estadisticas que asustan</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4 text-center">
        <p class="text-3xl font-bold text-agent-danger">45%</p>
        <p class="text-sm text-agent-muted mt-1">del codigo generado por IA tiene fallos de seguridad</p>
        <p class="text-xs text-agent-muted mt-1">(GitHub Security Lab)</p>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4 text-center">
        <p class="text-3xl font-bold text-agent-danger">1.75x</p>
        <p class="text-sm text-agent-muted mt-1">mas errores logicos que codigo escrito por humanos</p>
        <p class="text-xs text-agent-muted mt-1">(Cornell University)</p>
      </div>
      <div class="bg-agent-danger/10 border border-agent-danger/30 rounded-lg p-4 text-center">
        <p class="text-3xl font-bold text-agent-danger">2.74x</p>
        <p class="text-sm text-agent-muted mt-1">mas vulnerabilidades XSS en codigo generado</p>
        <p class="text-xs text-agent-muted mt-1">(Security analysis studies)</p>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Checklist de revision de codigo IA</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-danger text-xl shrink-0">1</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Seguridad primero</h4>
          <p class="text-sm text-agent-muted">Busca inyecciones SQL, XSS, credenciales hardcodeadas, validaciones faltantes, permisos excesivos. El agente no siempre piensa en seguridad. Preguntate: "si un atacante envia input malicioso, que pasa?"</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-warning text-xl shrink-0">2</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Consistencia con el proyecto</h4>
          <p class="text-sm text-agent-muted">Verifica que siga las convenciones del equipo, use los patrones establecidos, y no introduzca dependencias innecesarias. Si el proyecto usa Repository Pattern, el agente no deberia meter queries directas en el router.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-info text-xl shrink-0">3</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Imports y dependencias reales</h4>
          <p class="text-sm text-agent-muted">Los agentes a veces "alucinan" imports que no existen o usan APIs de versiones incorrectas. Verifica que cada import exista y que la funcion se use correctamente segun la version instalada.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-xl shrink-0">4</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Tests y edge cases</h4>
          <p class="text-sm text-agent-muted">Los agentes tienden a generar el "happy path" perfecto pero ignoran casos borde. Verifica que haya tests para errores, inputs vacios, limites, y concurrencia si aplica.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-success text-xl shrink-0">5</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Logica de negocio correcta</h4>
          <p class="text-sm text-agent-muted">El agente puede escribir codigo que "se ve bien" pero no hace lo que deberia. Traza el flujo mentalmente: "si el usuario hace X, pasa Y, y el resultado es Z." Si no coincide con los requisitos, hay un bug.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-purple-400 text-xl shrink-0">6</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Performance</h4>
          <p class="text-sm text-agent-muted">Los agentes suelen escribir codigo correcto pero ineficiente: N+1 queries, loops innecesarios, falta de indices, cargar todo en memoria. Preguntate: "como se comporta esto con 10K registros?"</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-pink-400 text-xl shrink-0">7</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Manejo de errores completo</h4>
          <p class="text-sm text-agent-muted">El agente suele manejar 1-2 tipos de error. En produccion hay decenas: timeouts, conexiones caidas, datos corruptos, permisos denegados. Verifica que los errores se manejen y que el usuario reciba feedback util.</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Errores comunes que genera la IA</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">Imports alucinados</p>
        {@html `<pre class="code-block text-xs text-agent-muted"># El agente escribe esto:
from fastapi.security import JWTBearer
# Pero JWTBearer NO EXISTE en FastAPI
# Lo invento basandose en patrones similares

# La version correcta:
from fastapi.security import HTTPBearer</pre>`}
      </div>
      <div class="bg-agent-dark border border-agent-border rounded-lg p-4">
        <p class="text-agent-danger font-bold text-sm mb-2">API de version incorrecta</p>
        {@html `<pre class="code-block text-xs text-agent-muted"># El agente usa Pydantic v1 syntax:
class User(BaseModel):
    class Config:
        orm_mode = True

# Pero tu proyecto usa Pydantic v2:
class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)</pre>`}
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">El "Hallucination Journal"</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Un concepto poderoso: lleva un registro de los errores que tu agente comete frecuentemente. Despues de 2-3 semanas, tendras un patron claro de SUS debilidades especificas, y podras anticipar y detectar esos errores mas rapido. Algunos errores comunes que vas a encontrar:
    </p>
    <ul class="space-y-2 text-sm text-agent-muted mb-4">
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> Mezclar versiones de librerias (Pydantic v1 vs v2, SQLAlchemy 1.x vs 2.0)</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> Usar funciones deprecated sin darse cuenta</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> Inventar parametros de funciones que no existen</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> Generar tests que siempre pasan (no prueban nada realmente)</li>
      <li class="flex items-start gap-2"><span class="text-agent-accent shrink-0">*</span> Olvidar manejar el caso None/null/undefined</li>
    </ul>

    <div class="bg-agent-info/5 border border-agent-info/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-info font-bold mb-1">Caso Real</p>
      <p class="text-sm text-agent-muted">Un equipo de desarrollo desplego un endpoint generado por IA que parecia perfecto: tenia type hints, seguia el pattern del proyecto, pasaba los tests. Pero en produccion, bajo carga alta, el endpoint hacia un query N+1 que cargaba TODOS los registros relacionados. Con 50 requests concurrentes, la base de datos se satura y el servicio cayo. El agente escribio codigo "correcto" pero sin pensar en performance a escala. La leccion: los tests no cubrian el escenario de carga.</p>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Construir intuicion: 2-3 meses de practica deliberada</h3>
    <p class="text-agent-muted leading-relaxed mb-3">
      Revisar codigo de IA es una habilidad que se desarrolla. Al principio todo se ve "correcto" porque la sintaxis es perfecta. Con el tiempo aprendes a ver los patrones de error: imports sospechosos, logica demasiado simple para un problema complejo, ausencia de manejo de errores. La regla general: si el codigo del agente se ve "demasiado facil" para un problema que tu sabes que es complejo, probablemente le falta algo.
    </p>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">El objetivo no es desconfiar de todo lo que genera el agente. Es desarrollar el instinto para saber DONDE mirar. Con el tiempo, sabes que la seguridad, los edge cases, y la performance son los puntos debiles de la IA, y concentras tu revision ahi. El happy path suele estar bien; las esquinas son donde viven los bugs.</p>
    </div>
  </section>

  <!-- THEORY SECTION 5: Proyectos Agent-Friendly -->
  <section class="mb-10 fade-in">
    <h2 class="text-2xl font-bold text-agent-text mb-4">Estructurar Proyectos Agent-Friendly</h2>
    <p class="text-agent-muted leading-relaxed mb-4">
      Un proyecto bien estructurado hace que los agentes sean <strong class="text-agent-highlight">drasticamente mas efectivos</strong>. Piensalo asi: si un humano nuevo tarda 2 semanas en entender tu codebase, el agente tambien va a batallar. La diferencia: el humano puede preguntar en Slack. El agente solo tiene lo que puede leer.
    </p>

    <h3 class="text-lg font-bold text-agent-text mb-3">Las 10 practicas que hacen tu proyecto agent-friendly</h3>
    <div class="space-y-3 mb-6">
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">01</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">README actualizado y completo</h4>
          <p class="text-sm text-agent-muted">Tu README es la primera impresion del agente sobre tu proyecto. Debe incluir: como instalar, como correr, como testear, y la estructura del proyecto. Si tu README dice "TODO: write docs", el agente va a improvisar.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">02</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Nombres descriptivos y consistentes</h4>
          <p class="text-sm text-agent-muted"><code class="text-agent-accent">user_repository.py</code> le dice al agente exactamente que hay adentro. <code class="text-agent-accent">utils.py</code> no le dice nada. <code class="text-agent-accent">helpers2_final_v3.py</code> le dice que tu proyecto necesita ayuda urgente.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">03</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Tests automatizados ejecutables</h4>
          <p class="text-sm text-agent-muted">Los tests son el sistema de verificacion del agente. Sin tests, el agente no tiene forma de saber si su cambio rompio algo. Con tests, puede ejecutar <code class="text-agent-accent">pytest</code> despues de cada cambio y detectar regresiones inmediatamente.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">04</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Type annotations en todo</h4>
          <p class="text-sm text-agent-muted">Los type hints le dicen al agente que tipo de datos espera y retorna cada funcion. Sin tipos, el agente tiene que adivinar si <code class="text-agent-accent">process(data)</code> recibe un string, un dict, o un DataFrame. Con tipos: <code class="text-agent-accent">process(data: pd.DataFrame) -> dict[str, float]</code>.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">05</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Archivos modulares y pequeños</h4>
          <p class="text-sm text-agent-muted">Un archivo de 2000 lineas consume context window innecesariamente. Archivos de 100-300 lineas con una sola responsabilidad son ideales: el agente lee solo lo que necesita.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">06</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">CI/CD como guardrail</h4>
          <p class="text-sm text-agent-muted">Si el agente introduce un bug, el CI/CD lo detecta antes de que llegue a produccion. Linting, type checking, tests, y security scans actuan como una red de seguridad automatica.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">07</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Rules file versionado</h4>
          <p class="text-sm text-agent-muted">CLAUDE.md, .cursorrules, o AGENTS.md en la raiz del repo. Versionado con Git para que todo el equipo use las mismas reglas.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">08</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Estructura de carpetas predecible</h4>
          <p class="text-sm text-agent-muted">Si el agente necesita crear un nuevo endpoint, debe saber DONDE va el archivo sin adivinar. Estructura clara: <code class="text-agent-accent">routers/</code>, <code class="text-agent-accent">services/</code>, <code class="text-agent-accent">repositories/</code>, <code class="text-agent-accent">schemas/</code>.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">09</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Documentacion inline (docstrings)</h4>
          <p class="text-sm text-agent-muted">Los docstrings explican la INTENCION del codigo, no solo QUE hace. El agente puede leer el codigo y entender la sintaxis, pero necesita docstrings para entender el POR QUE.</p>
        </div>
      </div>
      <div class="flex items-start gap-3 p-3 bg-agent-dark rounded-lg border border-agent-border">
        <span class="text-agent-accent text-lg shrink-0 font-bold">10</span>
        <div>
          <h4 class="text-agent-text font-bold text-sm">Separacion clara de responsabilidades</h4>
          <p class="text-sm text-agent-muted">Si la logica de negocio esta mezclada con las queries de DB y la presentacion, el agente no sabe donde hacer cambios. Clean Architecture no es capricho; es lo que permite que el agente (y tu equipo) trabaje efectivamente.</p>
        </div>
      </div>
    </div>

    <h3 class="text-lg font-bold text-agent-text mb-3">Mono-repo vs Multi-repo para agentes</h3>
    <p class="text-agent-muted leading-relaxed mb-4">
      Los agentes funcionan mejor con <strong class="text-agent-text">mono-repos</strong> porque tienen acceso a todo el contexto del proyecto en un solo lugar. Con multi-repos, el agente solo ve el repositorio actual y no puede hacer cambios coordinados entre servicios. Sin embargo, los mono-repos grandes pueden sobrecargar el context window. La solucion intermedia: mono-repo con modulos bien separados y un buen CLAUDE.md que explique la estructura.
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
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Type annotations y docstrings</li>
          <li class="flex items-start gap-2"><span class="text-agent-success">&#x2713;</span> Archivos pequeños con una sola responsabilidad</li>
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
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Sin type hints: el agente adivina tipos</li>
          <li class="flex items-start gap-2"><span class="text-agent-danger">&#x2717;</span> Variables y funciones con nombres ambiguos</li>
        </ul>
      </div>
    </div>

    <div class="bg-agent-warning/5 border border-agent-warning/20 rounded-lg p-4 mb-4">
      <p class="text-sm text-agent-warning font-bold mb-1">Concepto Clave</p>
      <p class="text-sm text-agent-muted">Tu README es la primera impresion del agente sobre tu proyecto. Si el README dice "clone and run", el agente no sabe la arquitectura, las convenciones, ni las restricciones. Un buen README + un buen rules file = un agente que genera codigo consistente desde el primer dia.</p>
    </div>

    <div class="bg-agent-dark border border-agent-accent/30 rounded-lg p-4">
      <p class="text-sm text-agent-accent font-bold mb-1">Insight clave:</p>
      <p class="text-sm text-agent-muted">Lo que hace un proyecto "agent-friendly" es EXACTAMENTE lo que hace un proyecto "developer-friendly". Las buenas practicas de ingenieria de software <strong class="text-agent-text">ya eran correctas</strong> antes de los agentes. La IA simplemente hace que las consecuencias de ignorarlas sean mas inmediatas y visibles. Si tu proyecto es un caos, el agente solo va a generar mas caos.</p>
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
