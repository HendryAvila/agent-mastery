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
  version: number;
  currentModule: number;
  modules: Record<number, ModuleProgress>;
  totalScore: number;
  badges: Badge[];
  vocabularyDismissed: string[];
  userName: string;
  startedAt: string;
}

const STORAGE_KEY = 'agent-mastery-progress';
const TOTAL_MODULES = 13;
const STORE_VERSION = 2;

export const allBadges: Badge[] = [
  { id: 'agent-anatomy', name: 'Anatomista de Agentes', icon: '\u{1F9EC}', description: 'Entiendes la anatomia de un agente IA' },
  { id: 'tool-caller', name: 'Maestro de Herramientas', icon: '\u{1F527}', description: 'Dominaste tool calling y MCP' },
  { id: 'ecosystem-explorer', name: 'Explorador del Ecosistema', icon: '\u{1F310}', description: 'Conoces el ecosistema de agentes 2026' },
  { id: 'context-engineer', name: 'Ingeniero de Contexto', icon: '\u{1F3AF}', description: 'Dominas context engineering y CLAUDE.md' },
  { id: 'claude-pro', name: 'Claude Code Pro', icon: '\u{1F4BB}', description: 'Trabajas con Claude Code como un profesional' },
  { id: 'agent-builder', name: 'Constructor de Agentes', icon: '\u26A1', description: 'Construiste tu propio agente con Agent SDK' },
  { id: 'memory-architect', name: 'Arquitecto de Memoria', icon: '\u{1F9E0}', description: 'Dominas memoria, planning y razonamiento' },
  { id: 'deep-diver', name: 'Deep Diver', icon: '\u{1F52C}', description: 'Dominas hooks, skills y sub-agents de Claude Code' },
  { id: 'orchestrator', name: 'Orquestador Multi-Agente', icon: '\u{1F3AD}', description: 'Dominas frameworks y patrones de orquestacion' },
  { id: 'guardian', name: 'Guardian de Seguridad', icon: '\u{1F6E1}\uFE0F', description: 'Experto en guardrails, seguridad y evaluacion' },
  { id: 'workspace-master', name: 'Maestro del Entorno', icon: '\u{1F5A5}\uFE0F', description: 'Configuraste el entorno profesional perfecto' },
  { id: 'production-ready', name: 'Production Ready', icon: '\u{1F3ED}', description: 'Llevas agentes a produccion con confianza' },
  { id: 'agent-architect', name: 'Arquitecto de Agentes', icon: '\u{1F3C6}', description: 'Completaste el taller final con excelencia' },
  { id: 'claude-code-master', name: 'Claude Code Master', icon: '\u{1F451}', description: 'Score 90%+ en Context Engineering, Claude Code Pro y Deep Dive' },
];

function getDefaultState(): CourseState {
  return {
    version: STORE_VERSION,
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
      // Version migration: reset if old format or outdated version
      if (!parsed.version || parsed.version < STORE_VERSION) {
        return getDefaultState();
      }
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

        // Check for Claude Code Master badge (90%+ on modules 4, 5, 8)
        const mod4 = s.modules[4];
        const mod5 = s.modules[5];
        const mod8 = s.modules[8];
        if (mod4?.completed && mod5?.completed && mod8?.completed) {
          const has90_4 = mod4.maxScore > 0 && mod4.score >= mod4.maxScore * 0.9;
          const has90_5 = mod5.maxScore > 0 && mod5.score >= mod5.maxScore * 0.9;
          const has90_8 = mod8.maxScore > 0 && mod8.score >= mod8.maxScore * 0.9;
          if (has90_4 && has90_5 && has90_8) {
            if (!s.badges.some((b) => b.id === 'claude-code-master')) {
              const badge = allBadges.find((b) => b.id === 'claude-code-master');
              if (badge) {
                s.badges.push({ ...badge, unlockedAt: new Date().toISOString() });
              }
            }
          }
        }

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
