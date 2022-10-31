import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  platform: "neutral",
  format: "esm",
  splitting: false,
  sourcemap: true,
  clean: true,
});
