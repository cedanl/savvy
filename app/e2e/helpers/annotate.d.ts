import type { Page } from '@playwright/test'

export function ann(
  page: Page,
  selector: string,
  label: string,
  opts?: { side?: 'right' | 'left' | 'above' | 'below'; color?: string }
): Promise<void>

export function clearAnn(page: Page): Promise<void>
