import { Module } from "@nestjs/common";

import { TodoModule } from "./api/todo/todo.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { env } from "./config/env.js";
import { DbModule } from "./database/db.module.js";

@Module({
  controllers: [AppController],
  imports: [
    DbModule.forRoot({
      sqlserver: {
        database: env.SQLSERVER_DATABASE,
        options: {
          encrypt: env.SQLSERVER_ENCRYPT,
          trustServerCertificate: env.SQLSERVER_TRUST_SERVER_CERTIFICATE,
        },
        password: env.SQLSERVER_PASSWORD,
        port: env.SQLSERVER_PORT,
        server: env.SQLSERVER_HOST,
        user: env.SQLSERVER_USER,
      },
    }),
    TodoModule,
  ],
  providers: [AppService],
})
export class AppModule {}
