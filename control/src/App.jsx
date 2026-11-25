import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { consultarEstado, guardarRuta, leerRuta, rutaCandidata, validarRuta } from "./acceso";
import { leerSesion } from "./sesion";
import MuyPronto from "./paginas/MuyPronto";
import Entrar from "./paginas/Entrar";
import PrimerAcceso from "./paginas/PrimerAcceso";
import Sso from "./paginas/Sso";
import Layout from "./componentes/Layout";
import Inicio from "./paginas/panel/Inicio";
import Personas from "./paginas/panel/Personas";
import Suscripcion from "./paginas/panel/Suscripcion";
import MiCuenta from "./paginas/panel/MiCuenta";
import MisRegistros from "./paginas/jornada/MisRegistros";
import EntradasSalidas from "./paginas/jornada/EntradasSalidas";
import Correcciones from "./paginas/jornada/Correcciones";
import Reportes from "./paginas/jornada/Reportes";
import Ubicacion from "./paginas/jornada/Ubicacion";
import Turnos from "./paginas/jornada/Turnos";
import Calendario from "./paginas/jornada/Calendario";
import Costos from "./paginas/jornada/Costos";
import Cumplimiento from "./paginas/jornada/Cumplimiento";
import Bitacora from "./paginas/jornada/Bitacora";
import Actividades from "./paginas/jornada/Actividades";
import Configuracion from "./paginas/jornada/Configuracion";
import Dispositivos from "./paginas/jornada/Dispositivos";
import Kiosco from "./paginas/Kiosco";

/*
  control.avantcode.mx — AvantCode Control como producto aparte (plan del
  2026-11-16). Aquí vivirán la página de venta, la demo, el configurador, el
  registro, el inicio de sesión y los paneles. Mientras no abra al público,
  solo se ve completo desde la ruta de trabajo (ver acceso.js).
*/
function App() {
  const { pathname } = useLocation();
  const [acceso, setAcceso] = useState("revisando"); // revisando | publico | previo | cerrado

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { abierto } = await consultarEstado();
        if (abierto) return vivo && setAcceso("publico");
        const candidata = rutaCandidata(pathname);
        for (const ruta of [candidata, leerRuta()].filter(Boolean)) {
          if (await validarRuta(ruta)) {
            guardarRuta(ruta);
            return vivo && setAcceso("previo");
          }
        }
        if (leerRuta()) guardarRuta(null);
        if (vivo) setAcceso("cerrado");
      } catch {
        if (vivo) setAcceso("cerrado");
      }
    })();
    return () => {
      vivo = false;
    };
    // Solo al entrar: la ruta de trabajo se valida una vez por visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (acceso === "revisando") return <div className="cargando" aria-busy="true" />;
  if (acceso === "cerrado") return <MuyPronto />;

  return (
    <Routes>
      {/* Como sistema.avantcode.mx: la portada es el inicio de sesión. */}
      <Route path="/" element={leerSesion() ? <Navigate to="/panel" replace /> : <Entrar />} />
      <Route path="/primer-acceso" element={<PrimerAcceso />} />
      {/* «Entrar a Control» desde Mi AvantCode (una sola cuenta). */}
      <Route path="/sso" element={<Sso />} />
      {/* La tableta del kiosco de la sucursal (sin sesión de persona: usa su propia llave). */}
      <Route path="/kiosco" element={<Kiosco />} />
      <Route path="/panel" element={<Layout />}>
        {/* Las mismas secciones y nombres que la demo de avantcode.mx (/demo/control). */}
        <Route index element={<Inicio />} />
        <Route path="entradas-y-salidas" element={<EntradasSalidas />} />
        <Route path="ubicacion" element={<Ubicacion />} />
        <Route path="empleados" element={<Personas />} />
        <Route path="turnos" element={<Turnos />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="actividades" element={<Actividades />} />
        <Route path="solicitudes" element={<Correcciones />} />
        <Route path="costos" element={<Costos />} />
        <Route path="cumplimiento" element={<Cumplimiento />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="bitacora" element={<Bitacora />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="dispositivos" element={<Dispositivos />} />
        <Route path="suscripcion" element={<Suscripcion />} />
        <Route path="cuenta" element={<MiCuenta />} />
        {/* Mi jornada (cada persona que registra) */}
        {/* Marcar vive en Entradas y salidas («Mi jornada»); el QR del kiosco llega aquí con ?k=… */}
        <Route path="marcar" element={<EntradasSalidas />} />
        <Route path="mis-registros" element={<MisRegistros />} />
        {/* Nombres anteriores */}
        <Route path="equipo" element={<Navigate to="/panel" replace />} />
        <Route path="registros" element={<Navigate to="/panel/entradas-y-salidas" replace />} />
        <Route path="personas" element={<Navigate to="/panel/empleados" replace />} />
        <Route path="horarios" element={<Navigate to="/panel/turnos" replace />} />
        <Route path="sucursales" element={<Navigate to="/panel/ubicacion" replace />} />
        <Route path="correcciones" element={<Navigate to="/panel/solicitudes" replace />} />
      </Route>
      {/* La ruta de trabajo, ya validada, lleva al inicio. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
