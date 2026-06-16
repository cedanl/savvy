import { test, expect, type Page } from '@playwright/test'

async function annotate(page: Page, testId: string, label: string) {
  await page.evaluate(({ testId, label }) => {
    const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pad = 10

    const ring = document.createElement('div')
    ring.style.cssText = `
      position: fixed;
      left: ${rect.left - pad}px;
      top: ${rect.top - pad}px;
      width: ${rect.width + pad * 2}px;
      height: ${rect.height + pad * 2}px;
      border: 3px solid #ff3366;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483647;
    `
    document.body.appendChild(ring)

    const badge = document.createElement('div')
    badge.textContent = label
    badge.style.cssText = `
      position: fixed;
      left: ${rect.right + 12}px;
      top: ${rect.top - 1}px;
      background: #ff3366;
      color: #fff;
      padding: 2px 8px;
      font-size: 11px;
      font-family: monospace;
      pointer-events: none;
      z-index: 2147483647;
      border-radius: 3px;
      white-space: nowrap;
    `
    document.body.appendChild(badge)
  }, { testId, label })
}

test('annotated screenshot — Invert selection button', async ({ page }) => {
  await page.route('**/api/file', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filename: 'demo.sav',
        row_count: 500,
        columns: [
          { name: 'age', label: 'Age', type: 'numeric', sample_values: ['25', '30', '41'], value_labels: {} },
          { name: 'gender', label: 'Gender', type: 'categorical', sample_values: ['1', '2'], value_labels: { '1': 'Male', '2': 'Female' } },
          { name: 'income', label: 'Monthly income', type: 'numeric', sample_values: ['3200', '4500'], value_labels: {} },
        ],
      }),
    })
  })

  await page.goto('/')
  await expect(page.locator('[data-testid="file-input"]')).toBeAttached({ timeout: 15000 })

  await page.locator('[data-testid="file-input"]').setInputFiles({
    name: 'demo.sav',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('fake'),
  })

  await expect(page.getByTestId('invert-btn')).toBeVisible({ timeout: 10000 })

  await annotate(page, 'invert-btn', 'New: invert all columns at once')

  await page.screenshot({ path: 'e2e/screenshots/invert-selection-annotated.png' })
})
