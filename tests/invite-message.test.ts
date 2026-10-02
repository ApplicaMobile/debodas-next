import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDefaultWhatsAppMessage,
  buildWhatsAppShareUrl,
} from "../src/lib/account/invite-message";
import { toInvitationDatetimeLocal } from "../src/lib/invitations/format";

test("el link de WhatsApp conserva emojis y codifica los signos de exclamación", () => {
  const message = buildDefaultWhatsAppMessage({
    coupleName: "Ana & Luis",
    micrositeUrl: "https://debodas.com.ar/bodas/ana-y-luis",
  });
  const url = buildWhatsAppShareUrl(message);

  assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?text=/);
  assert.match(url, /%F0%9F%8E%89/);
  assert.doesNotMatch(url, /!/);
  assert.match(decodeURIComponent(url.split("text=")[1]), /🎉/);
  assert.match(decodeURIComponent(url.split("text=")[1]), /Ana & Luis/);
});

test("la fecha de la boda precarga el día y deja la hora para completar", () => {
  assert.equal(toInvitationDatetimeLocal("15/11/2030", ""), "2030-11-15T");
  assert.equal(toInvitationDatetimeLocal("2030-11-15", "19:30"), "2030-11-15T19:30");
  assert.equal(toInvitationDatetimeLocal("", "19:30"), "");
});
