const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const API_BASE_URL = (envBaseUrl ?? 'http://localhost:8080/api/v1').replace(/\/$/, '')

type ApiErrorPayload = {
  message?: string
  error?: string
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {})
  headers.set('Accept', 'application/json')

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const isJsonResponse = response.headers.get('content-type')?.includes('application/json')
  const payload = isJsonResponse ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null
    const message =
      errorPayload?.message ?? errorPayload?.error ?? `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as T
}