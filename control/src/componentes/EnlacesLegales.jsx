/*
  Aviso de privacidad · Términos y condiciones · Licencia de uso de los
  sistemas AvantCode. Los publica Jurídico desde sistema.avantcode.mx y se
  leen en avantcode.mx/legal/sistemas/… (abren en otra pestaña).
*/
const DOCUMENTOS = [
  { ruta: "aviso-de-privacidad", nombre: "Aviso de privacidad" },
  { ruta: "terminos-y-condiciones", nombre: "Términos y condiciones" },
  { ruta: "licencia-de-uso", nombre: "Licencia de uso" },
];

const EnlacesLegales = () => (
  <nav className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[12.5px] text-tinta-3" aria-label="Documentos legales">
    {DOCUMENTOS.map((d, i) => (
      <span key={d.ruta} className="flex items-center gap-2">
        {i > 0 && <span aria-hidden="true">·</span>}
        <a
          className="underline-offset-2 transition hover:text-tinta hover:underline"
          href={`https://avantcode.mx/legal/sistemas/${d.ruta}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {d.nombre}
        </a>
      </span>
    ))}
  </nav>
);

export default EnlacesLegales;
