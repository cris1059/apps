import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Minus } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import { api, useSesion } from "../../sesion";

/*
  Configuración (igual que en la demo): los avisos automáticos que llegan y
  por dónde, los roles y lo que puede hacer cada uno, y los accesos a quién
  registra jornada, dónde marca cada quien, sucursales y calendario.
*/

const ROLES_PLAN = {
  esencial: ["Dueño", "Empleado"],
  completo: ["Dueño", "Administrador", "RH", "Supervisor", "Empleado"],
};
/* [permiso, dueño, administrador, RH, supervisor, empleado] — true, false o un texto. */
const PERMISOS = [
  ["Empresa, sucursales, turnos y avisos", true, true, false, false, false],
  ["Dar de alta y de baja a personas", true, false, false, false, false],
  ["Salarios y costos laborales", true, true, true, false, false],
  ["Aprobar correcciones y horas extra", true, true, true, "Su sucursal", false],
  ["Asignar actividades", true, true, true, "Su sucursal", false],
  ["Ver el equipo, el mapa, cumplimiento y reportes", true, true, true, "Su sucursal", false],
  ["Bitácora", true, true, true, false, false],
  ["Registrar su entrada y salida", "Si lo activas", true, true, true, true],
  ["Consultar su propio historial y sus actividades", true, true, true, true, true],
];

const Celda = ({ valor }) =>
  valor === true ? (
    <Check className="mx-auto h-4 w-4 text-green-600" aria-label="Sí" />
  ) : valor === false ? (
    <Minus className="mx-auto h-4 w-4 text-tinta-3" aria-label="No" />
  ) : (
    <span className="text-[12.5px] text-tinta-2">{valor}</span>
  );

function Interruptor({ activo, onCambio, etiqueta, deshabilitado }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
      className={`relative ml-auto h-6 w-11 shrink-0 rounded-full p-0 transition-colors ${activo ? "bg-negro" : "bg-black/15"} disabled:opacity-50`}
    >
      <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${activo ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function Configuracion() {
  const sesion = useSesion();
  const plan = sesion.empresa.plan;
  const [avisos, setAvisos] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(null);

  useEffect(() => {
    api("/avisos/preferencias")
      .then(setAvisos)
      .catch((e) => setError(e.message));
  }, []);

  const cambiar = async (id, valor) => {
    setGuardando(id);
    try {
      const r = await api("/avisos/preferencias", { metodo: "PUT", datos: { [id]: valor } });
      setAvisos((a) => ({ ...a, ...r }));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(null);
    }
  };

  const esencial = plan === "esencial";
  const roles = esencial ? ROLES_PLAN.esencial : ROLES_PLAN.completo;
  const columnas = esencial ? [1, 5] : [1, 2, 3, 4, 5];
  const c = avisos?.canales;
  return (
    <div className="pagina">
      <Encabezado etiqueta="Sistema" titulo="Configuración." apagado="Avisos, roles y reglas de tu empresa." />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="card-titulo">Avisos automáticos</h2>
            <p className="mt-1 text-sm text-tinta-3">Llegan a la persona y a quien la administra o supervisa.</p>
          </div>
          {c && (
            <div className="flex flex-wrap gap-1.5">
              <span className="badge badge-success">
                <Bell className="mr-1 h-3.5 w-3.5" /> Dentro del sistema
              </span>
              <span className={`badge ${c.correo ? "badge-success" : "badge-neutral"}`}>{c.correo ? "Por correo" : "Por correo: desde el plan Empresarial"}</span>
              <span className="badge badge-neutral">{c.whatsapp === "en_camino" ? "WhatsApp: en camino" : "WhatsApp: plan Corporativo"}</span>
            </div>
          )}
        </div>
        {!avisos ? (
          <p className="mt-3 text-sm text-tinta-3">Cargando…</p>
        ) : (
          <ul className="jr-linea">
            {avisos.tipos.map((t) => (
              <li key={t.id}>
                <span>
                  {t.titulo}
                  <small>{t.cuando}</small>
                </span>
                <Interruptor activo={t.activo} etiqueta={t.titulo} deshabilitado={guardando === t.id} onCambio={(v) => cambiar(t.id, v)} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[13px] text-tinta-3">
          Siempre llegan, dentro del sistema: las solicitudes de corrección, las horas extra resueltas y las actividades asignadas o en revisión.
        </p>
      </section>

      <section className="card">
        <h2 className="card-titulo">Roles y permisos</h2>
        <p className="mt-1 text-sm text-tinta-3">
          {esencial
            ? "El plan Esencial trae un administrador: tú, como dueño, que no ocupas lugar del plan. Más administradores, Recursos Humanos y supervisores por sucursal llegan con el Empresarial."
            : "Asigna el rol al dar de alta a cada persona en Empleados. Un supervisor ve y aprueba solo a las personas de su sucursal."}
        </p>
        <div className="tabla-contenedor mt-3">
          <table className="tabla">
            <thead>
              <tr>
                <th>Permiso</th>
                {roles.map((r) => (
                  <th key={r} className="text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISOS.map((fila) => (
                <tr key={fila[0]}>
                  <td className="text-tinta">{fila[0]}</td>
                  {columnas.map((i) => (
                    <td key={i} className="text-center">
                      <Celda valor={fila[i]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Link to="/panel/empleados" className="card transition-transform hover:-translate-y-0.5">
          <p className="font-semibold text-tinta">Registro de jornada</p>
          <p className="mt-1 text-sm text-tinta-3">Quién registra su entrada y salida, dónde marca (sucursal, home office o de viaje), su turno y su salario: en Empleados › Jornada.</p>
        </Link>
        <Link to="/panel/ubicacion" className="card transition-transform hover:-translate-y-0.5">
          <p className="font-semibold text-tinta">Sucursales y geocercas</p>
          <p className="mt-1 text-sm text-tinta-3">El punto y el radio de cada lugar de trabajo, en el mapa.</p>
        </Link>
        <Link to="/panel/calendario" className="card transition-transform hover:-translate-y-0.5">
          <p className="font-semibold text-tinta">Calendario laboral</p>
          <p className="mt-1 text-sm text-tinta-3">Los descansos obligatorios del año, con su fundamento.</p>
        </Link>
      </section>
    </div>
  );
}

export default Configuracion;
