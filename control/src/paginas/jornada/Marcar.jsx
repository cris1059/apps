import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, Coffee, LoaderCircle, LogIn, LogOut, MapPin, Navigation, TriangleAlert } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import MiUbicacion from "../../componentes/MiUbicacion";
import { api, useSesion } from "../../sesion";
import { ESTADOS_MARCAJE, MODALIDADES, TIPOS, duracion, esComputadora, fechaLarga, lugarDe, ubicacionActual } from "./comun";

/*
  Marcar: la pantalla principal de cada persona. Reloj, cómo va su jornada,
  su horario y su lugar, y el botón para registrar entrada, descanso o
  salida con la ubicación del momento (el teléfono la pide al marcar).
*/

const ICONOS = { entrada: LogIn, inicio_descanso: Coffee, fin_descanso: Coffee, salida: LogOut };

function Reloj({ desfase }) {
  const [ahora, setAhora] = useState(() => new Date(Date.now() + desfase));
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date(Date.now() + desfase)), 1000);
    return () => clearInterval(t);
  }, [desfase]);
  return (
    <p className="jr-reloj" aria-live="off">
      {ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </p>
  );
}

function Marcar() {
  const sesion = useSesion();
  const [datos, setDatos] = useState(null);
  const [desfase, setDesfase] = useState(0);
  const [error, setError] = useState("");
  const [marcando, setMarcando] = useState(null); // tipo en curso
  const [paso, setPaso] = useState(""); // "ubicando" | "guardando"
  const [resultado, setResultado] = useState(null);
  const [aceptando, setAceptando] = useState(false);
  // Código QR temporal del kiosco (si llegó escaneándolo): va con el marcaje y vence en ~1 minuto.
  const [parametros] = useSearchParams();
  const qr = parametros.get("k");

  const aceptarAviso = async () => {
    setAceptando(true);
    try {
      await api("/jornada/aviso-ubicacion", { metodo: "POST" });
      await cargar();
    } catch (e) {
      setResultado({ tono: "error", texto: e.message });
    } finally {
      setAceptando(false);
    }
  };

  const cargar = useCallback(async () => {
    try {
      const d = await api("/jornada/hoy");
      setDesfase(new Date(d.ahora).getTime() - Date.now());
      setDatos(d);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && cargar(), 60000);
    return () => clearInterval(t);
  }, [cargar]);

  const marcar = async (tipo) => {
    setMarcando(tipo);
    setResultado(null);
    setPaso("ubicando");
    try {
      // En la computadora la ubicación es aproximada de todos modos: no hace falta esperar a que «se afine».
      const pc = esComputadora();
      const ubicacion = await ubicacionActual(pc ? { despuesDeLaPrimera: 300, maximo: 8000 } : undefined);
      setPaso("guardando");
      const r = await api("/jornada/marcar", { metodo: "POST", datos: { tipo, ...ubicacion, equipo: pc ? "computadora" : "celular", hora_dispositivo: new Date().toISOString(), ...(qr ? { qr } : {}) } });
      setResultado({ tono: r.ubicacion.estado === "fuera_de_zona" ? "aviso" : "ok", texto: r.mensaje });
      await cargar();
    } catch (e) {
      setResultado({ tono: "error", texto: e.message });
      if (e.codigo === "ORDEN" || e.codigo === "JORNADA_TERMINADA" || e.codigo === "AVISO_UBICACION") cargar();
    } finally {
      setMarcando(null);
      setPaso("");
    }
  };

  const nombre = sesion.usuario.nombre.split(" ")[0];
  const r = datos?.resumen;
  const ultima = datos?.marcajes?.at(-1);
  const estadoJornada = !datos
    ? ""
    : datos.terminada
      ? `Tu jornada de hoy terminó: de ${datos.terminada.entrada} a ${datos.terminada.salida}, trabajaste ${duracion(datos.terminada.minutos)}`
      : r?.abierta
        ? r.enDescanso
          ? `En descanso desde las ${ultima?.hora_local}`
          : `Trabajando desde las ${datos.marcajes[0]?.hora_local} · llevas ${duracion(r.minutosTrabajados)}`
        : r?.salida && datos.hoy.length
          ? `Terminaste a las ${ultima?.hora_local}: trabajaste ${duracion(r.minutosTrabajados)}`
          : "Aún no registras tu entrada";

  return (
    <div className="pagina">
      <Encabezado etiqueta="Registro de jornada" titulo={`Hola, ${nombre}.`} apagado={datos ? fechaLarga(datos.fecha) : ""} />

      {error && <p className="ctl-aviso">{error}</p>}

      {datos && !datos.registra_jornada ? (
        <section className="card">
          {sesion.usuario.rol === "dueno" ? (
            <>
              <p className="font-semibold text-tinta">Como dueño, no registras jornada.</p>
              <p className="mt-1 text-sm text-tinta-3">
                Si también quieres marcar tu entrada y tu salida, actívalo en <Link to="/panel/empleados" className="underline underline-offset-2">Empleados</Link> › Jornada.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-tinta">Tu empresa no te pidió registrar jornada.</p>
              <p className="mt-1 text-sm text-tinta-3">Si crees que es un error, avísale a quien administra AvantCode Control en tu empresa.</p>
            </>
          )}
        </section>
      ) : (
        datos && (
          <>
            <section className="card jr-marcar">
              <Reloj desfase={desfase} />
              {qr && <p className="badge badge-info mx-auto">Marcando con el código QR del kiosco</p>}
              <p className="jr-estado">{estadoJornada}</p>

              {!datos.acepto_ubicacion ? (
                <div className="superficie mx-auto max-w-xl space-y-3 p-4 text-left">
                  <p className="font-semibold text-tinta">Antes de tu primer registro: cómo se usa tu ubicación</p>
                  <p className="text-sm text-tinta-2">
                    Cada vez que marcas tu entrada, un descanso o tu salida, se guarda la hora y la ubicación de tu celular o computadora en ese momento, con su
                    precisión. Se guarda solo cuando marcas: no te sigue durante el día. Mientras tienes abierto el panel, el mapa te muestra dónde estás, solo a ti.
                    La ubicación de cada marcaje la ven quienes administran tu empresa, para saber si marcaste en tu lugar de trabajo, y queda como parte de tu
                    registro de jornada.
                  </p>
                  <p className="text-[13px] text-tinta-3">
                    Más detalles en el{" "}
                    <a className="underline underline-offset-2" href="https://avantcode.mx/legal/sistemas/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">
                      aviso de privacidad
                    </a>
                    .
                  </p>
                  <button type="button" className="btn-primary" onClick={aceptarAviso} disabled={aceptando}>
                    {aceptando ? "Guardando…" : "Entendido, acepto"}
                  </button>
                </div>
              ) : datos.terminada ? (
                <p className="ctl-aviso ctl-aviso--suave">
                  Mañana podrás registrar tu entrada. Si marcaste tu salida por error,{" "}
                  <Link to="/panel/mis-registros?corregir=1" className="underline underline-offset-2">
                    pide una corrección
                  </Link>
                  .
                </p>
              ) : null}

              <div className="jr-acciones">
                {(datos.acepto_ubicacion ? datos.siguientes : []).map((tipo) => {
                  const Icono = ICONOS[tipo];
                  const principal = tipo === "entrada" || tipo === "salida" || (tipo === "fin_descanso" && datos.siguientes.length === 1);
                  return (
                    <button
                      key={tipo}
                      type="button"
                      className={`${principal ? "btn-primary" : "btn-secondary"} jr-boton`}
                      onClick={() => marcar(tipo)}
                      disabled={!!marcando}
                    >
                      {marcando === tipo ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Icono className="h-5 w-5" />}
                      {marcando === tipo ? (paso === "ubicando" ? "Obteniendo tu ubicación…" : "Guardando…") : TIPOS[tipo].accion}
                    </button>
                  );
                })}
              </div>

              {resultado && (
                <p className={resultado.tono === "error" ? "ctl-aviso" : resultado.tono === "aviso" ? "ctl-aviso ctl-aviso--suave" : "ctl-ok"} role="status">
                  {resultado.tono === "aviso" && <TriangleAlert className="mr-1.5 inline h-4 w-4" />}
                  {resultado.texto}
                </p>
              )}

              <div className="jr-datos">
                <span>
                  <MapPin className="h-4 w-4" />
                  {datos.modalidad === "sucursal"
                    ? datos.lugar
                      ? `${datos.lugar.nombre}${datos.lugar.con_geocerca ? ` · dentro de ${datos.lugar.radio} m` : " · sin geocerca"}`
                      : "Aún no tienes sucursal asignada"
                    : MODALIDADES[datos.modalidad].texto}
                </span>
                <span>
                  <Clock className="h-4 w-4" />
                  {datos.turno
                    ? datos.turno.hoy
                      ? `Tu turno: ${datos.turno.entrada} a ${datos.turno.salida} (tolerancia ${datos.turno.tolerancia} min)`
                      : "Hoy no te toca trabajar según tu turno"
                    : "Sin turno asignado"}
                </span>
                <span>
                  <Navigation className="h-4 w-4" />
                  {esComputadora() ? "Desde la computadora tu ubicación se guarda como aproximada; en el celular, exacta." : "Cada registro guarda la hora y tu ubicación del momento."}
                </span>
              </div>
            </section>

            {datos.acepto_ubicacion && <MiUbicacion lugar={datos.lugar} />}

            <section className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-titulo">Tus registros de hoy</h2>
                <Link to="/panel/mis-registros?corregir=1" className="text-sm font-medium text-tinta-3 underline-offset-2 hover:text-tinta hover:underline">
                  ¿Olvidaste marcar? Pide una corrección
                </Link>
              </div>
              {datos.marcajes.length === 0 ? (
                <p className="mt-3 text-sm text-tinta-3">Todavía no hay registros.</p>
              ) : (
                <ol className="jr-linea">
                  {datos.marcajes.map((m) => (
                    <li key={m.id}>
                      <b>{m.hora_local}</b>
                      <span>
                        {TIPOS[m.tipo].texto}
                        <small>
                          {lugarDe(m)}
                          {m.distancia != null ? ` · a ${m.distancia} m` : ""}
                        </small>
                      </span>
                      <span className={`badge ${ESTADOS_MARCAJE[m.estado]?.clase || "badge-neutral"}`}>{ESTADOS_MARCAJE[m.estado]?.texto || m.estado}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )
      )}
      {!datos && !error && <p className="text-sm text-tinta-3">Cargando…</p>}
    </div>
  );
}

export default Marcar;
