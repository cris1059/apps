import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import { api } from "../../sesion";
import { fechaLarga } from "./comun";

/*
  Calendario (igual que en la demo): los días de descanso obligatorio del
  año según la LFT (art. 74), quién trabajó en los que ya pasaron y a quién
  le toca según su horario en los que vienen. Quien trabaja uno recibe,
  además de su salario, un salario doble (art. 75): se suma en Horas extra
  y costos.
*/

const nombres = (lista) => {
  const n = lista.slice(0, 4).map((p) => p.nombre).join(", ");
  return lista.length > 4 ? `${n} y ${lista.length - 4} más` : n;
};

function Calendario() {
  const actual = new Date().getFullYear();
  const [anio, setAnio] = useState(actual);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    setDatos(null);
    api(`/jornada/calendario?anio=${anio}`)
      .then((d) => vivo && (setDatos(d), setError("")))
      .catch((e) => vivo && setError(e.message));
    return () => {
      vivo = false;
    };
  }, [anio]);

  const siguiente = datos?.dias.find((d) => d.estado !== "pasado");
  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Operación"
        titulo="Calendario."
        apagado={`Descansos obligatorios ${anio}.`}
        sub={datos?.fundamento}
        acciones={
          <div className="segmentado" role="group" aria-label="Año">
            {[actual - 1, actual, actual + 1].map((a) => (
              <button key={a} type="button" aria-pressed={anio === a} onClick={() => setAnio(a)}>
                {a}
              </button>
            ))}
          </div>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}

      {siguiente && (
        <section className="card flex items-start gap-4">
          <span className="app-icono app-icono-tinta">
            <CalendarDays />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-tinta-3">{siguiente.estado === "hoy" ? "Hoy es descanso obligatorio" : "El siguiente descanso obligatorio"}</p>
            <p className="font-semibold text-tinta">
              {siguiente.nombre} · <span className="capitalize">{fechaLarga(siguiente.fecha)}</span>
            </p>
            <p className="mt-1 text-sm text-tinta-3">
              {siguiente.programados.length
                ? `${siguiente.programados.length} ${siguiente.programados.length === 1 ? "persona le toca" : "personas les toca"} trabajar según su horario (${nombres(siguiente.programados)}): si trabajan, se les paga salario doble además del suyo.`
                : "Según los horarios, nadie trabaja ese día."}
            </p>
          </div>
        </section>
      )}

      <section className="card">
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : (
          <ol className="jr-linea">
            {datos.dias.map((d) => (
              <li key={d.fecha}>
                <b className="!min-w-[92px] capitalize">{new Date(`${d.fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}</b>
                <span>
                  {d.nombre}
                  <small>
                    {d.fundamento}
                    {d.estado === "pasado" && (d.trabajaron.length ? ` · trabajaron: ${nombres(d.trabajaron)}` : "")}
                    {d.estado !== "pasado" && d.programados.length ? ` · les toca según su horario: ${nombres(d.programados)}` : ""}
                  </small>
                </span>
                {d.estado === "pasado" ? (
                  <span className={`badge ${d.trabajaron.length ? "badge-warning" : "badge-neutral"}`}>
                    {d.trabajaron.length ? `${d.trabajaron.length} ${d.trabajaron.length === 1 ? "trabajó" : "trabajaron"} · pago doble` : "Nadie trabajó"}
                  </span>
                ) : d.estado === "hoy" ? (
                  <span className="badge badge-info">Hoy</span>
                ) : (
                  <span className="badge badge-neutral">{d.programados.length ? `${d.programados.length} programados` : "Próximo"}</span>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-[13px] text-tinta-3">
          Las elecciones locales de tu estado también son descanso obligatorio (LFT art. 74, fracc. IX): cuando se publiquen, avísanos y las agregamos.
        </p>
      </section>
    </div>
  );
}

export default Calendario;
