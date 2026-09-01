import { Link } from 'react-router-dom';
import { activeQuestions } from '@/content';
import { achievementMedals, sectionPresentation } from '@/engine/engagement/achievementPresentation';
import { levelFor, LEVELS, mockMedals, courseProgress } from '@/engine/engagement/progression';
import { useProgress } from '@/store/useProgress';
import { SteeringWheelBadge } from '@/ui/SteeringWheelBadge';
import { YieldSignBadge } from '@/ui/YieldSignBadge';

const examTones = ['bronze', 'silver', 'gold', 'platinum'] as const;

export function Achievements() {
  const progress = useProgress((state) => state.progress);
  const topics = achievementMedals(activeQuestions, progress);
  const sections = sectionPresentation(activeQuestions, progress);
  const exams = mockMedals(progress);
  const standing = levelFor(courseProgress(activeQuestions, progress).completion);

  return (
    <>
      <header className="screen-head"><h1>Achievements</h1><p>Complete topics, sections and practice exams to build your collection.</p></header>
      <section className="achievement-page-section">
        <div className="achievement-section-heading"><h2>Study Level</h2><span>{standing.level.name}</span></div>
        <p className="achievement-copy">Study level shows course progression. It is not an earned medal.</p>
        <div className="achievement-level-row">
          {LEVELS.map((level, index) => <div key={level.name} className="achievement-level-card" data-current={index === standing.index} data-reached={index <= standing.index}>
            <SteeringWheelBadge kind="level" tone={level.name.toLowerCase() as 'novice' | 'learner' | 'competent' | 'proficient' | 'expert'} width={index === standing.index ? 76 : 64} height={index === standing.index ? 76 : 64} />
            <strong>{level.name}</strong><small>{Math.round(level.from * 100)}% course progress</small>
          </div>)}
        </div>
      </section>

      <AchievementGroup title="Topic Expertise · Rules of the Road" medals={topics.filter((medal) => medal.tone === 'rules')} />
      <AchievementGroup title="Topic Expertise · Road Signs" medals={topics.filter((medal) => medal.tone === 'signs')} />
      <section className="achievement-page-section"><h2>Section Expertise</h2><div className="achievement-grid achievement-grid--section">
        {sections.map((medal) => <article className="achievement-tile" data-earned={medal.earned} key={medal.id}>{medal.tone === 'signs' ? <YieldSignBadge premium earned={medal.earned} width={104} height={104} /> : <SteeringWheelBadge kind="section" tone="rules" earned={medal.earned} width={104} height={104} />}<strong>{medal.label}</strong><small>{medal.earned ? 'Earned' : medal.requirement}</small></article>)}
      </div></section>
      <section className="achievement-page-section"><h2>Practice Exams</h2><div className="achievement-grid achievement-grid--exam">
        {exams.map((medal) => <article className="achievement-tile" data-earned={medal.earned} key={medal.id}><SteeringWheelBadge kind="exam" tone={examTones[(medal.tier ?? 1) - 1]!} tier={medal.tier as 1 | 2 | 3 | 4} earned={medal.earned} width={88} height={88} /><strong>{medal.title}</strong><small>{medal.earned ? 'Earned' : medal.requirement}</small></article>)}
      </div></section>
      <Link className="btn btn-secondary" to="/profile">Back to Profile</Link>
    </>
  );
}

function AchievementGroup({ title, medals }: { title: string; medals: ReturnType<typeof achievementMedals> }) {
  return <section className="achievement-page-section"><h2>{title}</h2><div className="achievement-grid">
    {medals.map((medal) => <article className="achievement-tile" data-earned={medal.earned} key={medal.id}>
      {medal.tone === 'signs' ? <YieldSignBadge earned={medal.earned} mastered={medal.mastered} width={72} height={72} /> : <SteeringWheelBadge kind="topic" tone="rules" earned={medal.earned} mastered={medal.mastered} width={72} height={72} />}
      <strong>{medal.label}</strong><small>{medal.earned ? (medal.mastered ? 'Mastered' : 'Earned') : medal.requirement}</small>
    </article>)}
  </div></section>;
}
