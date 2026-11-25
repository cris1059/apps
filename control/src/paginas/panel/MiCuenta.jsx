import { useState } from "react";
import { KeyRound, ShieldCheck, ShieldOff, UserRound } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import ActivarDosPasos from "../../componentes/ActivarDosPasos";
import PinKiosco from "../../componentes/PinKiosco";
import PermisosDispositivo from "../../componentes/PermisosDispositivo";
import { CampoContrasena, ListaReglas, reglasContrasena } from "../../componentes/Contrasena";
import { ROLES, api, actualizarSesion, guardarSesion, leerSesion, useSesion } from "../../sesion";

/* Mi cuenta: mis datos, cambiar contraseña y verificación en dos pasos. */

/* Cambiarla, o crearla si solo entra desde Mi AvantCode (no tiene contraseña de Control). */
function CambiarContrasena({ conContrasena = true }) {
  const [datos, setDatos] = useState({ actual: "", nueva: "", confirmar: "" });
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (c) => (v) => {
    setDatos((d) => ({ ...d, [c]: v }));
    setAviso(null);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (datos.nueva !== datos.confirmar) return setAviso({ error: true, texto: "Las contraseñas nuevas no coinciden." });
    setGuardando(true);
    try {
      guardarSesion(await api("/cuenta/contrasena", { metodo: "POST", datos: { actual: conContrasena ? datos.actual : undefined, nueva: datos.nueva } }));
      setDatos({ actual: "", nueva: "", confirmar: "" });
      setAviso({
        texto: conContrasena
          ? "Listo: tu contraseña cambió. Se cerraron tus sesiones en otros dispositivos."
          : "Listo: ya puedes entrar también con tu correo y esta contraseña.",
      });
    } catch (error) {
      setAviso({ error: true, texto: error.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-4" noValidate>
      {conContrasena ? (
        <CampoContrasena id="actual" etiqueta="Contraseña actual" valor={datos.actual} onCambio={cambiar("actual")} autoComplete="current-password" />
      ) : (
        <p className="text-sm text-tinta-2">
          Entras desde Mi AvantCode, así que no necesitas otra contraseña. Si quieres entrar también directo a Control (por ejemplo, desde el
          celular), crea una aquí.
        </p>
      )}
      <div>
        <CampoContrasena id="nueva" etiqueta="Contraseña nueva" valor={datos.nueva} onCambio={cambiar("nueva")} />
        <ListaReglas valor={datos.nueva} />
      </div>
      <CampoContrasena id="confirmar" etiqueta="Escríbela otra vez" valor={datos.confirmar} onCambio={cambiar("confirmar")} />
      {aviso && <p className={aviso.error ? "ctl-aviso" : "ctl-ok"}>{aviso.texto}</p>}
      <button
        type="submit"
        className="btn-primary"
        disabled={guardando || (conContrasena && !datos.actual) || !datos.confirmar || !reglasContrasena(datos.nueva).every((r) => r.ok)}
      >
        {guardando ? "Guardando…" : conContrasena ? "Cambiar contraseña" : "Crear contraseña"}
      </button>
    </form>
  );
}

function Desactivar({ onCerrar, conContrasena = true }) {
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");
  const enviar = async (e) => {
    e.preventDefault();
    try {
      await api("/cuenta/dos-pasos/desactivar", { metodo: "POST", datos: { contrasena, codigo } });
      actualizarSesion({ usuario: { ...leerSesion().usuario, dos_pasos_activo: false } });
      onCerrar();
    } catch (error) {
      setAviso(error.message);
    }
  };
  return (
    <Modal onCerrar={onCerrar} titulo="Desactivar la verificación en dos pasos" descripcion="Confirma con tu contraseña y un código de tu app.">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {conContrasena && (
          <CampoContrasena id="d-contrasena" etiqueta="Contraseña" valor={contrasena} onCambio={setContrasena} autoComplete="current-password" />
        )}
        <div>
          <label htmlFor="d-codigo" className="label">
            Código de 6 dígitos
          </label>
          <input id="d-codigo" className="input-field font-mono tracking-[.3em]" inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} />
        </div>
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={(conContrasena && !contrasena) || codigo.length !== 6}>
            Desactivar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MiCuenta() {
  const sesion = useSesion();
  const { usuario, empresa } = sesion;
  const [activar, setActivar] = useState(false);
  const [desactivar, setDesactivar] = useState(false);

  return (
    <div className="pagina">
      <Encabezado etiqueta="Cuenta" titulo="Mi cuenta." apagado="Tu acceso y tu seguridad." />

      <section className="card flex flex-wrap items-center gap-4">
        <span className="app-icono app-icono-tinta">
          <UserRound />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-tinta">{usuario.nombre}</p>
          <p className="text-sm text-tinta-3">
            {usuario.correo} · {ROLES[usuario.rol]} · {empresa.nombre}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="card-titulo mb-4">
            <KeyRound className="h-5 w-5 text-tinta-3" /> Contraseña
          </h2>
          <CambiarContrasena conContrasena={usuario.con_contrasena !== false} />
        </section>

        <section className="card">
          <h2 className="card-titulo mb-2">
            <ShieldCheck className="h-5 w-5 text-tinta-3" /> Verificación en dos pasos
          </h2>
          {activar ? (
            <ActivarDosPasos onListo={() => setActivar(false)} onCancelar={() => setActivar(false)} />
          ) : usuario.dos_pasos_activo ? (
            <>
              <p className="mb-4 text-sm text-tinta-2">
                <span className="badge badge-success mr-2">Activa</span>
                Al entrar se te pide un código de tu app autenticadora.
              </p>
              <button type="button" className="btn-secondary" onClick={() => setDesactivar(true)}>
                <ShieldOff className="h-4 w-4" /> Desactivar
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-tinta-2">
                Opcional y recomendada: además de tu contraseña, al entrar se te pedirá un código de una app en tu celular
                (Google Authenticator, Microsoft Authenticator u otra).
              </p>
              <button type="button" className="btn-primary" onClick={() => setActivar(true)}>
                <ShieldCheck className="h-4 w-4" /> Activar
              </button>
            </>
          )}
        </section>
      </div>

      {usuario.registra_jornada !== false && <PinKiosco />}
      <PermisosDispositivo />

      {desactivar && <Desactivar conContrasena={usuario.con_contrasena !== false} onCerrar={() => setDesactivar(false)} />}
    </div>
  );
}

export default MiCuenta;
