import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface ModuleProgress {
  completed: boolean;
  score: number;
  maxScore: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface CourseState {
  currentModule: number;
  modules: Record<number, ModuleProgress>;
  totalScore: number;
  badges: Badge[];
  vocabularyDismissed: string[];
  userName: string;
  startedAt: string;
}

const STORAGE_KEY = 'agent-mastery-progress';
const TOTAL_MODULES = 12;

export const allBadges: Badge[] = [
  { id: 'first-step', name: 'Primer Contacto', icon: '\u{1F680}', description: 'Completaste tu primer modulo' },
  { id: 'agent-anatomy', name: 'Anatomista', icon: '\u{1F9EC}', description: 'Entiendes la anatomia de un agente' },
  { id: 'tool-master', name: 'Tool Master', icon: '\u{1F527}', description: 'Dominaste tool calling con 80%+' },
  { id: 'ecosystem-explorer', name: 'Explorador', icon: '\u{1F310}', description: 'Conoces todo el ecosistema 2026' },
  { id: 'agent-whisperer', name: 'Agent Whisperer', icon: '\u{1F3AF}', description: 'Sabes dirigir agentes como un pro' },
  { id: 'builder', name: 'Constructor', icon: '\u26A1', description: 'Construiste tu primer agente' },
  { id: 'brain-architect', name: 'Arquitecto Mental', icon: '\u{1F9E0}', description: 'Dominas memoria y planning' },
  { id: 'orchestrator', name: 'Orquestador', icon: '\u{1F3AD}', description: 'Dominas los patrones multi-agente' },
  { id: 'guardian', name: 'Guardian', icon: '\u{1F6E1}\uFE0F', description: 'Experto en seguridad de agentes' },
  { id: 'agent-architect', name: 'Agent Architect', icon: '\u{1F3C6}', description: 'Completaste el curso completo' },
];

function getDefaultState(): CourseState {
  return {
    currentModule: 1,
    modules: {},
    totalScore: 0,
    badges: [],
    vocabularyDismissed: [],
    userName: '',
    startedAt: new Date().toISOString(),
  };
}

function loadState(): CourseState {
  if (!browser) return getDefaultState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load course state:', e);
  }
  return getDefaultState();
}

function saveState(state: CourseState) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save course state:', e);
  }
}

function createCourseStore() {
  const { subscribe, set, update } = writable<CourseState>(loadState());

  // Auto-save on every change
  subscribe((state) => {
    saveState(state);
  });

  return {
    subscribe,
    set,
    update,

    setUserName(name: string) {
      update((s) => ({ ...s, userName: name }));
    },

    startModule(moduleId: number) {
      update((s) => {
        if (!s.modules[moduleId]) {
          s.modules[moduleId] = {
            completed: false,
            score: 0,
            maxScore: 0,
            startedAt: new Date().toISOString(),
          };
        }
        return { ...s, currentModule: Math.max(s.currentModule, moduleId) };
      });
    },

    completeModule(moduleId: number, score: number, maxScore: number) {
      update((s) => {
        const existing = s.modules[moduleId];
        const prevScore = existing?.score ?? 0;
        s.modules[moduleId] = {
          completed: true,
          score: Math.max(score, prevScore),
          maxScore,
          startedAt: existing?.startedAt ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        // Recalculate total score
        let total = 0;
        for (const mod of Object.values(s.modules)) {
          total += mod.score;
        }
        s.totalScore = total;

        // Advance current module
        s.currentModule = Math.max(s.currentModule, moduleId + 1);

        return { ...s };
      });
    },

    unlockBadge(badgeId: string): Badge | null {
      let unlocked: Badge | null = null;
      update((s) => {
        if (s.badges.some((b) => b.id === badgeId)) return s;
        const badge = allBadges.find((b) => b.id === badgeId);
        if (!badge) return s;
        const newBadge = { ...badge, unlockedAt: new Date().toISOString() };
        s.badges.push(newBadge);
        unlocked = newBadge;
        return { ...s };
      });
      return unlocked;
    },

    dismissVocabulary(termId: string) {
      update((s) => {
        if (!s.vocabularyDismissed.includes(termId)) {
          s.vocabularyDismissed.push(termId);
        }
        return { ...s };
      });
    },

    reset() {
      const fresh = getDefaultState();
      set(fresh);
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  };
}

export const courseStore = createCourseStore();

export const progressPercent = derived(courseStore, ($store) => {
  const completed = Object.values($store.modules).filter((m) => m.completed).length;
  return Math.round((completed / TOTAL_MODULES) * 100);
});

export const totalModules = TOTAL_MODULES;
