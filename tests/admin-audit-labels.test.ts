import assert from "node:assert/strict";
import test from "node:test";
import {
  auditActionLabel,
  auditEntityLabel,
} from "../src/lib/admin/audit-labels";

test("traduce acciones y entidades conocidas", () => {
  assert.equal(
    auditActionLabel("admin.email.queue_processed"),
    "Procesó manualmente la cola",
  );
  assert.equal(auditEntityLabel("email_queue"), "Cola de emails");
});

test("conserva valores desconocidos para no ocultar eventos nuevos", () => {
  assert.equal(auditActionLabel("admin.future.action"), "admin.future.action");
  assert.equal(auditEntityLabel("futureEntity"), "futureEntity");
});
