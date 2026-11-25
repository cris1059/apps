import { useCallback, useEffect, useState } from "react";
import { Mail, MoreHorizontal, RotateCcw, Send, Settings2, UserMinus, UserPlus, Users } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { ROLES, administra, api, esDueno, useSesion } from "../../sesion";
import JornadaPersona from "../jornada/JornadaPersona";
import { MODALIDADES } from "../jornada/comun";

/*
  Empleados de la empresa (igual que en la demo). Solo el dueño da de alta
  (con el correo que elija), reenvía accesos, da de baja o reactiva; los
  administradores ven la lista. Cada alta recibe por correo una contraseña
  temporal. El plan es «el dueño + N personas»: el dueño no ocupa lugar.
*/

const fecha = (f) => (f ? new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "");

/* Cómo va su acceso: aún no entra, ya entró, venció la temporal o está de baja. */
const situacion = (p) => {
  if (p.estado === "baja") return { texto: `De baja${p.fecha_baja ? ` · ${fecha(p.fecha_baja)}` : ""}`, clase: "badge-neutral" };
  if (p.debe_cambiar_contrasena) {
    const vencida = p.contrasena_vence_en && new Date(p.contrasena_vence_en) < new Date();
    return vencida ? { texto: "Su acceso venció", clase: "badge-error" } : { texto: "Aún no entra", clase: "badge-warning" };
  }
  return { texto: p.ultimo_acceso ? `Entró ${fecha(p.ultimo_acceso)}` : "Activa", clase: "badge-success" };
};

function Alta({ variosAdministradores, onCerrar, onCreada }) {
  const [datos, setDatos] = useState({ nombre: "", correo: "", puesto: "", rol: "empleado" });
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cambiar = (c) => (e) => {
    setDatos((d) => ({ ...d, [c]: e.target.value }));
    setAviso("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (datos.nombre.trim().length < 2) return setAviso("Escribe el nombre completo.");
    if (!/^\S+@\S+\.\S+$/.test(datos.correo.trim())) return setAviso("Revisa el correo.");
    setGuardando(true);
    try {
      onCreada(await api("/personas", { metodo: "POST", datos: { ...datos, correo: datos.correo.trim() } }));
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo="Agregar persona" descripcion="Le llegará un correo con una contraseña temporal para entrar a control.avantcode.mx.">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div>
          <label htmlFor="alta-nombre" className="label">
            Nombre completo
          </label>
          <input id="alta-nombre" className="input-field" value={datos.nombre} onChange={cambiar("nombre")} maxLength={120} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="alta-correo" className="label">
            Correo
          </label>
          <input id="alta-correo" type="email" className="input-field" value={datos.correo} onChange={cambiar("correo")} maxLength={160} autoComplete="off" placeholder="nombre@correo.com" />
          <p className="mt-1.5 text-xs text-tinta-3">Con este correo va a entrar. Puede ser personal (Gmail, Outlook…).</p>
        </div>
        <div>
          <label htmlFor="alta-puesto" className="label">
            Puesto <span className="font-normal text-tinta-3">(opcional)</span>
          </label>
          <input id="alta-puesto" className="input-field" value={datos.puesto} onChange={cambiar("puesto")} maxLength={80} placeholder="Ej. Almacenista" />
        </div>
        {variosAdministradores && (
          <div>
            <span className="label">Rol</span>
            <div className="segmentado max-w-full overflow-x-auto" role="group" aria-label="Rol">
              {["empleado", "supervisor", "rh", "administrador"].map((r) => (
                <button key={r} type="button" aria-pressed={datos.rol === r} onClick={() => setDatos((d) => ({ ...d, rol: r }))}>
                  {ROLES[r]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-tinta-3">
              {
                {
                  administrador: "Ve y administra la empresa contigo. Solo tú das de alta personas.",
                  rh: "Ve a todo el equipo, resuelve solicitudes, ve costos, reportes y la bitácora.",
                  supervisor: "Ve a las personas de su sucursal y resuelve sus solicitudes. Asígnale su sucursal en Jornada.",
                  empleado: "Registra su jornada y ve lo suyo.",
                }[datos.rol]
              }
            </p>
          </div>
        )}
        {aviso && (
          <p className="ctl-aviso" role="alert">
            {aviso}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            <Send className="h-4 w-4" /> {guardando ? "Enviando…" : "Agregar y enviar acceso"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Personas() {
  const sesion = useSesion();
  const dueno = esDueno(sesion);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [alta, setAlta] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [menu, setMenu] = useState(null);
  const [jornada, setJornada] = useState(null);
  const puedeJornada = administra(sesion);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api("/personas"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const avisar = (texto, tono = "ok") => {
    setMensaje({ texto, tono });
    window.setTimeout(() => setMensaje(null), 6000);
  };

  const accion = async (p, tipo) => {
    setMenu(null);
    if (tipo === "baja" && !window.confirm(`¿Dar de baja a ${p.nombre}? Ya no podrá entrar y se libera su lugar. Sus registros se conservan.`)) return;
    try {
      const r = await api(`/personas/${p.id_usuario}/${tipo}`, { metodo: "POST" });
      const textos = {
        reenviar: r.correo_enviado ? `Le enviamos a ${p.nombre} una contraseña temporal nueva.` : "Se generó el acceso, pero el correo no salió. Intenta de nuevo.",
        baja: `${p.nombre} quedó de baja.`,
        reactivar: r.correo_enviado ? `${p.nombre} está activo de nuevo y le enviamos su acceso.` : `${p.nombre} está activo de nuevo, pero el correo no salió.`,
      };
      avisar(textos[tipo], r.correo_enviado === false ? "aviso" : "ok");
      cargar();
    } catch (e) {
      avisar(e.message, "error");
    }
  };

  const uso = datos?.uso;
  const lleno = uso && uso.usadas >= uso.limite;

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Operación"
        titulo="Empleados."
        apagado="Tu equipo en AvantCode Control."
        sub={dueno ? "Da de alta a cada persona con su correo: le llega una contraseña temporal y al entrar crea la suya." : "Solo el dueño puede dar de alta personas."}
        acciones={
          dueno && (
            <button type="button" className="btn-primary btn-sm" onClick={() => setAlta(true)} disabled={!datos || lleno}>
              <UserPlus className="h-4 w-4" /> Agregar persona
            </button>
          )
        }
      />

      {mensaje && (
        <p className={mensaje.tono === "error" ? "ctl-aviso" : mensaje.tono === "aviso" ? "ctl-aviso ctl-aviso--suave" : "ctl-ok"} role="status">
          {mensaje.texto}
        </p>
      )}
      {error && <p className="ctl-aviso">{error}</p>}

      {uso && (
        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-tinta">
              {uso.usadas} de {uso.limite} personas <span className="font-normal text-tinta-3">en tu plan, además de ti como dueño</span>
            </p>
            {lleno && <span className="text-sm text-tinta-3">Para agregar más, pide lugares desde Suscripción.</span>}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[.06]">
            <div className="h-full rounded-full bg-negro" style={{ width: `${Math.min(100, (uso.usadas / Math.max(1, uso.limite)) * 100)}%` }} />
          </div>
        </section>
      )}

      <section className="card">
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : datos.personas.length <= 1 && dueno ? (
          <div className="vacio">
            <span className="app-icono app-icono-claro">
              <Users />
            </span>
            <p className="font-semibold text-tinta">Aún no agregas a tu equipo</p>
            <p className="max-w-md text-sm">Agrega a cada persona con su correo. Le llegará su acceso para entrar a control.avantcode.mx.</p>
          </div>
        ) : null}
        {datos && (
          <ul className="divide-y divide-black/5">
            {datos.personas.map((p) => {
              const s = situacion(p);
              const esYo = p.id_usuario === sesion.usuario.id;
              return (
                <li key={p.id_usuario} className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 ${p.estado === "baja" ? "opacity-60" : ""}`}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/[.06] text-sm font-semibold text-tinta-2">
                    {p.nombre
                      .split(" ")
                      .slice(0, 2)
                      .map((x) => x[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-tinta">
                      {p.nombre}
                      {esYo && <span className="font-normal text-tinta-3"> (tú)</span>}
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-[13px] text-tinta-3">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> {p.correo}
                      {p.numero_empleado ? ` · No. ${p.numero_empleado}` : ""}
                      {p.puesto ? ` · ${p.puesto}` : ""}
                    </span>
                    {p.estado === "activo" && (
                      <span className="block truncate text-[12.5px] text-tinta-3">
                        {p.registra_jornada === false
                          ? "No registra jornada"
                          : [p.modalidad === "sucursal" ? p.sucursal?.nombre || "Sin sucursal" : MODALIDADES[p.modalidad]?.corto, p.turno?.nombre || "Sin turno", { app: "Marca en la app", kiosco: "Marca en el kiosco", ambos: "App o kiosco" }[p.metodo_marcaje], p.departamento].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="badge badge-dark">{ROLES[p.rol]}</span>
                  {p.rol === "dueno" && <span className="badge badge-neutral">No ocupa lugar</span>}
                  {puedeJornada && p.estado === "activo" && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setJornada(p)} aria-label={`Jornada de ${p.nombre}`}>
                      <Settings2 className="h-4 w-4" /> Jornada
                    </button>
                  )}
                  <span className={`badge ${s.clase}`}>{s.texto}</span>
                  {dueno && p.rol !== "dueno" && (
                    <span className="relative">
                      <button type="button" className="btn-icono h-9 w-9" aria-label={`Opciones de ${p.nombre}`} onClick={() => setMenu(menu === p.id_usuario ? null : p.id_usuario)}>
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {menu === p.id_usuario && (
                        <span className="glass-fuerte absolute right-0 top-10 z-10 flex w-56 flex-col rounded-2xl p-1.5 text-sm">
                          {p.estado === "activo" ? (
                            <>
                              <button type="button" className="ctl-menu-item" onClick={() => accion(p, "reenviar")}>
                                <Send className="h-4 w-4" /> Enviar acceso nuevo
                              </button>
                              <button type="button" className="ctl-menu-item text-[#B42318]" onClick={() => accion(p, "baja")}>
                                <UserMinus className="h-4 w-4" /> Dar de baja
                              </button>
                            </>
                          ) : (
                            <button type="button" className="ctl-menu-item" onClick={() => accion(p, "reactivar")}>
                              <RotateCcw className="h-4 w-4" /> Reactivar
                            </button>
                          )}
                        </span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {jornada && (
        <JornadaPersona
          persona={jornada}
          onCerrar={() => setJornada(null)}
          onGuardada={(p) => {
            setJornada(null);
            avisar(`Listo: guardamos la jornada de ${p.nombre}.`, "ok");
            cargar();
          }}
        />
      )}

      {alta && (
        <Alta
          variosAdministradores={datos?.varios_administradores}
          onCerrar={() => setAlta(false)}
          onCreada={(r) => {
            setAlta(false);
            avisar(
              r.correo_enviado
                ? `Listo: le enviamos a ${r.persona.nombre} su acceso a ${r.persona.correo}.`
                : `${r.persona.nombre} quedó dado de alta, pero el correo no salió. Usa «Enviar acceso nuevo».`,
              r.correo_enviado ? "ok" : "aviso"
            );
            cargar();
          }}
        />
      )}
    </div>
  );
}

export default Personas;
