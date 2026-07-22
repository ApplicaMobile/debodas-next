import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCronFreshness } from "../src/lib/admin/system-health";

test("marca cron sin ejecución como unknown", () => {
  const result = evaluateCronFreshness(null, 15 * 60 * 1000);
  assert.equal(result.level, "unknown");
  assert.equal(result.ageMs, null);
});

test("marca cron reciente como ok", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  const lastRunAt = new Date("2026-07-22T11:55:00.000Z");
  const result = evaluateCronFreshness(lastRunAt, 15 * 60 * 1000, now);
  assert.equal(result.level, "ok");
  assert.equal(result.ageMs, 5 * 60 * 1000);
});

test("marca cron atrasado como warn", () => {
  const now = new Date("2026-07-22T12:00:00.000Z");
  const lastRunAt = new Date("2026-07-22T11:40:00.000Z");
  const result = evaluateCronFreshness(lastRunAt, 15 * 60 * 1000, now);
  assert.equal(result.level, "warn");
  assert.equal(result.ageMs, 20 * 60 * 1000);
});
