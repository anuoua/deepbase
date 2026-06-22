import { createServer as createViteServer } from "vite";

export const { middlewares } = await createViteServer({
  server: { middlewareMode: true },
  // don't include Vite's default HTML handling middlewares
  appType: "spa",
});
