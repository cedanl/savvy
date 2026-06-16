import { chromium } from '@playwright/test'
import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs from 'fs'

const require = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')

const MOCK_RESPONSE = {
  filename: 'employee_survey_2024.sav',
  row_count: 2841,
  columns: [
    {
      name: 'resp_id', label: 'Respondent ID', type: 'numeric',
      sample_values: ['1001', '1002', '1003'], value_labels: {},
    },
    {
      name: 'age', label: 'Age', type: 'numeric',
      sample_values: ['28', '34', '51'], value_labels: {},
    },
    {
      name: 'gender', label: 'Gender', type: 'categorical',
      sample_values: ['1', '2', '3'],
      value_labels: { '1': 'Male', '2': 'Female', '3': 'Non-binary' },
    },
    {
      name: 'edu_level', label: 'Education level', type: 'categorical',
      sample_values: ['2', '3', '4'],
      value_labels: { '1': 'Primary', '2': 'Secondary', '3': 'Bachelor', '4': 'Master', '5': 'PhD' },
    },
    {
      name: 'job_sat', label: 'Job satisfaction', type: 'categorical',
      sample_values: ['3', '4', '5'],
      value_labels: { '1': 'Very low', '2': 'Low', '3': 'Neutral', '4': 'High', '5': 'Very high' },
    },
    {
      name: 'income_net', label: 'Net monthly income', type: 'numeric',
      sample_values: ['2400', '3850', '5200'], value_labels: {},
    },
    {
      name: 'region', label: 'Region', type: 'categorical',
      sample_values: ['1', '3'],
      value_labels: { '1': 'North', '2': 'East', '3': 'South', '4': 'West' },
    },
    {
      name: 'yrs_employed', label: 'Years employed', type: 'numeric',
      sample_values: ['2', '7', '14'], value_labels: {},
    },
  ],
}

// ── annotation helpers ──────────────────────────────────────────────────────

async function ann(page, selector, label, { side = 'right', color = '#ff3366' } = {}) {
  await page.evaluate(({ selector, label, side, color }) => {
    document.querySelectorAll('.__ann').forEach((n) => n.remove())

    if (!document.querySelector('#__ann-style')) {
      const s = document.createElement('style')
      s.id = '__ann-style'
      s.textContent = `
        @keyframes ann-in  { from { opacity:0; transform:scale(.85) } to { opacity:1; transform:scale(1) } }
        @keyframes ann-pulse { 0%,100% { box-shadow: 0 0 0 0 ${color}55 } 50% { box-shadow: 0 0 0 6px ${color}00 } }
        .__ann-ring { animation: ann-in .25s ease, ann-pulse 1.4s .25s ease infinite }
        .__ann-badge { animation: ann-in .25s ease }
      `
      document.head.appendChild(s)
    }

    const el = document.querySelector(selector)
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 10

    const ring = document.createElement('div')
    ring.className = '__ann __ann-ring'
    ring.style.cssText = `
      position:fixed; pointer-events:none; z-index:2147483647;
      left:${r.left - pad}px; top:${r.top - pad}px;
      width:${r.width + pad * 2}px; height:${r.height + pad * 2}px;
      border: 3px solid ${color}; border-radius:50%;
    `
    document.body.appendChild(ring)

    const badge = document.createElement('div')
    badge.className = '__ann __ann-badge'
    badge.textContent = label

    const bw = Math.max(label.length * 7.5 + 20, 120)
    let bLeft, bTop
    if (side === 'right')  { bLeft = r.right + 14;          bTop = r.top + r.height / 2 - 13 }
    if (side === 'left')   { bLeft = r.left - bw - 14;      bTop = r.top + r.height / 2 - 13 }
    if (side === 'above')  { bLeft = r.left;                 bTop = r.top - 36 }
    if (side === 'below')  { bLeft = r.left;                 bTop = r.bottom + 8 }

    badge.style.cssText = `
      position:fixed; pointer-events:none; z-index:2147483647;
      left:${bLeft}px; top:${bTop}px;
      background:${color}; color:#fff;
      padding:3px 10px; font:bold 12px/22px monospace;
      border-radius:3px; white-space:nowrap;
      box-shadow:0 2px 10px rgba(0,0,0,.5);
    `
    document.body.appendChild(badge)
  }, { selector, label, side, color })
}

async function clearAnn(page) {
  await page.evaluate(() => document.querySelectorAll('.__ann').forEach((n) => n.remove()))
}

async function pause(page, ms) {
  await page.waitForTimeout(ms)
}

// ── setup ───────────────────────────────────────────────────────────────────

const VIDEO_TMP = 'e2e/video-tmp'
const GIF_OUT = 'e2e/screenshots/demo.gif'

fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
fs.mkdirSync(VIDEO_TMP, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  recordVideo: { dir: VIDEO_TMP, size: { width: 1280, height: 760 } },
  viewport: { width: 1280, height: 760 },
})
const page = await context.newPage()

await page.route('**/api/file', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MOCK_RESPONSE),
  })
})

await page.route('**/api/export', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/csv',
    body: 'resp_id,age,gender\n1001,28,Male\n1002,34,Female\n',
  })
})

// ── scene 1: initial state ───────────────────────────────────────────────────

await page.goto('http://localhost:5173')
await page.waitForLoadState('networkidle')
await pause(page, 800)

await ann(page, '.upload-zone', 'Drop or click to load a .sav file', { side: 'below', color: '#00d4a8' })
await pause(page, 2000)
await clearAnn(page)

// ── scene 2: upload ──────────────────────────────────────────────────────────

await page.locator('[data-testid="file-input"]').setInputFiles({
  name: 'employee_survey_2024.sav',
  mimeType: 'application/octet-stream',
  buffer: Buffer.from('fake'),
})

await page.getByTestId('invert-btn').waitFor({ state: 'visible' })
await pause(page, 600)

// ── scene 3: point out column label vs coded name ───────────────────────────

await ann(page, 'tr:nth-child(2) td:nth-child(2)', 'Label + coded variable name', { side: 'right', color: '#00d4a8' })
await pause(page, 2200)
await clearAnn(page)

// ── scene 4: point out the type badge ───────────────────────────────────────

await ann(page, 'tr:nth-child(3) td:nth-child(3)', 'Variable type (categorical / numeric)', { side: 'right', color: '#f59e0b' })
await pause(page, 2000)
await clearAnn(page)
await pause(page, 300)

// ── scene 5: change export mode on a categorical column ─────────────────────

// gender row — find the select inside row 3 (gender)
const genderSelect = page.locator('tr:nth-child(3) select').first()
await ann(page, 'tr:nth-child(3) select', 'Choose export format', { side: 'right', color: '#ff3366' })
await pause(page, 1400)
await genderSelect.selectOption('codes')
await pause(page, 600)
await genderSelect.selectOption('both')
await pause(page, 1000)
await clearAnn(page)

// ── scene 6: search ──────────────────────────────────────────────────────────

await ann(page, '.search-input', 'Search columns by name or label', { side: 'right', color: '#00d4a8' })
await pause(page, 1200)
await page.locator('.search-input').fill('job')
await pause(page, 1000)
await page.locator('.search-input').fill('')
await clearAnn(page)
await pause(page, 400)

// ── scene 7: invert selection ────────────────────────────────────────────────

await ann(page, '[data-testid="invert-btn"]', 'Invert all column selections', { side: 'left', color: '#ff3366' })
await pause(page, 1400)
await page.getByTestId('invert-btn').click()
await pause(page, 800)
await clearAnn(page)

await page.getByRole('button', { name: 'Select all', exact: true }).click()
await pause(page, 600)

// ── scene 8: export ──────────────────────────────────────────────────────────

await page.evaluate(() => window.scrollTo({ top: 999, behavior: 'smooth' }))
await pause(page, 700)

await ann(page, '.btn-primary', 'Export selected columns to CSV', { side: 'left', color: '#00d4a8' })
await pause(page, 1800)
await clearAnn(page)
await pause(page, 500)

// ── finish ───────────────────────────────────────────────────────────────────

await context.close()
await browser.close()

const webm = fs.readdirSync(VIDEO_TMP).find((f) => f.endsWith('.webm'))
if (!webm) throw new Error('No video found in ' + VIDEO_TMP)

console.log('Converting', webm, '→', GIF_OUT)
execFileSync(ffmpegPath, [
  '-i', `${VIDEO_TMP}/${webm}`,
  '-vf', [
    'fps=8',
    'scale=800:-1:flags=lanczos',
    'split[s0][s1]',
    '[s0]palettegen=max_colors=128:stats_mode=diff[p]',
    '[s1][p]paletteuse=dither=bayer:bayer_scale=5',
  ].join(','),
  '-y', GIF_OUT,
])

fs.rmSync(VIDEO_TMP, { recursive: true, force: true })
console.log('Done →', GIF_OUT)
