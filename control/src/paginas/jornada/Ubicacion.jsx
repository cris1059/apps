import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Bloque, Caja, Estado, Kpis, iniciales } from "../../componentes/demo/Bloques";
import Mapa from "../../componentes/Mapa";
import { useMiUbicacion } from "../../componentes/MiUbicacion";
import { administra, api, useSesion } from "../../sesion";
import Sucursales from "./Sucursales";
import { TIPOS, esComputadora, hoyLocal, lugarDe, textoPrecision } from "./comun";

/*
  Ubicación y geocercas (igual que en la demo): indicadores, y «Registros
  con ubicación»: cuántos marcaron en su lugar, en home office o de viaje y
  cuántos hay que validar; el mapa con las geocercas y el último registro de
  cada persona; la lista; y el detalle de la persona elegida, donde quien
  administra cambia dónde marca y el radio de su geocerca. Debajo, las
  sucursales u oficinas.
*/

const MODALIDADES = {
  sucursal: "En su sucursal",
  home_office: "Home office (desde casa)",
  viaje: "De viaje (desde donde esté)",
};

/* Cómo quedó el último registro de una persona (como el «evaluar» de la demo). */
const evaluar = (m, persona) => {
  if (!m) return { texto: "Sin registro hoy", tono: "neutro", ok: true, clase: "neutro" };
  if (m.aproximada) return { texto: "Aproximada (computadora)", tono: "neutro", ok: true, clase: "neutro" };
  if (m.estado === "fuera_de_zona") return { texto: "Fuera de su zona", tono: "alerta", ok: false, clase: "aviso" };
  if (persona?.modalidad === "home_office" || persona?.modalidad === "viaje" || m.lugar === "De viaje")
    return { texto: persona?.modalidad === "viaje" ? "De viaje: permitido" : "Home office", tono: "info", ok: true, clase: "libre" };
  if (m.estado === "validado") return { texto: "En su sucursal", tono: "ok", ok: true, clase: "ok" };
  return { texto: "Registrado (sin geocerca)", tono: "neutro", ok: true, clase: "neutro" };
};

function Ubicacion() {
  const sesion = useSesion();
  const edita = administra(sesion);
  const [fecha, setFecha] = useState(hoyLocal());
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [elegido, setElegido] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [radio, setRadio] = useState(null);
  const pc = esComputadora();
  const { pos: yo } = useMiUbicacion(!pc);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/jornada/mapa?fecha=${fecha}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && fecha === hoyLocal() && cargar(), 60000);
    return () => clearInterval(t);
  }, [cargar, fecha]);

  // El último registro de cada persona en el día.
  const filas = useMemo(() => {
    if (!datos) return [];
    const ultimo = new Map();
    for (const m of datos.marcajes) ultimo.set(m.id_usuario, m);
    return datos.personas
      .filter((p) => ultimo.has(p.id))
      .map((p) => ({ persona: p, marca: ultimo.get(p.id), ev: evaluar(ultimo.get(p.id), p) }))
      .sort((a, b) => (a.marca.hora_local < b.marca.hora_local ? -1 : 1));
  }, [datos]);
  const sel = filas.find((f) => f.persona.id === elegido) || filas.find((f) => !f.ev.ok) || filas[0];
  const cuenta = {
    lugar: filas.filter((f) => f.ev.clase === "ok").length,
    libres: filas.filter((f) => f.ev.clase === "libre").length,
    revisar: filas.filter((f) => !f.ev.ok).length,
  };

  const zonas = useMemo(
    () =>
      datos
        ? [
            ...datos.sucursales.filter((s) => s.latitud != null).map((s) => ({ id: `s${s.id}`, lat: s.latitud, lng: s.longitud, radio: s.id === radio?.id ? radio.valor : s.radio, nombre: `${s.nombre} · ${s.radio} m`, tipo: "sucursal" })),
            ...datos.casas.map((c) => ({ id: `c${c.id}`, lat: c.latitud, lng: c.longitud, radio: c.radio, nombre: `Home office · ${c.persona}`, tipo: "casa" })),
          ]
        : [],
    [datos, radio]
  );
  const puntos = useMemo(
    () => [
      ...filas.map((f) => ({
        id: f.persona.id,
        lat: f.marca.latitud,
        lng: f.marca.longitud,
        tono: f.ev.clase,
        elegido: sel?.persona.id === f.persona.id,
        titulo: `${f.persona.nombre} · ${TIPOS[f.marca.tipo].texto} ${f.marca.hora_local}`,
        detalle: lugarDe(f.marca),
      })),
      ...(yo ? [{ id: "yo", lat: yo.lat, lng: yo.lng, tono: "yo", titulo: "Tú estás aquí", detalle: `Precisión ${textoPrecision(yo.precision)}` }] : []),
    ],
    [filas, sel, yo]
  );

  const sucursalSel = sel && datos ? datos.sucursales.find((s) => s.id === sel.persona.id_sucursal) : null;
  const elegirPunto = useCallback((id) => id !== "yo" && setElegido(id), []);

  const cambiarModalidad = async (modalidad) => {
    setGuardando(true);
    try {
      await api(`/personas/${sel.persona.id}/jornada`, { metodo: "PATCH", datos: { modalidad } });
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };
  const cambiarMetodo = async (metodo_marcaje) => {
    setGuardando(true);
    try {
      await api(`/personas/${sel.persona.id}/jornada`, { metodo: "PATCH", datos: { metodo_marcaje } });
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };
  // El radio se guarda al soltar el control (mientras se mueve, el mapa lo muestra).
  const guardarRadio = useRef(null);
  const moverRadio = (s, valor) => {
    setRadio({ id: s.id, valor });
    clearTimeout(guardarRadio.current);
    guardarRadio.current = setTimeout(async () => {
      try {
        await api(`/sucursales/${s.id}`, { metodo: "PATCH", datos: { radio_metros: valor } });
        await cargar();
      } catch (e) {
        setError(e.message);
      } finally {
        setRadio(null);
      }
    }, 700);
  };

  const conGps = datos ? datos.marcajes.filter((m) => m.metodo === "web" && !m.aproximada).length : 0;
  const enKiosco = datos ? datos.marcajes.filter((m) => m.metodo === "kiosco" || m.metodo === "qr").length : 0;
  const lugares = datos ? datos.sucursales.filter((s) => s.latitud != null) : [];

  return (
    <>
      {error && (
        <Bloque>
          <p className="ctl-aviso">{error}</p>
        </Bloque>
      )}
      <Bloque>
        <Kpis
          datos={[
            { etiqueta: "Marcajes desde el celular", valor: String(conGps), delta: datos ? `De ${datos.marcajes.length} registros · con GPS` : "…" },
            { etiqueta: "Lugares de trabajo", valor: String(lugares.length + (datos?.casas.length || 0)), delta: lugares.map((s) => s.nombre).join(", ") || "Agrega tu sucursal abajo" },
            { etiqueta: "En campo, de viaje o remoto", valor: String(datos ? datos.modalidades.home_office + datos.modalidades.viaje : 0), delta: "Con su propia regla" },
            { etiqueta: "En kiosco", valor: String(enKiosco), delta: "Con la ubicación fija del equipo" },
          ]}
        />
      </Bloque>

      <Bloque>
        <Caja
          titulo="Registros con ubicación"
          sub="Cada persona tiene su regla: su sucursal, home office o de viaje"
          className="dl-mapa-caja"
          acciones={
            <div className="dm-filtros">
              <input type="date" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value || hoyLocal())} aria-label="Fecha" />
            </div>
          }
        >
          <div className="dl-cuentas" aria-live="polite">
            <span>
              <b>{cuenta.lugar}</b> en su lugar
            </span>
            <span>
              <b>{cuenta.libres}</b> en home office o de viaje
            </span>
            <span className={cuenta.revisar ? "dl-cuentas-alerta" : undefined}>
              <b>{cuenta.revisar}</b> por validar
            </span>
          </div>

          <div className="dl-mapa">
            <div className="dl-mapa-lienzo">
              <Mapa zonas={zonas} puntos={puntos} onPunto={elegirPunto} alto={340} etiqueta="Mapa con las sucursales y los registros del día" />
              <p className="dl-leyenda">
                <span>
                  <i className="dl-ley-sucursal" /> Sucursal
                </span>
                <span>
                  <i className="dl-ley-libre" /> Home office o viaje
                </span>
                <span>
                  <i className="dl-ley-fuera" /> Por validar
                </span>
                {yo && (
                  <span>
                    <i style={{ background: "#2563eb", borderRadius: 999 }} /> Tú (solo lo ves tú)
                  </span>
                )}
              </p>
            </div>

            <div className="dl-mapa-lado">
              {filas.length === 0 ? (
                <p className="dm-vacio">{datos ? "Aún no hay registros con ubicación este día." : "Cargando…"}</p>
              ) : (
                <ul className="dl-marcajes" aria-label="Registros con ubicación">
                  {filas.map((f) => (
                    <li key={f.persona.id}>
                      <button type="button" aria-pressed={sel?.persona.id === f.persona.id} onClick={() => setElegido(f.persona.id)}>
                        <span className="dl-marcaje-avatar" aria-hidden="true">
                          {iniciales(f.persona.nombre)}
                        </span>
                        <span className="dl-cal-texto">
                          <strong>{f.persona.nombre}</strong>
                          <small>
                            {f.marca.hora_local} · {MODALIDADES[f.persona.modalidad] || "En su sucursal"}
                          </small>
                        </span>
                        <Estado texto={f.ev.ok ? (f.ev.clase === "ok" ? "Validado" : f.ev.clase === "libre" ? "Permitido" : "Registrado") : "Por validar"} tono={f.ev.tono} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {sel && (
                <div className="dl-mapa-detalle">
                  <div className="dl-mapa-detalle-enc">
                    <span className="dl-mapa-icono" aria-hidden="true">
                      <MapPin size={16} />
                    </span>
                    <span>
                      <strong>{sel.persona.nombre}</strong>
                      <small>
                        {sel.persona.puesto ? `${sel.persona.puesto} · ` : ""}
                        {TIPOS[sel.marca.tipo].texto} {sel.marca.hora_local} · hora del servidor
                      </small>
                    </span>
                  </div>
                  <Estado texto={sel.ev.texto} tono={sel.ev.tono} />
                  <div className="dl-regla">
                    <label className="dl-regla-campo">
                      <span>Cómo marca</span>
                      <select value={sel.persona.metodo_marcaje || "ambos"} disabled={!edita || guardando} onChange={(e) => cambiarMetodo(e.target.value)}>
                        <option value="app">En la app, con su ubicación</option>
                        <option value="kiosco" disabled={!datos?.hay_kiosco}>
                          En el kiosco (QR o PIN){datos?.hay_kiosco ? "" : " · activa un kiosco"}
                        </option>
                        <option value="ambos">En la app o en el kiosco</option>
                      </select>
                    </label>
                    <label className="dl-regla-campo">
                      <span>Dónde puede marcar</span>
                      <select value={sel.persona.modalidad} disabled={!edita || guardando} onChange={(e) => cambiarModalidad(e.target.value)}>
                        {Object.entries(MODALIDADES).map(([v, t]) => (
                          <option key={v} value={v}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <dl>
                    {sel.marca.distancia != null && (
                      <div>
                        <dt>Distancia a {sel.marca.lugar}</dt>
                        <dd>{sel.marca.distancia} m</dd>
                      </div>
                    )}
                    <div>
                      <dt>Precisión del GPS</dt>
                      <dd>{sel.marca.precision ? textoPrecision(sel.marca.precision) : "—"}</dd>
                    </div>
                    <div>
                      <dt>Cómo marcó</dt>
                      <dd>{sel.marca.metodo === "kiosco" ? "Kiosco" : sel.marca.metodo === "qr" ? "QR del kiosco" : sel.marca.aproximada ? "Computadora" : "Celular"}</dd>
                    </div>
                  </dl>
                  {sucursalSel && sucursalSel.latitud != null && sel.persona.modalidad === "sucursal" && (
                    <label className="dl-rango">
                      <span>
                        Radio de {sucursalSel.nombre}: <strong>{radio?.id === sucursalSel.id ? radio.valor : sucursalSel.radio} m</strong>
                      </span>
                      <input
                        type="range"
                        min={50}
                        max={500}
                        step={10}
                        disabled={!edita}
                        value={radio?.id === sucursalSel.id ? radio.valor : sucursalSel.radio}
                        onChange={(e) => moverRadio(sucursalSel, Number(e.target.value))}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="dl-fundamento">
            <Navigation size={13} aria-hidden="true" /> La ubicación se toma solo al marcar, con aviso de privacidad: no hay rastreo continuo. Desde una computadora
            queda como aproximada; en el celular, exacta.
          </p>
        </Caja>
      </Bloque>

      <Bloque>
        <Caja>
          <Sucursales onCambio={cargar} />
        </Caja>
      </Bloque>
    </>
  );
}

export default Ubicacion;
