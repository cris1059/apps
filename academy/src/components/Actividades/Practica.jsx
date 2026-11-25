import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart, Flame, Trophy, Star, Play, RotateCcw, CheckCircle2, XCircle, Lightbulb, Eye, ChevronRight, Loader2, Gamepad2,
  Dumbbell, HeartCrack, SkipForward,
} from 'lucide-react';
import Pregunta from './Pregunta';
import Arrastrar from './retos/Arrastrar';
import Ordenar from './retos/Ordenar';
import Relacionar from './retos/Relacionar';
import Clasificar from './retos/Clasificar';
import Memorama from './retos/Memorama';
import Codigo from './retos/Codigo';
import {
  NOMBRES_RETO, preguntaPublica, respuestaInicial, listoParaComprobar, comprobarReto, respuestaSolucion, tieneSolucion, puntosPorReto,
} from './modelo';

/* Práctica interactiva: retos uno por uno con retroalimentación al momento.
   Modo juego: vidas, puntos y racha (sin vidas, se reinicia).
   Al terminar avisa con onCompletar() para marcar la lección. */

const leer = (clave) => {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};
const escribir = (clave, valor) => {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento */
  }
};

/* Vista del reto según su tipo. */
const VistaReto = ({ reto, respuesta, onRespuesta, revision, bloqueado, correcto, conSolucion, claveBorrador }) => {
  const comunes = { reto, respuesta, onRespuesta, revision, bloqueado, correcto };
  switch (reto.tipo) {
    case 'opcion_multiple': {
      const publica = preguntaPublica(reto);
      return (
        <Pregunta
          pregunta={publica}
          respuesta={respuesta.elegidas}
          orden={respuesta.orden}
          onRespuesta={(elegidas) => onRespuesta({ ...respuesta, elegidas })}
          revision={{
            malas: revision?.malas,
            buenas: correcto ? respuesta.elegidas : conSolucion ? reto.correctas : undefined,
          }}
          bloqueado={bloqueado}
        />
      );
    }
    case 'completar':
      return (
        <Pregunta
          pregunta={respuesta.publica}
          respuesta={respuesta.huecos}
          onRespuesta={(huecos) => onRespuesta({ ...respuesta, huecos })}
          revision={{ huecos: correcto || conSolucion ? respuesta.huecos.map(() => true) : revision?.huecos }}
          bloqueado={bloqueado}
        />
      );
    case 'arrastrar':
      return <Arrastrar {...comunes} correcto={correcto || conSolucion} />;
    case 'ordenar':
      return <Ordenar {...comunes} correcto={correcto || conSolucion} />;
    case 'relacionar':
      return <Relacionar {...comunes} correcto={correcto || conSolucion} />;
    case 'clasificar':
      return <Clasificar {...comunes} correcto={correcto || conSolucion} />;
    case 'memorama':
      return <Memorama {...comunes} />;
    case 'codigo':
      return <Codigo {...comunes} claveBorrador={claveBorrador} />;
    default:
      return <p className="text-sm text-tinta-3">Este tipo de reto no está disponible.</p>;
  }
};

const Corazones = ({ vidas, maximo }) => (
  <span className="flex items-center gap-0.5" aria-label={`${vidas} de ${maximo} vidas`}>
    {Array.from({ length: maximo }, (_, i) => (
      <Heart
        key={i}
        className={`h-[18px] w-[18px] transition-all duration-300 ${i < vidas ? 'fill-[#E5484D] text-[#E5484D]' : 'scale-75 text-black/15'}`}
      />
    ))}
  </span>
);

const Estrellas = ({ n }) => (
  <span className="flex items-center justify-center gap-1" aria-label={`${n} de 3 estrellas`}>
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        className={`h-10 w-10 ${i <= n ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-black/10'}`}
        style={i <= n ? { animation: `pop .5s ${0.15 * i}s cubic-bezier(.34,1.56,.64,1) backwards` } : undefined}
      />
    ))}
  </span>
);

const Practica = ({ actividad, clave, completada = false, onCompletar, vistaPrevia = false }) => {
  const retos = actividad.retos || [];
  const juego = !!actividad.modo_juego;
  const vidasMax = Math.min(10, Math.max(1, Number(actividad.vidas) || 3));
  const claveProgreso = `ac:practica:${clave}`;
  const guardado = useMemo(() => (vistaPrevia ? null : leer(claveProgreso)), [claveProgreso, vistaPrevia]);

  const [fase, setFase] = useState('inicio'); // inicio | jugando | sin_vidas | fin
  const [indice, setIndice] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [estado, setEstado] = useState('respondiendo'); // respondiendo | comprobando | correcto | incorrecto | solucion
  const [revision, setRevision] = useState(null);
  const [fallos, setFallos] = useState(0);
  const [vidas, setVidas] = useState(vidasMax);
  const [puntos, setPuntos] = useState(0);
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [resultados, setResultados] = useState([]); // { fallos, ayuda, puntos } por reto
  const [ganados, setGanados] = useState(null);
  const [ejecucion, setEjecucion] = useState(null);
  const [vuelta, setVuelta] = useState(0); // para remontar los retos al reiniciar
  const contenedor = useRef(null);

  const reto = retos[indice];

  const empezarReto = (i) => {
    setIndice(i);
    setRespuesta(respuestaInicial(retos[i]));
    setEstado('respondiendo');
    setRevision(null);
    setFallos(0);
    setGanados(null);
  };

  const comenzar = (desde = null) => {
    setVuelta((v) => v + 1);
    if (desde) {
      setVidas(desde.vidas);
      setPuntos(desde.puntos);
      setRacha(desde.racha);
      setMejorRacha(desde.mejorRacha || 0);
      setResultados(desde.resultados || []);
      empezarReto(Math.min(desde.indice, retos.length - 1));
    } else {
      setVidas(vidasMax);
      setPuntos(0);
      setRacha(0);
      setMejorRacha(0);
      setResultados([]);
      empezarReto(0);
    }
    setFase('jugando');
  };

  // Progreso guardado en este navegador para continuar después.
  useEffect(() => {
    if (vistaPrevia) return;
    if (fase === 'sin_vidas') escribir(claveProgreso, null);
    if (fase !== 'jugando' || (juego && vidas <= 0)) return;
    escribir(claveProgreso, { indice, vidas, puntos, racha, mejorRacha, resultados });
  }, [vistaPrevia, fase, indice, vidas, puntos, racha, mejorRacha, resultados, claveProgreso, juego]);

  // Al cambiar de reto, que se vea desde arriba.
  useEffect(() => {
    if (fase !== 'jugando' || !contenedor.current) return;
    const arriba = contenedor.current.getBoundingClientRect().top;
    if (arriba < 0) contenedor.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [indice, fase]);

  const anotar = (dato) =>
    setResultados((r) => {
      const copia = [...r];
      copia[indice] = dato;
      return copia;
    });

  const acertar = (extra = 0) => {
    const base = puntosPorReto(fallos, false) + extra;
    const bono = juego ? racha * 10 : 0;
    const total = base + bono;
    setPuntos((p) => p + total);
    setRacha((r) => {
      const n = r + 1;
      setMejorRacha((m) => Math.max(m, n));
      return n;
    });
    setGanados(total);
    setEstado('correcto');
    anotar({ fallos, ayuda: false, puntos: total });
  };

  const fallar = () => {
    setFallos((f) => f + 1);
    setRacha(0);
    setEstado('incorrecto');
    if (juego) {
      const restantes = vidas - 1;
      setVidas(restantes);
      if (restantes <= 0) setTimeout(() => setFase('sin_vidas'), 1100);
    }
  };

  const comprobar = async () => {
    if (!reto || estado === 'comprobando') return;
    setEstado('comprobando');
    try {
      const { ok, detalle } = await comprobarReto(reto, respuesta, { onEstado: setEjecucion });
      setRevision(detalle);
      if (ok) acertar();
      else fallar();
    } catch (error) {
      setRevision({ resultado: { ok: false, error: error.message, salida: [], pruebas: [] } });
      fallar();
    } finally {
      setEjecucion(null);
    }
  };

  // El memorama se resuelve solo; da puntos según los intentos.
  useEffect(() => {
    if (reto?.tipo !== 'memorama' || !respuesta?.resuelto || estado !== 'respondiendo') return;
    const pares = respuesta.cartas.length / 2;
    const sobrantes = Math.max(0, respuesta.movimientos - pares);
    setRevision({});
    acertar(Math.max(0, 50 - sobrantes * 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respuesta]);

  const cambiarRespuesta = (r) => {
    setRespuesta(r);
    // Al corregir se quitan las marcas rojas.
    if (estado === 'incorrecto') {
      setEstado('respondiendo');
      setRevision(null);
    }
  };

  const verSolucion = () => {
    if (tieneSolucion(reto)) setRespuesta((r) => respuestaSolucion(reto, r));
    setRevision(null);
    setRacha(0);
    setEstado('solucion');
    anotar({ fallos, ayuda: true, puntos: 0 });
  };

  const terminar = () => {
    setFase('fin');
    escribir(claveProgreso, null);
    if (!vistaPrevia) onCompletar?.();
  };

  const continuar = () => {
    if (indice + 1 < retos.length) empezarReto(indice + 1);
    else terminar();
  };

  /* ---------- Pantallas ---------- */

  if (!retos.length) return null;

  if (fase === 'inicio') {
    const tipos = [...new Set(retos.map((r) => NOMBRES_RETO[r.tipo]).filter(Boolean))];
    const puedeSeguir = guardado && guardado.indice > 0 && guardado.indice < retos.length && (!juego || guardado.vidas > 0);
    return (
      <section className="card relative overflow-hidden md:p-8" aria-label="Práctica">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lima/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="app-icono app-icono-tinta h-16 w-16 shrink-0 rounded-3xl [&_svg]:h-8 [&_svg]:w-8">{juego ? <Gamepad2 /> : <Dumbbell />}</span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">
              {juego ? 'Práctica · modo juego' : 'Práctica'}
              {completada && (
                <span className="badge badge-success normal-case tracking-normal">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completada
                </span>
              )}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-tinta">
              {retos.length} {retos.length === 1 ? 'reto' : 'retos'} para practicar
            </h2>
            <p className="mt-1 text-sm text-tinta-3">{tipos.join(' · ')}</p>
            {juego && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-tinta-2">
                <Corazones vidas={vidasMax} maximo={vidasMax} />
                Cada error cuesta una vida. Gana puntos extra con rachas.
              </p>
            )}
          </div>
        </div>
        <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
          {puedeSeguir ? (
            <>
              <button type="button" className="btn-primary btn-lg" onClick={() => comenzar(guardado)}>
                <Play className="h-5 w-5" /> Continuar en el reto {guardado.indice + 1}
              </button>
              <button type="button" className="btn-secondary btn-lg" onClick={() => comenzar()}>
                <RotateCcw className="h-4 w-4" /> Empezar de nuevo
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary btn-lg" onClick={() => comenzar()}>
              <Play className="h-5 w-5" /> {completada ? 'Practicar de nuevo' : 'Comenzar'}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (fase === 'sin_vidas') {
    return (
      <section className="card text-center md:p-10" aria-label="Sin vidas" style={{ animation: 'escalar .35s cubic-bezier(.22,.61,.36,1) backwards' }}>
        <span className="app-icono app-icono-rojo mx-auto h-16 w-16 rounded-3xl [&_svg]:h-8 [&_svg]:w-8"><HeartCrack /></span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-tinta">Te quedaste sin vidas</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-3">
          Llegaste al reto {indice + 1} de {retos.length} con {puntos} puntos. ¡Ya conoces los retos, ahora va en serio!
        </p>
        <button type="button" className="btn-primary btn-lg mt-6" onClick={() => comenzar()}>
          <RotateCcw className="h-4 w-4" /> Intentar de nuevo
        </button>
      </section>
    );
  }

  if (fase === 'fin') {
    const primeros = resultados.filter((r) => r && !r.ayuda && r.fallos === 0).length;
    const errores = resultados.reduce((t, r) => t + (r?.fallos || 0), 0);
    const ayudas = resultados.filter((r) => r?.ayuda).length;
    const estrellas = errores === 0 && !ayudas ? 3 : errores + ayudas <= Math.ceil(retos.length / 2) ? 2 : 1;
    return (
      <section className="card relative overflow-hidden text-center md:p-10" aria-label="Práctica terminada" style={{ animation: 'escalar .35s cubic-bezier(.22,.61,.36,1) backwards' }}>
        <div className="confeti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
        </div>
        <span className="app-icono app-icono-tinta relative mx-auto h-16 w-16 rounded-3xl [&_svg]:h-8 [&_svg]:w-8" style={{ animation: 'pop .5s cubic-bezier(.34,1.56,.64,1) backwards' }}>
          <Trophy />
        </span>
        <h2 className="relative mt-4 font-display text-[1.9rem] font-semibold tracking-tight text-tinta">¡Práctica completada!</h2>
        {juego && <div className="relative mt-3"><Estrellas n={estrellas} /></div>}
        <div className="relative mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
          {[
            [juego ? puntos : `${primeros}/${retos.length}`, juego ? 'puntos' : 'al primer intento'],
            [juego ? `${primeros}/${retos.length}` : errores, juego ? 'al primer intento' : errores === 1 ? 'error' : 'errores'],
            [mejorRacha, 'mejor racha'],
          ].map(([valor, texto]) => (
            <div key={texto} className="superficie px-2 py-3">
              <p className="numero font-display text-2xl font-semibold text-tinta">{valor}</p>
              <p className="text-xs text-tinta-3">{texto}</p>
            </div>
          ))}
        </div>
        <p className="relative mt-4 text-sm text-tinta-3">
          {vistaPrevia ? 'Vista previa: aquí se marcaría la lección como completada.' : 'La lección quedó marcada como completada.'}
        </p>
        <button type="button" className="btn-secondary relative mt-5" onClick={() => comenzar()}>
          <RotateCcw className="h-4 w-4" /> Repetir práctica
        </button>
      </section>
    );
  }

  /* Jugando */
  const sinVidas = juego && vidas <= 0;
  const bloqueado = sinVidas || ['comprobando', 'correcto', 'solucion'].includes(estado);
  const listo = listoParaComprobar(reto, respuesta);
  const puedeAyuda = fallos >= 2 || (reto.tipo === 'codigo' && /cargar Python/i.test(revision?.resultado?.error || ''));
  const esCodigo = reto.tipo === 'codigo';
  const textoAyuda = tieneSolucion(reto) ? 'Ver solución' : 'Saltar reto';
  const IconoAyuda = tieneSolucion(reto) ? Eye : SkipForward;

  return (
    <section ref={contenedor} className="card scroll-mt-24 overflow-hidden p-0 md:p-0" aria-label={`Reto ${indice + 1} de ${retos.length}`}>
      {/* Progreso y marcador */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/[.05] px-4 py-3 sm:px-6">
        <div className="flex min-w-[140px] flex-1 items-center gap-1" aria-hidden="true">
          {retos.map((r, i) => {
            const res = resultados[i];
            const color = res ? (res.ayuda ? 'bg-[#FBBF24]' : res.fallos ? 'bg-[#14A394]/60' : 'bg-[#14A394]') : i === indice ? 'bg-negro' : 'bg-black/10';
            return <span key={r.id} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${color}`} />;
          })}
        </div>
        <span className="numero text-xs font-semibold text-tinta-3">
          {indice + 1}/{retos.length}
        </span>
        {juego && (
          <div className="flex items-center gap-3">
            <Corazones vidas={vidas} maximo={vidasMax} />
            <span className={`numero inline-flex items-center gap-1 text-sm font-semibold ${racha >= 2 ? 'text-[#F97316]' : 'text-tinta-3'}`} title="Racha">
              <Flame className={`h-4 w-4 ${racha >= 2 ? 'fill-[#F97316]' : ''}`} /> {racha}
            </span>
            <span className="numero relative inline-flex items-center gap-1 rounded-full bg-negro px-2.5 py-1 text-sm font-semibold text-lima">
              <Trophy className="h-3.5 w-3.5" /> {puntos}
              {ganados && estado === 'correcto' && (
                <span key={`${indice}-${ganados}`} className="pointer-events-none absolute -top-5 right-0 text-sm font-bold text-[#0F8F82]" style={{ animation: 'flotar 1.2s ease-out forwards' }}>
                  +{ganados}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Reto */}
      <div
        key={`${vuelta}-${indice}`}
        className={`px-4 py-5 sm:px-6 sm:py-6 ${estado === 'incorrecto' ? 'animate-[sacudir_.4s]' : ''}`}
        style={{ animation: estado === 'incorrecto' ? undefined : 'entrar .35s cubic-bezier(.22,.61,.36,1) backwards' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">{NOMBRES_RETO[reto.tipo] || 'Reto'}</p>
        {reto.enunciado?.trim() && <h3 className="mt-1 whitespace-pre-wrap font-display text-[1.25rem] font-semibold leading-snug tracking-tight text-tinta">{reto.enunciado}</h3>}
        <div className="mt-4">
          <VistaReto
            reto={reto}
            respuesta={respuesta}
            onRespuesta={cambiarRespuesta}
            revision={revision}
            bloqueado={bloqueado}
            correcto={estado === 'correcto'}
            conSolucion={estado === 'solucion'}
            claveBorrador={vistaPrevia ? null : `ac:codigo:${clave}:${reto.id}`}
          />
        </div>
      </div>

      {/* Retroalimentación y acciones */}
      <div
        className={`flex flex-col gap-3 px-4 py-4 transition-colors duration-300 sm:flex-row sm:items-center sm:px-6 ${
          estado === 'correcto' ? 'bg-[#E6F5F2]' : estado === 'incorrecto' ? 'bg-[#FDECEA]' : estado === 'solucion' ? 'bg-[#FFF7E0]' : 'bg-black/[.025]'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="min-w-0 flex-1">
          {estado === 'correcto' && (
            <>
              <p className="flex items-center gap-2 font-semibold text-[#0B655D]" style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1) backwards' }}>
                <CheckCircle2 className="h-5 w-5" /> {['¡Correcto!', '¡Excelente!', '¡Muy bien!', '¡Así se hace!'][indice % 4]}
                {juego && racha >= 2 && <span className="text-sm font-medium text-[#F97316]">· racha de {racha} 🔥</span>}
              </p>
              {reto.explicacion && <p className="mt-1 text-sm text-[#0B655D]/85">{reto.explicacion}</p>}
            </>
          )}
          {estado === 'incorrecto' && (
            <>
              <p className="flex items-center gap-2 font-semibold text-[#8C1D18]">
                <XCircle className="h-5 w-5" />
                {esCodigo ? (revision?.resultado?.error ? 'Tu código tiene un error' : 'Todavía no pasa todas las pruebas') : 'Casi. Revisa lo marcado en rojo.'}
                {juego && <span className="text-sm font-medium">{sinVidas ? '· ¡sin vidas!' : '· −1 vida'}</span>}
              </p>
              {reto.pista && fallos >= 1 && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-[#8C1D18]/85">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" /> {reto.pista}
                </p>
              )}
            </>
          )}
          {estado === 'solucion' && (
            <>
              <p className="flex items-center gap-2 font-semibold text-[#7A5A00]">
                <Eye className="h-5 w-5" /> {tieneSolucion(reto) ? 'Esta es la solución' : 'Reto saltado'}
              </p>
              <p className="mt-1 text-sm text-[#7A5A00]/85">
                {reto.explicacion || (esCodigo && tieneSolucion(reto) ? 'Ejecútala para ver cómo funciona.' : 'Estúdiala y sigue con el siguiente reto.')}
              </p>
            </>
          )}
          {(estado === 'respondiendo' || estado === 'comprobando') && (
            <p className="text-sm text-tinta-3">
              {reto.tipo === 'memorama'
                ? 'Encuentra todas las parejas.'
                : esCodigo
                  ? 'Escribe tu código y presiona «Comprobar» para correr las pruebas.'
                  : listo
                    ? '¿Listo? Comprueba tu respuesta.'
                    : 'Completa tu respuesta para comprobarla.'}
            </p>
          )}
        </div>

        <div className={`flex shrink-0 flex-wrap gap-2 ${sinVidas ? 'hidden' : ''}`}>
          {(estado === 'respondiendo' || estado === 'incorrecto' || estado === 'comprobando') && puedeAyuda && reto.tipo !== 'memorama' && (
            <button type="button" className="btn-ghost" onClick={verSolucion} disabled={estado === 'comprobando'}>
              <IconoAyuda className="h-4 w-4" /> {textoAyuda}
            </button>
          )}
          {(estado === 'respondiendo' || estado === 'comprobando' || estado === 'incorrecto') && reto.tipo !== 'memorama' && (
            <button type="button" className="btn-primary min-w-[150px]" onClick={comprobar} disabled={estado === 'comprobando' || !listo || (juego && vidas <= 0)}>
              {estado === 'comprobando' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {estado === 'comprobando' ? (ejecucion === 'cargando' ? 'Preparando Python…' : esCodigo ? 'Ejecutando…' : 'Comprobando…') : 'Comprobar'}
            </button>
          )}
          {(estado === 'correcto' || estado === 'solucion') && (
            <button type="button" className={`${estado === 'correcto' ? 'btn-success' : 'btn-primary'} min-w-[150px]`} onClick={continuar} autoFocus>
              {indice + 1 < retos.length ? 'Continuar' : 'Terminar'} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Practica;
