import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"].filter(
    (key) => !process.env[key]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(`Faltan variables SMTP: ${missing.join(", ")}`);
  }

  const { getAdminEmail, isEmailConfigured, sendEmail } = await import(
    "../src/lib/email/client"
  );
  const to = getAdminEmail();

  if (!isEmailConfigured()) {
    throw new Error("La configuración SMTP está incompleta");
  }
  if (!to) {
    throw new Error("EMAIL_ADMIN no está configurado");
  }

  const result = await sendEmail({
    to,
    subject: "Prueba SMTP — DeBodas",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h1>SMTP configurado correctamente</h1>
        <p>Este correo fue enviado desde la aplicación DeBodas usando Hostinger.</p>
      </div>
    `,
    meta: { type: "smtp_test" },
  });

  console.log(`Correo enviado a ${to}. ID: ${result.id ?? "sin ID"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
