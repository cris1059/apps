import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Crosshair, MapPin, Pencil, Plus } from "lucide-react";
import Modal from "../../componentes/Modal";
import Mapa from "../../componentes/Mapa";
import { administra, api, useSesion } from "../../sesion";
import { enlaceMapa, esComputadora, textoPrecision, ubicacionActual } from "./comun";

/*
  Sucursales u oficinas con su geocerca: el punto (latitud y longitud) y el
  radio en metros dentro del cual cuenta un marcaje. El punto se elige
  tocando el mapa, con «Usar mi ubicación actual» (desde el lugar) o
  escribiendo las coordenadas. El plan limita cuántas puede haber activas.
  Vive dentro de «Ubicación y geocercas».
*/

const NOMBRES_ZONA = {
  "America/Mexico_City": "Centro (CDMX, Guadalajara)",
  "America/Monterrey": "Monterrey",
  "America/Merida": "Mérida",
  "America/Cancun": "Quintana Roo",
  "America/Chihuahua": "Chihuahua",
  "America/Ciudad_Juarez": "Ciudad Juárez",
  "America/Mazatlan": "Pacífico (Sinaloa, Nayarit, BCS)",
  "America/Hermosillo": "Sonora",
  "America/Tijuana": "Baja California",
  "America/Matamoros": "Matamoros",
};

function FormSucursal({ sucursal, zonas, onCerrar, onGuardada }) {
  const [datos, setDatos] = useState({
    nombre: sucursal?.nombre || "",
    direccion: sucursal?.direccion || "",
    latitud: sucursal?.latitud ?? "",
    longitud: sucursal?.longitud ?? "",
    radio_metros: sucursal?.radio_metros || 150,
    zona_horaria: sucursal?.zona_horaria || "America/Mexico_City",
  });
  const [aviso, setAviso] = useState("");
  const [ubicando, setUbicando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enfoque, setEnfoque] = useState(0);
  const cambiar = (c) => (e) => {
    setDatos((d) => ({ ...d, [c]: e.target.value }));
    setAviso("");
    if (c === "latitud" || c === "longitud") setEnfoque((n) => n + 1);
  };
  const lat = Number(datos.latitud);
  const lng = Number(datos.longitud);
  const conPuntoValido = datos.latitud !== "" && datos.longitud !== "" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const geocerca = useMemo(
    () => (conPuntoValido ? [{ id: "nueva", lat, lng, radio: Number(datos.radio_metros) || 150, tipo: "nueva" }] : []),
    [conPuntoValido, lat, lng, datos.radio_metros]
  );
  const elegir = useCallback((la, ln) => {
    setDatos((d) => ({ ...d, latitud: la.toFixed(7), longitud: ln.toFixed(7) }));
    setAviso("");
  }, []);

  const usarUbicacion = async () => {
    setUbicando(true);
    setAviso("");
    try {
      const u = await ubicacionActual({ objetivo: 20, despuesDeLaPrimera: 6000 });
      // Una ubicación aproximada no sirve para la geocerca: dejaría a todos «fuera de zona».
      if (u.precision > 300) {
        setAviso(
          `Tu ubicación es aproximada (${textoPrecision(u.precision)}): no sirve para la geocerca. ${
            esComputadora() ? "Una computadora no tiene GPS. " : ""
          }Toca el mapa en la entrada del lugar, o hazlo desde el celular estando en la sucursal.`
        );
        return;
      }
      setDatos((d) => ({ ...d, latitud: u.latitud.toFixed(7), longitud: u.longitud.toFixed(7) }));
      setEnfoque((n) => n + 1);
      if (u.precision > 60) setAviso(`Tu ubicación tiene una precisión de ${textoPrecision(u.precision)}. Revisa el punto en el mapa: si no está en la entrada, tócalo donde va.`);
    } catch (e) {
      setAviso(e.message);
    } finally {
      setUbicando(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (datos.nombre.trim().length < 2) return setAviso("Escribe el nombre de la sucursal u oficina.");
    const conPunto = datos.latitud !== "" && datos.longitud !== "";
    if ((datos.latitud === "") !== (datos.longitud === "")) return setAviso("Escribe la latitud y la longitud, o deja las dos vacías.");
    setGuardando(true);
    try {
      const cuerpo = {
        nombre: datos.nombre.trim(),
        direccion: datos.direccion.trim(),
        latitud: conPunto ? Number(datos.latitud) : null,
        longitud: conPunto ? Number(datos.longitud) : null,
        radio_metros: Number(datos.radio_metros),
        zona_horaria: datos.zona_horaria,
      };
      await api(sucursal ? `/sucursales/${sucursal.id}` : "/sucursales", { metodo: sucursal ? "PATCH" : "POST", datos: cuerpo });
      onGuardada();
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo={sucursal ? "Editar sucursal u oficina" : "Nueva sucursal u oficina"} descripcion="El punto y el radio forman la geocerca: ahí cuenta cada marcaje." ancho="sm:max-w-xl">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="su-nombre">Nombre</label>
            <input id="su-nombre" className="input-field" value={datos.nombre} onChange={cambiar("nombre")} maxLength={80} placeholder="Matriz" />
          </div>
          <div>
            <label className="label" htmlFor="su-zona">Zona horaria</label>
            <select id="su-zona" className="input-field" value={datos.zona_horaria} onChange={cambiar("zona_horaria")}>
              {zonas.map((z) => (
                <option key={z} value={z}>{NOMBRES_ZONA[z] || z}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="su-dir">Dirección <span className="font-normal text-tinta-3">(opcional)</span></label>
          <input id="su-dir" className="input-field" value={datos.direccion} onChange={cambiar("direccion")} maxLength={255} />
        </div>
        <div className="superficie space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-tinta">Geocerca</p>
            <button type="button" className="btn-secondary btn-sm" onClick={usarUbicacion} disabled={ubicando}>
              <Crosshair className="h-4 w-4" /> {ubicando ? "Ubicando…" : "Usar mi ubicación actual"}
            </button>
          </div>
          <Mapa zonas={geocerca} onElegir={elegir} enfoque={enfoque} alto={260} etiqueta="Toca el mapa para elegir el punto de la geocerca" />
          <p className="text-[12.5px] text-tinta-3">Toca el mapa en la entrada del lugar: el círculo es la geocerca.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="su-lat">Latitud</label>
              <input id="su-lat" className="input-field tabular-nums" inputMode="decimal" value={datos.latitud} onChange={cambiar("latitud")} placeholder="19.4326" />
            </div>
            <div>
              <label className="label" htmlFor="su-lng">Longitud</label>
              <input id="su-lng" className="input-field tabular-nums" inputMode="decimal" value={datos.longitud} onChange={cambiar("longitud")} placeholder="-99.1332" />
            </div>
            <div>
              <label className="label" htmlFor="su-radio">Radio</label>
              <select id="su-radio" className="input-field" value={datos.radio_metros} onChange={cambiar("radio_metros")}>
                {[50, 100, 150, 200, 300, 500, 1000].map((m) => (
                  <option key={m} value={m}>{m} m</option>
                ))}
              </select>
            </div>
          </div>
          {datos.latitud !== "" && datos.longitud !== "" && (
            <a className="inline-flex items-center gap-1 text-[13px] font-medium text-tinta-3 hover:text-tinta" href={enlaceMapa(datos.latitud, datos.longitud)} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-3.5 w-3.5" /> Revisar el punto en el mapa
            </a>
          )}
          <p className="text-[12.5px] text-tinta-3">Sin punto, los marcajes se guardan con su ubicación pero no se valida la geocerca.</p>
        </div>
        {aviso && <p className="ctl-aviso ctl-aviso--suave">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Sucursales({ onCambio }) {
  const sesion = useSesion();
  const edita = administra(sesion);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // {} nueva | sucursal
  const avisar = useRef(onCambio);
  avisar.current = onCambio;

  const cargar = useCallback(async (cambio = false) => {
    try {
      setDatos(await api("/sucursales"));
      setError("");
      if (cambio) avisar.current?.();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternar = async (s) => {
    try {
      await api(`/sucursales/${s.id}/activa`, { metodo: "POST", datos: { activa: !s.activa } });
      cargar(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const lleno = datos && datos.uso.usadas >= datos.uso.limite;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="card-titulo">Sucursales u oficinas y su geocerca</h2>
          {datos && (
            <p className="mt-1 text-sm text-tinta-3">
              {datos.uso.usadas} de {datos.uso.limite} {datos.uso.limite === 1 ? "sucursal u oficina" : "sucursales u oficinas"} en tu plan
              {lleno && edita ? " · para agregar más, pídelas desde Suscripción." : ""}
            </p>
          )}
        </div>
        {edita && (
          <button type="button" className="btn-primary btn-sm" onClick={() => setForm({})} disabled={!datos || lleno}>
            <Plus className="h-4 w-4" /> Nueva sucursal
          </button>
        )}
      </div>
      {error && <p className="ctl-aviso">{error}</p>}

      {!datos ? (
        <p className="text-sm text-tinta-3">Cargando…</p>
      ) : datos.sucursales.length === 0 ? (
        <div className="card vacio">
          <span className="app-icono app-icono-claro">
            <Building2 />
          </span>
          <p className="font-semibold text-tinta">Agrega tu primera sucursal u oficina</p>
          <p className="max-w-md text-sm">Si estás en el lugar, toca «Usar mi ubicación actual» y listo: la geocerca queda con ese punto.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {datos.sucursales.map((s) => (
            <article key={s.id} className={`card space-y-2 ${s.activa ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-tinta">{s.nombre}</p>
                  {s.direccion && <p className="truncate text-[13px] text-tinta-3">{s.direccion}</p>}
                </div>
                <span className={`badge ${s.activa ? (s.latitud != null ? "badge-success" : "badge-warning") : "badge-neutral"}`}>
                  {s.activa ? (s.latitud != null ? `Geocerca de ${s.radio_metros} m` : "Sin geocerca") : "Desactivada"}
                </span>
              </div>
              <p className="text-[13px] text-tinta-3">
                {s.personas} {s.personas === 1 ? "persona asignada" : "personas asignadas"} · {NOMBRES_ZONA[s.zona_horaria] || s.zona_horaria}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {edita && (
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setForm(s)}>
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                )}
                {s.latitud != null && (
                  <a className="btn-ghost btn-sm" href={enlaceMapa(s.latitud, s.longitud)} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" /> Abrir en Google Maps
                  </a>
                )}
                {edita && (
                  <button type="button" className="btn-ghost btn-sm" onClick={() => alternar(s)}>
                    {s.activa ? "Desactivar" : "Activar"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <FormSucursal
          sucursal={form.id ? form : null}
          zonas={datos.zonas}
          onCerrar={() => setForm(null)}
          onGuardada={() => {
            setForm(null);
            cargar(true);
          }}
        />
      )}
    </section>
  );
}

export default Sucursales;
