import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { setupFiles: ["src/test/setup-memory-db.ts"], environment: "node", include: ["src/**/*.test.ts"] },
});
