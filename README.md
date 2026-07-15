# DeBodas Web — Demo local React (sin WordPress)

Frontend Next.js con **MariaDB local (XAMPP)** + fallback a datos mock.

**Agentes / LLMs:** leer [AGENTS.md](./AGENTS.md) antes de modificar el proyecto.

## Levantar en local (con MariaDB)

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
Usuario demo: `demo@debodas.local` / `demo1234` → redirige a `/mi-cuenta`

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

## Build producción local

```powershell
npm run build
npm run start
```

## Scripts de base de datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:push` | Sincroniza schema Prisma → MariaDB |
| `npm run db:seed` | Carga boda demo + usuario |
| `npm run db:studio` | UI visual de Prisma |

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
4. Webhook MP: `/api/webhooks/mercadopago?bodaId=...` (requiere `NEXT_PUBLIC_APP_URL` pública en prod).
5. Upgrade de plan: `/mi-cuenta/plan` usa `MERCADOPAGO_ACCESS_TOKEN` de la app.

Tras cambios al schema Prisma:

```powershell
npm run db:push
npm run db:seed
```

## Próximos pasos

1. Storage cloud para uploads (Vercel no persiste `public/uploads`)
2. Deploy + emails (RSVP / regalos / plan)
3. Migración de datos desde WordPress (si aplica)
