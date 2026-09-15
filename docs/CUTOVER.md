# Cutover WordPress → Next.js (Hostinger)

Runbook operativo. Código y staging: [HOSTINGER.md](HOSTINGER.md). Prisma y `wp_*` conviven en la misma MySQL; Next no escribe `wp_*` y **nunca** hay que resetear esa BD.

## Antes (staging en subdominio)

WP de producción sigue vivo. Next corre en `next.debodas.com.ar`.

1. Backup triple de WP (hPanel + SQL + `uploads`).
2. Crear BD MySQL `debodas_web`.
3. Deploy Web App Next (GitHub, Node 22).
4. Env de staging (`NEXT_PUBLIC_APP_URL` = subdominio, MP **TEST**).
5. `npx prisma db push`
6. `npm run db:import-wp -- --dry-run --limit=5`
7. `npm run db:import-wp`
8. `npm run db:rehost-blob` (o `--from-uploads-dir=` si HTTP falla)
9. Crons hPanel contra el subdominio
10. Webhook MP sandbox: `https://next.debodas.com.ar/api/webhooks/mercadopago`

### Humo (debe pasar todo)

- [ ] Home: pasos pareja + invitados; slider de bodas `is_online` si hay datos
- [ ] `/bodas/{slug}` con galería (`#album`) y banner
- [ ] `/mi-cuenta/banner` muestra las mismas fotos
- [ ] Login de pareja; si el hash era `$P$`, `/recuperar` funciona
- [ ] RSVP público
- [ ] Pago de regalo MP TEST o transferencia
- [ ] Upgrade de plan MP TEST (`/mi-cuenta/plan`)
- [ ] `/admin/estado` verde (BD, SMTP, cron, storage, MP)
- [ ] Mail real sale de la cola (`/admin/emails`)
- [ ] `/admin/migracion`: preview + migrar 1 boda
- [ ] Redirect `/boda/{slug}` → `/bodas/{slug}`

Si CPU/RAM del plan Business satura: Cloud Startup **antes** del DNS.

## Ventana de cutover

1. WP en mantenimiento / solo lectura (no más altas ni pagos Woo).
2. Dump final de WordPress (`wp_*`) sobre la misma MySQL `debodas_web`.
3. Re-import: `npm run db:import-wp` (idempotente por slug).
4. Rehost delta: `npm run db:rehost-blob`.
5. Backup hPanel del website PHP.
6. En hPanel: desasociar WordPress del dominio `debodas.com.ar` y asociar la Web App Next (o apuntar DNS A/CNAME según el panel).
7. `NEXT_PUBLIC_APP_URL=https://debodas.com.ar`
8. `MERCADOPAGO_SANDBOX=false` + token de **producción**
9. Webhook MP prod: `https://debodas.com.ar/api/webhooks/mercadopago` + `MERCADOPAGO_WEBHOOK_STRICT=true`
10. Actualizar URLs de los crons hPanel al dominio final
11. Mail a parejas: si no entra, usar “recuperar contraseña”

Downtime esperado: el swap de website en hPanel (minutos). Rollback: restaurar el website PHP desde el backup hPanel.

## Después (2–4 semanas)

- WP solo para consultar pedidos Woo viejos (no apagar MySQL `wp_` todavía).
- Monitorear `/admin/estado` y cola de emails 48–72 h.
- Cuando no haya tickets de “falta X”: backup SQL + `uploads`, apagar PHP/Woo. Conservar correo y `debodas_web`.

## Fuera de v1 (no bloquea)

Carritos abandonados Woo, CMS de la home, Instagram Graph API.
