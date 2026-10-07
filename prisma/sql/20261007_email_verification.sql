-- 20261007_email_verification.sql
-- Verificación de email en el registro + tabla genérica de códigos de un solo uso.
--
-- Incremental sobre 20261007_account_status.sql (aplicar ese antes). Generado con
--   prisma migrate diff --from-schema-datamodel <schema antes> --to-schema-datamodel prisma/schema.prisma --script
-- y completado a mano con el backfill. El proyecto sincroniza con `prisma db push`
-- (no hay prisma/migrations): este archivo es para aplicar a mano (phpMyAdmin / mysql CLI).
--
-- Cambios:
--  * users.email_verified_at (NULL = registro sin verificar; default CURRENT_TIMESTAMP para
--    altas que no pasan por el registro público).
--  * account_deletion_codes -> verification_codes (columna `purpose`, único user_id+purpose).
--    Los códigos son temporales (15 min): se descarta la tabla vieja sin migrar filas.
--  * Backfill: todos los usuarios existentes (incluidos los migrados de WordPress) quedan
--    verificados con su fecha de alta. Correrlo ANTES (o junto) del deploy del código nuevo.

-- DropForeignKey
ALTER TABLE `account_deletion_codes` DROP FOREIGN KEY `account_deletion_codes_user_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verified_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Backfill: usuarios existentes = verificados (con su fecha de alta, no la de esta migración).
UPDATE `users` SET `email_verified_at` = `created_at`;

-- DropTable
DROP TABLE `account_deletion_codes`;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(32) NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `sent_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `verification_codes_user_id_purpose_key`(`user_id`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verification_codes` ADD CONSTRAINT `verification_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;