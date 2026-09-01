import { Link } from 'react-router-dom';
import { ALL_TOPICS, RULES_TOPICS, TOPIC_LABELS, activeQuestions, contentLastVerified } from '@/content';
import {
  computeReadiness,
  recentPerformance,
  strongTopics,
  weakTopics,
} from '@/engine/learning/readiness';
import { bookmarkedQuestions, mistakeQueue } from '@/engine/learning/scheduler';
import { pathProgress } from '@/engine/learning/path';
import { isComplete, isMastered, topicMastery } from '@/engine/learning/mastery';
import { signCategoryLearnProgress } from '@/engine/learning/signCategories';
import { allMedals, courseProgress, levelFor, LEVELS } from '@/engine/engagement/progression';
import { achievementMedals, sectionPresentation } from '@/engine/engagement/achievementPresentation';
import { ProfileCard } from '@/ui/ProfileCard';
import { todayXp } from '@/engine/engagement/types';
import { useProgress } from '@/store/useProgress';
import { useEngagement } from '@/store/useEngagement';
import { Disclaimer } from '@/ui/components';
import {
  ArrowRightIcon,
  BookmarkIcon,
  ChevronIcon,
  FocusIcon,
  MedalIcon,
  MistakeIcon,
  WeakAreaIcon,
  XpIcon,
} from '@/ui/icons';
import { ProgressRing } from '@/ui/progress';
import { SteeringWheelBadge } from '@/ui/SteeringWheelBadge';
import { YieldSignBadge } from '@/ui/YieldSignBadge';

/**
 * Progress — a content-first screen. It scrolls, and it is where the detailed
 * numbers that used to crowd Home now live.
 *
 * The top of the screen answers the five questions a learner actually brings:
 * "how far along am I?" and "what have I completed?" (course ring, topics
 * complete/mastered), "what should I do next?" (recommended next), and the
 * Rules/Signs meters answer "how am I doing in each half?" — using each
 * surface's real model (Rules topics, assessed Core concepts).
 */
export function Progress() {
  const progress = useProgress((s) => s.progress);
  const engagement = useEngagement((s) => s.engagement);
  const cycleGoal = useEngagement((s) => s.cycleGoal);

  const rules = computeReadiness(activeQuestions, progress, { type: 'rules' });
  const signs = computeReadiness(activeQuestions, progress, { type: 'sign' });
  const path = pathProgress(activeQuestions, progress, rules, signs);
  const next = path.next;

  const recent = recentPerformance(progress, 20);
  const weak = weakTopics(activeQuestions, progress).slice(0, 4);
  const strong = strongTopics(activeQuestions, progress).slice(0, 3);
  const mistakes = mistakeQueue(progress);
  const saved = bookmarkedQuestions(progress);

  const answered = Object.values(progress.questions).reduce((n, s) => n + s.seen, 0);
  const totalCorrect = Object.values(progress.questions).reduce((n, s) => n + s.correct, 0);
  const accuracyPct = answered === 0 ? null : Math.round((totalCorrect / answered) * 100);
  const lastMock = progress.mockTests.at(-1);

  const today = todayXp(engagement);
  const goal = engagement.goalXp;

  const course = courseProgress(activeQuestions, progress);
  const standing = levelFor(course.completion);
  const medals = allMedals(activeQuestions, progress);
  const presentedTopics = achievementMedals(activeQuestions, progress);
  const earnedTopics = presentedTopics.filter((m) => m.earned);
  const presentedSections = sectionPresentation(activeQuestions, progress);

  const topics = ALL_TOPICS.filter((topic) =>
    activeQuestions.some((q) => q.topic === topic),
  );
  const masteredCount = topics.filter((topic) =>
    isMastered(topicMastery(activeQuestions, progress, topic).stage),
  ).length;

  // Rules progress is measured in topics; Road Signs in unique assessed Core
  // concepts. Reference signs are study material and never appear as a
  // denominator, so a learner is never told they are behind on unassessed
  // catalogue breadth.
  const rulesTopics = RULES_TOPICS.filter((topic) =>
    activeQuestions.some((q) => q.topic === topic),
  );
  const rulesComplete = rulesTopics.filter((topic) =>
    isComplete(topicMastery(activeQuestions, progress, topic).stage),
  ).length;

  const signProgress = signCategoryLearnProgress(activeQuestions, progress);
  const coreTotal = signProgress.reduce((n, c) => n + c.coreCount, 0);
  const coreSeen = signProgress.reduce((n, c) => n + c.coreSeen, 0);

  const nextTotal = next ? activeQuestions.filter((q) => q.topic === next.topic).length : 0;

  return (
    <>
      <header className="screen-head">
        <h1>Profile</h1>
      </header>

      <ProfileCard />

      <h2 className="section-title">Your progress</h2>

      {/* Hero: one large course ring. It fills with the topics you have covered
          and got right, and only reaches 100% when every topic is complete.
          The caption keeps the honest framing — this is a study summary, never
          a prediction about the government test. */}
      <section className="progress-hero">
        <ProgressRing
          value={course.percent}
          max={100}
          size={132}
          stroke={11}
          label={`Course progress ${course.percent} percent complete, ${course.topicsComplete} of ${course.topicsTotal} topics complete`}
        >
          <span className="ring-value ring-value-lg">{course.percent}%</span>
          <span className="ring-cap">complete</span>
        </ProgressRing>
        <div className="progress-hero-copy">
          <h2>Course progress</h2>
          <p>
            {course.topicsComplete} of {course.topicsTotal} topics complete
            {masteredCount > 0 ? ` · ${masteredCount} mastered` : ''}
          </p>
          <p className="progress-hero-note">
            Complete means you covered a topic's material and got it right.
            {masteredCount > 0 && ' Mastered means you met it again later and got it right again.'}{' '}
            It is not a prediction of the official test result.
          </p>
        </div>
      </section>

      {answered === 0 ? (
        <section className="progress-cta">
          <h2>Start practising</h2>
          <p>
            Your progress builds from your answers — begin with a quick session or any module, then
            check back here to see how far along you are.
          </p>
          <div className="progress-cta-row">
            <Link className="btn" to="/practice/quick">
              Start practising <ArrowRightIcon />
            </Link>
            <Link className="btn-quiet" to="/practice">
              Take a practice exam
            </Link>
          </div>
        </section>
      ) : next ? (
        <Link className="focus-next" to={`/study/${next.topic}`}>
          <span className="focus-eyebrow">
            <FocusIcon /> Recommended next
          </span>
          <span className="focus-title">{TOPIC_LABELS[next.topic] ?? next.topic}</span>
          <span className="focus-sub">
            {next.evidence.questionsAttempted} of {nextTotal} questions seen
          </span>
          <span className="focus-cta" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
      ) : (
        <Link className="focus-next" to="/practice">
          <span className="focus-eyebrow">
            <FocusIcon /> Recommended next
          </span>
          <span className="focus-title">Take a practice exam</span>
          <span className="focus-sub">Every topic complete — test yourself under exam conditions</span>
          <span className="focus-cta" aria-hidden="true">
            <ArrowRightIcon />
          </span>
        </Link>
      )}

      {/* Rules and Signs use their real models: Rules topics for Rules, unique
          assessed Core concepts for Road Signs. The study-progress score sits
          beside each so a learner sees both "how much have I covered" and
          "how well am I doing lately". */}
      <section className="split-meters">
        <div className="split-meter">
          <span className="split-meter-label">Rules of the Road</span>
          <span className="split-meter-value">{rules.score}</span>
          <span className="split-meter-sub">
            {rulesComplete} of {rulesTopics.length} topics complete
          </span>
          <span
            className="split-meter-track"
            role="progressbar"
            aria-label="Rules of the Road study progress"
            aria-valuenow={rules.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${rules.score} out of 100`}
          >
            <span className="split-meter-fill" style={{ width: `${rules.score}%` }} />
          </span>
        </div>
        <div className="split-meter">
          <span className="split-meter-label">Road Signs</span>
          <span className="split-meter-value">{signs.score}</span>
          <span className="split-meter-sub">
            {coreSeen} of {coreTotal} assessed signs seen
          </span>
          <span
            className="split-meter-track"
            role="progressbar"
            aria-label="Road Signs study progress"
            aria-valuenow={signs.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${signs.score} out of 100`}
          >
            <span className="split-meter-fill" style={{ width: `${signs.score}%` }} />
          </span>
        </div>
      </section>

      <h2 className="section-title">This week</h2>
      <section className="stat-band">
        <div className="stat-cell">
          <span className="stat-cell-value">{answered}</span>
          <span className="stat-cell-label">Answered</span>
        </div>
        <div className="stat-cell">
          <span className="stat-cell-value">{accuracyPct === null ? '—' : `${accuracyPct}%`}</span>
          <span className="stat-cell-label">Accuracy</span>
        </div>
        <div className="stat-cell">
          <span className="stat-cell-value">
            {recent.accuracy === null ? '—' : `${Math.round(recent.accuracy * 100)}%`}
          </span>
          <span className="stat-cell-label">Last {recent.total || 20}</span>
        </div>
      </section>

      <section className="engagement-row">
        <div className="metric">
          <span className="metric-icon" data-tone="medal">
            <MedalIcon />
          </span>
          <span className="metric-body">
            <span className="metric-value">
              {medals.earned}
              <span className="metric-of"> / {medals.total}</span>
            </span>
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
      </section>

      <section className="goal-row">
        <div>
          <span className="goal-row-label">Daily goal</span>
          <span className="goal-row-value">
            {goal === 0 ? 'Off' : `${Math.min(today, goal)} / ${goal} XP today`}
          </span>
        </div>
        <button type="button" className="btn btn-quiet" onClick={cycleGoal}>
          Change
        </button>
      </section>
      {goal > 0 && (
        <span
          className="goal-bar goal-bar-wide"
          role="progressbar"
          aria-label="Daily goal"
          aria-valuenow={Math.min(today, goal)}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuetext={`${Math.min(today, goal)} of ${goal} XP today`}
        >
          <span
            className="goal-bar-fill"
            style={{ width: `${Math.min(100, (today / goal) * 100)}%` }}
          />
        </span>
      )}

      {weak.length > 0 && (
        <>
          <h2 className="section-title">Needs attention</h2>
          <ul className="row-list">
            {weak.map((t) => (
              <li key={t.topic}>
                <Link className="row" to={`/study/${t.topic}`}>
                  <span className="row-body">
                    <span className="row-title">{TOPIC_LABELS[t.topic] ?? t.topic}</span>
                    <span className="row-sub">
                      {t.correct} of {t.attempts} correct
                    </span>
                  </span>
                  <span className="row-score" data-band="weak">
                    {Math.round(t.accuracy * 100)}%
                  </span>
                  <ChevronIcon className="row-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {strong.length > 0 && (
        <>
          <h2 className="section-title">Strongest topics</h2>
          <ul className="row-list">
            {strong.map((t) => (
              <li key={t.topic}>
                <Link className="row" to={`/study/${t.topic}`}>
                  <span className="row-body">
                    <span className="row-title">{TOPIC_LABELS[t.topic] ?? t.topic}</span>
                    <span className="row-sub">
                      {t.correct} of {t.attempts} correct
                    </span>
                  </span>
                  <span className="row-score" data-band="strong">
                    {Math.round(t.accuracy * 100)}%
                  </span>
                  <ChevronIcon className="row-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="section-title">Your level</h2>
      <section className="level-card">
        <div className="level-head">
          <span className="level-now">{standing.level.name}</span>
          <span className="level-next">
            {standing.isMax
              ? 'Every topic mastered'
              : `${Math.round(standing.progressToNext * 100)}% to ${standing.next?.name}`}
          </span>
        </div>
        <span
          className="goal-bar goal-bar-wide"
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
        {/* The whole ladder stays visible so the destination is never a
            mystery, and each stage is named in text rather than by colour. */}
        <ol className="level-ladder">
          {LEVELS.map((level, i) => (
            <li key={level.name} data-reached={i <= standing.index} data-current={i === standing.index}>
              <SteeringWheelBadge kind="level" tone={level.name.toLowerCase() as 'novice' | 'learner' | 'competent' | 'proficient' | 'expert'} width={i === standing.index ? 40 : 32} height={i === standing.index ? 40 : 32} />
              <span className="level-name">{level.name}</span>
            </li>
          ))}
        </ol>
        <p className="level-note">
          Levels come from mastering topics, not from time spent — taking a day off never costs you
          anything.
        </p>
      </section>

      <h2 className="section-title">Medals</h2>
      <section className="medal-groups">
        <div className="medal-group">
          <h3>Topic expertise</h3>
          <p className="medal-group-sub">
            {earnedTopics.length} of {medals.topics.length} topics complete
          </p>
          {presentedTopics.length === 0 ? (
            <p className="medal-empty">
              Complete a topic to earn its medal.
            </p>
          ) : (
            <ul className="medal-list">
              {presentedTopics.map((medal) => (
                <li key={medal.id} className="medal" data-earned={medal.earned}>
                  {medal.tone === 'signs' ? <YieldSignBadge earned={medal.earned} mastered={medal.mastered} width={64} height={64} /> : <SteeringWheelBadge kind="topic" tone="rules" earned={medal.earned} mastered={medal.mastered} width={64} height={64} />}
                  <span>{medal.label}<small>{medal.earned ? (medal.mastered ? 'Mastered' : 'Earned') : medal.requirement}</small></span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="medal-group">
          <h3>Section expertise</h3>
          <ul className="medal-list">
            {presentedSections.map((medal) => (
              <li key={medal.id} className="medal" data-earned={medal.earned}>
                {medal.tone === 'signs' ? <YieldSignBadge premium earned={medal.earned} width={84} height={84} /> : <SteeringWheelBadge kind="section" tone="rules" earned={medal.earned} width={84} height={84} />}
                <span>
                  {medal.label}
                  <small>{medal.earned ? 'Earned' : medal.requirement}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="medal-group">
          <h3>Practice exams</h3>
          <ul className="medal-list">
            {medals.mocks.map((medal) => (
              <li key={medal.id} className="medal" data-earned={medal.earned}>
                <SteeringWheelBadge kind="exam" tone={(['bronze', 'silver', 'gold', 'platinum'] as const)[(medal.tier ?? 1) - 1]!} earned={medal.earned} tier={medal.tier as 1 | 2 | 3 | 4} width={72} height={72} />
                <span>
                  {medal.title}
                  <small>{medal.earned ? 'Earned' : medal.requirement}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <h2 className="section-title">Review</h2>
      <ul className="row-list">
        <li>
          <Link className="row" to="/review/mistakes">
            <span className="row-icon" data-tone="bad">
              <MistakeIcon />
            </span>
            <span className="row-body">
              <span className="row-title">Mistakes</span>
              <span className="row-sub">
                {mistakes.length === 0
                  ? 'Nothing outstanding'
                  : `${mistakes.length} waiting`}
              </span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
        <li>
          <Link className="row" to="/review/weak">
            <span className="row-icon" data-tone="warn">
              <WeakAreaIcon />
            </span>
            <span className="row-body">
              <span className="row-title">Weak areas</span>
              <span className="row-sub">
                {weak.length === 0 ? 'None identified yet' : `${weak.length} below 75%`}
              </span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
        <li>
          <Link className="row" to="/review/saved">
            <span className="row-icon" data-tone="accent">
              <BookmarkIcon />
            </span>
            <span className="row-body">
              <span className="row-title">Saved questions</span>
              <span className="row-sub">
                {saved.length === 0 ? 'Save a question to keep it here' : `${saved.length} saved`}
              </span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
      </ul>

      {lastMock && (
        <>
          <h2 className="section-title">Practice exam history</h2>
          <div className="result-section" data-passed={lastMock.passed}>
            <span className="result-badge">{lastMock.passed ? 'Pass' : 'Fail'}</span>
            <div className="tile-body">
              <div className="tile-title">
                {lastMock.sections
                  .map((s) => `${s.shortName} ${s.correct}/${s.questionCount}`)
                  .join(' · ')}
              </div>
              <div className="tile-sub">
                {new Date(lastMock.completedAt).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <p className="verified-note">
        Content last verified{' '}
        {new Date(contentLastVerified()).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        . <Link to="/sources">See what this is based on</Link>.
      </p>

      <Disclaimer />
    </>
  );
}
