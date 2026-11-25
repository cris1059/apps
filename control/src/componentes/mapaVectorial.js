import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/*
  Mapa vectorial con estilo tipo Apple Maps: OpenFreeMap (gratis, sin llave
  ni límites, uso comercial permitido; datos de OpenStreetMap) dibujado con
  MapLibre. Al estilo «Liberty» se le cambia la paleta: tierra clara, calles
  blancas, autopistas ámbar suave, agua azul cielo, parques verde pálido,
  textos gris oscuro y sin la mayoría de los íconos, para que se lean las
  geocercas y los marcajes.
*/

const ESTILO = "https://tiles.openfreemap.org/styles/liberty";
const P = {
  tierra: "#f5f4f0",
  urbano: "#efede8",
  edificio: "#e6e3dc",
  edificioBorde: "#dcd8cf",
  agua: "#a8d4f3",
  parque: "#d3ebc8",
  bosque: "#c9e4bc",
  calle: "#ffffff",
  calleBorde: "#e3e0d8",
  principal: "#fdfcf8",
  autopista: "#f9d77e",
  autopistaBorde: "#eabf55",
  via: "#c9c6bf",
  texto: "#3a3a3c",
  textoSuave: "#6e6e73",
  halo: "#ffffff",
};

const dePaleta = (capa) => {
  const id = capa.id;
  const fuente = capa["source-layer"];
  const p = { ...(capa.paint || {}) };
  const l = { ...(capa.layout || {}) };
  if (capa.type === "background") p["background-color"] = P.tierra;
  else if (capa.type === "raster") l.visibility = "none";
  else if (fuente === "water" && capa.type === "fill") p["fill-color"] = P.agua;
  else if (fuente === "waterway" && capa.type === "line") p["line-color"] = P.agua;
  else if (fuente === "park") {
    // Solo parques: sin las zonas protegidas enormes (p. ej. todo el Centro Histórico en verde).
    if (capa.type === "fill") return { ...capa, filter: ["==", ["get", "class"], "park"], paint: { ...p, "fill-color": P.parque, "fill-opacity": 1 }, layout: l };
    l.visibility = "none";
  } else if (fuente === "landcover") {
    if (/wood/.test(id)) Object.assign(p, { "fill-color": P.bosque, "fill-opacity": 0.9 });
    else if (/grass|wetland/.test(id)) Object.assign(p, { "fill-color": P.parque, "fill-opacity": 0.9 });
    else if (/sand/.test(id)) p["fill-color"] = "#f1ead8";
  } else if (fuente === "landuse" && capa.type === "fill") Object.assign(p, { "fill-color": /cemetery|pitch|track/.test(id) ? P.parque : P.urbano, "fill-opacity": 0.7 });
  else if (fuente === "building") {
    if (capa.type === "fill") Object.assign(p, { "fill-color": P.edificio, "fill-outline-color": P.edificioBorde });
    else l.visibility = "none"; // sin edificios en 3D
  } else if (fuente === "aeroway") {
    if (capa.type === "fill") p["fill-color"] = P.urbano;
    else p["line-color"] = P.calle;
  } else if (fuente === "transportation" && capa.type === "line") {
    const casing = /casing/.test(id);
    if (/rail/.test(id)) Object.assign(p, { "line-color": P.via, "line-opacity": 0.6 });
    else if (/path_pedestrian/.test(id)) l.visibility = "none";
    // Como Apple: solo las autopistas en ámbar; avenidas y calles en blanco.
    else if (/motorway/.test(id)) p["line-color"] = casing ? P.autopistaBorde : P.autopista;
    else if (/trunk|primary|secondary|tertiary/.test(id)) p["line-color"] = casing ? P.calleBorde : P.principal;
    else p["line-color"] = casing ? P.calleBorde : P.calle;
  } else if (fuente === "transportation" && capa.type === "fill") l.visibility = "none";
  else if (fuente === "boundary") Object.assign(p, { "line-color": "#c7c2d6", "line-opacity": 0.6 });
  else if (capa.type === "symbol") {
    // Menos ruido: sin íconos de lugares, flechas de sentido ni escudos de carretera.
    if (fuente === "poi" && !/transit/.test(id)) l.visibility = "none";
    else if (/one_way|shield/.test(id)) l.visibility = "none";
    // Nombres en español (o el local, que en México ya es español).
    if (l["text-field"] !== undefined && !/shield|one_way/.test(id)) l["text-field"] = ["coalesce", ["get", "name:es"], ["get", "name"]];
    if (p["text-color"] !== undefined) {
      p["text-color"] = /water/.test(id) ? "#4a8fc4" : /highway-name|label_other|label_village/.test(id) ? P.textoSuave : P.texto;
      p["text-halo-color"] = P.halo;
      p["text-halo-width"] = 1.4;
    }
  }
  // Los edificios, solo de cerca (de lejos se ve más limpio, como en Apple Maps).
  const minzoom = fuente === "building" ? Math.max(capa.minzoom || 0, 15) : capa.minzoom;
  return { ...capa, paint: p, layout: l, ...(minzoom !== undefined ? { minzoom } : {}) };
};

let estiloPromesa = null;
const estiloApple = () =>
  (estiloPromesa ??= fetch(ESTILO)
    .then((r) => {
      if (!r.ok) throw new Error("estilo");
      return r.json();
    })
    .then((s) => ({ ...s, layers: s.layers.map(dePaleta) }))
    .catch((e) => {
      estiloPromesa = null;
      throw e;
    }));

/* Círculo (geocerca) como polígono de 64 lados. */
const circulo = (lat, lng, radio) => {
  const dLat = radio / 111320;
  const dLng = radio / (111320 * Math.cos((lat * Math.PI) / 180));
  const anillo = Array.from({ length: 65 }, (_, i) => {
    const a = (i / 64) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
  return anillo;
};

/* Geocercas como en la demo: lima con borde punteado (casa en morado; la precisión, azul tenue). */
const ZONA = {
  sucursal: { relleno: "#D4FF3F", borde: "#141414", opacidad: 0.32, punteada: true },
  nueva: { relleno: "#D4FF3F", borde: "#141414", opacidad: 0.32, punteada: true },
  casa: { relleno: "#6E56CF", borde: "#6E56CF", opacidad: 0.14, punteada: true },
  precision: { relleno: "#2563eb", borde: "#2563eb", opacidad: 0.08, punteada: false },
};

export async function motorVector(el, elegir, seleccion, { COLOR_PUNTO, contenido, inicio, elegirPunto }) {
  const estilo = await estiloApple();
  const mapa = new maplibregl.Map({
    container: el,
    style: estilo,
    center: [inicio.lng, inicio.lat],
    zoom: 12,
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    cooperativeGestures: false,
  });
  mapa.touchZoomRotate.disableRotation();
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
  // La rueda del ratón no mueve el mapa hasta que lo tocas (para no estorbar al recorrer la página).
  mapa.scrollZoom.disable();
  mapa.on("click", () => mapa.scrollZoom.enable());
  el.addEventListener("mouseleave", () => mapa.scrollZoom.disable());
  await new Promise((resolver, rechazar) => {
    if (mapa.loaded()) resolver();
    mapa.once("load", resolver);
    mapa.once("error", (e) => (mapa.loaded() ? null : rechazar(e?.error || new Error("mapa"))));
  });

  const vacio = { type: "FeatureCollection", features: [] };
  mapa.addSource("zonas", { type: "geojson", data: vacio });
  mapa.addSource("puntos", { type: "geojson", data: vacio });
  mapa.addLayer({ id: "zonas-relleno", type: "fill", source: "zonas", paint: { "fill-color": ["get", "relleno"], "fill-opacity": ["get", "opacidad"] } });
  mapa.addLayer({ id: "zonas-borde", type: "line", source: "zonas", filter: ["!", ["get", "punteada"]], paint: { "line-color": ["get", "borde"], "line-width": 1.6, "line-opacity": 0.85 } });
  mapa.addLayer({ id: "zonas-punteada", type: "line", source: "zonas", filter: ["get", "punteada"], paint: { "line-color": ["get", "borde"], "line-width": 1.6, "line-opacity": 0.8, "line-dasharray": [2, 2] } });
  // Pines como los de la demo: punto con halo de su color; el elegido, más grande.
  mapa.addLayer({
    id: "puntos-halo",
    type: "circle",
    source: "puntos",
    paint: { "circle-radius": ["case", ["get", "elegido"], 17, 13], "circle-color": ["get", "color"], "circle-opacity": ["case", ["get", "elegido"], 0.3, 0.16] },
  });
  mapa.addLayer({
    id: "puntos",
    type: "circle",
    source: "puntos",
    paint: { "circle-radius": ["case", ["get", "elegido"], 8, 6.5], "circle-color": ["get", "color"], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2.5 },
  });

  const popup = new maplibregl.Popup({ closeButton: false, offset: 12, maxWidth: "240px" });
  let datosPuntos = [];
  mapa.on("click", "puntos", (e) => {
    const f = e.features?.[0];
    const p = datosPuntos.find((x) => String(x.id) === String(f?.properties?.id));
    if (!p) return;
    if (elegirPunto?.current) elegirPunto.current(p.id);
    else popup.setLngLat([p.lng, p.lat]).setHTML(contenido(p)).addTo(mapa);
  });
  mapa.on("mouseenter", "puntos", () => (mapa.getCanvas().style.cursor = "pointer"));
  mapa.on("mouseleave", "puntos", () => (mapa.getCanvas().style.cursor = seleccion ? "crosshair" : ""));
  if (seleccion) mapa.getCanvas().style.cursor = "crosshair";
  mapa.on("click", (e) => {
    if (mapa.queryRenderedFeatures(e.point, { layers: ["puntos"] }).length) return;
    elegir.current?.(e.lngLat.lat, e.lngLat.lng);
  });

  return {
    pintar({ zonas, puntos, encuadrar }) {
      datosPuntos = puntos;
      mapa.getSource("zonas")?.setData({
        type: "FeatureCollection",
        features: zonas.map((z) => ({
          type: "Feature",
          properties: ZONA[z.tipo] || ZONA.sucursal,
          geometry: { type: "Polygon", coordinates: [circulo(z.lat, z.lng, z.radio)] },
        })),
      });
      mapa.getSource("puntos")?.setData({
        type: "FeatureCollection",
        features: puntos.map((p) => ({ type: "Feature", properties: { id: p.id, color: COLOR_PUNTO[p.tono] || COLOR_PUNTO.neutro, elegido: Boolean(p.elegido) }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })),
      });
      if (!encuadrar || (!zonas.length && !puntos.length)) return;
      const limites = new maplibregl.LngLatBounds();
      for (const z of zonas) for (const c of circulo(z.lat, z.lng, z.radio)) limites.extend(c);
      for (const p of puntos) limites.extend([p.lng, p.lat]);
      mapa.fitBounds(limites, { padding: 48, maxZoom: 17, duration: 0 });
    },
    destruir() {
      popup.remove();
      mapa.remove();
    },
  };
}
