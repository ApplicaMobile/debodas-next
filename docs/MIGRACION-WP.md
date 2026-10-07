# Migración WordPress → Next (motor `src/lib/wp-import`)

## Esquema

El repo maneja el esquema con `prisma db push` (no hay carpeta `prisma/migrations`).
Estos cambios se aplican con `npm run db:push`. SQL equivalente (generado con
`prisma migrate diff`), por si hay que revisarlo o aplicarlo a mano:

```sql
ALTER TABLE `users` ADD COLUMN `legacy_password_hash` VARCHAR(255) NULL,
    ADD COLUMN `legacy_wp_user_id` INTEGER NULL,
    ADD COLUMN `migrated_from_wp` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `welcome_seen_at` DATETIME(3) NULL;

CREATE TABLE `legacy_map` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(32) NOT NULL,
    `wp_id` INTEGER NOT NULL,
    `prisma_id` VARCHAR(191) NOT NULL,
    `source_hash` CHAR(64) NULL,
    `imported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `run_id` VARCHAR(64) NULL,
    INDEX `legacy_map_kind_prisma_id_idx`(`kind`, `prisma_id`),
    UNIQUE INDEX `legacy_map_kind_wp_id_key`(`kind`, `wp_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `legacy_media` (
    `id` VARCHAR(191) NOT NULL,
    `wp_attachment_id` INTEGER NULL,
    `original_url` VARCHAR(768) NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `new_path` VARCHAR(1024) NOT NULL,
    `bytes` INTEGER NOT NULL,
    `content_type` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `legacy_media_original_url_key`(`original_url`),
    INDEX `legacy_media_sha256_idx`(`sha256`),
    INDEX `legacy_media_wp_attachment_id_idx`(`wp_attachment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `users_legacy_wp_user_id_key` ON `users`(`legacy_wp_user_id`);
CREATE INDEX `users_migrated_from_wp_idx` ON `users`(`migrated_from_wp`);
```

> Recomendado: dump de WordPress en una base aparte (`debodas_wp_legacy`) con
> `WP_DATABASE_URL`, así `db push` nunca ve tablas `wp_*`.

## Contraseñas

- `$wp$2y$…` (WP ≥ 6.8): `bcrypt.compare(base64(HMAC-SHA384(trim(clave), "wp-sha384")), hash.slice(3))`.
- `$2y$` puro: se copia tal cual a `password_hash`.
- `$P$` (phpass) y MD5 de 32 caracteres: se verifican igual que `wp_check_password`.
- El import guarda el hash original en `legacy_password_hash` y un bcrypt aleatorio de relleno en `password_hash`.
  En el login, si falla bcrypt y hay hash legado, se verifica, se guarda bcrypt nuevo y se vacía el legado.
  `/recuperar` también vacía el legado.
- Re-importar nunca toca `password_hash` ni `legacy_password_hash` de un usuario existente.

## CLI

```bash
npm run db:import-wp -- --dry-run            # reporte, sin escrituras
npm run db:import-wp                         # --only-new (por defecto)
npm run db:import-wp -- --changed            # cambió en WP y no se editó en Next
npm run db:import-wp -- --ids=123,456
npm run db:import-wp -- --limit=20
npm run db:import-wp -- --overwrite          # DESTRUCTIVO (staging); con NODE_ENV=production exige --force
npm run db:import-wp -- --log-dir=./backups/wp-import-logs
```

Cada corrida escribe `wp-import-<runId>.jsonl` y `wp-import-<runId>-report.json`
(por defecto en el tmp del sistema, p. ej. `/tmp/debodas-wp-import/`) y, si no es
dry-run, una fila `admin.wp.import_cli` en `admin_audit_logs`.

Notas:
- Identidad por ID de WP (`legacy_map`). Un slug repetido se importa como `slug-<wpId>` con aviso `DUPLICATE_SLUG`.
- Bodas importadas con el motor anterior (sin `legacy_map`) se adoptan sin tocarlas (`NO_BASELINE`); para refrescarlas, `--overwrite` en staging.
- `--changed` detecta ediciones en Next por `updatedAt` de la boda y de sus hijos; borrar un hijo en Next no deja rastro, así que en el cutover conviene el freeze.
- `--overwrite` nunca borra regalos confirmados que estén atados a un pago de Next.
- Al importar, las URLs ya rehosteadas (`legacy_media`) se reemplazan por la ruta nueva.

## Rehost

```bash
npm run db:rehost-blob -- --dry-run --from-uploads-dir=/ruta/wp-content/uploads
npm run db:rehost-blob -- --from-uploads-dir=/ruta/wp-content/uploads --max-mb=25
```

Archivos en `public/uploads/migrated/media/<aa>/<sha256>.<ext>` (o Blob). Dedupe global por
sha256 del contenido + `legacy_media` (re-ejecutable). Cubre destacada, banner, regalos, galería,
comprobantes y cualquier URL de `wp-content/uploads` dentro de `misc` (invitations, dress_code,
tarjeta_pagos). HEIC → JPG solo si `sharp` está instalado (no es dependencia directa).
Límite por archivo: `--max-mb` o `WP_REHOST_MAX_MB` (por defecto 25 MB).

## Bienvenida

`shouldShowMigrationWelcome(user)` y `getMigrationWelcomeForSession()` en
`src/lib/account/migration-welcome.ts`; la acción `markMigrationWelcomeSeenAction()` en
`src/lib/account/actions/migration-welcome.ts`.
