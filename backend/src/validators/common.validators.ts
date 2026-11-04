import { z } from "zod";

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id"),
});

// ?page=1&limit=10
export function paginationSchema(defaultLimit: number, maxLimit: number) {
  return z.object({
    page: z.coerce.number().int().min(1, "page must be at least 1").default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit, `limit must be at most ${maxLimit}`).default(defaultLimit),
  });
}

export type ObjectIdParams = z.infer<typeof objectIdParamSchema>;
