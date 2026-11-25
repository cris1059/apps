import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  Check,
  Code2,
  GraduationCap,
  Play,
  PlayCircle,
  Search,
  Sparkles,
  Bot,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listarCursos } from '../../services/publico';
import TarjetaCurso, { TarjetaCursoEsqueleto } from '../../components/Curso/TarjetaCurso';
import { iconoCategoria } from '../../components/Curso/iconos';
import Revelar from '../../components/Sitio/Revelar';
import { duracion } from '../../utils/formato';

const PASOS = [
  { titulo: 'Crea tu cuenta', texto: 'Regístrate gratis con tu correo en menos de un minuto.' },
  { titulo: 'Confirma tu correo', texto: 'Te enviamos un enlace para activar tu cuenta de forma segura.' },
  { titulo: 'Inscríbete', texto: 'Elige un curso gratis o de pago y entra cuando quieras.' },
  { titulo: 'Aprende a tu ritmo', texto: 'Videos y lecturas por lección; tu avance se guarda solo.' },
  { titulo: 'Obtén tu certificado', texto: 'Al terminar recibes un certificado con folio verificable.' },
];

/* Ventana del reproductor: así se ve por dentro el curso de IA (sus módulos y lecciones reales). */
const LECCIONES_VITRINA = [
  { modulo: 'Módulo 1 · Introducción a la IA' },
  { titulo: '1.1 ¿Qué es la inteligencia artificial?', hecha: true },
  { titulo: '1.2 Breve historia de la IA', hecha: true },
  { titulo: '1.3 Tipos de IA y dónde ya la usas', activa: true },
  { titulo: '1.4 Práctica: ¿es IA o no?' },
  { modulo: 'Módulo 2 · Cómo aprenden las máquinas' },
  { titulo: '2.1 IA, Machine Learning y Deep Learning' },
  { titulo: '2.2 Datos, entrenamiento y modelos' },
];

const VentanaReproductor = ({ portada, curso }) => (
  <div className="ac-ventana" aria-hidden="true">
    <div className="ac-ventana-lateral">
      <div className="ac-ventana-puntos"><i /><i /><i /></div>
      {LECCIONES_VITRINA.map((l) =>
        l.modulo ? (
          <p key={l.modulo} className="ac-ventana-modulo">{l.modulo}</p>
        ) : (
          <div key={l.titulo} className={`ac-ventana-leccion${l.activa ? ' ac-ventana-leccion--activa' : ''}`}>
            {l.hecha ? (
              <span className="ac-ventana-check"><Check className="h-3 w-3" strokeWidth={3} /></span>
            ) : (
              <span className="ac-ventana-check ac-ventana-check--vacio" />
            )}
            <span className="truncate">{l.titulo}</span>
          </div>
        )
      )}
    </div>
    <div className="ac-ventana-principal">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-tinta-3">{curso || 'Inteligencia artificial desde cero'} · Lección 3 de 44</p>
          <p className="display truncate text-lg font-semibold text-tinta">Tipos de IA y dónde ya la usas</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-negro px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex">Siguiente lección</span>
      </div>
      <div className="ac-ventana-video">
        {portada && <img src={portada} alt="" className="ac-ventana-poster" loading="lazy" />}
        <span className="ac-ventana-play"><Play className="ml-1 h-7 w-7" fill="currentColor" /></span>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium text-tinta-3">
          <span>Tu avance</span>
          <span>5 %</span>
        </div>
        <div className="ac-ventana-barra"><i style={{ width: '5%' }} /></div>
      </div>
    </div>
  </div>
);

/* Verificación rápida de un certificado por folio. */
const VerificarFolio = () => {
  const [folio, setFolio] = useState('');
  const navigate = useNavigate();
  return (
    <form
      className="mx-auto mt-8 flex max-w-lg flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const f = folio.trim().toUpperCase();
        if (f) navigate(`/certificados/${encodeURIComponent(f)}`);
      }}
    >
      <label htmlFor="folio-certificado" className="sr-only">Folio del certificado</label>
      <div className="ac-campo-busqueda">
        <BadgeCheck className="h-[18px] w-[18px]" />
        <input
          id="folio-certificado"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          placeholder="Ej. HRYL3Z5952FSRG"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <button type="submit" className="ac-btn ac-btn--negro ac-btn--grande" disabled={!folio.trim()}>
        Verificar
      </button>
    </form>
  );
};

const Inicio = () => {
  const { estaAutenticado } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listarCursos({ orden: 'destacados' })
      .then(({ cursos: c, categorias: cat }) => {
        setCursos(c);
        setCategorias(cat);
      })
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  // Cifras calculadas del catálogo real (no números inventados).
  const cifras = useMemo(() => {
    // Los «Próximamente» no cuentan como publicados: se muestran aparte.
    const lista = cursos.filter((c) => !c.proximamente);
    const lecciones = lista.reduce((t, c) => t + (Number(c.total_lecciones) || 0), 0);
    const minutos = lista.reduce((t, c) => t + (Number(c.duracion_total_min) || (Number(c.duracion_horas) || 0) * 60), 0);
    const gratis = lista.filter((c) => Number(c.precio_oferta ?? c.precio ?? 0) <= 0).length;
    return { cursos: lista.length, lecciones, minutos, gratis };
  }, [cursos]);

  const destacados = cursos.slice(0, 6);
  const abiertos = cursos.filter((c) => !c.proximamente);
  const proximos = cursos.length - abiertos.length;
  const vitrina = abiertos.find((c) => c.imagen_portada) || cursos.find((c) => c.imagen_portada);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="ac-hero ac-centro">
        <div className="ac-contenedor">
          <Link to="/cursos" className="ac-etiqueta">
            <span className="ac-nuevo">Nuevo</span> Certificados con folio verificable <ArrowRight size={14} />
          </Link>
          <h1 className="ac-titulo-xl ac-hero-titulo">
            Aprende tecnología{' '}
            <span className="ac-chip ac-chip--1" aria-hidden="true"><Code2 /></span>{' '}
            con quienes{' '}
            <span className="ac-chip ac-chip--2" aria-hidden="true"><Bot /></span>{' '}
            la construyen{' '}
            <span className="ac-chip ac-chip--3" aria-hidden="true"><Megaphone /></span>
          </h1>
          <p className="ac-sub ac-hero-sub">
            Cursos prácticos de desarrollo web, inteligencia artificial y marketing digital, creados por el equipo de
            AvantCode. Aprende a tu ritmo y obtén tu certificado.
          </p>
          <div className="ac-acciones">
            <Link to="/cursos" className="ac-btn ac-btn--negro ac-btn--grande">
              Explorar cursos <ArrowRight size={18} />
            </Link>
            {estaAutenticado ? (
              <Link to="/panel" className="ac-btn ac-btn--gris ac-btn--grande">Ir a mi panel</Link>
            ) : (
              <Link to="/registro" className="ac-btn ac-btn--gris ac-btn--grande">Crear cuenta gratis</Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Vitrina ---------- */}
      <section className="ac-contenedor ac-contenedor--amplio" aria-label="Así se ve un curso por dentro">
        <Revelar className="ac-vitrina">
          <VentanaReproductor portada={vitrina?.imagen_portada} curso={vitrina?.titulo?.split(':')[0]} />
          <div className="ac-flotante ac-flotante--cert glass" aria-hidden="true">
            <span className="app-icono app-icono-teal"><Award /></span>
            <span>
              <span className="block text-sm font-semibold text-tinta">Certificado emitido</span>
              <span className="block text-xs text-tinta-3">Folio verificable en línea</span>
            </span>
          </div>
          <div className="ac-flotante ac-flotante--progreso glass" aria-hidden="true">
            <span className="app-icono app-icono-tinta"><Sparkles /></span>
            <span>
              <span className="block text-sm font-semibold text-tinta">Lección completada</span>
              <span className="block text-xs text-tinta-3">Tu avance se guarda solo</span>
            </span>
          </div>
        </Revelar>
      </section>

      {/* ---------- Cursos destacados ---------- */}
      <section className="ac-seccion" aria-labelledby="titulo-destacados">
        <div className="ac-contenedor ac-contenedor--amplio">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 id="titulo-destacados" className="ac-titulo">
              {abiertos.length > 0 || cargando ? 'Cursos para empezar hoy.' : 'Lo que viene en Academy.'}
              <br />
              <span className="ac-apagado">{abiertos.length > 0 || cargando ? 'Elige el tuyo.' : 'Abre el primero muy pronto.'}</span>
            </h2>
            <Link to="/cursos" className="ac-btn ac-btn--gris">
              Ver todos los cursos <ArrowUpRight size={18} />
            </Link>
          </div>

          {cargando ? (
            <div className="ac-grid-cursos">
              {[0, 1, 2].map((i) => <TarjetaCursoEsqueleto key={i} />)}
            </div>
          ) : error ? (
            <div className="ac-tarjeta vacio">
              <span className="app-icono app-icono-claro"><BookOpen /></span>
              <p className="text-sm">No pudimos cargar los cursos en este momento. Intenta de nuevo en unos minutos.</p>
            </div>
          ) : destacados.length === 0 ? (
            <div className="ac-tarjeta vacio">
              <span className="app-icono app-icono-claro"><GraduationCap /></span>
              <p className="text-sm">Muy pronto publicaremos los primeros cursos.</p>
            </div>
          ) : (
            <div className="ac-grid-cursos">
              {destacados.map((c, i) => (
                <Revelar key={c.slug} retraso={i * 60} className="flex">
                  <div className="w-full [&>a]:h-full"><TarjetaCurso curso={c} /></div>
                </Revelar>
              ))}
            </div>
          )}

          {/* Cifras del catálogo */}
          {!cargando && cursos.length > 0 && (
            <dl className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { valor: cifras.cursos, texto: cifras.cursos === 1 ? 'curso disponible' : 'cursos disponibles' },
                { valor: cifras.lecciones, texto: 'lecciones' },
                { valor: duracion(cifras.minutos), texto: 'de contenido' },
                proximos > 0
                  ? { valor: proximos, texto: proximos === 1 ? 'curso próximamente' : 'cursos próximamente' }
                  : { valor: cifras.gratis, texto: cifras.gratis === 1 ? 'curso gratis' : 'cursos gratis' },
              ].map((c) => (
                <div key={c.texto} className="ac-tarjeta px-6 py-5">
                  <dt className="sr-only">{c.texto}</dt>
                  <dd className="m-0 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-tinta">{c.valor}</dd>
                  <p className="m-0 text-sm text-tinta-3">{c.texto}</p>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ---------- Categorías ---------- */}
      {categorias.length > 0 && (
        <section className="pb-[clamp(64px,9vw,120px)]" aria-labelledby="titulo-categorias">
          <div className="ac-contenedor ac-contenedor--amplio">
            <h2 id="titulo-categorias" className="ac-titulo-md mb-6">
              Explora por tema. <span className="ac-apagado">Lo que necesitas aprender.</span>
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categorias.map((cat) => {
                const { Icono, clase } = iconoCategoria(cat);
                const total = cursos.filter((c) => c.categoria === cat).length;
                return (
                  <li key={cat}>
                    <Link
                      to={`/cursos?categoria=${encodeURIComponent(cat)}`}
                      className="group flex items-center gap-4 rounded-[24px] bg-gray-100 p-4 transition-colors hover:bg-[#ECECEC]"
                    >
                      <span className={`app-icono ${clase}`}><Icono /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-tinta">{cat}</span>
                        {total > 0 && <span className="block text-sm text-tinta-3">{total} {total === 1 ? 'curso' : 'cursos'}</span>}
                      </span>
                      <ArrowUpRight className="h-5 w-5 text-tinta-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- Cómo funciona ---------- */}
      <section id="como-funciona" className="ac-seccion ac-seccion--gris" aria-labelledby="titulo-como">
        <div className="ac-contenedor ac-contenedor--amplio">
          <div className="ac-centro">
            <h2 id="titulo-como" className="ac-titulo">
              <span className="ac-apagado">De tu registro</span>
              <br />a tu certificado.
            </h2>
            <p className="ac-sub mt-5">Cinco pasos, sin complicaciones. Tú decides el ritmo.</p>
          </div>
          <ol className="ac-pasos">
            {PASOS.map((p, i) => (
              <Revelar as="li" key={p.titulo} retraso={i * 70}>
                <span className="ac-paso-num">0{i + 1}</span>
                <div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
              </Revelar>
            ))}
          </ol>
          {!estaAutenticado && (
            <div className="ac-acciones mt-10 justify-center">
              <Link to="/registro" className="ac-btn ac-btn--negro ac-btn--grande">Crear mi cuenta</Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Beneficios ---------- */}
      <section className="ac-seccion" aria-labelledby="titulo-beneficios">
        <div className="ac-contenedor ac-contenedor--amplio">
          <h2 id="titulo-beneficios" className="ac-titulo ac-centro">
            Todo lo que necesitas
            <br />
            <span className="ac-apagado">para aprender de verdad.</span>
          </h2>
          <div className="ac-mosaico">
            <Revelar className="ac-celda">
              <h3>Avanza a tu ritmo</h3>
              <p>Tu progreso se guarda lección por lección.</p>
              <div className="ac-celda-visual">
                <div className="ac-celda-panel" aria-hidden="true">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-tinta-3">Tu avance</p>
                  {[100, 100, 60].map((p, i) => (
                    <div key={i} className="mb-3">
                      <div className="mb-1 flex justify-between text-xs text-tinta-2">
                        <span>Módulo {i + 1}</span>
                        <span>{p} %</span>
                      </div>
                      <div className="ac-ventana-barra"><i style={{ width: `${p}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </Revelar>
            <Revelar className="ac-celda" retraso={80}>
              <h3>Lecciones prácticas</h3>
              <p>Videos cortos, lecturas y ejercicios.</p>
              <div className="ac-celda-visual">
                <div className="ac-celda-panel space-y-2" aria-hidden="true">
                  {[
                    { Icono: PlayCircle, t: 'Video · 8 min' },
                    { Icono: BookOpen, t: 'Lectura · 5 min' },
                    { Icono: Code2, t: 'Práctica · 15 min' },
                  ].map(({ Icono, t }) => (
                    <div key={t} className="flex items-center gap-3 rounded-xl bg-gray-100 px-3 py-2.5 text-sm text-tinta-2">
                      <Icono className="h-4 w-4 text-tinta" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </Revelar>
            <Revelar className="ac-celda" retraso={160}>
              <h3>Certificado verificable</h3>
              <p>Cada certificado tiene un folio único.</p>
              <div className="ac-celda-visual">
                <div className="ac-celda-panel" aria-hidden="true">
                  <div className="flex items-center gap-3">
                    <span className="app-icono app-icono-tinta"><Award /></span>
                    <div>
                      <p className="m-0 text-sm font-semibold text-tinta">Certificado de finalización</p>
                      <p className="m-0 text-xs text-tinta-3">Folio verificable de 14 caracteres</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E4F4EF] px-3 py-2 text-xs font-semibold text-[#0B655D]">
                    <BadgeCheck className="h-4 w-4" /> Verificado por AvantCode
                  </div>
                </div>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ---------- Verificar certificado ---------- */}
      <section id="certificados" className="ac-seccion ac-seccion--gris ac-centro" aria-labelledby="titulo-certificados">
        <div className="ac-contenedor">
          <span className="app-icono app-icono-teal mx-auto mb-6 h-14 w-14 rounded-2xl [&_svg]:h-7 [&_svg]:w-7"><BadgeCheck /></span>
          <h2 id="titulo-certificados" className="ac-titulo">
            ¿Te mostraron un certificado?
            <br />
            <span className="ac-apagado">Verifícalo aquí.</span>
          </h2>
          <p className="ac-sub mt-5">Escribe el folio que aparece en el certificado para confirmar que es auténtico.</p>
          <VerificarFolio />
        </div>
      </section>

      {/* ---------- Cierre ---------- */}
      <section className="ac-seccion ac-centro">
        <div className="ac-contenedor">
          <h2 className="ac-titulo-xl" style={{ fontSize: 'clamp(2.3rem, 5.4vw, 4.1rem)' }}>
            Tu próximo paso
            <br />
            <span className="ac-apagado">empieza con una lección.</span>
          </h2>
          <p className="ac-sub mx-auto mb-8 mt-6">Crea tu cuenta gratis y empieza hoy mismo.</p>
          <div className="ac-acciones">
            {estaAutenticado ? (
              <Link to="/panel" className="ac-btn ac-btn--negro ac-btn--grande">Ir a mi panel</Link>
            ) : (
              <Link to="/registro" className="ac-btn ac-btn--negro ac-btn--grande">Crear cuenta gratis</Link>
            )}
            <Link to="/cursos" className="ac-btn ac-btn--gris ac-btn--grande">
              <Search size={18} /> Buscar un curso
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Inicio;
