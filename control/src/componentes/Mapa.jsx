import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

/*
  Mapa de AvantCode Control: geocercas (círculos) y marcajes (puntos).
  - Con la llave de Google Maps en el servidor (GOOGLE_MAPS_KEY, la da
    /api/estado) usa Google Maps.
  - Sin llave: mapa vectorial con estilo tipo Apple Maps (OpenFreeMap +
    MapLibre, ver mapaVectorial.js).
  - Si el equipo no puede dibujarlo (sin WebGL) o falla, OpenStreetMap con
    Leaflet. Todos se ven y se usan igual.

  props:
  - zonas:  [{ id, lat, lng, radio, nombre, tipo: "sucursal" | "casa" | "nueva" }]
  - puntos: [{ id, lat, lng, titulo, detalle, tono: "ok" | "aviso" | "neutro" }]
  - onElegir(lat, lng): si viene, un clic en el mapa elige el punto.
  - enfoque: cuando cambia, el mapa vuelve a encuadrar todo.
*/

const CDMX = { lat: 19.4326, lng: -99.1332 };
const COLOR_ZONA = { sucursal: "#141414", casa: "#6d28d9", nueva: "#2563eb", precision: "#2563eb" };
/* Como la demo: validado en negro, por validar en rojo, home office o viaje en morado, aproximado en gris. */
const COLOR_PUNTO = { ok: "#141414", aviso: "#E5484D", libre: "#6E56CF", neutro: "#8E8E93", yo: "#2563eb" };

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const contenido = (p) => `<div style="font:13px/1.45 system-ui,sans-serif;max-width:220px"><b>${esc(p.titulo)}</b>${p.detalle ? `<br>${esc(p.detalle)}` : ""}</div>`;

let llavePromesa = null;
const llaveGoogle = () =>
  (llavePromesa ??= fetch("/api/estado")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => d?.mapas?.google || null)
    .catch(() => null));

let googleFallo = false;
let googlePromesa = null;
const cargarGoogle = (llave) =>
  (googlePromesa ??= new Promise((resolver, rechazar) => {
    if (window.google?.maps?.Map) return resolver(window.google.maps);
    window.__mapaControlListo = () => resolver(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(llave)}&v=weekly&language=es&region=MX&callback=__mapaControlListo`;
    s.async = true;
    s.onerror = () => {
      googlePromesa = null;
      rechazar(new Error("No cargó Google Maps"));
    };
    document.head.appendChild(s);
  }));

async function motorGoogle(el, llave, elegir) {
  const maps = await cargarGoogle(llave);
  const mapa = new maps.Map(el, {
    center: CDMX,
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: "cooperative",
  });
  const info = new maps.InfoWindow();
  mapa.addListener("click", (e) => elegir.current?.(e.latLng.lat(), e.latLng.lng()));
  let objetos = [];
  return {
    pintar({ zonas, puntos, encuadrar }) {
      objetos.forEach((o) => o.setMap(null));
      objetos = [];
      const limites = new maps.LatLngBounds();
      let hay = 0;
      for (const z of zonas) {
        const color = COLOR_ZONA[z.tipo] || COLOR_ZONA.sucursal;
        const c = new maps.Circle({ map: mapa, center: { lat: z.lat, lng: z.lng }, radius: z.radio, strokeColor: color, strokeWeight: 2, strokeOpacity: 0.9, fillColor: color, fillOpacity: 0.1, clickable: false });
        objetos.push(c);
        limites.union(c.getBounds());
        hay += 1;
      }
      for (const p of puntos) {
        const m = new maps.Marker({
          map: mapa,
          position: { lat: p.lat, lng: p.lng },
          title: p.titulo,
          icon: { path: maps.SymbolPath.CIRCLE, scale: 7, fillColor: COLOR_PUNTO[p.tono] || COLOR_PUNTO.neutro, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
        });
        m.addListener("click", () => {
          info.setContent(contenido(p));
          info.open({ map: mapa, anchor: m });
        });
        objetos.push(m);
        limites.extend({ lat: p.lat, lng: p.lng });
        hay += 1;
      }
      if (encuadrar && hay) {
        mapa.fitBounds(limites, 48);
        maps.event.addListenerOnce(mapa, "idle", () => mapa.getZoom() > 17 && mapa.setZoom(17));
      }
    },
    destruir() {
      objetos.forEach((o) => o.setMap(null));
      maps.event.clearInstanceListeners(mapa);
    },
  };
}

async function motorOsm(el, elegir, seleccion) {
  const L = (await import("leaflet")).default;
  await import("leaflet/dist/leaflet.css");
  const mapa = L.map(el, { scrollWheelZoom: false }).setView([CDMX.lat, CDMX.lng], 12);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  }).addTo(mapa);
  const capa = L.layerGroup().addTo(mapa);
  mapa.on("click", (e) => elegir.current?.(e.latlng.lat, e.latlng.lng));
  mapa.on("focus", () => mapa.scrollWheelZoom.enable());
  mapa.on("blur", () => mapa.scrollWheelZoom.disable());
  return {
    pintar({ zonas, puntos, encuadrar }) {
      capa.clearLayers();
      const limites = L.latLngBounds([]);
      for (const z of zonas) {
        const color = COLOR_ZONA[z.tipo] || COLOR_ZONA.sucursal;
        const c = L.circle([z.lat, z.lng], { radius: z.radio, color, weight: 2, opacity: 0.9, fillColor: color, fillOpacity: 0.1, interactive: !seleccion });
        if (!seleccion && z.nombre) c.bindTooltip(esc(z.nombre));
        c.addTo(capa);
        limites.extend(L.latLng(z.lat, z.lng).toBounds(z.radio * 2));
      }
      for (const p of puntos) {
        L.circleMarker([p.lat, p.lng], { radius: 7, color: "#ffffff", weight: 2, fillColor: COLOR_PUNTO[p.tono] || COLOR_PUNTO.neutro, fillOpacity: 1 })
          .bindPopup(contenido(p))
          .addTo(capa);
        limites.extend([p.lat, p.lng]);
      }
      if (encuadrar && limites.isValid()) mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 17 });
    },
    destruir() {
      mapa.remove();
    },
  };
}

function Mapa({ zonas = [], puntos = [], onElegir, onPunto, enfoque = "", alto = 380, etiqueta = "Mapa" }) {
  const el = useRef(null);
  const motor = useRef(null);
  const elegir = useRef(onElegir);
  elegir.current = onElegir;
  // Al tocar un punto: elige a esa persona (si la pantalla lo pide).
  const elegirPunto = useRef(onPunto);
  elegirPunto.current = onPunto;
  const seleccion = Boolean(onElegir);
  const [fuente, setFuente] = useState(null); // { tipo: "google" | "osm", llave }
  const [listo, setListo] = useState(0);
  const ultima = useRef(null);

  useEffect(() => {
    let vivo = true;
    // Si Google rechaza la llave (dominio no autorizado, sin facturación…), se pasa a OpenStreetMap.
    window.gm_authFailure = () => {
      googleFallo = true;
      if (vivo) setFuente({ tipo: "vector" });
    };
    llaveGoogle().then((llave) => vivo && setFuente(llave && !googleFallo ? { tipo: "google", llave } : { tipo: "vector" }));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!fuente || !el.current) return undefined;
    let vivo = true;
    let creado = null;
    el.current.innerHTML = "";
    const crear =
      fuente.tipo === "google"
        ? motorGoogle(el.current, fuente.llave, elegir)
        : fuente.tipo === "vector"
          ? import("./mapaVectorial").then((v) => v.motorVector(el.current, elegir, seleccion, { COLOR_PUNTO, contenido, inicio: CDMX, elegirPunto: onPunto ? elegirPunto : null }))
          : motorOsm(el.current, elegir, seleccion);
    crear
      .then((m) => {
        if (!vivo) return m.destruir();
        creado = m;
        motor.current = m;
        ultima.current = null;
        setListo((n) => n + 1);
      })
      .catch(() => {
        if (!vivo) return;
        if (fuente.tipo === "google") setFuente({ tipo: "vector" });
        else if (fuente.tipo === "vector") setFuente({ tipo: "osm" });
      });
    return () => {
      vivo = false;
      creado?.destruir();
      motor.current = null;
    };
  }, [fuente, seleccion]);

  useEffect(() => {
    if (!motor.current) return;
    const clave = `${enfoque}|${zonas.map((z) => z.id).join(",")}|${puntos.map((p) => p.id).join(",")}`;
    motor.current.pintar({ zonas, puntos, encuadrar: clave !== ultima.current });
    ultima.current = clave;
  }, [zonas, puntos, enfoque, listo]);

  return (
    <div className="mapa" style={{ height: alto }}>
      <div ref={el} className="mapa-lienzo" role="region" aria-label={etiqueta} />
      {!listo && (
        <span className="mapa-cargando">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Cargando mapa…
        </span>
      )}
    </div>
  );
}

export default Mapa;
