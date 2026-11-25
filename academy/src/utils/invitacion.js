import { almacen } from '../services/api';

/* Enlace de invitación: cualquier página con ?invita=<código> lo guarda 30 días,
   así la persona puede ver cursos antes de crear su cuenta y la invitación no se pierde. */
const CLAVE = 'academy_invita';
const DIAS = 30;
const VALIDO = /^[A-Z0-9]{6,12}$/;

export const guardarInvitacion = (codigo) => {
  const limpio = String(codigo || '').trim().toUpperCase();
  if (!VALIDO.test(limpio)) return;
  almacen.guardar(CLAVE, JSON.stringify({ codigo: limpio, vence: Date.now() + DIAS * 864e5 }));
};

export const leerInvitacion = () => {
  try {
    const datos = JSON.parse(almacen.leer(CLAVE) || 'null');
    if (!datos?.codigo || datos.vence < Date.now()) return '';
    return datos.codigo;
  } catch {
    return '';
  }
};

export const borrarInvitacion = () => almacen.borrar(CLAVE);
