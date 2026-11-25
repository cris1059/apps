import { useMemo, useState } from 'react';
import { partirHuecos } from '../modelo';

/* Arrastrar fichas a los espacios de un texto o código.
   Toca una ficha y se coloca en el espacio activo (o el primero libre); toca un espacio
   lleno para regresar la ficha. En computadora también se pueden arrastrar. */

const Arrastrar = ({ reto, respuesta, onRespuesta, revision, bloqueado, correcto }) => {
  const partes = useMemo(() => partirHuecos(reto.texto), [reto.texto]);
  const [activo, setActivo] = useState(0);
  const [sobre, setSobre] = useState(null);
  const porId = Object.fromEntries(respuesta.fichas.map((f) => [f.id, f]));
  const usadas = new Set(respuesta.huecos.filter(Boolean));

  const colocar = (idFicha, destino = null) => {
    if (bloqueado) return;
    const huecos = respuesta.huecos.map((h) => (h === idFicha ? null : h));
    let lugar = destino;
    if (lugar === null) lugar = activo !== null && huecos[activo] === null ? activo : huecos.findIndex((h) => h === null);
    if (lugar === null || lugar < 0) return;
    huecos[lugar] = idFicha;
    onRespuesta({ ...respuesta, huecos });
    const siguiente = huecos.findIndex((h, i) => h === null && i > lugar);
    setActivo(siguiente >= 0 ? siguiente : huecos.findIndex((h) => h === null));
  };

  const quitar = (i) => {
    if (bloqueado) return;
    const huecos = [...respuesta.huecos];
    huecos[i] = null;
    onRespuesta({ ...respuesta, huecos });
    setActivo(i);
  };

  const arrastrable = (idFicha) =>
    bloqueado
      ? {}
      : {
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.setData('text/plain', idFicha);
            e.dataTransfer.effectAllowed = 'move';
          },
        };

  const soltarEn = (destino) => ({
    onDragOver: (e) => {
      if (bloqueado) return;
      e.preventDefault();
      setSobre(destino);
    },
    onDragLeave: () => setSobre(null),
    onDrop: (e) => {
      e.preventDefault();
      setSobre(null);
      const id = e.dataTransfer.getData('text/plain');
      if (!porId[id]) return;
      if (destino === 'banco') {
        const i = respuesta.huecos.indexOf(id);
        if (i >= 0) quitar(i);
      } else colocar(id, destino);
    },
  });

  const Contenedor = reto.es_codigo ? 'pre' : 'p';
  const libres = respuesta.fichas.filter((f) => !usadas.has(f.id));

  return (
    <div className="space-y-4">
      <Contenedor
        className={`m-0 whitespace-pre-wrap break-words rounded-2xl p-4 ${
          reto.es_codigo ? 'bg-[#161616] font-mono text-[13.5px] leading-[2.7] text-[#E8EAED]' : 'bg-white/70 text-[15.5px] leading-[2.7] text-tinta ring-1 ring-black/[.06]'
        }`}
      >
        {partes.map((p, k) => {
          if (!p.respuestas) return <span key={k}>{p.texto}</span>;
          const i = p.hueco;
          const ficha = porId[respuesta.huecos[i]];
          const marca = correcto ? true : revision?.huecos?.[i];
          const color =
            marca === true
              ? 'bg-[#14A394] text-white ring-[#14A394]'
              : marca === false
                ? 'bg-[#E5484D] text-white ring-[#E5484D] animate-[sacudir_.4s]'
                : ficha
                  ? reto.es_codigo ? 'bg-lima text-negro ring-lima' : 'bg-negro text-white ring-negro'
                  : '';
          return (
            <button
              key={k}
              type="button"
              onClick={() => (ficha ? quitar(i) : setActivo(i))}
              disabled={bloqueado}
              aria-label={ficha ? `Espacio ${i + 1}: ${ficha.texto}. Toca para quitar` : `Espacio ${i + 1} vacío`}
              {...(ficha ? arrastrable(ficha.id) : {})}
              {...soltarEn(i)}
              className={`mx-0.5 inline-flex min-w-[64px] items-center justify-center rounded-lg px-2.5 align-middle font-mono text-[13px] leading-7 ring-1 transition-all ${
                ficha
                  ? `${color} shadow-sm`
                  : `border-2 border-dashed ${reto.es_codigo ? 'border-white/30' : 'border-black/20'} ring-0 ${
                      activo === i && !bloqueado ? (reto.es_codigo ? 'border-lima bg-lima/10' : 'border-negro bg-black/[.04]') : ''
                    } ${sobre === i ? 'scale-110 border-[#14A394]' : ''}`
              }`}
            >
              {ficha ? ficha.texto : ' '}
            </button>
          );
        })}
      </Contenedor>

      <div
        {...soltarEn('banco')}
        className={`flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${sobre === 'banco' ? 'border-[#14A394] bg-[#E6F5F2]' : 'border-black/10 bg-black/[.02]'}`}
        aria-label="Fichas disponibles"
      >
        {libres.length === 0 ? (
          <span className="text-sm text-tinta-3">{bloqueado ? '' : 'Todas las fichas están colocadas. Toca una para regresarla.'}</span>
        ) : (
          libres.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => colocar(f.id)}
              disabled={bloqueado}
              {...arrastrable(f.id)}
              className="cursor-grab rounded-xl bg-white px-3 py-2 font-mono text-[13.5px] font-medium text-tinta shadow-suave ring-1 ring-black/10 transition-transform hover:-translate-y-0.5 active:cursor-grabbing disabled:cursor-default"
            >
              {f.texto}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Arrastrar;
