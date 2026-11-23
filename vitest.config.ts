import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(
        new URL('./tests/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    // `.tsx` included in TASK-022: component tests were silently skipped.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
