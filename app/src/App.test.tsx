import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as api from './api'
import type { FileResponse } from './types'

vi.mock('./api')

const mockData: FileResponse = {
  filename: 'survey.sav',
  row_count: 4,
  columns: [
    {
      name: 'q1',
      label: 'Overall satisfaction',
      type: 'categorical' as const,
      sample_values: ['1', '2'],
      value_labels: { '1': 'Very satisfied', '2': 'Satisfied' },
    },
    {
      name: 'age',
      label: 'Age',
      type: 'numeric' as const,
      sample_values: ['25', '34'],
      value_labels: {},
    },
  ],
}

const sav = new File(['dummy'], 'survey.sav', { type: 'application/octet-stream' })

beforeEach(() => vi.clearAllMocks())

describe('initial state', () => {
  it('shows file upload', () => {
    render(<App />)
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('does not show column table', () => {
    render(<App />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('does not show export button', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument()
  })

  it('does not show select all / deselect all buttons', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /^select all$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /deselect all/i })).not.toBeInTheDocument()
  })
})

describe('after file selection', () => {
  it('shows loading state while api call is in progress', async () => {
    let resolve!: (v: typeof mockData) => void
    vi.mocked(api.loadFile).mockReturnValue(new Promise((r) => { resolve = r }))
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    expect(screen.getByText(/reading file/i)).toBeInTheDocument()
    resolve(mockData)
  })

  it('shows column table when file loads successfully', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() =>
      expect(screen.getByRole('table', { name: /columns/i })).toBeInTheDocument()
    )
    const table = screen.getByRole('table', { name: /columns/i })
    expect(table).toHaveTextContent('q1')
    expect(table).toHaveTextContent('age')
  })

  it('shows export button when file loads successfully', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    )
  })

  it('shows error alert when file load fails', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('parse error'))
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('hides loading state after file loads', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
  })
})

describe('defaults', () => {
  it('defaults categorical columns to labels mode', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('table', { name: /columns/i }))
    const selects = screen.getAllByRole('combobox')
    expect(selects[0]).toHaveValue('labels')
  })

  it('shows no export mode selector for numeric columns (no value_labels)', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('table', { name: /columns/i }))
    // only categorical column (q1) gets a selector; numeric (age) shows plain text
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
  })
})

describe('summary bar', () => {
  it('appears when file is loaded', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => expect(screen.getByText(/survey\.sav/)).toBeInTheDocument())
  })
})

describe('search', () => {
  it('search input appears when file is loaded', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => expect(screen.getByRole('searchbox')).toBeInTheDocument())
  })

  it('filters columns by name', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'q1')
    const table = screen.getByRole('table', { name: /columns/i })
    expect(table).toHaveTextContent('q1')
    expect(table).not.toHaveTextContent('age')
  })

  it('filters columns by label text', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'satisfaction')
    const table = screen.getByRole('table', { name: /columns/i })
    expect(table).toHaveTextContent('q1')
    expect(table).not.toHaveTextContent('age')
  })

  it('shows all columns when search is cleared', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'q1')
    await userEvent.clear(screen.getByRole('searchbox'))
    const table = screen.getByRole('table', { name: /columns/i })
    expect(table).toHaveTextContent('q1')
    expect(table).toHaveTextContent('age')
  })
})

describe('select all / deselect all', () => {
  it('buttons appear when file is loaded', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /^select all$/i }))
    expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument()
  })

  it('deselect all unchecks include checkboxes', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /deselect all/i }))
    await userEvent.click(screen.getByRole('button', { name: /deselect all/i }))
    const table = screen.getByRole('table', { name: /columns/i })
    const rows = table.querySelectorAll('tbody tr')
    rows.forEach((row) => {
      const includeCheckbox = row.querySelector('td:first-child input[type="checkbox"]') as HTMLInputElement
      expect(includeCheckbox.checked).toBe(false)
    })
  })

  it('select all rechecks include checkboxes after deselect', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /^select all$/i }))
    await userEvent.click(screen.getByRole('button', { name: /deselect all/i }))
    await userEvent.click(screen.getByRole('button', { name: /^select all$/i }))
    const table = screen.getByRole('table', { name: /columns/i })
    const rows = table.querySelectorAll('tbody tr')
    rows.forEach((row) => {
      const includeCheckbox = row.querySelector('td:first-child input[type="checkbox"]') as HTMLInputElement
      expect(includeCheckbox.checked).toBe(true)
    })
  })

  it('summary bar updates selected count after deselect all', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /deselect all/i }))
    await userEvent.click(screen.getByRole('button', { name: /deselect all/i }))
    const el = screen.getByText(/of 2 columns selected/i)
    expect(el.textContent).toMatch(/0/)
  })
})

describe('export', () => {
  it('shows error alert when export fails', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    vi.mocked(api.exportFile).mockRejectedValue(new Error('server error'))
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('calls exportFile with the file and current config when export is clicked', async () => {
    vi.mocked(api.loadFile).mockResolvedValue(mockData)
    vi.mocked(api.exportFile).mockResolvedValue(new Blob(['col\n1'], { type: 'text/csv' }))
    render(<App />)
    await userEvent.upload(screen.getByTestId('file-input'), sav)
    await waitFor(() => screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(api.exportFile).toHaveBeenCalledWith(sav, {
      columns: {
        q1: { include: true, export_mode: 'labels', use_label_as_header: false },
        age: { include: true, export_mode: 'codes', use_label_as_header: false },
      },
    })
  })
})
