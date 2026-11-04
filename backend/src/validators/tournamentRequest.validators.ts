import { z } from "zod";
import { REQUEST_STATUSES } from "../types/enums.js";
import { paginationSchema } from "./common.validators.js";

// Limits match the TournamentRequest schema (name 100, description 2000, response 1000).
// z.object() drops unknown keys, so a client-supplied user_id / status never reaches the controller.
export const createTournamentRequestSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
});

export const myRequestsQuerySchema = paginationSchema(10, 50);

export const ownerRequestsQuerySchema = paginationSchema(10, 50).extend({
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(REQUEST_STATUSES).optional()),
});

export const decisionBodySchema = z.object({
  decision: z.enum(["accept", "reject"], { message: "Decision must be accept or reject" }),
  response: z
    .string()
    .trim()
    .max(1000, "Response must be at most 1000 characters")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type CreateTournamentRequestBody = z.infer<typeof createTournamentRequestSchema>;
export type MyRequestsQuery = z.infer<typeof myRequestsQuerySchema>;
export type OwnerRequestsQuery = z.infer<typeof ownerRequestsQuerySchema>;
export type DecisionBody = z.infer<typeof decisionBodySchema>;
