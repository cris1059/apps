import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check, Landmark } from 'lucide-react';
import { moneda } from '../../utils/formato';
import { copiarTexto } from './util';

const Dato = ({ etiqueta, valor, copiable = false, fuerte = false }) => {
  const [copiado, setCopiado] = useState(false);
  if (!valor) return null;

  const copiar = async () => {
    if (await copiarTexto(String(valor))) {
      setCopiado(true);
      toast.success(`${etiqueta} copiado`);
      setTimeout(() => setCopiado(false), 1800);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[13px] text-tinta-3">{etiqueta}</dt>
      <dd className="flex min-w-0 items-center gap-1.5">
        <span className={`truncate text-right text-sm ${fuerte ? 'text-base font-semibold text-tinta' : 'font-medium text-tinta'} ${copiable ? 'numero' : ''}`}>
          {valor}
        </span>
        {copiable && (
          <button type="button" onClick={copiar} className="btn-icono h-8 w-8" aria-label={`Copiar ${etiqueta.toLowerCase()}`}>
            {copiado ? <Check className="h-4 w-4 text-[#0F8F82]" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </dd>
    </div>
  );
};

/* Datos para pagar por transferencia una inscripción pendiente. */
const InstruccionesPago = ({ inscripcion }) => {
  const pago = inscripcion?.instrucciones_pago || {};
  const monto = pago.monto ?? inscripcion?.precio;
  const referencia = pago.referencia || inscripcion?.folio;
  const sinCuenta = !pago.clabe && !pago.banco;

  return (
    <div className="superficie p-4">
      <div className="mb-1 flex items-center gap-2">
        <Landmark className="h-4 w-4 text-tinta-3" />
        <p className="text-sm font-semibold text-tinta">Datos para tu transferencia</p>
      </div>
      <dl className="divide-y divide-black/[.06]">
        <Dato etiqueta="Monto" valor={moneda(monto)} fuerte />
        <Dato etiqueta="Banco" valor={pago.banco} />
        <Dato etiqueta="Titular" valor={pago.titular} />
        <Dato etiqueta="CLABE" valor={pago.clabe} copiable />
        <Dato etiqueta="Referencia" valor={referencia} copiable />
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-tinta-3">
        {sinCuenta
          ? 'Te enviaremos por correo la cuenta para pagar. Usa tu folio como referencia.'
          : 'Escribe la referencia en el concepto. Activaremos tu curso en cuanto confirmemos el pago y te avisaremos por correo.'}
      </p>
    </div>
  );
};

export default InstruccionesPago;
