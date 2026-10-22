import type { NextFunction, Request, RequestHandler, Response } from "express";

// Wraps an async route handler so that a thrown error or rejected promise
// is passed to the central error handler instead of leaving the request hanging.
//
// Usage:
//   router.get("/something", asyncHandler(async (req, res) => { ... }));
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
