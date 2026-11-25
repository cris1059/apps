import { useState } from "react";
import { CircleCheck, CircleX, Clock, FileSpreadsheet, FileText, Search, TriangleAlert } from "lucide-react";

/*
  Los mismos bloques de la demo de avantcode.mx (/demo/control), ahora con
  datos reales: estados, cajas, indicadores, gráficas, listas y tablas.
  Estilos: estilos/demo (copiados de la demo, prefijos dm- y dl-).
*/

export function fmt(v, formato) {
  if (typeof v !== "number") return v;
  if (formato === "pesos") {
    const dec = Number.isInteger(v) ? 0 : 2;
    return `$${v.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  }
  if (formato === "pct") return `${v.toLocaleString("es-MX")}%`;
  return v.toLocaleString("es-MX");
}

function fmtEje(v, formato) {
  const pre = formato === "pesos" ? "$" : "";
  if (v >= 1e6) return `${pre}${(v / 1e6).toLocaleString("es-MX", { maximumFractionDigits: 1 })}M`;
  if (v >= 1e4) return `${pre}${Math.round(v / 1e3).toLocaleString("es-MX")}K`;
  return `${pre}${v.toLocaleString("es-MX")}`;
}

function topeLimpio(max) {
  if (max <= 0) return 1;
  const pot = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pot >= max) return m * pot;
  return 10 * pot;
}

/* Estado: siempre con ícono y texto, nunca solo color. */
const ICONO_TONO = { ok: CircleCheck, aviso: TriangleAlert, alerta: CircleX, info: Clock, neutro: null };
export function Estado({ texto, tono = "neutro" }) {
  const Icono = ICONO_TONO[tono];
  return (
    <span className={`dm-estado dm-estado--${tono}`}>
      {Icono && <Icono size={13} aria-hidden="true" />}
      {texto}
    </span>
  );
}

export function Caja({ titulo, sub, acciones, children, className = "" }) {
  return (
    <section className={`dm-caja ${className}`}>
      {(titulo || acciones) && (
        <header className="dm-caja-enc">
          <div>
            {titulo && <h2>{titulo}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {acciones}
        </header>
      )}
      {children}
    </section>
  );
}

/* Bloque del lienzo: ocupa todo el ancho o la mitad (como en la demo). */
export const Bloque = ({ ancho = "completo", children }) => <div className={`dm-bloque dm-bloque--${ancho}`}>{children}</div>;

export function Kpis({ datos }) {
  return (
    <div className="dm-kpis">
      {datos.map((k) => (
        <div key={k.etiqueta} className="dm-kpi">
          <span className="dm-kpi-etq">{k.etiqueta}</span>
          <strong className="dm-kpi-valor">{k.valor}</strong>
          {k.delta && <span className={`dm-kpi-delta dm-kpi-delta--${k.tono || "neutro"}`}>{k.delta}</span>}
        </div>
      ))}
    </div>
  );
}

export function Columnas({ titulo, sub, datos, formato }) {
  const max = Math.max(0, ...datos.map((d) => d.v));
  const tope = topeLimpio(max);
  return (
    <Caja titulo={titulo} sub={sub}>
      <div className="dm-col-area">
        <div className="dm-col-eje" aria-hidden="true">
          {[tope, tope / 2, 0].map((m) => (
            <span key={m}>{fmtEje(m, formato)}</span>
          ))}
        </div>
        <div className="dm-col-barras">
          <span className="dm-guia dm-guia--tope" aria-hidden="true" />
          <span className="dm-guia dm-guia--media" aria-hidden="true" />
          {datos.map((d) => (
            <div key={d.e} className="dm-col">
              <span className="dm-col-barra" style={{ height: `${(d.v / tope) * 100}%` }} tabIndex={0} role="img" aria-label={`${d.e}: ${fmt(d.v, formato)}`}>
                <span className="dm-tip" aria-hidden="true">
                  <strong>{fmt(d.v, formato)}</strong> {d.e}
                </span>
                {d.v === max && max > 0 && (
                  <span className="dm-col-valor" aria-hidden="true">
                    {fmt(d.v, formato)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
        <span aria-hidden="true" />
        <div className="dm-col-xs" aria-hidden="true">
          {datos.map((d) => (
            <span key={d.e}>{d.e}</span>
          ))}
        </div>
      </div>
    </Caja>
  );
}

export function Barras({ titulo, sub, datos, formato }) {
  const max = Math.max(1, ...datos.map((d) => d.v));
  return (
    <Caja titulo={titulo} sub={sub}>
      <ul className="dm-barras">
        {datos.map((d) => (
          <li key={d.e}>
            <span className="dm-barras-etq">{d.e}</span>
            <span className="dm-barras-pista">
              <span className="dm-barras-barra" style={{ width: `${(d.v / max) * 100}%` }} tabIndex={0} role="img" aria-label={`${d.e}: ${fmt(d.v, formato)}`} />
            </span>
            <span className="dm-barras-valor">{fmt(d.v, formato)}</span>
          </li>
        ))}
      </ul>
    </Caja>
  );
}

export function Lista({ titulo, sub, items, vacio = "Nada por ahora.", acciones }) {
  return (
    <Caja titulo={titulo} sub={sub} acciones={acciones}>
      {items.length ? (
        <ul className="dm-lista">
          {items.map((it, i) => (
            <li key={it.clave ?? i} onClick={it.onClick} style={it.onClick ? { cursor: "pointer" } : undefined}>
              {it.hora && <span className="dm-lista-hora">{it.hora}</span>}
              <span className="dm-lista-texto">
                <strong>{it.titulo}</strong>
                {it.sub && <span>{it.sub}</span>}
              </span>
              {it.valor && <span className="dm-lista-valor">{it.valor}</span>}
              {it.estado && <Estado texto={it.estado.texto} tono={it.estado.tono} />}
              {it.extra}
            </li>
          ))}
        </ul>
      ) : (
        <p className="dm-vacio">{vacio}</p>
      )}
    </Caja>
  );
}

/*
  Tabla con búsqueda y exportación (como la de la demo), para datos reales.
  columnas: [{ clave, titulo, tipo?: "num" | "pesos", principal?, render?(fila) }]
  onExcel / onPdf: si vienen, se muestran los botones.
*/
export function Tabla({ titulo, sub, columnas, filas, buscar = true, onExcel, onPdf, exportando, vacio = "Sin resultados.", textoDe, acciones: extra }) {
  const [q, setQ] = useState("");
  const consulta = q.trim().toLowerCase();
  const visibles = consulta ? filas.filter((f) => (textoDe ? textoDe(f) : Object.values(f).join(" ")).toLowerCase().includes(consulta)) : filas;
  const acciones = (
    <div className="dm-tabla-acciones">
      {extra}
      {buscar && (
        <label className="dm-buscar">
          <Search size={15} aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label={`Buscar en ${titulo}`} />
        </label>
      )}
      {onExcel && (
        <button type="button" className="dm-btn" onClick={onExcel} disabled={exportando}>
          <FileSpreadsheet size={15} aria-hidden="true" /> Excel
        </button>
      )}
      {onPdf && (
        <button type="button" className="dm-btn" onClick={onPdf}>
          <FileText size={15} aria-hidden="true" /> PDF
        </button>
      )}
    </div>
  );
  const num = (c) => (c.tipo === "pesos" || c.tipo === "num" ? "dm-num" : "");
  return (
    <Caja titulo={titulo} sub={sub ?? `${visibles.length} ${visibles.length === 1 ? "registro" : "registros"}`} acciones={acciones}>
      <div className="dm-tabla-marco">
        <table className="dm-tabla">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.clave} scope="col" className={num(c)}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f, i) => (
              <tr key={f.clave ?? i}>
                {columnas.map((c) => (
                  <td key={c.clave} className={num(c)}>
                    {c.render ? c.render(f) : c.tipo === "pesos" ? fmt(f[c.clave], "pesos") : c.principal ? <strong>{f[c.clave]}</strong> : f[c.clave]}
                  </td>
                ))}
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="dm-vacio">
                  {vacio}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Caja>
  );
}

/* Iniciales para los avatares («Andrea Lozano» → «AL»). */
export const iniciales = (nombre = "") =>
  nombre
    .split(" ")
    .filter((p) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
