import type { ApplicationDraft } from '../types/application'

export type ExtractedJobDetails = Partial<Pick<ApplicationDraft, 'company' | 'jobTitle' | 'url' | 'location' | 'platform'>>

export function extractJobDetails(): ExtractedJobDetails {
  const textContent = (selector: string) => document.querySelector(selector)?.textContent?.trim() ?? ''
  const metaContent = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content?.trim() ?? ''
  const textFromSelectors = (selectors: string[]) => selectors.map((selector) => textContent(selector)).find(Boolean) ?? ''
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
  const platformSelectors = hostname.includes('linkedin')
    ? {
        company: ['.job-details-jobs-unified-top-card__company-name', '.topcard__org-name-link', '[data-testid="job-details-company-name"]'],
        jobTitle: ['.job-details-jobs-unified-top-card__job-title', '.top-card-layout__title', 'h1'],
        location: ['.job-details-jobs-unified-top-card__bullet', '.topcard__flavor--bullet'],
      }
    : hostname.includes('naukri')
      ? {
          company: ['.jd-header-comp-name', '.jd-header-comp-name a', '[class*="comp-name"]'],
          jobTitle: ['.jd-header-title', 'h1'],
          location: ['.locWdth', '[class*="location"]'],
        }
      : hostname.includes('indeed')
        ? {
            company: ['[data-testid="inlineHeader-companyName"]', '[data-testid="company-name"]'],
            jobTitle: ['[data-testid="jobsearch-JobInfoHeader-title"]', 'h1'],
            location: ['[data-testid="job-location"]', '[data-testid="inlineHeader-companyLocation"]'],
          }
        : hostname.includes('wellfound')
          ? {
              company: ['[data-test="StartupName"]', '[data-testid="company-name"]'],
              jobTitle: ['h1', '[data-testid="job-title"]'],
              location: ['[data-testid="job-location"]', '[class*="location"]'],
            }
          : {
              company: ['[itemprop="hiringOrganization"]', '[class*="company-name"]', '[class*="companyName"]'],
              jobTitle: ['[itemprop="title"]', 'h1', '[class*="job-title"]', '[class*="jobTitle"]'],
              location: ['[itemprop="jobLocation"]', '[class*="location"]', '[data-testid*="location"]'],
            }
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
  const jobLocationValue = structuredData.jobLocation
  const jobLocation = (Array.isArray(jobLocationValue) ? jobLocationValue[0] : jobLocationValue) as Record<string, unknown> | undefined
  const address = jobLocation?.address as Record<string, unknown> | undefined
  const structuredLocation = [address?.addressLocality, address?.addressRegion, address?.addressCountry]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .join(', ')

  return {
    company: firstNonEmpty(
      typeof organization?.name === 'string' ? organization.name : '',
      textFromSelectors(platformSelectors.company ? platformSelectors.company : []),
      metaContent('meta[property="og:site_name"]'),
      metaContent('meta[name="author"]'),
    ),
    jobTitle: firstNonEmpty(
      typeof structuredData.title === 'string' ? structuredData.title : '',
      textFromSelectors(platformSelectors.jobTitle),
      metaContent('meta[property="og:title"]'),
      textContent('h1'),
      document.title,
    ),
    url: canonicalUrl,
    location: firstNonEmpty(
      structuredLocation,
      typeof jobLocation?.name === 'string' ? jobLocation.name : '',
      textFromSelectors(platformSelectors.location),
      metaContent('meta[name="location"]'),
      textContent('[class*="location"], [data-testid*="location"]'),
    ),
    platform,
  }
}