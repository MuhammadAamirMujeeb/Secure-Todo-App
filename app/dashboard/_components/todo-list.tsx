"use client";

import type { DecryptedTodo } from "@/lib/actions/todo-actions";
import TodoItem from "./todo-item";

interface TodoListProps {
  todos: DecryptedTodo[];
}

export default function TodoList({ todos }: TodoListProps): React.ReactElement {
  if (todos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-muted)] text-sm">
          No tasks yet. Add one above!
        </p>
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-[var(--border)]">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
