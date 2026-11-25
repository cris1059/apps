import { useCallback, useEffect, useRef, useState } from "react";
import { Coffee, Delete, LoaderCircle, LogIn, LogOut } from "lucide-react";
import Marca from "../componentes/Marca";
import QRPuntos from "../componentes/QRPuntos";

/*
  Kiosco (control.avantcode.mx/kiosco): una tableta o computadora en la
  sucursal. Se activa una vez con el código que da «Kioscos y dispositivos»;
  luego cada persona marca con su número de empleado y su PIN, o escanea
  con su celular el código QR temporal (cambia cada 30 s). El marcaje lleva
  la ubicación fija de la sucursal.
*/

const CLAVE = "avantcode_control_kiosco";
const TIPOS = {
  entrada: { texto: "Registrar entrada", Icono: LogIn },
  inicio_descanso: { texto: "Iniciar descanso", Icono: Coffee },
  fin_descanso: { texto: "Terminar descanso", Icono: Coffee },
  salida: { texto: "Registrar salida", Icono: LogOut },
};

const leerLlave = () => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};
const guardarLlave = (v) => {
  try {
    if (v) localStorage.setItem(CLAVE, v);
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: se pedirá el código otra vez */
  }
};

async function pedir(ruta, { metodo = "GET", datos, llave } = {}) {
  const r = await fetch(`/api/kiosco${ruta}`, {
    method: metodo,
    headers: { ...(llave ? { Authorization: `Kiosco ${llave}` } : {}), ...(datos ? { "Content-Type": "application/json" } : {}) },
    body: datos ? JSON.stringify(datos) : undefined,
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(cuerpo.error || "No se pudo completar. Intenta de nuevo.");
    e.codigo = cuerpo.codigo;
    throw e;
  }
  return cuerpo;
}

function Activar({ onActivado }) {
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await pedir("/activar", { metodo: "POST", datos: { codigo } });
      guardarLlave(r.llave);
      onActivado(r.llave);
    } catch (error) {
      setAviso(error.message);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-negro p-6">
      <form onSubmit={enviar} className="card w-full max-w-md space-y-4">
        <Marca />
        <h1 className="text-2xl font-semibold tracking-tight text-tinta">Activar este kiosco</h1>
        <p className="text-sm text-tinta-3">Escribe el código que te dio quien administra AvantCode Control en «Kioscos y dispositivos». Vale 24 horas y una sola vez.</p>
        <input
          className="input-field text-center text-2xl font-semibold uppercase tracking-[.2em]"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="XXXX-XXXX"
          maxLength={9}
          autoFocus
          aria-label="Código de activación"
        />
        {aviso && <p className="ctl-aviso">{aviso}</p>}
        <button type="submit" className="btn-primary w-full" disabled={enviando || codigo.replace(/[^a-z0-9]/gi, "").length < 8}>
          {enviando ? "Activando…" : "Activar"}
        </button>
      </form>
    </div>
  );
}

function Teclado({ onDigito, onBorrar }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "borrar"].map((t, i) =>
        t === "" ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            className="h-16 rounded-2xl bg-black/[.05] text-2xl font-semibold text-tinta transition-colors active:bg-black/15"
            onClick={() => (t === "borrar" ? onBorrar() : onDigito(t))}
            aria-label={t === "borrar" ? "Borrar" : t}
          >
            {t === "borrar" ? <Delete className="mx-auto h-6 w-6" /> : t}
          </button>
        )
      )}
    </div>
  );
}

function Pantalla({ llave, onInactivo }) {
  const [estado, setEstado] = useState(null);
  const [desfase, setDesfase] = useState(0);
  const [ahora, setAhora] = useState(new Date());
  const [qr, setQr] = useState("");
  const [paso, setPaso] = useState("numero"); // numero | pin | elegir | listo
  const [numero, setNumero] = useState("");
  const [pin, setPin] = useState("");
  const [persona, setPersona] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const reinicio = useRef(null);

  const reiniciar = useCallback(() => {
    setPaso("numero");
    setNumero("");
    setPin("");
    setPersona(null);
  }, []);

  const cargar = useCallback(async () => {
    try {
      const e = await pedir("/estado", { llave });
      setDesfase(new Date(e.ahora).getTime() - Date.now());
      setEstado(e);
      // El enlace del QR: con la cámara normal abre el panel; con «Marcar con QR» se lee dentro de la app.
      setQr(`${(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)}/panel/marcar?k=${encodeURIComponent(e.qr)}`);
    } catch (error) {
      if (error.codigo === "KIOSCO_INACTIVO") onInactivo();
    }
  }, [llave, onInactivo]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 25000);
    const r = setInterval(() => setAhora(new Date(Date.now() + desfase)), 1000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, [cargar, desfase]);

  // Sin actividad por 30 s, vuelve al inicio (nadie deja su sesión abierta).
  useEffect(() => {
    clearTimeout(reinicio.current);
    if (paso !== "numero" || numero) reinicio.current = setTimeout(reiniciar, paso === "listo" ? 5000 : 30000);
    return () => clearTimeout(reinicio.current);
  }, [paso, numero, pin, reiniciar]);

  const identificar = async () => {
    setOcupado(true);
    setMensaje(null);
    try {
      const r = await pedir("/identificar", { metodo: "POST", datos: { numero, pin }, llave });
      setPersona(r);
      setPaso("elegir");
    } catch (error) {
      setMensaje({ tono: "error", texto: error.message });
      setPin("");
      if (error.codigo === "KIOSCO_INACTIVO") onInactivo();
    } finally {
      setOcupado(false);
    }
  };

  const marcar = async (tipo) => {
    setOcupado(true);
    try {
      const r = await pedir("/marcar", { metodo: "POST", datos: { numero, pin, tipo }, llave });
      setMensaje({ tono: "ok", texto: r.mensaje });
    } catch (error) {
      setMensaje({ tono: "error", texto: error.message });
    } finally {
      setOcupado(false);
      setPaso("listo");
    }
  };

  const digito = (d) => {
    setMensaje(null);
    if (paso === "numero") setNumero((n) => (n + d).slice(0, 20));
    else if (paso === "pin") setPin((p) => (p + d).slice(0, 6));
  };
  const borrar = () => (paso === "numero" ? setNumero((n) => n.slice(0, -1)) : setPin((p) => p.slice(0, -1)));

  useEffect(() => {
    const tecla = (e) => {
      if (/^\d$/.test(e.key)) digito(e.key);
      else if (e.key === "Backspace") borrar();
      else if (e.key === "Enter") {
        if (paso === "numero" && numero) setPaso("pin");
        else if (paso === "pin" && pin.length >= 4) identificar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  const hora = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: estado?.sucursal?.zona || "America/Mexico_City" });
  return (
    <div className="grid min-h-screen gap-6 bg-[#f3f3f3] p-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="card flex flex-col items-center justify-center gap-4 text-center">
        <Marca />
        <p className="text-sm text-tinta-3">
          {estado ? `${estado.empresa.nombre} · ${estado.sucursal.nombre} · ${estado.kiosco.nombre}` : "Cargando…"}
        </p>
        <p className="text-[clamp(56px,9vw,104px)] font-semibold leading-none tracking-tight text-tinta tabular-nums">{hora}</p>
        {qr && (
          <figure className="mt-2 flex flex-col items-center gap-2">
            {/* El mismo QR de puntos con el logo que usan los demás de AvantCode. */}
            <span className="rounded-3xl bg-white p-4 shadow-sm">
              <QRPuntos valor={qr} tamano={250} titulo="Código QR temporal para marcar desde el celular" />
            </span>
            <figcaption className="max-w-xs text-sm text-tinta-3">
              Desde tu celular: abre AvantCode Control › Entradas y salidas › <b>Marcar con QR del kiosco</b> y apunta a este código. Cambia cada 30 segundos.
            </figcaption>
          </figure>
        )}
      </section>

      <section className="card flex flex-col justify-center gap-4">
        {paso === "elegir" && persona ? (
          <>
            <p className="text-3xl font-semibold tracking-tight text-tinta">Hola, {persona.persona.nombre}.</p>
            {persona.siguientes.length ? (
              <div className="grid gap-3">
                {persona.siguientes.map((t) => {
                  const { texto, Icono } = TIPOS[t];
                  return (
                    <button key={t} type="button" className={`${t === "entrada" || t === "salida" ? "btn-primary" : "btn-secondary"} h-16 text-lg`} disabled={ocupado} onClick={() => marcar(t)}>
                      {ocupado ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Icono className="h-5 w-5" />} {texto}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="ctl-aviso ctl-aviso--suave">Tu jornada de hoy ya terminó. Si marcaste tu salida por error, pide una corrección desde tu celular.</p>
            )}
            <button type="button" className="btn-ghost" onClick={reiniciar}>
              No soy yo
            </button>
          </>
        ) : paso === "listo" ? (
          <>
            <p className={mensaje?.tono === "ok" ? "ctl-ok text-lg" : "ctl-aviso text-lg"} role="status">
              {mensaje?.texto}
            </p>
            <button type="button" className="btn-secondary" onClick={reiniciar}>
              Listo
            </button>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-tinta-3">{paso === "numero" ? "Tu número de empleado" : "Tu PIN"}</p>
              <p className="mt-1 h-14 rounded-2xl bg-black/[.04] px-4 text-3xl font-semibold leading-[56px] tracking-[.2em] text-tinta tabular-nums">
                {paso === "numero" ? numero || " " : "•".repeat(pin.length) || " "}
              </p>
            </div>
            {mensaje && <p className="ctl-aviso">{mensaje.texto}</p>}
            <Teclado onDigito={digito} onBorrar={borrar} />
            {paso === "numero" ? (
              <button type="button" className="btn-primary h-14 text-lg" disabled={!numero} onClick={() => setPaso("pin")}>
                Continuar
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-secondary h-14" onClick={reiniciar}>
                  Volver
                </button>
                <button type="button" className="btn-primary h-14 text-lg" disabled={pin.length < 4 || ocupado} onClick={identificar}>
                  {ocupado ? "Revisando…" : "Entrar"}
                </button>
              </div>
            )}
            <p className="text-center text-[13px] text-tinta-3">Tu PIN lo creas en control.avantcode.mx › Mi cuenta.</p>
          </>
        )}
      </section>
    </div>
  );
}

function Kiosco() {
  const [llave, setLlave] = useState(leerLlave);
  const inactivo = useCallback(() => {
    guardarLlave(null);
    setLlave(null);
  }, []);
  return llave ? <Pantalla llave={llave} onInactivo={inactivo} /> : <Activar onActivado={setLlave} />;
}

export default Kiosco;
