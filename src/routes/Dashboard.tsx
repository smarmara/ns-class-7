import { Link } from 'react-router-dom';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import { computeReadiness, weakTopics } from '@/engine/learning/readiness';
import { mistakeQueue } from '@/engine/learning/scheduler';
import { pathProgress } from '@/engine/learning/path';
import { allMedals, courseProgress, levelFor } from '@/engine/engagement/progression';
import { useProgress } from '@/store/useProgress';
import { signMatchBestStreak } from '@/engine/engagement/types';
import { useEngagement } from '@/store/useEngagement';
import { SignArt } from '@/signs/SignArt';
import { ArrowRightIcon, FocusIcon, MedalIcon, XpIcon } from '@/ui/icons';
import { ProgressRing } from '@/ui/progress';

/** Time-of-day greeting. Generic by design — this app has no accounts. */
function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function topicTotal(topic: string): number {
  return activeQuestions.filter((q) => q.topic === topic).length;
}

/**
 * Home — a launch surface, not a feed.
 *
 * Everything here answers one question: what should I do right now? It is
 * deliberately curated to four things (greeting, continue, progress, focus)
 * so it fits a normal phone viewport without scrolling. The full statistics,
 * topic lists and review queues live on Progress and Learn, one tap away.
 */
export function Dashboard() {
  const progress = useProgress((s) => s.progress);
  const engagement = useEngagement((s) => s.engagement);
  const bestStreak = signMatchBestStreak(engagement);

  const rules = computeReadiness(activeQuestions, progress, { type: 'rules' });
  const signs = computeReadiness(activeQuestions, progress, { type: 'sign' });
  const path = pathProgress(activeQuestions, progress, rules, signs);
  const next = path.next;

  // The ring measures the whole journey, not the last few days: it fills as
  // topics deepen and only reaches 100% when everything is mastered.
  const course = courseProgress(activeQuestions, progress);
  const standing = levelFor(course.completion);
  const medals = allMedals(activeQuestions, progress);

  const weak = weakTopics(activeQuestions, progress);
  const mistakes = mistakeQueue(progress);
  const focus = weak[0] ?? null;

  const heroTopic = next?.topic ?? null;
  const heroSeen = next?.evidence.questionsAttempted ?? 0;
  const heroTotal = heroTopic ? topicTotal(heroTopic) : 0;
  const heroPct = heroTotal === 0 ? 0 : Math.round((heroSeen / heroTotal) * 100);

  return (
    <div className="screen home">
      <header className="home-greet">
        <h1>{greeting()}</h1>
        <p>
          {standing.isMax
            ? 'Expert — every topic mastered.'
            : `${standing.level.name} · ${course.percent}% of the way to Expert`}
        </p>
      </header>

      {/* The unofficial status is a standing legal statement, so it belongs on
          the first screen too — one quiet line, not a banner. */}
      <p className="home-legal">
        Unofficial study aid. Not affiliated with or endorsed by the Government of Nova Scotia.{' '}
        <Link to="/sources">Sources</Link>
      </p>

      {heroTopic ? (
        <Link className="hero-module" to={`/study/${heroTopic}`}>
          <span className="hero-eyebrow">Continue learning</span>
          <span className="hero-title">{TOPIC_LABELS[heroTopic] ?? heroTopic}</span>
          <span className="hero-meta">
            {heroSeen} of {heroTotal} questions seen
          </span>
          <span
            className="hero-bar"
            role="progressbar"
            aria-label={`${TOPIC_LABELS[heroTopic] ?? heroTopic} progress`}
            aria-valuenow={heroPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${heroSeen} of ${heroTotal} questions seen`}
          >
            <span className="hero-bar-fill" style={{ width: `${heroPct}%` }} />
          </span>
          <span className="hero-cta">
            Continue <ArrowRightIcon />
          </span>
        </Link>
      ) : (
        <Link className="hero-module" to="/practice">
          <span className="hero-eyebrow">You are ready</span>
          <span className="hero-title">Take a practice exam</span>
          <span className="hero-meta">Every topic on your path is mastered</span>
          <span className="hero-cta">
            Start <ArrowRightIcon />
          </span>
        </Link>
      )}

      <div className="bento">
        <Link className="bento-ring" to="/profile">
          <ProgressRing
            value={course.percent}
            max={100}
            size={104}
            stroke={9}
            label={`Course progress: ${course.percent}% complete, ${course.topicsComplete} of ${course.topicsTotal} topics complete`}
          >
            <span className="ring-value">{course.percent}%</span>
            <span className="ring-cap">complete</span>
          </ProgressRing>
          <span className="bento-ring-note">
            {course.topicsComplete} / {course.topicsTotal} topics complete
          </span>
        </Link>

        <div className="bento-side">
          {/* Level, not a streak: earned by mastering material, so it never
              decays for taking a day off and never guilt-trips. */}
          <div className="metric metric-level">
            <span className="metric-body">
              <span className="metric-value metric-value-sm">{standing.level.name}</span>
              <span className="metric-label">
                {standing.isMax
                  ? 'Top level reached'
                  : `Next: ${standing.next?.name}`}
              </span>
              <span
                className="goal-bar"
                role="progressbar"
                aria-label="Progress to the next level"
                aria-valuenow={Math.round(standing.progressToNext * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={
                  standing.isMax
                    ? 'Expert level reached'
                    : `${Math.round(standing.progressToNext * 100)}% of the way to ${standing.next?.name}`
                }
              >
                <span
                  className="goal-bar-fill goal-bar-level"
                  style={{ width: `${Math.round(standing.progressToNext * 100)}%` }}
                />
              </span>
            </span>
          </div>

          <div className="metric">
            <span className="metric-icon" data-tone="medal">
              <MedalIcon />
            </span>
            <span className="metric-body">
              <span className="metric-value">{medals.earned}</span>
              <span className="metric-label">medals earned</span>
            </span>
          </div>

          <div className="metric">
            <span className="metric-icon" data-tone="xp">
              <XpIcon />
            </span>
            <span className="metric-body">
              <span className="metric-value">{engagement.xp}</span>
              <span className="metric-label">total XP</span>
            </span>
          </div>
        </div>
      </div>

      {/*
        * Sign Match: the strongest secondary feature on Home, given a real
        * feature panel rather than another navigation row. It still sits below
        * the learning hero and the progress stats — the study path stays the
        * highest priority — but it now looks like something worth discovering.
        *
        * The whole panel is one link with an internal visual CTA, so there are
        * no nested interactive controls. Its accessible name comes from the
        * visible copy, which keeps voice control working ("click Play Sign
        * Match"); only the decorative artwork is hidden from assistive tech.
        */}
      <Link className="match-feature" to="/signs/match">
        <span className="match-feature-body">
          <span className="match-feature-eyebrow">Sign Match</span>
          <span className="match-feature-headline">Think you know your road signs?</span>
          <span className="match-feature-sub">Choose the sign that matches the name.</span>
          <span className="match-feature-actions">
            <span className="match-feature-cta">Play Sign Match</span>
            <span className="match-feature-streak">
              Best streak
              <span className="match-feature-streak-value">{bestStreak}</span>
            </span>
          </span>
        </span>

        <span className="match-feature-art">
          <span className="match-feature-sign match-feature-sign-back" aria-hidden="true">
            <SignArt signId="slippery-when-wet" size={60} decorative />
          </span>
          <span className="match-feature-sign match-feature-sign-front" aria-hidden="true">
            <SignArt signId="stop" size={76} decorative />
          </span>
        </span>
      </Link>

      {focus ? (
        <Link className="focus-next" to={`/study/${focus.topic}`}>
          <span className="focus-eyebrow">
            <FocusIcon /> Focus next
          </span>
          <span className="focus-title">{TOPIC_LABELS[focus.topic] ?? focus.topic}</span>
          <span className="focus-sub">
            {focus.attempts - focus.correct} missed of {focus.attempts} answered
          </span>
          <span className="focus-cta" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
      ) : mistakes.length > 0 ? (
        <Link className="focus-next" to="/review/mistakes">
          <span className="focus-eyebrow">
            <FocusIcon /> Focus next
          </span>
          <span className="focus-title">Review your mistakes</span>
          <span className="focus-sub">
            {mistakes.length} question{mistakes.length === 1 ? '' : 's'} waiting
          </span>
          <span className="focus-cta" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
      ) : (
        <Link className="focus-next" to="/practice/quick">
          <span className="focus-eyebrow">
            <FocusIcon /> Focus next
          </span>
          <span className="focus-title">Quick Practice</span>
          <span className="focus-sub">A mixed set across everything you have seen</span>
          <span className="focus-cta" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
      )}
    </div>
  );
}
