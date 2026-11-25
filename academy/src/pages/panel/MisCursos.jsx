import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Play, Award, Compass, XCircle, BookOpen, ArrowUpRight, Hourglass, RotateCcw } from 'lucide-react';
import { alumnoService } from '../../services/alumno';
import { mensajeError } from '../../services/api';
import Encabezado from '../../components/UI/Encabezado';
import Cargando from '../../components/UI/Cargando';
import Modal from '../../components/UI/Modal';
import Medidor from '../../components/Panel/Medidor';
import PortadaCurso from '../../components/Panel/PortadaCurso';
import InstruccionesPago from '../../components/Panel/InstruccionesPago';
import CertificadoModal from '../../components/Certificado/CertificadoModal';
import { agrupar, estaCompleto, leccionesCompletadas, porcentajeDe } from '../../components/Panel/util';
import { ESTADOS_INSCRIPCION, NIVELES, duracion, fechaCorta, moneda } from '../../utils/formato';

const VISTAS = [
  { id: 'curso', texto: 'En curso' },
  { id: 'completados', texto: 'Completados' },
  { id: 'pendientes', texto: 'Pago pendiente' },
  { id: 'todos', texto: 'Todos' },
];

/* Tarjeta de una inscripción. */
const TarjetaInscripcion = ({ inscripcion, onCancelar, onVerCertificado }) => {
  const { curso, estado } = inscripcion;
  const activa = estado === 'activa';
  const completo = activa && estaCompleto(inscripcion);
  const info = ESTADOS_INSCRIPCION[estado] || ESTADOS_INSCRIPCION.cancelada;
  const total = inscripcion.progreso?.total || curso?.total_lecciones || 0;

  return (
    <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <Link
        to={curso ? `/cursos/${inscripcion.curso_slug}` : '#'}
        className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl sm:w-56 sm:self-start"
        aria-label={`Ver la página de ${inscripcion.curso_titulo}`}
      >
        <PortadaCurso curso={curso} />
        {completo && (
          <span className="absolute left-2.5 top-2.5 badge badge-success bg-white/90">Completado</span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="display text-lg font-semibold leading-snug text-tinta">{inscripcion.curso_titulo}</h3>
            <p className="mt-0.5 text-[13px] text-tinta-3">
              {[
                curso?.nivel && (NIVELES[curso.nivel] || curso.nivel),
                total ? `${total} lecciones` : null,
                curso?.duracion_total_min ? duracion(curso.duracion_total_min) : null,
                curso?.instructor?.nombre,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          {!activa && <span className={`badge ${info.badge}`}>{info.texto}</span>}
        </div>

        {activa && (
          <div>
            <Medidor porcentaje={porcentajeDe(inscripcion)} />
            <p className="mt-1.5 text-xs text-tinta-3">
              {leccionesCompletadas(inscripcion)} de {total} lecciones completadas
            </p>
          </div>
        )}

        {estado === 'pendiente_pago' && <InstruccionesPago inscripcion={inscripcion} />}

        {estado === 'cancelada' && (
          <p className="text-sm text-tinta-3">Esta solicitud se canceló. Puedes inscribirte de nuevo desde la página del curso.</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2">
          {activa && (
            <Link to={`/aprender/${inscripcion.curso_slug}`} className={completo ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}>
              {completo ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {completo ? 'Repasar' : leccionesCompletadas(inscripcion) ? 'Continuar' : 'Empezar'}
            </Link>
          )}
          {inscripcion.certificado && (
            <button type="button" onClick={() => onVerCertificado(inscripcion.certificado)} className="btn-primary btn-sm">
              <Award className="h-4 w-4" />
              Ver certificado
            </button>
          )}
          {estado === 'pendiente_pago' && (
            <button type="button" onClick={() => onCancelar(inscripcion)} className="btn-ghost btn-sm text-[#B3261E] hover:!bg-[#B3261E]/[.08] hover:!text-[#B3261E]">
              <XCircle className="h-4 w-4" />
              Cancelar solicitud
            </button>
          )}
          {estado === 'cancelada' && (
            <Link to={`/cursos/${inscripcion.curso_slug}`} className="btn-secondary btn-sm">
              Ver curso <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
          <span className="ml-auto text-xs text-tinta-3">
            Folio <span className="numero font-medium text-tinta-2">{inscripcion.folio}</span> · {fechaCorta(inscripcion.fecha_inscripcion)}
          </span>
        </div>
      </div>
    </article>
  );
};

const MisCursos = () => {
  const [params, setParams] = useSearchParams();
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [porCancelar, setPorCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [certificado, setCertificado] = useState(null);

  const cargar = () =>
    alumnoService
      .misCursos()
      .then(setInscripciones)
      .catch((e) => toast.error(mensajeError(e, 'No pudimos cargar tus cursos.')))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const grupos = useMemo(() => agrupar(inscripciones), [inscripciones]);
  const listas = {
    curso: grupos.enCurso,
    completados: grupos.completadas,
    pendientes: grupos.pendientes,
    todos: inscripciones,
  };

  // Si no se pidió una vista, se abre la primera que tenga algo.
  const vistaPedida = params.get('vista');
  const vista = VISTAS.some((v) => v.id === vistaPedida)
    ? vistaPedida
    : (['curso', 'pendientes', 'completados'].find((v) => listas[v].length) || 'todos');
  const visibles = listas[vista];

  const cancelar = async () => {
    if (!porCancelar) return;
    setCancelando(true);
    try {
      const actualizada = await alumnoService.cancelarInscripcion(porCancelar.id_inscripcion);
      setInscripciones((lista) =>
        lista.map((i) => (i.id_inscripcion === porCancelar.id_inscripcion ? { ...i, ...actualizada, curso: i.curso, progreso: i.progreso } : i))
      );
      toast.success('Solicitud cancelada');
      setPorCancelar(null);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo cancelar la solicitud.'));
    } finally {
      setCancelando(false);
    }
  };

  if (cargando) return <Cargando />;

  return (
    <div className="pagina">
      <Encabezado
        etiqueta={`${grupos.activas.length} ${grupos.activas.length === 1 ? 'curso activo' : 'cursos activos'}`}
        titulo="Mis cursos."
        apagado="Todo lo que estás aprendiendo."
        acciones={
          <Link to="/cursos" className="btn-primary">
            <Compass className="h-4 w-4" />
            Explorar cursos
          </Link>
        }
      />

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="segmentado" role="tablist" aria-label="Filtrar cursos">
          {VISTAS.map(({ id, texto }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={vista === id}
              onClick={() => setParams(id === 'curso' ? {} : { vista: id }, { replace: true })}
            >
              {id === 'pendientes' && listas.pendientes.length > 0 && <Hourglass className="h-3.5 w-3.5" />}
              {texto}
              <span
                className={`numero rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  vista === id ? 'bg-negro text-lima' : 'bg-black/[.06] text-tinta-3'
                }`}
              >
                {listas[id].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <section className="card">
          <div className="vacio">
            <span className="app-icono app-icono-claro"><BookOpen /></span>
            <p className="text-sm">
              {vista === 'completados'
                ? 'Aún no terminas ningún curso. ¡Tú puedes!'
                : vista === 'pendientes'
                  ? 'No tienes pagos pendientes.'
                  : 'No tienes cursos aquí todavía.'}
            </p>
            <Link to="/cursos" className="btn-primary btn-sm mt-1">
              <Compass className="h-4 w-4" /> Explorar cursos
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {visibles.map((ins) => (
            <TarjetaInscripcion
              key={ins.id_inscripcion}
              inscripcion={ins}
              onCancelar={setPorCancelar}
              onVerCertificado={setCertificado}
            />
          ))}
        </div>
      )}

      <Modal
        abierto={!!porCancelar}
        onCerrar={() => !cancelando && setPorCancelar(null)}
        titulo="¿Cancelar la solicitud?"
        descripcion={porCancelar?.curso_titulo}
      >
        <p className="text-sm text-tinta-2">
          Si ya hiciste la transferencia, no la canceles: escríbenos con tu folio <b className="numero">{porCancelar?.folio}</b> para
          activarla. Si cancelas, podrás inscribirte de nuevo cuando quieras.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={() => setPorCancelar(null)} disabled={cancelando}>
            Mantener solicitud
          </button>
          <button type="button" className="btn-danger" onClick={cancelar} disabled={cancelando}>
            {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </Modal>

      {certificado && <CertificadoModal certificado={certificado} onCerrar={() => setCertificado(null)} />}
    </div>
  );
};

export default MisCursos;
