import { S3Client } from "@aws-sdk/client-s3";
import { Module } from "@nestjs/common";

import { env } from "../config/env.js";
import { S3_BUCKET, S3_CLIENT, S3Service } from "./s3.service.js";

@Module({
  exports: [S3Service],
  providers: [
    { provide: S3_BUCKET, useValue: env.S3_BUCKET },
    {
      provide: S3_CLIENT,
      useFactory: () =>
        new S3Client({
          credentials: {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY,
          },
          endpoint: env.S3_ENDPOINT,
          forcePathStyle: true,
          region: env.S3_REGION,
        }),
    },
    S3Service,
  ],
})
export class S3Module {}
