import { z } from "zod";
import { TOURNAMENT_STATUSES, VISIBILITIES } from "../types/enums.js";
import { paginationSchema } from "./common.validators.js";

export const myTournamentsQuerySchema = paginationSchema(20, 50);

// A date sent as an ISO string. null clears the date.
const dateField = z.union([
  z.null(),
  z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date and time")
    .transform((v) => new Date(v)),
]);

const int = (label: string, min: number, max: number) =>
  z
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

// .strict(): unknown keys (slug, organizer_id, status ...) are rejected, never silently applied.
// Every field is optional, so the request is a PARTIAL update: omitted fields are never touched.
export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters").optional(),
    description: z.string().trim().max(3000, "Description must be at most 3000 characters").optional(),
    visibility: z.enum(VISIBILITIES, { message: "Visibility must be public or private" }).optional(),
    contact: z
      .object({
        name: z.string().trim().min(2, "Contact name must be at least 2 characters").max(80, "Contact name must be at most 80 characters").optional(),
        phone: z
          .string()
          .trim()
          .regex(/^\+?[0-9][0-9\s\-().]{5,19}$/, "Enter a valid phone number (6-20 digits, may start with +)")
          .optional(),
      })
      .strict()
      .optional(),
    teamConfig: z
      .object({
        totalTeams: int("Total teams", 2, 32).optional(),
        minPlayers: int("Minimum players", 1, 50).optional(),
        maxPlayers: int("Maximum players", 1, 50).optional(),
      })
      .strict()
      .optional(),
    pointsConfig: z
      .object({
        win: int("Win points", 0, 100).optional(),
        loss: int("Loss points", 0, 100).optional(),
        tie: int("Tie points", 0, 100).optional(),
        noresult: int("No-result points", 0, 100).optional(),
      })
      .strict()
      .optional(),
    tournament_timeline: z
      .object({
        registrationStart: dateField.optional(),
        registrationClose: dateField.optional(),
        auctionStart: dateField.optional(),
        tournamentStart: dateField.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, "Send at least one field to update");

export const changeStatusSchema = z
  .object({
    status: z.enum(TOURNAMENT_STATUSES, { message: "Unknown tournament status" }),
    reason: z
      .string()
      .trim()
      .max(300, "Reason must be at most 300 characters")
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .strict();

const PUBLIC_STATUSES = TOURNAMENT_STATUSES.filter((s) => s !== "draft") as [
  Exclude<(typeof TOURNAMENT_STATUSES)[number], "draft">,
  ...Exclude<(typeof TOURNAMENT_STATUSES)[number], "draft">[],
];

export const publicListQuerySchema = paginationSchema(12, 50).extend({
  search: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(100, "Search must be at most 100 characters").optional()
  ),
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(PUBLIC_STATUSES, { message: "Unknown status" }).optional()),
});

export type UpdateTournamentBody = z.infer<typeof updateTournamentSchema>;
export type ChangeStatusBody = z.infer<typeof changeStatusSchema>;
export type MyTournamentsQuery = z.infer<typeof myTournamentsQuerySchema>;
export type PublicListQuery = z.infer<typeof publicListQuerySchema>;
