import { Link } from 'react-router-dom';
import {
  TOPIC_LABELS,
  activeQuestions,
  contentLastVerified,
  examConfig,
} from '@/content';
import { computeReadiness, recentPerformance, strongTopics, weakTopics } from '@/engine/learning/readiness';
import { mistakeQueue } from '@/engine/learning/scheduler';
import { useProgress } from '@/store/useProgress';
import { Banner, Card, Disclaimer, Meter, PageHead, Tile } from '@/ui/components';

export function Dashboard() {
  const progress = useProgress((s) => s.progress);

  const overall = computeReadiness(activeQuestions, progress);
  const rules = computeReadiness(activeQuestions, progress, { type: 'rules' });
  const signs = computeReadiness(activeQuestions, progress, { type: 'sign' });
  const recent = recentPerformance(progress, 20);
  const weak = weakTopics(activeQuestions, progress).slice(0, 4);
  const strong = strongTopics(activeQuestions, progress).slice(0, 3);
  const mistakes = mistakeQueue(progress);

  const answered = Object.values(progress.questions).reduce((n, s) => n + s.seen, 0);
  const totalCorrect = Object.values(progress.questions).reduce((n, s) => n + s.correct, 0);
  const accuracyPct = answered === 0 ? null : Math.round((totalCorrect / answered) * 100);
  const lastMock = progress.mockTests.at(-1);

  return (
    <>
      <PageHead title="Your readiness">
        Nova Scotia Class 7 learner's licence knowledge test
      </PageHead>

      <Card>
        <div className="readiness">
          <div className="readiness-score">
            {overall.score}
            <span className="readiness-unit">/100</span>
          </div>
          <p className="readiness-caption">
            {overall.hasEnoughData
              ? 'Study progress score — based on your coverage, recent accuracy and retention.'
              : 'Provisional — answer more questions for this to mean much.'}
          </p>
        </div>

        <div className="section-gap">
          <Meter label="Rules of the Road" value={rules.score} max={100} display={`${rules.score}/100`} />
          <Meter label="Road Signs" value={signs.score} max={100} display={`${signs.score}/100`} />
        </div>

        <details className="section-gap">
          <summary className="small muted" style={{ cursor: 'pointer' }}>
            How this score is calculated
          </summary>
          <div className="small muted" style={{ marginTop: 10 }}>
            <p style={{ marginBottom: 8 }}>
              45% recent accuracy, 35% coverage of the question bank, 20% retention (questions
              you have got right often enough to be spaced out). It measures your study progress —
              it is <strong>not</strong> a prediction of whether you will pass the real test, and
              this app has no access to the official question bank.
            </p>
            <dl className="definition-list">
              <dt>Coverage</dt>
              <dd>
                {overall.questionsAttempted} of {overall.questionsAvailable} questions attempted (
                {Math.round(overall.coverage * 100)}%)
              </dd>
              <dt>Recent accuracy</dt>
              <dd>
                {overall.accuracy === null
                  ? 'No answers yet'
                  : `${Math.round(overall.accuracy * 100)}% over your last ${overall.attemptsCounted} answers`}
              </dd>
              <dt>Retention</dt>
              <dd>{Math.round(overall.retention * 100)}% of attempted questions are spaced out</dd>
            </dl>
          </div>
        </details>
      </Card>

      <Card className="section-gap" title="At a glance">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-value">{answered}</div>
            <div className="stat-label">Answered</div>
          </div>
          <div className="stat">
            <div className="stat-value">{accuracyPct === null ? '—' : `${accuracyPct}%`}</div>
            <div className="stat-label">All-time accuracy</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {recent.accuracy === null ? '—' : `${Math.round(recent.accuracy * 100)}%`}
            </div>
            <div className="stat-label">Last {recent.total || 20} answers</div>
          </div>
          <div className="stat">
            <div className="stat-value">{progress.streak.current}</div>
            <div className="stat-label">Day streak</div>
          </div>
        </div>
      </Card>

      <Card className="section-gap" title="Keep going">
        <ul className="tile-list">
          <Tile
            to="/practice"
            emoji="⚡"
            title="Quick Practice"
            sub="Mixes your weak areas with general coverage"
          />
          <Tile
            to="/mock"
            emoji="📝"
            title="Mock test"
            sub={`${examConfig.sections.map((s) => s.questionCount).join(' + ')} questions, ${examConfig.sections[0]!.passingCorrect}/${examConfig.sections[0]!.questionCount} to pass each part`}
          />
          {mistakes.length > 0 && (
            <Tile
              to="/review/mistakes"
              emoji="🔁"
              title="Review your mistakes"
              sub={`${mistakes.length} question${mistakes.length === 1 ? '' : 's'} waiting`}
            />
          )}
        </ul>
      </Card>

      {weak.length > 0 && (
        <Card className="section-gap" title="Weak topics">
          <ul className="tile-list">
            {weak.map((t) => (
              <Tile
                key={t.topic}
                to={`/study/${t.topic}`}
                title={TOPIC_LABELS[t.topic] ?? t.topic}
                sub={`${t.correct} of ${t.attempts} correct`}
                accuracy={`${Math.round(t.accuracy * 100)}%`}
                band="weak"
              />
            ))}
          </ul>
          <p className="tiny faint" style={{ marginTop: 10, marginBottom: 0 }}>
            A topic appears here after at least 3 answers with 75% accuracy or below. Quick
            Practice already weights toward these.
          </p>
        </Card>
      )}

      {strong.length > 0 && (
        <Card className="section-gap" title="Strongest topics">
          <ul className="tile-list">
            {strong.map((t) => (
              <Tile
                key={t.topic}
                to={`/study/${t.topic}`}
                title={TOPIC_LABELS[t.topic] ?? t.topic}
                sub={`${t.correct} of ${t.attempts} correct`}
                accuracy={`${Math.round(t.accuracy * 100)}%`}
                band="strong"
              />
            ))}
          </ul>
        </Card>
      )}

      {lastMock && (
        <Card className="section-gap" title="Last mock test">
          <div className="result-section" data-passed={lastMock.passed}>
            <span className="result-badge">{lastMock.passed ? 'Pass' : 'Fail'}</span>
            <div className="tile-body">
              <div className="tile-title">
                {lastMock.sections.map((s) => `${s.shortName} ${s.correct}/${s.questionCount}`).join(' · ')}
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
        </Card>
      )}

      <div className="section-gap">
        <Banner tone="info" icon="🗓">
          <p>
            <strong>Content last verified:</strong>{' '}
            {new Date(contentLastVerified()).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p>
            Every question is traced to an official Nova Scotia source.{' '}
            <Link to="/sources">See what this is based on</Link>.
          </p>
        </Banner>
      </div>

      <Disclaimer />
    </>
  );
}
