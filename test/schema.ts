import { z } from "zod";

export const schema = z.object({
  name: z.string(),
  age: z.number(),
  age2: z.string().email(),
});

export default schema;
