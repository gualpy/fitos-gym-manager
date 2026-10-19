import { ApiConfigError, ApiError, ApiUnreachableError } from '../services/api';

/** A message safe to show a person for anything the API layer can throw. */
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiConfigError) return error.message;
  if (error instanceof ApiUnreachableError) return 'No se pudo conectar con el servidor. Verifica que la API esté en marcha.';
  if (error instanceof ApiError) {
    if (error.status === 403) return 'No tienes permiso para ver esto.';
    if (error.status === 429) return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.';
  }
  return error instanceof Error && !(error instanceof ApiError) ? error.message : fallback;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  identificationType: 'Tipo de identificación',
  identification: 'Identificación',
  email: 'Correo',
  phone: 'Teléfono',
  gender: 'Género',
  birthDate: 'Fecha de nacimiento',
  rfidCard: 'Tarjeta',
  description: 'Descripción',
  price: 'Precio',
  ivaRate: 'IVA',
  durationMonths: 'Duración',
  planId: 'Plan',
  startsOn: 'Inicio',
  sku: 'Código',
  barcode: 'Código de barras',
  category: 'Categoría',
  stock: 'Stock',
  delta: 'Cantidad',
  reason: 'Motivo',
  lines: 'El carrito',
  payments: 'El pago',
  hours: 'El horario',
  allowWithoutPlan: 'La política de acceso',
};

const VALIDATION_TEXT: Record<string, string> = {
  required: 'es obligatorio',
  required_together: 'debe ir junto con su par (tipo y número)',
  invalid: 'no es válido',
  too_long: 'es demasiado largo',
  too_many: 'tiene demasiados elementos',
  close_before_open: 'tiene un día que cierra antes de abrir',
  seven_days_required: 'debe incluir los siete días',
};

const CONFLICT_TEXT: Record<string, string> = {
  identification_taken: 'Ya existe un socio con esa identificación.',
  rfid_card_taken: 'Esa tarjeta ya está asignada a otro socio.',
  plan_name_taken: 'Ya existe un plan con ese nombre.',
  membership_overlap: 'Ese socio ya tiene una membresía en esas fechas.',
  product_name_taken: 'Ya existe un producto con ese nombre.',
  sku_taken: 'Ya existe un producto con ese código.',
  barcode_taken: 'Ya existe un producto con ese código de barras.',
  insufficient_stock: 'No hay stock suficiente. La lista se actualizó con las existencias reales.',
  product_inactive: 'Uno de los productos fue desactivado. La lista se actualizó.',
  payment_mismatch: 'El pago no coincide con el total de la venta. Intenta de nuevo.',
  no_branch: 'El gimnasio no tiene una sede activa. Configúrala antes de vender.',
};

/** Text for a failed form submission: names each invalid field when the API says which. */
export function formErrorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.details) {
      return Object.entries(error.details)
        .map(([field, code]) => `${FIELD_LABELS[field] ?? field} ${VALIDATION_TEXT[code] ?? 'no es válido'}`)
        .join('; ');
    }
    if (error.status === 409) return CONFLICT_TEXT[error.code] ?? 'Los datos chocan con otro registro existente.';
    if (error.status === 404) return 'El registro ya no existe. Recarga la lista.';
  }
  return errorText(error, fallback);
}
