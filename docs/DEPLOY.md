# Checklist de deploy / cutover — DeBodas Web

## Pre-requisitos

- [ ] Repo en GitHub
- [ ] Proyecto en [Vercel](https://vercel.com) (o host Node compatible)
- [ ] Base MariaDB/MySQL en cloud (PlanetScale, RDS, Railway, etc.)
- [ ] Dominio apuntando (o staging `*.vercel.app` primero)

## Variables en producción

Copiar desde `.env.example` y completar:

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | MySQL/MariaDB cloud |
| `AUTH_SECRET` | Secreto largo (≥16 chars) |
| `NEXT_PUBLIC_APP_URL` | URL pública final (`https://debodas.com.ar`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token **producción** |
| `MERCADOPAGO_SANDBOX` | `false` en prod |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret de Webhooks (panel MP → configurar notificaciones) |
| `MERCADOPAGO_WEBHOOK_STRICT` | `true` para rechazar notificaciones sin firma |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor SMTP de producción |
| `SMTP_USER`, `SMTP_PASSWORD` | Credenciales SMTP |
| `EMAIL_FROM` | Ej. `DeBodas <noreply@debodas.com.ar>` |
| `EMAIL_ADMIN` | Inbox interno |
| `EMAIL_QUEUE_SECRET` | Secreto largo para cifrar emails en cola (opcional si se reutiliza `AUTH_SECRET`) |
| `CRON_SECRET` | Igual en Vercel Cron |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (uploads persistentes) |

Headers de seguridad (en `next.config.ts`): `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, y HSTS en prod. `/api/geocode` limita 30 req/min por IP.

Sin `BLOB_READ_WRITE_TOKEN` los uploads van a `public/uploads/` (no persistente en Vercel).

### Rehost de imágenes migradas (WP → Blob)

Tras `npm run db:import-wp`, las fotos suelen quedar en `https://debodas.com.ar/wp-content/uploads/...`.
Para copiarlas a Blob (o a `public/uploads` sin token):

```powershell
npm run db:rehost-blob -- --dry-run
npm run db:rehost-blob -- --limit=50
npm run db:rehost-blob
```

Opcional: `--hosts=debodas.com.ar,test.debodas.com.ar`

No definir `EMAIL_TEST_TO` en producción: esa variable redirige la mayoría de
los correos al inbox de pruebas (excepto `password_reset`, que siempre va al usuario).

## Deploy

1. `npm run build` local OK
2. Push a `main` / conectar Vercel
3. Setear env vars en Vercel
4. En Vercel → Storage → Blob → crear store y copiar token
5. Correr migraciones: `npx prisma db push` (o migrate) contra la BD cloud
6. Seed solo en staging: `npm run db:seed`
7. Configurar webhook MP: `{APP_URL}/api/webhooks/mercadopago` (y `?bodaId=...` si aplica).
   - En el panel MP → Webhooks, copiá el **secret** a `MERCADOPAGO_WEBHOOK_SECRET`.
   - En prod conviene `MERCADOPAGO_WEBHOOK_STRICT=true` si todos los pagos usan la misma app MP.
8. Verificar crons `/api/cron/rating-emails`, `/api/cron/email-queue` y `/api/cron/maintenance` (Bearer `CRON_SECRET`)

## Verificación de emails

- [ ] SPF, DKIM y DMARC configurados para el dominio remitente
- [ ] `/api/cron/email-queue` ejecutándose al menos cada 5 minutos
- [ ] Enviar un email real y confirmar estado `sent` en `/admin/emails`
- [ ] Confirmar que `EMAIL_TEST_TO` no existe en producción
- [ ] Revisar periódicamente contadores `failed` y `blocked`
- [ ] Probar el reintento manual desde el panel
- [ ] Revisar `/admin/estado` (alertas de cola, cron atrasado, SMTP/MP/storage)
- [ ] Confirmar cron de mantenimiento diario y retención (`EMAIL_LOG_RETENTION_DAYS`, `AUDIT_LOG_RETENTION_DAYS`)

## Backups MariaDB

En Vercel el app no hace dump nativo. Programar backup fuera de la app:

- Local/XAMPP: `npm run db:backup` (usa `mysqldump` → carpeta `backups/`)
- Producción: snapshot del proveedor (RDS/PlanetScale/Railway) o `mysqldump` diario en un runner
- Conservar al menos 7–14 días de dumps cifrados fuera del servidor web

## Cutover DNS

1. Staging con datos migrados / smoke test (registro, RSVP, regalos, admin)
2. WP en solo-lectura
3. Apuntar DNS al deploy Next
4. Monitorear 48–72h
5. Apagar altas nuevas en WP

## Admin interno

- URL: `/admin`
- Usuario seed local: `admin@debodas.local` / `admin1234`
- En prod: crear admin a mano (`role=admin`) o seed controlado
