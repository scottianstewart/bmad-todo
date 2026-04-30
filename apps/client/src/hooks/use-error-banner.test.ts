import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { errorBannerStore, useErrorBanner } from './use-error-banner';

describe('useErrorBanner', () => {
  beforeEach(() => {
    errorBannerStore.dismiss();
  });

  afterEach(() => {
    errorBannerStore.dismiss();
  });

  it('starts with null error', () => {
    const { result } = renderHook(() => useErrorBanner());
    expect(result.current.error).toBeNull();
  });

  it('setError updates the snapshot and re-renders subscribers', () => {
    const { result } = renderHook(() => useErrorBanner());
    act(() => {
      result.current.setError('boom');
    });
    expect(result.current.error).toBe('boom');
  });

  it('dismiss clears the error', () => {
    const { result } = renderHook(() => useErrorBanner());
    act(() => {
      result.current.setError('boom');
    });
    expect(result.current.error).toBe('boom');
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.error).toBeNull();
  });

  it('multiple subscribers see the same value', () => {
    const { result: a } = renderHook(() => useErrorBanner());
    const { result: b } = renderHook(() => useErrorBanner());
    act(() => {
      errorBannerStore.setError('shared');
    });
    expect(a.current.error).toBe('shared');
    expect(b.current.error).toBe('shared');
  });

  it('errorBannerStore can be used directly without the hook (for onError callbacks)', () => {
    errorBannerStore.setError('direct');
    expect(errorBannerStore.getSnapshot()).toBe('direct');
    errorBannerStore.dismiss();
    expect(errorBannerStore.getSnapshot()).toBeNull();
  });
});
