import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MapPinned, Settings2 } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Cifra from "../../componentes/Cifra";
import Mapa from "../../componentes/Mapa";
import VerUbicacion from "../../componentes/VerUbicacion";
import { useMiUbicacion } from "../../componentes/MiUbicacion";
import { api } from "../../sesion";
import { MODALIDADES, TIPOS, duracion, esComputadora, fechaLarga, hoyLocal, lugarDe } from "./comun";

/*
  Tu equipo hoy (en el Inicio de quien administra, como en la demo): quién
  está trabajando, en descanso, ya salió o aún no llega, con su hora de
  entrada, retardos y marcajes fuera de su zona. Se actualiza solo cada
  minuto. Un supervisor ve solo su sucursal.
*/

const ESTADOS = {
  trabajando: { texto: "Trabajando", clase: "badge-success" },
  descanso: { texto: "En descanso", clase: "badge-info" },
  salio: { texto: "Salió", clase: "badge-neutral" },
  sin_entrada: { texto: "Sin entrada", clase: "badge-warning" },
  sin_salida: { texto: "Sin salida", clase: "badge-warning" },
  descansa: { texto: "Descansa hoy", clase: "badge-neutral" },
};

/* En el Inicio: el mapa con dónde marcó cada persona ese día y la geocerca de cada lugar. */
const TONO = { validado: "ok", fuera_de_zona: "aviso" };
function MapaDelDia({ fecha }) {
  const [datos, setDatos] = useState(null);
  // Quien administra también se ve en el mapa (punto azul): al entrar se le pide su ubicación.
  const { pos: yo, estado: miEstado } = useMiUbicacion(!esComputadora());
  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/jornada/mapa?fecha=${fecha}`));
    } catch {
      setDatos({ sucursales: [], casas: [], marcajes: [] });
    }
  }, [fecha]);
  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && fecha === hoyLocal() && cargar(), 60000);
    return () => clearInterval(t);
  }, [cargar, fecha]);
  const zonas = useMemo(
    () =>
      datos
        ? [
            ...datos.sucursales.filter((s) => s.latitud != null).map((s) => ({ id: `s${s.id}`, lat: s.latitud, lng: s.longitud, radio: s.radio, nombre: `${s.nombre} · ${s.radio} m`, tipo: "sucursal" })),
            ...datos.casas.map((c) => ({ id: `c${c.id}`, lat: c.latitud, lng: c.longitud, radio: c.radio, nombre: `Home office · ${c.persona}`, tipo: "casa" })),
          ]
        : [],
    [datos]
  );
  const puntos = useMemo(
    () => [
      ...(datos?.marcajes || []).map((m) => ({
        id: m.id,
        lat: m.latitud,
        lng: m.longitud,
        tono: TONO[m.estado] || "neutro",
        titulo: `${m.persona} · ${TIPOS[m.tipo].texto} ${m.hora_local}`,
        detalle: [lugarDe(m), m.distancia != null ? `a ${m.distancia} m` : null].filter(Boolean).join(" · "),
      })),
      ...(yo ? [{ id: "yo", lat: yo.lat, lng: yo.lng, tono: "yo", titulo: "Tú estás aquí", detalle: `Precisión ±${yo.precision} m` }] : []),
    ],
    [datos, yo]
  );
  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-titulo">
          <MapPinned className="h-5 w-5 text-tinta-3" /> Dónde marcó tu equipo
        </h2>
        <Link to="/panel/ubicacion" className="text-sm font-medium text-tinta-3 underline-offset-2 hover:text-tinta hover:underline">
          Ubicación y geocercas
        </Link>
      </div>
      <Mapa zonas={zonas} puntos={puntos} alto={340} etiqueta="Mapa de los marcajes del día" />
      <p className="mt-2 text-[12.5px] text-tinta-3">
        {datos ? (datos.marcajes.length ? `${datos.marcajes.length} ${datos.marcajes.length === 1 ? "registro" : "registros"} con ubicación · toca un punto para ver quién y a qué hora` : "Aún no hay registros con ubicación este día.") : "Cargando…"}
        {yo ? " · el punto azul eres tú (solo lo ves tú)" : miEstado === "denegado" ? " · permite tu ubicación en el navegador para verte en el mapa" : ""}
      </p>
    </section>
  );
}

function Equipo({ embebido = false }) {
  const [fecha, setFecha] = useState(hoyLocal());
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [ver, setVer] = useState(null); // { marcaje, persona }

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/jornada/equipo?fecha=${fecha}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && fecha === hoyLocal() && cargar(), 60000);
    return () => clearInterval(t);
  }, [cargar, fecha]);

  const lista = useMemo(() => {
    if (!datos) return [];
    if (filtro === "retardo") return datos.personas.filter((p) => p.retardo > 0);
    if (filtro === "fuera") return datos.personas.filter((p) => p.fuera_de_zona);
    if (filtro === "todos") return datos.personas;
    return datos.personas.filter((p) => p.estado === filtro);
  }, [datos, filtro]);

  const r = datos?.resumen;
  const selectorFecha = <input type="date" className="input-field !w-auto" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value || hoyLocal())} aria-label="Fecha" />;
  return (
    <div className={embebido ? "space-y-4" : "pagina"}>
      {embebido ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="card-titulo">{fecha === hoyLocal() ? "Tu equipo hoy" : `Tu equipo el ${fechaLarga(fecha)}`}</h2>
          {selectorFecha}
        </div>
      ) : (
        <Encabezado etiqueta="AvantCode Control" titulo="Equipo." apagado={fecha === hoyLocal() ? "Cómo va hoy." : fechaLarga(fecha)} acciones={selectorFecha} />
      )}
      {error && <p className="ctl-aviso">{error}</p>}

      {r && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cifra titulo="Trabajando ahora" valor={r.trabajando} detalle={`De ${r.personas} ${r.personas === 1 ? "persona" : "personas"}`} />
          <Cifra titulo="En descanso" valor={r.descanso} />
          <Cifra titulo="Sin entrada" valor={r.sin_entrada} detalle={r.retardos ? `${r.retardos} con retardo` : "Nadie con retardo"} />
          <Cifra titulo="Fuera de su zona" valor={r.fuera_de_zona} detalle="Marcaron lejos de su lugar" />
        </div>
      )}

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="segmentado max-w-full overflow-x-auto" role="group" aria-label="Filtrar">
            {[
              ["todos", "Todos"],
              ["trabajando", "Trabajando"],
              ["descanso", "Descanso"],
              ["sin_entrada", "Sin entrada"],
              ["salio", "Salieron"],
              ["retardo", "Retardos"],
              ["fuera", "Fuera de zona"],
            ].map(([v, t]) => (
              <button key={v} type="button" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : datos.personas.length === 0 ? (
          <div className="vacio">
            <p className="font-semibold text-tinta">Nadie registra jornada todavía</p>
            <p className="max-w-md text-sm">
              Da de alta a tu equipo en <Link to="/panel/empleados" className="underline">Empleados</Link> y asígnales su sucursal y su turno.
            </p>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Estado</th>
                  <th>Entrada</th>
                  <th>Último registro</th>
                  <th className="text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="block font-medium text-tinta">{p.nombre}</span>
                      <span className="text-[12.5px] text-tinta-3">
                        {p.modalidad === "sucursal" ? p.sucursal || "Sin sucursal" : MODALIDADES[p.modalidad].corto}
                        {p.turno ? ` · ${p.turno.entrada} a ${p.turno.salida}` : " · sin turno"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].texto}</span>
                      {p.retardo > 0 && <span className="badge badge-error ml-1">Retardo {duracion(p.retardo)}</span>}
                    </td>
                    <td className="tabular-nums">{p.entrada || "—"}</td>
                    <td>
                      {p.ultima ? (
                        <>
                          <span className="tabular-nums">{p.ultima.hora}</span> · {TIPOS[p.ultima.tipo].texto}
                          {p.ultima.estado === "fuera_de_zona" && <span className="badge badge-warning ml-1">Fuera de zona</span>}
                          <span className="block text-[12.5px] text-tinta-3">
                            {lugarDe(p.ultima) || "Sin lugar"}
                            {p.ultima.distancia != null ? ` · a ${p.ultima.distancia} m` : ""}
                          </span>
                          {p.ultima.latitud != null && (
                            <button type="button" className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-medium text-tinta-2 underline-offset-2 hover:underline" onClick={() => setVer({ marcaje: p.ultima, persona: p.nombre })}>
                              <MapPin className="h-3.5 w-3.5" /> Ver ubicación
                            </button>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right tabular-nums">{p.minutos ? duracion(p.minutos) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-tinta-3">
          <Settings2 className="h-4 w-4" /> La sucursal, el turno y dónde marca cada quien se ajustan en Empleados.
        </p>
      </section>
      {embebido && <MapaDelDia fecha={fecha} />}
      {ver && <VerUbicacion marcaje={ver.marcaje} persona={ver.persona} onCerrar={() => setVer(null)} />}
    </div>
  );
}

export default Equipo;
