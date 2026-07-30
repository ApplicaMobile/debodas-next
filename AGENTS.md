# Guía para agentes — DeBodas Web

Este documento define **contexto, arquitectura y reglas** para cualquier agente o LLM que trabaje en `debodas-web`. Leerlo antes de implementar cambios.

## Qué es este proyecto

- **Frontend nuevo** de DeBodas: micrositios de bodas, landing, auth, panel de novios, pagos, RSVP, calificaciones e Instagram.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + **Prisma + MariaDB**.
- **Sin WordPress en runtime.** No depender del tema PHP `C:\xampp\htdocs\debodas` ni del plugin API para funcionar.
- **Estado actual:** app funcional local con MariaDB; fallback mock en `src/data/` si MySQL no responde.

Referencia visual/comportamiento de producción: tema WordPress en `debodas/` (ACF, CPT `boda`, ~70 endpoints AJAX). Usarlo solo como **especificación**, no como dependencia.

## Alcance del cutover (go-live)

**Incluye:** micrositio + panel `/mi-cuenta` + pagos (MP/transferencia) + RSVP + temas + planes + calificaciones + Instagram + emails transaccionales.

**Fuera de v1:** carritos abandonados y extras WooCommerce.

## Comandos

```powershell
cd C:\xampp\htdocs\debodas-web
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
npm run db:push  # schema → MariaDB (XAMPP)
npm run db:seed  # boda demo + usuario
npm run db:studio
npm run db:backup # mysqldump → ./backups
npm run db:rehost-blob # WP images → Blob/local (ver docs/DEPLOY.md)
```

## MariaDB local (XAMPP)

- **BD:** `debodas_web` — crear con `prisma/init.sql` o phpMyAdmin.
- **URL:** `DATABASE_URL=mysql://root:@localhost:3306/debodas_web` en `.env.local`
- **ORM:** Prisma (`prisma/schema.prisma`, provider `mysql`).
- **Lectura:** `src/lib/bodas/queries.ts` → `getBodaBySlug()`.
- **Mapper:** `src/lib/bodas/mapper.ts` → tipo `Boda`.
- **Seed:** `demo@debodas.local` / `demo1234`, slug `demo`.
- Si MySQL no está disponible, usar mock sin romper la app.

## Estructura del repo

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── login/ registro/
│   ├── calificar/               # Formulario público de calificaciones
│   ├── mi-cuenta/               # Panel novios (protegido)
│   ├── bodas/[slug]/            # Micrositio + gracias regalos
│   └── api/
│       ├── webhooks/mercadopago/
│       └── cron/                # Ratings + emails + maintenance (CRON_SECRET)
├── components/
│   ├── home/                    # Hero, planes, temas, reviews, Instagram
│   ├── layout/
│   ├── microsite/
│   ├── account/
│   ├── auth/
│   └── themes/
├── lib/
│   ├── email/                   # SMTP + cola persistente + templates
│   ├── auth/ bodas/ account/ admin/ payments/ mercadopago/
│   ├── ratings/ upload/         # local o Vercel Blob
│   └── db/prisma.ts
├── data/                        # Mock fallback + social.ts
└── types/boda.ts

prisma/schema.prisma
public/assets/img/themes/
public/uploads/                  # Solo local; en prod → storage cloud
```

## Rutas

| Ruta | Tipo | Notas |
|------|------|-------|
| `/` | Dynamic | Home: reviews desde BD + CTA Instagram (perfil) |
| `/login` `/registro` | Dynamic | Auth MariaDB |
| `/mi-cuenta/*` | Dynamic | Panel novios (sesión JWT) |
| `/admin/*` | Dynamic | Panel interno (solo `role=admin`) |
| `/admin/estado` | Dynamic | Salud del sistema (BD, SMTP, cola, cron, storage, MP) |
| `/bodas/[slug]` | Dynamic | Micrositio; demo en `/bodas/demo` |
| `/calificar?bodaId=` | Dynamic | Calificación post-boda |
| `/api/webhooks/mercadopago` | Route | Pagos regalos/plan |
| `/api/cron/rating-emails` | Route | Solicitar calificación (Bearer `CRON_SECRET`) |
| `/api/cron/email-queue` | Route | Procesar cola SMTP (Bearer `CRON_SECRET`) |
| `/api/cron/maintenance` | Route | Limpieza rate limits / emails / auditoría |

## Reglas Next.js (App Router)

Documentación oficial: [Next.js Docs](https://nextjs.org/docs) — versión del proyecto: **16.x**.

### Server vs Client Components

- **Por defecto:** Server Components en `app/` y componentes sin interactividad.
- **`"use client"`** solo cuando hace falta: hooks, event handlers, APIs del browser, context providers.
- **Patrón micrositio:** `page.tsx` (server) → `ThemeProvider` + `MicrositeDemo` (client).

### Params y searchParams (Next.js 15+)

`params` y `searchParams` son **Promises**. Siempre await.

### Datos

- **Primario:** Prisma/MariaDB.
- **Fallback:** mock en `src/data/` si no hay BD.
- Server Actions para mutaciones; emails se encolan en MariaDB y el cron los envía con reintentos.
- No fetch a WordPress salvo pedido explícito.

### Imports

- Alias `@/` → `src/`.
- Temas desde `@/lib/themes`.
- Emails desde `@/lib/email`.

### Estilos

- Landing: Tailwind + `globals.css`.
- Micrositio: `microsite-themes.css` + variables vía `ThemeProvider`.

### Imágenes / uploads

- SVGs de temas en `/public/assets/img/themes/`.
- Uploads: `src/lib/upload/local.ts` — local `public/uploads/` o Vercel Blob si `BLOB_READ_WRITE_TOKEN` está definido.
- Deploy: ver `docs/DEPLOY.md`.

## Sistema de temas del micrositio

**Fuente de verdad:** `src/lib/themes/registry.ts` + `types.ts`.

### Slugs válidos

`base`, `hojas`, `flores`, `manantial`, `marfil`, `mariposas-azules`, `marco-verde`, `marco-blanco`, `marco-flores-inferiores`

Validar con `isThemeSlug()` / `getTheme()`.

### Modos de banner (`bannerMode`)

| Modo | Comportamiento |
|------|----------------|
| `svg-hero` | SVG `{slug}-home.svg`; con foto: foto debajo + SVG encima |
| `frame-overlay` | Marco SVG; algunos ocultan marco si hay foto |
| `full-background` | Fondo fijo (marfil) |

### Componentes de tema (orden obligatorio)

```
ThemeProvider
  └── ThemeSwitcher (solo demo/dev; dentro del provider)
  └── ThemeBanner
  └── ThemeSection / MicrositeSectionTitle
```

## Emails (SMTP + cola persistente)

- Transporte: `src/lib/email/client.ts` (Nodemailer / SMTP).
- Cola cifrada: `src/lib/email/queue.ts`; worker y reintentos: `src/lib/email/worker.ts`.
- Templates: `src/lib/email/templates.ts`
- Notifiers: `src/lib/email/notify.ts`
- Triggers: RSVP (`submitPublicRsvpAction`), regalo transferencia / MP aprobado, plan aprobado, solicitud/agradecimiento de calificación.

## Calificaciones

- Modelo Prisma `Rating` (ligado a `Boda`).
- Público: `/calificar?bodaId=...` (solo después de la fecha del evento).
- Home: ratings con `status=approved` (fallback a mock si no hay).
- Cron: `/api/cron/rating-emails` encola; el worker marca `ratingEmailSentAt` sólo tras envío SMTP.

## Instagram / redes

- URLs fijas en `src/data/social.ts` (como ACF `options_social_networks` en WP).
- Home: CTA a perfil (`InstagramSection`). Footer: links IG + Facebook.
- **No** se usa Instagram Graph API ni Smash Balloon.

## Qué NO hacer

- No acoplar runtime a WordPress/XAMPP.
- No commitear `.env.local` ni secretos.
- No crear commits ni push salvo que el usuario lo pida.
- No expandir scope: cambios mínimos y enfocados.
- No poner `ThemeSwitcher` fuera de `ThemeProvider`.
- No usar Pages Router — solo App Router.
- No agregar dependencias pesadas sin necesidad clara.
- No bloquear mutaciones críticas si falla el envío de email.

## Principios de código

1. **Scope mínimo** — diff pequeño y correcto.
2. **Convenciones existentes** — leer código circundante antes de escribir.
3. **Comentarios** — solo para lógica de negocio no obvia.
4. **Tests** — solo si el usuario lo pide.
5. **Idioma UI** — español (Argentina).

## Roadmap

1. ~~Demo + temas visuales~~
2. ~~Auth JWT + MariaDB/Prisma~~
3. ~~Panel `/mi-cuenta` (CRUD boda, regalos, RSVP, tema, etc.)~~
4. ~~Planes + MercadoPago (regalos y upgrade)~~
5. ~~Emails transaccionales (SMTP + cola persistente)~~
6. ~~Calificaciones + cron~~
7. ~~Instagram en home~~
8. ~~Panel admin interno (`/admin`)~~
9. ~~Storage cloud listo (Vercel Blob vía `BLOB_READ_WRITE_TOKEN`)~~
10. Deploy (Vercel) + dominio + secrets prod — ver `docs/DEPLOY.md`
11. Migración de datos desde WordPress
12. Cutover DNS; WP solo-lectura / apagado

## Variables de entorno

```env
DATABASE_URL=mysql://root:@localhost:3306/debodas_web
AUTH_SECRET=...                    # JWT (mín. 16 chars)
NEXT_PUBLIC_APP_URL=http://localhost:3000

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_SANDBOX=true
MERCADOPAGO_WEBHOOK_SECRET=
# true = rechaza notificaciones sin firma válida (recomendado si solo usás la app MP de DeBodas)
# MERCADOPAGO_WEBHOOK_STRICT=true
PLAN_BASICO_PRICE_ARS=50000
PLAN_PREMIUM_PRICE_ARS=90000

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM="DeBodas <noreply@debodas.com.ar>"
EMAIL_ADMIN=hola@debodas.com.ar
EMAIL_QUEUE_SECRET=...            # opcional; fallback AUTH_SECRET
EMAIL_LOG_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=180

CRON_SECRET=...                    # Bearer para /api/cron/*
BLOB_READ_WRITE_TOKEN=...          # Vercel Blob; si falta, uploads locales

NEXT_PUBLIC_API_URL=...            # legacy WP, opcional
```

Redes: editar `src/data/social.ts` (no van en `.env`).
Deploy: ver `docs/DEPLOY.md`.

## Auth

- Login: `src/lib/auth/actions.ts` + `verifyCredentials()` → `users`.
- Sesión: cookie httpOnly `debodas_session` (JWT con `jose` + `sessionVersion`).
- Al cambiar contraseña (reset) se incrementa `User.sessionVersion` y las sesiones previas quedan inválidas.
- Accesos admin (`login`/`logout`) se registran en auditoría.
- Roles: `couple` (default) | `admin` (`User.role`).
- Protección `/mi-cuenta`: layout de cuenta.
- Protección `/admin`: `requireAdmin()` — solo `role=admin`.
- Demo pareja: `demo@debodas.local` / `demo1234`.
- Demo admin: `admin@debodas.local` / `admin1234` → `/admin`.

## Checklist antes de terminar una tarea

- [ ] `npm run build` pasa sin errores
- [ ] Server/Client boundaries respetados
- [ ] Temas nuevos registrados en `registry.ts` + assets en `public/`
- [ ] Sin secretos en el diff
- [ ] Emails no bloquean el flujo principal
- [ ] Cambios alineados con este documento

## Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Nodemailer](https://nodemailer.com/)
- Tema WP legacy: `C:\xampp\htdocs\debodas\inc\functions\debodas-themes.php`
- Calificaciones WP: `debodas/inc/functions/calificaciones.php`
