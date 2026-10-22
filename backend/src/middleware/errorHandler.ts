import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

// Shape of the JSON every error response uses.
//Eg : { message: "Internal server error" } or { message: "Validation failed", errors: [{ field: "name", message: "Name is required" }] }
interface ErrorBody {
  message: string;
  errors?: { field: string; message: string }[];
}

// Errors thrown by Express's JSON parser carry a `type` string.
function getParserErrorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return undefined;
}

// The four parameters (err, req, res, next) are required: that is how
// Express recognises an error handler. Register it LAST in app.ts.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // If a response was already started we cannot send another one.
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let body: ErrorBody = { message: "Internal server error" };

  if (err instanceof ApiError) {
    status = err.statusCode;
    body = { message: err.message };
    if (err.errors && err.errors.length > 0) {
      body.errors = err.errors;
    }
  } else {
    const parserType = getParserErrorType(err);
    if (parserType === "entity.parse.failed") {
      status = 400;
      body = { message: "Malformed JSON in request body" };
    } else if (parserType === "entity.too.large") {
      status = 413;
      body = { message: "Request body is too large" };
    }
  }

  // Log unexpected problems on the server only. The client never sees this.
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json(body);
};
