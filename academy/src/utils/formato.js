/* Formatos compartidos de AvantCode Academy. */

export const NIVELES = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export const MODALIDADES = {
  en_linea: 'En línea',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
};

export const TIPOS_LECCION = {
  video: 'Video',
  lectura: 'Lectura',
  practica: 'Práctica',
  examen: 'Examen',
};

export const ESTADOS_INSCRIPCION = {
  activa: { texto: 'Activa', badge: 'badge-success' },
  pendiente_pago: { texto: 'Pago pendiente', badge: 'badge-warning' },
  cancelada: { texto: 'Cancelada', badge: 'badge-neutral' },
};

/* Precio que se cobra: la oferta si existe. */
export const precioEfectivo = (curso) => Number(curso?.precio_oferta ?? curso?.precio ?? 0);
export const esGratis = (curso) => precioEfectivo(curso) <= 0;

export const moneda = (valor) =>
  Number(valor || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: Number(valor) % 1 ? 2 : 0 });

/* 190 → "3 h 10 min" */
export const duracion = (minutos) => {
  const m = Math.round(Number(minutos) || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};

/* Fechas 'YYYY-MM-DD' en hora local (new Date('YYYY-MM-DD') se recorre un día en México). */
export const aFecha = (valor) => {
  if (!valor) return null;
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const fechaLarga = (valor) =>
  aFecha(valor)?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) || '—';

export const fechaCorta = (valor) =>
  aFecha(valor)?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) || '—';

/* Total de lecciones de un temario. */
export const contarLecciones = (temario = []) => temario.reduce((t, m) => t + (m.lecciones?.length || 0), 0);
