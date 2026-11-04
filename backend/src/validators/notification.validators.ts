import { z } from "zod";
import { paginationSchema } from "./common.validators.js";

export const listNotificationsQuerySchema = paginationSchema(10, 50);
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
