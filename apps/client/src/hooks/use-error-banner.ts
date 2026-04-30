import { useSyncExternalStore } from 'react';

type Listener = () => void;

let currentError: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

export const errorBannerStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): string | null {
    return currentError;
  },
  setError(message: string): void {
    currentError = message;
    notify();
  },
  dismiss(): void {
    currentError = null;
    notify();
  },
};

export function useErrorBanner(): {
  error: string | null;
  setError: (message: string) => void;
  dismiss: () => void;
} {
  const error = useSyncExternalStore(errorBannerStore.subscribe, errorBannerStore.getSnapshot);
  return {
    error,
    setError: errorBannerStore.setError,
    dismiss: errorBannerStore.dismiss,
  };
}
