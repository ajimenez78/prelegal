import { defineConfig } from "vitest/config";

// Resolve the "@/" alias from tsconfig.json, as Next does.
export default defineConfig({
  resolve: { tsconfigPaths: true },
});
