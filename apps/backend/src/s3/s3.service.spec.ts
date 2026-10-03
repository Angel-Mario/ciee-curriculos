import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { S3Service } from "./s3.service.js";

describe("S3 storage", () => {
  const send = vi.fn<(command: unknown) => Promise<unknown>>();
  const client = {
    destroy: vi.fn<() => void>(),
    send,
  } as unknown as S3Client;
  const service = new S3Service(client, "curricula");

  it("builds the public object URL", () => {
    expect(service.buildPublicUrl("file.pdf")).toBe(
      "http://localhost:9000/curricula/file.pdf"
    );
  });

  it("uploads PDF bytes without an ACL", async () => {
    send.mockResolvedValueOnce({});
    const content = Buffer.from("%PDF-test");

    await service.uploadFile(content, "file.pdf");

    const command = send.mock.calls[0]?.[0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Body: content,
      Bucket: "curricula",
      ContentType: "application/pdf",
      Key: "file.pdf",
    });
    expect(command.input.ACL).toBeUndefined();
  });

  it("deletes a stored object", async () => {
    send.mockResolvedValueOnce({});

    await service.deleteFile("file.pdf");

    const command = send.mock.calls[1]?.[0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "curricula",
      Key: "file.pdf",
    });
  });

  it("reports storage outages as 503", async () => {
    send.mockRejectedValueOnce(new Error("RustFS unavailable"));

    await expect(
      service.uploadFile(Buffer.from("pdf"), "file.pdf")
    ).rejects.toMatchObject({
      response: {
        code: "STORAGE_UNAVAILABLE",
        message: "Não foi possível armazenar o currículo no momento.",
      },
      status: 503,
    });
  });
});
