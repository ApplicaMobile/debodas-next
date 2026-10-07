import { appendFileSync, mkdirSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";

export function newRunId(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  return `${stamp}-${randomBytes(3).toString("hex")}`;
}

/** Carpeta por defecto: fuera del repo (tmp del sistema), así nunca se commitea. */
export function defaultLogDir(): string {
  return path.join(os.tmpdir(), "debodas-wp-import");
}

/** Log JSONL de una corrida: una línea por boda + resumen al final. */
export class RunLog {
  readonly file: string;
  readonly reportFile: string;

  constructor(readonly runId: string, dir: string = defaultLogDir()) {
    mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, `wp-import-${runId}.jsonl`);
    this.reportFile = path.join(dir, `wp-import-${runId}-report.json`);
  }

  write(entry: Record<string, unknown>): void {
    appendFileSync(this.file, `${JSON.stringify({ runId: this.runId, at: new Date().toISOString(), ...entry })}\n`);
  }

  writeReport(report: Record<string, unknown>): void {
    writeFileSync(this.reportFile, `${JSON.stringify({ runId: this.runId, ...report }, null, 2)}\n`);
  }
}

/** URL de base de datos sin usuario ni clave, para imprimir en consola. */
export function redactDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(url inválida)";
  }
}
