export function buildMicrositePublicUrl(
  baseUrl: string,
  slug: string,
): string {
  return `${baseUrl.replace(/\/$/, "")}/bodas/${encodeURIComponent(slug)}`;
}

export function buildDefaultWhatsAppMessage(input: {
  coupleName: string;
  micrositeUrl: string;
  hasPassword?: boolean;
}): string {
  const name = input.coupleName.trim() || "Nosotros";
  const lines = [
    `🎉✨ ${name}!`,
    "",
    "¡Nos casamos en muy poquito tiempo, y cada vez falta menos!",
    "💍💎",
    "Por eso necesitamos que nos confirmen su asistencia, ingresando al siguiente link...",
    input.micrositeUrl,
  ];

  if (input.hasPassword) {
    lines.push(
      "",
      "El sitio tiene contraseña: pedinosela a los novios si no la tienen.",
    );
  }

  lines.push("", "Los esperamos!!!", `#${name}`);
  return lines.join("\n");
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
