import { useEffect, useRef, useState } from 'react';
import { Brain, Repeat } from 'lucide-react';

/* Memorama: voltea dos tarjetas; si son pareja se quedan descubiertas. */

const Memorama = ({ respuesta, onRespuesta, bloqueado }) => {
  const [volteadas, setVolteadas] = useState([]);
  const [encontradas, setEncontradas] = useState(() => new Set());
  const [movimientos, setMovimientos] = useState(0);
  const [error, setError] = useState(false);
  const reloj = useRef(null);
  const cartas = respuesta.cartas;
  const totalPares = cartas.length / 2;

  useEffect(() => () => clearTimeout(reloj.current), []);

  const voltear = (carta) => {
    if (bloqueado || volteadas.length === 2 || volteadas.includes(carta.id) || encontradas.has(carta.par)) return;
    const nuevas = [...volteadas, carta.id];
    setVolteadas(nuevas);
    if (nuevas.length < 2) return;
    const total = movimientos + 1;
    setMovimientos(total);
    const [a, b] = nuevas.map((id) => cartas.find((c) => c.id === id));
    if (a.par === b.par) {
      reloj.current = setTimeout(() => {
        const ya = new Set(encontradas).add(a.par);
        setEncontradas(ya);
        setVolteadas([]);
        if (ya.size === totalPares) onRespuesta({ ...respuesta, resuelto: true, movimientos: total });
      }, 380);
    } else {
      setError(true);
      reloj.current = setTimeout(() => {
        setVolteadas([]);
        setError(false);
      }, 950);
    }
  };

  const [ancho, columnas] =
    cartas.length <= 6
      ? ['max-w-md', 'grid-cols-3']
      : cartas.length <= 8
        ? ['max-w-xl', 'grid-cols-4']
        : cartas.length <= 12
          ? ['max-w-xl', 'grid-cols-3 sm:grid-cols-4']
          : ['max-w-2xl', 'grid-cols-4 sm:grid-cols-5'];

  return (
    <div className={`mx-auto ${ancho}`}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-tinta">
          <Brain className="h-4 w-4 text-[#6D3EF0]" /> {encontradas.size} de {totalPares} parejas
        </span>
        <span className="numero inline-flex items-center gap-1.5 text-tinta-3">
          <Repeat className="h-4 w-4" /> {movimientos} {movimientos === 1 ? 'intento' : 'intentos'}
        </span>
      </div>
      <div className={`grid gap-2 sm:gap-3 ${columnas}`}>
        {cartas.map((c) => {
          const descubierta = volteadas.includes(c.id) || encontradas.has(c.par);
          const lista = encontradas.has(c.par);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => voltear(c)}
              disabled={bloqueado || lista}
              aria-label={descubierta ? c.texto : 'Tarjeta boca abajo'}
              className={`carta aspect-[4/5] ${descubierta ? 'carta-volteada' : ''}`}
            >
              <span className="carta-interior">
                <span className="carta-cara carta-dorso">
                  <span className="text-2xl font-bold text-lima/80">?</span>
                </span>
                <span
                  className={`carta-cara carta-frente p-2 text-center text-[14px] font-semibold leading-snug sm:text-[15px] ${
                    lista ? 'bg-[#E6F5F2] text-[#0B655D] ring-2 ring-[#14A394]' : error && volteadas.includes(c.id) ? 'bg-[#FDECEA] text-tinta ring-2 ring-[#E5484D]' : 'bg-white text-tinta ring-1 ring-black/10'
                  }`}
                >
                  <span className="line-clamp-5 break-words">{c.texto}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Memorama;
