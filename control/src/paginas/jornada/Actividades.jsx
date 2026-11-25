import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { api, useSesion } from "../../sesion";
import { fechaCorta, gestionaJornada, hoyLocal } from "./comun";

/*
  Actividades (igual que en la demo): tareas que se asignan a cada persona.
  Pendiente → En progreso → En revisión → Completada. Quien administra ve
  el tablero de su equipo y asigna; cada persona ve las suyas, las avanza
  hasta «En revisión» y quien se la asignó la da por completada.
*/

export const ESTADOS = [
  { id: "pendiente", texto: "Pendiente", clase: "badge-warning" },
  { id: "en_progreso", texto: "En progreso", clase: "badge-info" },
  { id: "en_revision", texto: "En revisión", clase: "badge-neutral" },
  { id: "completada", texto: "Completada", clase: "badge-success" },
];
const PRIORIDADES = [
  { id: "baja", texto: "Baja", clase: "badge-neutral" },
  { id: "media", texto: "Media", clase: "badge-info" },
  { id: "alta", texto: "Alta", clase: "badge-warning" },
  { id: "urgente", texto: "Urgente", clase: "badge-error" },
];
const prioridad = (id) => PRIORIDADES.find((p) => p.id === id) || PRIORIDADES[1];
const SIGUIENTE = { pendiente: ["en_progreso", "Empezar"], en_progreso: ["en_revision", "Enviar a revisión"] };

function NuevaActividad({ personas, onCerrar, onCreada }) {
  const [datos, setDatos] = useState({ titulo: "", descripcion: "", id_asignado: "", prioridad: "media", fecha_limite: "" });
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cambiar = (c) => (e) => {
    setDatos((d) => ({ ...d, [c]: e.target.value }));
    setAviso("");
  };
  const guardar = async (e) => {
    e.preventDefault();
    if (datos.titulo.trim().length < 3) return setAviso("Escribe qué hay que hacer.");
    if (!datos.id_asignado) return setAviso("Elige a quién se le asigna.");
    setGuardando(true);
    try {
      const r = await api("/actividades", { metodo: "POST", datos: { ...datos, id_asignado: Number(datos.id_asignado), titulo: datos.titulo.trim() } });
      onCreada(r.actividad);
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <Modal onCerrar={onCerrar} titulo="Nueva actividad" descripcion="La persona la ve en su panel y la avanza hasta «En revisión».">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="ac-titulo">¿Qué hay que hacer?</label>
          <input id="ac-titulo" className="input-field" value={datos.titulo} onChange={cambiar("titulo")} maxLength={160} placeholder="Por ejemplo: revisar el inventario de la bodega" />
        </div>
        <div>
          <label className="label" htmlFor="ac-desc">Detalles <span className="font-normal text-tinta-3">(opcional)</span></label>
          <textarea id="ac-desc" className="input-field min-h-[80px]" value={datos.descripcion} onChange={cambiar("descripcion")} maxLength={2000} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ac-persona">Se le asigna a</label>
            <select id="ac-persona" className="input-field" value={datos.id_asignado} onChange={cambiar("id_asignado")}>
              <option value="">Elige a una persona</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ac-limite">Fecha límite <span className="font-normal text-tinta-3">(opcional)</span></label>
            <input id="ac-limite" type="date" className="input-field" min={hoyLocal()} value={datos.fecha_limite} onChange={cambiar("fecha_limite")} />
          </div>
        </div>
        <div>
          <span className="label">Prioridad</span>
          <div className="segmentado max-w-full overflow-x-auto" role="group" aria-label="Prioridad">
            {PRIORIDADES.map((p) => (
              <button key={p.id} type="button" aria-pressed={datos.prioridad === p.id} onClick={() => setDatos((d) => ({ ...d, prioridad: p.id }))}>
                {p.texto}
              </button>
            ))}
          </div>
        </div>
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? "Asignando…" : "Asignar"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Tarjeta({ a, equipo, onEstado, cambiando }) {
  const p = prioridad(a.prioridad);
  const siguiente = SIGUIENTE[a.estado];
  return (
    <article className="card !p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-tinta">{a.titulo}</p>
        <span className={`badge ${p.clase}`}>{p.texto}</span>
      </div>
      {a.descripcion && <p className="text-[13px] text-tinta-2">{a.descripcion}</p>}
      <p className="text-[12.5px] text-tinta-3">
        {equipo ? `${a.asignado?.nombre || ""}${a.asignado?.sucursal ? ` · ${a.asignado.sucursal}` : ""}` : `Te la asignó ${a.creada_por || "tu empresa"}`}
      </p>
      {a.fecha_limite && (
        <p className={`flex items-center gap-1.5 text-[12.5px] ${a.vencida ? "font-semibold text-amber-700" : "text-tinta-3"}`}>
          <CalendarClock className="h-3.5 w-3.5" /> {a.vencida ? "Venció" : "Para"} el {fechaCorta(a.fecha_limite)}
        </p>
      )}
      {equipo ? (
        <select className="input-field !py-1.5 text-sm" value={a.estado} disabled={cambiando} onChange={(e) => onEstado(a, e.target.value)} aria-label={`Estado de ${a.titulo}`}>
          {ESTADOS.map((e) => (
            <option key={e.id} value={e.id}>{e.texto}</option>
          ))}
        </select>
      ) : siguiente ? (
        <button type="button" className="btn-secondary btn-sm" disabled={cambiando} onClick={() => onEstado(a, siguiente[0])}>
          {siguiente[1]}
        </button>
      ) : (
        <span className={`badge ${ESTADOS.find((e) => e.id === a.estado)?.clase}`}>{a.estado === "en_revision" ? "En revisión: falta que la aprueben" : "Completada"}</span>
      )}
    </article>
  );
}

function Actividades() {
  const sesion = useSesion();
  const gestiona = gestionaJornada(sesion);
  const [vista, setVista] = useState(gestiona ? "equipo" : "mias");
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [nueva, setNueva] = useState(false);
  const [cambiando, setCambiando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/actividades${vista === "mias" ? "?vista=mias" : ""}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [vista]);

  useEffect(() => {
    setDatos(null);
    cargar();
  }, [cargar]);

  const cambiarEstado = async (a, estado) => {
    setCambiando(a.id);
    try {
      await api(`/actividades/${a.id}`, { metodo: "PATCH", datos: { estado } });
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setCambiando(null);
    }
  };

  const equipo = datos?.vista === "equipo";
  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Operación"
        titulo={equipo ? "Actividades." : "Mis actividades."}
        apagado={equipo ? "Lo que hace tu equipo." : "Lo que te toca."}
        acciones={
          gestiona && (
            <>
              <div className="segmentado" role="group" aria-label="Vista">
                {[
                  ["equipo", "Del equipo"],
                  ["mias", "Mías"],
                ].map(([v, t]) => (
                  <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}>
                    {t}
                  </button>
                ))}
              </div>
              {equipo && (
                <button type="button" className="btn-primary btn-sm" onClick={() => setNueva(true)}>
                  <Plus className="h-4 w-4" /> Nueva actividad
                </button>
              )}
            </>
          )
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}
      {!datos ? (
        <p className="text-sm text-tinta-3">Cargando…</p>
      ) : datos.actividades.length === 0 ? (
        <div className="card vacio">
          <p className="font-semibold text-tinta">{equipo ? "Aún no asignas actividades" : "No tienes actividades pendientes"}</p>
          <p className="max-w-md text-sm">{equipo ? "Asigna una tarea a alguien de tu equipo: la ve en su panel y te avisa cuando la termina." : "Cuando te asignen una, aparece aquí."}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ESTADOS.map((e) => {
            const lista = datos.actividades.filter((a) => a.estado === e.id);
            return (
              <section key={e.id} className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-tinta">
                  {e.texto} <span className="badge badge-neutral">{lista.length}</span>
                </h2>
                {lista.map((a) => (
                  <Tarjeta key={a.id} a={a} equipo={equipo} onEstado={cambiarEstado} cambiando={cambiando === a.id} />
                ))}
              </section>
            );
          })}
        </div>
      )}
      {nueva && (
        <NuevaActividad
          personas={datos?.personas || []}
          onCerrar={() => setNueva(false)}
          onCreada={() => {
            setNueva(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

export default Actividades;
