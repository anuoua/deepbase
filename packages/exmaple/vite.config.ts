import { defineConfig } from "vite";
import { agent } from "@deepbase/agent/vite-plugin";

export default defineConfig({
  plugins: [agent()],
});
