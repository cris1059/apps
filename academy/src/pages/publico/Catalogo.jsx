import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, GraduationCap, AlertTriangle } from 'lucide-react';
import { listarCursos } from '../../services/publico';
import { mensajeError } from '../../services/api';
import TarjetaCurso, { TarjetaCursoEsqueleto } from '../../components/Curso/TarjetaCurso';
import { NIVELES, MODALIDADES } from '../../utils/formato';

const ORDENES = [
  { valor: 'destacados', texto: 'Destacados' },
  { valor: 'populares', texto: 'Más populares' },
  { valor: 'recientes', texto: 'Más recientes' },
  { valor: 'precio_asc', texto: 'Precio: menor a mayor' },
  { valor: 'precio_desc', texto: 'Precio: mayor a menor' },
];

const FILTROS = ['q', 'categoria', 'nivel', 'modalidad', 'precio', 'orden'];

const Catalogo = () => {
  const [params, setParams] = useSearchParams();
  const filtros = useMemo(() => Object.fromEntries(FILTROS.map((f) => [f, params.get(f) || ''])), [params]);
  const [busqueda, setBusqueda] = useState(filtros.q);
  const [cursos, setCursos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cambia un filtro en la URL (así se puede compartir el enlace).
  const cambiar = (clave, valor) => {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    setParams(nuevos, { replace: true });
  };

  // Búsqueda con pausa al escribir.
  useEffect(() => {
    if (busqueda === filtros.q) return;
    const t = setTimeout(() => cambiar('q', busqueda.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => {
    setBusqueda(filtros.q);
  }, [filtros.q]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    listarCursos(filtros)
      .then(({ cursos: c, categorias: cat }) => {
        if (!vigente) return;
        setCursos(c);
        if (cat.length) setCategorias(cat);
      })
      .catch((e) => vigente && setError(mensajeError(e, 'No pudimos cargar los cursos.')))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [filtros]);

  const hayFiltros = FILTROS.some((f) => f !== 'orden' && filtros[f]);
  const limpiar = () => {
    setBusqueda('');
    setParams(filtros.orden ? { orden: filtros.orden } : {}, { replace: true });
  };

  return (
    <div className="ac-contenedor ac-contenedor--amplio pb-[clamp(64px,9vw,120px)] pt-[clamp(32px,5vw,64px)]">
      <header className="mb-8">
        <span className="ac-etiqueta mb-5">
          <span className="ac-nuevo">Academy</span> Catálogo de cursos
        </span>
        <h1 className="ac-titulo mt-5">
          Cursos. <span className="ac-apagado">Aprende algo nuevo hoy.</span>
        </h1>
        <p className="ac-sub mt-4">Filtra por tema, nivel o modalidad. Hay cursos gratis y de pago.</p>
      </header>

      {/* Búsqueda y filtros */}
      <div className="relative z-20 -mx-2 mb-8 rounded-[28px] p-2 glass lg:sticky lg:top-[calc(var(--ac-nav)+8px)]">
        <div className="ac-filtros">
          <div className="ac-campo-busqueda">
            <Search className="h-[18px] w-[18px]" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cursos, temas o instructores"
              aria-label="Buscar cursos"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="hidden h-[18px] w-[18px] text-tinta-3 sm:block" aria-hidden="true" />
            <select className="ac-selector" value={filtros.categoria} onChange={(e) => cambiar('categoria', e.target.value)} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="ac-selector" value={filtros.nivel} onChange={(e) => cambiar('nivel', e.target.value)} aria-label="Nivel">
              <option value="">Cualquier nivel</option>
              {Object.entries(NIVELES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <select className="ac-selector" value={filtros.modalidad} onChange={(e) => cambiar('modalidad', e.target.value)} aria-label="Modalidad">
              <option value="">Cualquier modalidad</option>
              {Object.entries(MODALIDADES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <select className="ac-selector" value={filtros.precio} onChange={(e) => cambiar('precio', e.target.value)} aria-label="Precio">
              <option value="">Gratis y de pago</option>
              <option value="gratis">Solo gratis</option>
              <option value="pago">Solo de pago</option>
            </select>
            <select className="ac-selector" value={filtros.orden || 'destacados'} onChange={(e) => cambiar('orden', e.target.value === 'destacados' ? '' : e.target.value)} aria-label="Ordenar">
              {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-tinta-3" aria-live="polite">
          {cargando ? 'Buscando cursos…' : `${cursos.length} ${cursos.length === 1 ? 'curso' : 'cursos'}`}
        </p>
        {hayFiltros && (
          <button type="button" className="ac-btn ac-btn--gris ac-btn--chico" onClick={limpiar}>
            <X size={16} /> Limpiar filtros
          </button>
        )}
      </div>

      {error ? (
        <div className="ac-tarjeta vacio">
          <span className="app-icono app-icono-rojo"><AlertTriangle /></span>
          <p className="text-sm">{error}</p>
        </div>
      ) : cargando && cursos.length === 0 ? (
        <div className="ac-grid-cursos">
          {[0, 1, 2, 3, 4, 5].map((i) => <TarjetaCursoEsqueleto key={i} />)}
        </div>
      ) : cursos.length === 0 ? (
        <div className="ac-tarjeta vacio py-16">
          <span className="app-icono app-icono-claro"><GraduationCap /></span>
          <p className="m-0 font-semibold text-tinta">No encontramos cursos con esos filtros</p>
          <p className="m-0 text-sm">Prueba con otra búsqueda o quita algún filtro.</p>
          {hayFiltros && (
            <button type="button" className="ac-btn ac-btn--negro ac-btn--chico mt-2" onClick={limpiar}>Ver todos los cursos</button>
          )}
        </div>
      ) : (
        <div className={`ac-grid-cursos transition-opacity ${cargando ? 'opacity-60' : ''}`}>
          {cursos.map((c) => <TarjetaCurso key={c.slug} curso={c} />)}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
