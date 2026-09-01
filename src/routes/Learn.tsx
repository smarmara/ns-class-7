import { Link } from 'react-router-dom';
import { RULES_TOPICS, type Topic } from '@/content/types';
import { TOPIC_LABELS, activeQuestions } from '@/content';
import { computeReadiness } from '@/engine/learning/readiness';
import { pathProgress } from '@/engine/learning/path';
import {
  MASTERY_LABELS,
  isComplete,
  isMastered,
  type MasteryEvidence,
} from '@/engine/learning/mastery';
import { signCategoryLearnProgress, type SignCategoryLearnProgress } from '@/engine/learning/signCategories';
import { useProgress } from '@/store/useProgress';
import { Disclaimer } from '@/ui/components';
import { ArrowRightIcon, ChevronIcon, CorrectIcon, MasteryIcon, MockIcon } from '@/ui/icons';

function topicCount(topic: string): number {
  return activeQuestions.filter((q) => q.topic === topic).length;
}

/** Which category surface a topic belongs to, for its accent. */
function familyOf(topic: Topic): 'rules' | 'signs' {
  return (RULES_TOPICS as readonly string[]).includes(topic) ? 'rules' : 'signs';
}

/**
 * A learning module: the unit a learner actually thinks in. It shows what the
 * module is, how far through it they are, and where that sits on the mastery
 * scale — nothing else. No badge soup.
 *
 * Nothing is ever locked. The path recommends an order; every module stays
 * directly reachable.
 */
function ModuleCard({
  topic,
  evidence,
  recommended,
}: {
  topic: Topic;
  evidence: MasteryEvidence;
  recommended: boolean;
}) {
  const { stage, questionsAttempted: seen, questionsAvailable: total, accuracy } = evidence;
  const pct = total === 0 ? 0 : Math.round((seen / total) * 100);
  return (
    <li>
      <Link
        className="module"
        to={`/study/${topic}`}
        data-family={familyOf(topic)}
        data-recommended={recommended}
      >
        <span className="module-head">
          <span className="module-name">{TOPIC_LABELS[topic] ?? topic}</span>
          {isMastered(stage) ? (
            <span className="module-flag" data-state="mastered">
              <MasteryIcon /> Mastered
            </span>
          ) : isComplete(stage) ? (
            <span className="module-flag" data-state="complete">
              <CorrectIcon /> Complete
            </span>
          ) : stage === 'developing' ? (
            <span className="module-flag" data-state="developing">Developing</span>
          ) : stage === 'learning' ? (
            <span className="module-flag" data-state="learning">Learning</span>
          ) : null}
          {recommended && <span className="module-flag">Recommended</span>}
        </span>
        <span className="module-meta">
          {seen} / {total} seen · {MASTERY_LABELS[stage]}
        </span>
        {stage === 'developing' && accuracy !== null && (
          <span className="module-meta module-meta-guidance">
            {Math.round(accuracy * 100)}% accuracy · 80% needed to complete
          </span>
        )}
        <span
          className="module-bar"
          role="progressbar"
          aria-label={`${TOPIC_LABELS[topic] ?? topic} progress`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${seen} of ${total} questions seen, ${MASTERY_LABELS[stage]}`}
        >
          <span className="module-bar-fill" data-stage={stage} style={{ width: `${pct}%` }} />
        </span>
        <ChevronIcon className="module-chevron" />
      </Link>
    </li>
  );
}

/**
 * Road Signs category card for the Learn page.
 *
 * Shows formal assessed progress through Core concepts, with optional catalogue
 * breadth as secondary context. The denominator is unique Core concepts, not
 * question count or catalogue size.
 */
function SignCategoryCard({ category }: { category: SignCategoryLearnProgress }) {
  const pct = category.coreCount === 0 ? 0 : Math.round(category.coverage * 100);
  return (
    <li>
      <Link
        className="module"
        to={`/study/signs/${category.id}`}
        data-family="signs"
      >
        <span className="module-head">
          <span className="module-name">{category.label}</span>
          {isMastered(category.stage) ? (
            <span className="module-flag" data-state="mastered">
              <MasteryIcon /> Mastered
            </span>
          ) : isComplete(category.stage) ? (
            <span className="module-flag" data-state="complete">
              <CorrectIcon /> Complete
            </span>
          ) : category.stage === 'developing' ? (
            <span className="module-flag" data-state="developing">Developing</span>
          ) : category.stage === 'learning' ? (
            <span className="module-flag" data-state="learning">Learning</span>
          ) : null}
        </span>
        <span className="module-meta">
          {category.coreSeen} of {category.coreCount} assessed signs seen · {MASTERY_LABELS[category.stage]}
          {category.catalogueCount > category.coreCount && (
            <span className="module-meta-secondary">
              {' '}· {category.catalogueCount} signs in catalogue
            </span>
          )}
        </span>
        {category.stage === 'developing' && category.accuracy !== null && (
          <span className="module-meta module-meta-guidance">
            {Math.round(category.accuracy * 100)}% accuracy · 80% needed to complete
          </span>
        )}
        <span
          className="module-bar"
          role="progressbar"
          aria-label={`${category.label} progress`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${category.coreSeen} of ${category.coreCount} assessed signs seen, ${MASTERY_LABELS[category.stage]}`}
        >
          <span className="module-bar-fill" data-stage={category.stage} style={{ width: `${pct}%` }} />
        </span>
        <ChevronIcon className="module-chevron" />
      </Link>
    </li>
  );
}

/**
 * Learn — a content-first screen. It scrolls, and should: this is the map of
 * the whole course, not a launch surface.
 */
export function Learn() {
  const progress = useProgress((s) => s.progress);
  const rules = computeReadiness(activeQuestions, progress, { type: 'rules' });
  const signs = computeReadiness(activeQuestions, progress, { type: 'sign' });
  const path = pathProgress(activeQuestions, progress, rules, signs);
  const next = path.next;

  const evidenceFor = new Map(
    path.steps
      .filter((s): s is Extract<typeof s, { kind: 'topic' }> => s.kind === 'topic')
      .map((s) => [s.topic, s.evidence]),
  );

  const signCategories = signCategoryLearnProgress(activeQuestions, progress);

  const section = (topics: readonly Topic[]) =>
    topics
      .filter((topic) => topicCount(topic) > 0)
      .map((topic) => {
        const evidence = evidenceFor.get(topic);
        return (
          <ModuleCard
            key={topic}
            topic={topic}
            evidence={evidence ?? {
              topic,
              stage: 'new',
              attempts: 0,
              accuracy: null,
              lifetimeAccuracy: null,
              coverage: 0,
              retained: 0,
              exposures: 0,
              exposuresPerQuestion: 0,
              questionsAvailable: topicCount(topic),
              questionsAttempted: 0,
            }}
            recommended={next?.topic === topic}
          />
        );
      });

  return (
    <>
      <header className="screen-head">
        <h1>Learn</h1>
        <p>Work through it in order, or jump anywhere. Nothing is locked.</p>
      </header>

      {next && (
        <Link className="hero-module hero-module-compact" to={`/study/${next.topic}`}>
          <span className="hero-eyebrow">Pick up where you left off</span>
          <span className="hero-title">{TOPIC_LABELS[next.topic]}</span>
          <span className="hero-meta">
            {next.evidence.questionsAttempted} of {topicCount(next.topic)} questions seen
          </span>
          <span className="hero-cta">
            Continue <ArrowRightIcon />
          </span>
        </Link>
      )}

      <h2 className="section-title">Rules of the Road</h2>
      <ul className="module-list">{section(RULES_TOPICS)}</ul>

      <h2 className="section-title">Road signs</h2>
      <ul className="module-list">
        {signCategories.map((category) => (
          <SignCategoryCard key={category.id} category={category} />
        ))}
      </ul>

      <h2 className="section-title">When you are ready</h2>
      <ul className="row-list">
        <li>
          <Link className="row" to="/practice">
            <span className="row-icon" data-tone="accent">
              <MockIcon />
            </span>
            <span className="row-body">
              <span className="row-title">Take a practice exam</span>
              <span className="row-sub">
                {path.complete
                  ? 'Every module complete — try the full timed format'
                  : 'The full two-part format, timed'}
              </span>
            </span>
            <ChevronIcon className="row-chevron" />
          </Link>
        </li>
      </ul>

      <Disclaimer />
    </>
  );
}
