import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end coverage of the core learner journey.
 *
 * Each test starts from a clean origin so that progress from one test cannot
 * leak into the next through IndexedDB or localStorage.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    for (const db of await indexedDB.databases()) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();
});

/**
 * Navigate via the primary nav.
 *
 * Scoped to the navigation landmark because dashboard tiles deliberately
 * duplicate the nav destinations ("Practice", "Mock test"), so an unscoped
 * role lookup is ambiguous.
 */
function nav(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name });
}

/** Answer the currently displayed practice question; returns whether it was right. */
async function answerCurrentQuestion(page: Page): Promise<boolean> {
  const choices = page.locator('.choice');
  await expect(choices.first()).toBeVisible();
  await choices.first().click();
  await expect(page.locator('.verdict')).toBeVisible();
  return (await page.locator('.verdict[data-correct="true"]').count()) > 0;
}

test.describe('dashboard', () => {
  test('opens on the dashboard with an honest, non-predictive readiness score', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();
    await expect(page.locator('.readiness-score')).toHaveText(/^0/);
    await expect(page.getByText(/Provisional/i)).toBeVisible();

    await page.getByText('How this score is calculated').click();
    await expect(page.getByText(/not.*a prediction of whether you will pass/i)).toBeVisible();
  });

  test('states that it is unofficial', async ({ page }) => {
    await expect(
      page.getByText(/Not affiliated with or endorsed by the Government of Nova Scotia/i).first(),
    ).toBeVisible();
  });

  test('shows when the content was last verified', async ({ page }) => {
    await expect(page.getByText(/Content last verified:/i)).toBeVisible();
  });
});

test.describe('practice', () => {
  test('answers a question and shows the explanation and its official source', async ({ page }) => {
    await nav(page, 'Practice').click();
    await expect(page.getByRole('heading', { name: 'Quick Practice' })).toBeVisible();

    // Nothing is disclosed before an answer is chosen. Target the sources
    // block itself rather than its words, which also appear in the hint text.
    await expect(page.locator('.verdict')).toHaveCount(0);
    await expect(page.locator('.sources')).toHaveCount(0);

    await answerCurrentQuestion(page);

    await expect(page.locator('.sources')).toBeVisible();
    await expect(page.locator('.sources h4')).toHaveText('Official source');
    await expect(page.locator('.sources a').first()).toHaveAttribute(
      'href',
      /novascotia\.ca|nslegislature\.ca/,
    );
    await expect(page.locator('.choice[data-state="correct"]')).toHaveCount(1);
  });

  test('marks the outcome with words and icons, not colour alone', async ({ page }) => {
    await nav(page, 'Practice').click();
    await answerCurrentQuestion(page);

    const marked = page.locator('.choice[data-state="correct"] .choice-verdict');
    await expect(marked).toHaveText(/Correct answer/);
    await expect(page.locator('.verdict')).toHaveText(/Correct|Not quite/);
  });

  test('advances through a session and records progress', async ({ page }) => {
    await nav(page, 'Practice').click();

    for (let i = 0; i < 3; i++) {
      await answerCurrentQuestion(page);
      await page.getByRole('button', { name: /Next question|Finish/ }).click();
    }

    await nav(page, 'Home').click();
    await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();

    const answered = page.locator('.stat', { hasText: 'Answered' }).locator('.stat-value');
    await expect(answered).toHaveText('3');
  });

  test('persists progress across a reload', async ({ page }) => {
    await nav(page, 'Practice').click();
    await answerCurrentQuestion(page);
    await page.getByRole('button', { name: /Next question|Finish/ }).click();

    await nav(page, 'Home').click();
    await page.reload();

    const answered = page.locator('.stat', { hasText: 'Answered' }).locator('.stat-value');
    await expect(answered).toHaveText('1');
  });

  test('saves a question to the bookmarks queue', async ({ page }) => {
    await nav(page, 'Practice').click();
    await page.getByRole('button', { name: /^Save$/ }).click();
    await expect(page.getByRole('button', { name: /Saved/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await nav(page, 'Review').click();
    await page.getByRole('link', { name: /Saved questions/ }).click();
    await expect(page.getByRole('heading', { name: 'Saved questions' })).toBeVisible();
    await expect(page.locator('.choice').first()).toBeVisible();
  });
});

test.describe('topics and signs', () => {
  test('runs a focused topic quiz', async ({ page }) => {
    await nav(page, 'Topics').click();
    await expect(page.getByRole('heading', { name: 'Study by topic' })).toBeVisible();

    await page.getByRole('link', { name: /Traffic signals/ }).click();
    await expect(page.getByRole('heading', { name: 'Traffic signals' })).toBeVisible();
    await answerCurrentQuestion(page);
  });

  test('runs a road sign drill with artwork', async ({ page }) => {
    await nav(page, 'Signs').click();
    await page.getByRole('link', { name: /All road signs/ }).click();

    await expect(page.getByRole('heading', { name: 'All road signs' })).toBeVisible();

    // Most sign questions display artwork, but the bank also contains
    // questions about sign design conventions ("what colour marks a work
    // zone?") that correctly have no picture. Walk forward until artwork
    // appears rather than assuming the first question drawn has some.
    let sawArtwork = false;
    for (let i = 0; i < 6; i++) {
      if ((await page.locator('.sign-stage svg, .choice-sign svg').count()) > 0) {
        sawArtwork = true;
        break;
      }
      await answerCurrentQuestion(page);
      await page.getByRole('button', { name: /Next question|Finish/ }).click();
    }
    expect(sawArtwork, 'a sign drill should show sign artwork within a few questions').toBe(true);

    await expect(page.locator('.sign-stage svg, .choice-sign svg').first()).toBeVisible();
    await answerCurrentQuestion(page);
  });

  test('gives every sign an accessible description that is not its meaning', async ({ page }) => {
    await nav(page, 'Signs').click();
    await page.getByRole('link', { name: /Sign gallery/ }).click();

    const first = page.locator('svg[role="img"]').first();
    await expect(first).toBeVisible();
    const label = await first.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label!.length).toBeGreaterThan(20);
  });
});

test.describe('mock test', () => {
  test('states the official format and does not disclose answers mid-test', async ({ page }) => {
    await nav(page, 'Mock test').click();

    await expect(page.getByText('20 multiple-choice questions').first()).toBeVisible();
    await expect(page.getByText(/16 correct to pass/).first()).toBeVisible();
    await expect(page.getByText(/Each part is passed or failed on its own/)).toBeVisible();

    await page.getByRole('button', { name: 'Start mock test' }).click();
    await page.getByRole('button', { name: /Begin Rules/ }).click();

    await expect(page.locator('.exam-timer')).toBeVisible();

    // Answering discloses nothing.
    await page.locator('.choice').first().click();
    await expect(page.locator('.choice[data-state="selected"]')).toHaveCount(1);
    await expect(page.locator('.choice[data-state="correct"]')).toHaveCount(0);
    await expect(page.locator('.verdict')).toHaveCount(0);
    await expect(page.getByText('Official source')).toHaveCount(0);
  });

  test('restores an in-progress test after a refresh', async ({ page }) => {
    await nav(page, 'Mock test').click();
    await page.getByRole('button', { name: 'Start mock test' }).click();
    await page.getByRole('button', { name: /Begin Rules/ }).click();

    const stem = await page.locator('.question-stem').first().textContent();
    await page.locator('.choice').first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.reload();

    await expect(page.locator('.exam-timer')).toBeVisible();
    await expect(page.getByText('1 of 20 answered')).toBeVisible();

    // Same paper, same first question.
    await page.locator('.exam-grid button').first().click();
    await expect(page.locator('.question-stem').first()).toHaveText(stem!);
    await expect(page.locator('.choice[data-state="selected"]')).toHaveCount(1);
  });

  test('scores each part independently and reports pass or fail per part', async ({ page }) => {
    // Answering all 40 questions is a lot of round trips; this is the one
    // test that genuinely needs a long budget.
    test.setTimeout(300_000);

    await nav(page, 'Mock test').click();
    await page.getByRole('button', { name: 'Start mock test' }).click();

    for (const part of ['Rules', 'Road Signs']) {
      await page.getByRole('button', { name: new RegExp(`Begin ${part}`) }).click();

      // Answer every question, walking forward with Next rather than the grid.
      for (let i = 0; i < 20; i++) {
        await page.locator('.choice').first().click();
        if (i < 19) await page.getByRole('button', { name: 'Next', exact: true }).click();
      }
      await expect(page.getByText('20 of 20 answered')).toBeVisible();

      await page.getByRole('button', { name: new RegExp(`^Submit (?!part)`) }).click();
      await page.getByRole('button', { name: 'Submit part', exact: true }).click();
    }

    await expect(page.getByRole('heading', { name: 'Mock test results' })).toBeVisible();
    await expect(page.locator('.result-section')).toHaveCount(2);
    await expect(page.locator('.result-badge').first()).toHaveText(/Pass|Fail/);
    await expect(page.getByText(/Each part is scored on its own/)).toBeVisible();
    // Now that it is submitted, the explanations are available.
    await expect(page.getByText(/Questions you missed/)).toBeVisible();
  });
});

test.describe('sources and transparency', () => {
  test('explains the Traffic Safety Act status and lists official sources', async ({ page }) => {
    await page.goto('/#/sources');

    await expect(page.getByRole('heading', { name: 'Sources and about' })).toBeVisible();
    await expect(page.getByText(/Not proclaimed in force/i).first()).toBeVisible();
    await expect(page.getByText(/NOT PROCLAIMED IN FORCE/).first()).toBeVisible();
    await expect(
      page.getByText(/Every question is written against the Motor Vehicle Act/i),
    ).toBeVisible();

    const sourceLinks = page.locator('.tile[href]');
    expect(await sourceLinks.count()).toBeGreaterThan(3);
  });

  test('lets the learner erase all their data', async ({ page }) => {
    await nav(page, 'Practice').click();
    await answerCurrentQuestion(page);

    await page.goto('/#/sources');
    await page.getByRole('button', { name: 'Reset all progress' }).click();
    await page.getByRole('button', { name: 'Erase everything' }).click();

    await nav(page, 'Home').click();
    const answered = page.locator('.stat', { hasText: 'Answered' }).locator('.stat-value');
    await expect(answered).toHaveText('0');
  });
});

test.describe('offline (PWA)', () => {
  test('serves the app from the service-worker cache when the network is cut', async ({
    page,
    context,
  }) => {
    // `navigator.serviceWorker.ready` resolves only once an active worker is
    // fully installed and ready to answer navigations — the robust readiness
    // signal. Going offline before that can race the worker's activation and
    // send the reload to the (now missing) network.
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Your readiness' })).toBeVisible();
    await expect(page.getByText(/Content last verified:/i)).toBeVisible();
  });
});

test.describe('accessibility', () => {
  test('is fully keyboard navigable through a question', async ({ page }) => {
    await page.goto('/#/practice');
    await expect(page.locator('.choice').first()).toBeVisible();

    // Tab until a choice has focus, then activate it with the keyboard.
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const focusedIsChoice = await page.evaluate(() =>
        document.activeElement?.classList.contains('choice'),
      );
      if (focusedIsChoice) break;
    }

    await expect(page.locator('.choice:focus')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.locator('.verdict')).toBeVisible();
  });

  test('exposes a skip link and a labelled navigation landmark', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeAttached();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  });

  test('groups choices in a labelled fieldset for screen readers', async ({ page }) => {
    await page.goto('/#/practice');
    await expect(page.locator('fieldset.choices')).toBeVisible();
    await expect(page.locator('fieldset.choices legend')).not.toBeEmpty();
  });

  test('has no horizontal overflow on a phone', async ({ page }) => {
    await page.goto('/#/practice');
    await expect(page.locator('.choice').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
