import { useCallback, useEffect, useState } from "react";
import { Camera, MapPin, Smartphone } from "lucide-react";

/*
  Ubicación y cámara de este equipo: cómo están los permisos y cómo
  dejarlos en «Permitir» para que el celular ya no pregunte cada vez. El
  permiso lo guarda el navegador (o el sistema del teléfono), no la página:
  aquí se explica dónde activarlo según el equipo.
*/

const ESTADO = {
  granted: { texto: "Permitida: ya no te pregunta", clase: "badge-success" },
  prompt: { texto: "Te pregunta cada vez", clase: "badge-warning" },
  denied: { texto: "Bloqueada", clase: "badge-error" },
  desconocido: { texto: "Sin dato", clase: "badge-neutral" },
};

const equipo = () => {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "computadora";
};
const instalada = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

const PASOS = {
  iphone: [
    "Ajustes › Privacidad y seguridad › Localización: activada. En «Sitios web de Safari» elige «Mientras se usa la app» y activa «Ubicación exacta».",
    "Ajustes › Safari (en iOS 18: Ajustes › Apps › Safari) › Ubicación: «Permitir» y Cámara: «Permitir».",
    "Si abres Control desde el ícono de tu pantalla de inicio, el iPhone puede volver a preguntar al abrirlo: con «Permitir» en Safari pregunta mucho menos. La app de Control para iPhone (en camino) lo guarda para siempre.",
  ],
  android: [
    "En Chrome, toca el ícono junto a control.avantcode.mx (candado o ⓘ) › Permisos: Ubicación «Permitir» y Cámara «Permitir». No elijas «Solo esta vez».",
    "Si lo instalaste en tu pantalla de inicio: mantén presionado el ícono de Control › Información de la app › Permisos: Ubicación «Permitir solo mientras se usa la app» y Cámara «Permitir».",
    "Revisa también Ajustes › Ubicación: activada y con «Precisión de la ubicación de Google».",
  ],
  computadora: [
    "Toca el candado junto a la dirección (control.avantcode.mx) › Ubicación: «Permitir» y Cámara: «Permitir».",
    "En la computadora la ubicación es aproximada: para marcar con la ubicación exacta usa tu celular.",
  ],
};

function PermisosDispositivo() {
  const [estados, setEstados] = useState({ geolocation: "desconocido", camera: "desconocido" });
  const [probando, setProbando] = useState(false);

  const revisar = useCallback(async () => {
    const consultar = async (nombre) => {
      try {
        return (await navigator.permissions.query({ name: nombre })).state;
      } catch {
        return "desconocido";
      }
    };
    setEstados({ geolocation: await consultar("geolocation"), camera: await consultar("camera") });
  }, []);

  useEffect(() => {
    revisar();
    // Desde «Déjalas permitidas» (…/cuenta#permisos): baja hasta aquí.
    if (window.location.hash === "#permisos") {
      const t = setTimeout(() => document.getElementById("permisos")?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [revisar]);

  // Pide los dos permisos una vez: así el navegador muestra su pregunta y se puede elegir «Permitir».
  const probar = async () => {
    setProbando(true);
    await new Promise((resolver) => navigator.geolocation?.getCurrentPosition(resolver, resolver, { timeout: 10000 }) ?? resolver());
    try {
      const flujo = await navigator.mediaDevices?.getUserMedia({ video: true, audio: false });
      flujo?.getTracks().forEach((t) => t.stop());
    } catch {
      /* el estado lo dice abajo */
    }
    await revisar();
    setProbando(false);
  };

  const e = equipo();
  return (
    <section className="card" id="permisos">
      <h2 className="card-titulo mb-2">
        <Smartphone className="h-5 w-5 text-tinta-3" /> Ubicación y cámara en este {e === "computadora" ? "equipo" : "celular"}
      </h2>
      <p className="mb-3 text-sm text-tinta-2">
        Para que ya no te pregunte cada vez, deja los dos permisos en «Permitir». Los guarda tu {e === "computadora" ? "navegador" : "teléfono"}, no la página.
        {instalada() ? " Estás usando Control desde tu pantalla de inicio." : ""}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`badge ${ESTADO[estados.geolocation]?.clase || "badge-neutral"}`}>
          <MapPin className="mr-1 h-3.5 w-3.5" /> Ubicación: {ESTADO[estados.geolocation]?.texto || estados.geolocation}
        </span>
        <span className={`badge ${ESTADO[estados.camera]?.clase || "badge-neutral"}`}>
          <Camera className="mr-1 h-3.5 w-3.5" /> Cámara: {ESTADO[estados.camera]?.texto || estados.camera}
        </span>
      </div>
      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-tinta-2">
        {PASOS[e].map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <button type="button" className="btn-secondary" onClick={probar} disabled={probando}>
        {probando ? "Revisando…" : "Pedir los permisos ahora"}
      </button>
    </section>
  );
}

export default PermisosDispositivo;
