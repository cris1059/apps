import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/* Conectar nodos: arrastra una línea de un nodo a su pareja del otro lado
   (o toca uno y luego el otro). Toca un nodo conectado para soltarlo. */

const COLORES = ['#6D3EF0', '#14A394', '#F59E0B', '#0EA5E9', '#D946EF', '#F97316', '#84CC16', '#E5484D', '#64748B', '#0F766E', '#A16207', '#2563EB'];

const curva = (a, b) => {
  const dx = Math.max(30, Math.abs(b.x - a.x) / 2);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
};

const Relacionar = ({ reto, respuesta, onRespuesta, revision, bloqueado, correcto }) => {
  const pares = reto.pares || [];
  const caja = useRef(null);
  const nodos = useRef({});
  const [puntos, setPuntos] = useState({});
  const [elegido, setElegido] = useState(null); // { lado: 'i' | 'd', indice }
  const [arrastre, setArrastre] = useState(null); // { lado, indice, x, y, x0, y0 }

  const conexiones = respuesta.pares; // { [izquierda]: derecha }
  const derechaDe = (d) => Object.keys(conexiones).find((k) => conexiones[k] === d);

  // Coordenadas de los conectores de cada nodo, relativas a la caja.
  const medir = useCallback(() => {
    const base = caja.current?.getBoundingClientRect();
    if (!base) return;
    const nuevos = {};
    for (const [clave, el] of Object.entries(nodos.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const izquierda = clave.startsWith('i');
      nuevos[clave] = { x: (izquierda ? r.right : r.left) - base.left, y: r.top + r.height / 2 - base.top };
    }
    setPuntos(nuevos);
  }, []);

  useLayoutEffect(() => {
    medir();
    const obs = new ResizeObserver(medir);
    if (caja.current) obs.observe(caja.current);
    window.addEventListener('resize', medir);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [medir, respuesta.derecha, respuesta.izquierda]);

  const conectar = (izq, der) => {
    const nuevas = { ...conexiones };
    for (const k of Object.keys(nuevas)) if (nuevas[k] === der) delete nuevas[k];
    nuevas[izq] = der;
    onRespuesta({ ...respuesta, pares: nuevas });
  };

  const soltar = (lado, indice) => {
    const nuevas = { ...conexiones };
    if (lado === 'i') delete nuevas[indice];
    else {
      const k = derechaDe(indice);
      if (k !== undefined) delete nuevas[k];
    }
    onRespuesta({ ...respuesta, pares: nuevas });
  };

  const tocar = (lado, indice) => {
    if (bloqueado) return;
    if (elegido && elegido.lado !== lado) {
      if (lado === 'i') conectar(indice, elegido.indice);
      else conectar(elegido.indice, indice);
      setElegido(null);
      return;
    }
    if (elegido && elegido.lado === lado && elegido.indice === indice) return setElegido(null);
    const conectado = lado === 'i' ? conexiones[indice] !== undefined : derechaDe(indice) !== undefined;
    if (conectado) soltar(lado, indice);
    setElegido({ lado, indice });
  };

  const posicion = (e) => {
    const base = caja.current.getBoundingClientRect();
    return { x: e.clientX - base.left, y: e.clientY - base.top };
  };

  const alPresionar = (lado, indice) => (e) => {
    if (bloqueado || e.button > 0) return;
    const p = posicion(e);
    setArrastre({ lado, indice, ...p, x0: p.x, y0: p.y });
  };

  const alMover = (e) => {
    if (!arrastre) return;
    setArrastre((a) => ({ ...a, ...posicion(e) }));
  };

  const alSoltar = (e) => {
    if (!arrastre) return;
    const movido = Math.hypot(arrastre.x - arrastre.x0, arrastre.y - arrastre.y0) > 8;
    const { lado, indice } = arrastre;
    setArrastre(null);
    if (!movido) return tocar(lado, indice);
    const destino = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-nodo]');
    if (!destino) return;
    const [ladoDestino, indiceDestino] = destino.dataset.nodo.split('-');
    if (ladoDestino === lado) return;
    const otro = Number(indiceDestino);
    if (lado === 'i') conectar(indice, otro);
    else conectar(otro, indice);
    setElegido(null);
  };

  const nodo = (lado, indice) => {
    const clave = `${lado}-${indice}`;
    const texto = lado === 'i' ? pares[indice]?.a : pares[indice]?.b;
    const izq = lado === 'i' ? indice : derechaDe(indice);
    const conectado = izq !== undefined && (lado === 'i' ? conexiones[indice] !== undefined : true);
    const color = conectado ? COLORES[Number(izq) % COLORES.length] : null;
    const marca = correcto ? (conectado ? true : undefined) : conectado ? revision?.pares?.[izq] : undefined;
    const activo = elegido?.lado === lado && elegido.indice === indice;
    return (
      <button
        key={clave}
        type="button"
        data-nodo={clave}
        ref={(el) => {
          nodos.current[clave] = el;
        }}
        onPointerDown={alPresionar(lado, indice)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tocar(lado, indice))}
        disabled={bloqueado}
        aria-pressed={activo}
        aria-label={`${texto}${conectado ? ' (conectado)' : ''}`}
        className={`relative w-full touch-none select-none rounded-2xl px-3 py-3 text-[14.5px] font-medium transition-all ${
          lado === 'i' ? 'text-left' : 'text-left'
        } ${
          marca === false
            ? 'animate-[sacudir_.4s] bg-[#FDECEA] text-tinta ring-2 ring-[#E5484D]'
            : activo
              ? 'scale-[1.02] bg-negro text-lima shadow-flotante'
              : conectado
                ? 'bg-white text-tinta shadow-suave ring-2'
                : 'bg-white/80 text-tinta-2 ring-1 ring-black/[.08] hover:bg-white hover:ring-black/20'
        } ${bloqueado ? 'cursor-default' : 'cursor-pointer'}`}
        style={conectado && marca !== false && !activo ? { '--tw-ring-color': marca === true ? '#14A394' : color } : undefined}
      >
        {texto}
        <span
          aria-hidden="true"
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow ${lado === 'i' ? '-right-[7px]' : '-left-[7px]'}`}
          style={{ background: marca === false ? '#E5484D' : conectado ? (marca === true ? '#14A394' : color) : '#C9C9C9' }}
        />
      </button>
    );
  };

  const origenArrastre = arrastre ? puntos[`${arrastre.lado}-${arrastre.indice}`] : null;

  return (
    <div>
      <div
        ref={caja}
        className="relative grid grid-cols-2 gap-x-12 gap-y-2.5 sm:gap-x-24"
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerLeave={() => setArrastre(null)}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {Object.entries(conexiones).map(([izq, der]) => {
            const a = puntos[`i-${izq}`];
            const b = puntos[`d-${der}`];
            if (!a || !b) return null;
            const marca = correcto ? true : revision?.pares?.[izq];
            const color = marca === true ? '#14A394' : marca === false ? '#E5484D' : COLORES[Number(izq) % COLORES.length];
            return <path key={izq} d={curva(a, b)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={marca === false ? '6 6' : undefined} />;
          })}
          {origenArrastre && (
            <path
              d={arrastre.lado === 'i' ? curva(origenArrastre, arrastre) : curva(arrastre, origenArrastre)}
              fill="none"
              stroke="#161616"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="space-y-2.5">{respuesta.izquierda.map((i) => nodo('i', i))}</div>
        <div className="space-y-2.5">{respuesta.derecha.map((d) => nodo('d', d))}</div>
      </div>
      {!bloqueado && (
        <p className="mt-3 text-center text-xs text-tinta-3">Arrastra de un nodo a otro, o toca uno y después su pareja.</p>
      )}
    </div>
  );
};

export default Relacionar;
