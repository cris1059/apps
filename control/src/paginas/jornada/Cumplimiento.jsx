import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import { api } from "../../sesion";
import { fechaCorta } from "./comun";

/*
  Cumplimiento (igual que en la demo): la revisión de las últimas dos
  semanas (salidas sin registrar, correcciones pendientes, horas extra
  sobre el límite legal, horarios, geocercas, aviso de ubicación,
  calendario y bitácora), las políticas que aplica tu empresa y la tabla
  de la reforma 2026–2030.
*/

function Cumplimiento() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    api("/jornada/cumplimiento")
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message));
    return () => {
      vivo = false;
    };
  }, []);

  const anio = new Date().getFullYear();
  const porcentaje = datos ? Math.round((datos.completos / datos.total) * 100) : 0;
  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Nómina y ley"
        titulo="Cumplimiento."
        apagado="Revisión de tu registro de jornada."
        sub={datos ? `Del ${fechaCorta(datos.desde)} a hoy. Se actualiza cada vez que entras.` : undefined}
      />
      {error && <p className="ctl-aviso">{error}</p>}
      {!datos && !error && <p className="text-sm text-tinta-3">Revisando…</p>}

      {datos && (
        <>
          <section className="card">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[13px] text-tinta-3">Puntos en orden</p>
                <p className="text-[28px] font-semibold leading-none tracking-tight text-tinta tabular-nums">
                  {datos.completos} de {datos.total}
                </p>
              </div>
              <span className={`badge ${datos.completos === datos.total ? "badge-success" : "badge-warning"}`}>
                {datos.completos === datos.total ? "Todo en orden" : `${datos.total - datos.completos} por atender`}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Avance">
              <div className="h-full rounded-full bg-lima" style={{ width: `${porcentaje}%` }} />
            </div>
            <ul className="jr-linea">
              {datos.revision.map((r) => (
                <li key={r.id}>
                  {r.ok ? <CircleCheck className="h-5 w-5 text-green-600" aria-hidden="true" /> : <CircleAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />}
                  <span>
                    {r.titulo}
                    <small>{r.detalle}</small>
                  </span>
                  <span className={`badge ${r.ok ? "badge-success" : "badge-warning"}`}>{r.ok ? "Listo" : "Por atender"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2 className="card-titulo">Políticas de tu empresa</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {datos.politicas.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[13px] text-tinta-3">{k}</dt>
                  <dd className="text-sm text-tinta">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card">
            <h2 className="card-titulo">La reforma, año por año</h2>
            <p className="mt-1 text-sm text-tinta-3">Horas por semana según el decreto del 1 de mayo de 2026. Control aplica la del año de cada semana.</p>
            <div className="tabla-contenedor mt-3">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th className="text-right">Jornada ordinaria</th>
                    <th className="text-right">Extra al doble</th>
                    <th className="text-right">Extra al triple</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.tabla.map((r) => (
                    <tr key={r.anio} className={r.anio === anio ? "ley-actual" : ""}>
                      <td>{r.anio}{r.anio === anio ? " · este año" : ""}</td>
                      <td className="text-right tabular-nums">{r.ordinarias} h</td>
                      <td className="text-right tabular-nums">hasta {r.dobles} h</td>
                      <td className="text-right tabular-nums">hasta {r.triples} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Cumplimiento;
