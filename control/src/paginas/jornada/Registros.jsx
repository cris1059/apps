import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import VerUbicacion from "../../componentes/VerUbicacion";
import { api } from "../../sesion";
import { ESTADOS_MARCAJE, TIPOS, fechaCorta, hoyLocal, lugarDe, sumarDias } from "./comun";

/*
  Registros: cada entrada, descanso y salida del equipo con su hora, su lugar,
  la distancia a su geocerca y la ubicación guardada (se abre en el mapa).
  Nada se edita aquí: los errores se arreglan con una corrección.
*/
function Registros() {
  const [filtros, setFiltros] = useState({ desde: sumarDias(hoyLocal(), -6), hasta: hoyLocal(), persona: "", estado: "" });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [ver, setVer] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
      setDatos(await api(`/jornada/registros?${q}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (c) => (e) => setFiltros((f) => ({ ...f, [c]: e.target.value }));

  return (
    <div className="pagina">
      <Encabezado etiqueta="Operación" titulo="Entradas y salidas." apagado="Cada marcaje, con su ubicación." />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="rg-desde">Desde</label>
          <input id="rg-desde" type="date" className="input-field" value={filtros.desde} max={filtros.hasta} onChange={cambiar("desde")} />
        </div>
        <div>
          <label className="label" htmlFor="rg-hasta">Hasta</label>
          <input id="rg-hasta" type="date" className="input-field" value={filtros.hasta} max={hoyLocal()} onChange={cambiar("hasta")} />
        </div>
        <div>
          <label className="label" htmlFor="rg-persona">Persona</label>
          <select id="rg-persona" className="input-field" value={filtros.persona} onChange={cambiar("persona")}>
            <option value="">Todas</option>
            {datos?.personas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="rg-estado">Ubicación</label>
          <select id="rg-estado" className="input-field" value={filtros.estado} onChange={cambiar("estado")}>
            <option value="">Todas</option>
            <option value="validado">En su zona</option>
            <option value="fuera_de_zona">Fuera de zona</option>
            <option value="registrado">Sin geocerca</option>
            <option value="corregido">Corregidos</option>
          </select>
        </div>
      </section>

      <section className="card">
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : datos.registros.length === 0 ? (
          <div className="vacio">
            <p className="font-semibold text-tinta">Sin registros con estos filtros</p>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Persona</th>
                  <th>Registro</th>
                  <th>Lugar</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {datos.registros.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">
                      <span className="capitalize">{fechaCorta(m.fecha_local)}</span> · <span className="tabular-nums">{m.hora_local}</span>
                    </td>
                    <td>{m.persona}</td>
                    <td>
                      {TIPOS[m.tipo].texto}
                      {m.metodo === "correccion" && <span className="badge badge-info ml-1">Corrección</span>}
                    </td>
                    <td>
                      {lugarDe(m) || "—"}
                      {m.distancia != null && <span className="text-tinta-3"> · a {m.distancia} m</span>}
                    </td>
                    <td>
                      <span className={`badge ${ESTADOS_MARCAJE[m.estado]?.clase || "badge-neutral"}`}>{ESTADOS_MARCAJE[m.estado]?.texto || m.estado}</span>
                      {m.latitud != null && (
                        <button type="button" className="ml-2 inline-flex items-center gap-1 text-[13px] font-medium text-tinta-2 underline-offset-2 hover:underline" onClick={() => setVer(m)}>
                          <MapPin className="h-3.5 w-3.5" /> Ver ubicación
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {ver && <VerUbicacion marcaje={ver} persona={ver.persona} onCerrar={() => setVer(null)} />}
    </div>
  );
}

export default Registros;
