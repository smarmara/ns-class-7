import { activeQuestions } from '@/content';
import { QuizSession } from '@/ui/QuizSession';

/**
 * Quick Practice draws from the whole active bank, weighted by the spaced
 * scheduler — so unseen questions and recent misses surface first while the
 * set still spans both Rules of the Road and Road Signs.
 */
export function QuickPractice() {
  return (
    <QuizSession
      title="Quick Practice"
      subtitle="A mixed set weighted toward your weak areas and anything due for review"
      pool={activeQuestions}
      count={12}
      mode="quick"
      weighted
    />
  );
}
