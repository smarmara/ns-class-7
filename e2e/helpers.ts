import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Page } from '@playwright/test';

/**
 * Deterministic mock-test helpers.
 *
 * A mock section discloses nothing until it is submitted, so a test cannot
 * learn the correct answers from the UI. Instead these helpers read the
 * question bank directly (the same files the app bundles) and answer each
 * displayed question by matching its stem text, making any required pass/fail
 * outcome reproducible regardless of which questions the seeded draw picks.
 */

export interface BankQuestion {
  id: string;
  question: string;
  choices: string[];
  correctChoice: number;
  topic: string;
  type: string;
}

export function loadBank(): BankQuestion[] {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../data/questions');
  const questions: BankQuestion[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const parsed = JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as BankQuestion[];
    questions.push(...parsed);
  }
  return questions;
}

/** Choice text exactly as rendered (artwork choices expose their label). */
export async function currentChoiceTexts(page: Page): Promise<string[]> {
  return page.locator('.choice').evaluateAll((els) =>
    els.map((el) => {
      const sr = el.querySelector('.choice-text .sr-only');
      if (sr && sr.textContent?.trim()) return sr.textContent.trim().replace(/\s+/g, ' ');
      const text = el.querySelector('.choice-text');
      return (text?.textContent ?? '').trim().replace(/\s+/g, ' ');
    }),
  );
}

/** Normalise a bank string the same way rendered text is normalised. */
function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/**
 * Resolve the question actually on screen. Several bank questions share the
 * same stem ("What does this sign tell you?"), so the stem alone is
 * ambiguous. The displayed question is the one whose own correct answer text
 * is present among the rendered choices.
 */
async function resolveDisplayedQuestion(
  page: Page,
  bank: Map<string, BankQuestion[]>,
): Promise<{ question: BankQuestion; texts: string[] }> {
  const stem = norm((await page.locator('.question-stem').first().textContent()) ?? '');
  const candidates = bank.get(stem);
  if (!candidates || candidates.length === 0) {
    throw new Error(`Stem not found in bank: ${stem.slice(0, 60)}…`);
  }
  const texts = await currentChoiceTexts(page);
  const onScreen =
    candidates.find((q) => texts.some((t) => t === norm(q.choices[q.correctChoice]!))) ??
    candidates[0]!;
  return { question: onScreen, texts };
}

/** Answer the displayed question correctly (returns the choice index used). */
export async function answerCurrentCorrectly(
  page: Page,
  bank: Map<string, BankQuestion[]>,
): Promise<number> {
  const { question, texts } = await resolveDisplayedQuestion(page, bank);
  const correct = norm(question.choices[question.correctChoice]!);
  const index = texts.findIndex((t) => t === correct);
  if (index < 0) throw new Error(`Correct choice not rendered for: ${question.question.slice(0, 60)}…`);
  await page.locator('.choice').nth(index).click();
  return index;
}

/** Answer the displayed question incorrectly on purpose. */
export async function answerCurrentIncorrectly(
  page: Page,
  bank: Map<string, BankQuestion[]>,
): Promise<number> {
  const { question, texts } = await resolveDisplayedQuestion(page, bank);
  const correct = norm(question.choices[question.correctChoice]!);
  const index = texts.findIndex((t) => t !== correct);
  if (index < 0) throw new Error('No incorrect choice available');
  await page.locator('.choice').nth(index).click();
  return index;
}

/** Complete a whole mock section with the given strategy and submit it. */
export async function completeMockSection(
  page: Page,
  part: string,
  strategy: 'correct' | 'incorrect',
  bank: Map<string, BankQuestion[]>,
): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`Begin ${part}`) }).click();
  for (let i = 0; i < 20; i++) {
    if (strategy === 'correct') await answerCurrentCorrectly(page, bank);
    else await answerCurrentIncorrectly(page, bank);
    if (i < 19) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: new RegExp(`^Submit (?!part)`) }).click();
  await page.getByRole('button', { name: 'Submit part', exact: true }).click();
}

export async function startMockTest(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Mock test' }).click();
  await page.getByRole('button', { name: 'Start mock test' }).click();
}

/** Seed a progress object into the origin and reload so the app hydrates it. */
export async function seedProgress(page: Page, progress: unknown): Promise<void> {
  await page.evaluate((json) => {
    localStorage.setItem('ns-class7:progress:v1', json);
  }, JSON.stringify(progress));
  await page.reload();
}