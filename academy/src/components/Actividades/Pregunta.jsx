import { Check, X } from 'lucide-react';
import EditorCodigo from './EditorCodigo';

/* Pregunta de opción múltiple o de completar (forma pública, sin respuestas).
   La usan el examen y los retos de práctica.
   - respuesta: ids de opción elegidos, o el texto de cada espacio
   - revision: { malas, buenas, huecos: bool[], correctas: string[] } para marcar aciertos */

const LETRAS = 'ABCDEFGH';

const OpcionMultiple = ({ pregunta, respuesta = [], onRespuesta, orden, revision, bloqueado }) => {
  const ids = orden || pregunta.opciones.map((o) => o.id);
  const porId = Object.fromEntries(pregunta.opciones.map((o) => [o.id, o]));
  const elegir = (id) => {
    if (bloqueado) return;
    if (pregunta.multiple) onRespuesta(respuesta.includes(id) ? respuesta.filter((x) => x !== id) : [...respuesta, id]);
    else onRespuesta([id]);
  };

  return (
    <div className="space-y-3">
      {pregunta.codigo && <EditorCodigo valor={pregunta.codigo} soloLectura lenguaje="javascript" minAlto={40} maxAlto={300} etiqueta="Código de la pregunta" />}
      {pregunta.multiple && <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">Elige todas las correctas</p>}
      <div className="grid gap-2" role={pregunta.multiple ? 'group' : 'radiogroup'} aria-label="Opciones">
        {ids.map((id, i) => {
          const o = porId[id];
          if (!o) return null;
          const elegida = respuesta.includes(id);
          const mala = revision?.malas?.includes(id);
          const correcta = revision?.buenas?.includes(id);
          const buena = correcta && elegida;
          const faltante = correcta && !elegida; // la correcta que no eligió
          const estilo = buena
            ? 'bg-[#E6F5F2] ring-2 ring-[#14A394] text-tinta'
            : faltante
              ? 'bg-white ring-2 ring-[#14A394]/50 text-tinta'
              : mala
              ? 'bg-[#FDECEA] ring-2 ring-[#E5484D] text-tinta animate-[sacudir_.4s]'
              : elegida
                ? 'bg-white ring-2 ring-negro text-tinta shadow-suave'
                : 'bg-white/70 ring-1 ring-black/[.07] text-tinta-2 hover:bg-white hover:ring-black/20';
          return (
            <button
              key={id}
              type="button"
              role={pregunta.multiple ? 'checkbox' : 'radio'}
              aria-checked={elegida}
              disabled={bloqueado}
              onClick={() => elegir(id)}
              className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left text-[15px] transition-all duration-200 disabled:cursor-default ${estilo}`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center text-[13px] font-semibold transition-colors ${pregunta.multiple ? 'rounded-lg' : 'rounded-full'} ${
                  buena
                    ? 'bg-[#0F8F82] text-white'
                    : faltante
                      ? 'bg-[#E6F5F2] text-[#0F8F82] ring-1 ring-[#14A394]'
                      : mala
                        ? 'bg-[#E5484D] text-white'
                        : elegida
                          ? 'bg-negro text-lima'
                          : 'bg-black/[.06] text-tinta-3'
                }`}
              >
                {buena || faltante ? <Check className="h-4 w-4" /> : mala ? <X className="h-4 w-4" /> : LETRAS[i]}
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{o.texto}</span>
              {faltante && <span className="shrink-0 text-xs font-semibold text-[#0F8F82]">Respuesta correcta</span>}            </button>
          );
        })}
      </div>
    </div>
  );
};

const Completar = ({ pregunta, respuesta = [], onRespuesta, revision, bloqueado }) => {
  const cambiar = (i, valor) => {
    const nuevas = Array.from({ length: pregunta.huecos }, (_, k) => respuesta[k] ?? '');
    nuevas[i] = valor;
    onRespuesta(nuevas);
  };
  const Contenedor = pregunta.es_codigo ? 'pre' : 'p';

  return (
    <Contenedor
      className={`m-0 whitespace-pre-wrap break-words rounded-2xl p-4 ${
        pregunta.es_codigo ? 'bg-[#161616] font-mono text-[13.5px] leading-[2.5] text-[#E8EAED]' : 'bg-white/70 text-[15.5px] leading-[2.6] text-tinta ring-1 ring-black/[.06]'
      }`}
    >
      {pregunta.segmentos.map((s, k) => {
        if (s.texto !== undefined) return <span key={k}>{s.texto}</span>;
        const i = s.hueco;
        const valor = respuesta[i] ?? '';
        const marca = revision?.huecos?.[i];
        const anillo =
          marca === true ? 'ring-2 ring-[#14A394] bg-[#E6F5F2]' : marca === false ? 'ring-2 ring-[#E5484D] bg-[#FDECEA]' : pregunta.es_codigo ? 'ring-1 ring-white/25 bg-white/10' : 'ring-1 ring-black/15 bg-white';
        const color = pregunta.es_codigo && marca === undefined ? 'text-lima' : 'text-tinta';
        const correcta = marca === false ? revision?.correctas?.[i] : null;
        return (
          <span key={k} className="mx-0.5 inline-flex items-baseline gap-1 align-baseline">
            {pregunta.modo === 'elegir' ? (
              <select
                value={valor}
                onChange={(e) => cambiar(i, e.target.value)}
                disabled={bloqueado}
                aria-label={`Espacio ${i + 1}`}
                className={`rounded-lg px-2 py-1 font-mono text-[13px] leading-normal outline-none focus:ring-2 focus:ring-negro ${anillo} ${color}`}
              >
                <option value="">Elige…</option>
                {pregunta.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                value={valor}
                onChange={(e) => cambiar(i, e.target.value.slice(0, 200))}
                disabled={bloqueado}
                size={Math.max(5, valor.length + 1)}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-label={`Espacio ${i + 1}`}
                className={`rounded-lg px-2 py-1 text-center font-mono text-[13px] leading-normal outline-none focus:ring-2 focus:ring-negro ${anillo} ${color}`}
              />
            )}
            {correcta && <span className="rounded-md bg-[#0F8F82] px-1.5 font-mono text-[12px] leading-5 text-white">{correcta}</span>}
          </span>
        );
      })}
    </Contenedor>
  );
};

const Pregunta = (props) =>
  props.pregunta.tipo === 'opcion_multiple' ? <OpcionMultiple {...props} /> : props.pregunta.tipo === 'completar' ? <Completar {...props} /> : null;

export default Pregunta;
