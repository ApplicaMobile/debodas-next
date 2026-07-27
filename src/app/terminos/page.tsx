import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/components/layout/LegalDoc";
import { MarketingPageShell } from "@/components/layout/MarketingPageShell";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de uso de la plataforma DeBodas para micrositios de boda, RSVP y listas de regalos.",
};

export default function TerminosPage() {
  return (
    <MarketingPageShell>
      <LegalDoc title="Términos y condiciones" updatedAt="27 de julio de 2026">
        <LegalSection title="1. Aceptación">
          <p>
            Al crear una cuenta o usar DeBodas (el “Servicio”), aceptás estos
            términos. Si no estás de acuerdo, no uses la plataforma.
          </p>
        </LegalSection>

        <LegalSection title="2. Qué es DeBodas">
          <p>
            DeBodas es una plataforma digital que permite a las parejas crear un
            micrositio de boda, gestionar confirmaciones de asistencia (RSVP),
            listas de regalos, pagos y contenidos relacionados con el evento.
          </p>
        </LegalSection>

        <LegalSection title="3. Cuenta y responsabilidad">
          <p>
            Sos responsable de la veracidad de los datos que cargás, de la
            custodia de tu contraseña y de todo uso que se haga desde tu cuenta.
            Debés informar sin demora cualquier acceso no autorizado.
          </p>
        </LegalSection>

        <LegalSection title="4. Planes y pagos">
          <p>
            Existen planes gratuito y pagos (Básico / Premium). Los precios y
            beneficios vigentes se informan en el sitio. Los pagos de upgrade de
            plan y de regalos de invitados pueden procesarse mediante Mercado
            Pago, transferencia u otros medios habilitados. Los cargos de
            terceros (pasarelas, bancos) se rigen por sus propias condiciones.
          </p>
        </LegalSection>

        <LegalSection title="5. Contenido de las parejas">
          <p>
            El contenido del micrositio (textos, fotos, enlaces, invitaciones,
            datos de invitados) es de tu responsabilidad. No debés subir material
            ilegal, ofensivo, que infrinja derechos de terceros o que viole la
            privacidad de otras personas.
          </p>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas o
            contenidos que incumplan estos términos o la ley aplicable.
          </p>
        </LegalSection>

        <LegalSection title="6. Disponibilidad del servicio">
          <p>
            Buscamos mantener el Servicio operativo, pero no garantizamos
            disponibilidad ininterrumpida. Pueden existir mantenimientos,
            fallas de terceros (hosting, email, Mercado Pago, Canva, Spotify,
            mapas) o causas de fuerza mayor.
          </p>
        </LegalSection>

        <LegalSection title="7. Propiedad intelectual">
          <p>
            La marca DeBodas, el diseño de la plataforma, temas visuales y
            software son propiedad de DeBodas o de sus licenciantes. El contenido
            que subís sigue siendo tuyo; nos otorgás una licencia limitada para
            alojarlo y mostrarlo en el Servicio.
          </p>
        </LegalSection>

        <LegalSection title="8. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley argentina, DeBodas no
            responde por daños indirectos, lucro cesante ni por disputas entre
            parejas e invitados (incluyendo regalos, transferencias o
            confirmaciones). El uso del micrositio es bajo tu propio riesgo.
          </p>
        </LegalSection>

        <LegalSection title="9. Modificaciones">
          <p>
            Podemos actualizar estos términos. La fecha de “última
            actualización” indica la versión vigente. El uso continuado del
            Servicio implica aceptación de los cambios.
          </p>
        </LegalSection>

        <LegalSection title="10. Contacto">
          <p>
            Consultas sobre estos términos:{" "}
            <Link
              href="/contacto"
              className="font-medium text-[#6f5f47] underline"
            >
              formulario de contacto
            </Link>{" "}
            o{" "}
            <a
              href="mailto:hola@debodas.com.ar"
              className="font-medium text-[#6f5f47] underline"
            >
              hola@debodas.com.ar
            </a>
            .
          </p>
        </LegalSection>
      </LegalDoc>
    </MarketingPageShell>
  );
}
