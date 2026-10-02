import { Injectable } from "@nestjs/common";

import { DbService } from "./database/db.service.js";

@Injectable()
export class AppService {
  constructor(private readonly db: DbService) {}

  getHello(): string {
    return "Hello World!";
  }
}
