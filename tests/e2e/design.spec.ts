import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('saved queries restore applied filters and latest-date behavior after navigation', async ({
  page,
}) => {
  await page.goto('/ward');
  await expect(page.getByRole('region', { name: 'Last 28 days evidence' })).toBeVisible();
  await page.getByRole('button', { name: /Saved queries/ }).click();
  await page.getByLabel('Query name').fill('Urology quick review');
  await page.getByRole('button', { name: 'Save query', exact: true }).click();
  await expect(page.getByText('Query saved.', { exact: false })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByLabel('Ward', { exact: true }).selectOption('ICU');
  await page.getByRole('button', { name: 'Apply cohort' }).click();
  await expect(page.getByRole('region', { name: 'Last 28 days evidence' })).toContainText(
    '29 tested',
  );
  await page.reload();
  await page.getByRole('button', { name: /Saved queries/ }).click();
  await page
    .getByRole('button', { name: 'Urology quick review Latest published samples · CIP' })
    .click();
  await expect(page.getByLabel('Ward', { exact: true })).toHaveValue('URO');
  await expect(page.getByRole('region', { name: 'Last 28 days evidence' })).toContainText('75.0');
  await expect(page).toHaveURL(/date_mode=follow/);
});

test('design review across screen widths, support states and drawers', async ({ page }, info) => {
  test.setTimeout(120_000);
  const screenshot = async (name: string) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: info.outputPath(`${name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  };
  const ready = async () => {
    await expect(page.getByRole('region', { name: 'Last 28 days evidence' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Susceptibility time chart' })).toBeVisible();
  };
  await page.setViewportSize({ width: 1185, height: 1000 });
  await page.goto('/ward?ward_code=');
  await ready();
  await screenshot('01-ward-1185');
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await screenshot(`ward-${width}`);
  }
  await page.setViewportSize({ width: 1185, height: 1000 });
  await page.getByRole('button', { name: 'Population filters', exact: true }).click();
  await screenshot('05-population-filters');
  await page.getByLabel('Minimum age').fill('80');
  await page.getByLabel('Maximum age').fill('18');
  await page.getByRole('button', { name: 'Apply cohort' }).click();
  await expect(page.getByRole('alert')).toContainText('minimum no greater');
  await screenshot('06-invalid-ages');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL(/ward_code=URO/);
  await expect(page.getByLabel('Ward', { exact: true })).toHaveValue('URO');
  for (const [ward, name, text] of [
    ['ICU', '07-sparse', 'Insufficient data'],
    ['GER', '08-no-tests', 'No susceptibility tests recorded'],
    ['PHC-N', '09-empty', 'No eligible isolates'],
  ]) {
    await page.getByLabel('Ward', { exact: true }).selectOption(ward);
    await page.getByRole('button', { name: 'Apply cohort' }).click();
    await expect(page.getByRole('region', { name: 'Last 28 days evidence' })).toContainText(text);
    await screenshot(name);
  }
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL(/ward_code=URO/);
  await expect(page.getByLabel('Ward', { exact: true })).toHaveValue('URO');
  await page.getByLabel('Report end date').fill('2026-09-20');
  await expect(page).toHaveURL(/as_of=2026-09-20/);
  await expect(page.getByRole('button', { name: 'Use latest date' })).toBeVisible();
  await screenshot('11-pinned-date');
  await page.getByRole('button', { name: 'Use latest date' }).click();
  await expect(page.getByLabel('Report end date')).toHaveValue('2026-09-27');
  await page.getByLabel('Compare with B').selectOption('MEC');
  await expect(page.getByText('Only 26 paired tests')).toBeVisible();
  await screenshot('12-sparse-comparison');
  await page.getByLabel('Compare with B').selectOption('');
  await expect(page.getByRole('heading', { name: 'Choose two antibiotics' })).toBeVisible();
  await screenshot('13-no-comparison');
  await page.getByLabel('Compare with B').selectOption('TMP');
  await page.getByRole('link', { name: 'Investigate cohort' }).click();
  await expect(page.getByRole('heading', { name: 'Evidence behind the estimate' })).toBeVisible();
  await screenshot('16-investigate');
  await page.getByRole('button', { name: 'Export snapshot' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await screenshot('32-provenance');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV', exact: true }).click();
  await download;
  await expect(page.getByRole('status').filter({ hasText: 'Snapshot downloaded' })).toBeVisible();
  await screenshot('15-export-toast');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'Patient history', exact: true }).click();
  await screenshot('27-patient-search');
  await page.getByLabel('Patient identifier').fill('nomatch');
  await expect(page.getByText('No matching patients')).toBeVisible();
  await screenshot('28-patient-empty');
  await page.getByLabel('Patient identifier').fill('P-00142');
  await expect(page.getByRole('button', { name: 'P-00142 Synthetic patient' })).toBeVisible();
  await screenshot('29-patient-results');
  await page.getByRole('button', { name: 'P-00142 Synthetic patient' }).click();
  await expect(page.getByText('3 prior cultures')).toBeVisible();
  await screenshot('30-patient-history');
  await page.getByRole('button', { name: 'Expand all results' }).click();
  await screenshot('31-expanded-results');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.getByRole('button', { name: 'About this workspace' }).click();
  await screenshot('34-reading-evidence');
});
