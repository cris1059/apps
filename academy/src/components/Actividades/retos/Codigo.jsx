import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Loader2, CheckCircle2, XCircle, Circle, Terminal, MonitorPlay } from 'lucide-react';
import EditorCodigo, { Consola, VistaWeb } from '../EditorCodigo';
import { ejecutarJS, ejecutarPython, pythonListo } from '../ejecutor';

/* Reto de código: editor, ejecutar, consola o vista previa, y las pruebas.
   "Comprobar" (abajo) corre las pruebas; aquí solo se muestra el resultado.
   El código del alumno se guarda en este navegador para no perderlo. */

const PESTANAS = [
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['js', 'JS'],
];

const describirComprobacion = (c) => {
  if (c.nombre) return c.nombre;
  switch (c.tipo) {
    case 'existe':
      return `Existe ${c.selector}`;
    case 'cantidad':
      return `Hay al menos ${c.valor} ${c.selector}`;
    case 'texto':
      return `${c.selector} dice «${c.valor}»`;
    case 'estilo':
      return `${c.selector} tiene ${c.propiedad}: ${c.valor}`;
    case 'atributo':
      return `${c.selector} tiene ${c.propiedad}${c.valor ? `="${c.valor}"` : ''}`;
    default:
      return 'Condición de la página';
  }
};

const leerBorrador = (clave) => {
  try {
    const crudo = clave && localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

const guardarBorrador = (clave, archivos) => {
  try {
    if (clave) localStorage.setItem(clave, JSON.stringify(archivos));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
};

const Codigo = ({ reto, respuesta, onRespuesta, revision, bloqueado, claveBorrador }) => {
  const web = reto.lenguaje === 'web';
  const archivos = respuesta.archivos || {};
  const [pestana, setPestana] = useState(() => (web ? PESTANAS.find(([k]) => (reto.inicial || {})[k]?.trim())?.[0] || 'html' : null));
  const [salida, setSalida] = useState(null); // líneas de la última ejecución
  const [corriendo, setCorriendo] = useState(null); // null | 'cargando' | 'ejecutando'
  const [consolaWeb, setConsolaWeb] = useState([]);
  const cargado = useRef(false);

  // Recupera el borrador guardado (una vez).
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    const borrador = leerBorrador(claveBorrador);
    if (borrador && !bloqueado) onRespuesta({ ...respuesta, archivos: { ...archivos, ...borrador } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda el borrador mientras escribe.
  useEffect(() => {
    // Bloqueado = ya resuelto o con la solución puesta: eso no es su borrador.
    if (!cargado.current || bloqueado) return;
    const t = setTimeout(() => guardarBorrador(claveBorrador, archivos), 500);
    return () => clearTimeout(t);
  }, [archivos, claveBorrador, bloqueado]);

  const cambiar = (clave, valor) => onRespuesta({ ...respuesta, archivos: { ...archivos, [clave]: valor } });

  const ejecutar = async () => {
    setCorriendo(reto.lenguaje === 'python' && !pythonListo() ? 'cargando' : 'ejecutando');
    const r =
      reto.lenguaje === 'python'
        ? await ejecutarPython(archivos.codigo, { onEstado: (e) => setCorriendo(e) })
        : await ejecutarJS(archivos.codigo);
    setSalida(r.error ? [...r.salida, { tipo: 'error', texto: r.error }] : r.salida);
    setCorriendo(null);
  };

  const reiniciar = () => {
    if (!window.confirm('¿Regresar al código inicial? Se borra lo que escribiste.')) return;
    onRespuesta({ ...respuesta, archivos: { ...(reto.inicial || {}) } });
    setSalida(null);
  };

  const resultado = revision?.resultado;
  const porId = new Map((resultado?.pruebas || []).map((p) => [p.id, p]));
  const lineas = resultado ? (resultado.error ? [...resultado.salida, { tipo: 'error', texto: resultado.error }] : resultado.salida) : salida;
  const validacion = reto.validacion || 'libre';

  const listaPruebas =
    validacion === 'pruebas' ? (
      <ul className="space-y-1.5" aria-label="Pruebas">
        {(web ? reto.comprobaciones : reto.pruebas || []).map((p) => {
          const r = porId.get(p.id);
          return (
            <li key={p.id} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[13px] ring-1 ${r ? (r.ok ? 'bg-[#E6F5F2] ring-[#14A394]/40' : 'bg-[#FDECEA] ring-[#E5484D]/40') : 'bg-white/70 ring-black/[.06]'}`}>
              {r ? (
                r.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F8F82]" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C62828]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-tinta-3/50" />
              )}
              <span className="min-w-0 flex-1">
                {web ? (
                  <span className="text-tinta">{describirComprobacion(p)}</span>
                ) : (
                  <>
                    {p.nombre && <span className="block text-tinta">{p.nombre}</span>}
                    <code className="font-mono text-[12.5px] text-tinta-2">
                      {p.expresion} → {p.esperado}
                    </code>
                  </>
                )}
                {r && !r.ok && (
                  <span className="mt-0.5 block font-mono text-[12px] text-[#B3261E]">
                    {r.error || r.detalle || (r.obtenido !== undefined ? `Tu código da ${r.obtenido}` : '')}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    ) : null;

  const herramientas = (
    <div className="flex flex-wrap items-center gap-2">
      {!web && (
        <button type="button" className="btn-primary btn-sm" onClick={ejecutar} disabled={!!corriendo}>
          {corriendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {corriendo === 'cargando' ? 'Preparando Python…' : corriendo ? 'Ejecutando…' : 'Ejecutar'}
        </button>
      )}
      {!bloqueado && (
        <button type="button" className="btn-ghost btn-sm" onClick={reiniciar}>
          <RotateCcw className="h-4 w-4" /> Código inicial
        </button>
      )}
      {reto.lenguaje === 'python' && !pythonListo() && !corriendo && (
        <span className="text-xs text-tinta-3">La primera vez, Python tarda unos segundos en cargar.</span>
      )}
    </div>
  );

  if (web) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="segmentado mb-2" role="tablist" aria-label="Archivos">
              {PESTANAS.map(([k, texto]) => (
                <button key={k} type="button" role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}>
                  {texto}
                </button>
              ))}
            </div>
            <EditorCodigo
              key={pestana}
              valor={archivos[pestana] || ''}
              onCambiar={(v) => cambiar(pestana, v)}
              lenguaje={pestana === 'js' ? 'javascript' : pestana}
              soloLectura={bloqueado}
              etiqueta={`Tu código ${pestana.toUpperCase()}`}
              minAlto={260}
              maxAlto={420}
            />
          </div>
          <div className="flex min-w-0 flex-col overflow-hidden rounded-xl ring-1 ring-black/10">
            <p className="flex items-center gap-1.5 border-b border-black/[.06] bg-white px-3 py-2 text-xs font-semibold text-tinta-3">
              <MonitorPlay className="h-3.5 w-3.5" /> Vista previa
            </p>
            <VistaWeb
              archivos={archivos}
              className="min-h-[260px] flex-1"
              onConsola={(l) => setConsolaWeb((prev) => (l === null ? [] : [...prev.slice(-99), l]))}
            />
          </div>
        </div>
        {herramientas}
        {consolaWeb.length > 0 && <Consola lineas={consolaWeb} className="max-h-36" />}
        {listaPruebas}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <EditorCodigo
        valor={archivos.codigo || ''}
        onCambiar={(v) => cambiar('codigo', v)}
        lenguaje={reto.lenguaje}
        soloLectura={bloqueado}
        etiqueta="Tu código"
        minAlto={180}
        maxAlto={440}
      />
      {herramientas}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">
          <Terminal className="h-3.5 w-3.5" /> Consola
        </p>
        <Consola
          lineas={lineas || []}
          vacio={lineas ? 'Tu código no imprimió nada.' : 'Presiona «Ejecutar» para ver lo que imprime tu código.'}
          className="max-h-52 min-h-[64px]"
        />
      </div>
      {validacion === 'salida' && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Debe imprimir</p>
          <pre className="m-0 whitespace-pre-wrap rounded-xl bg-white/70 p-3 font-mono text-[12.5px] text-tinta ring-1 ring-black/[.06]">{reto.salida_esperada}</pre>
        </div>
      )}
      {listaPruebas}
    </div>
  );
};

export default Codigo;
