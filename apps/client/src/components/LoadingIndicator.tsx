export default function LoadingIndicator() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-4">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
      />
      <span className="text-sm text-gray-600">Loading todos…</span>
    </div>
  );
}
