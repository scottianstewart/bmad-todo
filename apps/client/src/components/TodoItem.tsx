import type { Todo } from '@todo-app/shared';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 border-b border-gray-200 py-2 last:border-b-0">
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded border ${
          todo.completed ? 'border-gray-400 bg-gray-300' : 'border-gray-400 bg-white'
        }`}
      />
      <span className="flex-1 text-base text-gray-900">{todo.title}</span>
    </li>
  );
}
