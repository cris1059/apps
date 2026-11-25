import { Star } from 'lucide-react';

/* Calificación en estrellas (solo lectura). La cifra va al lado en texto,
   así que la identidad nunca depende solo del color. */
const Estrellas = ({ valor = 0, tamano = 14, mostrarValor = false, total, className = '' }) => {
  const v = Math.max(0, Math.min(5, Number(valor) || 0));
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label={`${v.toFixed(1)} de 5 estrellas`} role="img">
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex gap-0.5 text-black/15">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} style={{ width: tamano, height: tamano }} fill="currentColor" strokeWidth={0} />)}
        </span>
        <span className="absolute inset-0 flex gap-0.5 overflow-hidden text-[#E08600]" style={{ width: `${(v / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="shrink-0" style={{ width: tamano, height: tamano }} fill="currentColor" strokeWidth={0} />)}
        </span>
      </span>
      {mostrarValor && <span className="font-semibold text-tinta">{v.toFixed(1)}</span>}
      {total != null && <span className="text-tinta-3">({total})</span>}
    </span>
  );
};

/* Selector de 1 a 5 estrellas (formulario de reseña). */
export const SelectorEstrellas = ({ valor = 0, onChange, tamano = 28 }) => (
  <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={valor === n}
        aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
        onClick={() => onChange?.(n)}
        className={`rounded-lg p-0.5 transition-transform hover:scale-110 ${n <= valor ? 'text-[#E08600]' : 'text-black/15'}`}
      >
        <Star style={{ width: tamano, height: tamano }} fill="currentColor" strokeWidth={0} />
      </button>
    ))}
  </div>
);

export default Estrellas;
