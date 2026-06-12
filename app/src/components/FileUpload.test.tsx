import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileUpload } from './FileUpload'

describe('FileUpload', () => {
  it('renders a file input that accepts .sav files', () => {
    render(<FileUpload onFile={vi.fn()} />)
    const input = screen.getByTestId('file-input')
    expect(input).toHaveAttribute('accept', '.sav')
  })

  it('calls onFile with the selected file', async () => {
    const onFile = vi.fn()
    render(<FileUpload onFile={onFile} />)
    const file = new File(['dummy'], 'survey.sav', { type: 'application/octet-stream' })
    const input = screen.getByTestId('file-input')
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('shows a prompt to drop or browse for a file', () => {
    render(<FileUpload onFile={vi.fn()} />)
    expect(screen.getByText(/\.sav/i)).toBeInTheDocument()
  })
})
