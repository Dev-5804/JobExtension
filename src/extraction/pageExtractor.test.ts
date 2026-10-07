// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractJobDetails } from './pageExtractor'

function setPage(markup: string, hostname = 'example.com') {
  document.head.innerHTML = ''
  document.body.innerHTML = markup
  vi.stubGlobal('location', { hostname, href: `https://${hostname}/jobs/test` })
}

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('extractJobDetails', () => {
  it('uses LinkedIn-specific selectors', () => {
    setPage(`
      <h1 class="job-details-jobs-unified-top-card__job-title">Senior Frontend Engineer</h1>
      <a class="job-details-jobs-unified-top-card__company-name">Razorpay</a>
      <span class="job-details-jobs-unified-top-card__bullet">Bengaluru, India</span>
    `, 'www.linkedin.com')

    expect(extractJobDetails()).toMatchObject({
      company: 'Razorpay',
      jobTitle: 'Senior Frontend Engineer',
      location: 'Bengaluru, India',
      platform: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/test',
    })
  })

  it('reads JobPosting data from a JSON-LD graph', () => {
    setPage('<h1>Fallback title</h1>')
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({ '@graph': [{ '@type': 'JobPosting', title: 'Platform Engineer', hiringOrganization: { name: 'Acme' }, jobLocation: { address: { addressLocality: 'Pune', addressCountry: 'India' } } }] })
    document.head.append(script)

    expect(extractJobDetails()).toMatchObject({ company: 'Acme', jobTitle: 'Platform Engineer', location: 'Pune, India' })
  })

  it('falls back to OpenGraph metadata and visible headings', () => {
    setPage('<h1>Product Designer</h1>')
    const siteName = document.createElement('meta')
    siteName.setAttribute('property', 'og:site_name')
    siteName.content = 'Acme Careers'
    document.head.append(siteName)

    expect(extractJobDetails()).toMatchObject({ company: 'Acme Careers', jobTitle: 'Product Designer' })
  })
})
