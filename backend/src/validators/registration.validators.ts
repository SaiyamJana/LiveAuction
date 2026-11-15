import { z } from "zod";
import { ACCOUNT_TYPES, PLAYER_STATUSES, REGISTRATION_STATUSES } from "../types/enums.js";
import { paginationSchema } from "./common.validators.js";

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

// International format after cleaning: "+" then 7-15 digits (E.164), no leading zero.
const E164 = /^\+[1-9][0-9]{6,14}$/;
const stripPhoneFormatting = (value: string): string => value.replace(/[\s\-().]/g, "");

// .strict(): userId, status, isVerified, tournamentId ... sent by a client are REJECTED (400),
// never silently applied. Players can never set their own verification or status.
const registrationFields = {
  actualName: z
    .string({ message: "Actual name is required" })
    .trim()
    .min(2, "Actual name must be at least 2 characters")
    .max(80, "Actual name must be at most 80 characters"),
  displayName: z
    .string({ message: "Display name is required" })
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  accountType: z.enum(ACCOUNT_TYPES, { message: "Account type must be star or gem" }),
  contactNumber: z
    .string({ message: "Contact number is required" })
    .trim()
    .refine((v) => E164.test(stripPhoneFormatting(v)), "Enter a valid international number, for example +919876543210")
    .transform(stripPhoneFormatting),
  contactCountry: z
    .string({ message: "Contact country is required" })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Select a valid country"),
  wantsCaptain: z.boolean({ message: "Captain preference must be true or false" }),
};

// Create (POST) and resubmit (PUT) accept exactly the same fields.
export const registrationBodySchema = z.object(registrationFields).strict();

export const registrationParamsSchema = z.object({
  id: z.string().regex(OBJECT_ID, "Invalid id"),
  regId: z.string().regex(OBJECT_ID, "Invalid registration id"),
});

export const playerParamsSchema = z.object({
  id: z.string().regex(OBJECT_ID, "Invalid id"),
  playerId: z.string().regex(OBJECT_ID, "Invalid player id"),
});

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const searchSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().max(100, "Search must be at most 100 characters").optional()
);

// GET /registrations?status=&search=&page=&limit=
export const registrationListQuerySchema = paginationSchema(25, 100).extend({
  status: z.preprocess(emptyToUndefined, z.enum(REGISTRATION_STATUSES, { message: "Unknown status" }).optional()),
  search: searchSchema,
});

// GET /players?status=&search=&page=&limit=
export const playerListQuerySchema = paginationSchema(25, 100).extend({
  status: z.preprocess(emptyToUndefined, z.enum(PLAYER_STATUSES, { message: "Unknown status" }).optional()),
  search: searchSchema,
});

// PATCH /registrations/:regId/decision
// Rejecting needs a reason. isVerified is organizer-only and is applied on acceptance.
export const decisionBodySchema = z
  .object({
    decision: z.enum(["accept", "reject"], { message: "Decision must be accept or reject" }),
    response: z
      .string()
      .trim()
      .max(1000, "Response must be at most 1000 characters")
      .optional()
      .transform((v) => (v ? v : undefined)),
    isVerified: z.boolean({ message: "isVerified must be true or false" }).optional(),
  })
  .strict()
  .refine((body) => body.decision !== "reject" || (body.response?.length ?? 0) >= 3, {
    message: "A reason of at least 3 characters is required when rejecting a registration",
    path: ["response"],
  });

export type RegistrationBody = z.infer<typeof registrationBodySchema>;
export type RegistrationParams = z.infer<typeof registrationParamsSchema>;
export type PlayerParams = z.infer<typeof playerParamsSchema>;
export type RegistrationListQuery = z.infer<typeof registrationListQuerySchema>;
export type PlayerListQuery = z.infer<typeof playerListQuerySchema>;
export type DecisionBody = z.infer<typeof decisionBodySchema>;
