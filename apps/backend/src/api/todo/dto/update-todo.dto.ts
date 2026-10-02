import { z } from "zod";

export class UpdateTodoDto {
  static schema = z.object({
    completed: z.boolean().optional(),
    description: z.string().optional(),
    title: z.string().min(1).optional(),
  });

  title?: string;
  description?: string;
  completed?: boolean;
}
