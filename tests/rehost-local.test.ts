import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { describe, it } from "node:test";
import {
  resolveFromUploadsDir,
  uploadsRelativePathFromUrl,
} from "../scripts/wp/rehost-source";

describe("rehost local uploads", () => {
  it("extrae el path relativo de una URL WP", () => {
    assert.equal(
      uploadsRelativePathFromUrl(
        "https://debodas.com.ar/wp-content/uploads/2024/03/foto.jpg?w=800",
      ),
      "2024/03/foto.jpg",
    );
  });

  it("rechaza path traversal", () => {
    assert.equal(
      uploadsRelativePathFromUrl(
        "https://debodas.com.ar/wp-content/uploads/../../etc/passwd",
      ),
      null,
    );
  });

  it("resuelve archivo si existe en la carpeta SFTP", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "debodas-uploads-"));
    const dir = path.join(root, "2024", "03");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "foto.jpg"), "x");
    const resolved = resolveFromUploadsDir(
      "https://debodas.com.ar/wp-content/uploads/2024/03/foto.jpg",
      root,
    );
    assert.equal(resolved, path.join(dir, "foto.jpg"));
  });
});
