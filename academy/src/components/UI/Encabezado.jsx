/* Encabezado de página con el estilo del sitio: etiqueta en píldora,
   título grande en Inter Tight, subtítulo apagado y acciones a la derecha. */
const Encabezado = ({ etiqueta, titulo, apagado, sub, acciones, children }) => (
  <header className="pagina-cabecera">
    <div className="min-w-0">
      {etiqueta && (
        <span className="etiqueta mb-4">
          <span className="etiqueta-punto" aria-hidden="true" />
          {etiqueta}
        </span>
      )}
      <h1 className="pagina-titulo">
        {titulo}
        {apagado && <span className="apagado"> {apagado}</span>}
      </h1>
      {sub && <p className="pagina-sub">{sub}</p>}
      {children}
    </div>
    {acciones && <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{acciones}</div>}
  </header>
);

export default Encabezado;
