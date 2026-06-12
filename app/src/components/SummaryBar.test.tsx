import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryBar } from './SummaryBar'

describe('SummaryBar', () => {
  it('renders the filename', () => {
    render(<SummaryBar filename="survey.sav" rowCount={100} selectedCount={5} totalCount={10} />)
    expect(screen.getByText(/survey\.sav/)).toBeInTheDocument()
  })

  it('renders the row count', () => {
    render(<SummaryBar filename="survey.sav" rowCount={1204} selectedCount={5} totalCount={10} />)
    const rowEl = screen.getByText(/rows/i)
    expect(rowEl).toBeInTheDocument()
    expect(rowEl.textContent).toMatch(/1.?204/)
  })

  it('renders selected of total columns', () => {
    render(<SummaryBar filename="survey.sav" rowCount={100} selectedCount={3} totalCount={7} />)
    const el = screen.getByText(/of 7 columns selected/i)
    expect(el.textContent).toMatch(/3/)
  })

  it('updates when props change', () => {
    const { rerender } = render(
      <SummaryBar filename="survey.sav" rowCount={100} selectedCount={3} totalCount={7} />
    )
    rerender(<SummaryBar filename="survey.sav" rowCount={100} selectedCount={6} totalCount={7} />)
    const el = screen.getByText(/of 7 columns selected/i)
    expect(el.textContent).toMatch(/6/)
  })
})
