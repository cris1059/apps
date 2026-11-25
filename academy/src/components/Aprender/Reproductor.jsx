import { ExternalLink, Download, FileText, PlayCircle } from 'lucide-react';
import ContenidoTexto from './ContenidoTexto';
import VideoProtegido, { marcaAlumno } from '../UI/VideoProtegido';
import { useAuth } from '../../hooks/useAuth';
import { alumnoService } from '../../services/alumno';
import { analizarVideo, nombreRecurso, urlSegura } from './utilidades';
import Actividad from '../Actividades/Actividad';

/* Contenido de la lección: video (subido al servidor, embebido o archivo), texto,
   examen o práctica interactiva, y recurso. */
const Reproductor = ({ leccion, slug, completada = false, onEnviado, onCompletar }) => {
  const { alumno } = useAuth();
  const protegido = !!leccion?.video_protegido;
  const video = protegido ? null : analizarVideo(leccion?.video_url);
  const hayVideo = protegido || !!video;
  const recurso = urlSegura(leccion?.recurso_url);
  const hayTexto = !!leccion?.contenido?.trim();
  const hayActividad = !!leccion?.actividad;

  return (
    <div className="space-y-4 md:space-y-5">
      {protegido && (
        <VideoProtegido
          clave={`${slug}:${leccion.id}`}
          titulo={leccion.titulo}
          obtenerEnlace={() => alumnoService.videoLeccion(slug, leccion.id)}
          marca={marcaAlumno(alumno)}
          className="rounded-3xl shadow-flotante ring-1 ring-black/10"
        />
      )}

      {video?.tipo === 'iframe' && (
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-flotante ring-1 ring-black/10">
          <iframe
            key={video.url}
            src={video.url}
            title={leccion.titulo}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {video?.tipo === 'archivo' && (
        <div className="overflow-hidden rounded-3xl bg-black shadow-flotante ring-1 ring-black/10">
          <video key={video.url} src={video.url} controls preload="metadata" playsInline className="aspect-video w-full bg-black">
            Tu navegador no puede reproducir este video.
          </video>
        </div>
      )}

      {video?.tipo === 'enlace' && (
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="kpi-oscuro flex-row items-center gap-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="app-icono bg-white/10 text-lima shadow-none ring-1 ring-white/15"><PlayCircle /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-white">Ver el video de esta lección</span>
            <span className="block truncate text-sm text-white/55">{video.url}</span>
          </span>
          <ExternalLink className="h-5 w-5 text-white/60" />
        </a>
      )}

      {hayTexto && (
        <section className="card md:p-8" aria-label={hayVideo ? 'Notas de la lección' : 'Lectura'}>
          {hayVideo && (
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">
              <FileText className="h-4 w-4" /> Notas de la lección
            </p>
          )}
          <ContenidoTexto texto={leccion.contenido} />
        </section>
      )}

      {hayActividad && (
        <div id="actividad-leccion" className="scroll-mt-24">
          <Actividad leccion={leccion} slug={slug} completada={completada} onEnviado={onEnviado} onCompletar={onCompletar} />
        </div>
      )}

      {recurso && (
        <a
          href={recurso}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="card flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 md:p-5"
        >
          <span className="app-icono app-icono-teal"><Download /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-tinta">Material de la lección</span>
            <span className="block truncate text-xs text-tinta-3">{nombreRecurso(recurso)}</span>
          </span>
          <span className="btn-secondary btn-sm hidden sm:inline-flex">Descargar</span>
        </a>
      )}

      {!hayVideo && !hayTexto && !recurso && !hayActividad && (
        <section className="card">
          <div className="vacio">
            <span className="app-icono app-icono-claro"><FileText /></span>
            <p className="text-sm">Esta lección todavía no tiene contenido. Puedes marcarla como vista y seguir con la siguiente.</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Reproductor;
