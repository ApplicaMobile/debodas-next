import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  isSafeLocalUploadUrl,
  resolveSafeLocalUploadPath,
} from "@/lib/upload/local";

describe("upload path safety", () => {
  it("acepta URLs normales bajo /uploads/", () => {
    const url = "/uploads/bodas/demo/abc-123.jpg";
    assert.equal(isSafeLocalUploadUrl(url), true);
    const resolved = resolveSafeLocalUploadPath(url);
    assert.ok(resolved);
    assert.ok(
      resolved!.includes(path.join("public", "uploads", "bodas", "demo")),
    );
  });

  it("rechaza path traversal con ..", () => {
    assert.equal(isSafeLocalUploadUrl("/uploads/../../.env.local"), false);
    assert.equal(isSafeLocalUploadUrl("/uploads/bodas/../../../etc/passwd"), false);
    assert.equal(resolveSafeLocalUploadPath("/uploads/../secret.txt"), null);
  });

  it("rechaza segmentos vacíos o puntos", () => {
    assert.equal(isSafeLocalUploadUrl("/uploads//file.jpg"), false);
    assert.equal(isSafeLocalUploadUrl("/uploads/./file.jpg"), false);
    assert.equal(isSafeLocalUploadUrl("/uploads/"), false);
  });

  it("rechaza caracteres raros y null bytes", () => {
    assert.equal(isSafeLocalUploadUrl("/uploads/boda/foo%00.jpg"), false);
    assert.equal(isSafeLocalUploadUrl("/uploads/boda\\file.jpg"), false);
    assert.equal(isSafeLocalUploadUrl("/uploads/boda/file.jpg\0"), false);
  });

  it("no trata URLs externas como upload local", () => {
    assert.equal(isSafeLocalUploadUrl("https://cdn.example.com/x.jpg"), false);
    assert.equal(isSafeLocalUploadUrl("/assets/img/x.jpg"), false);
  });
});
