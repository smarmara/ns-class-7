import { create } from 'zustand';
import {
  DAILY_GOAL_OPTIONS,
  XP_CORRECT_ANSWER,
  addXp,
  emptyEngagement,
  type Engagement,
} from '@/engine/engagement/types';
import { mockCompletionXp, type XpBreakdown } from '@/engine/engagement/xp';
import { clearLearnerState, saveLearnerState } from './learnerStorage';

interface EngagementState {
  engagement: Engagement;
  hydrated: boolean;
  /** Install loaded state after a launch or a restored backup. */
  install: (engagement: Engagement) => void;
  /** XP for a correct practice answer. Positive only — nothing ever deducts. */
  awardCorrect: () => void;
  /** XP for finishing a practice session (includes remediation credit). */
  awardSession: (breakdown: XpBreakdown) => void;
  /** XP for completing a mock exam — awarded only after submission. */
  awardMock: () => void;
  setGoal: (goalXp: number) => void;
  cycleGoal: () => void;
  /** Record a Sign Match streak; stores it only when it beats the record. */
  recordSignMatchStreak: (streak: number) => void;
  resetAll: () => Promise<void>;
}

function persist(): void {
  void saveLearnerState();
}

export const useEngagement = create<EngagementState>((set, get) => ({
  engagement: emptyEngagement(),
  hydrated: false,

  install: (engagement) => {
    set({ engagement, hydrated: true });
  },

  awardCorrect: () => {
    const next = addXp(get().engagement, XP_CORRECT_ANSWER);
    set({ engagement: next });
    persist();
  },

  awardSession: (breakdown) => {
    const next = addXp(get().engagement, breakdown.total);
    set({ engagement: next });
    persist();
  },

  awardMock: () => {
    const next = addXp(get().engagement, mockCompletionXp());
    set({ engagement: next });
    persist();
  },

  setGoal: (goalXp) => {
    const next = { ...get().engagement, goalXp };
    set({ engagement: next });
    persist();
  },

  cycleGoal: () => {
    const current = get().engagement.goalXp;
    const index = DAILY_GOAL_OPTIONS.findIndex((g) => g === current);
    const next = DAILY_GOAL_OPTIONS[(index + 1) % DAILY_GOAL_OPTIONS.length] ?? DAILY_GOAL_OPTIONS[0];
    get().setGoal(next);
  },

  /*
   * Written only when the learner beats their record, so an ordinary answer
   * never touches storage. Called as the streak grows rather than at the end of
   * a session, because the learner may leave by Back, the bottom navigation or
   * simply closing the app — the record should already be safe by then.
   */
  recordSignMatchStreak: (streak) => {
    const current = get().engagement;
    const best = current.signMatchBestStreak ?? 0;
    if (!Number.isFinite(streak) || streak <= best) return;
    set({ engagement: { ...current, signMatchBestStreak: Math.floor(streak) } });
    persist();
  },

  resetAll: async () => {
    await clearLearnerState();
    set({ engagement: emptyEngagement() });
  },
}));