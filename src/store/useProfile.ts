import { create } from 'zustand';
import type { LearnerProfile } from '@/engine/profile/types';
import { normaliseDisplayName } from '@/engine/profile/types';
import { saveLearnerState } from './learnerStorage';

/**
 * The learner's local profile.
 *
 * Purely local: a display name kept in the same envelope as progress, with no
 * account, no sign-in and nothing sent anywhere. It survives "Reset all
 * progress" — that control resets learning data, and a learner's name is not
 * learning data.
 */
interface ProfileState {
  profile: LearnerProfile | undefined;
  hydrated: boolean;
  install: (profile: LearnerProfile | undefined) => void;
  setDisplayName: (name: string) => void;
  clear: () => void;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: undefined,
  hydrated: false,

  install: (profile) => set({ profile, hydrated: true }),

  setDisplayName: (name) => {
    const clean = normaliseDisplayName(name);
    if (!clean) return;
    if (get().profile?.displayName === clean) return;
    set({ profile: { displayName: clean } });
    void saveLearnerState();
  },

  clear: () => {
    set({ profile: undefined });
    void saveLearnerState();
  },
}));
