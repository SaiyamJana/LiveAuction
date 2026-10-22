import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";//zod is a TypeScript-first schema declaration and validation library. It allows you to define schemas for your data and validate them at runtime. In this code, ZodType is used to type the validation schemas for different parts of the request (body, params, query).
import { ApiError } from '../utils/ApiError.js';
import type { FieldError } from "../utils/ApiError.js";

// Which parts of the request can be validated. All are optional.
interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

type RequestPart = "body" | "params" | "query";

// Where the validated copies are stored: res.locals.validated
interface ValidatedData {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

const PARTS: RequestPart[] = ["body", "params", "query"];

// Use this inside a controller to read the validated (and cleaned) data.
// Example:
//   const body = getValidated<{ name: string }>(res, "body");
export function getValidated<T>(res: Response, part: RequestPart): T {
  const validated = (res.locals.validated ?? {}) as ValidatedData;
  return validated[part] as T;
}

// Usage:
//   router.post("/x", validate({ body: mySchema }), controller);
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const problems: FieldError[] = [];
    const validated: ValidatedData = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);

      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          problems.push({
            // "address.city" for nested fields; falls back to "body"/"query"/"params"
            field: issue.path.length > 0 ? issue.path.join(".") : part,
            message: issue.message,
          });
        }
      }
    }

    if (problems.length > 0) {
      next(new ApiError(400, "Validation failed", problems));
      return;
    }

    res.locals.validated = validated;

    // req.body can be safely replaced, so req.body is also the cleaned value.
    // req.query and req.params must NOT be reassigned (see getValidated above).
    if (validated.body !== undefined) {
      req.body = validated.body;
    }

    next();
  };
}
