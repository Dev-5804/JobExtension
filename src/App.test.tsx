// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('popup application form', () => {
  it('saves a completed application locally', async () => {
    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Razorpay'), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Frontend Developer'), { target: { value: 'Product Designer' } })
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: 'https://acme.example/jobs/designer' } })
    fireEvent.click(screen.getByRole('button', { name: /save application/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Application saved locally.'))
    expect(screen.getByText('Product Designer')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('job-tracker-applications') ?? '[]')).toHaveLength(1)
  })
})
