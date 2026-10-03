import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common";

import { env } from "../config/env.js";

export const S3_CLIENT = Symbol("S3_CLIENT");
export const S3_BUCKET = Symbol("S3_BUCKET");

@Injectable()
export class S3Service implements OnModuleDestroy {
  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject(S3_BUCKET) private readonly bucket: string
  ) {}

  async uploadFile(buffer: Buffer, key: string): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Body: buffer,
          Bucket: this.bucket,
          ContentType: "application/pdf",
          Key: key,
        })
      );
    } catch {
      throw new ServiceUnavailableException({
        code: "STORAGE_UNAVAILABLE",
        message: "Não foi possível armazenar o currículo no momento.",
      });
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
      );
    } catch {
      throw new ServiceUnavailableException({
        code: "STORAGE_UNAVAILABLE",
        message: "Não foi possível remover o currículo no momento.",
      });
    }
  }

  buildPublicUrl(key: string): string {
    const endpoint = new URL(env.S3_ENDPOINT_PUBLIC);
    const path = `${endpoint.pathname.replace(/\/$/u, "")}/${this.bucket}/${key}`;
    return new URL(path, endpoint.origin).toString();
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
