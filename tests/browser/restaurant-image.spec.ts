import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/test-fixture/image'); });

test('toggle persists, components stay independent, and only the visible image is accessible', async ({ page, isMobile }) => {
  const images = page.locator('restaurant-image');
  const first = images.nth(0);
  const button = first.getByRole('button');
  await expect(button).toBeVisible();
  await expect(first.locator('figcaption').getByRole('button')).toHaveText('Generated illustration');
  await expect(first.getByRole('img')).toHaveCount(1);
  if (isMobile) await button.tap(); else await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveText('Original photo');
  await expect(first.locator('[data-caption]')).toHaveText('Original photo');
  await expect(first.getByRole('img')).toHaveAttribute('alt', 'Colour circle and square');
  await expect(images.nth(1)).toHaveAttribute('data-photo-visible', 'false');
  await first.locator('.restaurant-image-frame').dispatchEvent('pointerenter', { pointerType: 'mouse' });
  await first.locator('.restaurant-image-frame').dispatchEvent('pointerleave', { pointerType: 'mouse' });
  await expect(first).toHaveAttribute('data-photo-visible', 'true');
  if (isMobile) await button.tap(); else await button.click();
  await expect(first).toHaveAttribute('data-photo-visible', 'false');
  await expect(first.locator('[data-caption]')).toHaveText('Generated illustration');
  await expect(images.nth(3).getByRole('button')).toHaveCount(0);
  await expect(images.nth(3).getByRole('img')).toHaveCount(1);
});

test('hover is temporary and touch does not create sticky hover', async ({ page, isMobile }) => {
  const first = page.locator('restaurant-image').first();
  const frame = first.locator('.restaurant-image-frame');
  await expect(first.getByRole('button')).toBeVisible();
  if (isMobile) {
    await frame.tap();
    await expect(first).toHaveAttribute('data-photo-visible', 'false');
  } else {
    await frame.hover();
    await expect(first).toHaveAttribute('data-photo-visible', 'true');
    await expect(first.locator('[data-caption]')).toHaveText('Original photo');
    await page.getByRole('heading', { level: 1 }).hover();
    await expect(first).toHaveAttribute('data-photo-visible', 'false');
  }
});

test('keyboard can toggle with visible focus and reduced motion removes crossfade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const first = page.locator('restaurant-image').first();
  const button = first.getByRole('button');
  await expect(button).toBeVisible();
  await page.keyboard.press('Tab');
  for (let step = 0; step < 12 && !(await button.evaluate(el => el === document.activeElement)); step++) await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('data-photo-visible', 'true');
  await expect(first.locator('[data-photo]')).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('data-photo-visible', 'false');
});

test('images load in matching frames without overflow on cards and full pages', async ({ page }, testInfo) => {
  await expect(page.locator('restaurant-image').first().getByRole('button')).toBeVisible();
  for (const root of await page.locator('restaurant-image').all()) {
    await root.scrollIntoViewIfNeeded();
    for (const img of await root.locator('img').all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const bounds = await root.locator('[data-illustration]').boundingBox();
    if (await root.locator('[data-photo]').count()) expect(await root.locator('[data-photo]').boundingBox()).toEqual(bounds);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('illustrations.png'), fullPage: true });
  await page.locator('restaurant-image').first().getByRole('button').click();
  await expect(page.locator('[data-photo]').first()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('photo-reveal.png'), fullPage: true });
});

test('without JavaScript the illustration, caption and content remain usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/test-fixture/image`);
  const first = page.locator('restaurant-image').first();
  await expect(first.locator('button')).toBeHidden();
  await expect(first.locator('[data-photo]')).toHaveCSS('opacity', '0');
  await expect(first.getByRole('img')).toHaveCount(1);
  await expect(first.locator('[data-caption]')).toHaveText('Generated illustration');
  await expect(page.getByRole('link', { name: 'Paired image fixture', exact: true }).first()).toHaveAttribute('href', '/restaurants/place/fixture');
  await context.close();
});
