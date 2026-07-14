# Guía para agentes — DeBodas Web

Este documento define **contexto, arquitectura y reglas** para cualquier agente o LLM que trabaje en `debodas-web`. Leerlo antes de implementar cambios.

## Qué es este proyecto

- **Frontend nuevo** de DeBodas: micrositios de bodas, landing, auth y (futuro) panel de novios.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4.
- **Sin WordPress en runtime.** No depender del tema PHP `C:\xampp\htdocs\debodas` ni del plugin API para funcionar.
- **Estado actual:** demo con **MariaDB local (Prisma)** + fallback mock en `src/data/`.

Referencia visual/comportamiento de producción: tema WordPress en `debodas/` (ACF, CPT `boda`, ~70 endpoints AJAX). Usarlo solo como **especificación**, no como dependencia.

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
├── app/                    # App Router (páginas y layouts)
│   ├── page.tsx            # Landing marketing
│   ├── login/ registro/    # UI sin backend aún
│   └── bodas/[slug]/       # Micrositio público
├── components/
│   ├── home/               # Secciones landing
│   ├── layout/             # Header, footer
│   ├── microsite/          # MicrositeDemo (secciones del micrositio)
│   └── themes/             # ThemeProvider, ThemeBanner, ThemeSection, ThemeSwitcher
│   ├── api/                # Cliente HTTP legacy WP
│   ├── bodas/              # queries, mapper
│   ├── db/                 # Prisma client
│   └── themes/             # registry.ts, types.ts
├── data/                   # Mock fallback: home.ts, bodas.ts
├── styles/
│   └── microsite-themes.css
└── types/
    └── boda.ts             # Shape de datos de una boda

public/assets/img/themes/   # SVGs de temas (home, informacion, separator)
```

## Rutas

| Ruta | Tipo | Notas |
|------|------|-------|
| `/` | Static | Home marketing |
| `/login` | Dynamic | Auth con MariaDB |
| `/mi-cuenta` | Dynamic | Panel (protegido por sesión) |
| `/bodas/[slug]` | Dynamic | Micrositio; demo en `/bodas/demo` |
| `/bodas/[slug]?theme=flores` | Query | Override de tema (solo demo/preview) |

## Reglas Next.js (App Router)

Documentación oficial: [Next.js Docs](https://nextjs.org/docs) — versión del proyecto: **16.x**.

### Server vs Client Components

- **Por defecto:** Server Components en `app/` y componentes sin interactividad.
- **`"use client"`** solo cuando hace falta: hooks (`useState`, `useEffect`, `useContext`), event handlers, APIs del browser, context providers.
- **Patrón actual del micrositio:** `page.tsx` (server) → `ThemeProvider` + `MicrositeDemo` (client).

### Params y searchParams (Next.js 15+)

En route handlers y pages, `params` y `searchParams` son **Promises**. Siempre await:

```tsx
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { theme } = await searchParams;
}
```

### Datos

- **Primario:** `getBodaBySlug()` → Prisma/MariaDB.
- **Fallback:** `getMockBodaBySlug()` en `src/data/bodas.ts`.
- Preferir **ISR** (`revalidate: 60`) al escalar; Server Actions para `/mi-cuenta`.
- No fetch a WordPress salvo pedido explícito del usuario.

### Imports y alias

- Usar alias `@/` → `src/` (configurado en `tsconfig.json`).
- Importar temas desde `@/lib/themes` o `@/lib/themes/registry`.

### Estilos

- **Landing:** Tailwind en componentes + `globals.css`.
- **Micrositio:** variables CSS por tema en `microsite-themes.css`; colores/fuentes inyectados vía `getThemeCssVariables()` en `ThemeProvider`.
- No mezclar lógica de negocio dentro de CSS; la configuración vive en `registry.ts`.

### Imágenes

- SVGs de temas en `/public/assets/img/themes/`.
- Fotos demo pueden ser URLs externas (`test.debodas.com.ar`). Para fotos de usuario futuro: Supabase Storage + `next/image` cuando aplique.

## Sistema de temas del micrositio

**Fuente de verdad:** `src/lib/themes/registry.ts` + `types.ts`.

### Slugs válidos

`base`, `hojas`, `flores`, `manantial`, `marfil`, `mariposas-azules`, `marco-verde`, `marco-blanco`, `marco-flores-inferiores`

Validar con `isThemeSlug()` / `getTheme()`. Nunca hardcodear strings sueltos sin validar.

### Modos de banner (`bannerMode`)

| Modo | Comportamiento |
|------|----------------|
| `svg-hero` | SVG `{slug}-home.svg`; con foto: foto debajo + SVG encima (como WP) |
| `frame-overlay` | Marco SVG; algunos temas ocultan marco si hay foto (`hideBannerFrameWithPhoto`) |
| `full-background` | Fondo fijo en todo el sitio (marfil) |

### Flags importantes en `MicrositeTheme`

- `unifiedDecor` — decoración fija en body (`::before`) para mariposas/marcos verdes/blancos
- `hideBannerFrameWithPhoto` — mariposas, marco-verde, marco-blanco
- `showSeparator` — `separator_{slug}.svg` bajo títulos (marfil: false)
- `bannerPhotoOverlay` — opacidad sobre foto; `false` en flores

### Componentes de tema (orden obligatorio)

```
ThemeProvider (envuelve todo el micrositio)
  └── ThemeSwitcher (solo demo; dentro del provider)
  └── ThemeBanner
  └── ThemeSection / MicrositeSectionTitle
```

**Error conocido:** `ThemeSwitcher` usa `useMicrositeTheme()` → debe estar **dentro** de `ThemeProvider`, no fuera.

### Assets por tema

- `{slug}-home.svg` — banner / hero
- `{slug}-informacion.svg` — decoración de secciones (opcional)
- `separator_{slug}.svg` — separador bajo títulos (opcional)

Al agregar un tema nuevo: copiar SVGs a `public/assets/img/themes/`, registrar en `registry.ts`, añadir estilos si hace falta en `microsite-themes.css`. Referencia PHP: `debodas/inc/functions/debodas-themes.php`.

## Modelo de datos (`Boda`)

Definido en `src/types/boda.ts`. Campos clave:

- `slug`, `couple`, `event`, `banner`, `microsite_theme`, `plan`
- `gifts_list.gifts`, `schedule`, `faq_items`, `misc.our_story`

Helpers en `src/data/bodas.ts`: `getCoupleDisplayName()`, `getBannerUrl()`, `formatPrice()`.

Al conectar backend, mantener compatibilidad con este shape o migrar con un mapper explícito en `src/lib/`.

## Qué NO hacer

- No acoplar runtime a WordPress/XAMPP.
- No commitear `.env.local` ni secretos.
- No crear commits ni push salvo que el usuario lo pida.
- No expandir scope: cambios mínimos y enfocados.
- No poner `ThemeSwitcher` fuera de `ThemeProvider`.
- No usar Pages Router (`pages/`) — solo App Router.
- No agregar dependencias pesadas sin necesidad clara.

## Principios de código

1. **Scope mínimo** — diff pequeño y correcto.
2. **Convenciones existentes** — leer código circundante antes de escribir.
3. **Comentarios** — solo para lógica de negocio no obvia.
4. **Tests** — solo si el usuario lo pide o aportan valor real.
5. **Idioma UI** — español (Argentina): "Regalos", "Confirmá", etc.

## Roadmap (orden sugerido)

1. ~~Demo + temas visuales~~ (hecho)
2. Git + deploy Vercel; ocultar ThemeSwitcher en producción
3. Supabase: auth, tabla `bodas`, lectura en `/bodas/[slug]`
4. Panel `/mi-cuenta` (CRUD boda, regalos, RSVP)
5. Planes, MercadoPago, emails

## Variables de entorno

```env
DATABASE_URL=mysql://root:@localhost:3306/debodas_web
AUTH_SECRET=...              # JWT sesión (mín. 16 chars)
NEXT_PUBLIC_API_URL=...   # legacy, opcional
```

## Auth

- Login: `src/lib/auth/actions.ts` + `verifyCredentials()` → tabla `users`.
- Sesión: cookie httpOnly `debodas_session` (JWT con `jose`).
- Protección de `/mi-cuenta`: redirect en `src/app/mi-cuenta/layout.tsx`.
- Demo: `demo@debodas.local` / `demo1234`.

## Checklist antes de terminar una tarea

- [ ] `npm run build` pasa sin errores
- [ ] Server/Client boundaries respetados
- [ ] Temas nuevos registrados en `registry.ts` + assets en `public/`
- [ ] Sin secretos en el diff
- [ ] Cambios alineados con este documento

## Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Fetching Data / ISR](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Authentication (guía)](https://nextjs.org/docs/app/guides/authentication)
- Tema WP legacy: `C:\xampp\htdocs\debodas\inc\functions\debodas-themes.php`
