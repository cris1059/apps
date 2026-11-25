/*
  Apertura de control.avantcode.mx. Mientras la API diga { abierto: false },
  el público ve "Muy pronto"; quien abre la ruta de trabajo
  (control.avantcode.mx/<ruta>) la ve completa. La ruta nunca va en el
  código: la API solo confirma si la que se abrió es la correcta, y este
  navegador la recuerda para seguir navegando.
*/
const CLAVE = "avantcode_control_vista_previa";

/* Primer nivel de las páginas de la plataforma: una ruta de trabajo no puede ser ninguna. */
const RUTAS_PROPIAS = new Set(["demo", "sso", "configurar", "planes", "entrar", "panel", "primer-acceso", "mi-jornada", "aviso-de-privacidad", "terminos"]);

/* "/featureupdate…" → "featureupdate…"; cualquier página propia → null. */
export function rutaCandidata(pathname) {
  const partes = pathname.split("/").filter(Boolean);
  if (partes.length !== 1) return null;
  const ruta = partes[0].toLowerCase();
  return RUTAS_PROPIAS.has(ruta) ? null : ruta;
}

export const leerRuta = () => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};

export const guardarRuta = (ruta) => {
  try {
    if (ruta) localStorage.setItem(CLAVE, ruta);
    else localStorage.removeItem(CLAVE);
  } catch {
    /* modo privado: vale solo en esta visita */
  }
};

export async function consultarEstado() {
  const r = await fetch("/api/estado");
  if (!r.ok) throw new Error("Sin respuesta");
  return r.json();
}

export async function validarRuta(ruta) {
  const r = await fetch("/api/acceso-previo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ruta }),
  });
  if (!r.ok) return false;
  return Boolean((await r.json()).ok);
}
