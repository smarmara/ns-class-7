/**
 * Engagement state: XP, daily goal, mastery.
 *
 * This is the motivational layer. It deliberately lives apart from Readiness
 * (a study-progress score that is explicitly not a prediction) and NEVER feeds
 * back into exam correctness, scoring thresholds or scheduling. XP can only
 * ever be earned; nothing deducts it.
 */

export interface DailyXP {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  xp: number;
}

export interface Engagement {
  version: number;
  /** All-time XP. Motivational only. */
  xp: number;
  /** Optional daily goal in XP. 0 disables the goal. */
  goalXp: number;
  /** Recent daily XP totals, newest first. Trimmed to keep storage small. */
  daily: DailyXP[];
  /**
   * Longest run of correct answers ever reached in Sign Match.
   *
   * The only Sign Match datum that survives a session. The game's current
   * score, streak and round history stay ephemeral on purpose — persist the
   * achievement, not the session — and none of this touches the formal
   * question/mastery record.
   *
   * Optional so that saves written before it existed load without migration.
   */
  signMatchBestStreak?: number;
}

export const ENGAGEMENT_VERSION = 1;
export const MAX_DAILY_LOG = 30;

/** XP amounts. Generous enough to be rewarding, calm enough to stay serious. */
export const XP_CORRECT_ANSWER = 10;
export const XP_SESSION_COMPLETION = 25;
export const XP_WEAK_RECOVERY = 15;
export const XP_MOCK_COMPLETION = 50;

/** Options the learner can cycle through for their daily goal. */
export const DAILY_GOAL_OPTIONS = [0, 20, 30, 40, 60] as const;
export const DEFAULT_GOAL_XP = 30;

export function emptyEngagement(): Engagement {
  return {
    version: ENGAGEMENT_VERSION,
    xp: 0,
    goalXp: DEFAULT_GOAL_XP,
    daily: [],
    signMatchBestStreak: 0,
  };
}

export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** XP earned so far today, from the stored daily log. */
export function todayXp(engagement: Engagement, now: Date = new Date()): number {
  const today = localDate(now);
  const entry = engagement.daily.find((d) => d.date === today);
  return entry?.xp ?? 0;
}

/** How many of the last 7 calendar days had study activity (streak-friendly). */
export function studiedDaysLast7(engagement: Engagement, now: Date = new Date()): boolean[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const byDate = new Map(engagement.daily.map((d) => [d.date, d.xp]));
  const days: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push((byDate.get(localDate(d)) ?? 0) > 0);
  }
  return days;
}

/**
 * Fold a new XP gain into the engagement state: bump the lifetime total and
 * today's daily entry, keeping the log trimmed. Pure function — the store
 * applies it.
 */
export function addXp(engagement: Engagement, amount: number, now: Date = new Date()): Engagement {
  if (amount <= 0) return engagement;
  const today = localDate(now);
  const daily = [
    { date: today, xp: (engagement.daily.find((d) => d.date === today)?.xp ?? 0) + amount },
    ...engagement.daily.filter((d) => d.date !== today),
  ].slice(0, MAX_DAILY_LOG);
  return { ...engagement, xp: engagement.xp + amount, daily };
}

/** The learner's best Sign Match streak, 0 when they have never played. */
export function signMatchBestStreak(engagement: Engagement): number {
  const best = engagement.signMatchBestStreak;
  return typeof best === 'number' && Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
}
