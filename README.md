# DeBodas Web — Demo local React (sin WordPress)

Frontend Next.js con **MariaDB** (Docker o XAMPP) + fallback a datos mock.

**Agentes / LLMs:** leer [AGENTS.md](./AGENTS.md) antes de modificar el proyecto.

## Levantar con Docker (recomendado)

Puertos: app **3000**, MariaDB **3310**, phpMyAdmin **8889** (no pisan el WordPress en 8008/3308/8888).

```bash
cd debodas-next
docker compose up --build
```

Abrí:

- App: http://localhost:3000
- Demo: http://localhost:3000/bodas/demo
- phpMyAdmin: http://localhost:8889 (root / `debodas`, sin tope práctico de import)

Para un dump de producción grande, no subas el archivo por el navegador: copialo a `docker/phpmyadmin/uploads/` (`.sql` o `.sql.gz`) y en phpMyAdmin → **Importar** elegilo desde el directorio. Destino: base `debodas_web`.

Login demo: `demo@debodas.local` / `demo1234` → `/mi-cuenta`  
Admin: `admin@debodas.local` / `admin1234` → `/admin`

Otro admin (después de levantar Docker):

```bash
docker compose exec app npm run db:create-admin -- --email=yo@debodas.com.ar --password='clave-segura'
```

El entrypoint espera MariaDB, corre `prisma db push` + seed y arranca `next dev` con hot reload (el código está montado).

```bash
docker compose down          # para, conserva la BD
docker compose down -v       # borra también el volumen de MariaDB
```

Importar un dump WP (opcional): cargalo en la **misma** BD `debodas_web` por phpMyAdmin (puerto 8889). Las tablas `wp_*` conviven con Prisma. Después:

```bash
docker compose exec app npm run db:import-wp -- --dry-run --limit=5
docker compose exec app npm run db:import-wp
```

## Levantar en local (XAMPP, sin Docker)

### 1. XAMPP — MySQL/MariaDB

1. Iniciá **MySQL** en XAMPP.
2. Creá la base `debodas_web` en phpMyAdmin, o ejecutá:

```powershell
Get-Content prisma\init.sql | C:\xampp\mysql\bin\mysql.exe -u root
```

En **CMD** (no PowerShell) también funciona: `C:\xampp\mysql\bin\mysql.exe -u root < prisma\init.sql`

### 2. Variables de entorno

Copiá `.env.example` → `.env.local` (o verificá que tenga):

```env
DATABASE_URL="mysql://root:@localhost:3306/debodas_web"
```

Si tu root tiene contraseña: `mysql://root:TU_CLAVE@localhost:3306/debodas_web`

### 3. Instalar, migrar y seed

```powershell
cd C:\xampp\htdocs\debodas-web
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abrí: **http://localhost:3000/bodas/demo**

**Login:** http://localhost:3000/login  
Usuario demo: `demo@debodas.local` / `demo1234` → `/mi-cuenta`  
Usuario admin: `admin@debodas.local` / `admin1234` → `/admin`

### Sin MariaDB

Si MySQL no está corriendo, la app sigue funcionando con datos mock en `src/data/bodas.ts`.

## Levantar solo la demo (sin BD)

```powershell
npm install
npm run dev
```

## Rutas disponibles

| URL | Descripción |
|-----|-------------|
| `/` | Home estilo DeBodas (hero, pasos, planes, temas, testimonios) |
| `/bodas/demo` | Micrositio demo — **barra superior para cambiar entre 9 temas** |
| `/bodas/demo?theme=marco-verde` | Micrositio con tema específico |
| `/registro` | Formulario de registro (visual) |
| `/login` | Pantalla de login (visual) |

## Migración desde WordPress (dump SQL)

1. Importá el dump Hostinger en MySQL local **en `debodas_web`** (phpMyAdmin :8889 o XAMPP). Hace falta `wp_users`, `wp_posts`, `wp_postmeta` (en el repo solo está un recorte `debodas/wp_postmeta.sql`).
2. En `.env.local`:

```env
DATABASE_URL="mysql://root:@localhost:3306/debodas_web"
WP_DATABASE_URL="mysql://root:@localhost:3306/debodas_web"
WP_TABLE_PREFIX=wp_
```

3. Corré:

```powershell
npm run db:import-wp -- --dry-run --limit=5
npm run db:import-wp
```

O desde el admin: `/admin/migracion` (rol admin). El CLI usa el mismo motor.

Opciones: `--dry-run`, `--limit=N`, `--slug=mi-slug`.

Importa bodas, usuarios, regalos, RSVP, regalos confirmados, galería (`pictures` + `extra_images`), cronograma, FAQ, calificaciones, métodos de pago (tokens MP cifrados), dress code, invitaciones, Canva, abonar tarjeta y mesas RSVP. Las imágenes quedan con URL de Hostinger/`debodas.com.ar` hasta el rehost. Usuarios con hash WP viejo (`$P$`) pueden entrar: el login migra la cuenta y luego conviene `/recuperar` si el hash no era bcrypt.

**Nunca** `prisma migrate reset` ni `--accept-data-loss` en esta BD: borraría o dañaría `wp_*`.

4. Copiá las fotos al storage de Next:

```powershell
npm run db:rehost-blob -- --dry-run
npm run db:rehost-blob
```

Si WP no sirve HTTP: `npm run db:rehost-blob -- --from-uploads-dir=C:\ruta\wp-content\uploads`

Deploy Hostinger: [docs/HOSTINGER.md](./docs/HOSTINGER.md). Cutover: [docs/CUTOVER.md](./docs/CUTOVER.md).


## Scripts de base de datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:push` | Sincroniza schema Prisma → MariaDB |
| `npm run db:seed` | Carga boda demo + usuario |
| `npm run db:create-admin` | Crea o promociona un admin (`--email` `--password`) |
| `npm run db:studio` | UI visual de Prisma |
| `npm run db:import-wp` | Migra `wp_*` (misma MySQL) → tablas Prisma |
| `npm run db:rehost-blob` | Copia fotos WP → `public/uploads` (o Blob) |

## Temas del micrositio

9 temas disponibles (como en producción):

`base`, `hojas`, `flores`, `manantial`, `marfil`, `mariposas-azules`, `marco-verde`, `marco-blanco`, `marco-flores-inferiores`

Configuración en `src/lib/themes/registry.ts`. Estilos en `src/styles/microsite-themes.css`.

## Estructura

```
src/
├── app/                     # Páginas Next.js
├── components/
│   ├── home/                # Secciones de la landing
│   ├── layout/              # Header y footer
│   └── microsite/           # Vista demo del micrositio
├── data/                    # Mock fallback
├── lib/
│   ├── bodas/               # queries + mapper
│   └── db/                  # Prisma client
prisma/
├── schema.prisma            # Modelos MariaDB
└── seed.ts                  # Datos demo
```

## Datos

- **Primario:** MariaDB vía Prisma (`getBodaBySlug` en `src/lib/bodas/queries.ts`).
- **Fallback:** mock en `src/data/bodas.ts` si no hay `DATABASE_URL` o MySQL no responde.

## Notas

- Las imágenes del hero/planes usan URLs de `test.debodas.com.ar` (requiere internet).
- Los SVG de temas están en `public/assets/img/themes/`.
- WordPress **no es necesario** en runtime.
- Uploads locales en `public/uploads/` (ignorados por git).
- `ThemeSwitcher` solo en desarrollo, slug `demo`, o con `?theme=...`.

## Regalos y pagos

1. En `/mi-cuenta/pagos` configurá transferencia y/o credenciales MP de la pareja.
2. En el micrositio, los invitados agregan regalos al carrito y pagan (MP checkout o transferencia).
3. Los novios ven y confirman regalos en `/mi-cuenta/regalos-recibidos`.
4. Webhook MP: `/api/webhooks/mercadopago?bodaId=...` (requiere `NEXT_PUBLIC_APP_URL` pública en prod). Configurá el secret en `/admin/mercadopago` o `MERCADOPAGO_WEBHOOK_SECRET`.
5. Upgrade de plan: `/mi-cuenta/plan` usa las credenciales de plataforma cargadas en `/admin/mercadopago` (o `MERCADOPAGO_ACCESS_TOKEN` en `.env`).

Tras cambios al schema Prisma:

```powershell
npm run db:push
npm run db:seed
```

## Próximos pasos

1. Staging Hostinger (subdominio) — [`docs/HOSTINGER.md`](./docs/HOSTINGER.md)
2. Migración de datos + fotos — `db:import-wp` / `db:rehost-blob`
3. Cutover DNS — [`docs/CUTOVER.md`](./docs/CUTOVER.md)

## Emails, calificaciones e Instagram

- **Emails:** SMTP (Hostinger) con cola persistente, contenido cifrado y reintentos. Worker: `/api/cron/email-queue` con `Authorization: Bearer CRON_SECRET`.
- **Calificar:** `/calificar?bodaId=...` (solo post-fecha). Cron diario: `/api/cron/rating-emails` con `Authorization: Bearer CRON_SECRET`.
- **Instagram/Facebook:** URLs en `src/data/social.ts` (perfil público, sin Graph API).
- **Uploads:** local `public/uploads/` o Vercel Blob si hay `BLOB_READ_WRITE_TOKEN`.
- Aprobar ratings en BD (`status = approved`) o desde `/admin/calificaciones` para la home.

## Panel admin

- URL: `/admin` — login `admin@debodas.local` / `admin1234`
- Bodas (filtro, detalle, CSV, plan, pedido de calificación), calificaciones, usuarios (roles), pagos/regalos
