import { useErrorBanner } from '@app/hooks/use-error-banner';

export default function ErrorBanner() {
  const { error, dismiss } = useErrorBanner();

  if (error === null) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-3 text-red-900"
    >
      <span>{error}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss error"
        className="ml-4 rounded px-2 py-1 text-sm font-medium text-red-900 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Dismiss
      </button>
    </div>
  );
}
