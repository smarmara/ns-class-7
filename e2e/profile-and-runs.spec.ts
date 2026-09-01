import { expect, test, type Page } from '@playwright/test';

/**
 * Sign Match streak runs, the simplified Home panel, and Profile.
 */

async function openMatch(page: Page) {
  await page.goto('/#/signs/match');
  await expect(page.locator('.match-choice')).toHaveCount(2);
}

/** Answer the current round on one side; returns whether it was correct. */
async function answer(page: Page, side: 0 | 1): Promise<boolean> {
  const choice = page.locator('.match-choice').nth(side);
  await choice.click();
  return (await choice.getAttribute('data-state')) === 'correct';
}

/** Play until the run ends, returning the streak reached. */
async function playUntilMiss(page: Page): Promise<number> {
  let streak = 0;
  for (let n = 0; n < 40; n++) {
    if (await answer(page, 0)) {
      streak += 1;
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'See your run' }).click();
      return streak;
    }
  }
  throw new Error('run did not end within 40 rounds');
}

test.describe('sign match streak runs', () => {
  test('ends the run on a miss, after revealing the correct sign', async ({ page }) => {
    await openMatch(page);

    for (let n = 0; n < 20; n++) {
      const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.trim();
      if (!(await answer(page, 0))) {
        await expect(page.locator('.match-verdict')).toContainText('Not quite');
        await expect(page.locator('.match-reveal')).toContainText(prompt);
        await expect(page.locator('.match-choice[data-state="correct"]')).toHaveCount(1);
        // The run is over: no Next, only a way through to the result.
        await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'See your run' })).toBeVisible();
        return;
      }
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    throw new Error('no miss in 20 rounds');
  });

  test('shows a result with the streak reached, and both actions', async ({ page }) => {
    await openMatch(page);
    const streak = await playUntilMiss(page);

    await expect(page.getByRole('heading', { name: 'Streak ended' })).toBeVisible();
    await expect(page.locator('.match-result-score strong')).toHaveText(String(streak));
    await expect(page.locator('.match-result-best')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '#/signs');
  });

  test('Try again starts a fresh run and keeps the record', async ({ page }) => {
    await openMatch(page);
    const streak = await playUntilMiss(page);
    const recorded = await page.locator('.match-result-best-value').textContent();

    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.match-choice')).toHaveCount(2);
    await expect(page.locator('.match-score')).toContainText('Streak 0');

    if (streak > 0) {
      // The record survives into the new run's header.
      await expect(page.locator('.match-best')).toContainText(String(recorded).trim());
    }
  });

  test('Close returns to Signs', async ({ page }) => {
    await openMatch(page);
    await playUntilMiss(page);
    await page.getByRole('link', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Road signs' })).toBeVisible();
  });

  test('shows streak and best, not a missed tally', async ({ page }) => {
    await openMatch(page);
    const score = page.locator('.match-score');
    await expect(score).toContainText('Streak');
    await expect(score).not.toContainText('missed');
  });

  test('the result screen fits a small phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openMatch(page);
    await playUntilMiss(page);

    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(1);
  });
});

test.describe('home sign match panel', () => {
  test('shows the signs without decorative plates or a circle', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('.match-feature')).toBeVisible();

    // The decorative disc is gone entirely.
    await expect(page.locator('.match-feature-disc')).toHaveCount(0);

    // The sign wrappers carry no plate background of their own.
    const backgrounds = await page
      .locator('.match-feature-sign')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(backgrounds.length).toBeGreaterThan(0);
    for (const bg of backgrounds) {
      expect(bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent', `plate background: ${bg}`).toBe(
        true,
      );
    }

    // The approved artwork still renders.
    await expect(page.locator('.match-feature-sign img, .match-feature-sign svg')).toHaveCount(2);
  });

  test('pairs the record with the CTA on one horizontal row', async ({ page }) => {
    await page.goto('/#/');
    const cta = page.locator('.match-feature-cta');
    const streak = page.locator('.match-feature-streak');

    await expect(cta).toBeVisible();
    await expect(streak).toBeVisible();
    await expect(streak).toContainText('Best streak');

    const ctaBox = (await cta.boundingBox())!;
    const streakBox = (await streak.boundingBox())!;
    // Beside, not above or below: their vertical centres line up.
    const ctaMid = ctaBox.y + ctaBox.height / 2;
    const streakMid = streakBox.y + streakBox.height / 2;
    expect(Math.abs(ctaMid - streakMid)).toBeLessThanOrEqual(6);
    expect(streakBox.x).toBeGreaterThan(ctaBox.x);

    // Label and number share a line.
    const label = await streak.evaluate((el) => el.childNodes[0]?.textContent?.trim() ?? '');
    expect(label).toBe('Best streak');
  });

  test('still opens Sign Match', async ({ page }) => {
    await page.goto('/#/');
    await page.locator('.match-feature').click();
    await expect(page).toHaveURL(/\/signs\/match/);
  });
});

test.describe('profile', () => {
  test('is the bottom-nav destination and lives at /profile', async ({ page }) => {
    await page.goto('/#/');
    const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
      name: 'Profile',
    });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  });

  test('keeps old /progress links working', async ({ page }) => {
    await page.goto('/#/progress');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  });

  test('creates and edits a local profile that survives a reload', async ({ page }) => {
    await page.goto('/#/profile');
    await expect(page.getByText('Create your profile')).toBeVisible();

    await page.getByRole('button', { name: 'Create profile' }).click();
    await page.getByLabel('Display name').fill('Alex Jordan');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Alex Jordan')).toBeVisible();
    await expect(page.locator('.profile-avatar')).toHaveText('AJ');

    // Wait for the write to reach storage before reloading, rather than
    // racing the asynchronous save.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('ns-class7:learner:v1') ?? '{}').profile?.displayName ??
            null,
        ),
      )
      .toBe('Alex Jordan');

    await page.reload();
    await expect(page.getByText('Alex Jordan')).toBeVisible();

    // Renaming does not require deleting anything.
    await page.getByRole('button', { name: /^Edit/ }).click();
    await page.getByLabel('Display name').fill('Sam');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Sam')).toBeVisible();
  });

  test('offers Automatic, Light and Dark, and remembers the choice', async ({ page }) => {
    await page.goto('/#/profile');
    const options = page.getByRole('radio');
    await expect(options).toHaveCount(3);

    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    // Automatic hands control back to the system preference.
    await page.getByRole('radio', { name: 'Automatic' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  });

  test('Automatic follows the system appearance', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/#/profile');
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.emulateMedia({ colorScheme: 'light' });
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(darkBg).not.toBe(lightBg);
  });

  test('puts the profile above the progress content', async ({ page }) => {
    await page.goto('/#/profile');
    const card = (await page.locator('.profile-card').boundingBox())!;
    const heading = (await page
      .getByRole('heading', { name: 'Your progress', level: 2 })
      .boundingBox())!;
    const hero = (await page.locator('.progress-hero').boundingBox())!;

    expect(card.y).toBeLessThan(heading.y);
    expect(heading.y).toBeLessThan(hero.y);
  });

  test('leaves a clear gap below the Course progress card', async ({ page }) => {
    await page.goto('/#/profile');
    // The route is lazily loaded, so wait for the card before measuring.
    await expect(page.locator('.progress-hero')).toBeVisible();
    // Whatever follows the course-progress hero — Recommended next once there
    // is progress, the get-started panel before that — must not touch it.
    const gap = await page.evaluate(() => {
      const hero = document.querySelector('.progress-hero')!;
      const next = hero.nextElementSibling;
      if (!next) return null;
      const a = hero.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      return Math.round(b.top - a.bottom);
    });
    expect(gap, 'nothing follows the course-progress card').not.toBeNull();
    expect(gap!, 'the two cards must not touch').toBeGreaterThanOrEqual(10);
    expect(gap!, 'the gap should stay in the section-spacing range').toBeLessThanOrEqual(28);
  });

  test('shows an honest empty achievement state', async ({ page }) => {
    await page.goto('/#/profile');
    await expect(page.getByText(/None yet/)).toBeVisible();
    await expect(page.locator('.profile-achievement')).toHaveCount(0);
  });
});
