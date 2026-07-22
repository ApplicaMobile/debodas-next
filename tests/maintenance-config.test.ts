import assert from "node:assert/strict";
import test from "node:test";
import {
  getMaintenanceRetentionConfig,
  retentionCutoff,
} from "../src/lib/maintenance/config";

test("usa retención por defecto cuando no hay env", () => {
  const config = getMaintenanceRetentionConfig({});
  assert.equal(config.emailLogDays, 90);
  assert.equal(config.auditLogDays, 180);
});

test("respeta variables de retención válidas", () => {
  const config = getMaintenanceRetentionConfig({
    EMAIL_LOG_RETENTION_DAYS: "30",
    AUDIT_LOG_RETENTION_DAYS: "60",
  });
  assert.equal(config.emailLogDays, 30);
  assert.equal(config.auditLogDays, 60);
});

test("ignora valores inválidos de retención", () => {
  const config = getMaintenanceRetentionConfig({
    EMAIL_LOG_RETENTION_DAYS: "0",
    AUDIT_LOG_RETENTION_DAYS: "abc",
  });
  assert.equal(config.emailLogDays, 90);
  assert.equal(config.auditLogDays, 180);
});

test("calcula el corte de retención en días", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  const cutoff = retentionCutoff(10, now);
  assert.equal(cutoff.toISOString(), "2026-07-12T12:00:00.000Z");
});
