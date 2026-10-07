// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import DashboardApp from './DashboardApp'
import type { JobApplication } from '../types/application'

const application: JobApplication = {
  id: 'job-1',
  company: 'Acme',
  jobTitle: 'Product Designer',
  url: 'https://acme.example/jobs/designer',
  platform: 'LinkedIn',
  location: 'Remote',
  status: 'applied',
  dateApplied: '2026-10-07T10:00:00.000Z',
  createdAt: '2026-10-07T10:00:00.000Z',
  updatedAt: '2026-10-07T10:00:00.000Z',
}

beforeEach(() => {
  localStorage.setItem('job-tracker-applications', JSON.stringify([application]))
})

describe('dashboard application management', () => {
  it('edits an existing application and persists the change', async () => {
    render(<DashboardApp />)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Product Designer' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Edit Product Designer' }))
    fireEvent.change(screen.getByDisplayValue('Product Designer'), { target: { value: 'Senior Product Designer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.getByText(/Senior Product Designer/)).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem('job-tracker-applications') ?? '[]')[0].jobTitle).toBe('Senior Product Designer')
  })
})
