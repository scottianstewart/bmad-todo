import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError, apiClient } from './api-client';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function HealthProbe() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<{ status: string }>('/api/health'),
  });

  if (isPending) return <p>loading</p>;
  if (isError) return <p>error</p>;
  return <p>{data.status}</p>;
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders successful useQuery against /api/health', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithClient(<HealthProbe />);

    expect(await screen.findByText('ok')).toBeInTheDocument();
  });

  it('throws ApiClientError with parsed code/message/status on 500 with valid envelope', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'boom', code: 'INTERNAL' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiClient.get('/api/health')).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'INTERNAL',
      message: 'boom',
      status: 500,
    });
  });

  it('throws ApiClientError with INVALID_ERROR_ENVELOPE on malformed error body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ oops: 'no envelope here' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(apiClient.get('/api/health')).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'INVALID_ERROR_ENVELOPE',
      status: 500,
    });
  });

  it('throws ApiClientError with NETWORK_ERROR when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/api/health')).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('returns undefined for 204 No Content responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    );

    await expect(apiClient.del('/api/todos/abc')).resolves.toBeUndefined();
  });

  it('thrown errors are instances of ApiClientError', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/api/health')).rejects.toBeInstanceOf(ApiClientError);
  });
});
