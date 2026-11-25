import { useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, LocateFixed, Navigation } from "lucide-react";
import Mapa from "./Mapa";
import { api } from "../sesion";
import { esComputadora, textoPrecision } from "../paginas/jornada/comun";

/* Por qué no es exacta y cómo arreglarlo, según el equipo. */
const COMO_PRECISA = {
  computadora:
    "Una computadora no tiene GPS: el navegador la ubica por tu conexión a internet y puede equivocarse por kilómetros. Para marcar con tu ubicación exacta usa tu celular. En Windows, encender Configuración › Privacidad y seguridad › Ubicación ayuda a que use el Wi-Fi.",
  iphone: "En tu iPhone: Ajustes › Privacidad y seguridad › Localización › (Safari o Chrome) › «Mientras se usa» y activa «Ubicación exacta».",
  android: "En tu Android: Ajustes › Ubicación › activa la ubicación y «Precisión de la ubicación de Google»; en el permiso del navegador elige «Precisa».",
};
const equipo = () => (esComputadora() ? "computadora" : /iPhone|iPad|iPod/i.test(navigator.userAgent || "") ? "iphone" : "android");

/*
  «Tu ubicación»: al abrir el panel se pide la ubicación y la persona ve en
  el mapa dónde está en ese momento, con la geocerca de su sucursal (o de
  su casa) y si ya está dentro. Esta ubicación en vivo solo la ve ella en
  su pantalla: no se envía ni se guarda. Se guarda únicamente al marcar.
*/

/* Metros entre dos puntos (haversine), igual que el servidor. */
const distancia = (a, b) => {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
};

/* La ubicación del teléfono o la computadora, al momento y mientras la pantalla esté abierta. */
export function useMiUbicacion(activa = true) {
  const [estado, setEstado] = useState("pidiendo"); // pidiendo | listo | denegado | no_disponible | error
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!activa) return undefined;
    if (!navigator.geolocation) {
      setEstado("no_disponible");
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const nueva = { lat: p.coords.latitude, lng: p.coords.longitude, precision: Math.round(p.coords.accuracy || 0), t: Date.now() };
        // Se queda con la lectura buena: una peor solo la reemplaza si la buena ya tiene más de 30 s (la persona pudo moverse).
        setPos((actual) => (!actual || nueva.precision <= actual.precision * 1.5 || nueva.t - actual.t > 30000 ? nueva : actual));
        setEstado("listo");
      },
      (e) => setEstado((actual) => (actual === "listo" ? actual : e.code === 1 ? "denegado" : "error")),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activa]);
  return { estado, pos };
}

function MiUbicacion({ lugar: lugarDado }) {
  const [lugarPedido, setLugarPedido] = useState(null);
  const lugar = lugarDado !== undefined ? lugarDado : lugarPedido?.lugar;
  const viaje = lugarDado !== undefined ? lugarDado?.nombre === "De viaje" : lugarPedido?.modalidad === "viaje";
  // En la computadora no hay GPS: solo se muestra su sucursal u oficina, sin pedir la ubicación.
  const pc = esComputadora();
  const { estado, pos } = useMiUbicacion(!pc);

  // Sin lugar dado (Inicio), lo pide: su sucursal o su casa, con el punto de la geocerca.
  useEffect(() => {
    if (lugarDado !== undefined) return;
    api("/jornada/hoy")
      .then((d) => setLugarPedido({ lugar: d.lugar, modalidad: d.modalidad }))
      .catch(() => setLugarPedido({ lugar: null }));
  }, [lugarDado]);

  const geocerca = lugar?.con_geocerca && lugar.latitud != null ? { lat: lugar.latitud, lng: lugar.longitud, radio: lugar.radio || 150, nombre: lugar.nombre } : null;
  const zonas = useMemo(
    () => [
      ...(geocerca ? [{ id: "geocerca", lat: geocerca.lat, lng: geocerca.lng, radio: geocerca.radio, nombre: geocerca.nombre, tipo: lugar?.nombre === "Home office" ? "casa" : "sucursal" }] : []),
      ...(pos && pos.precision > 15 ? [{ id: "precision", lat: pos.lat, lng: pos.lng, radio: Math.min(pos.precision, 30000), tipo: "precision" }] : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geocerca?.lat, geocerca?.lng, geocerca?.radio, pos?.lat, pos?.lng, pos?.precision]
  );
  const puntos = useMemo(
    () => (pos ? [{ id: "yo", lat: pos.lat, lng: pos.lng, tono: "yo", titulo: "Tú estás aquí", detalle: `Precisión ±${pos.precision} m` }] : []),
    [pos]
  );

  // ¿Ya está dentro? (con la misma holgura que el servidor: la precisión cuenta hasta 75 m)
  let aviso = null;
  // Con una precisión de 1 km o más no se puede saber si está dentro: lo explica el aviso de abajo.
  if (pos && pos.precision < 1000) {
    if (viaje) aviso = { tono: "ok", texto: "Estás de viaje: puedes marcar desde donde estés y se guarda tu ubicación." };
    else if (!lugar) aviso = { tono: "neutro", texto: "Aún no tienes sucursal asignada: al marcar se guarda tu ubicación, sin geocerca." };
    else if (!geocerca) aviso = { tono: "neutro", texto: `${lugar.nombre} aún no tiene punto en el mapa: al marcar se guarda tu ubicación, sin geocerca.` };
    else {
      const d = distancia(pos, geocerca);
      const dentro = d - Math.min(pos.precision, 75) <= geocerca.radio;
      aviso = dentro
        ? { tono: "ok", texto: `Estás dentro de ${geocerca.nombre} (a ${d} m del punto).` }
        : { tono: "aviso", texto: `Estás a ${d} m de ${geocerca.nombre}: si marcas aquí, quedará fuera de tu zona (radio de ${geocerca.radio} m).` };
    }
  }

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="card-titulo">
          <LocateFixed className="h-5 w-5 text-tinta-3" /> {pc ? "Tu sucursal u oficina" : "Tu ubicación"}
        </h2>
        {pos && (
          <span className={`badge ${pos.precision <= 30 ? "badge-success" : pos.precision <= 150 ? "badge-info" : "badge-warning"} tabular-nums`}>
            {pos.precision <= 30 ? "Exacta" : pos.precision <= 150 ? "Buena" : "Aproximada"} · {textoPrecision(pos.precision)}
          </span>
        )}
      </div>

      {pc ? (
        <>
          {geocerca ? (
            <Mapa zonas={zonas} puntos={[{ id: "lugar", lat: geocerca.lat, lng: geocerca.lng, tono: "neutro", titulo: geocerca.nombre, detalle: `Geocerca de ${geocerca.radio} m` }]} enfoque="lugar" alto={260} etiqueta={`Mapa de ${geocerca.nombre}`} />
          ) : null}
          <p className="mt-3 text-sm text-tinta-2">
            {geocerca
              ? `Tu lugar de trabajo: ${geocerca.nombre} (geocerca de ${geocerca.radio} m).`
              : viaje
                ? "Estás de viaje: marca desde tu celular para guardar tu ubicación exacta."
                : lugar
                  ? `${lugar.nombre} aún no tiene punto en el mapa.`
                  : "Aún no tienes sucursal u oficina asignada."}
          </p>
          <p className="mt-1 text-[13px] text-tinta-3">
            Estás en una computadora: si marcas desde aquí, tu ubicación se guarda como aproximada. En tu celular se guarda la ubicación exacta.
          </p>
        </>
      ) : estado === "denegado" || estado === "no_disponible" || estado === "error" ? (
        <div className="superficie space-y-2 p-4 text-sm">
          <p className="font-semibold text-tinta">
            {estado === "denegado" ? "Permite tu ubicación para ver dónde estás" : estado === "no_disponible" ? "Este navegador no comparte la ubicación" : "No pudimos obtener tu ubicación"}
          </p>
          <p className="text-tinta-2">
            {estado === "denegado"
              ? "Toca el candado junto a la dirección (control.avantcode.mx) › Ubicación › Permitir, y recarga la página. La necesitas también para marcar."
              : estado === "no_disponible"
                ? "Abre control.avantcode.mx en Chrome o Safari de tu celular."
                : "Revisa que el GPS esté encendido y sal a un lugar con mejor señal."}
          </p>
        </div>
      ) : (
        <>
          {/* Vuelve a encuadrar cuando la precisión mejora de nivel (aproximada → buena → exacta). */}
          <Mapa
            zonas={zonas}
            puntos={puntos}
            enfoque={!pos ? "pidiendo" : pos.precision <= 30 ? "exacta" : pos.precision <= 150 ? "buena" : pos.precision <= 1000 ? "media" : "aproximada"}
            alto={280}
            etiqueta="Mapa con tu ubicación actual"
          />
          {!pos && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-tinta-3">
              <Navigation className="h-4 w-4" /> Buscando tu ubicación… si el navegador te lo pregunta, toca «Permitir».
            </p>
          )}
          {aviso && (
            <p className={`mt-3 flex items-start gap-2 text-sm ${aviso.tono === "ok" ? "text-green-700" : aviso.tono === "aviso" ? "text-amber-700" : "text-tinta-2"}`}>
              {aviso.tono === "aviso" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
              {aviso.texto}
            </p>
          )}
          {pos && pos.precision > 150 && (
            <div className="ctl-aviso ctl-aviso--suave mt-3 space-y-1 text-[13px]">
              <p className="font-semibold">
                {pos.precision >= 1000
                  ? `Esta ubicación es aproximada (${textoPrecision(pos.precision)}): viene de tu conexión a internet, no del GPS.`
                  : `Tu ubicación todavía no es exacta (${textoPrecision(pos.precision)}).`}
              </p>
              <p>{pos.precision >= 1000 || esComputadora() ? COMO_PRECISA[equipo()] : "Acércate a una ventana o sal al aire libre: con el GPS encendido se afina en unos segundos."}</p>
            </div>
          )}
        </>
      )}
      {!pc && <p className="mt-3 text-[12px] text-tinta-3">Solo tú ves esta ubicación en tu pantalla. Se guarda únicamente cuando marcas.</p>}
    </section>
  );
}

export default MiUbicacion;
