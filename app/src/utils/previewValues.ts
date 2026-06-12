import type { ColumnConfig, ColumnInfo } from '../types'

const PREVIEW_MAX = 3

export function getPreviewValues(col: ColumnInfo, config: ColumnConfig, max = PREVIEW_MAX): string[] {
  const values = col.sample_values.slice(0, max)
  const hasLabels = Object.keys(col.value_labels).length > 0

  if (config.export_mode === 'labels' && hasLabels) {
    return values.map((v) => col.value_labels[v] ?? v)
  }

  if (config.export_mode === 'both' && hasLabels) {
    return values.map((v) => {
      const label = col.value_labels[v]
      return label != null ? `${v} → ${label}` : v
    })
  }

  return values
}
