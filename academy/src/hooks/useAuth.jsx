import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { almacen, CLAVE_ALUMNO, CLAVE_TOKEN } from '../services/api';

/* Sesión del alumno de AvantCode Academy. */
const AuthContext = createContext(null);

const leerAlumnoGuardado = () => {
  try {
    return JSON.parse(almacen.leer(CLAVE_ALUMNO) || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [alumno, setAlumno] = useState(() => (almacen.leer(CLAVE_TOKEN) ? leerAlumnoGuardado() : null));
  const [cargando, setCargando] = useState(() => !!almacen.leer(CLAVE_TOKEN));

  const guardarSesion = useCallback((token, datos) => {
    if (token) almacen.guardar(CLAVE_TOKEN, token);
    almacen.guardar(CLAVE_ALUMNO, JSON.stringify(datos));
    setAlumno(datos);
  }, []);

  const cerrarSesion = useCallback(() => {
    almacen.borrar(CLAVE_TOKEN);
    almacen.borrar(CLAVE_ALUMNO);
    setAlumno(null);
  }, []);

  // Al abrir la app con token guardado, se confirma con el servidor.
  useEffect(() => {
    if (!almacen.leer(CLAVE_TOKEN)) return;
    api
      .get('/auth/yo')
      .then(({ data }) => guardarSesion(null, data.alumno))
      .catch(() => cerrarSesion())
      .finally(() => setCargando(false));
  }, [guardarSesion, cerrarSesion]);

  useEffect(() => {
    const alExpirar = () => setAlumno(null);
    window.addEventListener('academy:sesion-expirada', alExpirar);
    return () => window.removeEventListener('academy:sesion-expirada', alExpirar);
  }, []);

  /* Lanza el error de axios tal cual: la pantalla decide qué mostrar
     (p. ej. codigo CORREO_NO_VERIFICADO). */
  const iniciarSesion = async (correo, contraseña) => {
    const { data } = await api.post('/auth/login', { correo, contraseña });
    guardarSesion(data.token, data.alumno);
    return data.alumno;
  };

  /* Tras verificar el correo, la API devuelve token + alumno. */
  const iniciarConToken = (token, datos) => guardarSesion(token, datos);

  const actualizarAlumno = (datos) => guardarSesion(null, datos);

  const recargarAlumno = async () => {
    const { data } = await api.get('/auth/yo');
    guardarSesion(null, data.alumno);
    return data.alumno;
  };

  const value = {
    alumno,
    cargando,
    estaAutenticado: !!alumno,
    iniciarSesion,
    iniciarConToken,
    cerrarSesion,
    actualizarAlumno,
    recargarAlumno,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
};
