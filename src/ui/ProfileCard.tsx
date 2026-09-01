import { useEffect, useRef, useState } from 'react';
import { activeQuestions } from '@/content';
import { allMedals } from '@/engine/engagement/progression';
import { achievementMedals } from '@/engine/engagement/achievementPresentation';
import { MAX_DISPLAY_NAME, profileInitials } from '@/engine/profile/types';
import { useProgress } from '@/store/useProgress';
import { useProfile } from '@/store/useProfile';
import { APPEARANCE_OPTIONS, useAppearance, type Appearance } from '@/store/useAppearance';
import { SteeringWheelBadge } from './SteeringWheelBadge';
import { YieldSignBadge } from './YieldSignBadge';

/**
 * The learner's own card: who they are, how the app looks, and what they have
 * earned.
 *
 * Everything here is local. There is no account, no sign-in, no email and
 * nothing sent anywhere — the display name lives in the same on-device envelope
 * as progress, and the appearance choice is a device preference.
 *
 * Achievements are read from the existing medal system; nothing new is minted
 * here, and an unearned medal is never shown as earned.
 */
export function ProfileCard() {
  const profile = useProfile((s) => s.profile);
  const setDisplayName = useProfile((s) => s.setDisplayName);
  const progress = useProgress((s) => s.progress);
  const appearance = useAppearance((s) => s.appearance);
  const setAppearance = useAppearance((s) => s.setAppearance);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile?.displayName ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const medals = allMedals(activeQuestions, progress);
  const earned = achievementMedals(activeQuestions, progress).filter((m) => m.earned);

  const startEditing = () => {
    setDraft(profile?.displayName ?? '');
    setEditing(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayName(draft);
    setEditing(false);
  };

  return (
    <section className="profile-card" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="sr-only">
        Your profile
      </h2>

      <div className="profile-identity">
        <span className="profile-avatar" aria-hidden="true">
          {profile ? profileInitials(profile) : null}
        </span>

        {editing ? (
          <form className="profile-name-form" onSubmit={save}>
            <label className="sr-only" htmlFor="profile-name">
              Display name
            </label>
            <input
              id="profile-name"
              ref={inputRef}
              className="profile-name-input"
              value={draft}
              maxLength={MAX_DISPLAY_NAME}
              placeholder="Your name"
              autoComplete="off"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary profile-name-save">
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary profile-name-cancel"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </form>
        ) : profile ? (
          <>
            <span className="profile-name">{profile.displayName}</span>
            <button type="button" className="btn-quiet profile-edit" onClick={startEditing}>
              Edit<span className="sr-only"> your display name</span>
            </button>
          </>
        ) : (
          <>
            <span className="profile-name-empty">
              <span className="profile-name">Create your profile</span>
              <span className="profile-name-sub">Add your name to personalise the app.</span>
            </span>
            <button type="button" className="btn btn-secondary profile-edit" onClick={startEditing}>
              Create profile
            </button>
          </>
        )}
      </div>

      <div className="profile-row">
        <fieldset className="profile-appearance">
          <legend>Appearance</legend>
          <div className="segmented" role="radiogroup" aria-label="Appearance">
            {APPEARANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={appearance === option.value}
                className="segmented-option"
                onClick={() => setAppearance(option.value as Appearance)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="profile-row">
        <span className="profile-row-label">Achievements</span>
        {earned.length === 0 ? (
          <>
            <p className="profile-achievements-empty">None yet — complete a topic to earn your first.</p>
            <a className="profile-achievements-link" href="#/profile/achievements">View all achievements <span aria-hidden="true">→</span></a>
          </>
        ) : (
          <>
            <p className="profile-achievements-count">
              {earned.length} of {medals.total} earned
            </p>
            <ul className="profile-achievements">
              {earned.slice(0, 6).map((medal) => (
                <li key={medal.id} className="profile-achievement" title={medal.requirement}>
                  {medal.tone === 'signs'
                    ? <YieldSignBadge earned mastered={medal.mastered} width={28} height={28} />
                    : <SteeringWheelBadge kind="topic" tone="rules" earned mastered={medal.mastered} width={28} height={28} />}
                  <span>
                    {medal.label}
                  </span>
                </li>
              ))}
            </ul>
            <a className="profile-achievements-link" href="#/profile/achievements">View all achievements <span aria-hidden="true">→</span></a>
          </>
        )}
      </div>
    </section>
  );
}
