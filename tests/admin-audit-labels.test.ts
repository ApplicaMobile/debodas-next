import assert from "node:assert/strict";
import test from "node:test";
import {
  auditActionLabel,
  auditEntityLabel,
} from "../src/lib/admin/audit-labels";

test("traduce acciones y entidades conocidas", () => {
  assert.equal(
    auditActionLabel("admin.auth.login"),
    "Inició sesión en el panel",
  );
  assert.equal(auditEntityLabel("email_queue"), "Cola de emails");
  assert.equal(auditEntityLabel("auth"), "Autenticación");
});

test("conserva valores desconocidos para no ocultar eventos nuevos", () => {
  assert.equal(auditActionLabel("admin.future.action"), "admin.future.action");
  assert.equal(auditEntityLabel("futureEntity"), "futureEntity");
});
