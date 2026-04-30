import ErrorBanner from '@app/components/ErrorBanner';
import NewTodoInput from '@app/components/NewTodoInput';
import TodoList from '@app/components/TodoList';

export default function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Todo App</h1>
      <ErrorBanner />
      <NewTodoInput />
      <TodoList />
    </main>
  );
}
