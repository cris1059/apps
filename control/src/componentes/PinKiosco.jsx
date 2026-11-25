import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { api, useSesion } from "../sesion";

/*
  PIN para marcar en el kiosco de la sucursal (4 a 6 números). Para
  crearlo o cambiarlo se pide la contraseña. En el kiosco se usa con el
  número de empleado.
*/
function PinKiosco() {
  const sesion = useSesion();
  const [datos, setDatos] = useState({ pin: "", contrasena: "" });
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const numero = sesion.usuario.numero_empleado;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api("/cuenta/pin", { metodo: "POST", datos });
      setDatos({ pin: "", contrasena: "" });
      setMensaje({ tono: "ok", texto: "Listo: ya puedes marcar en el kiosco con tu número de empleado y este PIN." });
    } catch (error) {
      setMensaje({ tono: "error", texto: error.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="card">
      <h2 className="card-titulo mb-2">
        <Grid3x3 className="h-5 w-5 text-tinta-3" /> PIN para el kiosco
      </h2>
      <p className="mb-4 text-sm text-tinta-2">
        Si tu sucursal tiene kiosco, marca con tu número de empleado {numero ? <b className="text-tinta">({numero})</b> : "(te lo asigna quien administra)"} y este PIN.
      </p>
      <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2" noValidate>
        <div>
          <label className="label" htmlFor="pin-nuevo">PIN nuevo</label>
          <input
            id="pin-nuevo"
            className="input-field tracking-[.3em]"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={datos.pin}
            onChange={(e) => setDatos((d) => ({ ...d, pin: e.target.value.replace(/\D/g, "") }))}
            placeholder="4 a 6 números"
          />
        </div>
        <div>
          <label className="label" htmlFor="pin-clave">Tu contraseña</label>
          <input id="pin-clave" className="input-field" type="password" autoComplete="current-password" value={datos.contrasena} onChange={(e) => setDatos((d) => ({ ...d, contrasena: e.target.value }))} />
        </div>
        {mensaje && <p className={`sm:col-span-2 ${mensaje.tono === "ok" ? "ctl-ok" : "ctl-aviso"}`}>{mensaje.texto}</p>}
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={guardando || datos.pin.length < 4 || !datos.contrasena}>
            {guardando ? "Guardando…" : "Guardar PIN"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PinKiosco;
