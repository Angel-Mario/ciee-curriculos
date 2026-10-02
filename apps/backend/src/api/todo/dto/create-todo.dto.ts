import { z } from "zod";

export class CreateTodoDto {
  static schema = z.object({
    completed: z.boolean().default(false),
    description: z.string().optional(),
    title: z.string().min(1),
  });

  title: string;
  description?: string;
  completed: boolean;
}
