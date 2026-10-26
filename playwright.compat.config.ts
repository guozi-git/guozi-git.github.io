import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const temp = path.resolve('.preview/tmp');
mkdirSync(temp, { recursive: true });
process.env.TEMP = process.env.TMP = temp;
export default defineConfig({
  testDir: '.',
  testMatch: 'compatibility.spec.ts',
  outputDir: '.preview/compat-results',
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: process.platform === 'win32' ? 'msedge' : undefined,
      },
    },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
