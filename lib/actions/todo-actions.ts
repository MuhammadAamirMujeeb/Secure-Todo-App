"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { encrypt, decrypt } from "@/server/crypto";
import { createTodoSchema, todoIdSchema } from "@/lib/validators";

type TodoRow = typeof todos.$inferSelect;
export type DecryptedTodo = Omit<TodoRow, "encryptedTitle"> & { title: string };
type ActionResult<T = undefined> = { success: boolean; error?: string; data?: T };

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function createTodo(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const parsed = createTodoSchema.safeParse({ title: formData.get("title") });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const encryptedTitle = encrypt(parsed.data.title);
    const now = new Date();

    await db.insert(todos).values({
      id: nanoid(),
      userId: session.user.id,
      encryptedTitle,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[createTodo]", err);
    return { success: false, error: "Failed to create todo" };
  }
}

export async function getTodos(): Promise<ActionResult<DecryptedTodo[]>> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const rows = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, session.user.id))
      .orderBy(desc(todos.createdAt));

    const decrypted: DecryptedTodo[] = rows.map((row) => {
      const { encryptedTitle, ...rest } = row;
      return { ...rest, title: decrypt(encryptedTitle) };
    });

    return { success: true, data: decrypted };
  } catch (err) {
    console.error("[getTodos]", err);
    return { success: false, error: "Failed to load todos" };
  }
}

export async function toggleTodo(id: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const parsed = todoIdSchema.safeParse({ id });
    if (!parsed.success) return { success: false, error: "Invalid todo ID" };

    const [todo] = await db
      .select({ completed: todos.completed })
      .from(todos)
      .where(and(eq(todos.id, parsed.data.id), eq(todos.userId, session.user.id)));

    if (!todo) return { success: false, error: "Todo not found" };

    await db
      .update(todos)
      .set({ completed: !todo.completed, updatedAt: new Date() })
      .where(and(eq(todos.id, parsed.data.id), eq(todos.userId, session.user.id)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[toggleTodo]", err);
    return { success: false, error: "Failed to update todo" };
  }
}

export async function deleteTodo(id: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const parsed = todoIdSchema.safeParse({ id });
    if (!parsed.success) return { success: false, error: "Invalid todo ID" };

    const [todo] = await db
      .select({ id: todos.id })
      .from(todos)
      .where(and(eq(todos.id, parsed.data.id), eq(todos.userId, session.user.id)));

    if (!todo) return { success: false, error: "Todo not found" };

    await db
      .delete(todos)
      .where(and(eq(todos.id, parsed.data.id), eq(todos.userId, session.user.id)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[deleteTodo]", err);
    return { success: false, error: "Failed to delete todo" };
  }
}
