import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ColumnTable } from './ColumnTable'
import type { ColumnConfig, ColumnInfo } from '../types'

const columns: ColumnInfo[] = [
  {
    name: 'q1',
    label: 'Overall satisfaction',
    type: 'categorical',
    sample_values: ['1', '2', '3'],
    value_labels: { '1': 'Very satisfied', '2': 'Satisfied', '3': 'Dissatisfied' },
  },
  {
    name: 'age',
    label: 'Age',
    type: 'numeric',
    sample_values: ['25', '34', '28'],
    value_labels: {},
  },
]

const defaultConfig: Record<string, ColumnConfig> = {
  q1: { include: true, export_mode: 'labels', use_label_as_header: false },
  age: { include: true, export_mode: 'codes', use_label_as_header: false },
}

describe('ColumnTable structure', () => {
  it('column header is "Variable" not "Question"', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByRole('columnheader', { name: /variable/i })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /question/i })).not.toBeInTheDocument()
  })

  it('has no separate Header column', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.queryByRole('columnheader', { name: /^header$/i })).not.toBeInTheDocument()
  })
})

describe('ColumnTable', () => {
  it('renders a row for each column', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getAllByText('q1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('age').length).toBeGreaterThan(0)
  })

  it('shows the column label prominently', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getAllByText('Overall satisfaction').length).toBeGreaterThan(0)
  })

  it('label appears before the coded name in the DOM', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    // First occurrence of each is the col-label / col-name span (before the header buttons)
    const label = screen.getAllByText('Overall satisfaction')[0]
    const name = screen.getAllByText('q1')[0]
    expect(
      label.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('shows the column type', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByText('categorical')).toBeInTheDocument()
    expect(screen.getByText('numeric')).toBeInTheDocument()
  })

  it('export mode option shows "Numbers" for codes value', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getAllByRole('option', { name: 'Numbers' })[0]).toHaveValue('codes')
  })

  it('export mode option shows "Text answers" for labels value', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getAllByRole('option', { name: 'Text answers' })[0]).toHaveValue('labels')
  })

  it('export mode option shows "Both" for both value', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getAllByRole('option', { name: 'Both' })[0]).toHaveValue('both')
  })

  it('calls onChange when include toggle is clicked', async () => {
    const onChange = vi.fn()
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={onChange} />)
    const toggles = screen.getAllByRole('checkbox')
    await userEvent.click(toggles[0])
    expect(onChange).toHaveBeenCalledWith('q1', { ...defaultConfig['q1'], include: false })
  })

  it('calls onChange when export mode is changed', async () => {
    const onChange = vi.fn()
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={onChange} />)
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'codes')
    expect(onChange).toHaveBeenCalledWith('q1', { ...defaultConfig['q1'], export_mode: 'codes' })
  })

  it('disables export mode selector when column is excluded', () => {
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], include: false } }
    render(<ColumnTable columns={columns} config={config} onChange={vi.fn()} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toBeDisabled()
  })
})

describe('ColumnTable header toggle', () => {
  it('shows both label and coded name as buttons when they differ', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Overall satisfaction' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'q1' })).toBeInTheDocument()
  })

  it('coded name button is pressed by default (use_label_as_header: false)', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'q1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Overall satisfaction' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('label button is pressed when use_label_as_header is true', () => {
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], use_label_as_header: true } }
    render(<ColumnTable columns={columns} config={config} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Overall satisfaction' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'q1' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking the label button fires onChange with use_label_as_header: true', async () => {
    const onChange = vi.fn()
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Overall satisfaction' }))
    expect(onChange).toHaveBeenCalledWith('q1', { ...defaultConfig['q1'], use_label_as_header: true })
  })

  it('clicking the coded name button fires onChange with use_label_as_header: false', async () => {
    const onChange = vi.fn()
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], use_label_as_header: true } }
    render(<ColumnTable columns={columns} config={config} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'q1' }))
    expect(onChange).toHaveBeenCalledWith('q1', { ...config['q1'], use_label_as_header: false })
  })

  it('header buttons are disabled when the column is excluded', () => {
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], include: false } }
    render(<ColumnTable columns={columns} config={config} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Overall satisfaction' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'q1' })).toBeDisabled()
  })

  it('shows a single static label (no buttons) when label equals name', () => {
    const sameCol = { ...columns[0], label: 'q1' }
    render(<ColumnTable columns={[sameCol]} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'q1' })).not.toBeInTheDocument()
  })
})

describe('ColumnTable export mode options', () => {
  it('shows all three options for a column with value_labels', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    const [q1Select] = screen.getAllByRole('combobox')
    expect(within(q1Select).getAllByRole('option')).toHaveLength(3)
  })

  it('shows no selector for a column with no value_labels', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    // only q1 (categorical) gets a combobox; age (numeric) shows plain text
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
  })

  it('shows "Numbers" plain text for a column with no value_labels', () => {
    const numericOnly = [columns[1]] // age column
    render(<ColumnTable columns={numericOnly} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Numbers')).toBeInTheDocument()
  })
})

describe('ColumnTable inline preview', () => {
  it('shows label chips in the Question cell for labels mode', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByText('Very satisfied')).toBeInTheDocument()
    expect(screen.getByText('Satisfied')).toBeInTheDocument()
    expect(screen.getByText('Dissatisfied')).toBeInTheDocument()
  })

  it('shows raw code chips in the Question cell for codes mode', () => {
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], export_mode: 'codes' as const } }
    render(<ColumnTable columns={columns} config={config} onChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows "code → label" chips in the Question cell for both mode', () => {
    const config = { ...defaultConfig, q1: { ...defaultConfig['q1'], export_mode: 'both' as const } }
    render(<ColumnTable columns={columns} config={config} onChange={vi.fn()} />)
    expect(screen.getByText('1 → Very satisfied')).toBeInTheDocument()
    expect(screen.getByText('2 → Satisfied')).toBeInTheDocument()
    expect(screen.getByText('3 → Dissatisfied')).toBeInTheDocument()
  })

  it('shows raw value chips for a numeric column (no value_labels)', () => {
    render(<ColumnTable columns={columns} config={defaultConfig} onChange={vi.fn()} />)
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  it('renders no preview when sample_values is empty', () => {
    const emptyCol = { ...columns[0], sample_values: [] }
    render(<ColumnTable columns={[emptyCol]} config={defaultConfig} onChange={vi.fn()} />)
    expect(document.querySelector('.col-preview')).toBeNull()
  })
})
