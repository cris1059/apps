import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import Medidor from '../Panel/Medidor';
import { ICONO_TIPO } from './utilidades';
import { duracion, TIPOS_LECCION } from '../../utils/formato';

/* Temario del curso con el estado de cada lección. */
const Temario = ({ temario = [], actual, completadas, porcentaje, onElegir }) => {
  const totalLecciones = temario.reduce((t, m) => t + (m.lecciones?.length || 0), 0);
  const moduloActual = temario.findIndex((m) => (m.lecciones || []).some((l) => String(l.id) === String(actual)));

  // Cursos chicos: todos los módulos abiertos. Grandes: solo el actual.
  const [abiertos, setAbiertos] = useState(() =>
    new Set(totalLecciones <= 30 ? temario.map((_, i) => i) : [Math.max(0, moduloActual)])
  );

  useEffect(() => {
    if (moduloActual >= 0) setAbiertos((s) => (s.has(moduloActual) ? s : new Set(s).add(moduloActual)));
  }, [moduloActual]);

  const alternar = (i) =>
    setAbiertos((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <nav aria-label="Temario del curso">
      <div className="px-2 pb-4">
        <p className="text-sm font-semibold text-tinta">Tu avance</p>
        <p className="mb-2 text-xs text-tinta-3">
          {completadas.size} de {totalLecciones} lecciones
        </p>
        <Medidor porcentaje={porcentaje} />
      </div>

      <ol className="space-y-2">
        {temario.map((modulo, im) => {
          const lecciones = modulo.lecciones || [];
          const hechas = lecciones.filter((l) => completadas.has(String(l.id))).length;
          const abierto = abiertos.has(im);
          const minutos = lecciones.reduce((t, l) => t + (Number(l.duracion_min) || 0), 0);

          return (
            <li key={modulo.id ?? im} className="rounded-2xl bg-white/55 ring-1 ring-black/[.04]">
              <button
                type="button"
                onClick={() => alternar(im)}
                aria-expanded={abierto}
                className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left"
              >
                <span className="numero mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-negro text-[11px] font-semibold text-lima">
                  {im + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-tinta">{modulo.titulo}</span>
                  <span className="block text-xs text-tinta-3">
                    {hechas}/{lecciones.length} · {duracion(minutos)}
                  </span>
                </span>
                <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-tinta-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
              </button>

              {abierto && (
                <ol className="px-1.5 pb-1.5">
                  {lecciones.map((leccion) => {
                    const id = String(leccion.id);
                    const hecha = completadas.has(id);
                    const esActual = id === String(actual);
                    const Icono = ICONO_TIPO[leccion.tipo] || ICONO_TIPO.lectura;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onElegir(id)}
                          aria-current={esActual ? 'step' : undefined}
                          className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                            esActual ? 'bg-white shadow-suave ring-1 ring-black/[.05]' : 'hover:bg-white/70'
                          }`}
                        >
                          {hecha ? (
                            <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#0F8F82]" aria-label="Completada" />
                          ) : (
                            <Circle className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${esActual ? 'text-tinta' : 'text-black/20'}`} aria-label="Pendiente" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[13.5px] leading-snug ${esActual ? 'font-semibold text-tinta' : 'text-tinta-2'}`}>
                              {leccion.titulo}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-tinta-3">
                              <Icono className="h-3.5 w-3.5" />
                              {TIPOS_LECCION[leccion.tipo] || 'Lección'}
                              {Number(leccion.duracion_min) > 0 && ` · ${duracion(leccion.duracion_min)}`}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Temario;
