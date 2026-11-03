// The base URL comes from frontend/.env (VITE_API_URL).
// Anything starting with VITE_ is visible to every visitor: never put secrets here.
const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/+$/, '')

// Same shape the backend's error handler returns.
export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  message: string
  errors?: ApiFieldError[]
}

// Thrown for every failed request, so pages can use one try/catch.
export class ApiRequestError extends Error {
  status: number // HTTP status, or 0 when the server could not be reached
  errors?: ApiFieldError[]

  constructor(status: number, message: string, errors?: ApiFieldError[]) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.errors = errors
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // send cookies (needed later for login)
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    // Let callers recognise a cancelled request themselves.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiRequestError(0, 'Cannot reach the server. Is the backend running?')
  }

  // Empty responses (for example 204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const errorBody = data as Partial<ApiErrorResponse> | null
    throw new ApiRequestError(
      response.status,
      errorBody?.message ?? `Request failed with status ${response.status}`,
      errorBody?.errors,
    )
  }

  return data as T
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
}