import { z } from "zod";

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(500, "Title cannot exceed 500 characters")
    .trim(),
});

export const todoIdSchema = z.object({
  id: z.string().min(1, "Todo ID is required"),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
