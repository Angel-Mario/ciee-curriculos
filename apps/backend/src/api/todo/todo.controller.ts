import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { CreateTodoDto } from "./dto/create-todo.dto.js";
import { UpdateTodoDto } from "./dto/update-todo.dto.js";
import { TodoService } from "./todo.service.js";

@ApiTags("Todos")
@Controller("todos")
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  @ApiOperation({ summary: "/api/todos" })
  @ApiOkResponse({ description: "Returns all todos" })
  findAll() {
    return this.todoService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "/api/todos" })
  @ApiCreatedResponse({ description: "Todo created successfully" })
  create(@Body({ schema: CreateTodoDto.schema }) input: CreateTodoDto) {
    return this.todoService.create(input);
  }

  @Put(":id")
  @ApiOperation({ summary: "/api/todos/{id}" })
  @ApiOkResponse({ description: "Todo updated successfully" })
  update(
    @Param("id") id: string,
    @Body({ schema: UpdateTodoDto.schema }) input: UpdateTodoDto
  ) {
    return this.todoService.update(id, input);
  }

  @Delete(":id")
  @ApiOperation({ summary: "/api/todos/{id}" })
  @ApiOkResponse({ description: "Todo deleted successfully" })
  delete(@Param("id") id: string) {
    return this.todoService.delete(id);
  }
}
