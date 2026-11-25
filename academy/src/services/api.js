import axios from 'axios';

/* Cliente de la API de AvantCode Academy. */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5100/api';

export const ORIGEN_API = API_URL.replace(/\/api\/?$/, '');
export const CLAVE_TOKEN = 'academy_token';
export const CLAVE_ALUMNO = 'academy_alumno';

/* localStorage puede no existir (modo privado, bloqueos): siempre con try/catch. */
export const almacen = {
  leer(clave) {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  },
  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
  },
  borrar(clave) {
    try {
      localStorage.removeItem(clave);
    } catch {
      /* nada */
    }
  },
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = almacen.leer(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* Si el token venció, se cierra la sesión local y se avisa a la app. */
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/login') && almacen.leer(CLAVE_TOKEN)) {
      almacen.borrar(CLAVE_TOKEN);
      almacen.borrar(CLAVE_ALUMNO);
      window.dispatchEvent(new Event('academy:sesion-expirada'));
    }
    return Promise.reject(error);
  }
);

/* Mensaje legible de un error de la API. */
export const mensajeError = (error, porDefecto = 'Algo salió mal. Intenta de nuevo.') =>
  error?.response?.data?.error || (error?.request && !error?.response ? 'No hay conexión con el servidor.' : porDefecto);

/* Código de error de la API (p. ej. CORREO_NO_VERIFICADO). */
export const codigoError = (error) => error?.response?.data?.codigo || null;

export default api;
