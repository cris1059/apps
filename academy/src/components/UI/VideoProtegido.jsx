import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import { mensajeError } from '../../services/api';

/* Reproductor de los videos subidos al servidor de AvantCode (no YouTube / Vimeo).

   - Pide un enlace firmado que vence (`obtenerEnlace`); si vence a mitad del video,
     pide otro y continúa en el mismo segundo.
   - Sin botón de descarga, menú contextual, picture-in-picture ni transmisión a otra pantalla.
   - Marca de agua con el correo del alumno que cambia de lugar: si alguien graba
     la pantalla y lo comparte, se sabe de qué cuenta salió.
   - La pantalla completa se aplica al contenedor (no al <video>) para que la marca de
     agua siga visible. En iPhone, que no lo permite, queda la pantalla completa nativa. */

const posicionAleatoria = () => ({ top: 6 + Math.random() * 74, left: 4 + Math.random() * 56 });

const VideoProtegido = ({ clave, obtenerEnlace, marca, titulo = 'Video', autoPlay = false, className = '' }) => {
  const contenedorRef = useRef(null);
  const videoRef = useRef(null);
  const pedirRef = useRef(obtenerEnlace);
  pedirRef.current = obtenerEnlace;
  const turno = useRef(0);
  const reanudar = useRef(null);
  const reproduciendo = useRef(false);
  const fallos = useRef([]);

  const [enlace, setEnlace] = useState(null);
  const [estado, setEstado] = useState({ fase: 'cargando', error: null });
  const [posicion, setPosicion] = useState(posicionAleatoria);
  const [completa, setCompleta] = useState(false);
  const puedeCompleta = typeof document !== 'undefined' && !!document.fullscreenEnabled;

  const pedir = useCallback(async () => {
    const mio = ++turno.current;
    try {
      const { url } = await pedirRef.current();
      if (mio !== turno.current) return; // ya se pidió otra lección
      setEnlace(url);
      setEstado({ fase: 'listo', error: null });
    } catch (e) {
      if (mio !== turno.current) return;
      setEstado({ fase: 'error', error: mensajeError(e, 'No pudimos cargar el video.') });
    }
  }, []);

  // Otra lección: enlace nuevo desde cero.
  useEffect(() => {
    reanudar.current = null;
    fallos.current = [];
    setEnlace(null);
    setEstado({ fase: 'cargando', error: null });
    pedir();
  }, [clave, pedir]);

  // La marca de agua cambia de lugar cada pocos segundos.
  useEffect(() => {
    const id = setInterval(() => setPosicion(posicionAleatoria()), 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const alCambiar = () => setCompleta(document.fullscreenElement === contenedorRef.current);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  // Atributos que React no siempre pasa al elemento.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.disablePictureInPicture = true;
    v.disableRemotePlayback = true;
  }, [enlace]);

  const alternarCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else contenedorRef.current?.requestFullscreen?.().catch(() => {});
  };

  /* Error de red o enlace vencido: se pide uno nuevo y se retoma donde iba.
     Más de 3 fallos en 2 minutos → se muestra el error. */
  const alFallar = () => {
    const ahora = Date.now();
    fallos.current = fallos.current.filter((t) => ahora - t < 120000).concat(ahora);
    if (fallos.current.length > 3) {
      setEstado({ fase: 'error', error: 'No pudimos reproducir el video. Revisa tu conexión e intenta de nuevo.' });
      return;
    }
    reanudar.current = { tiempo: videoRef.current?.currentTime || 0, reproducir: reproduciendo.current };
    pedir();
  };

  const alCargar = () => {
    const v = videoRef.current;
    const r = reanudar.current;
    if (!v || !r) return;
    reanudar.current = null;
    if (r.tiempo) v.currentTime = r.tiempo;
    if (r.reproducir) v.play().catch(() => {});
  };

  const reintentar = () => {
    fallos.current = [];
    setEstado({ fase: 'cargando', error: null });
    pedir();
  };

  const listo = estado.fase === 'listo' && !!enlace;

  return (
    <div
      ref={contenedorRef}
      className={`group relative isolate select-none overflow-hidden bg-black ${completa ? 'grid place-items-center' : className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {listo ? (
        <video
          key={enlace}
          ref={videoRef}
          src={enlace}
          aria-label={titulo}
          controls
          controlsList={`nodownload noremoteplayback${puedeCompleta ? ' nofullscreen' : ''}`}
          disablePictureInPicture
          preload="metadata"
          playsInline
          autoPlay={autoPlay}
          onDoubleClick={puedeCompleta ? alternarCompleta : undefined}
          onLoadedMetadata={alCargar}
          onPlay={() => {
            reproduciendo.current = true;
          }}
          onPause={() => {
            reproduciendo.current = false;
          }}
          onError={alFallar}
          className={`block bg-black ${completa ? 'h-full w-full object-contain' : 'aspect-video w-full'}`}
        >
          Tu navegador no puede reproducir este video.
        </video>
      ) : (
        <div className="grid aspect-video w-full place-items-center p-6 text-center" role="status" aria-live="polite">
          {estado.fase === 'error' ? (
            <div className="max-w-sm space-y-3">
              <p className="text-sm text-white/80">{estado.error}</p>
              <button type="button" className="btn-secondary btn-sm" onClick={reintentar}>
                <RotateCcw className="h-4 w-4" /> Reintentar
              </button>
            </div>
          ) : (
            <>
              <span className="cargador" />
              <span className="sr-only">Cargando el video…</span>
            </>
          )}
        </div>
      )}

      {/* Marca de agua */}
      {listo && marca && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-10 max-w-[70%] whitespace-pre-line break-all text-center font-mono text-[11px] font-medium leading-tight text-white/40 transition-all duration-[1500ms] ease-in-out [text-shadow:0_1px_2px_rgba(0,0,0,.7)] sm:text-[13px]"
          style={{ top: `${posicion.top}%`, left: `${posicion.left}%` }}
        >
          {marca}
        </span>
      )}

      {/* Pantalla completa del contenedor (visible siempre en pantallas táctiles) */}
      {listo && puedeCompleta && (
        <button
          type="button"
          onClick={alternarCompleta}
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/20 transition-opacity hover:bg-black/75 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
          aria-label={completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {completa ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
};

/* Texto de la marca de agua para un alumno. */
export const marcaAlumno = (alumno) =>
  alumno?.correo ? `${alumno.correo}\nAcademy AvantCode` : 'Academy AvantCode';

export default VideoProtegido;
