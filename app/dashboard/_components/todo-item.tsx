"use client";

import { useTransition } from "react";
import { toggleTodo, deleteTodo } from "@/lib/actions/todo-actions";
import type { DecryptedTodo } from "@/lib/actions/todo-actions";

interface TodoItemProps {
  todo: DecryptedTodo;
}

export default function TodoItem({ todo }: TodoItemProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleToggle(): void {
    startTransition(async () => {
      await toggleTodo(todo.id);
    });
  }

  function handleDelete(): void {
    startTransition(async () => {
      await deleteTodo(todo.id);
    });
  }

  return (
    <li
      className={`todo-item group flex items-center gap-3 py-3 px-1 border-b border-[var(--border)] last:border-0 transition-opacity ${
        isPending ? "opacity-50" : "opacity-100"
      }`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={isPending}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
        className="checkbox"
      />
      <span
        className={`flex-1 text-sm leading-relaxed break-words min-w-0 transition-colors ${
          todo.completed
            ? "line-through text-[var(--text-muted)]"
            : "text-[var(--text-primary)]"
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete "${todo.title}"`}
        className="btn-icon opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </li>
  );
}
