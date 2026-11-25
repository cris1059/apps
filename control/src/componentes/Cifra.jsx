/* Indicador: título, valor grande y un detalle opcional. */
function Cifra({ titulo, valor, detalle, tono }) {
  return (
    <div className="card !p-4">
      <p className="text-[13px] text-tinta-3">{titulo}</p>
      <p className={`mt-1 text-[28px] font-semibold leading-none tracking-tight tabular-nums ${tono === "aviso" ? "text-amber-700" : "text-tinta"}`}>{valor}</p>
      {detalle && <p className="mt-1.5 text-[12.5px] text-tinta-3">{detalle}</p>}
    </div>
  );
}

export default Cifra;
