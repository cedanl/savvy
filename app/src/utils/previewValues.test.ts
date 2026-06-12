import { describe, expect, it } from 'vitest'
import { getPreviewValues } from './previewValues'
import type { ColumnConfig, ColumnInfo } from '../types'

const categoricalCol: ColumnInfo = {
  name: 'q1',
  label: 'Overall satisfaction',
  type: 'categorical',
  sample_values: ['1', '2', '3'],
  value_labels: { '1': 'Very satisfied', '2': 'Satisfied', '3': 'Dissatisfied' },
}

const numericCol: ColumnInfo = {
  name: 'age',
  label: 'Age',
  type: 'numeric',
  sample_values: ['25', '34', '28', '45', '22'],
  value_labels: {},
}

const cfg = (mode: ColumnConfig['export_mode']): ColumnConfig => ({
  include: true,
  export_mode: mode,
  use_label_as_header: false,
})

describe('getPreviewValues', () => {
  describe('codes mode', () => {
    it('returns raw sample values', () => {
      expect(getPreviewValues(categoricalCol, cfg('codes'))).toEqual(['1', '2', '3'])
    })

    it('returns raw numeric values', () => {
      expect(getPreviewValues(numericCol, cfg('codes'))).toEqual(['25', '34', '28'])
    })
  })

  describe('labels mode', () => {
    it('maps codes to label text when value_labels exist', () => {
      expect(getPreviewValues(categoricalCol, cfg('labels'))).toEqual([
        'Very satisfied',
        'Satisfied',
        'Dissatisfied',
      ])
    })

    it('falls back to code when a specific label is missing', () => {
      const col = { ...categoricalCol, value_labels: { '1': 'Yes' } }
      expect(getPreviewValues(col, cfg('labels'))).toEqual(['Yes', '2', '3'])
    })

    it('returns raw values when value_labels is empty (numeric column)', () => {
      expect(getPreviewValues(numericCol, cfg('labels'))).toEqual(['25', '34', '28'])
    })
  })

  describe('both mode', () => {
    it('returns "code → label" format when value_labels exist', () => {
      expect(getPreviewValues(categoricalCol, cfg('both'))).toEqual([
        '1 → Very satisfied',
        '2 → Satisfied',
        '3 → Dissatisfied',
      ])
    })

    it('falls back to raw code when a specific label is missing', () => {
      const col = { ...categoricalCol, value_labels: { '1': 'Yes' } }
      expect(getPreviewValues(col, cfg('both'))).toEqual(['1 → Yes', '2', '3'])
    })

    it('returns raw values when value_labels is empty (numeric column)', () => {
      expect(getPreviewValues(numericCol, cfg('both'))).toEqual(['25', '34', '28'])
    })
  })

  describe('capping and edge cases', () => {
    it('caps at 3 values by default', () => {
      expect(getPreviewValues(numericCol, cfg('codes'))).toHaveLength(3)
    })

    it('respects a custom max', () => {
      expect(getPreviewValues(numericCol, cfg('codes'), 2)).toEqual(['25', '34'])
    })

    it('handles fewer sample values than max gracefully', () => {
      const col = { ...categoricalCol, sample_values: ['1'] }
      expect(getPreviewValues(col, cfg('labels'))).toEqual(['Very satisfied'])
    })

    it('returns empty array when sample_values is empty', () => {
      const col = { ...categoricalCol, sample_values: [] }
      expect(getPreviewValues(col, cfg('labels'))).toEqual([])
    })
  })
})
