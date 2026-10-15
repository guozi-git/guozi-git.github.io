import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const tempDirectory = path.resolve('.preview/tmp');
mkdirSync(tempDirectory, { recursive: true });
process.env.TEMP = tempDirectory;
process.env.TMP = tempDirectory;

export default defineConfig({
  testDir: '.',
  testMatch: ['orbit.spec.ts', 'engineering.spec.ts'],
  outputDir: '.preview/test-results',
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    channel: process.env.BROWSER_CHANNEL === 'chromium' ? undefined : 'msedge',
    viewport: { width: 1440, height: 1000 },
  },
});
