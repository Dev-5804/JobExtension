import type { ApplicationDraft, ApplicationRepository, JobApplication } from '../types/application'

const storageKey = 'job-tracker-applications'
const draftStorageKey = 'job-tracker-draft'

interface ChromeStorage {
  storage?: { local: { get(keys: string[]): Promise<Record<string, unknown>>; set(items: Record<string, unknown>): Promise<void> } }
}

function chromeStorage() {
  return (globalThis as typeof globalThis & { chrome?: ChromeStorage }).chrome?.storage?.local
}

async function readApplications() {
  const extensionStorage = chromeStorage()
  if (extensionStorage) {
    const result = await extensionStorage.get([storageKey])
    return (result[storageKey] as JobApplication[] | undefined) ?? []
  }
  const saved = localStorage.getItem(storageKey)
  return saved ? (JSON.parse(saved) as JobApplication[]) : []
}

async function writeApplications(applications: JobApplication[]) {
  const extensionStorage = chromeStorage()
  if (extensionStorage) { await extensionStorage.set({ [storageKey]: applications }); return }
  localStorage.setItem(storageKey, JSON.stringify(applications))
}

async function getDraft() {
  const extensionStorage = chromeStorage()
  if (extensionStorage) {
    const result = await extensionStorage.get([draftStorageKey])
    return (result[draftStorageKey] as ApplicationDraft | undefined) ?? null
  }

  const saved = localStorage.getItem(draftStorageKey)
  return saved ? (JSON.parse(saved) as ApplicationDraft) : null
}

async function saveDraft(draft: ApplicationDraft) {
  const extensionStorage = chromeStorage()
  if (extensionStorage) {
    await extensionStorage.set({ [draftStorageKey]: draft })
    return
  }

  localStorage.setItem(draftStorageKey, JSON.stringify(draft))
}

async function clearDraft() {
  const extensionStorage = chromeStorage()
  if (extensionStorage) {
    await extensionStorage.set({ [draftStorageKey]: null })
    return
  }

  localStorage.removeItem(draftStorageKey)
}

export const applicationRepository: ApplicationRepository = {
  getAll: readApplications,
  async create(application) { await writeApplications([application, ...(await readApplications())]); return application },
  async merge(newApplications) {
    const existing = await readApplications()
    const ids = new Set(existing.map((application) => application.id))
    const merged = [...existing, ...newApplications.filter((application) => !ids.has(application.id))]
    await writeApplications(merged)
    return merged
  },
  async replaceAll(applications) {
    await writeApplications(applications)
  },
  async clearAll() {
    await writeApplications([])
    await clearDraft()
  },
  async update(id, changes) {
    const applications = await readApplications()
    const index = applications.findIndex((application) => application.id === id)
    if (index === -1) return null
    const updatedApplication = { ...applications[index], ...changes, updatedAt: new Date().toISOString() }
    applications[index] = updatedApplication
    await writeApplications(applications)
    return updatedApplication
  },
  async delete(id) {
    const applications = await readApplications()
    await writeApplications(applications.filter((application) => application.id !== id))
  },
  getDraft,
  saveDraft,
  clearDraft,
}