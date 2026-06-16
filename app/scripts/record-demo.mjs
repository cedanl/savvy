import { chromium } from '@playwright/test'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')

const MOCK_RESPONSE = {
  filename: 'survey_2024.sav',
  row_count: 1240,
  columns: [
    { name: 'age', label: 'Age', type: 'numeric', sample_values: ['25', '34', '41'], value_labels: {} },
    { name: 'gender', label: 'Gender', type: 'categorical', sample_values: ['1', '2'], value_labels: { '1': 'Male', '2': 'Female' } },
    { name: 'income', label: 'Monthly income', type: 'numeric', sample_values: ['3200', '4500'], value_labels: {} },
    { name: 'edu', label: 'Education level', type: 'categorical', sample_values: ['1', '2', '3'], value_labels: { '1': 'Primary', '2': 'Secondary', '3': 'Higher' } },
    { name: 'region', label: 'Region', type: 'categorical', sample_values: ['1', '2'], value_labels: { '1': 'North', '2': 'South' } },
  ],
}

const VIDEO_TMP = 'e2e/video-tmp'
const GIF_OUT = 'e2e/screenshots/demo.gif'

fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
fs.mkdirSync(VIDEO_TMP, { recursive: true })

const browser = await chromium.launch({ slowMo: 400 })
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_TMP, size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
})
const page = await context.newPage()

await page.route('**/api/file', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MOCK_RESPONSE),
  })
})

await page.goto('http://localhost:5173')
await page.waitForLoadState('networkidle')

// pause on initial state
await page.waitForTimeout(1200)

// upload mock file
await page.locator('[data-testid="file-input"]').setInputFiles({
  name: 'survey_2024.sav',
  mimeType: 'application/octet-stream',
  buffer: Buffer.from('fake'),
})

await page.getByTestId('invert-btn').waitFor({ state: 'visible' })
await page.waitForTimeout(800)

// click Invert Selection
await page.getByTestId('invert-btn').click()
await page.waitForTimeout(800)

// click Select All to restore
await page.getByRole('button', { name: 'Select all', exact: true }).click()
await page.waitForTimeout(800)

await context.close()
await browser.close()

// find generated webm
const webm = fs.readdirSync(VIDEO_TMP).find((f) => f.endsWith('.webm'))
if (!webm) throw new Error('No video file found in ' + VIDEO_TMP)

console.log('Converting', webm, '→', GIF_OUT)
execFileSync(ffmpegPath, [
  '-i', `${VIDEO_TMP}/${webm}`,
  '-vf', 'fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
  '-y',
  GIF_OUT,
])

fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
console.log('Done →', GIF_OUT)
