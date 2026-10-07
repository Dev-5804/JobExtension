import { describe, expect, it } from 'vitest'
import type { JobApplication } from '../types/application'
import { findDuplicate, normalizeUrl, parseExportData } from './data'

const application: JobApplication = {
  id: 'job-1',
  company: 'Razorpay',
  jobTitle: 'Frontend Developer',
  url: 'https://example.com/jobs/frontend',
  platform: 'LinkedIn',
  location: 'Remote',
  status: 'applied',
  dateApplied: '2026-10-07T10:00:00.000Z',
  createdAt: '2026-10-07T10:00:00.000Z',
  updatedAt: '2026-10-07T10:00:00.000Z',
}

describe('normalizeUrl', () => {
  it('removes tracking parameters, fragments, and trailing slashes', () => {
    expect(normalizeUrl('https://example.com/jobs/frontend/?utm_source=linkedin&ref=feed#details')).toBe('https://example.com/jobs/frontend')
  })

  it('keeps meaningful query parameters', () => {
    expect(normalizeUrl('https://example.com/jobs?id=42&utm_medium=social')).toBe('https://example.com/jobs?id=42')
  })
})

describe('findDuplicate', () => {
  it('matches applications with equivalent normalized URLs', () => {
    expect(findDuplicate({ ...application, url: `${application.url}?utm_source=feed#overview` }, [application])).toEqual(application)
  })

  it('matches the same company and job title when URLs differ', () => {
    expect(findDuplicate({ ...application, url: 'https://different.example/job' }, [application])).toEqual(application)
  })

  it('returns no match for a different application', () => {
    expect(findDuplicate({ company: 'Acme', jobTitle: 'Designer', url: 'https://acme.example/job' }, [application])).toBeUndefined()
  })
})

describe('parseExportData', () => {
  it('accepts a version one backup', () => {
    expect(parseExportData({ version: 1, exportedAt: application.createdAt, applications: [application] })).toMatchObject({ version: 1, applications: [application] })
  })

  it('rejects unsupported versions', () => {
    expect(() => parseExportData({ version: 2, applications: [] })).toThrow('not supported')
  })

  it('rejects malformed application records', () => {
    expect(() => parseExportData({ version: 1, applications: [{ id: 'bad', status: 'unknown' }] })).toThrow('invalid application records')
  })
})
