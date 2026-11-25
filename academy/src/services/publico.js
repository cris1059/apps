import api from './api';

/* Llamadas del sitio público y de las pantallas de acceso (ver API.md). */

// ----- Catálogo -----
export const listarCursos = async (filtros = {}) => {
  const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
  const { data } = await api.get('/cursos', { params });
  return { cursos: data.cursos || [], categorias: data.categorias || [] };
};

export const obtenerCurso = async (slug) => {
  const { data } = await api.get(`/cursos/${encodeURIComponent(slug)}`);
  return data;
};

// Enlace firmado para el video subido de una lección de vista previa: { url, expira }.
export const videoPrevia = async (slug, idLeccion) => {
  const { data } = await api.get(`/cursos/${encodeURIComponent(slug)}/lecciones/${encodeURIComponent(idLeccion)}/video`);
  return data;
};

export const inscribirme = async (slug, metodo_pago) => {
  const { data } = await api.post(`/cursos/${encodeURIComponent(slug)}/inscripcion`, metodo_pago ? { metodo_pago } : {});
  return data.inscripcion;
};

export const enviarResena = async (slug, datos) => {
  const { data } = await api.post(`/cursos/${encodeURIComponent(slug)}/resenas`, datos);
  return data.resena;
};

// ----- Certificados -----
/* { certificado, temario }: para la página pública /verified/:folio. */
export const obtenerCertificado = async (folio) => {
  const { data } = await api.get(`/certificados/${encodeURIComponent(folio)}`);
  return data;
};

export const verificarCertificado = async (folio) => {
  const { data } = await api.get(`/certificados/${encodeURIComponent(folio)}`);
  return data.certificado;
};

// ----- Acceso -----
export const registrar = async (datos) => {
  const { data } = await api.post('/auth/registro', datos);
  return data;
};

/* Quién invita con este código: { nombre, vigente, bienvenida }. */
export const obtenerInvitacion = async (codigo) => {
  const { data } = await api.get(`/auth/invitacion/${encodeURIComponent(codigo)}`);
  return data;
};

export const verificarCorreo = async (token) => {
  const { data } = await api.get(`/auth/verificar/${encodeURIComponent(token)}`);
  return data;
};

export const reenviarVerificacion = async (correo) => {
  const { data } = await api.post('/auth/reenviar-verificacion', { correo });
  return data;
};

export const olvideContrasena = async (correo) => {
  const { data } = await api.post('/auth/olvide-contrasena', { correo });
  return data;
};

export const restablecerContrasena = async (token, contraseña) => {
  const { data } = await api.post(`/auth/restablecer/${encodeURIComponent(token)}`, { contraseña });
  return data;
};
