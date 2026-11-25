/* Medidor de avance: relleno + pista de un paso más claro del mismo tono.
   Tinta mientras avanza; teal cuando el curso está completo. */
const Medidor = ({ porcentaje = 0, etiqueta = true, alto = 'h-2', claro = false, className = '' }) => {
  const valor = Math.max(0, Math.min(100, Math.round(Number(porcentaje) || 0)));
  const completo = valor >= 100;

  const pista = claro ? 'bg-white/15' : completo ? 'bg-teal-50' : 'bg-black/[.08]';
  const relleno = completo ? 'bg-[#0F8F82]' : claro ? 'bg-lima' : 'bg-negro';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex-1 overflow-hidden rounded-full ${alto} ${pista}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label={`Avance del curso: ${valor}%`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-ac ${relleno}`}
          style={{ width: `${valor}%` }}
        />
      </div>
      {etiqueta && (
        <span className={`numero w-10 shrink-0 text-right text-xs font-semibold ${claro ? 'text-white/80' : 'text-tinta-2'}`}>
          {valor}%
        </span>
      )}
    </div>
  );
};

export default Medidor;
