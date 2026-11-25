import { useState } from 'react';
import { Copy, Check, Landmark, Info } from 'lucide-react';
import { moneda } from '../../utils/formato';

/* Datos para pagar una inscripción por transferencia o depósito. */
const Fila = ({ etiqueta, valor, copiable = false }) => {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(String(valor));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-tinta-3">{etiqueta}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="numero truncate text-right text-sm font-semibold text-tinta">{valor}</span>
        {copiable && (
          <button type="button" onClick={copiar} className="btn-icono h-8 w-8" aria-label={`Copiar ${etiqueta.toLowerCase()}`}>
            {copiado ? <Check className="h-4 w-4 text-[#0B655D]" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </span>
    </div>
  );
};

const InstruccionesPago = ({ inscripcion }) => {
  const ip = inscripcion?.instrucciones_pago || {};
  const hayBanco = ip.banco || ip.clabe;

  return (
    <div className="space-y-4">
      <div className="superficie divide-y divide-black/[.06] px-4">
        <Fila etiqueta="Monto a pagar" valor={moneda(ip.monto ?? inscripcion?.precio)} />
        <Fila etiqueta="Referencia" valor={ip.referencia || inscripcion?.folio} copiable />
        {hayBanco && (
          <>
            {ip.banco && <Fila etiqueta="Banco" valor={ip.banco} />}
            {ip.titular && <Fila etiqueta="Titular" valor={ip.titular} />}
            {ip.clabe && <Fila etiqueta="CLABE" valor={ip.clabe} copiable />}
          </>
        )}
      </div>

      {!hayBanco && (
        <p className="flex gap-2 rounded-2xl bg-[#FFF1D2] p-3 text-sm text-[#8A5A00]">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
          Te enviaremos los datos bancarios por correo para completar tu pago.
        </p>
      )}

      <p className="flex gap-2 text-sm text-tinta-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Usa la referencia en tu transferencia. Cuando confirmemos el pago activaremos tu curso y te avisaremos por correo.
      </p>
    </div>
  );
};

export default InstruccionesPago;
