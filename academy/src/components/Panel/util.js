/* Cálculos del área del alumno a partir de /mis-cursos. */

export const porcentajeDe = (inscripcion) => Math.round(Number(inscripcion?.progreso?.porcentaje) || 0);

export const estaCompleto = (inscripcion) => !!inscripcion?.certificado || porcentajeDe(inscripcion) >= 100;

export const leccionesCompletadas = (inscripcion) => inscripcion?.progreso?.completadas?.length || 0;

/* Minutos aprendidos (aprox.): duración total × lecciones completadas / total. */
export const minutosAprendidos = (inscripcion) => {
  const total = Number(inscripcion?.progreso?.total) || Number(inscripcion?.curso?.total_lecciones) || 0;
  const duracion = Number(inscripcion?.curso?.duracion_total_min) || 0;
  if (!total || !duracion) return 0;
  return Math.round((duracion * leccionesCompletadas(inscripcion)) / total);
};

/* Agrupa las inscripciones por estado de aprendizaje. */
export const agrupar = (inscripciones = []) => {
  const activas = inscripciones.filter((i) => i.estado === 'activa');
  return {
    activas,
    enCurso: activas.filter((i) => !estaCompleto(i)),
    completadas: activas.filter(estaCompleto),
    pendientes: inscripciones.filter((i) => i.estado === 'pendiente_pago'),
    canceladas: inscripciones.filter((i) => i.estado === 'cancelada'),
  };
};

/* El curso para "continuar": el de actividad más reciente sin terminar
   (si no hay fechas, el que tiene punto de regreso y más avance). */
export const cursoParaContinuar = (inscripciones = []) => {
  const { enCurso } = agrupar(inscripciones);
  if (!enCurso.length) return null;
  const fecha = (i) => new Date(i.fecha_ultima_actividad || i.fecha_activacion || i.fecha_inscripcion || 0).getTime() || 0;
  return [...enCurso].sort((a, b) => {
    const porFecha = fecha(b) - fecha(a);
    if (porFecha) return porFecha;
    const conPunto = Number(!!b.progreso?.ultima_leccion) - Number(!!a.progreso?.ultima_leccion);
    return conPunto || porcentajeDe(b) - porcentajeDe(a);
  })[0];
};

/* Copia texto al portapapeles (con alternativa para navegadores sin la API). */
export const copiarTexto = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
