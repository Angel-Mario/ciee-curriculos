import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AppService } from "./app.service.js";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "/api" })
  @ApiResponse({ description: "Returns a hello world message", status: 200 })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
