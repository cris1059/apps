/* Texto de una lección con formato sencillo, sin HTML (nada de
   dangerouslySetInnerHTML):
   - línea en blanco → bloque nuevo
   - "# " / "## " / "### " → títulos
   - líneas "- ", "* " o "• " → lista con viñetas
   - líneas "1. " o "1) " → lista numerada
   - cualquier otra línea → párrafo (las líneas seguidas se unen con salto)
   - **texto** → negritas
   Dentro de un mismo bloque se pueden mezclar párrafos y listas. */

const VINETA = /^\s*[-*•]\s+/;
const NUMERO = /^\s*\d+[.)]\s+/;
const TITULO = /^\s*(#{1,3})\s+/;

const conNegritas = (linea, clave) =>
  linea.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    /^\*\*[^*]+\*\*$/.test(parte) ? (
      <strong key={`${clave}-${i}`} className="font-semibold text-tinta">{parte.slice(2, -2)}</strong>
    ) : (
      parte
    )
  );

const tipoDe = (linea) => {
  if (TITULO.test(linea)) return 'titulo';
  if (VINETA.test(linea)) return 'vineta';
  if (NUMERO.test(linea)) return 'numero';
  return 'texto';
};

/* Agrupa las líneas consecutivas del mismo tipo (los títulos van solos). */
const segmentar = (texto) => {
  const segmentos = [];
  const bloques = texto.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  for (const bloque of bloques) {
    let actual = null;
    for (const linea of bloque.split('\n').filter((l) => l.trim())) {
      const tipo = tipoDe(linea);
      if (!actual || actual.tipo !== tipo || tipo === 'titulo') {
        actual = { tipo, lineas: [] };
        segmentos.push(actual);
      }
      actual.lineas.push(linea);
    }
  }
  return segmentos;
};

const ContenidoTexto = ({ texto }) => {
  if (!texto?.trim()) return null;

  return (
    <div className="space-y-4 text-[15.5px] leading-[1.75] text-tinta-2">
      {segmentar(texto).map((seg, s) => {
        if (seg.tipo === 'titulo') {
          const linea = seg.lineas[0];
          const nivel = linea.match(TITULO)[1].length;
          const contenido = conNegritas(linea.replace(TITULO, ''), s);
          return nivel === 1 ? (
            <h2 key={s} className="display pt-2 text-2xl font-semibold text-tinta">{contenido}</h2>
          ) : (
            <h3 key={s} className="display pt-1 text-lg font-semibold text-tinta">{contenido}</h3>
          );
        }

        if (seg.tipo === 'vineta') {
          return (
            <ul key={s} className="space-y-1.5 pl-1">
              {seg.lineas.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-negro" aria-hidden="true" />
                  <span>{conNegritas(l.replace(VINETA, ''), `${s}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (seg.tipo === 'numero') {
          return (
            <ol key={s} className="space-y-1.5">
              {seg.lineas.map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="numero mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black/[.06] text-xs font-semibold text-tinta">
                    {i + 1}
                  </span>
                  <span>{conNegritas(l.replace(NUMERO, ''), `${s}-${i}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={s}>
            {seg.lineas.map((l, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {conNegritas(l, `${s}-${i}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default ContenidoTexto;
