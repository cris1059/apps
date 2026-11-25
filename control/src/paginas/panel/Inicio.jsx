import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bloque, Caja, Columnas, Kpis, Lista, fmt } from "../../componentes/demo/Bloques";
import MiUbicacion from "../../componentes/MiUbicacion";
import { api, useSesion } from "../../sesion";
import { duracion, gestionaJornada, lugarDe, TIPOS } from "../jornada/comun";

/*
  Inicio (igual que en la demo): para quien administra, los indicadores del
  día y del mes, la asistencia de los últimos 7 días, el equipo de hoy, las
  alertas y la actividad reciente. Para cada persona: su jornada de hoy,
  su sucursal o su ubicación, y sus accesos.
*/

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/* Cómo marcó (como en la demo: «desde el celular», «kiosco de Matriz»…). */
const comoMarco = (m) => {
  if (!m) return "";
  if (m.metodo === "kiosco") return (m.lugar || "kiosco").replace(/^Kiosco · /, "kiosco ");
  if (m.metodo === "qr") return "con el QR del kiosco";
  if (m.metodo === "correccion") return "corrección aprobada";
  return m.aproximada ? "desde computadora" : "desde el celular";
};

const estadoPersona = (p) => {
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  if (p.estado === "trabajando") return p.retardo > 0 ? { texto: "Llegó tarde", tono: "aviso" } : { texto: "Trabajando", tono: "ok" };
  if (p.estado === "descanso") return { texto: "En descanso", tono: "info" };
  if (p.estado === "salio") return { texto: "Salió", tono: "neutro" };
  if (p.estado === "sin_salida") return { texto: "Sin salida", tono: "aviso" };
  if (p.estado === "descansa") return { texto: "Descansa hoy", tono: "neutro" };
  if (p.turno && minutos(p.turno.entrada) > ahoraMin) return { texto: "Más tarde", tono: "info" };
  return { texto: "Sin entrada", tono: "aviso" };
};

function InicioEquipo() {
  const sesion = useSesion();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      api("/jornada/inicio")
        .then((r) => vivo && (setD(r), setError("")))
        .catch((e) => vivo && setError(e.message));
    cargar();
    const t = setInterval(() => !document.hidden && cargar(), 60000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  if (error) return <Bloque><p className="ctl-aviso">{error}</p></Bloque>;
  if (!d) return <Bloque><p className="dm-vacio">Cargando…</p></Bloque>;

  const k = d.kpis;
  const dia = Number(d.fecha.slice(8, 10));
  const mes = MESES[Number(d.fecha.slice(5, 7)) - 1];
  const tarde = k.retardos[0];
  const kpis = [
    { etiqueta: "Trabajando ahora", valor: String(k.trabajando), delta: `De ${k.personas} ${k.personas === 1 ? "persona" : "personas"}` },
    { etiqueta: "Entradas de hoy", valor: String(k.entradas_hoy), delta: k.entradas_hoy ? (k.con_ubicacion === k.entradas_hoy ? "Todas con su ubicación" : `${k.con_ubicacion} con su ubicación`) : "Aún nadie entra" },
    { etiqueta: "Llegadas tarde", valor: String(k.retardos.length), delta: tarde ? `${tarde.nombre.split(" ").slice(0, 2).join(" ")}, ${tarde.minutos} min` : "Nadie llegó tarde", tono: tarde ? undefined : "bien" },
    { etiqueta: "Ausencias", valor: String(k.ausencias), delta: k.ausencias ? "Sin entrada todavía" : "Nadie faltó hoy", tono: k.ausencias ? undefined : "bien" },
    { etiqueta: "Horas del periodo", valor: `${fmt(k.horas_mes)} h`, delta: `Del 1 al ${dia} de ${mes}` },
    { etiqueta: "Horas extra del periodo", valor: `${fmt(Math.round((k.extra_mes.dobles + k.extra_mes.triples) * 10) / 10)} h`, delta: `${fmt(Math.round(k.extra_mes.dobles * 10) / 10)} dobles · ${fmt(Math.round(k.extra_mes.triples * 10) / 10)} triples` },
    ...(k.costo_extra !== null ? [{ etiqueta: "Costo de horas extra", valor: fmt(Math.round(k.costo_extra), "pesos"), delta: "Periodo en curso (aprobadas)" }] : []),
    { etiqueta: "Solicitudes sin resolver", valor: String(k.solicitudes), delta: k.solicitudes ? "Correcciones y horas extra" : "Todo resuelto", tono: k.solicitudes ? undefined : "bien" },
  ];
  const sucursales = [...new Set(d.equipo.map((p) => p.sucursal).filter(Boolean))];

  return (
    <>
      <Bloque>
        <Kpis datos={kpis} />
      </Bloque>
      <Bloque ancho="mitad">
        <Columnas titulo="Asistencia de los últimos 7 días" sub="Personas con entrada registrada" datos={d.asistencia} />
      </Bloque>
      <Bloque ancho="mitad">
        <Lista
          titulo="Tu equipo hoy"
          sub={`${d.equipo.length} ${d.equipo.length === 1 ? "persona" : "personas"}${sucursales.length === 1 ? ` · ${sucursales[0]}` : ""}`}
          vacio="Nadie registra jornada todavía: da de alta a tu equipo en Empleados."
          items={d.equipo.map((p) => ({
            clave: p.id,
            hora: p.entrada || p.turno?.entrada,
            titulo: p.nombre,
            sub: [p.puesto, p.ultima ? comoMarco(p.ultima) : p.turno ? `turno de ${p.turno.entrada} a ${p.turno.salida}` : "sin turno"].filter(Boolean).join(" · "),
            estado: estadoPersona(p),
            onClick: () => navigate("/panel/entradas-y-salidas"),
          }))}
        />
      </Bloque>
      <Bloque ancho="mitad">
        <Lista
          titulo="Alertas"
          sub="Lo que necesita atención hoy"
          vacio="Todo en orden por hoy."
          items={d.alertas.map((a, i) => ({ clave: i, titulo: a.titulo, sub: a.sub, estado: a.estado, onClick: a.enlace ? () => navigate(a.enlace) : undefined }))}
        />
      </Bloque>
      <Bloque ancho="mitad">
        <Lista
          titulo="Actividad reciente"
          sub={sesion.empresa.nombre}
          vacio="Aún no hay registros hoy."
          items={d.recientes.map((m) => ({
            clave: m.id,
            hora: m.hora_local,
            titulo: `${TIPOS[m.tipo].texto} ${comoMarco(m)}`,
            sub: [m.persona, lugarDe(m), m.distancia != null ? `${m.distancia} m` : null].filter(Boolean).join(" · "),
            estado: m.aproximada
              ? { texto: "Aproximada", tono: "neutro" }
              : m.estado === "fuera_de_zona"
                ? { texto: "Por validar", tono: "alerta" }
                : m.estado === "validado"
                  ? { texto: "Validado", tono: "ok" }
                  : { texto: "Registrado", tono: "neutro" },
          }))}
        />
      </Bloque>
    </>
  );
}

function InicioPersona() {
  const sesion = useSesion();
  const navigate = useNavigate();
  const [hoy, setHoy] = useState(null);
  useEffect(() => {
    api("/jornada/hoy")
      .then(setHoy)
      .catch(() => setHoy(null));
  }, []);
  const r = hoy?.resumen;
  const estado = !hoy
    ? "…"
    : hoy.terminada
      ? "Terminada"
      : r?.abierta
        ? r.enDescanso
          ? "En descanso"
          : "Trabajando"
        : "Sin entrada";
  return (
    <>
      <Bloque>
        <Kpis
          datos={[
            { etiqueta: "Mi jornada de hoy", valor: estado, delta: hoy?.terminada ? `De ${hoy.terminada.entrada} a ${hoy.terminada.salida}` : r?.abierta ? `Llevas ${duracion(r.minutosTrabajados)}` : "Regístrala en Entradas y salidas" },
            { etiqueta: "Mi turno", valor: hoy?.turno ? `${hoy.turno.entrada}–${hoy.turno.salida}` : "—", delta: hoy?.turno?.nombre || "Sin turno asignado" },
            { etiqueta: "Mi lugar", valor: hoy?.lugar?.nombre || "—", delta: hoy?.lugar?.con_geocerca ? `Geocerca de ${hoy.lugar.radio} m` : "Sin geocerca" },
            { etiqueta: "Registros de hoy", valor: String(hoy?.hoy?.length ?? 0), delta: "Entradas, descansos y salidas" },
          ]}
        />
      </Bloque>
      {sesion.usuario.registra_jornada !== false && (
        <Bloque ancho="mitad">
          <Caja titulo="Marcar mi jornada" sub="Registra tu entrada, tus descansos y tu salida; cada registro guarda la hora y tu ubicación.">
            <div className="dm-reloj-botones" style={{ justifyContent: "flex-start" }}>
              <button type="button" className="dm-btn dm-btn--acento" onClick={() => navigate("/panel/entradas-y-salidas")}>
                Marcar mi jornada
              </button>
              {hoy?.hay_kiosco && hoy?.metodo_marcaje !== "app" && (
                <button type="button" className="dm-btn" onClick={() => navigate("/panel/entradas-y-salidas?escanear=1")}>
                  Marcar con QR del kiosco
                </button>
              )}
            </div>
          </Caja>
        </Bloque>
      )}
      <Bloque ancho="mitad">
        <Lista
          titulo="Accesos"
          items={[
            { clave: "act", titulo: "Mis actividades", sub: "Las tareas que te asignaron", onClick: () => navigate("/panel/actividades") },
            { clave: "sol", titulo: "Mis solicitudes", sub: "Tus registros y tus correcciones", onClick: () => navigate("/panel/mis-registros") },
            { clave: "cta", titulo: "Mi cuenta", sub: "Contraseña, verificación en dos pasos y PIN del kiosco", onClick: () => navigate("/panel/cuenta") },
          ]}
        />
      </Bloque>
      <Bloque>
        <MiUbicacion lugar={hoy ? hoy.lugar : undefined} />
      </Bloque>
    </>
  );
}

function Inicio() {
  const sesion = useSesion();
  return gestionaJornada(sesion) ? <InicioEquipo /> : <InicioPersona />;
}

export default Inicio;
