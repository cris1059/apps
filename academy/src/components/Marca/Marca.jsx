import logo from '../../img/LogoI.webp';

/* Marca de AvantCode Academy: el logo del sitio ("ΛVΛNTCODE") con la
   etiqueta "Academy". `claro` para fondos oscuros. */
const Marca = ({ claro = false, sinEtiqueta = false, className = '' }) => (
  <span className={`marca${claro ? ' marca--claro' : ''} ${className}`} aria-label="AvantCode Academy" role="img">
    <img className="marca-logo" src={logo} alt="" width="30" height="30" />
    <span className="marca-nombre" aria-hidden="true">
      <b>ΛVΛNT</b>CODE
    </span>
    {!sinEtiqueta && (
      <span
        aria-hidden="true"
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
          claro ? 'bg-lima/15 text-lima' : 'bg-negro text-lima'
        }`}
      >
        Academy
      </span>
    )}
  </span>
);

export default Marca;
