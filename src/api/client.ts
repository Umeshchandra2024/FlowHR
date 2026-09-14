/** Minimal typed fetch wrapper — no component talks to `fetch` directly. */

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Envelope<T> = { data: T } | { error: { code: string; message: string } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)

  // 204 No Content has no body to parse.
  const body = (response.status === 204 ? null : await response.json()) as Envelope<T> | null

  if (!response.ok) {
    const message = body && 'error' in body ? body.error.message : `${init?.method ?? 'GET'} ${path} failed (${response.status})`
    throw new ApiError(response.status, message)
  }

  return (body && 'data' in body ? body.data : (body as T)) ?? (undefined as T)
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}
