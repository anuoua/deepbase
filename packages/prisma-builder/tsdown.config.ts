import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/ProForm/index.ts", "./src/ProSelect/index.ts"],
  tsconfig: "./tsconfig.build.json",
});
