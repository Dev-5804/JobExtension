export type ApplicationStatus = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'

export interface JobApplication {
  id: string
  company: string
  jobTitle: string
  url: string
  platform?: string
  location?: string
  notes?: string
  deadline?: string
  interviewDate?: string
  status: ApplicationStatus
  dateApplied?: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationRepository {
  getAll(): Promise<JobApplication[]>
  create(application: JobApplication): Promise<JobApplication>
  merge(applications: JobApplication[]): Promise<JobApplication[]>
  replaceAll(applications: JobApplication[]): Promise<void>
  clearAll(): Promise<void>
  update(id: string, changes: Partial<JobApplication>): Promise<JobApplication | null>
  delete(id: string): Promise<void>
  getDraft(): Promise<ApplicationDraft | null>
  saveDraft(draft: ApplicationDraft): Promise<void>
  clearDraft(): Promise<void>
}

export interface ExportData {
  version: 1
  exportedAt: string
  applications: JobApplication[]
}

export interface ApplicationDraft {
  company: string
  jobTitle: string
  url: string
  location: string
  platform: string
  notes: string
  deadline: string
  interviewDate: string
  status: ApplicationStatus
}