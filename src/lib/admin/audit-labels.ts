const ACTION_LABELS: Record<string, string> = {
  "admin.rating.status_changed": "Cambió el estado de una calificación",
  "admin.boda.plan_changed": "Cambió el plan de una boda",
  "admin.boda.online_changed": "Publicó o despublicó un micrositio",
  "admin.boda.rating_request_queued": "Encoló un pedido de calificación",
  "admin.boda.rating_request_failed": "Falló un pedido de calificación",
  "admin.boda.rating_email_flag_reset": "Rehabilitó un email de calificación",
  "admin.confirmed_gift.confirmed": "Confirmó un regalo",
  "admin.user.role_changed": "Cambió el rol de un usuario",
  "admin.bodas.exported": "Exportó bodas a CSV",
  "admin.email.retried": "Reintentó un email",
  "admin.email.bulk_retried": "Reintentó emails en forma masiva",
  "admin.email.queue_processed": "Procesó manualmente la cola",
  "admin.email.deleted": "Eliminó un registro de email",
};

const ENTITY_LABELS: Record<string, string> = {
  rating: "Calificación",
  boda: "Boda",
  boda_collection: "Listado de bodas",
  confirmedGift: "Regalo",
  user: "Usuario",
  emailLog: "Email",
  email_queue: "Cola de emails",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function auditEntityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}
