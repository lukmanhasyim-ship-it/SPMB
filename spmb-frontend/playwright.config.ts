import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      // Tes drawer/target sentuh hanya bermakna pada viewport mobile; pada
      // desktop drawernya memang tersembunyi (lihat AppShell & ResponsiveHeader).
      testIgnore: /mobile-smoke\.spec\.ts$/,
    },
    {
      // Pixel 5 = 393x851 @ ~2.6 DPR. Dipakai untuk menguji target sentuh,
      // drawer, bottom sheet, dan absence of horizontal overflow.
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        // 375x812 = lebar iPhone SE / kelas smallest common phone.
        viewport: { width: 375, height: 812 },
      },
      testMatch: /(auth|route-guard|mobile-smoke)\.spec\.ts$/,
    },
  ],
})
