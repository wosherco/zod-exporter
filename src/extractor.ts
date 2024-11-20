import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// Function to extract routes from a TRPC router.
export function exportZodSchema(schema: z.ZodTypeAny) {
  return zodToJsonSchema(schema);
}
