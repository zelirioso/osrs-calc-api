import { defineConfig, devices } from '@playwright/test';

const BACKEND_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://127.0.0.1:5173';

export default defineConfig({
  webServer: [
    {
      command: 'uv run uvicorn app.main:app --host 127.0.0.1 --port 8000',
      url: `${BACKEND_URL}/docs`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: './frontend',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: BACKEND_URL },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: FRONTEND_URL },
    },
  ],
});
