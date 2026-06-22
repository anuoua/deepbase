import "dotenv/config";
import express from "express";
import { app } from "./app.ts";
import { logger } from "./lib/logger.ts";

const standalongApp = express();

standalongApp.use("/__agent", app);

standalongApp.listen(3000, (error) => {
  if (error) {
    logger.error(error);
  } else {
    logger.info("Server listening on port http://localhost:3000/__agent/");
  }
});
