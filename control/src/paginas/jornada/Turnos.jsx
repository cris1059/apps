import { useCallback, useEffect, useState } from "react";
import { Clock, Pencil, Plus } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { api } from "../../sesion";
import { DIAS } from "./comun";

/*
  Horarios: los días, la hora de entrada y de salida y la tolerancia. Con
  ellos se calculan los retardos y el tiempo extra. Un horario que cruza la
  medianoche (22:00 a 06:00) se registra igual. Se asignan en Personas.
*/

const ORDEN = [1, 2, 3, 4, 5, 6, 0];

function FormTurno({ turno, onCerrar, onGuardado }) {
  const [datos, setDatos] = useState({
    nombre: turno?.nombre || "",
    dias: turno?.dias || [1, 2, 3, 4, 5],
    hora_entrada: turno?.hora_entrada || "09:00",
    hora_salida: turno?.hora_salida || "18:00",
    tolerancia_minutos: turno?.tolerancia_minutos ?? 10,
  });
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const alternarDia = (d) => setDatos((x) => ({ ...x, dias: x.dias.includes(d) ? x.dias.filter((y) => y !== d) : [...x.dias, d] }));

  const guardar = async (e) => {
    e.preventDefault();
    if (datos.nombre.trim().length < 2) return setAviso("Ponle un nombre, por ejemplo «Matutino».");
    if (!datos.dias.length) return setAviso("Elige al menos un día.");
    setGuardando(true);
    try {
      await api(turno ? `/turnos/${turno.id}` : "/turnos", {
        metodo: turno ? "PATCH" : "POST",
        datos: { ...datos, nombre: datos.nombre.trim(), tolerancia_minutos: Number(datos.tolerancia_minutos) },
      });
      onGuardado();
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo={turno ? "Editar turno" : "Nuevo turno"} descripcion="El cambio aplica desde hoy.">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="tu-nombre">Nombre</label>
          <input id="tu-nombre" className="input-field" value={datos.nombre} maxLength={60} onChange={(e) => setDatos((x) => ({ ...x, nombre: e.target.value }))} placeholder="Matutino" />
        </div>
        <fieldset>
          <legend className="label">Días que se trabaja</legend>
          <div className="flex flex-wrap gap-1.5">
            {ORDEN.map((d) => (
              <button key={d} type="button" aria-pressed={datos.dias.includes(d)} className={`btn-sm ${datos.dias.includes(d) ? "btn-primary" : "btn-secondary"}`} onClick={() => alternarDia(d)}>
                {DIAS[d]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tu-entrada">Entrada</label>
            <input id="tu-entrada" type="time" className="input-field" value={datos.hora_entrada} onChange={(e) => setDatos((x) => ({ ...x, hora_entrada: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="tu-salida">Salida</label>
            <input id="tu-salida" type="time" className="input-field" value={datos.hora_salida} onChange={(e) => setDatos((x) => ({ ...x, hora_salida: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="tu-tol">Tolerancia</label>
            <select id="tu-tol" className="input-field" value={datos.tolerancia_minutos} onChange={(e) => setDatos((x) => ({ ...x, tolerancia_minutos: e.target.value }))}>
              {[0, 5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
        </div>
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Turnos() {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLista((await api("/turnos")).turnos);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alternar = async (t) => {
    try {
      await api(`/turnos/${t.id}/activo`, { metodo: "POST", datos: { activo: !t.activo } });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Operación"
        titulo="Turnos."
        apagado="Para retardos y tiempo extra."
        acciones={
          <button type="button" className="btn-primary btn-sm" onClick={() => setForm({})}>
            <Plus className="h-4 w-4" /> Nuevo turno
          </button>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}
      {!lista ? (
        <p className="text-sm text-tinta-3">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="card vacio">
          <span className="app-icono app-icono-claro">
            <Clock />
          </span>
          <p className="font-semibold text-tinta">Crea el turno de tu equipo</p>
          <p className="max-w-md text-sm">Por ejemplo, lunes a viernes de 9:00 a 18:00 con 10 minutos de tolerancia. Después lo asignas en Personas.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((t) => (
            <article key={t.id} className={`card space-y-2 ${t.activo ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-tinta">{t.nombre}</p>
                <span className="badge badge-neutral">{t.personas} {t.personas === 1 ? "persona" : "personas"}</span>
              </div>
              <p className="text-sm text-tinta-2">
                {ORDEN.filter((d) => t.dias.includes(d)).map((d) => DIAS[d]).join(", ")} · {t.hora_entrada} a {t.hora_salida} ({t.horas} h)
              </p>
              <p className="text-[13px] text-tinta-3">Tolerancia de {t.tolerancia_minutos} min{t.activo ? "" : " · desactivado"}</p>
              <div className="flex gap-1.5">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setForm(t)}>
                  <Pencil className="h-4 w-4" /> Editar
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => alternar(t)}>
                  {t.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {form && (
        <FormTurno
          turno={form.id ? form : null}
          onCerrar={() => setForm(null)}
          onGuardado={() => {
            setForm(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

export default Turnos;
