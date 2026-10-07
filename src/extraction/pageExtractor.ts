import type { ApplicationDraft } from '../types/application'

export type ExtractedJobDetails = Partial<Pick<ApplicationDraft, 'company' | 'jobTitle' | 'url' | 'location' | 'platform'>>

function textContent(selector: string) {
  return document.querySelector(selector)?.textContent?.trim() ?? ''
}

function metaContent(selector: string) {
  return document.querySelector<HTMLMetaElement>(selector)?.content?.trim() ?? ''
}

function firstNonEmpty(...values: string[]) {
  return values.find(Boolean) ?? ''
}

function platformFromHostname(hostname: string) {
  if (hostname.includes('linkedin')) return 'LinkedIn'
  if (hostname.includes('naukri')) return 'Naukri'
  if (hostname.includes('indeed')) return 'Indeed'
  if (hostname.includes('wellfound')) return 'Wellfound'
  return ''
}

export function extractJobDetails(): ExtractedJobDetails {
  const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href
  const hostname = location.hostname.toLowerCase()
  let structuredData: Record<string, unknown> = {}

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent ?? '') as Record<string, unknown> | Record<string, unknown>[]
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      const jobPosting = entries.find((entry) => entry['@type'] === 'JobPosting')
      if (jobPosting) {
        structuredData = jobPosting
        break
      }
    } catch {
      // Ignore invalid structured data and continue with visible page metadata.
    }
  }

  const organization = structuredData.hiringOrganization as Record<string, unknown> | undefined
  const jobLocation = structuredData.jobLocation as Record<string, unknown> | undefined
  const address = jobLocation?.address as Record<string, unknown> | undefined
  const structuredLocation = [address?.addressLocality, address?.addressRegion, address?.addressCountry]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .join(', ')

  return {
    company: firstNonEmpty(
      typeof organization?.name === 'string' ? organization.name : '',
      metaContent('meta[property="og:site_name"]'),
      metaContent('meta[name="author"]'),
    ),
    jobTitle: firstNonEmpty(
      typeof structuredData.title === 'string' ? structuredData.title : '',
      metaContent('meta[property="og:title"]'),
      textContent('h1'),
      document.title,
    ),
    url: canonicalUrl,
    location: firstNonEmpty(
      structuredLocation,
      typeof jobLocation?.name === 'string' ? jobLocation.name : '',
      metaContent('meta[name="location"]'),
      textContent('[class*="location"], [data-testid*="location"]'),
    ),
    platform: platformFromHostname(hostname),
  }
}