// One field-level problem, for example { field: "email", message: "Invalid email address" }
export interface FieldError {
  field: string;
  message: string;
}

// An error you throw on purpose when you already know the HTTP status.
// Example: throw new ApiError(404, "Tournament not found");
export class ApiError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
