/**
 * Shared Playwright annotation helpers — used by both annotated.spec.ts and
 * record-demo.mjs.  All DOM work runs inside page.evaluate so the helpers
 * are runtime-agnostic (Playwright test runner or plain Node script).
 *
 * ann-pulse colour is passed via a CSS custom property set on each ring
 * element so multiple calls with different colours never interfere.
 */

/** @param {import('@playwright/test').Page} page */
export async function clearAnn(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.__ann').forEach((n) => n.remove())
  })
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} label
 * @param {{ side?: 'right'|'left'|'above'|'below', color?: string }} [opts]
 */
export async function ann(page, selector, label, { side = 'right', color = '#ff3366' } = {}) {
  await page.evaluate(
    ({ selector, label, side, color }) => {
      document.querySelectorAll('.__ann').forEach((n) => n.remove())

      if (!document.querySelector('#__ann-style')) {
        const s = document.createElement('style')
        s.id = '__ann-style'
        // --ann-color is set as an inline custom property on each ring element,
        // so every annotation gets its own pulse colour regardless of order.
        s.textContent = `
          @keyframes ann-in    { from { opacity:0; transform:scale(.85) } to { opacity:1; transform:scale(1) } }
          @keyframes ann-pulse { 0%,100% { box-shadow:0 0 0 0 var(--ann-color) } 50% { box-shadow:0 0 0 6px transparent } }
          .__ann-ring  { animation: ann-in .25s ease, ann-pulse 1.4s .25s ease infinite }
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
      // --ann-color drives the pulse keyframe for this specific ring.
      ring.style.cssText = `
        --ann-color: ${color}55;
        position:fixed; pointer-events:none; z-index:2147483647;
        left:${r.left - pad}px; top:${r.top - pad}px;
        width:${r.width + pad * 2}px; height:${r.height + pad * 2}px;
        border:3px solid ${color}; border-radius:50%;
      `
      document.body.appendChild(ring)

      const badge = document.createElement('div')
      badge.className = '__ann __ann-badge'
      badge.textContent = label

      const bw = Math.max(label.length * 7.5 + 20, 120)
      let bLeft, bTop
      if (side === 'right')  { bLeft = r.right + 14;       bTop = r.top + r.height / 2 - 13 }
      if (side === 'left')   { bLeft = r.left - bw - 14;   bTop = r.top + r.height / 2 - 13 }
      if (side === 'above')  { bLeft = r.left;              bTop = r.top - 36 }
      if (side === 'below')  { bLeft = r.left;              bTop = r.bottom + 8 }

      badge.style.cssText = `
        position:fixed; pointer-events:none; z-index:2147483647;
        left:${bLeft}px; top:${bTop}px;
        background:${color}; color:#fff;
        padding:3px 10px; font:bold 12px/22px monospace;
        border-radius:3px; white-space:nowrap;
        box-shadow:0 2px 10px rgba(0,0,0,.5);
      `
      document.body.appendChild(badge)
    },
    { selector, label, side, color }
  )
}
