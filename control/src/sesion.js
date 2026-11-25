import { useSyncExternalStore } from "react";

/*
  Sesión en AvantCode Control: el token de la API y lo básico de la persona
  y su empresa, guardados en este navegador (en la app móvil irán al
  almacenamiento seguro del teléfono). `api()` agrega el token y convierte
  los errores de la API en Error con su mensaje en español.
*/
const CLAVE = "avantcode_control_sesion";
const oyentes = new Set();
let cache;

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    return null;
  }
};

export const leerSesion = () => {
  if (cache === undefined) cache = leer();
  return cache;
};

export const guardarSesion = (sesion) => {
  cache = sesion || null;
  try {
    if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* modo privado: la sesión dura lo que dure la pestaña */
  }
  oyentes.forEach((f) => f());
};

/* Actualiza los datos de la persona o la empresa sin tocar el token. */
export const actualizarSesion = (datos) => {
  const actual = leerSesion();
  if (actual) guardarSesion({ ...actual, ...datos });
};

/* Hook: la sesión actual, y se vuelve a pintar cuando cambia. */
export const useSesion = () =>
  useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    leerSesion
  );

export const esDueno = (sesion) => sesion?.usuario?.rol === "dueno";
export const administra = (sesion) => ["dueno", "administrador"].includes(sesion?.usuario?.rol);

export async function api(ruta, { metodo = "GET", datos } = {}) {
  const token = leerSesion()?.token;
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: {
        ...(datos ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch {
    throw new Error("No hay conexión con AvantCode Control. Revisa tu internet e intenta de nuevo.");
  }
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    // Sesión terminada: se borra y la página vuelve al inicio de sesión.
    if (respuesta.status === 401 && token && ["SESION_VENCIDA", "SIN_SESION"].includes(cuerpo.codigo)) guardarSesion(null);
    // Prueba terminada o empresa suspendida: se cierra la sesión y el inicio de sesión dice por qué.
    if (respuesta.status === 403 && token && ["PRUEBA_TERMINADA", "EMPRESA_SUSPENDIDA"].includes(cuerpo.codigo)) {
      try {
        sessionStorage.setItem("control_aviso", cuerpo.error || "");
      } catch {
        /* modo privado */
      }
      guardarSesion(null);
    }
    const error = new Error(cuerpo.error || "Algo salió mal. Intenta de nuevo.");
    error.codigo = cuerpo.codigo;
    error.estado = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export const ROLES = { dueno: "Dueño", administrador: "Administrador", rh: "Recursos Humanos", supervisor: "Supervisor", empleado: "Empleado" };
