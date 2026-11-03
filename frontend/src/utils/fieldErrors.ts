import { ApiRequestError } from '../api/client.ts'

export type FieldErrors = Record<string, string>

// Turns the backend's { errors: [{ field, message }] } into { field: message }.
export function toFieldErrors(error: unknown): FieldErrors {
  const result: FieldErrors = {}
  if (error instanceof ApiRequestError && error.errors) {
    for (const item of error.errors) {
      if (!(item.field in result)) result[item.field] = item.message
    }
  }
  return result
}

// A message for the top of a form (used when there is no field-specific error).
export function toFormMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message
  return 'Something went wrong. Please try again.'
}