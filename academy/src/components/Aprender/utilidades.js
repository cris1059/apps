import { PlayCircle, FileText, Dumbbell, ClipboardCheck } from 'lucide-react';

export const ICONO_TIPO = {
  video: PlayCircle,
  lectura: FileText,
  practica: Dumbbell,
  examen: ClipboardCheck,
};

/* Temario → lista plana de lecciones con su módulo, en orden. */
export const aplanarTemario = (temario = []) =>
  temario.flatMap((modulo, im) =>
    (modulo.lecciones || []).map((leccion, il) => ({
      ...leccion,
      id: String(leccion.id ?? `${im}-${il}`),
      modulo: { id: modulo.id ?? String(im), titulo: modulo.titulo, numero: im + 1 },
      numero: il + 1,
    }))
  );

/* Interpreta la URL del video de una lección:
   - YouTube / Vimeo → iframe embebido
   - .mp4 / .webm / .ogg / .mov → <video>
   - cualquier otra → enlace externo
   Solo se aceptan http(s). */
export const analizarVideo = (crudo) => {
  if (!crudo) return null;
  let url;
  try {
    url = new URL(String(crudo).trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;

  const host = url.hostname.replace(/^(www\.|m\.)/, '');

  // YouTube
  let idYoutube = null;
  if (host === 'youtu.be') idYoutube = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') idYoutube = url.searchParams.get('v');
    else idYoutube = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] || null;
  }
  if (idYoutube && /^[\w-]{6,20}$/.test(idYoutube)) {
    const inicio = parseInt(url.searchParams.get('t') || url.searchParams.get('start') || '0', 10);
    return {
      tipo: 'iframe',
      fuente: 'YouTube',
      url: `https://www.youtube-nocookie.com/embed/${idYoutube}?rel=0&modestbranding=1${inicio > 0 ? `&start=${inicio}` : ''}`,
    };
  }

  // Vimeo
  if (host === 'vimeo.com') {
    const id = url.pathname.match(/\/(\d+)/)?.[1];
    if (id) return { tipo: 'iframe', fuente: 'Vimeo', url: `https://player.vimeo.com/video/${id}?dnt=1` };
  }
  if (host === 'player.vimeo.com') return { tipo: 'iframe', fuente: 'Vimeo', url: url.href };

  // Archivo de video directo
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(url.pathname)) return { tipo: 'archivo', url: url.href };

  return { tipo: 'enlace', url: url.href };
};

/* Nombre legible para descargar un recurso. */
export const nombreRecurso = (crudo) => {
  try {
    const url = new URL(crudo);
    const ultimo = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
    return ultimo || url.hostname;
  } catch {
    return 'Recurso';
  }
};

/* Solo enlaces http(s) para recursos descargables. */
export const urlSegura = (crudo) => {
  try {
    const url = new URL(String(crudo).trim());
    return /^https?:$/.test(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};
