import api from './api';

/* Llamadas del área del alumno (ver API.md). */
export const alumnoService = {
  misCursos: () => api.get('/mis-cursos').then((r) => r.data.inscripciones || []),

  cancelarInscripcion: (id) => api.delete(`/inscripciones/${id}`).then((r) => r.data.inscripcion),

  aprender: (slug) => api.get(`/aprender/${encodeURIComponent(slug)}`).then((r) => r.data),

  marcarLeccion: (slug, idLeccion, completada) =>
    api
      .post(`/aprender/${encodeURIComponent(slug)}/lecciones/${encodeURIComponent(idLeccion)}`, { completada })
      .then((r) => r.data),

  // Enlace firmado (vence) para el video subido de una lección: { url, expira }.
  videoLeccion: (slug, idLeccion) =>
    api
      .get(`/aprender/${encodeURIComponent(slug)}/lecciones/${encodeURIComponent(idLeccion)}/video`)
      .then((r) => r.data),

  // Examen de una lección: estado (intentos, mejor calificación, último resultado) y envío.
  examen: (slug, idLeccion) =>
    api
      .get(`/aprender/${encodeURIComponent(slug)}/lecciones/${encodeURIComponent(idLeccion)}/examen`)
      .then((r) => r.data),

  enviarExamen: (slug, idLeccion, respuestas) =>
    api
      .post(`/aprender/${encodeURIComponent(slug)}/lecciones/${encodeURIComponent(idLeccion)}/examen`, { respuestas })
      .then((r) => r.data),

  guardarUltima: (slug, idLeccion) =>
    api.post(`/aprender/${encodeURIComponent(slug)}/ultima`, { id_leccion: idLeccion }).then((r) => r.data),

  // Saldo por invitaciones: { saldo, enlace, reglas, premiados, invitados, movimientos }.
  saldo: () => api.get('/saldo').then((r) => r.data),

  misCertificados: () => api.get('/mis-certificados').then((r) => r.data.certificados || []),

  actualizarPerfil: (datos) => api.put('/auth/perfil', datos).then((r) => r.data.alumno),

  // Con FormData, axios deja que el navegador ponga el Content-Type con su boundary.
  subirFoto: (archivo) => {
    const datos = new FormData();
    datos.append('foto', archivo);
    return api.post('/auth/foto', datos).then((r) => r.data.alumno);
  },

  cambiarContrasena: (actual, nueva) => api.put('/auth/contrasena', { actual, nueva }).then((r) => r.data),
};
