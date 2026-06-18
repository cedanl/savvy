import { test, expect, type Page } from '@playwright/test'
import { ann } from './helpers/annotate.mjs'

const MOCK_DATA = {
  filename: 'demo.sav',
  row_count: 500,
  columns: [
    { name: 'age', label: 'Age', type: 'numeric', sample_values: ['25', '30', '41'], value_labels: {} },
    {
      name: 'gender',
      label: 'Gender',
      type: 'categorical',
      sample_values: ['1', '2'],
      value_labels: { '1': 'Male', '2': 'Female' },
    },
    { name: 'income', label: 'Monthly income', type: 'numeric', sample_values: ['3200', '4500'], value_labels: {} },
  ],
}

async function mockApi(page: Page) {
  await page.route('**/api/file', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DATA) })
  )
}

async function uploadFile(page: Page) {
  await page.locator('[data-testid="file-input"]').setInputFiles({
    name: 'demo.sav',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('fake'),
  })
  await expect(page.locator('.toolbar')).toBeVisible({ timeout: 10000 })
}

test('annotated screenshot — theme toggle in light mode', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto('/')
  await expect(page.locator('[data-testid="file-input"]')).toBeAttached({ timeout: 15000 })

  await uploadFile(page)
  await ann(page, '[data-testid="theme-toggle"]', 'Toggle light / dark mode', { side: 'left', color: '#7c3aed' })
  await page.screenshot({ path: 'e2e/screenshots/theme-toggle-light.png' })
})

test('annotated screenshot — theme toggle in dark mode', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await page.goto('/')
  await expect(page.locator('[data-testid="file-input"]')).toBeAttached({ timeout: 15000 })

  await uploadFile(page)
  await ann(page, '[data-testid="theme-toggle"]', 'Toggle light / dark mode', { side: 'left', color: '#00d4a8' })
  await page.screenshot({ path: 'e2e/screenshots/theme-toggle-dark.png' })
})

test('theme toggle switches data-theme attribute', async ({ page }) => {
  await mockApi(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.goto('/')
  await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({ timeout: 15000 })

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
