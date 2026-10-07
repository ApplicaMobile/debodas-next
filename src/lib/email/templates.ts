import { getAppUrl } from "@/lib/email/client";
// Base de emails (diseño de Punky). escapeHtml + emails existentes SIN CAMBIOS;
// layout() nuevo con la misma firma + helpers para plantillas en archivos propios.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/* ------------------------------------------------------------------------------------------------
 * Base de emails transaccionales de DeBodas.
 * Reemplazo directo de `layout(title, body, options)`: misma firma, mismas opciones (lang, signature)
 * y opciones nuevas opcionales. Todos los emails existentes la heredan sin tocarlos.
 * Colores = tokens de src/styles/tokens.css resueltos a hex (los clientes de mail no soportan var()).
 * ---------------------------------------------------------------------------------------------- */

export const EMAIL_COLORS = {
  page: "#F5F1E8", // crema-100 · bg-subtle
  surface: "#FFFFFF", // neutral-0 · surface-default
  surfaceMuted: "#FBF9F5", // crema-50 · bg-canvas
  infoBg: "#F5F1E8", // crema-100 · surface-muted
  inverse: "#06263A", // navy-700 · surface-inverse / action-primary-bg
  inverseHover: "#0A3550", // navy-600 · action-primary-bg-hover
  text: "#06263A", // navy-700 · text-primary (15.6:1 sobre blanco)
  textSecondary: "#57534E", // neutral-600 · text-secondary (7.6:1 blanco, 6.8:1 crema-100)
  textAccent: "#6F5F47", // crema-700 · text-accent (6.2:1)
  link: "#1E4A6B", // navy-500 · text-link (9.4:1)
  accent: "#B8995A", // oro-500 · accent-default (decorativo: filete del header)
  border: "#D4C4A8", // crema-400 · border-default
  borderSubtle: "#EDE5D8", // crema-200 · border-subtle
  onInverse: "#FFFFFF", // text-inverse
  dangerBg: "#FCEEEC", // rojo-50 · status-error-bg
  dangerFg: "#912018", // rojo-700 · status-error-fg (7.7:1)
  dangerBorder: "#B42318", // rojo-600 · status-error-border
} as const;

/** Paleta oscura (solo vía @media prefers-color-scheme / [data-ogsc] de Outlook.com). */
const DARK = {
  page: "#02111B", // navy-900
  surface: "#041B2A", // navy-800
  raised: "#06263A", // navy-700
  border: "#1E4A6B", // navy-500
  text: "#FBF9F5", // crema-50
  textSecondary: "#D5E1E9", // navy-100
  textAccent: "#D9C49A", // oro-300
  link: "#A9C0CF", // navy-200
  btnBg: "#E6DAC7", // crema-300 · action-secondary-bg
  btnFg: "#3F3A32", // crema-900 · action-secondary-fg
  dangerBg: "#3A0F0B",
  dangerFg: "#F8D5D0", // rojo-100
} as const;

const C = EMAIL_COLORS;
export const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
export const FONT_SANS = "Montserrat, Arial, Helvetica, sans-serif";
export const FONT_MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace";

const HELP_EMAIL = "hola@debodas.com.ar";

/** Textos fijos de la base (es = original de la propuesta). El pie "© … Argentina" no se traduce. */
const LAYOUT_COPY = {
  es: {
    help: "¿Necesitás ayuda? Escribinos a",
    reason:
      "Te escribimos porque tenés una cuenta en DeBodas o hiciste algo en debodas.com.ar que requiere este aviso.",
    terms: "Términos",
    privacy: "Privacidad",
    buttonFallback: "¿El botón no funciona? Copiá este enlace en tu navegador:",
  },
  en: {
    help: "Need help? Write to us at",
    reason:
      "We are writing because you have a DeBodas account or did something on debodas.com.ar that requires this notice.",
    terms: "Terms",
    privacy: "Privacy",
    buttonFallback: "Button not working? Copy this link into your browser:",
  },
  pt: {
    help: "Precisa de ajuda? Escreva para",
    reason:
      "Estamos escrevendo porque você tem uma conta no DeBodas ou fez algo em debodas.com.ar que exige este aviso.",
    terms: "Termos",
    privacy: "Privacidade",
    buttonFallback: "O botão não funciona? Copie este link no seu navegador:",
  },
} as const;

function layoutCopy(lang?: string) {
  return LAYOUT_COPY[(lang as keyof typeof LAYOUT_COPY) ?? "es"] ?? LAYOUT_COPY.es;
}

export interface EmailLayoutOptions {
  lang?: string;
  signature?: string;
  /** Texto de vista previa en la bandeja (oculto en el cuerpo). */
  preheader?: string;
  /** Línea chica en mayúsculas sobre el título (p. ej. "Verificá tu email"). */
  eyebrow?: string;
  /** Botón principal bulletproof (VML en Outlook). No usar en mails de código. */
  cta?: { label: string; href: string };
  /** Bloque secundario (HTML ya escapado): seguridad, ayuda, datos extra. */
  info?: string;
  /** "Por qué recibiste este email" (texto plano). */
  reason?: string;
  /** "danger" tiñe el filete y el eyebrow de rojo (borrado de cuenta, acciones irreversibles). */
  tone?: "default" | "danger";
}

/**
 * Base absoluta de las imágenes del email (NEXT_PUBLIC_APP_URL vía getAppUrl()).
 * En dev, getAppUrl() es localhost y Gmail no puede bajar imágenes de ahí: EMAIL_ASSETS_URL permite apuntar a prod.
 */
export function emailAssetsBaseUrl(): string {
  return (process.env.EMAIL_ASSETS_URL?.trim() || getAppUrl()).replace(/\/+$/, "");
}

/** URL absoluta del logo raster (public/assets/img/email/logo-debodas-email.png). */
export function emailLogoUrl(): string {
  return `${emailAssetsBaseUrl()}/assets/img/email/logo-debodas-email.png`;
}

/**
 * Compatibilidad con los cuerpos actuales (HTML con <p>/<a> sin estilos):
 * - margen consistente en <p> (Outlook/Gmail no siempre respetan el <style>);
 * - los links con color:#e6dac7 (1,4:1 sobre blanco, no pasa AA) pasan a navy-500 subrayado;
 * - <a> sin estilo reciben el estilo de link.
 */
function normalizeLegacyBody(body: string): string {
  const linkStyle = `color:${C.link};text-decoration:underline;font-weight:600;`;
  return body
    .replace(/<p(?:\s+style="([^"]*)")?>/g, (_m, style?: string) => `<p style="margin:0 0 16px;${style ?? ""}">`)
    .replace(/(^|[;"\s])color:#e6dac7;?/gi, `$1${linkStyle}`)
    .replace(/<a (?![^>]*\bstyle=)/g, `<a style="${linkStyle}" `);
}

/** Botón bulletproof: <a> con padding en clientes modernos, v:roundrect en Outlook Windows. Alto 52px. */
export function emailButton(input: {
  label: string;
  href: string;
  tone?: "default" | "danger";
  /** Idioma del texto de respaldo ("¿El botón no funciona?…"). */
  lang?: string;
}): string {
  const label = escapeHtml(input.label);
  const href = escapeHtml(input.href);
  const bg = input.tone === "danger" ? C.dangerBorder : C.inverse;
  const vmlWidth = Math.max(200, Math.min(520, input.label.length * 10 + 72));
  return `<table role="presentation" class="db-btn-table" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;border-collapse:separate;">
  <tr>
    <td class="db-btn" align="center" bgcolor="${bg}" style="border-radius:9999px;background-color:${bg};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="50%" stroke="f" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a class="db-btn-a" href="${href}" target="_blank" style="display:inline-block;min-width:168px;padding:14px 32px;font-family:${FONT_SANS};font-size:16px;line-height:24px;font-weight:600;letter-spacing:0.002em;color:#FFFFFF;text-align:center;text-decoration:none;border-radius:9999px;background-color:${bg};">${label}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
<p class="db-muted" style="margin:8px 0 24px;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${C.textSecondary};">${escapeHtml(layoutCopy(input.lang).buttonFallback)}<br><a href="${href}" target="_blank" style="color:${C.link};text-decoration:underline;word-break:break-all;">${href}</a></p>`;
}

/** Bloque de código de un solo uso (verificación de registro, borrado de cuenta, etc.). */
export function codeBlock(input: { code: string; label: string; note?: string }): string {
  const code = escapeHtml(input.code.replace(/\s+/g, ""));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:separate;">
  <tr>
    <td class="db-code-box" align="center" bgcolor="${C.surfaceMuted}" style="background-color:${C.surfaceMuted};border:1px solid ${C.border};border-radius:12px;padding:20px 16px;">
      <p class="db-eyebrow" style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.textAccent};">${escapeHtml(input.label)}</p>
      <p style="margin:0;font-size:0;line-height:0;"><span class="db-code db-text" style="display:inline-block;font-family:${FONT_MONO};font-size:36px;line-height:48px;font-weight:700;letter-spacing:8px;padding-left:8px;color:${C.text};-webkit-user-select:all;user-select:all;white-space:nowrap;">${code}</span></p>
      ${input.note ? `<p class="db-muted" style="margin:8px 0 0;font-family:${FONT_SANS};font-size:14px;line-height:22px;color:${C.textSecondary};">${escapeHtml(input.note)}</p>` : ""}
    </td>
  </tr>
</table>`;
}

/** Aviso destacado (por ahora solo "danger"). title y text son texto plano. */
export function calloutBlock(input: { title: string; text: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:separate;">
  <tr>
    <td class="db-danger" bgcolor="${C.dangerBg}" style="background-color:${C.dangerBg};border-left:4px solid ${C.dangerBorder};border-radius:4px;padding:16px 20px;font-family:${FONT_SANS};font-size:14px;line-height:22px;color:${C.dangerFg};">
      <strong style="display:block;margin:0 0 4px;font-size:16px;line-height:24px;font-weight:700;">${escapeHtml(input.title)}</strong>
      ${escapeHtml(input.text)}
    </td>
  </tr>
</table>`;
}

/** Layout común de los emails transaccionales (exportado para plantillas en archivos propios). */
export function layout(title: string, body: string, options: EmailLayoutOptions = {}): string {
  const lang = /^[a-z]{2}$/.test(options.lang ?? "") ? options.lang : "es";
  const appUrl = getAppUrl();
  const logoUrl = emailLogoUrl();
  const copy = layoutCopy(lang);
  const danger = options.tone === "danger";
  const rule = danger ? C.dangerBorder : C.accent;
  const eyebrowColor = danger ? C.dangerFg : C.textAccent;
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(title);
  const footerLink = `color:${C.textSecondary};text-decoration:underline;`;

  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${escapeHtml(options.preheader)}${"&#847;&zwnj;&nbsp;".repeat(80)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${safeTitle}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>td,p,a,span,div,strong{font-family:Arial,Helvetica,sans-serif !important;} h1{font-family:Georgia,serif !important;} .db-code{font-family:'Courier New',monospace !important;}</style>
<![endif]-->
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;500&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  a[x-apple-data-detectors], #MessageViewBody a { color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }
  .db-body p { margin:0 0 16px; }
  .db-btn-a:hover { background-color:${C.inverseHover} !important; }
  @media only screen and (max-width:599px) {
    .db-outer { padding:16px 8px 24px !important; }
    .db-px { padding-left:20px !important; padding-right:20px !important; }
    .db-pt { padding-top:28px !important; }
    .db-h1 { font-size:24px !important; line-height:32px !important; }
    .db-code { font-size:32px !important; line-height:44px !important; letter-spacing:6px !important; padding-left:6px !important; }
    .db-btn-table { width:100% !important; }
    .db-btn-a { display:block !important; padding-left:16px !important; padding-right:16px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .db-page { background-color:${DARK.page} !important; }
    .db-card { background-color:${DARK.surface} !important; }
    .db-text, .db-text p, .db-text strong { color:${DARK.text} !important; }
    .db-muted, .db-text .db-muted, .db-footer, .db-footer p { color:${DARK.textSecondary} !important; }
    .db-eyebrow, .db-text .db-eyebrow { color:${DARK.textAccent} !important; }
    .db-eyebrow-danger { color:${DARK.dangerFg} !important; }
    .db-card a, .db-footer a { color:${DARK.link} !important; }
    .db-code-box, .db-info { background-color:${DARK.raised} !important; border-color:${DARK.border} !important; }
    .db-info, .db-info p { color:${DARK.textSecondary} !important; }
    .db-btn, .db-btn-a { background-color:${DARK.btnBg} !important; color:${DARK.btnFg} !important; }
    .db-danger { background-color:${DARK.dangerBg} !important; color:${DARK.dangerFg} !important; }
  }
  [data-ogsb] .db-page { background-color:${DARK.page} !important; }
  [data-ogsb] .db-card { background-color:${DARK.surface} !important; }
  [data-ogsc] .db-text, [data-ogsc] .db-text p { color:${DARK.text} !important; }
  [data-ogsc] .db-muted, [data-ogsc] .db-footer p { color:${DARK.textSecondary} !important; }
  [data-ogsb] .db-code-box, [data-ogsb] .db-info { background-color:${DARK.raised} !important; }
</style>
</head>
<body class="db-page" style="margin:0;padding:0;width:100%;background-color:${C.page};">
<div role="article" aria-roledescription="email" aria-label="${safeTitle}" lang="${lang}" style="font-family:${FONT_SANS};">
${preheader}
<table role="presentation" class="db-page" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="width:100%;background-color:${C.page};">
  <tr>
    <td class="db-outer" align="center" style="padding:32px 0 40px;">
      <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="db-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;border-collapse:separate;">
        <!-- SLOT header: logo -->
        <tr>
          <td class="db-px" align="left" bgcolor="${C.inverse}" style="background-color:${C.inverse};border-radius:12px 12px 0 0;padding:24px 40px;">
            <a href="${escapeHtml(appUrl)}" target="_blank" style="display:inline-block;text-decoration:none;"><img src="${escapeHtml(logoUrl)}" width="180" height="30" alt="DeBodas" style="display:block;width:180px;max-width:180px;height:30px;border:0;font-family:Georgia,serif;font-size:22px;line-height:30px;letter-spacing:0.08em;color:#FFFFFF;"></a>
          </td>
        </tr>
        <tr>
          <td height="3" bgcolor="${rule}" style="height:3px;font-size:3px;line-height:3px;background-color:${rule};">&nbsp;</td>
        </tr>
        <tr>
          <td class="db-card db-px db-pt" bgcolor="${C.surface}" style="background-color:${C.surface};border-radius:0 0 12px 12px;padding:40px 40px 32px;">
            ${options.eyebrow ? `<!-- SLOT eyebrow -->
            <p class="${danger ? "db-eyebrow-danger" : "db-eyebrow"}" style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${eyebrowColor};">${escapeHtml(options.eyebrow)}</p>` : ""}
            <!-- SLOT title -->
            <h1 class="db-h1 db-text" style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:28px;line-height:36px;font-weight:500;color:${C.text};">${safeTitle}</h1>
            <!-- SLOT body -->
            <div class="db-body db-text" style="font-family:${FONT_SANS};font-size:16px;line-height:26px;color:${C.text};">
              ${normalizeLegacyBody(body)}
            </div>
            ${options.cta ? `<!-- SLOT cta -->
            ${emailButton({ ...options.cta, lang })}` : ""}
            ${options.info ? `<!-- SLOT info -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border-collapse:separate;">
              <tr>
                <td class="db-info" bgcolor="${C.infoBg}" style="background-color:${C.infoBg};border:1px solid ${C.borderSubtle};border-radius:12px;padding:16px 20px;font-family:${FONT_SANS};font-size:14px;line-height:22px;color:${C.textSecondary};">
                  ${options.info}
                </td>
              </tr>
            </table>` : ""}
            <!-- SLOT signature -->
            <p class="db-muted" style="margin:24px 0 0;font-family:${FONT_SANS};font-size:14px;line-height:22px;color:${C.textSecondary};">${escapeHtml(options.signature ?? "Equipo DeBodas")}</p>
          </td>
        </tr>
        <!-- SLOT footer -->
        <tr>
          <td class="db-footer db-px" align="center" style="padding:24px 40px 0;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${C.textSecondary};">
            <p style="margin:0 0 12px;">${escapeHtml(copy.help)} <a href="mailto:${HELP_EMAIL}" style="${footerLink}font-weight:600;">${HELP_EMAIL}</a></p>
            <p style="margin:0 0 12px;">${escapeHtml(options.reason ?? copy.reason)}</p>
            <p style="margin:0 0 12px;"><a href="${escapeHtml(appUrl)}" target="_blank" style="${footerLink}">debodas.com.ar</a> &nbsp;·&nbsp; <a href="${escapeHtml(appUrl)}/terminos" target="_blank" style="${footerLink}">${escapeHtml(copy.terms)}</a> &nbsp;·&nbsp; <a href="${escapeHtml(appUrl)}/privacidad" target="_blank" style="${footerLink}">${escapeHtml(copy.privacy)}</a></p>
            <p style="margin:0;">© ${year} DeBodas, un servicio de Applica · Argentina</p>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</div>
</body>
</html>`;
}

export function rsvpToCoupleEmail(input: {
  coupleName: string;
  guestName: string;
  status: string;
  menu?: string;
  notes?: string | null;
  guestEmail?: string | null;
  invitadosUrl: string;
}): { subject: string; html: string } {
  const statusLabel =
    input.status === "confirmed" ? "Confirmó asistencia" : "No podrá asistir";
  const rows = [
    `<p><strong>Invitado:</strong> ${escapeHtml(input.guestName)}</p>`,
    `<p><strong>Estado:</strong> ${escapeHtml(statusLabel)}</p>`,
    input.guestEmail
      ? `<p><strong>Email:</strong> ${escapeHtml(input.guestEmail)}</p>`
      : "",
    input.menu && input.menu !== "general"
      ? `<p><strong>Menú:</strong> ${escapeHtml(input.menu)}</p>`
      : "",
    input.notes
      ? `<p><strong>Mensaje:</strong> ${escapeHtml(input.notes)}</p>`
      : "",
    `<p style="margin-top:24px;"><a href="${escapeHtml(input.invitadosUrl)}" style="color:#e6dac7;">Ver invitados</a></p>`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `RSVP: ${input.guestName} — ${statusLabel}`,
    html: layout(`Nuevo RSVP para ${input.coupleName}`, rows),
  };
}

export function giftToCoupleEmail(input: {
  coupleName: string;
  participants: string;
  amountLabel: string;
  methodLabel: string;
  pending: boolean;
  itemsSummary: string;
  panelUrl: string;
}): { subject: string; html: string } {
  const title = input.pending
    ? `Regalo pendiente de confirmar — ${input.coupleName}`
    : `¡Nuevo regalo recibido! — ${input.coupleName}`;

  const body = `
    <p><strong>De:</strong> ${escapeHtml(input.participants)}</p>
    <p><strong>Monto:</strong> ${escapeHtml(input.amountLabel)}</p>
    <p><strong>Método:</strong> ${escapeHtml(input.methodLabel)}</p>
    <p><strong>Ítems:</strong> ${escapeHtml(input.itemsSummary)}</p>
    ${input.pending ? "<p>Este regalo quedó pendiente hasta que lo confirmes en el panel.</p>" : ""}
    <p style="margin-top:24px;"><a href="${escapeHtml(input.panelUrl)}" style="color:#e6dac7;">Ver regalos recibidos</a></p>
  `;

  return { subject: title, html: layout(title, body) };
}

export function planConfirmedEmail(input: {
  coupleName: string;
  planLabel: string;
  amountLabel: string;
  panelUrl: string;
}): { subject: string; html: string } {
  const title = `Plan ${input.planLabel} activado`;
  const body = `
    <p>Hola ${escapeHtml(input.coupleName)},</p>
    <p>Confirmamos el pago de <strong>${escapeHtml(input.amountLabel)}</strong> y tu plan quedó en <strong>${escapeHtml(input.planLabel)}</strong>.</p>
    <p style="margin-top:24px;"><a href="${escapeHtml(input.panelUrl)}" style="color:#e6dac7;">Ir a mi cuenta</a></p>
  `;
  return { subject: title, html: layout(title, body) };
}

export function ratingRequestEmail(input: {
  coupleName: string;
  rateUrl: string;
}): { subject: string; html: string } {
  const title = "¿Cómo calificarías nuestro servicio?";
  const body = `
    <p>Hola ${escapeHtml(input.coupleName)},</p>
    <p>Esperamos que hayan disfrutado mucho su boda. Nos encantaría conocer su opinión sobre DeBodas.</p>
    <p style="margin-top:24px;"><a href="${escapeHtml(input.rateUrl)}" style="display:inline-block;background:#e6dac7;color:#3f3a32;text-decoration:none;padding:12px 20px;border-radius:999px;">Calificar ahora</a></p>
  `;
  return { subject: `${title} — DeBodas`, html: layout(title, body) };
}

export function ratingThanksEmail(input: {
  name: string;
}): { subject: string; html: string } {
  const title = "¡Gracias por tu calificación!";
  const body = `
    <p>Hola ${escapeHtml(input.name)},</p>
    <p>Recibimos tu opinión. Nos ayuda muchísimo a seguir mejorando.</p>
  `;
  return { subject: title, html: layout(title, body) };
}

export function ratingAdminEmail(input: {
  coupleName: string;
  name: string;
  email: string;
  score: number;
  comment: string | null;
}): { subject: string; html: string } {
  const stars = "★".repeat(input.score) + "☆".repeat(5 - input.score);
  const body = `
    <p><strong>Boda:</strong> ${escapeHtml(input.coupleName)}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(input.name)} (${escapeHtml(input.email)})</p>
    <p><strong>Puntuación:</strong> ${escapeHtml(stars)}</p>
    ${input.comment ? `<p><strong>Comentario:</strong> ${escapeHtml(input.comment)}</p>` : ""}
  `;
  return {
    subject: `Nueva calificación (${input.score}/5) — ${input.coupleName}`,
    html: layout("Nueva calificación", body),
  };
}

export function contactFormEmail(input: {
  name: string;
  email: string;
  message: string;
}): { subject: string; html: string } {
  const body = `
    <p><strong>Nombre:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Mensaje:</strong></p>
    <p style="white-space:pre-wrap;">${escapeHtml(input.message)}</p>
  `;
  return {
    subject: `Nuevo contacto — ${input.name}`,
    html: layout("Nuevo mensaje de contacto", body),
  };
}
