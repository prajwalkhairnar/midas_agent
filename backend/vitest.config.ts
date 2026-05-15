import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NODE_ENV: 'test',
      USE_MOCK_LLM: 'true',
      USE_MOCK_DB: 'true',
      USE_MOCK_FETCH: 'true',
    },
  },
})
