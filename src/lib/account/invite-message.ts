export function buildMicrositePublicUrl(
  baseUrl: string,
  slug: string,
  password?: string,
): string {
  const base = `${baseUrl.replace(/\/$/, "")}/bodas/${encodeURIComponent(slug)}`;
  const pass = password?.trim();
  if (!pass) {
    return base;
  }
  return `${base}?pass=${encodeURIComponent(pass)}`;
}

export function buildDefaultWhatsAppMessage(input: {
  coupleName: string;
  micrositeUrl: string;
}): string {
  const name = input.coupleName.trim() || "Nosotros";
  return [
    `🎉✨ ${name}!`,
    "",
    "¡Nos casamos en muy poquito tiempo, y cada vez falta menos!",
    "💍💎",
    "Por eso necesitamos que nos confirmen su asistencia, ingresando al siguiente link...",
    input.micrositeUrl,
    "",
    "Los esperamos!!!",
    `#${name}`,
  ].join("\n");
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
