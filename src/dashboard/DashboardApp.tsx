import { useEffect, useMemo, useState } from 'react'
import type { ApplicationStatus, JobApplication } from '../types/application'
import { applicationRepository } from '../storage/repository'

const statuses: ApplicationStatus[] = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']
type SortOption = 'newest' | 'oldest' | 'company' | 'status'

type EditValues = Pick<JobApplication, 'company' | 'jobTitle' | 'url' | 'location' | 'platform' | 'status'>

function formatStatus(status: ApplicationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(date?: string) {
  if (!date) return 'Not set'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function matchesSearch(application: JobApplication, search: string) {
  const searchable = [application.company, application.jobTitle, application.url, application.location, application.platform].join(' ').toLowerCase()
  return searchable.includes(search.toLowerCase())
}

function DashboardApp() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditValues | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    applicationRepository.getAll().then(setApplications)
  }, [])

  const platforms = useMemo(() => [...new Set(applications.map(({ platform }) => platform).filter(Boolean))].sort(), [applications])
  const visibleApplications = useMemo(() => applications
    .filter((application) => statusFilter === 'all' || application.status === statusFilter)
    .filter((application) => platformFilter === 'all' || application.platform === platformFilter)
    .filter((application) => matchesSearch(application, search))
    .sort((a, b) => {
      if (sort === 'company') return a.company.localeCompare(b.company)
      if (sort === 'status') return a.status.localeCompare(b.status)
      const first = new Date(a.dateApplied ?? a.createdAt).getTime()
      const second = new Date(b.dateApplied ?? b.createdAt).getTime()
      return sort === 'newest' ? second - first : first - second
    }), [applications, platformFilter, search, sort, statusFilter])

  const activeCount = applications.filter(({ status }) => !['rejected', 'withdrawn'].includes(status)).length
  const interviewCount = applications.filter(({ status }) => status === 'interview').length
  const offerCount = applications.filter(({ status }) => status === 'offer').length

  async function changeStatus(id: string, status: ApplicationStatus) {
    const updated = await applicationRepository.update(id, { status })
    if (updated) setApplications((current) => current.map((application) => application.id === id ? updated : application))
  }

  function startEditing(application: JobApplication) {
    setEditingId(application.id)
    setEditValues({ company: application.company, jobTitle: application.jobTitle, url: application.url, location: application.location ?? '', platform: application.platform ?? '', status: application.status })
    setMessage('')
  }

  async function saveEdit(id: string) {
    if (!editValues || !editValues.company.trim() || !editValues.jobTitle.trim() || !editValues.url.trim()) {
      setMessage('Company, job title, and URL are required.')
      return
    }
    const updated = await applicationRepository.update(id, editValues)
    if (updated) {
      setApplications((current) => current.map((application) => application.id === id ? updated : application))
      setEditingId(null)
      setEditValues(null)
      setMessage('Application updated locally.')
    }
  }

  async function deleteApplication(application: JobApplication) {
    if (!window.confirm(`Delete ${application.jobTitle} at ${application.company}?`)) return
    await applicationRepository.delete(application.id)
    setApplications((current) => current.filter(({ id }) => id !== application.id))
    setMessage('Application deleted.')
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header">
      <div><p className="eyebrow">LOCAL ARCHIVE / DASHBOARD</p><h1>Your job ledger</h1><p className="subheading">A clear view of every application, stored only in this browser.</p></div>
      <a className="back-link" href="index.html">← Quick add</a>
    </header>

    <section className="metric-grid" aria-label="Application statistics">
      <div><span>Total applications</span><strong>{applications.length}</strong></div>
      <div><span>Active search</span><strong>{activeCount}</strong></div>
      <div><span>Interviews</span><strong>{interviewCount}</strong></div>
      <div><span>Offers</span><strong>{offerCount}</strong></div>
    </section>

    <section className="toolbar" aria-label="Application controls">
      <label className="search-field">Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Company, role, location..." /></label>
      <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ApplicationStatus)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label>
      <label>Platform<select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}><option value="all">All platforms</option>{platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="company">Company A-Z</option><option value="status">Status</option></select></label>
    </section>

    {message && <p className="dashboard-message" role="status">{message}</p>}
    <section className="table-section" aria-labelledby="applications-heading">
      <div className="table-heading"><div><p className="eyebrow">APPLICATIONS</p><h2 id="applications-heading">{visibleApplications.length} result{visibleApplications.length === 1 ? '' : 's'}</h2></div></div>
      {visibleApplications.length === 0 ? <div className="empty-dashboard"><span className="empty-mark" aria-hidden="true">＋</span><h3>No applications here yet</h3><p>Track a job from the popup and it will appear in your local archive.</p><a href="index.html">Add your first application →</a></div> : <div className="table-wrap"><table><thead><tr><th>Company / role</th><th>Platform</th><th>Applied</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleApplications.map((application) => {
        const isEditing = editingId === application.id && editValues
        return <tr key={application.id}>{isEditing ? <td colSpan={5}><div className="edit-grid">
          <label>Company<input value={editValues.company} onChange={(event) => setEditValues({ ...editValues, company: event.target.value })} /></label>
          <label>Job title<input value={editValues.jobTitle} onChange={(event) => setEditValues({ ...editValues, jobTitle: event.target.value })} /></label>
          <label>URL<input type="url" value={editValues.url} onChange={(event) => setEditValues({ ...editValues, url: event.target.value })} /></label>
          <label>Location<input value={editValues.location} onChange={(event) => setEditValues({ ...editValues, location: event.target.value })} /></label>
          <label>Platform<input value={editValues.platform} onChange={(event) => setEditValues({ ...editValues, platform: event.target.value })} /></label>
          <label>Status<select value={editValues.status} onChange={(event) => setEditValues({ ...editValues, status: event.target.value as ApplicationStatus })}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label>
        </div><div className="edit-actions"><button className="action-button action-primary" type="button" onClick={() => void saveEdit(application.id)}>Save changes</button><button className="action-button" type="button" onClick={() => { setEditingId(null); setEditValues(null) }}>Cancel</button></div></td> : <><td><strong>{application.company}</strong><span>{application.jobTitle}{application.location ? ` · ${application.location}` : ''}</span></td><td>{application.platform || 'Other'}</td><td>{formatDate(application.dateApplied ?? application.createdAt)}</td><td><select className={`status-select status-${application.status}`} value={application.status} aria-label={`Status for ${application.jobTitle}`} onChange={(event) => void changeStatus(application.id, event.target.value as ApplicationStatus)}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></td><td className="row-actions"><a href={application.url} target="_blank" rel="noreferrer" aria-label={`Open ${application.jobTitle}`}>↗</a><button type="button" onClick={() => startEditing(application)} aria-label={`Edit ${application.jobTitle}`}>Edit</button><button type="button" onClick={() => void deleteApplication(application)} aria-label={`Delete ${application.jobTitle}`}>Delete</button></td></>}</tr>
      })}</tbody></table></div>}
    </section>
  </main>
}

export default DashboardApp
