import { leerSesion } from "../../sesion";

/* Lo que comparten las pantallas del registro de jornada. */

export const TIPOS = {
  entrada: { texto: "Entrada", accion: "Registrar entrada" },
  inicio_descanso: { texto: "Inicio de descanso", accion: "Iniciar descanso" },
  fin_descanso: { texto: "Fin de descanso", accion: "Terminar descanso" },
  salida: { texto: "Salida", accion: "Registrar salida" },
};

export const ESTADOS_MARCAJE = {
  validado: { texto: "En su zona", clase: "badge-success" },
  registrado: { texto: "Registrado", clase: "badge-neutral" },
  fuera_de_zona: { texto: "Fuera de zona", clase: "badge-warning" },
  corregido: { texto: "Corregido", clase: "badge-neutral" },
  sincronizado_tarde: { texto: "Llegó después", clase: "badge-info" },
};

export const MODALIDADES = {
  sucursal: { texto: "En su sucursal u oficina", corto: "Sucursal" },
  home_office: { texto: "Home office", corto: "Home office" },
  viaje: { texto: "De viaje (desde cualquier lugar)", corto: "De viaje" },
};

export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/* 450 → "7 h 30 min" */
export const duracion = (minutos) => {
  const m = Math.max(0, Math.round(Number(minutos) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
};

export const horasDecimal = (minutos) => (Math.round(((Number(minutos) || 0) / 60) * 10) / 10).toLocaleString("es-MX");

export const fechaLarga = (fecha) =>
  new Date(`${fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

export const fechaCorta = (fecha) => new Date(`${fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

/* Fecha local de hoy 'AAAA-MM-DD' (del navegador). */
export const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const enlaceMapa = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

/* ¿Es una computadora? (sin GPS: el navegador la ubica por internet o por el Wi-Fi). */
export const esComputadora = () => {
  const ua = navigator.userAgent || "";
  // El iPad con iPadOS se presenta como Mac: se reconoce por la pantalla táctil.
  const ipad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return !ipad && !/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
};

/* Texto del lugar de un marcaje, con «ubicación aproximada» si se hizo desde computadora. */
export const lugarDe = (m) => [m.lugar, m.aproximada ? "ubicación aproximada (computadora)" : null].filter(Boolean).join(" · ");

/* «±12 m» o «±20 km». */
export const textoPrecision = (m) => (m >= 1000 ? `±${Math.round(m / 1000)} km` : `±${Math.round(m)} m`);

/*
  Ubicación actual, lo más exacta posible: el GPS se afina en los primeros
  segundos, así que escucha varias lecturas y se queda con la mejor. Termina
  en cuanto una llega a 30 m o menos; si no, 4 s después de la primera (como
  máximo 12 s en total). Mensajes claros si falla.
*/
export const ubicacionActual = ({ objetivo = 30, despuesDeLaPrimera = 4000, maximo = 12000 } = {}) =>
  new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) {
      rechazar(new Error("Tu navegador no comparte la ubicación. Abre control.avantcode.mx en Chrome o Safari de tu celular."));
      return;
    }
    let mejor = null;
    let listo = false;
    let reloj = null;
    let id = null;
    const fallo = (e) =>
      new Error(
        e?.code === 1
          ? "Para marcar, permite que control.avantcode.mx use tu ubicación (en los ajustes del navegador, junto a la dirección)."
          : e?.code === 3 || !e
            ? "Tu ubicación tardó demasiado. Sal a un lugar con mejor señal e intenta de nuevo."
            : "No pudimos obtener tu ubicación. Revisa que el GPS esté encendido."
      );
    const terminar = (error) => {
      if (listo) return;
      listo = true;
      if (id !== null) navigator.geolocation.clearWatch(id);
      clearTimeout(reloj);
      clearTimeout(tope);
      if (mejor) resolver(mejor);
      else rechazar(fallo(error));
    };
    const tope = setTimeout(() => terminar(null), maximo);
    id = navigator.geolocation.watchPosition(
      (p) => {
        const lectura = { latitud: p.coords.latitude, longitud: p.coords.longitude, precision: p.coords.accuracy };
        const primera = !mejor;
        if (!mejor || lectura.precision < mejor.precision) mejor = lectura;
        if (lectura.precision <= objetivo) terminar();
        else if (primera) reloj = setTimeout(() => terminar(), despuesDeLaPrimera);
      },
      (e) => {
        if (e.code === 1 || !mejor) terminar(e);
      },
      { enableHighAccuracy: true, timeout: maximo, maximumAge: 0 }
    );
  });

/* Descarga un archivo de la API con la sesión (el reporte en CSV). */
export async function descargar(ruta, nombre) {
  const token = leerSesion()?.token;
  const r = await fetch(`/api${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!r.ok) {
    const cuerpo = await r.json().catch(() => ({}));
    throw new Error(cuerpo.error || "No se pudo descargar el reporte.");
  }
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const GESTIONAN = ["dueno", "administrador", "rh", "supervisor"];
export const gestionaJornada = (sesion) => GESTIONAN.includes(sesion?.usuario?.rol);
