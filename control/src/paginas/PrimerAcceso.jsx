import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import AccesoLayout from "../componentes/AccesoLayout";
import ActivarDosPasos from "../componentes/ActivarDosPasos";
import { CampoContrasena, ListaReglas, reglasContrasena } from "../componentes/Contrasena";
import { api, guardarSesion, useSesion } from "../sesion";

/*
  Primer acceso (dueño y empleados): después de entrar con la contraseña
  temporal del correo, crea su propia contraseña (obligatorio) y se le
  ofrece la verificación en dos pasos (opcional).
*/
function PrimerAcceso() {
  const navigate = useNavigate();
  const sesion = useSesion();
  const [paso, setPaso] = useState(sesion?.usuario?.debe_cambiar_contrasena ? "contrasena" : "ofrecer");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!sesion) return <Navigate to="/" replace />;
  const nombre = sesion.usuario.nombre.split(" ")[0];
  const reglasOk = reglasContrasena(nueva).every((r) => r.ok);

  const guardar = async (e) => {
    e.preventDefault();
    if (nueva !== confirmar) return setAviso("Las contraseñas no coinciden.");
    setCargando(true);
    setAviso("");
    try {
      guardarSesion(await api("/cuenta/primer-acceso", { metodo: "POST", datos: { nueva } }));
      setPaso("ofrecer");
    } catch (error) {
      setAviso(error.message);
    } finally {
      setCargando(false);
    }
  };

  const alPanel = () => navigate("/panel", { replace: true });

  let contenido;
  if (paso === "contrasena") {
    contenido = (
      <>
        <span className="app-icono app-icono-tinta mb-4">
          <KeyRound />
        </span>
        <h1 className="pagina-titulo text-[1.9rem]">Hola, {nombre}</h1>
        <p className="pagina-sub">Entraste con una contraseña temporal. Crea la tuya para continuar.</p>
        <form onSubmit={guardar} className="mt-6 space-y-5" noValidate>
          <div>
            <CampoContrasena id="nueva" etiqueta="Contraseña nueva" valor={nueva} onCambio={(v) => (setNueva(v), setAviso(""))} />
            <ListaReglas valor={nueva} />
          </div>
          <CampoContrasena id="confirmar" etiqueta="Escríbela otra vez" valor={confirmar} onCambio={(v) => (setConfirmar(v), setAviso(""))} />
          {aviso && (
            <p className="ctl-aviso" role="alert">
              {aviso}
            </p>
          )}
          <button type="submit" className="btn-primary btn-lg w-full" disabled={!reglasOk || !confirmar || cargando}>
            {cargando ? "Guardando…" : "Guardar contraseña"}
            {!cargando && <ArrowRight className="h-[18px] w-[18px]" />}
          </button>
        </form>
      </>
    );
  } else if (paso === "activar") {
    contenido = (
      <>
        <h1 className="pagina-titulo text-[1.75rem]">Verificación en dos pasos</h1>
        <p className="pagina-sub mb-5">Además de tu contraseña, al entrar se te pedirá un código de tu celular.</p>
        <ActivarDosPasos onListo={alPanel} onCancelar={alPanel} />
      </>
    );
  } else {
    contenido = (
      <>
        <span className="app-icono app-icono-tinta mb-4">
          <ShieldCheck />
        </span>
        <h1 className="pagina-titulo text-[1.75rem]">Tu contraseña está lista</h1>
        <p className="pagina-sub">
          ¿Quieres activar la verificación en dos pasos? Además de tu contraseña, al entrar se te pedirá un código de una
          app en tu celular. Es opcional y la puedes activar después en Mi cuenta.
        </p>
        <button type="button" className="btn-primary btn-lg mt-6 w-full" onClick={() => setPaso("activar")}>
          Activarla ahora
        </button>
        <button type="button" className="btn-secondary btn-lg mt-3 w-full" onClick={alPanel}>
          Ahora no, ir a mi sistema
        </button>
      </>
    );
  }

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">{contenido}</div>
    </AccesoLayout>
  );
}

export default PrimerAcceso;
