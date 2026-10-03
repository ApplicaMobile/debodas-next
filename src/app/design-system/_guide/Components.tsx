import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  IconArrowRight,
  IconGift,
  IconTrash,
  Input,
  PaymentStatusBadge,
  PlanBadge,
  Select,
  Switch,
  Textarea,
  UsageMeter,
  WeddingCard,
  type ButtonVariant,
} from "@/components/ui";
import { Section, SubTitle, Spec } from "./Section";

const variants: { id: ButtonVariant; name: string; uso: string }[] = [
  { id: "primario", name: "Primario", uso: "Una acción principal por vista" },
  { id: "secundario", name: "Secundario", uso: "Acciones de apoyo" },
  { id: "fantasma", name: "Fantasma", uso: "Terciaria, barras y tablas" },
  { id: "peligro", name: "Peligro", uso: "Eliminar, cancelar" },
];

function Demo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-2 ${className ?? ""}`}>
      <span className="type-caption text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

export function Buttons() {
  return (
    <Section
      id="botones"
      overline="Componentes"
      title="Botón"
      lead={
        <>
          Pill (<Spec>radius-full</Spec>). Alturas sm 36 · md 48 · lg 56 px; sm solo en tablas o alta densidad. Con{" "}
          <Spec>href</Spec> se renderiza como <Spec>next/link</Spec>. El foco es un anillo azul de 2px con 2px de separación blanca.
        </>
      }
    >
      <SubTitle>Variantes × estados (md)</SubTitle>
      <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-default">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">Variantes del botón en cada estado</caption>
          <thead>
            <tr className="border-b border-border-subtle">
              <th scope="col" className="p-4 type-label text-text-primary">Variante</th>
              {["Normal", "Hover", "Presionado", "Foco", "Deshabilitado", "Cargando"].map((s) => (
                <th key={s} scope="col" className="p-4 type-label text-text-primary">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-b border-border-subtle last:border-0">
                <th scope="row" className="p-4 align-middle">
                  <span className="block type-label text-text-primary">{v.name}</span>
                  <span className="block type-caption text-text-secondary">{v.uso}</span>
                </th>
                <td className="p-3"><Button variant={v.id}>Guardar</Button></td>
                <td className="p-3"><Button variant={v.id} demoState="hover">Guardar</Button></td>
                <td className="p-3"><Button variant={v.id} demoState="pressed">Guardar</Button></td>
                <td className="p-3"><Button variant={v.id} demoState="focus">Guardar</Button></td>
                <td className="p-3"><Button variant={v.id} disabled>Guardar</Button></td>
                <td className="p-3"><Button variant={v.id} loading>Guardar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubTitle>Tamaños, íconos y links</SubTitle>
      <div className="flex flex-col gap-6 rounded-md border border-border-subtle bg-surface-default p-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Demo label="sm · 36px"><Button size="sm">Ver detalle</Button></Demo>
          <Demo label="md · 48px"><Button size="md">Confirmar asistencia</Button></Demo>
          <Demo label="lg · 56px"><Button size="lg">Elegir plan Premium</Button></Demo>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <Demo label="Ícono al inicio"><Button variant="secundario" icon={<IconGift />}>Agregar regalo</Button></Demo>
          <Demo label="Ícono al final · link (href)">
            <Button variant="fantasma" href="#plan-ejemplo" icon={<IconArrowRight />} iconPosition="end">Ver planes</Button>
          </Demo>
          <Demo label="Peligro sm con ícono"><Button variant="peligro" size="sm" icon={<IconTrash />}>Eliminar invitado</Button></Demo>
          <Demo label="Cargando con texto"><Button loading loadingLabel="Redirigiendo a MercadoPago…">Pasar a Premium</Button></Demo>
          <Demo label="Link deshabilitado"><Button href="/mi-cuenta/plan" disabled variant="secundario">Pagar ahora</Button></Demo>
        </div>
        <Demo label="Ancho completo (mobile)" className="w-full max-w-sm">
          <Button fullWidth size="lg">Armá tu lista</Button>
        </Demo>
      </div>

      <div className="mt-6 rounded-md bg-surface-inverse p-6">
        <p className="type-body text-text-inverse">
          <strong>Probá el foco real:</strong> navegá con <kbd className="rounded-sm border border-border-inverse px-1">Tab</kbd>.
          Cada control muestra el anillo de foco (sobre navy también se ve gracias al offset blanco).
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Button variant="secundario">Secundario sobre navy</Button>
          <Button variant="secundario" demoState="focus">Con foco</Button>
        </div>
      </div>
    </Section>
  );
}

export function Forms() {
  return (
    <Section
      id="formularios"
      overline="Componentes"
      title="Campos de formulario"
      lead="Etiqueta visible siempre arriba (nunca solo placeholder), ayuda y error vinculados con aria-describedby, aria-invalid en error y foco visible."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <Card padding="lg" className="flex flex-col gap-6">
          <SubTitle>Input</SubTitle>
          <Input label="Nombre y apellido" name="nombre" placeholder="Ej.: Sofía Pérez" autoComplete="name" />
          <Input label="Correo electrónico" type="email" hint="Te mandamos ahí la confirmación de tu pago." defaultValue="sofia@correo.com" required />
          <Input label="Teléfono" type="tel" error="Ingresá un teléfono con código de área, por ejemplo 11 5555-5555." defaultValue="5555" />
          <Input label="Link del micrositio" defaultValue="debodas.com.ar/bodas/sofia-y-martin" disabled hint="Se define al crear la boda." />
          <Input label="Foco visible (demo)" defaultValue="Estancia La Candelaria" demoFocus />
        </Card>
        <Card padding="lg" className="flex flex-col gap-6">
          <SubTitle>Textarea y Select</SubTitle>
          <Textarea label="Mensaje para los novios" optional placeholder="Escribí unas palabras…" hint="Máximo 500 caracteres." />
          <Textarea label="Restricciones alimentarias" error="Contanos qué necesitás para avisarle al catering." />
          <Select
            label="Menú"
            placeholder="Elegí una opción"
            options={[
              { value: "general", label: "General" },
              { value: "vegetariano", label: "Vegetariano" },
              { value: "sin-tacc", label: "Sin TACC" },
            ]}
            hint="Solo en plan Premium (menú especial en RSVP)."
          />
          <Select
            label="¿Asistís?"
            options={[{ value: "si", label: "Sí, voy" }, { value: "no", label: "No puedo ir" }]}
            defaultValue=""
            placeholder="Elegí una opción"
            error="Elegí si vas a asistir."
            required
          />
          <Select label="Provincia (foco demo)" options={[{ value: "ba", label: "Buenos Aires" }]} demoFocus />
        </Card>
        <Card padding="lg" className="flex flex-col gap-2">
          <SubTitle>Checkbox</SubTitle>
          <Checkbox label="Mostrar sección FAQ en el micrositio" />
          <Checkbox label="Mostrar Dress Code" defaultChecked description="Tus invitados ven la paleta y la sugerencia de vestimenta." />
          <Checkbox label="Acepto los términos y condiciones" error="Tenés que aceptar los términos para continuar." />
          <Checkbox label="Permitir regalo con monto libre" disabled description="Disponible en el plan Premium." />
          <Checkbox label="Opción incluida en tu plan" disabled defaultChecked />
          <Checkbox label="Foco visible (demo)" demoFocus />
        </Card>
        <Card padding="lg" className="flex flex-col gap-2">
          <SubTitle>Switch</SubTitle>
          <Switch label="Micrositio online" description="Si lo apagás, tus invitados ven un aviso de sitio en preparación." defaultChecked />
          <Switch label="Ocultar la lista de regalos" />
          <Switch label="Monto libre" description="Disponible en el plan Premium." disabled />
          <Switch label="Foco visible (demo)" defaultChecked demoFocus />
        </Card>
      </div>
    </Section>
  );
}

export function Feedback() {
  return (
    <Section
      id="badges"
      overline="Componentes"
      title="Badges, avisos y medidores"
      lead="El color nunca es la única señal: cada estado lleva ícono y texto. Pendiente y rechazado nunca usan verde."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <Card padding="lg">
          <SubTitle>Estado de pago (MercadoPago)</SubTitle>
          <div className="flex flex-wrap gap-3">
            <PaymentStatusBadge status="approved" />
            <PaymentStatusBadge status="pending" />
            <PaymentStatusBadge status="in_process" />
            <PaymentStatusBadge status="rejected" />
            <PaymentStatusBadge status="cancelled" />
            <PaymentStatusBadge status="refunded" />
          </div>
          <SubTitle>Plan</SubTitle>
          <div className="flex flex-wrap gap-3">
            <PlanBadge plan="free" />
            <PlanBadge plan="basico" />
            <PlanBadge plan="premium" />
            <Badge tone="recomendado">Recomendado</Badge>
          </div>
          <SubTitle>Otros</SubTitle>
          <div className="flex flex-wrap gap-3">
            <Badge tone="info">Nuevo</Badge>
            <Badge tone="neutro" icon={false}>Pronto</Badge>
          </div>
        </Card>
        <Card padding="lg" className="flex flex-col gap-6">
          <SubTitle>Medidor de uso del plan</SubTitle>
          <UsageMeter label="Regalos" value={4} max={10} unit="regalos" upgradeHref="#plan-ejemplo" />
          <UsageMeter label="Invitados en RSVP" value={34} max={40} unit="invitados" upgradeHref="#plan-ejemplo" />
          <UsageMeter label="Fotos del álbum" value={3} max={3} unit="fotos" upgradeHref="#plan-ejemplo" />
          <UsageMeter label="Regalos (Básico)" value={27} max={null} unit="regalos" />
        </Card>
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <Alert tone="exito" title="¡Listo! Tu plan Premium ya está activo.">Te mandamos el comprobante por email.</Alert>
        <Alert tone="pendiente" title="Tu pago está pendiente." action={<Button variant="fantasma" size="sm">Ver estado</Button>}>
          MercadoPago lo está revisando. Te avisamos por email apenas se acredite; no hace falta que pagues de nuevo.
        </Alert>
        <Alert tone="error" title="No pudimos procesar el pago." action={<Button size="sm">Reintentar pago</Button>}>
          MercadoPago rechazó la operación. Probá con otro medio de pago o tarjeta.
        </Alert>
        <Alert tone="info" title="Pago único, sin mensualidad.">Pagás una sola vez y tenés acceso a tu gestor de bodas.</Alert>
      </div>
    </Section>
  );
}

const weddings = [
  { names: "Sofía & Martín", date: "2026-11-14", location: "Estancia La Candelaria, Lobos", src: "/design-system/boda-1.jpg", slug: "sofia-y-martin", alt: "Sofía y Martín de espaldas mirando el atardecer" },
  { names: "Lucía & Tomás", date: "2026-12-05", location: "Bodega Salentein, Tunuyán, Mendoza", src: "/design-system/boda-2.jpg", slug: "lucia-y-tomas", alt: "Lucía y Tomás abrazados en un campo verde" },
  { names: "Camila & Joaquín", date: "2027-03-13", location: "Quinta Los Aromos, Pilar", src: "/design-system/boda-3.jpg", slug: "camila-y-joaquin", alt: "Camila y Joaquín al aire libre al caer la tarde" },
];

export function Cards() {
  return (
    <Section
      id="cards"
      overline="Componentes"
      title="Cards"
      lead={<>Contenedor base con <Spec>radius-md</Spec>, cuatro tonos y elevación 0–3. WeddingCard para “Próximas bodas”: foto con alt descriptivo, fecha en <Spec>&lt;time&gt;</Spec> y toda la card clickeable con un solo link.</>}
    >
      <SubTitle>Card base</SubTitle>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="type-h4">Default</p><p className="mt-1 type-body-sm text-text-secondary">surface-default · elevación 1</p></Card>
        <Card tone="muted" elevation={0} bordered><p className="type-h4">Muted</p><p className="mt-1 type-body-sm text-text-secondary">surface-muted · con borde</p></Card>
        <Card tone="brand" elevation={0}><p className="type-h4">Brand</p><p className="mt-1 type-body-sm">surface-brand · text-on-brand</p></Card>
        <Card tone="inverse" elevation={2}><p className="type-h4">Inverse</p><p className="mt-1 type-body-sm text-text-inverse-muted">surface-inverse · elevación 2</p></Card>
      </div>

      <SubTitle>WeddingCard · Próximas bodas</SubTitle>
      <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {weddings.map((w, i) => (
          <li key={w.slug} className="flex">
            <WeddingCard
              className="w-full"
              names={w.names}
              date={w.date}
              location={w.location}
              href="#cards"
              image={{ src: w.src, alt: w.alt }}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
      <p className="mt-4 type-body-sm text-text-secondary">Imágenes ilustrativas generadas para la guía.</p>
    </Section>
  );
}
