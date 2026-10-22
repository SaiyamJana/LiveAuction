export const USER_ROLES = ["owner", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUEST_STATUSES = ["pending", "accepted", "rejected", "withdrawn"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const VISIBILITIES = ["public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const TOURNAMENT_STATUSES = [
  "draft",
  "registration_open",
  "registration_closed",
  "auction",
  "tournament_in_progress",
  "completed",
  "cancelled",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const ACCOUNT_TYPES = ["star", "gem"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const REGISTRATION_STATUSES = ["pending", "accepted", "rejected"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const PLAYER_STATUSES = ["pending", "sold", "unsold", "withdrawn"] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

export const STAGE_TYPES = ["groups", "playoff", "custom"] as const;
export type StageType = (typeof STAGE_TYPES)[number];

export const STAGE_STATUSES = ["ready", "in-progress", "completed"] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const AUTO_MANUAL = ["auto", "manual"] as const;
export type AutoManual = (typeof AUTO_MANUAL)[number];

export const MATCH_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const RESULT_TYPES = ["win", "tie", "noresult"] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

export const AUCTION_STATUSES = [
  "draft", "scheduled", "live", "paused", "completed", "cancelled",
] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "tournament_request",
  "tournament_response",
  "player_registration",
  "registration_response",
  "auction_scheduled",
  "auction_started",
  "auction_completed",
  "player_sold",
  "player_unsold",
  "match_scheduled",
  "match_result",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];