import { useState, type FormEvent } from 'react';

import { useCreateTodo } from '@app/hooks/use-create-todo';
import { MAX_TITLE_LENGTH } from '@todo-app/shared';


export default function NewTodoInput() {
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) return;

    createTodo.mutate(
      { title: trimmed },
      {
        onSuccess: () => {
          setTitle('');
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        aria-label="Add a new todo"
        placeholder="Add a new todo..."
        disabled={createTodo.isPending}
        className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={createTodo.isPending || title.trim().length === 0}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
