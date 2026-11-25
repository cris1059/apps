import { esGratis, moneda, precioEfectivo } from '../../utils/formato';

/* Precio de un curso: "Gratis", o el precio con el original tachado si hay oferta. */
const Precio = ({ curso, className = '' }) => {
  if (esGratis(curso)) return <span className={`ac-precio ${className}`}>Gratis</span>;
  const oferta = curso?.precio_oferta != null && Number(curso.precio_oferta) < Number(curso.precio);
  return (
    <span className={`ac-precio ${className}`}>
      {moneda(precioEfectivo(curso))}
      {oferta && <s>{moneda(curso.precio)}</s>}
    </span>
  );
};

/* Porcentaje de descuento (o null). */
export const descuento = (curso) => {
  const p = Number(curso?.precio);
  const o = curso?.precio_oferta == null ? null : Number(curso.precio_oferta);
  if (!p || o == null || o >= p) return null;
  return Math.round((1 - o / p) * 100);
};

export default Precio;
