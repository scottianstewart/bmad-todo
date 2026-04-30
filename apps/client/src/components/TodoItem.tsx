
import { useDeleteTodo } from '@app/hooks/use-delete-todo';
import { useUpdateTodo } from '@app/hooks/use-update-todo';
import type { Todo } from '@todo-app/shared';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  return (
    <li className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        onClick={() => updateTodo.mutate({ id: todo.id, patch: { completed: !todo.completed } })}
        className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 border-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          todo.completed ? 'bg-blue-600 text-white' : 'bg-white'
        }`}
      >
        {todo.completed ? '✓' : ''}
      </button>
      <span
        className={`min-w-0 flex-1 break-words text-base ${
          todo.completed ? 'text-gray-500 line-through opacity-70' : 'text-gray-900'
        }`}
      >
        {todo.title}
      </span>
      <button
        type="button"
        aria-label={`Delete todo: ${todo.title}`}
        onClick={() => deleteTodo.mutate({ id: todo.id })}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Delete
      </button>
    </li>
  );
}
