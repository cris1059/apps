import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Eye,
  Gift,
  GraduationCap,
  Landmark,
  Link2,
  Linkedin,
  ListChecks,
  Lock,
  MapPin,
  MessageSquare,
  Play,
  PlayCircle,
  Signal,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { obtenerCurso, inscribirme, enviarResena, videoPrevia } from '../../services/publico';
import { marcaAlumno } from '../../components/UI/VideoProtegido';
import { mensajeError } from '../../services/api';
import { alumnoService } from '../../services/alumno';
import Cargando from '../../components/UI/Cargando';
import Modal from '../../components/UI/Modal';
import Avatar from '../../components/UI/Avatar';
import Estrellas, { SelectorEstrellas } from '../../components/Curso/Estrellas';
import Precio, { descuento } from '../../components/Curso/Precio';
import Reproductor from '../../components/Curso/Reproductor';
import InstruccionesPago from '../../components/Curso/InstruccionesPago';
import { copiarTexto } from '../../components/Panel/util';
import { urlCompartirLinkedIn } from '../../utils/linkedin';
import { MODALIDADES, NIVELES, TIPOS_LECCION, duracion, esGratis, fechaCorta, fechaLarga, moneda, precioEfectivo } from '../../utils/formato';

const ICONO_TIPO = { video: PlayCircle, lectura: BookOpen, practica: Code2, examen: ListChecks };

const minutosModulo = (m) => (m.lecciones || []).reduce((t, l) => t + (Number(l.duracion_min) || 0), 0);

/* ---------- Temario en acordeón ---------- */
const Temario = ({ temario = [], conAcceso, onVistaPrevia }) => {
  const [abiertos, setAbiertos] = useState(() => new Set([temario[0]?.id ?? 0]));
  const alternar = (id) =>
    setAbiertos((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div>
      {temario.map((m, i) => {
        const id = m.id ?? i;
        const abierto = abiertos.has(id);
        return (
          <div key={id} className="ac-temario-modulo">
            <button type="button" className="ac-temario-cabecera" aria-expanded={abierto} onClick={() => alternar(id)}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-tinta">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{m.titulo}</span>
                <span className="block text-xs text-tinta-3">
                  {m.lecciones?.length || 0} {m.lecciones?.length === 1 ? 'lección' : 'lecciones'}
                  {minutosModulo(m) > 0 && ` · ${duracion(minutosModulo(m))}`}
                </span>
              </span>
              <ChevronDown className={`h-5 w-5 text-tinta-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
            </button>
            {abierto && (
              <div>
                {m.descripcion && <p className="m-0 px-[18px] pb-3 text-sm text-tinta-3">{m.descripcion}</p>}
                {(m.lecciones || []).map((l, j) => {
                  const Icono = ICONO_TIPO[l.tipo] || PlayCircle;
                  const previa = l.vista_previa && (l.video_url || l.video_protegido || l.contenido);
                  return (
                    <div key={l.id ?? j} className="ac-temario-leccion">
                      <Icono className="h-[18px] w-[18px] shrink-0 text-tinta-2" />
                      <span className="min-w-0 flex-1 truncate text-tinta">{l.titulo}</span>
                      <span className="hidden text-xs text-tinta-3 sm:inline">{TIPOS_LECCION[l.tipo] || 'Lección'}</span>
                      {l.duracion_min > 0 && <span className="numero text-xs text-tinta-3">{l.duracion_min} min</span>}
                      {previa ? (
                        <button type="button" className="btn-ghost btn-sm -my-1" onClick={() => onVistaPrevia(l)}>
                          <Eye className="h-4 w-4" /> Vista previa
                        </button>
                      ) : !conAcceso ? (
                        <Lock className="h-4 w-4 shrink-0 text-tinta-3" aria-label="Disponible al inscribirte" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Formulario de reseña ---------- */
const FormularioResena = ({ slug, miResena, onGuardada }) => {
  const [calificacion, setCalificacion] = useState(miResena?.calificacion || 0);
  const [comentario, setComentario] = useState(miResena?.comentario || '');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!calificacion) return toast.error('Elige de 1 a 5 estrellas');
    setEnviando(true);
    try {
      const resena = await enviarResena(slug, { calificacion, comentario: comentario.trim() });
      toast.success(miResena ? 'Actualizamos tu reseña' : 'Gracias por tu reseña');
      onGuardada(resena);
    } catch (error) {
      toast.error(mensajeError(error, 'No pudimos guardar tu reseña'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="ac-tarjeta space-y-4 p-5">
      <div>
        <p className="m-0 font-semibold text-tinta">{miResena ? 'Tu reseña' : '¿Qué te pareció el curso?'}</p>
        <p className="m-0 text-sm text-tinta-3">Tu opinión ayuda a otros alumnos a decidir.</p>
      </div>
      <SelectorEstrellas valor={calificacion} onChange={setCalificacion} />
      <div>
        <label htmlFor="comentario-resena" className="label">Comentario</label>
        <textarea
          id="comentario-resena"
          className="input-field min-h-[100px]"
          maxLength={1000}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Cuéntanos qué aprendiste y qué mejorarías"
        />
      </div>
      <button type="submit" className="ac-btn ac-btn--negro" disabled={enviando}>
        {enviando ? 'Guardando…' : miResena ? 'Actualizar reseña' : 'Publicar reseña'}
      </button>
    </form>
  );
};

/* ---------- Página ---------- */
const CursoDetalle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { estaAutenticado, alumno } = useAuth();
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | no_encontrado | error
  const [error, setError] = useState('');
  const [previa, setPrevia] = useState(null); // { titulo, video_url, contenido }
  const [modalPago, setModalPago] = useState(false);
  const [modalInstrucciones, setModalInstrucciones] = useState(false);
  const [metodo, setMetodo] = useState('transferencia');
  const [inscribiendo, setInscribiendo] = useState(false);
  const [saldoDisponible, setSaldoDisponible] = useState(0);

  // Saldo por invitaciones: se descuenta solo en los cursos de pago.
  const cursoDePago = datos?.curso ? !esGratis(datos.curso) : false;
  useEffect(() => {
    if (!estaAutenticado || !cursoDePago) return;
    alumnoService
      .saldo()
      .then((d) => setSaldoDisponible(Number(d.saldo) || 0))
      .catch(() => {});
  }, [estaAutenticado, cursoDePago, modalPago]);

  const cargar = useCallback(async () => {
    try {
      const d = await obtenerCurso(slug);
      setDatos(d);
      setEstado('listo');
    } catch (e) {
      if (e?.response?.status === 404) setEstado('no_encontrado');
      else {
        setError(mensajeError(e, 'No pudimos cargar el curso.'));
        setEstado('error');
      }
    }
  }, [slug]);

  useEffect(() => {
    setEstado('cargando');
    cargar();
  }, [cargar]);

  if (estado === 'cargando') return <Cargando />;

  if (estado === 'no_encontrado' || estado === 'error') {
    return (
      <div className="ac-contenedor py-24">
        <div className="ac-tarjeta vacio py-16">
          <span className="app-icono app-icono-claro"><GraduationCap /></span>
          <h1 className="ac-titulo-md">{estado === 'error' ? 'Algo salió mal' : 'Este curso no está disponible'}</h1>
          <p className="m-0 text-sm">{estado === 'error' ? error : 'Puede que el enlace sea incorrecto o que el curso ya no esté publicado.'}</p>
          <Link to="/cursos" className="ac-btn ac-btn--negro mt-2">Ver todos los cursos</Link>
        </div>
      </div>
    );
  }

  const { curso, resenas = [], calificacion = {}, alumnos = 0, inscripcion, mi_resena } = datos;
  const gratis = esGratis(curso);
  const off = descuento(curso);
  const minutos = curso.duracion_total_min || (curso.duracion_horas ? curso.duracion_horas * 60 : 0);
  const conAcceso = inscripcion?.estado === 'activa';
  const saldoAplicado = gratis ? 0 : Math.min(saldoDisponible, precioEfectivo(curso));
  const porPagar = Math.max(0, Math.round((precioEfectivo(curso) - saldoAplicado) * 100) / 100);
  const volver = encodeURIComponent(`/cursos/${slug}`);

  const inscribir = async () => {
    setInscribiendo(true);
    try {
      const nueva = await inscribirme(slug, gratis ? undefined : metodo);
      setDatos((d) => ({ ...d, inscripcion: nueva }));
      setModalPago(false);
      if (nueva.estado === 'activa') {
        toast.success('¡Listo! Ya estás inscrito');
        navigate(`/aprender/${slug}`);
      } else {
        setModalInstrucciones(true);
      }
    } catch (e) {
      const codigo = e?.response?.data?.codigo;
      if (codigo === 'YA_INSCRITO') {
        setModalPago(false);
        const existente = e.response.data.inscripcion;
        if (existente) setDatos((d) => ({ ...d, inscripcion: existente }));
        else await cargar();
        toast('Ya estabas inscrito en este curso');
      } else if (codigo === 'CUPO_LLENO') {
        setModalPago(false);
        toast.error(mensajeError(e, 'Este curso ya no tiene lugares disponibles'));
      } else {
        toast.error(mensajeError(e, 'No pudimos completar tu inscripción'));
      }
    } finally {
      setInscribiendo(false);
    }
  };

  const alPresionarInscribir = () => {
    if (gratis) inscribir();
    else setModalPago(true);
  };

  // Enlace público del curso (LinkedIn arma la vista previa con la portada y el resumen).
  const urlCurso = `${(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)}/cursos/${curso.slug || slug}`;
  const copiarEnlace = async () => {
    if (await copiarTexto(urlCurso)) toast.success('Enlace del curso copiado');
    else toast.error('No se pudo copiar el enlace');
  };

  /* Tarjeta de inscripción (lateral fija en escritorio). */
  const compra = (
    <div className="rounded-[28px] bg-white p-6 shadow-flotante ring-1 ring-black/[.06]">
      <div className="flex items-end justify-between gap-3">
        {curso.proximamente && !curso.total_lecciones ? (
          <span className="ac-precio text-[2rem] leading-none">Muy pronto</span>
        ) : (
          <Precio curso={curso} className="text-[2rem] leading-none" />
        )}
        {off && !gratis && <span className="badge badge-dark">−{off}%</span>}
      </div>
      {!gratis && curso.precio_oferta != null && off && (
        <p className="mb-0 mt-2 text-sm text-tinta-3">Precio especial por tiempo limitado.</p>
      )}

      <div className="mt-5 space-y-2.5">
        {curso.proximamente ? (
          <>
            <div className="superficie p-4 text-center">
              <span className="badge badge-dark">Próximamente</span>
              <p className="display m-0 mt-2 text-lg font-semibold text-tinta">{curso.abre_el ? `Abre el ${curso.abre_el}` : 'Estamos grabando las lecciones'}</p>
              <p className="m-0 mt-1 text-sm text-tinta-3">
                {curso.abre_el
                  ? conAcceso
                    ? 'Ya estás inscrito: ese día se abren tus lecciones.'
                    : 'Las inscripciones y las lecciones se abren ese día.'
                  : 'Pronto anunciaremos la fecha de apertura aquí mismo.'}
              </p>
            </div>
            {!estaAutenticado && (
              <Link to={`/registro?volver=${volver}`} className="ac-btn ac-btn--gris ac-btn--grande ac-btn--bloque">
                Crear mi cuenta gratis
              </Link>
            )}
          </>
        ) : !estaAutenticado ? (
          <>
            <Link to={`/registro?volver=${volver}`} className="ac-btn ac-btn--negro ac-btn--grande ac-btn--bloque">
              {gratis ? 'Inscribirme gratis' : 'Inscribirme'} <ArrowRight size={18} />
            </Link>
            <p className="m-0 text-center text-sm text-tinta-3">
              ¿Ya tienes cuenta?{' '}
              <Link to={`/entrar?volver=${volver}`} className="enlace">Entrar</Link>
            </p>
          </>
        ) : conAcceso ? (
          <Link to={`/aprender/${slug}`} className="ac-btn ac-btn--negro ac-btn--grande ac-btn--bloque">
            <Play size={18} fill="currentColor" /> Ir al curso
          </Link>
        ) : inscripcion?.estado === 'pendiente_pago' ? (
          <>
            <div className="superficie flex items-center justify-between gap-2 p-3">
              <span className="badge badge-warning">Pago pendiente</span>
              <span className="numero text-sm font-semibold text-tinta">{inscripcion.folio}</span>
            </div>
            <button type="button" className="ac-btn ac-btn--negro ac-btn--grande ac-btn--bloque" onClick={() => setModalInstrucciones(true)}>
              <Landmark size={18} /> Ver datos de pago
            </button>
            <Link to="/mis-cursos" className="ac-btn ac-btn--gris ac-btn--bloque">Ir a mis cursos</Link>
          </>
        ) : (
          <button type="button" className="ac-btn ac-btn--negro ac-btn--grande ac-btn--bloque" onClick={alPresionarInscribir} disabled={inscribiendo}>
            {inscribiendo ? 'Inscribiendo…' : gratis ? 'Inscribirme gratis' : 'Inscribirme'}
            {!inscribiendo && <ArrowRight size={18} />}
          </button>
        )}
      </div>

      <ul className="mt-6 space-y-3 border-t border-black/[.07] pt-5 text-sm text-tinta-2">
        {curso.total_lecciones > 0 && (
          <li className="flex items-center gap-3"><PlayCircle className="h-[18px] w-[18px] text-tinta-3" /> {curso.total_lecciones} lecciones</li>
        )}
        {minutos > 0 && (
          <li className="flex items-center gap-3"><Clock3 className="h-[18px] w-[18px] text-tinta-3" /> {duracion(minutos)} de contenido</li>
        )}
        <li className="flex items-center gap-3"><Signal className="h-[18px] w-[18px] text-tinta-3" /> Nivel {(NIVELES[curso.nivel] || curso.nivel || '').toLowerCase()}</li>
        <li className="flex items-center gap-3"><MapPin className="h-[18px] w-[18px] text-tinta-3" /> {MODALIDADES[curso.modalidad] || curso.modalidad}</li>
        {curso.fecha_inicio && (
          <li className="flex items-center gap-3"><CalendarDays className="h-[18px] w-[18px] text-tinta-3" /> Inicia el {fechaLarga(curso.fecha_inicio)}</li>
        )}
        {curso.cupo > 0 && (
          <li className="flex items-center gap-3"><Users className="h-[18px] w-[18px] text-tinta-3" /> Cupo de {curso.cupo} alumnos</li>
        )}
        <li className="flex items-center gap-3"><Award className="h-[18px] w-[18px] text-tinta-3" /> Certificado al completar</li>
      </ul>

      <div className="mt-5 flex gap-2 border-t border-black/[.07] pt-5">
        <a
          href={urlCompartirLinkedIn(urlCurso)}
          target="_blank"
          rel="noopener noreferrer"
          className="ac-btn ac-btn--gris ac-btn--bloque"
        >
          <Linkedin size={17} className="text-[#0A66C2]" /> Compartir en LinkedIn
        </a>
        <button type="button" onClick={copiarEnlace} className="ac-btn ac-btn--gris shrink-0" aria-label="Copiar enlace del curso" title="Copiar enlace">
          <Link2 size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="ac-contenedor ac-contenedor--amplio pb-[clamp(64px,9vw,120px)] pt-[clamp(20px,3vw,40px)]">
      {/* ---------- Hero ---------- */}
      <section className="ac-detalle-hero">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="min-w-0 p-1 sm:p-3">
            <nav aria-label="Ruta" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-tinta-3">
              <Link to="/cursos" className="hover:text-tinta">Cursos</Link>
              {curso.categoria && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link to={`/cursos?categoria=${encodeURIComponent(curso.categoria)}`} className="hover:text-tinta">{curso.categoria}</Link>
                </>
              )}
            </nav>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {curso.destacado && <span className="badge badge-dark">Destacado</span>}
              {gratis && <span className="badge bg-lima text-negro before:bg-negro">Gratis</span>}
              <span className="badge badge-neutral">{NIVELES[curso.nivel] || curso.nivel}</span>
              <span className="badge badge-neutral">{MODALIDADES[curso.modalidad] || curso.modalidad}</span>
            </div>
            <h1 className="ac-titulo">{curso.titulo}</h1>
            {curso.resumen && <p className="ac-sub mt-4">{curso.resumen}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tinta-2">
              {calificacion.total > 0 ? (
                <Estrellas valor={calificacion.promedio} mostrarValor total={calificacion.total} />
              ) : (
                <span className="badge badge-neutral">Nuevo</span>
              )}
              {alumnos > 0 && (
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-tinta-3" /> {alumnos} {alumnos === 1 ? 'alumno' : 'alumnos'}</span>
              )}
              {minutos > 0 && (
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-tinta-3" /> {duracion(minutos)}</span>
              )}
              {curso.total_lecciones > 0 && (
                <span className="inline-flex items-center gap-1.5"><PlayCircle className="h-4 w-4 text-tinta-3" /> {curso.total_lecciones} lecciones</span>
              )}
            </div>

            {curso.instructor && (
              <div className="mt-6 flex items-center gap-3">
                <Avatar nombre={curso.instructor.nombre} foto={curso.instructor.foto} tamano={40} />
                <div className="min-w-0">
                  <p className="m-0 text-xs text-tinta-3">Instructor</p>
                  <p className="m-0 truncate text-sm font-semibold text-tinta">{curso.instructor.nombre}</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[24px] shadow-flotante">
            <div className="ac-curso-portada" style={{ margin: 0, borderRadius: 0 }}>
              {curso.imagen_portada ? (
                <img src={curso.imagen_portada} alt="" />
              ) : (
                <div className="grid h-full place-items-center">
                  <span className="app-icono h-16 w-16 rounded-[20px] bg-white/10 text-lima shadow-none ring-1 ring-white/15 [&_svg]:h-8 [&_svg]:w-8">
                    <GraduationCap />
                  </span>
                </div>
              )}
            </div>
            {curso.video_presentacion && (
              <button
                type="button"
                onClick={() => setPrevia({ titulo: 'Presentación del curso', video_url: curso.video_presentacion })}
                className="absolute inset-0 grid place-items-center bg-black/25 transition-colors hover:bg-black/35"
                aria-label="Ver video de presentación"
              >
                <span className="ac-ventana-play" style={{ width: 72, height: 72 }}><Play className="ml-1 h-8 w-8" fill="currentColor" /></span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Contenido + tarjeta de inscripción ---------- */}
      <div className="ac-detalle-grid mt-10">
        <aside className="ac-compra order-first lg:order-none lg:col-start-2 lg:row-start-1">{compra}</aside>

        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-1">
          {curso.aprendizajes?.length > 0 && (
            <section aria-labelledby="titulo-aprenderas">
              <h2 id="titulo-aprenderas" className="ac-titulo-md mb-5">Lo que aprenderás</h2>
              <ul className="ac-tarjeta grid gap-3 p-6 sm:grid-cols-2">
                {curso.aprendizajes.map((a, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-tinta-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-negro text-lima">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {curso.temario?.length > 0 && (
            <section aria-labelledby="titulo-temario">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <h2 id="titulo-temario" className="ac-titulo-md">Temario</h2>
                <p className="m-0 text-sm text-tinta-3">
                  {curso.temario.length} {curso.temario.length === 1 ? 'módulo' : 'módulos'} · {curso.total_lecciones || 0} lecciones
                  {minutos > 0 && ` · ${duracion(minutos)}`}
                </p>
              </div>
              <Temario temario={curso.temario} conAcceso={conAcceso} onVistaPrevia={(l) => setPrevia(l)} />
            </section>
          )}

          {curso.requisitos?.length > 0 && (
            <section aria-labelledby="titulo-requisitos">
              <h2 id="titulo-requisitos" className="ac-titulo-md mb-4">Requisitos</h2>
              <ul className="space-y-2 pl-5 text-[15px] text-tinta-2 [list-style:disc]">
                {curso.requisitos.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>
          )}

          {curso.descripcion && (
            <section aria-labelledby="titulo-descripcion">
              <h2 id="titulo-descripcion" className="ac-titulo-md mb-4">Descripción</h2>
              <div className="ac-contenido">{curso.descripcion}</div>
            </section>
          )}

          {curso.instructor && (
            <section aria-labelledby="titulo-instructor">
              <h2 id="titulo-instructor" className="ac-titulo-md mb-4">Tu instructor</h2>
              <div className="ac-tarjeta flex items-center gap-4 p-5">
                <Avatar nombre={curso.instructor.nombre} foto={curso.instructor.foto} tamano={64} />
                <div className="min-w-0">
                  <p className="m-0 text-lg font-semibold text-tinta">{curso.instructor.nombre}</p>
                  {curso.instructor.puesto && <p className="m-0 text-sm text-tinta-3">{curso.instructor.puesto}</p>}
                  <p className="m-0 mt-1 text-sm text-tinta-3">Equipo AvantCode</p>
                </div>
              </div>
            </section>
          )}

          {/* Reseñas */}
          <section aria-labelledby="titulo-resenas">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h2 id="titulo-resenas" className="ac-titulo-md">Reseñas</h2>
              {calificacion.total > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-semibold tracking-tight text-tinta">{Number(calificacion.promedio).toFixed(1)}</span>
                  <span>
                    <Estrellas valor={calificacion.promedio} tamano={16} />
                    <span className="block text-xs text-tinta-3">{calificacion.total} {calificacion.total === 1 ? 'reseña' : 'reseñas'}</span>
                  </span>
                </div>
              )}
            </div>

            {conAcceso && (
              <div className="mb-6">
                <FormularioResena
                  key={mi_resena?.id_resena || 'nueva'}
                  slug={slug}
                  miResena={mi_resena}
                  onGuardada={() => cargar()}
                />
              </div>
            )}

            {resenas.length === 0 ? (
              <div className="ac-tarjeta vacio py-10">
                <span className="app-icono app-icono-claro"><MessageSquare /></span>
                <p className="m-0 text-sm">Aún no hay reseñas. {conAcceso ? 'Sé la primera persona en opinar.' : 'Las verás aquí cuando los alumnos opinen.'}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {resenas.map((r) => (
                  <li key={r.id_resena} className="ac-tarjeta p-5">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={r.alumno?.nombre} foto={r.alumno?.foto_url} tamano={38} />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-semibold text-tinta">{r.alumno?.nombre || 'Alumno'}</p>
                        <p className="m-0 text-xs text-tinta-3">{fechaCorta(r.fecha)}</p>
                      </div>
                      <Estrellas valor={r.calificacion} tamano={14} />
                    </div>
                    {r.comentario && <p className="mb-0 mt-3 text-[15px] leading-relaxed text-tinta-2">{r.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Vista previa de una lección o video de presentación */}
      <Modal
        abierto={!!previa}
        onCerrar={() => setPrevia(null)}
        titulo={previa?.titulo}
        descripcion={previa?.tipo ? `Vista previa · ${TIPOS_LECCION[previa.tipo] || 'Lección'}` : undefined}
        ancho="sm:max-w-3xl"
      >
        {previa && (
          <Reproductor
            url={previa.video_url}
            contenido={previa.contenido}
            titulo={previa.titulo}
            autoPlay
            protegido={
              previa.video_protegido
                ? {
                    clave: `${slug}:${previa.id}`,
                    obtenerEnlace: () => videoPrevia(slug, previa.id),
                    marca: marcaAlumno(alumno),
                  }
                : null
            }
          />
        )}
      </Modal>

      {/* Confirmar inscripción de pago */}
      <Modal abierto={modalPago} onCerrar={() => setModalPago(false)} titulo="Confirma tu inscripción" descripcion={curso.titulo}>
        <div className="space-y-5">
          <div className="superficie space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tinta-3">{saldoAplicado > 0 ? 'Precio' : 'Total'}</span>
              <span className={saldoAplicado > 0 ? 'text-sm font-medium text-tinta-2' : 'text-2xl font-semibold tracking-tight text-tinta'}>
                {moneda(precioEfectivo(curso))}
              </span>
            </div>
            {saldoAplicado > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-tinta-2"><Gift className="h-4 w-4 text-[#0F8F82]" /> Tu saldo por invitaciones</span>
                  <span className="font-medium text-[#0F8F82]">−{moneda(saldoAplicado)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-black/[.07] pt-2">
                  <span className="text-sm text-tinta-3">Por pagar</span>
                  <span className="text-2xl font-semibold tracking-tight text-tinta">{moneda(porPagar)}</span>
                </div>
              </>
            )}
          </div>
          {porPagar > 0 && (
          <fieldset>
            <legend className="label">¿Cómo vas a pagar?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { valor: 'transferencia', texto: 'Transferencia', sub: 'SPEI desde tu banco', Icono: Landmark },
                { valor: 'deposito', texto: 'Depósito', sub: 'En ventanilla o practicaja', Icono: Wallet },
              ].map(({ valor, texto, sub, Icono }) => (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 ring-1 transition-colors ${
                    metodo === valor ? 'bg-negro text-white ring-negro' : 'bg-white/70 text-tinta ring-black/10 hover:bg-white'
                  }`}
                >
                  <input type="radio" name="metodo" value={valor} checked={metodo === valor} onChange={() => setMetodo(valor)} className="sr-only" />
                  <Icono className={`h-5 w-5 ${metodo === valor ? 'text-lima' : 'text-tinta-2'}`} />
                  <span>
                    <span className="block text-sm font-semibold">{texto}</span>
                    <span className={`block text-xs ${metodo === valor ? 'text-white/60' : 'text-tinta-3'}`}>{sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          )}
          <p className="m-0 text-sm text-tinta-3">
            {porPagar > 0
              ? 'Apartamos tu lugar y te damos los datos de pago. Activamos el curso en cuanto confirmemos tu pago.'
              : 'Tu saldo cubre todo el curso. Se abre en cuanto confirmes tu inscripción.'}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => setModalPago(false)}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={inscribir} disabled={inscribiendo}>
              {inscribiendo ? 'Procesando…' : porPagar > 0 ? 'Confirmar inscripción' : 'Usar mi saldo e inscribirme'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Datos de pago */}
      <Modal
        abierto={modalInstrucciones}
        onCerrar={() => setModalInstrucciones(false)}
        titulo="Completa tu pago"
        descripcion={`Inscripción ${inscripcion?.folio || ''}`}
      >
        <InstruccionesPago inscripcion={inscripcion} />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={() => setModalInstrucciones(false)}>Cerrar</button>
          <Link to="/mis-cursos" className="btn-primary">Ir a mis cursos</Link>
        </div>
      </Modal>
    </div>
  );
};

export default CursoDetalle;
