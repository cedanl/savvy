import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
})

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = ''
})
