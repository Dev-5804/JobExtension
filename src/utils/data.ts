import type { ApplicationStatus, ExportData, JobApplication } from '../types/application'

export const applicationStatuses: ApplicationStatus[] = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']

export function normalizeUrl(value: string) {
  try {
    const url = new URL(value)
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || ['fbclid', 'gclid', 'ref', 'referrer'].includes(key.toLowerCase())) url.searchParams.delete(key)
    }
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.toString()
  } catch {
    return value.trim().replace(/\/+$/, '')
  }
}

export function findDuplicate(application: Pick<JobApplication, 'url' | 'company' | 'jobTitle'>, applications: JobApplication[]) {
  const normalizedUrl = normalizeUrl(application.url)
  return applications.find((existing) => normalizeUrl(existing.url) === normalizedUrl || (
    existing.company.trim().toLowerCase() === application.company.trim().toLowerCase() &&
    existing.jobTitle.trim().toLowerCase() === application.jobTitle.trim().toLowerCase()
  ))
}

function isValidDate(value: string | undefined) {
  return value === undefined || (!Number.isNaN(Date.parse(value)) && value.length <= 40)
}

export function isValidApplication(value: unknown): value is JobApplication {
  if (!value || typeof value !== 'object') return false
  const application = value as Partial<JobApplication>
  return typeof application.id === 'string' && application.id.length <= 120 &&
    typeof application.company === 'string' && application.company.length > 0 && application.company.length <= 300 &&
    typeof application.jobTitle === 'string' && application.jobTitle.length > 0 && application.jobTitle.length <= 500 &&
    typeof application.url === 'string' && application.url.length > 0 && application.url.length <= 2000 &&
    (application.notes === undefined || (typeof application.notes === 'string' && application.notes.length <= 5000)) &&
    (application.deadline === undefined || (typeof application.deadline === 'string' && isValidDate(application.deadline))) &&
    (application.interviewDate === undefined || (typeof application.interviewDate === 'string' && isValidDate(application.interviewDate))) &&
    typeof application.status === 'string' && applicationStatuses.includes(application.status) &&
    typeof application.createdAt === 'string' && isValidDate(application.createdAt) &&
    typeof application.updatedAt === 'string' && isValidDate(application.updatedAt) &&
    isValidDate(application.dateApplied)
}

export function parseExportData(value: unknown): ExportData {
  if (!value || typeof value !== 'object') throw new Error('Backup must be a JSON object.')
  const data = value as Partial<ExportData>
  if (data.version !== 1) throw new Error('This backup version is not supported.')
  if (!Array.isArray(data.applications) || !data.applications.every(isValidApplication)) throw new Error('Backup contains invalid application records.')
  return { version: 1, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(), applications: data.applications }
}