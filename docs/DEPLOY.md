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
| `RESEND_API_KEY` | Dominio verificado en Resend |
| `EMAIL_FROM` | Ej. `DeBodas <noreply@debodas.com.ar>` |
| `EMAIL_ADMIN` | Inbox interno |
| `CRON_SECRET` | Igual en Vercel Cron |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (uploads persistentes) |

Sin `BLOB_READ_WRITE_TOKEN` los uploads van a `public/uploads/` (no persistente en Vercel).

## Deploy

1. `npm run build` local OK
2. Push a `main` / conectar Vercel
3. Setear env vars en Vercel
4. En Vercel → Storage → Blob → crear store y copiar token
5. Correr migraciones: `npx prisma db push` (o migrate) contra la BD cloud
6. Seed solo en staging: `npm run db:seed`
7. Configurar webhook MP: `{APP_URL}/api/webhooks/mercadopago?bodaId=...`
8. Verificar cron: `/api/cron/rating-emails` (Bearer `CRON_SECRET`)

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
