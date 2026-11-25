import logo from "../assets/img/LogoI.webp";

/* Logo como en el sistema y el sitio: círculo + "ΛVΛNTCODE" (A sin
   travesaño, "AVANT" con más peso), y la etiqueta lima "Control". */
const Marca = ({ claro = false, className = "" }) => (
  <span className={`marca${claro ? " marca--claro" : ""} ${className}`} aria-label="AvantCode Control" role="img">
    <img className="marca-logo" src={logo} alt="" width="30" height="30" />
    <span className="marca-nombre" aria-hidden="true">
      <b>ΛVΛNT</b>CODE
    </span>
    <span className="marca-producto" aria-hidden="true">
      Control
    </span>
  </span>
);

export default Marca;
