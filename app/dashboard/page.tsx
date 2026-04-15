import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getTodos } from "@/lib/actions/todo-actions";
import CreateTodo from "./_components/create-todo";
import TodoList from "./_components/todo-list";
import TodoSkeleton from "./_components/todo-skeleton";
import SignOutButton from "./_components/sign-out-button";

async function TodoSection(): Promise<React.ReactElement> {
  const result = await getTodos();
  const todos = result.data ?? [];
  return <TodoList todos={todos} />;
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-[var(--background)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-heading">
              My Tasks
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Hey, {session.user.name}
            </p>
          </div>
          <SignOutButton />
        </header>

        <section aria-label="Add a new task" className="card mb-6">
          <CreateTodo />
        </section>

        <section aria-label="Task list" className="card">
          <Suspense fallback={<TodoSkeleton />}>
            <TodoSection />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
