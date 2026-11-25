import { Fragment, useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Coins,
  CreditCard,
  Fingerprint,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPinned,
  Menu,
  X,
  Scale,
  Settings,
  ShieldCheck,
  TabletSmartphone,
  Users,
} from "lucide-react";
import Marca from "./Marca";
import Campana from "./Campana";
import { iniciales } from "./demo/Bloques";
import { ROLES, administra, api, actualizarSesion, guardarSesion, useSesion } from "../sesion";
import { gestionaJornada } from "../paginas/jornada/comun";
import "../estilos/demo/demo-sistema.css";
import "../estilos/demo/control-sistema.css";
import "../estilos/demo/control-ley.css";
import "../estilos/demo/panel.css";

/*
  El panel de AvantCode Control con el mismo marco de la demo de avantcode.mx
  (/demo/control): menú lateral oscuro con los mismos grupos, nombres e
  íconos (Operación, Nómina y ley y Sistema), y arriba la píldora con la
  empresa y la fecha y el título de la sección. Cada quien ve lo de su rol.
*/

const VEN_COSTOS = ["dueno", "administrador", "rh"];
const PLAN = { esencial: "Esencial", empresarial: "Empresarial", corporativo: "Corporativo" };

/* Prueba gratis de 14 días (empezada en Mi AvantCode): cuántos días quedan y dónde contratarlo. */
function AvisoPrueba({ vence, dueno }) {
  const dias = Math.max(1, Math.ceil((new Date(vence).getTime() - Date.now()) / 86400000));
  const fecha = new Date(vence).toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  return (
    <div className={`ctl-prueba${dias <= 2 ? " ctl-prueba--pronto" : ""}`} role="status">
      <span>
        <strong>Prueba gratis:</strong> {dias === 1 ? "queda 1 día" : `quedan ${dias} días`} (hasta el {fecha}).
        {dueno ? " Contrátalo para seguir sin interrupciones." : " Pídele al dueño de tu empresa que lo contrate."}
      </span>
      {dueno && (
        <a href="https://mi.avantcode.mx/panel/tienda?probar=control" className="ctl-prueba-boton">
          Contratar en Mi AvantCode
        </a>
      )}
    </div>
  );
}

const seccionesDe = (sesion) => {
  const rol = sesion.usuario.rol;
  const gestiona = gestionaJornada(sesion);
  const admin = administra(sesion);
  const lista = (grupo, ...enlaces) => enlaces.filter(Boolean).map((e) => ({ ...e, grupo }));
  return [
    ...lista(
      "Operación",
      { to: "/panel", texto: "Inicio", Icono: LayoutDashboard, fin: true },
      { to: "/panel/entradas-y-salidas", texto: "Entradas y salidas", Icono: Fingerprint },
      gestiona && { to: "/panel/ubicacion", texto: "Ubicación y geocercas", Icono: MapPinned },
      admin && { to: "/panel/empleados", texto: "Empleados", Icono: Users },
      admin && { to: "/panel/turnos", texto: "Turnos", Icono: CalendarClock },
      gestiona && { to: "/panel/calendario", texto: "Calendario", Icono: CalendarDays },
      { to: "/panel/actividades", texto: gestiona ? "Actividades" : "Mis actividades", Icono: ListChecks },
      gestiona ? { to: "/panel/solicitudes", texto: "Solicitudes", Icono: ClipboardCheck } : { to: "/panel/mis-registros", texto: "Mis solicitudes", Icono: ClipboardCheck }
    ),
    ...(gestiona
      ? lista(
          "Nómina y ley",
          VEN_COSTOS.includes(rol) && { to: "/panel/costos", texto: "Horas extra y costos", Icono: Coins },
          { to: "/panel/cumplimiento", texto: "Cumplimiento", Icono: Scale },
          { to: "/panel/reportes", texto: "Reportes", Icono: BarChart3 }
        )
      : []),
    ...lista(
      "Sistema",
      VEN_COSTOS.includes(rol) && { to: "/panel/bitacora", texto: "Bitácora", Icono: ShieldCheck },
      admin && { to: "/panel/dispositivos", texto: "Kioscos y dispositivos", Icono: TabletSmartphone },
      admin && { to: "/panel/configuracion", texto: "Configuración", Icono: Settings },
      admin && { to: "/panel/suscripcion", texto: "Suscripción", Icono: CreditCard }
    ),
  ];
};

const TITULOS = {
  "/panel": "Inicio",
  "/panel/entradas-y-salidas": "Entradas y salidas",
  "/panel/marcar": "Entradas y salidas",
  "/panel/ubicacion": "Ubicación y geocercas",
  "/panel/empleados": "Empleados",
  "/panel/turnos": "Turnos",
  "/panel/calendario": "Calendario",
  "/panel/actividades": "Actividades",
  "/panel/solicitudes": "Solicitudes",
  "/panel/mis-registros": "Mis solicitudes",
  "/panel/costos": "Horas extra y costos",
  "/panel/cumplimiento": "Cumplimiento",
  "/panel/reportes": "Reportes",
  "/panel/bitacora": "Bitácora",
  "/panel/dispositivos": "Kioscos y dispositivos",
  "/panel/configuracion": "Configuración",
  "/panel/suscripcion": "Suscripción",
  "/panel/cuenta": "Mi cuenta",
};

/* ¿Pantalla de celular? (ahí el menú es un cajón con botón de hamburguesa). */
const MOVIL = "(max-width: 960px)";
function useMovil() {
  const [movil, setMovil] = useState(() => window.matchMedia(MOVIL).matches);
  useEffect(() => {
    const m = window.matchMedia(MOVIL);
    const cambiar = () => setMovil(m.matches);
    m.addEventListener("change", cambiar);
    return () => m.removeEventListener("change", cambiar);
  }, []);
  return movil;
}

const hoyLargo = () => {
  const t = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function Layout() {
  const sesion = useSesion();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const principal = useRef(null);
  const movil = useMovil();
  const [abierto, setAbierto] = useState(false);

  // El cajón se cierra al cambiar de sección o con Escape; mientras está abierto, la página no se desliza.
  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [abierto]);

  // Al cambiar de sección se vuelve arriba (en escritorio se desliza el lienzo; en celular, la página).
  useEffect(() => {
    principal.current?.scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Refresca quién soy (por si cambió el plan, el estado de la empresa o la sesión terminó).
  useEffect(() => {
    if (!sesion) return;
    api("/auth/yo")
      .then((r) => actualizarSesion(r))
      .catch(() => {});
    // Solo al entrar al panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sin sesión: al iniciarla vuelve aquí (por ejemplo, al marcar con el QR del kiosco escaneado con la cámara).
  if (!sesion) return <Navigate to={`/?volver=${encodeURIComponent(pathname + search)}`} replace />;
  if (sesion.usuario.debe_cambiar_contrasena) return <Navigate to="/primer-acceso" replace />;

  const salir = () => {
    guardarSesion(null);
    navigate("/", { replace: true });
  };
  const secciones = seccionesDe(sesion);
  const { usuario, empresa } = sesion;

  return (
    <div className={`dm dm--sistema dm--panel${abierto ? " dm--menu-abierto" : ""}`}>
      {movil && (
        <header className="dm-barra-movil">
          <button type="button" className="dm-hamburguesa" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(true)}>
            <Menu size={22} />
          </button>
          <Link to="/panel" aria-label="AvantCode Control, inicio">
            <Marca claro />
          </Link>
          <Campana />
        </header>
      )}
      <aside className="dm-lateral" inert={movil && !abierto} aria-label="Menú">
        <div className="dm-marca dm-marca--producto">
          <Link to="/panel" aria-label="AvantCode Control, inicio">
            <Marca claro />
          </Link>
          {movil && (
            <button type="button" className="dm-hamburguesa" aria-label="Cerrar menú" onClick={() => setAbierto(false)}>
              <X size={20} />
            </button>
          )}
        </div>
        <nav className="dm-nav" aria-label="Secciones">
          {secciones.map((s, i) => (
            <Fragment key={s.to}>
              {s.grupo !== secciones[i - 1]?.grupo && (
                <span className="dm-nav-grupo" aria-hidden="true">
                  {s.grupo}
                </span>
              )}
              <NavLink to={s.to} end={s.fin} className="dm-nav-item">
                <s.Icono size={18} strokeWidth={1.9} aria-hidden="true" />
                <span>{s.texto}</span>
              </NavLink>
            </Fragment>
          ))}
        </nav>
        <div className="dm-plan-chip">
          <Link to="/panel/cuenta" title="Mi cuenta">
            <span className="dm-avatar" aria-hidden="true">
              {iniciales(usuario.nombre)}
            </span>
            <span>
              <strong>{usuario.nombre}</strong>
              <span>
                {ROLES[usuario.rol]}
                {empresa.plan ? ` · Plan ${PLAN[empresa.plan]}` : ""}
              </span>
            </span>
          </Link>
          <button type="button" className="dm-plan-salir" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      {movil && <div className="dm-velo" aria-hidden="true" onClick={() => setAbierto(false)} />}

      <div className="dm-principal" ref={principal}>
        <header className="dm-top">
          <div className="dm-top-titulo">
            <span className="dm-top-etiqueta">
              <i aria-hidden="true" /> {empresa.nombre} · {hoyLargo()}
            </span>
            <h1>{TITULOS[pathname] || "AvantCode Control"}</h1>
          </div>
          <div className="dm-top-controles">{!movil && <Campana />}</div>
        </header>
        {empresa.prueba_vence && <AvisoPrueba vence={empresa.prueba_vence} dueno={usuario.rol === "dueno"} />}
        <main id="contenido" className="dm-contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
