import { extractJobDetails, type ExtractedJobDetails } from './pageExtractor'

interface ActiveTabChrome {
  tabs: { query(queryInfo: { active: boolean; lastFocusedWindow: boolean }): Promise<Array<{ id?: number }>> }
  scripting: { executeScript<T>(details: { target: { tabId: number }; func: () => T }): Promise<Array<{ result?: T }>> }
}

function browserChrome() {
  return (globalThis as typeof globalThis & { chrome?: ActiveTabChrome }).chrome
}

export async function extractFromActiveTab(): Promise<ExtractedJobDetails | null> {
  const extensionChrome = browserChrome()
  if (!extensionChrome) return null

  const [activeTab] = await extensionChrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (activeTab?.id === undefined) return null

  const [result] = await extensionChrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: extractJobDetails,
  })
  return result?.result ?? null
}