import type { ApplicationDraft } from '../types/application'

export type ExtractedJobDetails = Partial<Pick<ApplicationDraft, 'company' | 'jobTitle' | 'url' | 'location' | 'platform'>>

export function extractJobDetails(): ExtractedJobDetails {
  const textContent = (selector: string) => document.querySelector(selector)?.textContent?.trim() ?? ''
  const metaContent = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content?.trim() ?? ''
  const firstNonEmpty = (...values: string[]) => values.find(Boolean) ?? ''
  const hostname = location.hostname.toLowerCase()
  const platform = hostname.includes('linkedin')
    ? 'LinkedIn'
    : hostname.includes('naukri')
      ? 'Naukri'
      : hostname.includes('indeed')
        ? 'Indeed'
        : hostname.includes('wellfound')
          ? 'Wellfound'
          : ''
  const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href
  let structuredData: Record<string, unknown> = {}

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(script.textContent ?? '') as Record<string, unknown> | Record<string, unknown>[]
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed['@graph'])
          ? parsed['@graph'] as Record<string, unknown>[]
          : [parsed]
      const jobPosting = entries.find((entry) => {
        const type = entry['@type']
        return type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))
      })
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
    platform,
  }
}