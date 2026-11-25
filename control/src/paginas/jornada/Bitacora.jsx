import { useCallback, useEffect, useState } from "react";
import Encabezado from "../../componentes/Encabezado";
import { ROLES, api } from "../../sesion";
import { fechaCorta, hoyLocal } from "./comun";

/*
  Bitácora (igual que en la demo): quién hizo qué y cuándo. Nada se borra:
  cada corrección queda como un registro nuevo y el marcaje original se
  conserva. La ven el dueño, los administradores y Recursos Humanos.
*/

const nombre = (d) => (d && (d.nombre || d.persona)) || "";
const ACCIONES = {
  activacion: () => "activó la empresa en AvantCode Control",
  alta_persona: (e) => `dio de alta a ${nombre(e.despues) || "una persona"}`,
  baja_persona: (e) => `dio de baja a ${e.sobre || "una persona"} (sus registros se conservan)`,
  reactivar_persona: (e) => `reactivó a ${e.sobre || "una persona"}`,
  reenvio_acceso: (e) => `reenvió el acceso de ${e.sobre || "una persona"}`,
  reenvio_acceso_dueno: () => "reenvió el acceso del dueño",
  jornada_persona: (e) => `cambió dónde marca, la sucursal, el horario o el salario de ${e.sobre || "una persona"}`,
  alta_sucursal: (e) => `agregó la sucursal ${nombre(e.despues)}`,
  cambio_sucursal: (e) => `cambió la sucursal ${nombre(e.antes)}`,
  activar_sucursal: () => "activó una sucursal",
  desactivar_sucursal: () => "desactivó una sucursal",
  alta_turno: (e) => `creó el turno ${nombre(e.despues)}`,
  cambio_turno: (e) => `cambió el turno ${nombre(e.antes) || nombre(e.despues)}`,
  activar_turno: () => "activó un turno",
  desactivar_turno: () => "desactivó un turno",
  correccion_aprobada: () => "aprobó una corrección: el marcaje original se conserva y el ajuste quedó como registro aparte",
  correccion_rechazada: () => "rechazó una corrección",
  aviso_ubicacion: () => "aceptó el aviso de uso de su ubicación",
  horas_extra_aprobadas: (e) => `aprobó las horas extra de ${e.sobre || "una persona"} del ${e.despues?.fecha || ""} (${e.despues?.folio || ""})`,
  horas_extra_rechazadas: (e) => `rechazó las horas extra de ${e.sobre || "una persona"} del ${e.despues?.fecha || ""} (${e.despues?.folio || ""})`,
  cambio_avisos: () => "cambió qué avisos automáticos llegan",
  alta_actividad: (e) => `le asignó a ${e.sobre || "una persona"} la actividad «${e.despues?.titulo || ""}»`,
  estado_actividad: (e) => `pasó «${e.despues?.titulo || ""}» de ${e.sobre || "una persona"} a «${ESTADO_ACTIVIDAD[e.despues?.estado] || e.despues?.estado}»`,
  inicio_sesion: () => "inició sesión",
  uso_codigo_respaldo: () => "entró con un código de respaldo",
  primer_acceso: () => "creó su contraseña al entrar por primera vez",
  cambio_contrasena: () => "cambió su contraseña",
  dos_pasos_activado: () => "activó la verificación en dos pasos",
  dos_pasos_desactivado: () => "desactivó la verificación en dos pasos",
  solicitud_cambio: () => "pidió un cambio en la suscripción",
  cambio_suscripcion: () => "actualizó la suscripción",
};

const ESTADO_ACTIVIDAD = { pendiente: "Pendiente", en_progreso: "En progreso", en_revision: "En revisión", completada: "Completada" };

const quien = (e) => {
  if (e.actor === "avantcode") return "AvantCode";
  if (e.actor === "sistema" || !e.persona) return "Sistema";
  return `${e.persona.nombre} (${ROLES[e.persona.rol] || e.persona.rol})`;
};

function Bitacora() {
  const [tipo, setTipo] = useState("cambios");
  const [eventos, setEventos] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(
    async (antes) => {
      setCargando(true);
      try {
        const r = await api(`/bitacora?tipo=${tipo}${antes ? `&antes=${antes}` : ""}`);
        setEventos((previos) => (antes ? [...(previos || []), ...r.eventos] : r.eventos));
        setHayMas(r.hay_mas);
        setError("");
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    },
    [tipo]
  );

  useEffect(() => {
    setEventos(null);
    cargar();
  }, [cargar]);

  const hoy = hoyLocal();
  return (
    <div className="pagina">
      <Encabezado etiqueta="Sistema" titulo="Bitácora." apagado="Historial de cambios." sub="Nada se borra: cada corrección queda como un registro nuevo y el marcaje original se conserva." />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card">
        <div className="segmentado mb-3" role="group" aria-label="Qué mostrar">
          {[
            ["cambios", "Cambios"],
            ["todo", "Todo, con inicios de sesión"],
          ].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={tipo === v} onClick={() => setTipo(v)}>
              {t}
            </button>
          ))}
        </div>
        {!eventos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-tinta-3">Todavía no hay movimientos.</p>
        ) : (
          <ol className="jr-linea">
            {eventos.map((e) => (
              <li key={e.id}>
                <b>{e.hora}</b>
                <span>
                  <strong className="font-semibold">{quien(e)}</strong> {(ACCIONES[e.accion] || (() => e.accion.replace(/_/g, " ")))(e)}.
                  <small>{e.fecha === hoy ? "Hoy" : fechaCorta(e.fecha)}</small>
                </span>
              </li>
            ))}
          </ol>
        )}
        {hayMas && (
          <button type="button" className="btn-secondary btn-sm mt-3" disabled={cargando} onClick={() => cargar(eventos.at(-1).id)}>
            {cargando ? "Cargando…" : "Ver anteriores"}
          </button>
        )}
      </section>
    </div>
  );
}

export default Bitacora;
