-- Una sola MySQL: Prisma (users, bodas, …) convive con wp_* del dump WordPress.
-- MARIADB_DATABASE ya crea `debodas_web`. No crear un segundo schema.

CREATE DATABASE IF NOT EXISTS debodas_web
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
