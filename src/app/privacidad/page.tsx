import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/layout/LegalDoc";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo DeBodas recolecta, usa y protege datos personales de parejas e invitados.",
};

export default function PrivacidadPage() {
  return (
    <MarketingPageShell>
      <LegalDoc title="Política de privacidad" updatedAt="27 de julio de 2026">
        <LegalSection title="1. Responsable">
          <p>
            DeBodas (“nosotros”) opera la plataforma de micrositios de boda. Para
            consultas de privacidad:{" "}
            <a
              href="mailto:hola@debodas.com.ar"
              className="font-medium text-[#6f5f47] underline"
            >
              hola@debodas.com.ar
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="2. Datos que tratamos">
          <p>Podemos tratar, entre otros:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Datos de cuenta: nombre, email, teléfono, contraseña (almacenada
              de forma cifrada/hasheada).
            </li>
            <li>
              Datos de la boda: nombres de la pareja, fecha, lugar, historia,
              fotos, tema, configuración del micrositio.
            </li>
            <li>
              RSVP: nombre, email opcional, estado de asistencia, menú, notas.
            </li>
            <li>
              Regalos y pagos: participantes, montos, método, comprobantes,
              referencias de Mercado Pago.
            </li>
            <li>
              Datos técnicos: IP (para seguridad y rate limiting), logs de
              emails y auditoría administrativa.
            </li>
            <li>
              Calificaciones públicas (nombre, puntuación, comentario) cuando
              las enviás y son aprobadas.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Finalidades">
          <p>Usamos los datos para:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Prestar y mejorar el Servicio.</li>
            <li>Procesar RSVP, regalos, planes y notificaciones por email.</li>
            <li>Prevenir abuso, fraude y accesos no autorizados.</li>
            <li>Cumplir obligaciones legales y resolver reclamos.</li>
            <li>
              Comunicarnos con vos sobre tu cuenta (no vendemos bases de datos a
              terceros con fines publicitarios ajenos).
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Encargados y terceros">
          <p>
            Podemos usar proveedores de infraestructura (hosting, base de
            datos, almacenamiento de archivos), SMTP, Mercado Pago y servicios
            embebidos que vos elijas (por ejemplo Canva, Spotify, mapas). Esos
            terceros tratan datos según sus propias políticas cuando interactuás
            con ellos.
          </p>
        </LegalSection>

        <LegalSection title="5. Conservación">
          <p>
            Conservamos los datos mientras la cuenta esté activa y el tiempo
            adicional necesario para obligaciones legales, seguridad y
            resolución de disputas. Logs de email y auditoría pueden tener
            retención limitada configurable.
          </p>
        </LegalSection>

        <LegalSection title="6. Derechos">
          <p>
            Podés solicitar acceso, rectificación o eliminación de tus datos
            personales escribiendo a{" "}
            <a
              href="mailto:hola@debodas.com.ar"
              className="font-medium text-[#6f5f47] underline"
            >
              hola@debodas.com.ar
            </a>{" "}
            o desde el{" "}
            <Link
              href="/contacto"
              className="font-medium text-[#6f5f47] underline"
            >
              formulario de contacto
            </Link>
            . Los invitados pueden pedir a la pareja la corrección de su RSVP o
            contactarnos si corresponde.
          </p>
        </LegalSection>

        <LegalSection title="7. Seguridad">
          <p>
            Aplicamos medidas razonables (sesiones JWT en cookie httpOnly,
            hashing de contraseñas, rate limiting, cifrado de cola de emails).
            Ningún sistema es 100% seguro; te pedimos usar contraseñas fuertes y
            no compartir el link con contraseña del micrositio de forma
            indiscriminada.
          </p>
        </LegalSection>

        <LegalSection title="8. Menores">
          <p>
            El Servicio está orientado a mayores de 18 años. No buscamos
            recolectar datos de menores de forma intencional.
          </p>
        </LegalSection>

        <LegalSection title="9. Cambios">
          <p>
            Podemos actualizar esta política. La fecha de última actualización
            indica la versión vigente.
          </p>
        </LegalSection>
      </LegalDoc>
    </MarketingPageShell>
  );
}
