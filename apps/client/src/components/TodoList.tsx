import { useTodos } from '@app/hooks/use-todos';

import TodoItem from './TodoItem';

export default function TodoList() {
  const { data, isPending, isError } = useTodos();

  if (isPending) return null;
  if (isError) return null;

  return (
    <ul className="list-none">
      {data.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
