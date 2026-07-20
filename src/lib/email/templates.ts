function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:Georgia,serif;color:#1a2332;">
  <div style="padding:40px 20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#e6dac7;">DeBodas</p>
      <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin:32px 0 0;font-size:13px;color:#78716c;">Equipo DeBodas</p>
    </div>
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
