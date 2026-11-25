import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock3, Award, Play, ArrowUpRight, Compass, Hourglass, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { alumnoService } from '../../services/alumno';
import { mensajeError } from '../../services/api';
import Encabezado from '../../components/UI/Encabezado';
import Cargando from '../../components/UI/Cargando';
import Medidor from '../../components/Panel/Medidor';
import PortadaCurso from '../../components/Panel/PortadaCurso';
import { agrupar, cursoParaContinuar, leccionesCompletadas, minutosAprendidos, porcentajeDe } from '../../components/Panel/util';
import { duracion, moneda, NIVELES } from '../../utils/formato';

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const PanelInicio = () => {
  const { alumno } = useAuth();
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    alumnoService
      .misCursos()
      .then(setInscripciones)
      .catch((e) => setError(mensajeError(e, 'No pudimos cargar tus cursos.')))
      .finally(() => setCargando(false));
  }, []);

  const datos = useMemo(() => {
    const grupos = agrupar(inscripciones);
    return {
      ...grupos,
      lecciones: grupos.activas.reduce((t, i) => t + leccionesCompletadas(i), 0),
      minutos: grupos.activas.reduce((t, i) => t + minutosAprendidos(i), 0),
      certificados: grupos.activas.filter((i) => i.certificado).length,
      continuar: cursoParaContinuar(inscripciones),
    };
  }, [inscripciones]);

  if (cargando) return <Cargando />;

  const nombre = alumno?.nombre_completo?.split(' ')[0] || '';
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const sinCursos = inscripciones.length === 0;

  return (
    <div className="pagina">
      <Encabezado
        etiqueta={hoy.charAt(0).toUpperCase() + hoy.slice(1)}
        titulo={`${saludo()}, ${nombre}.`}
        apagado={sinCursos ? 'Empieza tu primer curso.' : 'Sigue donde te quedaste.'}
        acciones={
          <Link to="/mis-cursos" className="btn-secondary">
            Mis cursos
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      {error && (
        <div className="card border-[#B3261E]/20 text-sm text-[#B3261E]" role="alert">
          {error}
        </div>
      )}

      {/* Indicadores */}
      <section className="kpis" aria-label="Tu avance">
        <div className="kpi-oscuro">
          <div className="flex items-center justify-between">
            <span className="app-icono bg-white/10 text-lima shadow-none ring-1 ring-white/15">
              <BookOpen />
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
              {datos.completadas.length} terminados
            </span>
          </div>
          <div>
            <p className="kpi-etiqueta">Cursos activos</p>
            <p className="kpi-valor mt-1">{datos.activas.length}</p>
          </div>
        </div>
        <div className="kpi">
          <span className="app-icono app-icono-teal"><CheckCircle2 /></span>
          <div>
            <p className="kpi-etiqueta">Lecciones completadas</p>
            <p className="kpi-valor mt-1">{datos.lecciones.toLocaleString('es-MX')}</p>
          </div>
        </div>
        <div className="kpi">
          <span className="app-icono app-icono-violeta"><Clock3 /></span>
          <div>
            <p className="kpi-etiqueta">Tiempo de aprendizaje</p>
            <p className="kpi-valor mt-1">{duracion(datos.minutos)}</p>
            <p className="mt-1 text-xs text-tinta-3">Aproximado</p>
          </div>
        </div>
        <div className="kpi">
          <span className="app-icono app-icono-ambar"><Award /></span>
          <div>
            <p className="kpi-etiqueta">Certificados</p>
            <p className="kpi-valor mt-1">{datos.certificados}</p>
          </div>
        </div>
      </section>

      {/* Pagos pendientes */}
      {datos.pendientes.length > 0 && (
        <Link
          to="/mis-cursos?vista=pendientes"
          className="card flex items-center gap-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="app-icono app-icono-ambar"><Hourglass /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-tinta">
              {datos.pendientes.length === 1
                ? 'Tienes un curso esperando tu pago'
                : `Tienes ${datos.pendientes.length} cursos esperando tu pago`}
            </p>
            <p className="truncate text-sm text-tinta-3">
              {datos.pendientes.map((p) => `${p.curso_titulo} (${moneda(p.precio)})`).join(' · ')}
            </p>
          </div>
          <span className="btn-secondary btn-sm hidden sm:inline-flex">Ver datos de pago</span>
          <ArrowUpRight className="h-5 w-5 text-tinta-3 sm:hidden" />
        </Link>
      )}

      {sinCursos ? (
        <section className="card">
          <div className="vacio py-14">
            <span className="app-icono app-icono-tinta h-14 w-14 rounded-2xl [&_svg]:h-6 [&_svg]:w-6"><GraduationCap /></span>
            <p className="display mt-2 text-xl font-semibold text-tinta">Todavía no tienes cursos</p>
            <p className="max-w-sm text-sm">Explora el catálogo y empieza a aprender desarrollo web, inteligencia artificial, marketing y más.</p>
            <Link to="/cursos" className="btn-primary mt-2">
              <Compass className="h-4 w-4" />
              Explorar cursos
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5">
          {/* Continuar aprendiendo */}
          <section className="lg:col-span-3" aria-labelledby="titulo-continuar">
            {datos.continuar ? (
              <article className="kpi-oscuro h-full gap-0 overflow-hidden p-0 md:p-0">
                <div className="relative h-40 w-full overflow-hidden sm:h-44">
                  <PortadaCurso curso={datos.continuar.curso} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/40 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Continuar aprendiendo
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
                  <div>
                    <h2 id="titulo-continuar" className="display text-xl font-semibold leading-tight text-white md:text-2xl">
                      {datos.continuar.curso_titulo}
                    </h2>
                    <p className="mt-1 text-sm text-white/55">
                      {leccionesCompletadas(datos.continuar)} de {datos.continuar.progreso?.total || datos.continuar.curso?.total_lecciones || 0} lecciones
                      {datos.continuar.curso?.nivel && ` · ${NIVELES[datos.continuar.curso.nivel] || datos.continuar.curso.nivel}`}
                    </p>
                  </div>
                  <Medidor porcentaje={porcentajeDe(datos.continuar)} claro />
                  <Link to={`/aprender/${datos.continuar.curso_slug}`} className="btn-lima self-start">
                    <Play className="h-4 w-4" />
                    {leccionesCompletadas(datos.continuar) ? 'Continuar' : 'Empezar curso'}
                  </Link>
                </div>
              </article>
            ) : (
              <article className="card flex h-full flex-col items-start justify-center gap-3">
                <span className="app-icono app-icono-teal"><Award /></span>
                <h2 id="titulo-continuar" className="card-titulo">¡Terminaste todos tus cursos!</h2>
                <p className="text-sm text-tinta-3">Descarga tus certificados o encuentra tu siguiente curso.</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/certificados" className="btn-secondary btn-sm">Ver certificados</Link>
                  <Link to="/cursos" className="btn-primary btn-sm">Explorar cursos</Link>
                </div>
              </article>
            )}
          </section>

          {/* Mis cursos activos */}
          <section className="card lg:col-span-2" aria-labelledby="titulo-activos">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="titulo-activos" className="card-titulo">Mis cursos</h2>
              <Link to="/mis-cursos" className="btn-ghost btn-sm">
                Ver todos <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            {datos.activas.length === 0 ? (
              <p className="py-6 text-center text-sm text-tinta-3">Tus cursos aparecerán aquí cuando se active tu inscripción.</p>
            ) : (
              <ul className="-mx-2 space-y-1">
                {datos.activas.slice(0, 5).map((ins) => (
                  <li key={ins.id_inscripcion}>
                    <Link
                      to={`/aprender/${ins.curso_slug}`}
                      className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/70"
                    >
                      <span className="h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                        <PortadaCurso curso={ins.curso} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-tinta">{ins.curso_titulo}</span>
                        <Medidor porcentaje={porcentajeDe(ins)} alto="h-1.5" className="mt-1.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default PanelInicio;
