import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/__agent",
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name].js",
        },
      },
    },
    server: {
      proxy: {
        "/opencode-api/": {
          target: env.OPENCODE_SERVER,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opencode-api/, ""),
        },
      },
    },
  };
});
