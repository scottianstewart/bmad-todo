import { useEffect, useState } from 'react';

import { useTodos } from '@app/hooks/use-todos';

import EmptyState from './EmptyState';
import LoadingIndicator from './LoadingIndicator';
import TodoItem from './TodoItem';

const LOADING_INDICATOR_DELAY_MS = 200;

export default function TodoList() {
  const { data, isPending, isError } = useTodos();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setShowLoading(false);
      return;
    }
    const t = setTimeout(() => setShowLoading(true), LOADING_INDICATOR_DELAY_MS);
    return () => clearTimeout(t);
  }, [isPending]);

  if (isPending) {
    return showLoading ? <LoadingIndicator /> : null;
  }
  if (isError) return null;
  if (data.length === 0) return <EmptyState />;

  return (
    <ul className="list-none">
      {data.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
