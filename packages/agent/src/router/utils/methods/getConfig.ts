import z from "zod";
import { procedure } from "../procedure.ts";

const input = z
  .object({
    name: z.string().optional(),
  })
  .optional();

const output = z.object({
  code: z.number(),
  data: z
    .object({
      name: z.string(),
      age: z.number(),
    })
    .optional(),
  message: z.string().optional(),
});

export const getConfig = procedure
  .meta({
    openapi: {
      summary: "获取配置信息",
      method: "GET",
      path: "/utils/get-config",
      tags: ["utils"],
    },
  })
  .input(input)
  .output(output)
  .query(async ({ ctx, input }) => {
    return {
      code: 0,
      message: "sucess",
    };
  });
