import ErrorBanner from '@app/components/ErrorBanner';

export default function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <ErrorBanner />
      <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
    </main>
  );
}
