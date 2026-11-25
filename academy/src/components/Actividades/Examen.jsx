import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Play, RotateCcw, ChevronLeft, ChevronRight, Send, CheckCircle2, XCircle, Award, Target, Repeat, Trophy, Loader2,
  CircleDot, ListChecks,
} from 'lucide-react';
import Modal from '../UI/Modal';
import Pregunta from './Pregunta';
import { mezclar } from './modelo';

/* Examen: el alumno responde y el servidor califica (nunca recibe las respuestas).
   La lección se completa al aprobar.
   - cargarEstado(): { intentos, usados, restantes, aprobado, mejor, ultimo }
   - enviar(respuestas): { resultado, estado, progreso?, certificado? } */

const Anillo = ({ valor, aprobado, tamano = 148 }) => {
  const r = (tamano - 16) / 2;
  const c = 2 * Math.PI * r;
  const [mostrado, setMostrado] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setMostrado(valor), 60);
    return () => clearTimeout(t);
  }, [valor]);
  return (
    <div className="relative mx-auto" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="12" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke={aprobado ? '#14A394' : '#E5484D'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - mostrado / 100)}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="numero font-display text-[2.1rem] font-semibold tracking-tight text-tinta">
          {valor}
          <span className="text-lg text-tinta-3">%</span>
        </span>
      </div>
    </div>
  );
};

const Dato = ({ icono: Icono, valor, texto }) => (
  <div className="superficie flex items-center gap-3 px-3 py-3">
    <Icono className="h-5 w-5 shrink-0 text-tinta-3" />
    <div className="min-w-0">
      <p className="numero truncate text-[15px] font-semibold text-tinta">{valor}</p>
      <p className="truncate text-xs text-tinta-3">{texto}</p>
    </div>
  </div>
);

/* Revisión de un intento: qué acertó y, si el examen lo permite, la respuesta correcta. */
const Revision = ({ examen, resultado }) => {
  if (!resultado.detalle) {
    return <p className="superficie mt-6 p-4 text-center text-sm text-tinta-3">Este examen solo muestra la calificación.</p>;
  }
  const porId = Object.fromEntries(resultado.detalle.map((d) => [d.id, d]));
  return (
    <ol className="mt-6 space-y-3">
      {examen.preguntas.map((p, i) => {
        const d = porId[p.id];
        if (!d) return null;
        const bien = d.valor === 1;
        const parcial = d.valor > 0 && d.valor < 1;
        const respuesta = d.respuesta || [];
        let revision;
        if (p.tipo === 'opcion_multiple') {
          if (d.correcta) revision = { buenas: d.correcta, malas: respuesta.filter((x) => !d.correcta.includes(x)) };
          else revision = bien ? { buenas: respuesta } : { malas: respuesta };
        } else {
          revision = { huecos: d.huecos, correctas: d.correcta };
        }
        return (
          <li key={p.id} className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/[.06]">
            <div className="mb-3 flex items-start gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${bien ? 'bg-[#0F8F82]' : parcial ? 'bg-[#F59E0B]' : 'bg-[#E5484D]'}`}
                aria-label={bien ? 'Correcta' : parcial ? 'Parcialmente correcta' : 'Incorrecta'}
              >
                {bien ? <CheckCircle2 className="h-4 w-4" /> : parcial ? <CircleDot className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
                  Pregunta {i + 1}
                  {parcial ? ` · ${Math.round(d.valor * 100)} %` : ''}
                </p>
                {p.enunciado && <p className="mt-0.5 whitespace-pre-wrap font-medium text-tinta">{p.enunciado}</p>}
              </div>
            </div>
            <Pregunta pregunta={p} respuesta={respuesta} onRespuesta={() => {}} revision={revision} bloqueado />
            {d.explicacion && <p className="mt-3 rounded-xl bg-[#EFEAFE] p-3 text-sm text-[#4C2BAE]">{d.explicacion}</p>}
          </li>
        );
      })}
    </ol>
  );
};

const Examen = ({ examen, cargarEstado, enviar, onEnviado, vistaPrevia = false }) => {
  const [estado, setEstado] = useState(null);
  const [carga, setCarga] = useState({ cargando: true, error: null });
  const [fase, setFase] = useState('inicio'); // inicio | respondiendo | resultado
  const [orden, setOrden] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [actual, setActual] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState(null);
  const porId = useMemo(() => Object.fromEntries(examen.preguntas.map((p) => [p.id, p])), [examen]);

  const recargar = () => {
    setCarga({ cargando: true, error: null });
    cargarEstado()
      .then((e) => {
        setEstado(e);
        setCarga({ cargando: false, error: null });
      })
      .catch((e) => setCarga({ cargando: false, error: e?.response?.data?.error || 'No pudimos cargar el examen.' }));
  };

  useEffect(recargar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const comenzar = () => {
    const ids = examen.preguntas.map((p) => p.id);
    setOrden({
      preguntas: examen.mezclar ? mezclar(ids) : ids,
      opciones: Object.fromEntries(
        examen.preguntas.filter((p) => p.tipo === 'opcion_multiple').map((p) => [p.id, examen.mezclar ? mezclar(p.opciones.map((o) => o.id)) : p.opciones.map((o) => o.id)])
      ),
    });
    setRespuestas({});
    setActual(0);
    setFase('respondiendo');
  };

  const respondida = (p) => (respuestas[p.id] || []).some((v) => String(v).trim() !== '');
  const preguntas = orden ? orden.preguntas.map((id) => porId[id]).filter(Boolean) : [];
  const sinResponder = preguntas.filter((p) => !respondida(p)).length;

  const enviarAhora = async () => {
    setConfirmar(false);
    setEnviando(true);
    try {
      const r = await enviar(respuestas);
      setEstado(r.estado);
      setResultado(r.resultado);
      setFase('resultado');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onEnviado?.(r);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'No se pudo enviar el examen. Revisa tu conexión e inténtalo de nuevo.');
      if (e?.response?.data?.codigo === 'SIN_INTENTOS') {
        setFase('inicio');
        recargar();
      }
    } finally {
      setEnviando(false);
    }
  };

  if (carga.cargando) {
    return (
      <section className="card flex items-center justify-center gap-2 py-10 text-sm text-tinta-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando el examen…
      </section>
    );
  }
  if (carga.error) {
    return (
      <section className="card text-center">
        <p className="text-sm text-tinta-3">{carga.error}</p>
        <button type="button" className="btn-secondary btn-sm mt-3" onClick={recargar}>
          <RotateCcw className="h-4 w-4" /> Reintentar
        </button>
      </section>
    );
  }

  const sinIntentos = estado?.restantes === 0;
  const puntos = examen.preguntas.reduce((t, p) => t + (p.puntos || 1), 0);

  /* Inicio */
  if (fase === 'inicio') {
    return (
      <section className="card relative overflow-hidden md:p-8" aria-label="Examen">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#FBBF24]/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="app-icono app-icono-ambar h-16 w-16 shrink-0 rounded-3xl [&_svg]:h-8 [&_svg]:w-8"><ClipboardCheck /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">Examen{vistaPrevia ? ' · vista previa' : ''}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-tinta">
              {estado?.aprobado ? '¡Ya aprobaste este examen!' : 'Demuestra lo que aprendiste'}
            </h2>
            <p className="mt-1 text-sm text-tinta-3">
              {estado?.aprobado
                ? 'Puedes volver a presentarlo para mejorar tu calificación.'
                : `Necesitas ${examen.aprobar_con} % para aprobar y completar la lección.`}
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Dato icono={ListChecks} valor={examen.preguntas.length} texto={examen.preguntas.length === 1 ? 'pregunta' : 'preguntas'} />
          <Dato icono={Target} valor={`${examen.aprobar_con} %`} texto="para aprobar" />
          <Dato
            icono={Repeat}
            valor={estado?.restantes == null ? 'Sin límite' : `${estado.restantes} de ${examen.intentos}`}
            texto={estado?.restantes == null ? 'intentos' : 'intentos restantes'}
          />
          <Dato icono={Trophy} valor={estado?.mejor != null ? `${estado.mejor} %` : '—'} texto="mejor calificación" />
        </div>

        {estado?.ultimo && (
          <div className={`relative mt-4 flex flex-wrap items-center gap-3 rounded-2xl p-3 ${estado.ultimo.aprobado ? 'bg-[#E6F5F2]' : 'bg-[#FDECEA]'}`}>
            {estado.ultimo.aprobado ? <Award className="h-5 w-5 text-[#0F8F82]" /> : <XCircle className="h-5 w-5 text-[#C62828]" />}
            <p className="min-w-0 flex-1 text-sm text-tinta">
              Último intento: <b className="numero font-semibold">{estado.ultimo.puntaje} %</b> · {estado.ultimo.aciertos} de {estado.ultimo.total} correctas
            </p>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                setResultado(estado.ultimo);
                setFase('resultado');
              }}
            >
              Ver revisión
            </button>
          </div>
        )}

        <div className="relative mt-6">
          <button type="button" className="btn-primary btn-lg" onClick={comenzar} disabled={sinIntentos}>
            {estado?.usados ? <RotateCcw className="h-4 w-4" /> : <Play className="h-5 w-5" />}
            {sinIntentos ? 'Ya no te quedan intentos' : estado?.usados ? 'Intentar de nuevo' : 'Comenzar examen'}
          </button>
          <p className="mt-2 text-xs text-tinta-3">
            {puntos} {puntos === 1 ? 'punto' : 'puntos'} en total. Puedes moverte entre preguntas antes de enviar.
          </p>
        </div>
      </section>
    );
  }

  /* Resultado */
  if (fase === 'resultado' && resultado) {
    return (
      <section className="card relative overflow-hidden md:p-8" aria-label="Resultado del examen">
        {resultado.aprobado && (
          <div className="confeti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
        )}
        <div className="relative text-center" style={{ animation: 'escalar .35s cubic-bezier(.22,.61,.36,1) backwards' }}>
          <Anillo valor={resultado.puntaje} aprobado={resultado.aprobado} />
          <h2 className="mt-4 font-display text-[1.8rem] font-semibold tracking-tight text-tinta">
            {resultado.aprobado ? '¡Aprobaste!' : 'Aún no apruebas'}
          </h2>
          <p className="mt-1 text-sm text-tinta-3">
            {resultado.aciertos} de {resultado.total} preguntas correctas · necesitas {examen.aprobar_con} %
          </p>
          {resultado.aprobado && !vistaPrevia && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F2] px-3 py-1 text-sm font-medium text-[#0B655D]">
              <CheckCircle2 className="h-4 w-4" /> Lección completada
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {!sinIntentos && (
              <button type="button" className={resultado.aprobado ? 'btn-secondary' : 'btn-primary'} onClick={comenzar}>
                <RotateCcw className="h-4 w-4" /> Intentar de nuevo
                {estado?.restantes != null && <span className="text-xs opacity-70">({estado.restantes})</span>}
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={() => setFase('inicio')}>
              Resumen del examen
            </button>
          </div>
        </div>
        <Revision examen={examen} resultado={resultado} />
      </section>
    );
  }

  /* Respondiendo */
  const p = preguntas[actual];
  if (!p) return null;
  const ultima = actual === preguntas.length - 1;

  return (
    <section className="card overflow-hidden p-0 md:p-0" aria-label="Examen en curso">
      <div className="border-b border-black/[.05] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-tinta">
            Pregunta {actual + 1} <span className="font-normal text-tinta-3">de {preguntas.length}</span>
          </p>
          <p className="numero text-xs text-tinta-3">
            {preguntas.length - sinResponder}/{preguntas.length} respondidas
          </p>
        </div>
        <nav className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Preguntas">
          {preguntas.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setActual(i)}
              aria-current={i === actual ? 'step' : undefined}
              aria-label={`Pregunta ${i + 1}${respondida(q) ? ', respondida' : ''}`}
              className={`numero grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all ${
                i === actual ? 'scale-110 bg-negro text-lima' : respondida(q) ? 'bg-[#14A394] text-white' : 'bg-black/[.06] text-tinta-3 hover:bg-black/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>

      <div key={p.id} className="px-4 py-5 sm:px-6 sm:py-6" style={{ animation: 'entrar .3s cubic-bezier(.22,.61,.36,1) backwards' }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
          {p.tipo === 'completar' ? (p.modo === 'elegir' ? 'Elige para completar' : 'Escribe para completar') : 'Opción múltiple'} · {p.puntos}{' '}
          {p.puntos === 1 ? 'punto' : 'puntos'}
        </p>
        {p.enunciado && <h3 className="mt-1 whitespace-pre-wrap font-display text-[1.25rem] font-semibold leading-snug tracking-tight text-tinta">{p.enunciado}</h3>}
        <div className="mt-4">
          <Pregunta
            pregunta={p}
            respuesta={respuestas[p.id] || []}
            orden={orden.opciones[p.id]}
            onRespuesta={(valor) => setRespuestas((r) => ({ ...r, [p.id]: valor }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-black/[.025] px-4 py-4 sm:px-6">
        <button type="button" className="btn-ghost" onClick={() => setActual((a) => a - 1)} disabled={actual === 0}>
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="flex-1" />
        {!ultima && (
          <button type="button" className="btn-secondary" onClick={() => setActual((a) => a + 1)}>
            Siguiente <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          className={ultima ? 'btn-primary' : 'btn-ghost'}
          onClick={() => (sinResponder ? setConfirmar(true) : enviarAhora())}
          disabled={enviando}
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {enviando ? 'Enviando…' : 'Enviar examen'}
        </button>
      </div>

      <Modal
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        titulo="¿Enviar el examen?"
        descripcion={`Te ${sinResponder === 1 ? 'falta 1 pregunta' : `faltan ${sinResponder} preguntas`} por responder. Las preguntas sin respuesta cuentan como incorrectas.`}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setConfirmar(false);
              const i = preguntas.findIndex((q) => !respondida(q));
              if (i >= 0) setActual(i);
            }}
          >
            Seguir respondiendo
          </button>
          <button type="button" className="btn-primary" onClick={enviarAhora}>
            <Send className="h-4 w-4" /> Enviar de todos modos
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default Examen;
