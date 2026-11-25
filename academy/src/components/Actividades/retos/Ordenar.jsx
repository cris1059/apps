import { useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

/* Ordenar bloques: arrastra (computadora) o usa las flechas (celular y teclado). */

const Ordenar = ({ reto, respuesta, onRespuesta, revision, bloqueado, correcto }) => {
  const [arrastrado, setArrastrado] = useState(null);
  const [sobre, setSobre] = useState(null);
  const elementos = reto.elementos || [];
  const orden = respuesta.orden;

  const mover = (desde, hasta) => {
    if (bloqueado || desde === hasta || hasta < 0 || hasta >= orden.length) return;
    const copia = [...orden];
    const [item] = copia.splice(desde, 1);
    copia.splice(hasta, 0, item);
    onRespuesta({ ...respuesta, orden: copia });
  };

  return (
    <ol className="space-y-2" aria-label="Bloques para ordenar">
      {orden.map((indice, pos) => {
        const marca = correcto ? true : revision?.posiciones?.[pos];
        return (
          <li
            key={indice}
            draggable={!bloqueado}
            onDragStart={(e) => {
              setArrastrado(pos);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(pos));
            }}
            onDragOver={(e) => {
              if (arrastrado === null) return;
              e.preventDefault();
              setSobre(pos);
            }}
            onDragEnd={() => {
              setArrastrado(null);
              setSobre(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (arrastrado !== null) mover(arrastrado, pos);
              setArrastrado(null);
              setSobre(null);
            }}
            className={`group flex items-center gap-2 rounded-2xl p-2 pl-1.5 ring-1 transition-all duration-200 ${
              marca === true
                ? 'bg-[#E6F5F2] ring-[#14A394]'
                : marca === false
                  ? 'bg-[#FDECEA] ring-[#E5484D]'
                  : 'bg-white ring-black/[.07] shadow-sm'
            } ${arrastrado === pos ? 'opacity-40' : ''} ${sobre === pos && arrastrado !== pos ? 'translate-y-1 ring-2 ring-negro' : ''} ${
              bloqueado ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-tinta-3/60" aria-hidden="true" />
            <span className={`numero grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${marca === true ? 'bg-[#0F8F82] text-white' : marca === false ? 'bg-[#E5484D] text-white' : 'bg-black/[.06] text-tinta-3'}`}>
              {pos + 1}
            </span>
            {reto.es_codigo ? (
              <pre className="m-0 min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-[13px] text-tinta">{elementos[indice]}</pre>
            ) : (
              <span className="min-w-0 flex-1 text-[15px] text-tinta">{elementos[indice]}</span>
            )}
            {!bloqueado && (
              <span className="flex shrink-0">
                <button type="button" className="btn-icono h-9 w-9" onClick={() => mover(pos, pos - 1)} disabled={pos === 0} aria-label={`Subir: ${elementos[indice]}`}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" className="btn-icono h-9 w-9" onClick={() => mover(pos, pos + 1)} disabled={pos === orden.length - 1} aria-label={`Bajar: ${elementos[indice]}`}>
                  <ArrowDown className="h-4 w-4" />
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default Ordenar;
