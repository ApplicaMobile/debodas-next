-- 2026-10-07 · Estado de cuenta (suspender / baja lógica / borrado definitivo) + códigos de borrado.
--
-- Este proyecto sincroniza el esquema con `prisma db push` (no usa `prisma migrate`), por eso este
-- archivo NO vive en prisma/migrations: Prisma no lo ejecuta solo. Sirve para aplicar el cambio a
-- mano (phpMyAdmin / mysql) en una base que no se pueda tocar con db push. Es equivalente a
-- `prisma db push` con el schema.prisma actual, partiendo del schema que ya incluye los campos
-- legacy_* de la migración de WordPress.
--
-- Generado con:
--   prisma migrate diff --from-schema-datamodel <schema anterior> --to-schema-datamodel prisma/schema.prisma --script
--
-- Es aditivo: columnas nuevas con default / NULL y una tabla nueva. No borra ni modifica datos.
-- AlterTable
ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `erased_at` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(16) NOT NULL DEFAULT 'active',
    ADD COLUMN `status_changed_at` DATETIME(3) NULL,
    ADD COLUMN `status_reason` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `account_deletion_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `sent_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `account_deletion_codes_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_status_idx` ON `users`(`status`);

-- AddForeignKey
ALTER TABLE `account_deletion_codes` ADD CONSTRAINT `account_deletion_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

