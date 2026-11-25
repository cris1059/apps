import { ExternalLink, FileText } from 'lucide-react';
import VideoProtegido from '../UI/VideoProtegido';

/* Reproductor de una lección o del video de presentación:
   video subido al servidor (protegido), YouTube / Vimeo (iframe), archivo de video
   (mp4/webm/ogg) o texto. */

export const tipoVideo = (url = '') => {
  if (!url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    if (id) return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host.endsWith('vimeo.com')) {
    const id = u.pathname.match(/(\d+)/)?.[1];
    if (id) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|ogg|ogv|mov)(\?|$)/i.test(u.pathname)) return { tipo: 'video', src: url };
  return { tipo: 'enlace', src: url };
};

const Reproductor = ({ url, contenido, titulo = 'Video', autoPlay = false, protegido = null }) => {
  // protegido = { clave, obtenerEnlace, marca } cuando el video está subido al servidor.
  const video = protegido ? null : tipoVideo(url);

  return (
    <div className="space-y-4">
      {protegido && (
        <VideoProtegido
          clave={protegido.clave}
          obtenerEnlace={protegido.obtenerEnlace}
          marca={protegido.marca}
          titulo={titulo}
          autoPlay={autoPlay}
          className="rounded-2xl"
        />
      )}
      {video?.tipo === 'iframe' && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={video.src}
            title={titulo}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}
      {video?.tipo === 'video' && (
        <video src={video.src} controls autoPlay={autoPlay} playsInline className="aspect-video w-full rounded-2xl bg-black">
          Tu navegador no puede reproducir este video.
        </video>
      )}
      {video?.tipo === 'enlace' && (
        <a href={video.src} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          Abrir recurso <ExternalLink className="h-4 w-4" />
        </a>
      )}
      {contenido && <div className="ac-contenido">{contenido}</div>}
      {!video && !protegido && !contenido && (
        <div className="vacio py-8">
          <span className="app-icono app-icono-claro"><FileText /></span>
          <p className="text-sm">Esta vista previa todavía no tiene contenido.</p>
        </div>
      )}
    </div>
  );
};

export default Reproductor;
