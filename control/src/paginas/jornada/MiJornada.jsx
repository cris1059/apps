import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Coffee, LoaderCircle, LogIn, LogOut, Play, QrCode } from "lucide-react";
import { Bloque, Estado } from "../../componentes/demo/Bloques";
import EscanerQR from "../../componentes/EscanerQR";
import MiUbicacion from "../../componentes/MiUbicacion";
import { api, useSesion } from "../../sesion";
import { ESTADOS_MARCAJE, TIPOS, esComputadora, lugarDe, ubicacionActual } from "./comun";

/*
  «Mi jornada» (igual que en la demo, dentro de Entradas y salidas): reloj
  con la hora del servidor, el estado, el turno, el tiempo trabajado hoy y
  los botones para registrar entrada, descanso y salida con la ubicación
  del momento. A un lado, «Mis marcajes de hoy»; debajo, «Tu ubicación».
  Reglas: aviso de ubicación antes del primer marcaje, una jornada por día,
  desde la PC la ubicación queda aproximada y con el QR del kiosco (?k=…)
  se marca en esa sucursal.
*/

const ICONOS = { entrada: LogIn, inicio_descanso: Coffee, fin_descanso: Play, salida: LogOut };
const TONO_MARCAJE = { validado: "ok", fuera_de_zona: "aviso", registrado: "neutro", corregido: "info", sincronizado_tarde: "info" };
const dosDigitos = (n) => String(n).padStart(2, "0");
const reloj = (seg) => `${dosDigitos(Math.floor(seg / 3600))}:${dosDigitos(Math.floor((seg % 3600) / 60))}:${dosDigitos(Math.floor(seg % 60))}`;

function MiJornada() {
  const sesion = useSesion();
  const [parametros] = useSearchParams();
  // El código del kiosco: leído aquí con «Marcar con QR» o llegado en el enlace (?k=…).
  const [qr, setQr] = useState(parametros.get("k"));
  const [escaneando, setEscaneando] = useState(parametros.get("escanear") === "1");
  const [datos, setDatos] = useState(null);
  const [cargadoEn, setCargadoEn] = useState(Date.now());
  const [desfase, setDesfase] = useState(0);
  const [ahora, setAhora] = useState(Date.now());
  const [error, setError] = useState("");
  const [marcando, setMarcando] = useState(null);
  const [paso, setPaso] = useState("");
  const [resultado, setResultado] = useState(null);
  const [aceptando, setAceptando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const d = await api("/jornada/hoy");
      setDesfase(new Date(d.ahora).getTime() - Date.now());
      setDatos(d);
      setCargadoEn(Date.now());
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && cargar(), 60000);
    const r = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, [cargar]);

  const aceptarAviso = async () => {
    setAceptando(true);
    try {
      await api("/jornada/aviso-ubicacion", { metodo: "POST" });
      await cargar();
    } catch (e) {
      setResultado({ tono: "alerta", texto: e.message });
    } finally {
      setAceptando(false);
    }
  };

  const marcar = async (tipo, codigo = qr) => {
    setMarcando(tipo);
    setResultado(null);
    setPaso("ubicando");
    try {
      const pc = esComputadora();
      // Con el QR del kiosco no hace falta esperar a que el GPS se afine: el kiosco ya dice dónde estás.
      const ubicacion = await ubicacionActual(pc || codigo ? { despuesDeLaPrimera: 300, maximo: 8000 } : undefined);
      setPaso("guardando");
      const r = await api("/jornada/marcar", {
        metodo: "POST",
        datos: { tipo, ...ubicacion, equipo: pc ? "computadora" : "celular", hora_dispositivo: new Date().toISOString(), ...(codigo ? { qr: codigo } : {}) },
      });
      setResultado({ tono: r.ubicacion.estado === "fuera_de_zona" ? "aviso" : "ok", texto: r.mensaje });
      if (codigo) setQr(null);
      await cargar();
    } catch (e) {
      setResultado({ tono: "alerta", texto: e.message });
      if (e.codigo === "QR") setQr(null);
      if (["ORDEN", "JORNADA_TERMINADA", "AVISO_UBICACION"].includes(e.codigo)) cargar();
    } finally {
      setMarcando(null);
      setPaso("");
    }
  };

  /* Al leer el QR: si solo hay una opción (o es la entrada), se marca de una vez; si no, la persona elige. */
  const alLeerQR = (clave) => {
    setEscaneando(false);
    setQr(clave);
    const s = datos?.siguientes || [];
    if (s.includes("entrada")) marcar("entrada", clave);
    else if (s.length === 1) marcar(s[0], clave);
    else setResultado({ tono: "info", texto: "Código del kiosco leído: elige qué registrar." });
  };

  if (error && !datos) return <Bloque><p className="ctl-aviso">{error}</p></Bloque>;
  if (!datos) return <Bloque><p className="dm-vacio">Cargando tu jornada…</p></Bloque>;
  if (!datos.registra_jornada) {
    return (
      <Bloque>
        <section className="dm-caja">
          <header className="dm-caja-enc">
            <div>
              <h2>Mi jornada</h2>
              <p>
                {sesion.usuario.rol === "dueno"
                  ? "Como dueño, no registras jornada. Si también quieres marcar tu entrada y tu salida, actívalo en Empleados › Jornada."
                  : "Tu empresa no te pidió registrar jornada. Sigues usando el sistema para tus demás tareas."}
              </p>
            </div>
          </header>
        </section>
      </Bloque>
    );
  }

  const r = datos.resumen;
  const enCurso = r?.abierta && !r.enDescanso;
  const segundosTrabajados = (r?.minutosTrabajados || 0) * 60 + (enCurso ? Math.floor((ahora - cargadoEn) / 1000) : 0);
  const horaServidor = new Date(ahora + desfase).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: datos.zona });
  const estado = datos.terminada
    ? { texto: "Jornada de hoy terminada", tono: "neutro" }
    : r?.abierta
      ? r.enDescanso
        ? { texto: "En descanso", tono: "info" }
        : { texto: "Trabajando", tono: "ok" }
      : { texto: "Sin entrada registrada", tono: "neutro" };
  const turno = datos.turno
    ? `${datos.turno.nombre} · ${datos.turno.entrada} a ${datos.turno.salida}${datos.lugar ? ` · ${datos.lugar.nombre}` : ""}${datos.turno.hoy ? "" : " (hoy descansas)"}`
    : `Sin turno asignado${datos.lugar ? ` · ${datos.lugar.nombre}` : ""}`;
  const pc = esComputadora();

  return (
    <>
      <Bloque>
        <div className="dm-reloj">
          <section className="dm-caja dm-reloj-panel" aria-label="Mi jornada">
            <p className="dm-reloj-fecha">Mi jornada</p>
            <p className="dm-reloj-ayuda">Aquí registras tu propia entrada, tus descansos y tu salida de hoy.</p>
            <p className="dm-reloj-hora" role="timer">
              {horaServidor}
            </p>
            <Estado texto={estado.texto} tono={estado.tono} />
            {qr && <Estado texto="Marcando con el código QR del kiosco" tono="info" />}
            <dl className="dm-reloj-datos">
              <div>
                <dt>Mi turno</dt>
                <dd>{turno}</dd>
              </div>
              <div>
                <dt>Tiempo trabajado hoy</dt>
                <dd>{reloj(segundosTrabajados)}</dd>
              </div>
            </dl>

            <div className="dm-reloj-botones">
              {!datos.acepto_ubicacion ? (
                <div className="dm-reloj-fin" style={{ textAlign: "left" }}>
                  <strong>Antes de tu primer registro: cómo se usa tu ubicación.</strong> Cada vez que marcas tu entrada, un descanso o tu salida, se
                  guarda la hora y la ubicación de tu celular o computadora en ese momento, con su precisión. Se guarda solo cuando marcas: no te sigue
                  durante el día. La ven quienes administran tu empresa, para saber si marcaste en tu lugar de trabajo.{" "}
                  <a href="https://avantcode.mx/legal/sistemas/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">
                    Aviso de privacidad
                  </a>
                  .
                  <div style={{ marginTop: 10 }}>
                    <button type="button" className="dm-btn dm-btn--acento" onClick={aceptarAviso} disabled={aceptando}>
                      {aceptando ? "Guardando…" : "Entendido, acepto"}
                    </button>
                  </div>
                </div>
              ) : (
                // «En el kiosco»: los botones salen hasta leer el QR (el servidor también lo exige).
                (datos.metodo_marcaje !== "kiosco" || qr ? datos.siguientes : []).map((tipo) => {
                  const Icono = ICONOS[tipo];
                  const principal = tipo === "entrada" || tipo === "salida" || datos.siguientes.length === 1;
                  return (
                    <button key={tipo} type="button" className={`dm-btn${principal ? " dm-btn--acento" : ""}`} onClick={() => marcar(tipo)} disabled={!!marcando}>
                      {marcando === tipo ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Icono size={16} aria-hidden="true" />}{" "}
                      {marcando === tipo ? (paso === "ubicando" ? "Obteniendo tu ubicación…" : "Guardando…") : TIPOS[tipo].accion}
                    </button>
                  );
                })
              )}
              {datos.acepto_ubicacion && datos.siguientes.length > 0 && !qr && datos.metodo_marcaje !== "app" && datos.hay_kiosco && (
                <button type="button" className={`dm-btn${datos.metodo_marcaje === "kiosco" ? " dm-btn--acento" : ""}`} onClick={() => setEscaneando(true)} disabled={!!marcando}>
                  <QrCode size={16} aria-hidden="true" /> Marcar con QR del kiosco
                </button>
              )}
              {datos.acepto_ubicacion && datos.metodo_marcaje === "kiosco" && !qr && datos.siguientes.length > 0 && (
                <p className="dm-reloj-fin">
                  {datos.hay_kiosco
                    ? "Tu empresa te pide marcar en el kiosco de tu sucursal: escanea su QR o usa tu número y tu PIN en la tableta."
                    : "Tu empresa te pide marcar en el kiosco, pero aún no hay uno activo. Avísale a quien administra."}
                </p>
              )}
              {datos.terminada && (
                <p className="dm-reloj-fin">
                  Tu jornada de hoy quedó registrada (de {datos.terminada.entrada} a {datos.terminada.salida}). Mañana podrás registrar tu entrada. Si marcaste tu salida
                  por error, <Link to="/panel/mis-registros?corregir=1">pide una corrección</Link>.
                </p>
              )}
            </div>
            {resultado && (
              <p style={{ marginTop: 10 }}>
                <Estado texto={resultado.texto} tono={resultado.tono} />
              </p>
            )}
            <p className="dm-reloj-nota">
              {pc
                ? "Estás en una computadora: tu ubicación se guarda como aproximada. En tu celular se guarda la exacta. La hora la pone el servidor, no tu dispositivo."
                : "Cada entrada y salida guarda la ubicación del momento, solo al marcar. La hora la pone el servidor: no depende del reloj de tu dispositivo."}{" "}
              ¿Te pregunta cada vez por la ubicación o la cámara? <Link to="/panel/cuenta#permisos">Déjalas permitidas</Link>.
            </p>
          </section>

          <section className="dm-caja" aria-label="Mis marcajes de hoy">
            <header className="dm-caja-enc">
              <div>
                <h2>Mis marcajes de hoy</h2>
                <p>{datos.marcajes.length ? "Lo más reciente arriba" : "Registra tu entrada para empezar"}</p>
              </div>
            </header>
            {datos.marcajes.length === 0 ? (
              <p className="dm-vacio">Aún no hay marcajes.</p>
            ) : (
              <ul className="dm-lista">
                {[...datos.marcajes].reverse().map((m) => (
                  <li key={m.id}>
                    <span className="dm-lista-hora">{m.hora_local}</span>
                    <span className="dm-lista-texto">
                      <strong>{TIPOS[m.tipo].texto}</strong>
                      <span>
                        {lugarDe(m) || "—"}
                        {m.distancia != null ? ` · a ${m.distancia} m` : ""}
                      </span>
                    </span>
                    <Estado texto={m.aproximada ? "Aproximada" : ESTADOS_MARCAJE[m.estado]?.texto || m.estado} tono={m.aproximada ? "neutro" : TONO_MARCAJE[m.estado] || "neutro"} />
                  </li>
                ))}
              </ul>
            )}
            <p className="dm-reloj-nota" style={{ marginTop: 12 }}>
              ¿Olvidaste marcar? <Link to="/panel/mis-registros?corregir=1">Pide una corrección</Link>.
            </p>
          </section>
        </div>
      </Bloque>
      {datos.acepto_ubicacion && (
        <Bloque>
          <MiUbicacion lugar={datos.lugar} />
        </Bloque>
      )}
      {escaneando && datos.acepto_ubicacion && datos.siguientes.length > 0 && <EscanerQR onLeido={alLeerQR} onCerrar={() => setEscaneando(false)} />}
    </>
  );
}

export default MiJornada;
