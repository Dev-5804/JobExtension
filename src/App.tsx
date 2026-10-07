import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import type { ApplicationDraft, ApplicationStatus, JobApplication } from './types/application'
import { applicationRepository } from './storage/repository'
import { extractFromActiveTab } from './extraction/activeTab'

const statuses: ApplicationStatus[] = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']
const emptyForm = { company: '', jobTitle: '', url: '', location: '', platform: '', status: 'applied' as ApplicationStatus }

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function App() {
  const [form, setForm] = useState(emptyForm)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([applicationRepository.getAll(), applicationRepository.getDraft()]).then(async ([storedApplications, draft]) => {
      setApplications(storedApplications)
      if (draft) {
        setForm(draft)
      } else {
        await fillFromCurrentPage(false)
      }
      setIsLoading(false)
    })
  }, [])

  async function fillFromCurrentPage(showMessage = true) {
    setIsExtracting(true)
    try {
      const details = await extractFromActiveTab()
      if (!details || Object.values(details).every((value) => !value)) {
        if (showMessage) setMessage('No job details were detected on this page.')
        return
      }
      updateForm({ ...emptyForm, ...details })
      if (showMessage) setMessage('Job details detected from this page.')
    } catch {
      if (showMessage) setMessage('This page cannot be read. You can enter the details manually.')
    } finally {
      setIsExtracting(false)
    }
  }

  function updateForm(nextForm: ApplicationDraft) {
    setForm(nextForm)
    void applicationRepository.saveDraft(nextForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const now = new Date().toISOString()
    const application = await applicationRepository.create({
      id: crypto.randomUUID(), ...form,
      dateApplied: form.status === 'applied' ? now : undefined,
      createdAt: now, updatedAt: now,
    })
    setApplications((current) => [application, ...current])
    setForm(emptyForm)
    await applicationRepository.clearDraft()
    setMessage('Application saved locally.')
  }

  const activeCount = applications.filter(({ status }) => !['rejected', 'withdrawn'].includes(status)).length

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">PRIVATE BY DEFAULT</p><h1>Job ledger</h1></div>
        <div className="stats" aria-label="Application summary"><strong>{applications.length}</strong><span>tracked</span><strong>{activeCount}</strong><span>active</span></div>
      </header>
      <section className="intro"><p>Keep your search in one calm, local place.</p><span>Nothing leaves this browser.</span></section>
      <form className="application-form" onSubmit={handleSubmit}>
        <div className="form-heading"><div><p className="eyebrow">NEW ENTRY</p><h2>Track an application</h2></div><button className="refresh-button" type="button" onClick={() => void fillFromCurrentPage()} disabled={isExtracting}>{isExtracting ? 'Reading page...' : '↻ Fill from page'}</button></div>
        {message && <p className="success-message" role="status">{message}</p>}
        <div className="field-grid">
          <label>Company<input required value={form.company} onChange={(event) => updateForm({ ...form, company: event.target.value })} placeholder="e.g. Razorpay" /></label>
          <label>Job title<input required value={form.jobTitle} onChange={(event) => updateForm({ ...form, jobTitle: event.target.value })} placeholder="e.g. Frontend Developer" /></label>
          <label className="wide-field">Job URL<input required type="url" value={form.url} onChange={(event) => updateForm({ ...form, url: event.target.value })} placeholder="https://..." /></label>
          <label>Location<input value={form.location} onChange={(event) => updateForm({ ...form, location: event.target.value })} placeholder="Remote or city" /></label>
          <label>Platform<input value={form.platform} onChange={(event) => updateForm({ ...form, platform: event.target.value })} placeholder="LinkedIn, company site..." /></label>
          <label>Status<select value={form.status} onChange={(event) => updateForm({ ...form, status: event.target.value as ApplicationStatus })}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label>
        </div>
        <button className="primary-button" type="submit">Save application <span aria-hidden="true">↗</span></button>
      </form>
      <section className="recent-section" aria-labelledby="recent-heading">
        <div className="section-heading"><div><p className="eyebrow">LOCAL ARCHIVE</p><h2 id="recent-heading">Recent applications</h2></div><span>{isLoading ? 'Loading...' : `${applications.length} total`}</span></div>
        {!isLoading && applications.length === 0 && <p className="empty-state">Your saved applications will appear here.</p>}
        <div className="application-list">{applications.slice(0, 5).map((application) => <article className="application-row" key={application.id}><div><h3>{application.jobTitle}</h3><p>{application.company}{application.location ? ` · ${application.location}` : ''}</p></div><span className={`status status-${application.status}`}>{formatStatus(application.status)}</span></article>)}</div>
      </section>
    </main>
  )
}

export default App
