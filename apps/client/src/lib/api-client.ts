import { apiErrorSchema } from '@todo-app/shared';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError('Network request failed', 'NETWORK_ERROR', 0);
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ApiClientError(
        'Server returned non-JSON error',
        'INVALID_ERROR_ENVELOPE',
        response.status,
      );
    }

    const result = apiErrorSchema.safeParse(payload);
    if (result.success) {
      throw new ApiClientError(result.data.error.message, result.data.error.code, response.status);
    }
    throw new ApiClientError(
      'Server returned malformed error envelope',
      'INVALID_ERROR_ENVELOPE',
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiClientError(
      'Server returned non-JSON success body',
      'INVALID_RESPONSE_BODY',
      response.status,
    );
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T = void>(path: string) => request<T>('DELETE', path),
};
