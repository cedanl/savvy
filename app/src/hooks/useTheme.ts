import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

// Reads the attribute set by the inline script in index.html before React loads.
// Falls back to 'light' if the attribute is absent (tests, SSR).
function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  // Keep the DOM attribute in sync when the user toggles.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggle() {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light'
      try { localStorage.setItem('theme', next) } catch {}
      return next
    })
  }

  return { theme, toggle }
}
