import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encryptSecret, isEncryptedSecret } from "@/lib/security/secrets";
import {
  buildAbonarTarjetaFromMeta,
  buildDressCodeFromMeta,
  buildInvitationsFromMeta,
  buildPaymentSettingsFromMeta,
  buildPicturesFromMeta,
  buildRsvpTableLabels,
  collectGalleryAttachmentIds,
  maybeUnserialize,
  parseIdList,
  pickAttachmentUrl,
  resolveRsvpTableName,
  rewritePublicMediaUrl,
  wpAlbumHintCount,
} from "../scripts/wp/migrate-fields";
import { rowsToMeta } from "../scripts/wp/acf";
import {
  hashPhpass,
  isPhpassHash,
  verifyPhpass,
} from "../src/lib/wp-import/phpass";

describe("WP import media URLs", () => {
  it("parsea extra_images CSV", () => {
    assert.deepEqual(parseIdList("12, 15,0,  22"), [12, 15, 22]);
  });

  it("reescribe localhost y http a producción", () => {
    assert.equal(
      rewritePublicMediaUrl("http://localhost:8080/wp-content/uploads/a.jpg"),
      "https://debodas.com.ar/wp-content/uploads/a.jpg",
    );
  });

  it("prioriza _wp_attached_file sobre guid roto", () => {
    const url = pickAttachmentUrl({
      guid: "http://localhost/boda/?attachment_id=9",
      attachedFile: "2024/03/album.jpg",
      siteUrl: "http://localhost",
    });
    assert.equal(url, "https://debodas.com.ar/wp-content/uploads/2024/03/album.jpg");
  });

  it("conserva _thumbnail_id en meta", () => {
    const meta = rowsToMeta([
      { meta_key: "_thumbnail_id", meta_value: "99" },
      { meta_key: "_pictures_image", meta_value: "field_xxx" },
      { meta_key: "pictures", meta_value: "1" },
    ]);
    assert.equal(meta.get("_thumbnail_id"), "99");
    assert.equal(meta.has("_pictures_image"), false);
  });
});

describe("WP gallery", () => {
  it("usa extra_images si el repeater no resolvió URLs", () => {
    const meta = rowsToMeta([
      { meta_key: "pictures", meta_value: "0" },
      { meta_key: "extra_images", meta_value: "10,11" },
    ]);
    const attachments = new Map([
      [10, "https://debodas.com.ar/wp-content/uploads/a.jpg"],
      [11, "https://debodas.com.ar/wp-content/uploads/b.jpg"],
    ]);
    const pictures = buildPicturesFromMeta(meta, attachments);
    assert.equal(pictures.length, 2);
    assert.equal(wpAlbumHintCount(meta), 2);
    assert.deepEqual(collectGalleryAttachmentIds(meta).sort(), [10, 11]);
  });
});

describe("WP payment / dress / invitations", () => {
  it("cifra access_token de Mercado Pago", () => {
    const meta = rowsToMeta([
      { meta_key: "mp_tokens_public_key", meta_value: "APP_USR-pub" },
      { meta_key: "mp_tokens_access_token", meta_value: "APP_USR-secret" },
      { meta_key: "bank_account_bank", meta_value: "Galicia" },
      { meta_key: "bank_account_cbu", meta_value: "0000000000000000000000" },
    ]);
    const settings = buildPaymentSettingsFromMeta(meta);
    assert.equal(settings.mp_tokens?.public_key, "APP_USR-pub");
    assert.ok(settings.mp_tokens?.access_token);
    assert.equal(isEncryptedSecret(settings.mp_tokens?.access_token), true);
    assert.equal(settings.bank_account?.bank, "Galicia");
  });

  it("lee dress code y colores JSON", () => {
    const meta = rowsToMeta([
      { meta_key: "dress_code_caballeros", meta_value: "Smoking" },
      { meta_key: "dress_code_damas", meta_value: "Largo" },
      {
        meta_key: "dress_code_colors",
        meta_value: JSON.stringify([{ name: "Verde", hex: "#228B22" }]),
      },
    ]);
    const dress = buildDressCodeFromMeta(meta);
    assert.equal(dress?.caballeros, "Smoking");
    assert.equal(dress?.colors_damas[0]?.hex, "#228B22");
  });

  it("mapea invitaciones ACF anidadas", () => {
    const meta = rowsToMeta([
      { meta_key: "invitations", meta_value: "1" },
      { meta_key: "invitations_0_invitation_name", meta_value: "Ceremonia" },
      { meta_key: "invitations_0_invitation_theme", meta_value: "hojas" },
      { meta_key: "invitations_0_invitation_title", meta_value: "Nos casamos" },
      {
        meta_key: "invitations_0_invitation_datetime",
        meta_value: "2026-10-10 18:00:00",
      },
      { meta_key: "canva_invitation_url", meta_value: "https://www.canva.com/design/x/view" },
    ]);
    const invitations = buildInvitationsFromMeta(meta);
    assert.equal(invitations.length, 1);
    assert.equal(invitations[0]?.theme, "hojas");
    assert.equal(invitations[0]?.datetime, "2026-10-10T18:00");
  });

  it("unserialize PHP de grupo ACF", () => {
    const serialized =
      'a:2:{s:10:"public_key";s:7:"APP-PUB";s:12:"access_token";s:6:"SECRET";}';
    const parsed = maybeUnserialize(serialized) as Record<string, string>;
    assert.equal(parsed.public_key, "APP-PUB");
    assert.equal(parsed.access_token, "SECRET");
    assert.equal(encryptSecret("x").startsWith("enc:v1:"), true);
  });
});

describe("WP RSVP mesas y abonar tarjeta", () => {
  it("resuelve table_label en vez del índice", () => {
    const meta = rowsToMeta([
      { meta_key: "rsvp_tables", meta_value: "2" },
      { meta_key: "rsvp_tables_0_table_label", meta_value: "Mesa jardín" },
      { meta_key: "rsvp_tables_1_table_label", meta_value: "Mesa salón" },
    ]);
    const labels = buildRsvpTableLabels(meta);
    assert.equal(resolveRsvpTableName("0", labels), "Mesa jardín");
    assert.equal(resolveRsvpTableName("1", labels), "Mesa salón");
    assert.equal(resolveRsvpTableName("Mesa jardín", labels), "Mesa jardín");
  });

  it("mapea abonar tarjeta y pagos históricos", () => {
    const meta = rowsToMeta([
      { meta_key: "titulo_abonar_tarjeta", meta_value: "Abonar pasaje" },
      { meta_key: "valor_referencia_tarjeta", meta_value: "15000" },
      { meta_key: "texto_monto_tarjeta", meta_value: "Por invitado" },
      {
        meta_key: "tarjeta_pagos",
        meta_value: JSON.stringify([
          {
            nombre: "Ana",
            monto: 15000,
            comprobante_url: "http://localhost/wp-content/uploads/comp.jpg",
            fecha: "2026-01-02T12:00:00.000Z",
          },
        ]),
      },
    ]);
    const abonar = buildAbonarTarjetaFromMeta(meta);
    assert.equal(abonar?.titulo, "Abonar pasaje");
    assert.equal(abonar?.valor_referencia, "15000");
    assert.equal(abonar?.pagos.length, 1);
    assert.equal(abonar?.pagos[0]?.nombre, "Ana");
    assert.equal(
      abonar?.pagos[0]?.comprobante_url,
      "https://debodas.com.ar/wp-content/uploads/comp.jpg",
    );
  });
});

describe("phpass WordPress", () => {
  it("verifica hashes $P$ round-trip", () => {
    const hashed = hashPhpass("clave-de-prueba", 8);
    assert.equal(isPhpassHash(hashed), true);
    assert.equal(verifyPhpass("clave-de-prueba", hashed), true);
    assert.equal(verifyPhpass("otra", hashed), false);
  });
});
