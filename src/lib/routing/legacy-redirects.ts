/**
 * Redirects 301 de URLs del WordPress viejo que no existen en Next.
 * (Los de /boda/*, /login/, /checkout, /wp-login.php, etc. viven en next.config.ts.)
 * Se aplican desde `src/middleware.ts`.
 */

const EXACT: Record<string, string> = {
  "/terminos-y-condiciones": "/terminos",
  "/verificacion-de-email": "/login",
  "/tienda": "/",
  "/blog": "/",
  "/feed": "/",
  // Entradas del blog viejo (post-sitemap.xml de Yoast, 4/10/2026).
  "/maquillaje-ultra-fino": "/",
  "/hola-mundo": "/",
  "/li-europan-lingues-es-membres-del-sam-familie": "/",
  "/li-europan-lingues-es-membres-del-sam-familie-2": "/",
};

/** Prefijos: la ruta base y todo lo que cuelga de ella. */
const PREFIXES: Array<[string, string]> = [
  ["/producto", "/"],
  ["/categoria-producto", "/"],
  ["/regalo", "/"],
  ["/regalos-categorias", "/"],
  ["/blog", "/"],
  ["/category", "/"],
  ["/author", "/"],
  ["/tag", "/"],
];

/** Devuelve el destino 301 para una ruta vieja de WordPress, o null. */
export function legacyRedirectFor(pathname: string): string | null {
  let path = pathname.toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path) path = "/";
  const exact = EXACT[path];
  if (exact) return exact;
  for (const [prefix, destination] of PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return destination;
    }
  }
  return null;
}
