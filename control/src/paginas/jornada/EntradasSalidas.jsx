import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Bloque, Estado, Tabla } from "../../componentes/demo/Bloques";
import VerUbicacion from "../../componentes/VerUbicacion";
import { api, useSesion } from "../../sesion";
import MiJornada from "./MiJornada";
import { descargar, duracion, fechaCorta, gestionaJornada, hoyLocal, sumarDias } from "./comun";

/*
  Entradas y salidas (igual que en la demo): arriba «Mi jornada» para quien
  registra; abajo, las entradas y salidas POR FECHA: una fila por persona y
  día con la hora de entrada, la de salida, el descanso y las horas. Quien
  administra ve a su equipo; cada persona, lo suyo.
*/

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/* Hora con su lugar debajo; «Ver ubicación» abre el mapa. */
function Hora({ marca, onVer }) {
  if (!marca) return <span className="dm-hora-sub">—</span>;
  return (
    <>
      <span className="dm-hora">{marca.hora || marca.hora_local}</span>
      <span className="dm-hora-sub">
        {marca.lugar || "—"}
        {marca.aproximada ? " · aproximada (computadora)" : marca.distancia != null ? ` · a ${marca.distancia} m` : ""}
      </span>
      {marca.latitud != null && (
        <button type="button" className="dm-hora-sub" style={{ display: "inline-flex", alignItems: "center", gap: 4, border: 0, background: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }} onClick={() => onVer(marca)}>
          <MapPin size={12} aria-hidden="true" /> Ver ubicación
        </button>
      )}
    </>
  );
}

/* Estado de la jornada: en curso, completa, sin salida, con retardo o fuera de zona. */
const estadoDe = (j) => {
  if (j.abierta) return { texto: "En curso", tono: "info" };
  if (j.sin_salida) return { texto: "Sin salida", tono: "aviso" };
  if (j.fuera_de_zona) return { texto: "Fuera de zona", tono: "alerta" };
  if (j.retardo > 0) return { texto: `Retardo ${j.retardo} min`, tono: "aviso" };
  if (j.entrada?.aproximada || j.salida?.aproximada) return { texto: "Aproximada", tono: "neutro" };
  return { texto: "Completa", tono: "ok" };
};

function EntradasSalidas() {
  const sesion = useSesion();
  const equipo = gestionaJornada(sesion);
  const registra = sesion.usuario.registra_jornada !== false;
  const [filtros, setFiltros] = useState({ desde: sumarDias(hoyLocal(), -6), hasta: hoyLocal(), persona: "" });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [bajando, setBajando] = useState(false);
  const [ver, setVer] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
      if (equipo) {
        setDatos(await api(`/jornada/jornadas?${q}`));
      } else {
        // Lo mío: mis jornadas por fecha (mismas columnas).
        const d = await api(`/jornada/mis-registros?desde=${filtros.desde}&hasta=${filtros.hasta}`);
        setDatos({
          jornadas: d.jornadas.map((j, i) => {
            const primero = j.marcajes[0];
            const ultimo = j.marcajes.at(-1);
            return {
              clave: `${j.fecha}-${i}`,
              fecha: j.fecha,
              persona: { nombre: sesion.usuario.nombre },
              entrada: primero?.tipo === "entrada" ? primero : null,
              salida: ultimo?.tipo === "salida" ? ultimo : null,
              descanso: j.resumen.minutosDescanso,
              trabajado: j.resumen.minutosTrabajados,
              abierta: j.abierta,
              sin_salida: j.sin_salida,
              fuera_de_zona: j.resumen.fueraDeZona,
              retardo: 0,
            };
          }),
        });
      }
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [filtros, equipo, sesion.usuario.nombre]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (c) => (e) => setFiltros((f) => ({ ...f, [c]: e.target.value || f[c] }));
  const excel = async () => {
    setBajando(true);
    try {
      const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)), formato: "csv" });
      await descargar(`/jornada/jornadas?${q}`, `entradas-y-salidas-${filtros.desde}-a-${filtros.hasta}.csv`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBajando(false);
    }
  };

  const columnas = useMemo(
    () => [
      { clave: "fecha", titulo: "Fecha", render: (j) => <span className="dm-hora">{mayuscula(fechaCorta(j.fecha))}</span> },
      ...(equipo
        ? [
            {
              clave: "persona",
              titulo: "Empleado",
              render: (j) => (
                <>
                  <strong>{j.persona.nombre}</strong>
                  <span className="dm-hora-sub">{[j.persona.puesto, j.sucursal].filter(Boolean).join(" · ") || "—"}</span>
                </>
              ),
            },
          ]
        : []),
      { clave: "entrada", titulo: "Entrada", render: (j) => <Hora marca={j.entrada} onVer={(m) => setVer({ marcaje: m, persona: j.persona.nombre })} /> },
      { clave: "salida", titulo: "Salida", render: (j) => <Hora marca={j.salida} onVer={(m) => setVer({ marcaje: m, persona: j.persona.nombre })} /> },
      { clave: "descanso", titulo: "Descanso", tipo: "num", render: (j) => (j.descanso ? duracion(j.descanso) : "—") },
      { clave: "trabajado", titulo: "Horas", tipo: "num", render: (j) => <strong>{duracion(j.trabajado)}</strong> },
      {
        clave: "estado",
        titulo: "Estado",
        render: (j) => {
          const e = estadoDe(j);
          return <Estado texto={e.texto} tono={e.tono} />;
        },
      },
    ],
    [equipo]
  );

  const filtrosUI = (
    <div className="dm-filtros">
      <input type="date" value={filtros.desde} max={filtros.hasta} onChange={cambiar("desde")} aria-label="Desde" />
      <input type="date" value={filtros.hasta} min={filtros.desde} max={hoyLocal()} onChange={cambiar("hasta")} aria-label="Hasta" />
      {equipo && datos?.personas && (
        <select value={filtros.persona} onChange={(e) => setFiltros((f) => ({ ...f, persona: e.target.value }))} aria-label="Persona">
          <option value="">Todas las personas</option>
          {datos.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <>
      {registra && <MiJornada />}
      {error && (
        <Bloque>
          <p className="ctl-aviso">{error}</p>
        </Bloque>
      )}
      <Bloque>
        <Tabla
          titulo={equipo ? "Entradas y salidas por fecha" : "Mis entradas y salidas"}
          sub={datos ? `${datos.jornadas.length} ${datos.jornadas.length === 1 ? "jornada" : "jornadas"} · del ${fechaCorta(filtros.desde)} al ${fechaCorta(filtros.hasta)}` : "Cargando…"}
          columnas={columnas}
          filas={datos?.jornadas || []}
          textoDe={(j) => `${j.fecha} ${j.persona.nombre} ${j.sucursal || ""} ${j.entrada?.lugar || ""} ${estadoDe(j).texto}`}
          onExcel={equipo ? excel : undefined}
          exportando={bajando}
          onPdf={() => window.print()}
          acciones={filtrosUI}
          vacio={datos ? "No hay entradas ni salidas en estas fechas." : "Cargando…"}
        />
        {!equipo && (
          <p className="dm-reloj-nota" style={{ marginTop: 10 }}>
            ¿Algo no está bien? <Link to="/panel/mis-registros?corregir=1">Pide una corrección</Link>: el registro original se conserva.
          </p>
        )}
      </Bloque>
      {ver && <VerUbicacion marcaje={ver.marcaje} persona={ver.persona} onCerrar={() => setVer(null)} />}
    </>
  );
}

export default EntradasSalidas;
