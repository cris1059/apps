import { useState } from 'react';

/* Clasificar: toca un elemento y luego el grupo (o arrástralo). Toca la bandeja para regresarlo. */

const COLORES = ['#6D3EF0', '#14A394', '#F59E0B', '#0EA5E9'];
const COLUMNAS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };

const Ficha = ({ item, marca, activo, bloqueado, onElegir }) => (
  <button
    type="button"
    draggable={!bloqueado}
    onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
    onClick={(e) => {
      e.stopPropagation();
      if (!bloqueado) onElegir(item.id);
    }}
    disabled={bloqueado}
    aria-pressed={activo}
    className={`rounded-xl px-3 py-2 text-[14px] font-medium ring-1 transition-all ${
      marca === true
        ? 'bg-[#14A394] text-white ring-[#14A394]'
        : marca === false
          ? 'animate-[sacudir_.4s] bg-[#E5484D] text-white ring-[#E5484D]'
          : activo
            ? '-translate-y-0.5 bg-negro text-lima shadow-flotante ring-negro'
            : 'bg-white text-tinta shadow-suave ring-black/10 hover:-translate-y-0.5'
    } ${bloqueado ? 'cursor-default' : 'cursor-grab'}`}
  >
    {item.texto}
  </button>
);

const Clasificar = ({ reto, respuesta, onRespuesta, revision, bloqueado, correcto }) => {
  const [elegido, setElegido] = useState(null);
  const [sobre, setSobre] = useState(null); // 'banco' | índice del grupo
  const grupos = reto.grupos || [];

  const ubicar = (idItem, grupo) => {
    if (bloqueado || !idItem || !respuesta.items.some((it) => it.id === idItem)) return;
    const ubicacion = { ...respuesta.ubicacion };
    if (grupo === null) delete ubicacion[idItem];
    else ubicacion[idItem] = grupo;
    onRespuesta({ ...respuesta, ubicacion });
    setElegido(null);
  };

  const zona = (grupo) => {
    const clave = grupo === null ? 'banco' : grupo;
    return {
      onClick: () => elegido && ubicar(elegido, grupo),
      onDragOver: (e) => {
        if (bloqueado) return;
        e.preventDefault();
        setSobre(clave);
      },
      onDragLeave: () => setSobre(null),
      onDrop: (e) => {
        e.preventDefault();
        setSobre(null);
        ubicar(e.dataTransfer.getData('text/plain'), grupo);
      },
    };
  };

  const ficha = (it) => (
    <Ficha
      key={it.id}
      item={it}
      marca={correcto ? true : revision?.items?.[it.id]}
      activo={elegido === it.id}
      bloqueado={bloqueado}
      onElegir={(id) => setElegido((actual) => (actual === id ? null : id))}
    />
  );

  const sinUbicar = respuesta.items.filter((it) => respuesta.ubicacion[it.id] === undefined);

  return (
    <div className="space-y-3">
      <div
        {...zona(null)}
        className={`flex min-h-[60px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          sobre === 'banco' ? 'border-[#14A394] bg-[#E6F5F2]' : 'border-black/10 bg-black/[.02]'
        }`}
        aria-label="Elementos por clasificar"
      >
        {sinUbicar.length ? (
          sinUbicar.map(ficha)
        ) : (
          <span className="text-sm text-tinta-3">{bloqueado ? '' : '¡Todo clasificado! Toca un elemento para moverlo.'}</span>
        )}
      </div>
      {elegido && <p className="text-center text-sm font-medium text-tinta-2">Ahora toca el grupo al que pertenece.</p>}
      <div className={`grid gap-3 ${COLUMNAS[grupos.length] || COLUMNAS[2]}`}>
        {grupos.map((g, gi) => {
          const dentro = respuesta.items.filter((it) => respuesta.ubicacion[it.id] === gi);
          return (
            <div
              key={gi}
              {...zona(gi)}
              role="button"
              tabIndex={elegido ? 0 : -1}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && elegido && ubicar(elegido, gi)}
              aria-label={`Grupo ${g.nombre}`}
              className={`min-h-[140px] rounded-2xl bg-white/70 p-3 ring-1 transition-all ${
                sobre === gi ? 'scale-[1.02] ring-2 ring-negro' : elegido ? 'cursor-pointer ring-2 ring-black/20 hover:ring-negro' : 'ring-black/[.07]'
              }`}
              style={{ borderTop: `4px solid ${COLORES[gi % COLORES.length]}` }}
            >
              <p className="mb-2 flex items-center justify-between gap-2 text-[13px] font-semibold uppercase tracking-wide text-tinta-2">
                {g.nombre}
                <span className="numero rounded-full bg-black/[.05] px-2 text-xs text-tinta-3">{dentro.length}</span>
              </p>
              <div className="flex flex-wrap gap-2">{dentro.map(ficha)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Clasificar;
