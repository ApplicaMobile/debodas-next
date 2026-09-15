# Checklist de deploy / cutover — DeBodas Web

**Hosting objetivo:** Hostinger Business Web Apps (Next.js). Guía detallada: [`HOSTINGER.md`](HOSTINGER.md). Cutover DNS: [`CUTOVER.md`](CUTOVER.md).

## Pre-requisitos

- [ ] Repo en GitHub
- [ ] Web App Next.js en Hostinger (staging en subdominio; **no** sobre el WP de `public_html`)
- [ ] Base MySQL `debodas_web` en Hostinger (importar dump WP `wp_*` en la misma BD)
- [ ] SMTP y dominio Hostinger

Alternativa: Vercel + MySQL Hostinger (uploads requieren `BLOB_READ_WRITE_TOKEN`).

## Variables en producción

Copiar desde `.env.example` y completar:

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | MySQL/MariaDB cloud |
| `AUTH_SECRET` | Secreto largo (≥16 chars) |
| `NEXT_PUBLIC_APP_URL` | URL pública final (`https://debodas.com.ar`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token **producción** (también se puede cargar en `/admin/mercadopago`) |
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

En **Hostinger** no uses `BLOB_READ_WRITE_TOKEN`: los uploads van a `public/uploads/` y persisten en disco. En Vercel, sin token los uploads no sobreviven al deploy.

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

Ver [`HOSTINGER.md`](HOSTINGER.md) (recomendado) o Vercel:

1. `npm run build` local OK
2. Push a `main` / conectar Hostinger Web Apps o Vercel
3. Setear env vars (copiar `.env.example`)
4. Correr `npx prisma db push` contra MySQL
5. Import WP + rehost fotos (staging)
6. Configurar webhook MP: `{APP_URL}/api/webhooks/mercadopago`
7. Crons: en Hostinger son jobs hPanel (no `vercel.json`). En Vercel sí usan [`vercel.json`](../vercel.json).

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

Seguir [`CUTOVER.md`](CUTOVER.md). Resumen: staging en subdominio → dump final → import + fotos → swap del website PHP al Node en hPanel → webhook MP producción.

## Admin interno

- URL: `/admin`
- Usuario seed local: `admin@debodas.local` / `admin1234`
- Crear o promocionar un admin (idempotente):

```bash
npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
# en Docker:
docker compose exec app npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
```
