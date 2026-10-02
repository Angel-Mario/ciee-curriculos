import { Injectable } from "@nestjs/common";

import { DbService } from "../../database/db.service.js";
import { CreateTodoDto } from "./dto/create-todo.dto.js";
import { UpdateTodoDto } from "./dto/update-todo.dto.js";

@Injectable()
export class TodoService {
  constructor(private readonly db: DbService) {}

  findAll() {
    return this.db.prisma.todo.findMany();
  }

  async create(input: CreateTodoDto) {
    const todo = await this.db.prisma.todo.create({ data: input });
    return todo;
  }

  async update(id: string, input: UpdateTodoDto) {
    const result = await this.db.prisma.todo.update({
      data: input,
      where: { id },
    });
    return result;
  }

  async delete(id: string) {
    await this.db.prisma.todo.delete({ where: { id } });
    return { message: "Todo deleted successfully" };
  }
}
