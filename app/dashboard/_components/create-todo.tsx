"use client";

import { useRef, useState, useTransition } from "react";
import { createTodo } from "@/lib/actions/todo-actions";

export default function CreateTodo(): React.ReactElement {
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData): void {
    setError("");
    startTransition(async () => {
      const result = await createTodo(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to create todo");
        return;
      }
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        name="title"
        type="text"
        placeholder="Add a new task…"
        required
        minLength={1}
        maxLength={500}
        disabled={isPending}
        className="input flex-1 min-w-0"
        aria-label="New task title"
      />
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary shrink-0"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-400 mt-1 col-span-2">
          {error}
        </p>
      )}
    </form>
  );
}
