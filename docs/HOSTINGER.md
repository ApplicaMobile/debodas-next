# Deploy DeBodas Next en Hostinger Business Web Apps

El plan **Business Web Hosting** incluye Node.js Web Apps (Next.js SSR). No se convierte el WordPress de `public_html`: se crea un **sitio Node nuevo**.

## Qué queda en Hostinger

- Dominio y DNS
- MySQL (una BD `debodas_web`: tablas Prisma + dump `wp_*`)
- SMTP (`smtp.hostinger.com`)
- Disco para `public/uploads/` (no hace falta Vercel Blob)
- App Next.js como Web App

## Staging (obligatorio)

Hostinger no deja montar Node sobre un website PHP que ya usa el mismo dominio. Usá un subdominio:

1. En hPanel → **Websites** → **Add website** / **Web Apps** → Next.js.
2. Dominio: `next.debodas.com.ar` (o el que elijas).
3. GitHub: repo `debodas-next`, branch `main`.
4. Node.js **22** (o 20).
5. Build: `npm run build` (`prisma generate && next build`).
6. Start: `npm start` (`next start -H 0.0.0.0`; respeta `PORT`).

Si el dominio de producción ya está asociado a WordPress, **no lo reasignés** hasta el cutover (ver [CUTOVER.md](CUTOVER.md)).

## Variables de entorno

Copiar [`.env.example`](../.env.example) al panel de la Web App.

Mínimo staging:

```
DATABASE_URL=mysql://USER:PASS@HOST:3306/debodas_web
WP_DATABASE_URL=mysql://USER:PASS@HOST:3306/debodas_web
WP_TABLE_PREFIX=wp_
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://next.debodas.com.ar
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_SANDBOX=true
MERCADOPAGO_WEBHOOK_SECRET=...
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=DeBodas <noreply@debodas.com.ar>
EMAIL_ADMIN=hola@debodas.com.ar
CRON_SECRET=...
```

No definas `BLOB_READ_WRITE_TOKEN` en Hostinger: los uploads van a disco.

No definas `EMAIL_TEST_TO` en producción.

Tras el primer deploy:

```bash
npx prisma db push
npm run db:import-wp -- --dry-run --limit=5
npm run db:import-wp
npm run db:rehost-blob -- --dry-run
npm run db:rehost-blob
```

Si WP ya no sirve HTTP, bajá `wp-content/uploads` por SFTP y:

```bash
npm run db:rehost-blob -- --from-uploads-dir=/ruta/wp-content/uploads
```

## Crons hPanel

`vercel.json` **no corre** en Hostinger. En **Cron Jobs** (o Tareas programadas) creá tres jobs que peguen a la app con el secreto:

Cola de emails (cada 5 minutos):

```bash
curl -fsS -H "Authorization: Bearer CRON_SECRET" "https://next.debodas.com.ar/api/cron/email-queue"
```

Calificaciones (diario, 12:00 UTC aprox.):

```bash
curl -fsS -H "Authorization: Bearer CRON_SECRET" "https://next.debodas.com.ar/api/cron/rating-emails"
```

Mantenimiento (diario, 04:15 UTC):

```bash
curl -fsS -H "Authorization: Bearer CRON_SECRET" "https://next.debodas.com.ar/api/cron/maintenance"
```

Reemplazá `CRON_SECRET` por el valor real. Tras el cutover, cambiá el host a `https://debodas.com.ar`.

## RAM / CPU

Business: ~2 CPU / 3 GB RAM. En staging mirá el gráfico de recursos. Si pega el techo de forma estable, subir a **Cloud Startup antes** de mover el DNS.

## Redirects WP

Ya van en [`next.config.ts`](../next.config.ts): `/boda/:slug` → `/bodas/:slug`, checkout Woo → `/mi-cuenta/plan`, `/wp-login.php` → `/login`, `/confirmar-regalo` y `/fin-regalo` → `/`.

## Checklist rápido

- [ ] Web App Next en subdominio
- [ ] BD `debodas_web` (Prisma + dump `wp_*`)
- [ ] Env vars
- [ ] `prisma db push`
- [ ] Import + rehost fotos
- [ ] Crons hPanel
- [ ] `/admin/estado` en verde
- [ ] Webhook MP sandbox al subdominio
