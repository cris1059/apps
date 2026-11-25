import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Award,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Compass,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { alumnoService } from '../../services/alumno';
import { codigoError, mensajeError } from '../../services/api';
import Cargando from '../../components/UI/Cargando';
import Modal from '../../components/UI/Modal';
import Marca from '../../components/Marca/Marca';
import Medidor from '../../components/Panel/Medidor';
import Temario from '../../components/Aprender/Temario';
import Reproductor from '../../components/Aprender/Reproductor';
import Celebracion from '../../components/Aprender/Celebracion';
import InstruccionesPago from '../../components/Panel/InstruccionesPago';
import { aplanarTemario, ICONO_TIPO } from '../../components/Aprender/utilidades';
import { duracion, TIPOS_LECCION } from '../../utils/formato';

/* Fondo claro con luces ambientales (fijo detrás del contenido). */
const Fondo = ({ children }) => (
  <div className="relative isolate min-h-screen bg-gray-100">
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div className="ambiente">
        <span className="ambiente-luz ambiente-luz--lima" />
        <span className="ambiente-luz ambiente-luz--violeta" />
        <span className="ambiente-luz ambiente-luz--teal" />
      </div>
    </div>
    {children}
  </div>
);

/* Pantalla para quien no tiene acceso (no inscrito, pago pendiente o curso inexistente). */
const SinAcceso = ({ slug, noExiste, proximamente, mensaje, inscripcion }) => {
  const pendiente = inscripcion?.estado === 'pendiente_pago';
  return (
  <Fondo>
    <div className="grid min-h-screen place-items-center p-5">
      <div className="glass w-full max-w-md rounded-[28px] p-8 text-center">
        <span className={`app-icono mx-auto h-14 w-14 rounded-2xl [&_svg]:h-6 [&_svg]:w-6 ${noExiste ? 'app-icono-claro' : 'app-icono-ambar'}`}>
          {noExiste ? <BookOpen /> : <Lock />}
        </span>
        <h1 className="pagina-titulo mt-5 text-[1.9rem]">
          {noExiste ? 'No encontramos este curso' : proximamente ? 'Este curso aún no abre' : pendiente ? 'Tu pago está pendiente' : 'Aún no tienes acceso'}
        </h1>
        <p className="pagina-sub mx-auto">
          {mensaje ||
            (noExiste
              ? 'Puede que ya no esté disponible.'
              : pendiente
                ? 'En cuanto confirmemos tu transferencia activaremos el curso y te avisaremos por correo.'
                : 'Inscríbete al curso para empezar a aprender.')}
        </p>
        {pendiente && (
          <div className="mt-5 text-left">
            <InstruccionesPago inscripcion={inscripcion} />
          </div>
        )}
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/mis-cursos" className="btn-secondary">Mis cursos</Link>
          {noExiste ? (
            <Link to="/cursos" className="btn-primary"><Compass className="h-4 w-4" /> Explorar cursos</Link>
          ) : (
            <Link to={`/cursos/${slug}`} className="btn-primary">Ver el curso</Link>
          )}
        </div>
      </div>
    </div>
  </Fondo>
  );
};

const Aprender = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState({ cargando: true, error: null, codigo: null, inscripcion: null });
  const [completadas, setCompletadas] = useState(() => new Set());
  const [porcentaje, setPorcentaje] = useState(0);
  const [certificado, setCertificado] = useState(null);
  const [celebrar, setCelebrar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [temarioVisible, setTemarioVisible] = useState(true);
  const [temarioMovil, setTemarioMovil] = useState(false);
  const ultimaGuardada = useRef(null);
  const contenidoRef = useRef(null);

  // Carga del curso con su contenido completo.
  const cargar = useCallback(() => {
    setEstado({ cargando: true, error: null, codigo: null });
    alumnoService
      .aprender(slug)
      .then((respuesta) => {
        setDatos(respuesta);
        setCompletadas(new Set((respuesta.progreso?.completadas || []).map(String)));
        setPorcentaje(Number(respuesta.progreso?.porcentaje) || 0);
        setCertificado(respuesta.certificado || null);
        ultimaGuardada.current = respuesta.progreso?.ultima_leccion ? String(respuesta.progreso.ultima_leccion) : null;
        setEstado({ cargando: false, error: null, codigo: null });
      })
      .catch((e) => {
        const status = e?.response?.status;
        setEstado({
          cargando: false,
          error: mensajeError(e, 'No pudimos abrir el curso.'),
          codigo: codigoError(e) || (status === 404 ? 'NO_EXISTE' : status === 403 ? 'SIN_ACCESO' : null),
          inscripcion: e?.response?.data?.inscripcion || null,
        });
      });
  }, [slug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Temario con ids garantizados (texto) y lista plana de lecciones.
  const temario = useMemo(
    () =>
      (datos?.curso?.temario || []).map((m, im) => ({
        ...m,
        id: m.id ?? String(im),
        lecciones: (m.lecciones || []).map((l, il) => ({ ...l, id: String(l.id ?? `${im}-${il}`) })),
      })),
    [datos]
  );
  const lecciones = useMemo(() => aplanarTemario(temario), [temario]);

  // Lección actual: ?leccion=… → punto de regreso → primera sin completar → primera.
  const idPedido = params.get('leccion');
  const actual = useMemo(() => {
    if (!lecciones.length) return null;
    return (
      lecciones.find((l) => l.id === idPedido) ||
      lecciones.find((l) => l.id === ultimaGuardada.current) ||
      lecciones.find((l) => !completadas.has(l.id)) ||
      lecciones[0]
    );
    // completadas solo influye en la elección inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecciones, idPedido]);

  const indice = actual ? lecciones.findIndex((l) => l.id === actual.id) : -1;
  const anterior = indice > 0 ? lecciones[indice - 1] : null;
  const siguiente = indice >= 0 && indice < lecciones.length - 1 ? lecciones[indice + 1] : null;
  const actualHecha = actual ? completadas.has(actual.id) : false;

  // Guarda el punto de regreso cuando cambia la lección.
  useEffect(() => {
    if (!actual || ultimaGuardada.current === actual.id) return;
    ultimaGuardada.current = actual.id;
    alumnoService.guardarUltima(slug, actual.id).catch(() => {});
  }, [actual, slug]);

  const irA = (id) => {
    setParams({ leccion: id }, { replace: false });
    setTemarioMovil(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contenidoRef.current?.focus({ preventScroll: true });
  };

  // Progreso y certificado que devuelve el servidor (al marcar, aprobar un examen o terminar una práctica).
  const aplicarProgreso = (respuesta, { avisar = true } = {}) => {
    if (respuesta?.progreso) {
      setCompletadas(new Set((respuesta.progreso.completadas || []).map(String)));
      setPorcentaje(Number(respuesta.progreso.porcentaje) || 0);
    }
    if (respuesta?.certificado) {
      if (!certificado) setCelebrar(respuesta.certificado);
      setCertificado(respuesta.certificado);
    } else if (avisar && siguiente) {
      toast.success('¡Lección completada!');
    }
  };

  // La práctica terminó: se marca la lección (si no lo estaba).
  const completarPractica = async (leccion) => {
    if (completadas.has(leccion.id)) return;
    try {
      aplicarProgreso(await alumnoService.marcarLeccion(slug, leccion.id, true), { avisar: false });
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar tu avance.'));
    }
  };

  // Lecciones con examen o práctica: se completan haciendo la actividad, no con el botón.
  const tipoActividad = actual?.actividad?.tipo || null;

  const marcar = async () => {
    if (!actual || guardando || actualHecha) return;
    if (tipoActividad) {
      document.getElementById('actividad-leccion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    // Optimista y acumulativo: completar suma avance, nunca lo elimina.
    setCompletadas((s) => {
      const n = new Set(s);
      n.add(actual.id);
      return n;
    });
    setGuardando(true);
    try {
      const respuesta = await alumnoService.marcarLeccion(slug, actual.id, true);
      if (respuesta.progreso) {
        setCompletadas(new Set((respuesta.progreso.completadas || []).map(String)));
        setPorcentaje(Number(respuesta.progreso.porcentaje) || 0);
      }
      if (respuesta.certificado && !certificado) {
        setCertificado(respuesta.certificado);
        setCelebrar(respuesta.certificado);
      } else if (respuesta.certificado) {
        setCertificado(respuesta.certificado);
      }
      if (!respuesta.certificado && siguiente) toast.success('¡Lección completada!');
    } catch (e) {
      setCompletadas((s) => {
        const n = new Set(s);
        n.delete(actual.id);
        return n;
      });
      toast.error(mensajeError(e, 'No se pudo guardar tu avance.'));
    } finally {
      setGuardando(false);
    }
  };

  if (estado.cargando) return <Cargando pantalla texto="Abriendo el curso…" />;

  // Antes de su fecha de lanzamiento: se ve que existe, pero sus lecciones abren ese día.
  if (estado.codigo === 'CURSO_PROXIMAMENTE') return <SinAcceso slug={slug} proximamente mensaje={estado.error} />;

  if (estado.codigo === 'SIN_ACCESO' || estado.codigo === 'NO_EXISTE') {
    return <SinAcceso slug={slug} noExiste={estado.codigo === 'NO_EXISTE'} inscripcion={estado.inscripcion} />;
  }

  if (estado.error) {
    return (
      <Fondo>
        <div className="grid min-h-screen place-items-center p-5">
          <div className="glass w-full max-w-md rounded-[28px] p-8 text-center">
            <h1 className="pagina-titulo text-[1.9rem]">Algo salió mal</h1>
            <p className="pagina-sub mx-auto">{estado.error}</p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/mis-cursos" className="btn-secondary">Mis cursos</Link>
              <button type="button" onClick={cargar} className="btn-primary"><RotateCcw className="h-4 w-4" /> Reintentar</button>
            </div>
          </div>
        </div>
      </Fondo>
    );
  }

  const curso = datos?.curso || {};
  const IconoTipo = ICONO_TIPO[actual?.tipo] || ICONO_TIPO.lectura;
  const temarioProps = { temario, actual: actual?.id, completadas, porcentaje, onElegir: irA };

  return (
    <Fondo>
      {/* Barra superior */}
      <header className="barra gap-2 sm:gap-3">
        <Link to="/mis-cursos" className="btn-icono -ml-2" aria-label="Volver a mis cursos" title="Volver a mis cursos">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to="/panel" className="hidden md:block" aria-label="AvantCode Academy, panel">
          <Marca className="[&_.marca-nombre]:hidden xl:[&_.marca-nombre]:inline" />
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-black/10 md:block" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tinta sm:text-[15px]">{curso.titulo}</p>
          <p className="truncate text-xs text-tinta-3 sm:hidden">
            {completadas.size}/{lecciones.length} lecciones · {Math.round(porcentaje)}%
          </p>
        </div>
        <Medidor porcentaje={porcentaje} className="hidden w-48 sm:flex lg:w-60" />
        {certificado && (
          <Link
            to={`/certificados?folio=${encodeURIComponent(certificado.folio)}`}
            className="btn-lima btn-sm hidden sm:inline-flex"
          >
            <Award className="h-4 w-4" />
            Certificado
          </Link>
        )}
        <button
          type="button"
          onClick={() => setTemarioVisible((v) => !v)}
          className="btn-icono hidden lg:inline-grid"
          aria-label={temarioVisible ? 'Ocultar temario' : 'Mostrar temario'}
          title={temarioVisible ? 'Ocultar temario' : 'Mostrar temario'}
        >
          {temarioVisible ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => setTemarioMovil(true)}
          className="btn-secondary btn-sm lg:hidden"
          aria-label="Ver temario"
        >
          <ListChecks className="h-4 w-4" />
          <span className="hidden sm:inline">Temario</span>
        </button>
      </header>

      <div className="lg:flex">
        {/* Temario (escritorio) */}
        {temarioVisible && (
          <aside className="scroll-fino sticky top-[var(--barra-alto)] hidden h-[calc(100vh-var(--barra-alto))] w-[340px] shrink-0 overflow-y-auto px-3 pb-8 pt-4 lg:block xl:w-[360px]">
            <Temario {...temarioProps} />
          </aside>
        )}

        {/* Lección */}
        <main
          ref={contenidoRef}
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 pb-32 pt-5 outline-none sm:px-6 lg:px-10 lg:pb-16 lg:pt-6"
        >
          {!actual ? (
            <div className="card mx-auto max-w-3xl">
              <div className="vacio">
                <span className="app-icono app-icono-claro"><BookOpen /></span>
                <p className="text-sm">Este curso todavía no tiene lecciones publicadas.</p>
              </div>
            </div>
          ) : (
            <>
            <article className="mx-auto max-w-4xl" style={{ animation: 'entrar .4s cubic-bezier(.22,.61,.36,1) backwards' }} key={actual.id}>
              <p className="etiqueta mb-4">
                <span className="etiqueta-punto" aria-hidden="true" />
                Módulo {actual.modulo.numero} · {actual.modulo.titulo}
              </p>
              <h1 className="pagina-titulo text-[clamp(1.6rem,3vw,2.3rem)]">{actual.titulo}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-3">
                <span className="inline-flex items-center gap-1.5">
                  <IconoTipo className="h-4 w-4" />
                  {TIPOS_LECCION[actual.tipo] || 'Lección'}
                </span>
                {Number(actual.duracion_min) > 0 && <span>{duracion(actual.duracion_min)}</span>}
                <span className="numero">Lección {indice + 1} de {lecciones.length}</span>
                {actualHecha && (
                  <span className="badge badge-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completada
                  </span>
                )}
              </p>

              <div className="mt-6">
                <Reproductor
                  leccion={actual}
                  slug={slug}
                  completada={actualHecha}
                  onEnviado={(respuesta) => respuesta?.resultado?.aprobado && aplicarProgreso(respuesta, { avisar: false })}
                  onCompletar={() => completarPractica(actual)}
                />
              </div>
            </article>

              {/* Acciones: barra fija en móvil, en línea en escritorio */}
              <div className="glass-fuerte fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-full p-1.5 lg:static lg:mx-auto lg:mt-8 lg:max-w-4xl lg:rounded-[22px] lg:p-2">
                <button
                  type="button"
                  onClick={() => anterior && irA(anterior.id)}
                  disabled={!anterior}
                  className="btn-ghost shrink-0 px-3 sm:px-4"
                  aria-label="Lección anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={marcar}
                  disabled={guardando || actualHecha}
                  aria-pressed={actualHecha}
                  className={`flex-1 ${actualHecha ? 'btn-success' : 'btn-primary'}`}
                >
                  {actualHecha ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <Circle className="h-[18px] w-[18px]" />}
                  <span className="truncate">
                    {actualHecha
                      ? 'Completada'
                      : tipoActividad === 'examen'
                        ? 'Aprueba el examen para completarla'
                        : tipoActividad === 'practica'
                          ? 'Termina la práctica para completarla'
                          : 'Marcar como completada'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => siguiente && irA(siguiente.id)}
                  disabled={!siguiente}
                  className={`shrink-0 px-3 sm:px-4 ${actualHecha && siguiente ? 'btn-lima' : 'btn-ghost'}`}
                  aria-label="Lección siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {!siguiente && actualHecha && !certificado && porcentaje < 100 && (
                <p className="mx-auto mt-4 max-w-4xl text-center text-sm text-tinta-3">
                  Es la última lección. Completa las que te faltan en el temario para obtener tu certificado.
                </p>
              )}
            </>
          )}
        </main>
      </div>

      {/* Temario (móvil): hoja inferior */}
      <Modal abierto={temarioMovil} onCerrar={() => setTemarioMovil(false)} titulo="Temario" descripcion={curso.titulo}>
        <Temario {...temarioProps} />
      </Modal>

      <Celebracion certificado={celebrar} onCerrar={() => setCelebrar(null)} />
    </Fondo>
  );
};

export default Aprender;
