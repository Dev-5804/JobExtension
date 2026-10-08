import { test, expect, chromium, type BrowserContext } from '@playwright/test'
import path from 'node:path'

let context: BrowserContext

test.beforeEach(async () => {
  const extensionPath = path.resolve('dist')
  context = await chromium.launchPersistentContext('', {
    executablePath: '/usr/bin/google-chrome',
    headless: process.env.HEADED !== '1',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })
})

test.afterEach(async () => {
  await context.close()
})

test('loads the popup and dashboard from the built extension', async () => {
  const serviceWorker = context.serviceWorkers()[0]
  test.skip(!serviceWorker, 'MV3 extension service workers require headed Chromium in this environment. Run with HEADED=1.')
  if (!serviceWorker) return
  const extensionId = new URL(serviceWorker.url()).hostname
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/index.html`)
  await expect(popup.getByRole('heading', { name: 'Job ledger' })).toBeVisible()

  const dashboard = await context.newPage()
  await dashboard.goto(`chrome-extension://${extensionId}/dashboard.html`)
  await expect(dashboard.getByRole('heading', { name: 'Your job ledger' })).toBeVisible()
})
