import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: '**/*.e2e.ts',
  timeout: 30000,
  workers: 1,
})
