import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilePenLine } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { api } from "../../sesion";
import { ESTADOS_MARCAJE, TIPOS, duracion, fechaCorta, hoyLocal, lugarDe, sumarDias } from "./comun";

/*
  Mis registros: las jornadas de la persona (entradas, descansos y salidas
  con su lugar) y las correcciones que ha pedido. Si olvidó marcar o marcó
  mal, pide una corrección; la aprueba o rechaza su administrador.
*/

const ESTADO_CORRECCION = {
  pendiente: { texto: "Por revisar", clase: "badge-warning" },
  aprobada: { texto: "Aprobada", clase: "badge-success" },
  rechazada: { texto: "Rechazada", clase: "badge-error" },
};

export function PedirCorreccion({ inicial, onCerrar, onEnviada }) {
  const [datos, setDatos] = useState({ tipo: inicial?.tipo || "entrada", fecha: inicial?.fecha || hoyLocal(), hora: inicial?.hora || "", motivo: "" });
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const cambiar = (c) => (e) => {
    setDatos((d) => ({ ...d, [c]: e.target.value }));
    setAviso("");
  };
  const enviar = async (e) => {
    e.preventDefault();
    if (!/^\d{2}:\d{2}$/.test(datos.hora)) return setAviso("Escribe la hora correcta.");
    if (datos.motivo.trim().length < 5) return setAviso("Explica en pocas palabras qué pasó.");
    setEnviando(true);
    try {
      await api("/jornada/correcciones", { metodo: "POST", datos: { ...datos, motivo: datos.motivo.trim(), id_marcaje_original: inicial?.id || null } });
      onEnviada();
    } catch (error) {
      setAviso(error.message);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <Modal
      onCerrar={onCerrar}
      titulo={inicial?.id ? "Corregir este registro" : "Pedir una corrección"}
      descripcion="Tu administrador la revisa. Si la aprueba, el registro queda con la hora correcta y el original se conserva."
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="co-tipo">Registro</label>
            <select id="co-tipo" className="input-field" value={datos.tipo} onChange={cambiar("tipo")}>
              {Object.entries(TIPOS).map(([v, t]) => (
                <option key={v} value={v}>{t.texto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="co-fecha">Fecha</label>
            <input id="co-fecha" type="date" className="input-field" value={datos.fecha} max={hoyLocal()} min={sumarDias(hoyLocal(), -31)} onChange={cambiar("fecha")} />
          </div>
          <div>
            <label className="label" htmlFor="co-hora">Hora correcta</label>
            <input id="co-hora" type="time" className="input-field" value={datos.hora} onChange={cambiar("hora")} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="co-motivo">¿Qué pasó?</label>
          <textarea id="co-motivo" className="input-field min-h-[90px]" maxLength={500} value={datos.motivo} onChange={cambiar("motivo")} placeholder="Ej. Llegué a las 8:58 pero no tenía señal para marcar." />
        </div>
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? "Enviando…" : "Enviar"}</button>
        </div>
      </form>
    </Modal>
  );
}

function MisRegistros() {
  const [params, setParams] = useSearchParams();
  const [rango, setRango] = useState({ desde: sumarDias(hoyLocal(), -13), hasta: hoyLocal() });
  const [datos, setDatos] = useState(null);
  const [correcciones, setCorrecciones] = useState([]);
  const [error, setError] = useState("");
  const [corregir, setCorregir] = useState(params.get("corregir") === "1" ? {} : null);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([api(`/jornada/mis-registros?desde=${rango.desde}&hasta=${rango.hasta}`), api("/jornada/correcciones/mias")]);
      setDatos(r);
      setCorrecciones(c.correcciones);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarCorreccion = () => {
    setCorregir(null);
    if (params.get("corregir")) setParams({}, { replace: true });
  };

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Registro de jornada"
        titulo="Mis registros."
        apagado="Tus entradas, descansos y salidas."
        acciones={
          <button type="button" className="btn-primary btn-sm" onClick={() => setCorregir({})}>
            <FilePenLine className="h-4 w-4" /> Pedir una corrección
          </button>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}
      {aviso && <p className="ctl-ok" role="status">{aviso}</p>}

      <section className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="mr-desde">Desde</label>
          <input id="mr-desde" type="date" className="input-field" value={rango.desde} max={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="mr-hasta">Hasta</label>
          <input id="mr-hasta" type="date" className="input-field" value={rango.hasta} max={hoyLocal()} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} />
        </div>
        {datos && (
          <p className="pb-2 text-sm text-tinta-3">
            {datos.jornadas.length} {datos.jornadas.length === 1 ? "jornada" : "jornadas"} · {duracion(datos.jornadas.reduce((s, j) => s + j.resumen.minutosTrabajados, 0))} trabajadas
          </p>
        )}
      </section>

      {correcciones.length > 0 && (
        <section className="card">
          <h2 className="card-titulo mb-3">Mis correcciones</h2>
          <ul className="divide-y divide-black/5">
            {correcciones.slice(0, 8).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="font-medium text-tinta">{TIPOS[c.tipo].texto} · {fechaCorta(c.fecha_local)} {c.hora_local}</span>
                <span className="min-w-0 flex-1 truncate text-tinta-3">{c.motivo}</span>
                <span className={`badge ${ESTADO_CORRECCION[c.estado].clase}`}>{ESTADO_CORRECCION[c.estado].texto}</span>
                {c.comentario && <span className="w-full text-[13px] text-tinta-3">Respuesta: {c.comentario}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : datos.jornadas.length === 0 ? (
          <div className="card vacio">
            <p className="font-semibold text-tinta">Sin registros en estas fechas</p>
          </div>
        ) : (
          datos.jornadas.map((j) => (
            <article key={`${j.fecha}-${j.marcajes[0].id}`} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold capitalize text-tinta">{fechaCorta(j.fecha)}</h3>
                <span className="text-sm text-tinta-3">
                  {j.marcajes[0].hora_local}
                  {j.resumen.salida ? ` a ${j.marcajes.at(-1).hora_local}` : ""} · {duracion(j.resumen.minutosTrabajados)}
                  {j.resumen.minutosDescanso ? ` · descanso ${duracion(j.resumen.minutosDescanso)}` : ""}
                </span>
                {j.abierta && <span className="badge badge-info">En curso</span>}
                {j.sin_salida && <span className="badge badge-warning">Sin salida</span>}
                {j.resumen.fueraDeZona && <span className="badge badge-warning">Fuera de zona</span>}
              </div>
              <ol className="jr-linea">
                {j.marcajes.map((m) => (
                  <li key={m.id}>
                    <b>{m.hora_local}</b>
                    <span>
                      {TIPOS[m.tipo].texto}
                      <small>
                        {lugarDe(m)}
                        {m.distancia != null ? ` · a ${m.distancia} m` : ""}
                      </small>
                    </span>
                    <span className={`badge ${ESTADOS_MARCAJE[m.estado]?.clase || "badge-neutral"}`}>{ESTADOS_MARCAJE[m.estado]?.texto || m.estado}</span>
                    {m.metodo !== "correccion" && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setCorregir({ id: m.id, tipo: m.tipo, fecha: m.fecha_local, hora: m.hora_local })}
                      >
                        Corregir
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))
        )}
      </section>

      {corregir && (
        <PedirCorreccion
          inicial={corregir}
          onCerrar={cerrarCorreccion}
          onEnviada={() => {
            cerrarCorreccion();
            setAviso("Enviamos tu corrección. Tu administrador la revisa y te avisamos aquí.");
            cargar();
          }}
        />
      )}
    </div>
  );
}

export default MisRegistros;
