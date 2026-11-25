import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import AccesoLayout from "../componentes/AccesoLayout";
import { CampoContrasena } from "../componentes/Contrasena";
import { api, guardarSesion } from "../sesion";

/*
  Inicio de sesión de control.avantcode.mx, igual al de sistema.avantcode.mx:
  correo y contraseña para todos (dueño, administradores y empleados).
  - Con verificación en dos pasos activa, pide después el código de la app.
  - Si entró con la contraseña temporal, lo lleva a crear la suya.
  No hay registro abierto: las cuentas nacen cuando AvantCode activa una
  solicitud pagada (el dueño) o cuando el dueño da de alta a su equipo.
*/
function Entrar() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ correo: "", contrasena: "" });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(() => {
    try {
      const a = sessionStorage.getItem("control_aviso") || "";
      sessionStorage.removeItem("control_aviso");
      return a;
    } catch {
      return "";
    }
  });
  const [olvide, setOlvide] = useState(false);
  // Desde Mi AvantCode con verificación en dos pasos llega con el desafío.
  const location = useLocation();
  const [desafio, setDesafio] = useState(() => location.state?.desafio || null);
  const [codigo, setCodigo] = useState("");

  const cambiar = (campo) => (valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((x) => ({ ...x, [campo]: undefined }));
    setAviso("");
  };

  const terminar = (sesion) => {
    guardarSesion(sesion);
    // Si llegó desde un enlace del panel (p. ej. el QR del kiosco), vuelve ahí.
    const volver = new URLSearchParams(window.location.search).get("volver");
    navigate(sesion.usuario.debe_cambiar_contrasena ? "/primer-acceso" : volver && volver.startsWith("/panel") ? volver : "/panel", { replace: true });
  };

  const entrar = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!datos.correo.trim()) e.correo = "El correo es requerido";
    else if (!/^\S+@\S+\.\S+$/.test(datos.correo.trim())) e.correo = "Correo inválido";
    if (!datos.contrasena) e.contrasena = "La contraseña es requerida";
    setErrores(e);
    if (Object.keys(e).length) return;

    setCargando(true);
    setAviso("");
    try {
      const r = await api("/auth/entrar", { metodo: "POST", datos: { correo: datos.correo.trim(), contrasena: datos.contrasena } });
      if (r.dos_pasos) {
        setDesafio(r.desafio);
        setCodigo("");
      } else terminar(r);
    } catch (error) {
      setAviso(error.message);
    } finally {
      setCargando(false);
    }
  };

  const verificar = async (ev) => {
    ev.preventDefault();
    setCargando(true);
    setAviso("");
    try {
      terminar(await api("/auth/dos-pasos", { metodo: "POST", datos: { desafio, codigo } }));
    } catch (error) {
      setAviso(error.message);
      if (error.codigo === "DESAFIO_VENCIDO") setDesafio(null);
    } finally {
      setCargando(false);
    }
  };

  const boton = (texto, deshabilitado = false) => (
    <button type="submit" disabled={cargando || deshabilitado} className="btn-primary btn-lg w-full">
      {cargando ? (
        <>
          <span className="cargador cargador-sm border-white/30 border-t-white" />
          {texto}…
        </>
      ) : (
        <>
          {texto}
          <ArrowRight className="h-[18px] w-[18px]" />
        </>
      )}
    </button>
  );

  let contenido;
  if (olvide) {
    contenido = (
      <div>
        <h1 className="pagina-titulo text-[1.75rem]">Recupera tu acceso</h1>
        <p className="pagina-sub">
          Si eres parte de un equipo, pídele al dueño de tu empresa que te envíe una contraseña temporal nueva desde
          Personas. Si eres el dueño, escríbenos a contacto@avantcode.mx.
        </p>
        <button type="button" className="btn-secondary btn-lg mt-6 w-full" onClick={() => setOlvide(false)}>
          Volver a iniciar sesión
        </button>
      </div>
    );
  } else if (desafio) {
    contenido = (
      <>
        <span className="app-icono app-icono-tinta mb-4">
          <ShieldCheck />
        </span>
        <h1 className="pagina-titulo text-[1.75rem]">Verificación en dos pasos</h1>
        <p className="pagina-sub">Escribe el código de 6 dígitos de tu app autenticadora, o uno de tus códigos de respaldo.</p>
        <form onSubmit={verificar} className="mt-6 space-y-5" noValidate>
          <input
            className="input-field text-center font-mono text-lg tracking-[.3em]"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            maxLength={9}
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, ""));
              setAviso("");
            }}
            placeholder="000000"
            aria-label="Código de verificación"
          />
          {aviso && (
            <p className="ctl-aviso" role="alert">
              {aviso}
            </p>
          )}
          {boton("Verificar", codigo.replace("-", "").length < 6)}
        </form>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-3 hover:text-tinta"
          onClick={() => {
            setDesafio(null);
            setAviso("");
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
      </>
    );
  } else {
    contenido = (
      <>
        <h1 className="pagina-titulo text-[2rem]">Bienvenido de vuelta</h1>
        <p className="pagina-sub">Accede a AvantCode Control para continuar.</p>
        <form onSubmit={entrar} className="mt-7 space-y-5" noValidate>
          <div>
            <label htmlFor="correo" className="label">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3" />
              <input
                id="correo"
                type="email"
                autoComplete="email"
                className="input-field pl-11"
                placeholder="tu@empresa.com"
                value={datos.correo}
                onChange={(e) => cambiar("correo")(e.target.value)}
                aria-invalid={errores.correo ? "true" : "false"}
              />
            </div>
            {errores.correo && <p className="campo-error">{errores.correo}</p>}
          </div>
          <CampoContrasena
            id="contrasena"
            etiqueta="Contraseña"
            valor={datos.contrasena}
            onCambio={cambiar("contrasena")}
            autoComplete="current-password"
            error={errores.contrasena}
            accion={
              <button
                type="button"
                className="mb-2 text-[13px] font-medium text-tinta-3 underline-offset-2 hover:text-tinta hover:underline"
                onClick={() => setOlvide(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            }
          />
          {aviso && (
            <p className="ctl-aviso" role="alert">
              {aviso}
            </p>
          )}
          {boton("Iniciar sesión")}
        </form>
      </>
    );
  }

  return (
    <AccesoLayout
      pie={
        !olvide &&
        !desafio && (
          <p className="mt-6 text-center text-sm text-tinta-3">
            ¿Tu empresa aún no tiene AvantCode Control?{" "}
            <a className="font-semibold text-tinta underline-offset-2 hover:underline" href="https://avantcode.mx/control">
              Conócelo y cotiza
            </a>
          </p>
        )
      }
    >
      <div className="glass rounded-[28px] p-6 sm:p-8">{contenido}</div>
    </AccesoLayout>
  );
}

export default Entrar;
