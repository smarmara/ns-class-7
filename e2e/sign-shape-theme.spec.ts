/**
 * Sign-shape diagrams follow the theme; official signs never do.
 *
 * The unit tests check the tokens and the markup. These check the thing that
 * actually matters to a learner: that switching Appearance repaints the
 * teaching diagrams live, in the real cascade, and that the Province's artwork
 * comes through the same switch completely unchanged.
 */
import { expect, test, type Page } from '@playwright/test';

/** The computed fill of the first shape diagram on the page. */
async function shapeFill(page: Page): Promise<string> {
  return page.locator('svg.sign-shape').first().evaluate((svg) => {
    const geometry = svg.querySelector('polygon, rect, path')!;
    return getComputedStyle(geometry).fill;
  });
}

/** Relative luminance of a `rgb(r, g, b)` string, for light-vs-dark checks. */
function luminance(rgb: string): number {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [
    number,
    number,
    number,
  ];
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

async function chooseAppearance(page: Page, label: 'Light' | 'Dark' | 'Automatic') {
  await page.goto('/#/profile');
  await page.getByRole('radio', { name: label }).click();
}

test.describe('sign-shape diagrams adapt to the theme', () => {
  test('switching appearance repaints the shapes immediately, with no reload', async ({
    page,
  }) => {
    await chooseAppearance(page, 'Light');
    await page.goto('/#/signs/gallery');
    await expect(page.locator('svg.sign-shape').first()).toBeVisible();
    const light = await shapeFill(page);

    /*
     * The switch happens on another route, so come back and read the same
     * element again without reloading. The palette is pure CSS custom
     * properties keyed off `<html data-theme>`, so the repaint is the browser's
     * — there is no JS colour logic that could be skipped here.
     */
    await chooseAppearance(page, 'Dark');
    await page.goto('/#/signs/gallery');
    await expect(page.locator('svg.sign-shape').first()).toBeVisible();
    const dark = await shapeFill(page);

    expect(dark).not.toBe(light);
    expect(luminance(dark), 'dark mode uses the lighter shape').toBeGreaterThan(
      luminance(light),
    );
  });

  test('repaints without leaving the page at all', async ({ page }) => {
    // The stricter version of the test above: same DOM, no navigation, no
    // reload — the appearance control and a shape on screen together.
    await chooseAppearance(page, 'Light');
    await page.goto('/#/signs/gallery');
    await expect(page.locator('svg.sign-shape').first()).toBeVisible();
    const before = await shapeFill(page);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const after = await shapeFill(page);

    expect(after).not.toBe(before);
    expect(luminance(after)).toBeGreaterThan(luminance(before));
  });

  test('all six shapes share one treatment', async ({ page }) => {
    // Shape carries the meaning in these questions; colour is only providing
    // contrast. Per-shape colours would invent a distinction the content does
    // not make.
    await chooseAppearance(page, 'Dark');
    await page.goto('/#/signs/gallery');
    await expect(page.locator('svg.sign-shape').first()).toBeVisible();

    const fills = await page.locator('svg.sign-shape').evaluateAll((nodes) =>
      nodes.map((svg) => getComputedStyle(svg.querySelector('polygon, rect, path')!).fill),
    );
    expect(fills.length).toBeGreaterThanOrEqual(6);
    expect(new Set(fills).size, 'one shared fill').toBe(1);
  });

  test('holds contrast in a question at phone sizes', async ({ page }) => {
    for (const size of [
      { width: 390, height: 844 },
      { width: 375, height: 812 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(size);
      await chooseAppearance(page, 'Dark');
      await page.goto('/#/study/signs-shapes');

      /*
       * Both places a shape can appear in a question. Six of the seven shape
       * questions put one on the stage; one asks the learner to pick between
       * shapes, so its diagrams are in the choices at a smaller size. Which
       * question is drawn first is not fixed, and the smaller rendering is the
       * one more likely to wash out — so accept either rather than retrying
       * until the draw is convenient.
       */
      const stage = page.locator('.sign-stage svg.sign-shape, .choice-sign svg.sign-shape').first();
      await expect(stage).toBeVisible();

      const { fill, background } = await stage.evaluate((svg) => {
        const geometry = svg.querySelector('polygon, rect, path')!;
        let el: HTMLElement | null = svg.parentElement;
        let bg = 'rgba(0, 0, 0, 0)';
        while (el && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
          bg = getComputedStyle(el).backgroundColor;
          el = el.parentElement;
        }
        return { fill: getComputedStyle(geometry).fill, background: bg };
      });

      const [hi, lo] = [luminance(fill), luminance(background)].sort((a, b) => b - a);
      const ratio = (hi! + 0.05) / (lo! + 0.05);
      // WCAG 1.4.11 for graphical objects.
      expect(ratio, `${size.width}x${size.height} contrast`).toBeGreaterThanOrEqual(3);
    }
  });
});

test.describe('official artwork keeps its real colours', () => {
  test('is rendered identically in light and dark', async ({ page }) => {
    const read = async (appearance: 'Light' | 'Dark') => {
      await chooseAppearance(page, appearance);
      await page.goto('/#/signs/gallery');
      const img = page.locator('.sign-card-art img').first();
      await expect(img).toBeVisible();
      return img.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          src: el.getAttribute('src'),
          filter: cs.filter,
          opacity: cs.opacity,
          blend: cs.mixBlendMode,
          classes: el.getAttribute('class') ?? '',
        };
      });
    };

    const light = await read('Light');
    const dark = await read('Dark');

    /*
     * A learner has to recognise the sign they will meet on the road, so the
     * Province's artwork must survive a theme switch untouched — no tint, no
     * inversion, no fade. The shape diagrams next to it are the only thing the
     * theme is allowed to repaint.
     */
    expect(dark).toEqual(light);
    expect(dark.filter).toBe('none');
    expect(dark.opacity).toBe('1');
    expect(dark.blend).toBe('normal');
    expect(dark.classes).not.toContain('sign-shape');
  });

  test('no sign image anywhere is filtered in dark mode', async ({ page }) => {
    await chooseAppearance(page, 'Dark');
    await page.goto('/#/signs/gallery');
    await expect(page.locator('.sign-card-art img').first()).toBeVisible();

    const filtered = await page.locator('img[src*="/signs/ns-official/"]').evaluateAll((imgs) =>
      imgs
        .filter((img) => {
          const cs = getComputedStyle(img);
          return cs.filter !== 'none' || cs.mixBlendMode !== 'normal';
        })
        .map((img) => img.getAttribute('src')),
    );
    expect(filtered, 'official crops are never filtered').toEqual([]);
  });
});
