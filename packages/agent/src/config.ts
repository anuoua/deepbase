const env = process.env;

export const config = {
  mode: env.MODE,
  isDev: env.MODE === "development",
  isProd: env.MODE === "production",
  hasSwaggerDoc: env.SWAGGER_DOC === "true",
};
