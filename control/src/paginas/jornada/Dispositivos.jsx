import { useCallback, useEffect, useState } from "react";
import { MonitorSmartphone, Plus, QrCode, Smartphone, Nfc } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { api } from "../../sesion";

/*
  Kioscos y dispositivos (igual que en la demo): los kioscos de cada
  sucursal (tableta o computadora en control.avantcode.mx/kiosco), su código
  QR temporal y el celular de cada persona. Las tarjetas NFC: en camino.
*/

const ESTADOS = {
  activo: { texto: "Activo", clase: "badge-success" },
  por_activar: { texto: "Por activar", clase: "badge-warning" },
  codigo_vencido: { texto: "Código vencido", clase: "badge-neutral" },
  revocado: { texto: "Revocado", clase: "badge-error" },
};
const fechaHora = (f) => (f ? new Date(f).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

function CodigoNuevo({ datos, onCerrar }) {
  return (
    <Modal onCerrar={onCerrar} titulo={`Activa «${datos.dispositivo.nombre}»`} descripcion="Este código se muestra una sola vez y vence en 24 horas.">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-tinta-2">
        <li>
          En la tableta o computadora de la sucursal abre <b className="text-tinta">control.avantcode.mx/kiosco</b>.
        </li>
        <li>Escribe este código:</li>
      </ol>
      <p className="my-4 rounded-2xl bg-negro py-4 text-center font-mono text-3xl font-bold tracking-[.2em] text-white">{datos.codigo}</p>
      <p className="text-[13px] text-tinta-3">
        Cada persona marca con su número de empleado (en Empleados › Jornada) y su PIN (lo crea en Mi cuenta), o escaneando con su celular el código QR que muestra el kiosco.
      </p>
      <div className="mt-4 flex justify-end">
        <button type="button" className="btn-primary" onClick={onCerrar}>
          Listo
        </button>
      </div>
    </Modal>
  );
}

function NuevoKiosco({ onCerrar, onCreado }) {
  const [sucursales, setSucursales] = useState(null);
  const [datos, setDatos] = useState({ nombre: "", id_sucursal: "" });
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    api("/sucursales")
      .then((r) => setSucursales(r.sucursales.filter((s) => s.activa)))
      .catch((e) => setAviso(e.message));
  }, []);
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      onCreado(await api("/dispositivos", { metodo: "POST", datos: { nombre: datos.nombre.trim(), id_sucursal: Number(datos.id_sucursal) } }));
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <Modal onCerrar={onCerrar} titulo="Nuevo kiosco" descripcion="Una tableta o computadora en la sucursal: marca con la ubicación fija del lugar.">
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="ki-nombre">Nombre</label>
          <input id="ki-nombre" className="input-field" value={datos.nombre} maxLength={80} placeholder="Recepción Matriz" onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="ki-suc">Sucursal</label>
          <select id="ki-suc" className="input-field" value={datos.id_sucursal} onChange={(e) => setDatos((d) => ({ ...d, id_sucursal: e.target.value }))}>
            <option value="">Elige la sucursal</option>
            {(sucursales || []).map((s) => (
              <option key={s.id} value={s.id} disabled={s.latitud == null}>
                {s.nombre}
                {s.latitud == null ? " (sin punto en el mapa)" : ""}
              </option>
            ))}
          </select>
        </div>
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando || datos.nombre.trim().length < 2 || !datos.id_sucursal}>
            {guardando ? "Creando…" : "Crear y ver su código"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Dispositivos() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [codigo, setCodigo] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api("/dispositivos"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const accion = async (d, tipo) => {
    if (tipo === "revocar" && !window.confirm(`¿Revocar «${d.nombre}»? Deja de funcionar al momento.`)) return;
    try {
      const r = await api(`/dispositivos/${d.id}/${tipo}`, { metodo: "POST" });
      if (r.codigo) setCodigo(r);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Sistema"
        titulo="Kioscos y dispositivos."
        apagado="Dónde marca tu equipo."
        acciones={
          <button type="button" className="btn-primary btn-sm" onClick={() => setNuevo(true)}>
            <Plus className="h-4 w-4" /> Nuevo kiosco
          </button>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card">
        <h2 className="card-titulo">Kioscos</h2>
        {!datos ? (
          <p className="mt-3 text-sm text-tinta-3">Cargando…</p>
        ) : datos.dispositivos.length === 0 ? (
          <p className="mt-3 text-sm text-tinta-3">Aún no tienes kioscos. Crea uno para la tableta o computadora de tu sucursal.</p>
        ) : (
          <ul className="jr-linea">
            {datos.dispositivos.map((d) => (
              <li key={d.id}>
                <MonitorSmartphone className="h-5 w-5 text-tinta-3" aria-hidden="true" />
                <span>
                  {d.nombre}
                  <small>
                    {d.sucursal?.nombre}
                    {d.estado === "activo" ? ` · ${d.marcajes_hoy} marcajes hoy${d.ultimo_uso ? ` · último uso ${fechaHora(d.ultimo_uso)}` : ""}` : ""}
                    {d.estado === "por_activar" && d.codigo_vence_en ? ` · el código vence ${fechaHora(d.codigo_vence_en)}` : ""}
                  </small>
                </span>
                <span className={`badge ${ESTADOS[d.estado]?.clase}`}>{ESTADOS[d.estado]?.texto}</span>
                {d.estado !== "revocado" && (
                  <span className="flex gap-1">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => accion(d, "codigo")}>
                      Código nuevo
                    </button>
                    <button type="button" className="btn-ghost btn-sm text-[#B42318]" onClick={() => accion(d, "revocar")}>
                      Revocar
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="card">
          <Smartphone className="h-5 w-5 text-tinta-3" />
          <p className="mt-2 font-semibold text-tinta">Celular de cada persona</p>
          <p className="mt-1 text-sm text-tinta-3">Marca en control.avantcode.mx con la ubicación del momento. {datos ? `${datos.celular.personas_hoy} marcaron así hoy.` : ""}</p>
        </div>
        <div className="card">
          <QrCode className="h-5 w-5 text-tinta-3" />
          <p className="mt-2 font-semibold text-tinta">Código QR temporal</p>
          <p className="mt-1 text-sm text-tinta-3">Lo muestra cada kiosco, cambia cada 30 s y no se puede reutilizar después. {datos ? `${datos.qr.marcajes_hoy} marcajes con QR hoy.` : ""}</p>
        </div>
        <div className="card">
          <Nfc className="h-5 w-5 text-tinta-3" />
          <p className="mt-2 font-semibold text-tinta">Tarjetas NFC y lectores</p>
          <p className="mt-1 text-sm text-tinta-3">En camino: necesitan un lector instalado en tu sucursal (se cotiza aparte).</p>
        </div>
      </section>

      {nuevo && (
        <NuevoKiosco
          onCerrar={() => setNuevo(false)}
          onCreado={(r) => {
            setNuevo(false);
            setCodigo(r);
            cargar();
          }}
        />
      )}
      {codigo && <CodigoNuevo datos={codigo} onCerrar={() => setCodigo(null)} />}
    </div>
  );
}

export default Dispositivos;
