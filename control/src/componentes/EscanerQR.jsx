import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import Modal from "./Modal";

/*
  Lector del código QR del kiosco, dentro de AvantCode Control: abre la
  cámara trasera del celular, busca el código y devuelve su clave
  (id.ventana.firma) para marcar en esa sucursal. Usa el lector del
  navegador (BarcodeDetector) si existe; si no, jsQR. Nada se guarda.
*/

/* Del texto del QR («https://control.avantcode.mx/panel/marcar?k=…» o la clave sola) a la clave. */
export const claveDelQR = (texto) => {
  const t = String(texto || "").trim();
  try {
    const k = new URL(t).searchParams.get("k");
    if (k) return /^\d+\.\d+\.[\w-]{16}$/.test(k) ? k : null;
  } catch {
    /* no es un enlace */
  }
  return /^\d+\.\d+\.[\w-]{16}$/.test(t) ? t : null;
};

function EscanerQR({ onLeido, onCerrar }) {
  const video = useRef(null);
  const lienzo = useRef(null);
  const [estado, setEstado] = useState("abriendo"); // abriendo | buscando | error
  const [mensaje, setMensaje] = useState("");
  const leido = useRef(false);
  const avisar = useRef(onLeido);
  avisar.current = onLeido;

  useEffect(() => {
    let flujo = null;
    let vivo = true;
    let reloj = null;
    let detector = null;
    let jsQR = null;

    const detener = () => {
      clearTimeout(reloj);
      flujo?.getTracks().forEach((t) => t.stop());
    };

    const revisar = async () => {
      if (!vivo || leido.current) return;
      const v = video.current;
      if (v && v.readyState >= 2) {
        let texto = null;
        try {
          if (detector) {
            const codigos = await detector.detect(v);
            texto = codigos[0]?.rawValue || null;
          } else if (jsQR) {
            const c = lienzo.current;
            const ancho = v.videoWidth;
            const alto = v.videoHeight;
            if (ancho && alto) {
              c.width = ancho;
              c.height = alto;
              const ctx = c.getContext("2d", { willReadFrequently: true });
              ctx.drawImage(v, 0, 0, ancho, alto);
              texto = jsQR(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto, { inversionAttempts: "dontInvert" })?.data || null;
            }
          }
        } catch {
          /* se intenta con el siguiente cuadro */
        }
        if (texto) {
          const clave = claveDelQR(texto);
          if (clave) {
            leido.current = true;
            if (navigator.vibrate) navigator.vibrate(60);
            detener();
            avisar.current(clave);
            return;
          }
          setMensaje("Ese código no es de un kiosco de AvantCode Control. Apunta al QR que muestra la tableta de tu sucursal.");
        }
      }
      reloj = setTimeout(revisar, 160);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("error");
        setMensaje("Este navegador no puede usar la cámara. Abre control.avantcode.mx en Chrome o Safari de tu celular.");
        return;
      }
      try {
        if ("BarcodeDetector" in window) {
          const formatos = await window.BarcodeDetector.getSupportedFormats?.();
          if (!formatos || formatos.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        }
        if (!detector) jsQR = (await import("jsqr")).default;
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!vivo) return detener();
        video.current.srcObject = flujo;
        await video.current.play().catch(() => {});
        setEstado("buscando");
        revisar();
      } catch (e) {
        setEstado("error");
        setMensaje(
          e?.name === "NotAllowedError"
            ? "Permite el uso de la cámara: toca el candado junto a la dirección › Cámara › Permitir, y vuelve a intentar."
            : e?.name === "NotFoundError"
              ? "No encontramos una cámara en este equipo. Usa tu celular."
              : "No pudimos abrir la cámara. Cierra otras apps que la estén usando e intenta de nuevo."
        );
      }
    })();

    return () => {
      vivo = false;
      detener();
    };
  }, []);

  return (
    <Modal onCerrar={onCerrar} titulo="Marcar con el QR del kiosco" descripcion="Apunta la cámara al código que muestra la tableta de tu sucursal.">
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: "#111", aspectRatio: "3 / 4", maxHeight: "60vh", margin: "0 auto" }}>
        <video ref={video} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <canvas ref={lienzo} hidden />
        {estado === "buscando" && (
          <span
            aria-hidden="true"
            style={{ position: "absolute", inset: "18%", border: "3px solid #D4FF3F", borderRadius: 22, boxShadow: "0 0 0 999px rgba(0,0,0,.35)" }}
          />
        )}
        {estado === "abriendo" && (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", gap: 8 }}>
            <LoaderCircle className="h-6 w-6 animate-spin" /> Abriendo la cámara…
          </span>
        )}
        {estado === "error" && (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", padding: 24, textAlign: "center" }}>
            <Camera className="h-7 w-7" />
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-tinta-2" role="status">
        {mensaje || (estado === "buscando" ? "Buscando el código… mantenlo dentro del recuadro." : "")}
      </p>
      <div className="mt-3 flex justify-end">
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
}

export default EscanerQR;
