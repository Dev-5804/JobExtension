export type ApplicationStatus = 'saved' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'

export interface JobApplication {
  id: string
  company: string
  jobTitle: string
  url: string
  platform?: string
  location?: string
  status: ApplicationStatus
  dateApplied?: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationRepository {
  getAll(): Promise<JobApplication[]>
  create(application: JobApplication): Promise<JobApplication>
  update(id: string, changes: Partial<JobApplication>): Promise<JobApplication | null>
  delete(id: string): Promise<void>
  getDraft(): Promise<ApplicationDraft | null>
  saveDraft(draft: ApplicationDraft): Promise<void>
  clearDraft(): Promise<void>
}

export interface ApplicationDraft {
  company: string
  jobTitle: string
  url: string
  location: string
  platform: string
  status: ApplicationStatus
}