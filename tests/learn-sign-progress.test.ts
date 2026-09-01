import { describe, expect, it } from 'vitest';
import {
  signCategoryDrillQuestions,
  signCategoryLearnProgress,
} from '@/engine/learning/signCategories';
import { activeQuestions } from '@/content';
import type { Question } from '@/content/types';
import { emptyProgress } from '@/engine/learning/types';

describe('Learn page sign category progress', () => {
  const progress = emptyProgress();

  it('renders exactly 10 canonical categories', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    expect(categories).toHaveLength(10);
  });

  it('includes Lane Use & Turns with correct Core denominator', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const laneUse = categories.find((c) => c.id === 'lane-use');
    expect(laneUse).toBeDefined();
    expect(laneUse!.label).toBe('Lane Use & Turns');
    // Lane Use & Turns has 56 catalogue entries but only 6 Core concepts
    expect(laneUse!.catalogueCount).toBe(56);
    expect(laneUse!.coreCount).toBe(6);
  });

  it('includes Parking & Stopping', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const parking = categories.find((c) => c.id === 'parking-stopping');
    expect(parking).toBeDefined();
    expect(parking!.label).toBe('Parking & Stopping');
    expect(parking!.coreCount).toBeGreaterThan(0);
  });

  it('includes merged School, Pedestrian & Cyclist', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const schoolPed = categories.find((c) => c.id === 'pedestrian-cyclist-school');
    expect(schoolPed).toBeDefined();
    expect(schoolPed!.label).toBe('School, Pedestrian & Cyclist');
    expect(schoolPed!.coreCount).toBeGreaterThan(0);
  });

  it('Guide & Information has Core denominator 3, not question count 4', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const guide = categories.find((c) => c.id === 'guide');
    expect(guide).toBeDefined();
    // Guide has 3 Core concepts but 4+ questions
    expect(guide!.coreCount).toBe(3);
  });

  it('Sign Shapes has Core denominator 6, not question count 7', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const shapes = categories.find((c) => c.id === 'shape');
    expect(shapes).toBeDefined();
    // Sign Shapes has 6 Core concepts but 7 questions (including shape-yield)
    expect(shapes!.coreCount).toBe(6);
  });

  it('Railway uses canonical Core count, not old question count', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const railway = categories.find((c) => c.id === 'railway');
    expect(railway).toBeDefined();
    // Railway has 3 Core concepts
    expect(railway!.coreCount).toBe(3);
  });

  it('all Core denominators sum to exactly 80', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const totalCore = categories.reduce((sum, c) => sum + c.coreCount, 0);
    expect(totalCore).toBe(80);
  });

  it('all catalogue counts sum to exactly 155', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const totalCatalogue = categories.reduce((sum, c) => sum + c.catalogueCount, 0);
    expect(totalCatalogue).toBe(155);
  });

  it('Reference counts sum to exactly 75', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const totalReference = categories.reduce(
      (sum, c) => sum + (c.catalogueCount - c.coreCount),
      0,
    );
    expect(totalReference).toBe(75);
  });

  it('does not show stale School-only or Pedestrian-only categories', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const ids = categories.map((c) => c.id);
    expect(ids).not.toContain('signs-school');
    expect(ids).not.toContain('signs-pedestrian-and-cyclist');
    expect(ids).not.toContain('signs-lane-use');
  });

  it('starts with all categories in Not started state', () => {
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    for (const category of categories) {
      expect(category.coreSeen).toBe(0);
      expect(category.stage).toBe('new');
    }
  });

  it('tracks Core concept progress without inflating from multiple questions', () => {
    // Find a Core concept that has multiple assessment questions
    // For this test, we'll simulate attempting questions for the same signId
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    const shapes = categories.find((c) => c.id === 'shape');
    expect(shapes).toBeDefined();
    
    // Sign Shapes has 6 Core concepts including shape-stop
    // Let's simulate attempting multiple questions for shape-stop
    const shapeStopQuestions = activeQuestions.filter(
      (q) => q.signId === 'shape-stop' && q.type === 'sign',
    );
    
    // There should be at least one question for shape-stop
    expect(shapeStopQuestions.length).toBeGreaterThan(0);
    
    // Create progress with attempts on shape-stop questions
    const progressWithAttempts = emptyProgress();
    const now = new Date().toISOString();
    
    for (const q of shapeStopQuestions) {
      progressWithAttempts.questions[q.id] = {
        questionId: q.id,
        seen: 1,
        correct: 1,
        incorrect: 0,
        lastSeenAt: now,
        lastResult: 'correct',
        streak: 1,
        box: 1,
        dueAt: now,
        bookmarked: false,
        flaggedForReview: false,
      };
      progressWithAttempts.attempts.push({
        questionId: q.id,
        topic: q.topic,
        type: q.type,
        correct: true,
        at: now,
        mode: 'quick',
      });
    }

    const categoriesWithProgress = signCategoryLearnProgress(
      activeQuestions,
      progressWithAttempts,
    );
    const shapesWithProgress = categoriesWithProgress.find((c) => c.id === 'shape');
    expect(shapesWithProgress).toBeDefined();
    
    // Even if there are multiple questions for shape-stop, it should count as 1 concept seen
    expect(shapesWithProgress!.coreSeen).toBe(1);
    expect(shapesWithProgress!.coreCount).toBe(6);
  });

  it('Reference signs do not affect Core progress', () => {
    // Even if a Reference sign has questions, it should not appear in coreCount
    const categories = signCategoryLearnProgress(activeQuestions, progress);
    for (const category of categories) {
      // coreCount should never exceed catalogueCount
      expect(category.coreCount).toBeLessThanOrEqual(category.catalogueCount);
      // coreSeen should never exceed coreCount
      expect(category.coreSeen).toBeLessThanOrEqual(category.coreCount);
    }
  });

  it('builds one formal question per Core concept for every category', () => {
    const expected = {
      regulatory: 13,
      'lane-use': 6,
      'parking-stopping': 2,
      warning: 23,
      'pedestrian-cyclist-school': 3,
      railway: 3,
      'work-zone': 17,
      guide: 3,
      'pavement-marking': 4,
      shape: 6,
    };

    for (const [category, count] of Object.entries(expected)) {
      const questions = signCategoryDrillQuestions(category, activeQuestions, emptyProgress());
      expect(questions).toHaveLength(count);
      expect(new Set(questions.map((q) => q.signId)).size).toBe(count);
      expect(questions.every((q) => q.type === 'sign')).toBe(true);
    }
  });

  it('prefers the least-seen formal variant for a Core concept', () => {
    const groups = new Map<string, Question[]>();
    for (const q of activeQuestions.filter(
      (entry) => entry.type === 'sign' && entry.topic === 'signs-guide' && entry.signId,
    )) {
      const list = groups.get(q.signId!) ?? [];
      list.push(q);
      groups.set(q.signId!, list);
    }
    const guide = [...groups.values()].find((list) => list.length > 1) ?? [];
    expect(guide.length).toBeGreaterThan(1);
    const progressWithHistory = emptyProgress();
    progressWithHistory.questions[guide[0]!.id] = {
      questionId: guide[0]!.id,
      seen: 3,
      correct: 3,
      incorrect: 0,
      lastSeenAt: new Date().toISOString(),
      lastResult: 'correct',
      streak: 3,
      box: 3,
      dueAt: new Date().toISOString(),
      bookmarked: false,
      flaggedForReview: false,
    };

    const selected = signCategoryDrillQuestions('guide', activeQuestions, progressWithHistory);
    expect(selected.find((q) => q.signId === 'guide-destination')?.id).not.toBe(guide[0]!.id);
  });
});
