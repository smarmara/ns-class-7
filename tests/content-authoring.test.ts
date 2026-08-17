import { describe, expect, it } from 'vitest';
import { authoringPositionFindings, choiceLengthFindings } from '../scripts/content-validate';
import type { Question } from '@/content/types';

function q(overrides: Partial<Question> & { id: string; file?: string }): Question & { file?: string } {
  return {
    type: 'rules',
    topic: 'turning',
    question: 'Which of these is correct?',
    choices: ['Choice one', 'Choice two', 'Choice three', 'Choice four'],
    correctChoice: 0,
    explanation: 'A sufficiently long explanation of why the correct answer is correct.',
    difficulty: 'medium',
    tags: [],
    sourceRefs: [{ sourceId: 'ns-handbook-ch2', chapter: 'Chapter 2', page: 'p. 53' }],
    legalStatus: 'current',
    verifiedAt: '2026-08-17',
    lawVersion: 'mva',
    ...overrides,
  };
}

describe('choiceLengthFindings', () => {
  it('flags a correct answer at least 3× the shortest distractor', () => {
    const question = q({
      id: 'rules-x-001',
      choices: [
        'The longest possible correct answer that is very detailed about the rule',
        'A plausible wrong answer',
        'Another wrong answer',
        'A third wrong answer',
      ],
    });
    const findings = choiceLengthFindings(question);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe('choice-length-tell');
    expect(findings[0]!.level).toBe('warning');
  });

  it('stays silent when the correct answer is not disproportionately long', () => {
    const question = q({
      id: 'rules-x-002',
      choices: ['A moderate answer', 'Another answer', 'Third answer', 'Fourth answer'],
    });
    expect(choiceLengthFindings(question)).toEqual([]);
  });

  it('ignores a balanced pattern where the shortest distractor is trivial', () => {
    // A one-word distractor ("No") is not a real choice, so no warning —
    // the threshold needs a real choice to compare against.
    const question = q({
      id: 'rules-x-003',
      choices: [
        'A quite long correct answer with genuine nuance here for the learner',
        'No',
        'Maybe',
        'Yes',
      ],
    });
    expect(choiceLengthFindings(question)).toEqual([]);
  });

  it('returns nothing for malformed questions rather than crashing', () => {
    const bad = q({ id: 'rules-x-004' });
    (bad as { choices?: string[] }).choices = ['Only one choice'];
    expect(choiceLengthFindings(bad)).toEqual([]);
  });
});

describe('authoringPositionFindings', () => {
  it('warns when every question in a file puts the correct answer at the same position', () => {
    const questions = [
      q({ id: 'rules-a-001', file: 'rules-a.json' }),
      q({ id: 'rules-a-002', file: 'rules-a.json' }),
    ];
    const findings = authoringPositionFindings(questions);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.rule).toBe('authoring-position');
    expect(findings[0]!.where).toBe('rules-a.json');
  });

  it('stays silent when a file varies the correct-answer position', () => {
    const questions = [
      q({ id: 'rules-a-001', file: 'rules-a.json' }),
      q({ id: 'rules-a-002', file: 'rules-a.json', correctChoice: 2 }),
    ];
    expect(authoringPositionFindings(questions)).toEqual([]);
  });

  it('judges each file independently', () => {
    const questions = [
      q({ id: 'rules-a-001', file: 'rules-a.json' }),
      q({ id: 'rules-a-002', file: 'rules-a.json' }),
      q({ id: 'rules-b-001', file: 'rules-b.json' }),
      q({ id: 'rules-b-002', file: 'rules-b.json', correctChoice: 1 }),
    ];
    const findings = authoringPositionFindings(questions);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.where).toBe('rules-a.json');
  });
});
