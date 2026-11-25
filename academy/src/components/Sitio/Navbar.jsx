import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutGrid, LogOut, Menu, X, BookOpen, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Marca from '../Marca/Marca';
import Avatar from '../UI/Avatar';

export const ENLACES = [
  { to: '/cursos', texto: 'Cursos' },
  { to: '/#como-funciona', texto: 'Cómo funciona', hash: true },
  { to: '/#certificados', texto: 'Certificados', hash: true },
];

/* Menú de la cuenta del alumno (sólido: dentro de la barra con blur). */
const MenuCuenta = () => {
  const { alumno, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => !ref.current?.contains(e.target) && setAbierto(false);
    const tecla = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    window.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const primerNombre = alumno?.nombre_completo?.split(' ')[0];

  return (
    <div className="ac-cuenta" ref={ref}>
      <button
        type="button"
        className="ac-cuenta-boton"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <Avatar persona={alumno} tamano={32} />
        <span className="hidden max-w-[9rem] truncate sm:inline">{primerNombre}</span>
        <ChevronDown className={`h-4 w-4 text-tinta-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <div className="ac-cuenta-panel" role="menu">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <Avatar persona={alumno} tamano={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-tinta">{alumno?.nombre_completo}</p>
              <p className="truncate text-xs text-tinta-3">{alumno?.correo}</p>
            </div>
          </div>
          <div className="divisor mx-1 mb-1" />
          <Link to="/panel" role="menuitem" onClick={() => setAbierto(false)}>
            <LayoutGrid className="h-[18px] w-[18px] text-tinta-2" /> Mi panel
          </Link>
          <Link to="/mis-cursos" role="menuitem" onClick={() => setAbierto(false)}>
            <BookOpen className="h-[18px] w-[18px] text-tinta-2" /> Mis cursos
          </Link>
          <Link to="/perfil" role="menuitem" onClick={() => setAbierto(false)}>
            <UserCircle2 className="h-[18px] w-[18px] text-tinta-2" /> Mi perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            className="ac-peligro"
            onClick={() => {
              setAbierto(false);
              cerrarSesion();
              navigate('/');
            }}
          >
            <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { alumno, estaAutenticado, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setAbierto(false), [pathname, hash]);

  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 8);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  // Bloquea el scroll y escucha Escape mientras el menú móvil está abierto.
  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    const tecla = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', tecla);
    return () => {
      html.style.overflow = '';
      window.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const volver = pathname !== '/' ? `?volver=${encodeURIComponent(pathname)}` : '';

  return (
    <header className={`ac-nav${conSombra ? ' ac-nav--sombra' : ''}${abierto ? ' ac-nav--abierta' : ''}`}>
      <a className="ac-saltar" href="#contenido">Saltar al contenido</a>
      <div className="ac-contenedor ac-contenedor--amplio ac-nav-in">
        <Link to="/" className="ac-nav-marca" aria-label="AvantCode Academy, inicio">
          <Marca />
        </Link>

        <nav className="ac-nav-enlaces" aria-label="Principal">
          {ENLACES.map((e) =>
            e.hash ? (
              <Link key={e.to} to={e.to}>{e.texto}</Link>
            ) : (
              <NavLink key={e.to} to={e.to}>{e.texto}</NavLink>
            )
          )}
        </nav>

        <div className="ac-nav-derecha">
          {estaAutenticado ? (
            <>
              <Link to="/panel" className="ac-btn ac-btn--negro ac-btn--chico ac-nav-cta">Mi panel</Link>
              <MenuCuenta />
            </>
          ) : (
            <>
              <Link to={`/entrar${volver}`} className="ac-nav-acceso">Entrar</Link>
              <Link to={`/registro${volver}`} className="ac-btn ac-btn--negro ac-btn--chico ac-nav-cta">
                Crear cuenta
              </Link>
            </>
          )}
          <button
            type="button"
            className="ac-nav-menu"
            aria-expanded={abierto}
            aria-controls="ac-menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div id="ac-menu-movil" className="ac-menu-movil" hidden={!abierto}>
        <nav aria-label="Menú móvil">
          {estaAutenticado && (
            <div className="ac-menu-movil-alumno">
              <Avatar persona={alumno} tamano={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-tinta">{alumno?.nombre_completo}</p>
                <p className="truncate text-xs text-tinta-3">{alumno?.correo}</p>
              </div>
            </div>
          )}
          <Link to="/">Inicio</Link>
          {ENLACES.map((e) => <Link key={e.to} to={e.to}>{e.texto}</Link>)}
          {estaAutenticado && (
            <>
              <Link to="/mis-cursos">Mis cursos</Link>
              <Link to="/perfil">Mi perfil</Link>
            </>
          )}
        </nav>
        <div className="ac-menu-movil-acciones">
          {estaAutenticado ? (
            <>
              <Link to="/panel" className="ac-btn ac-btn--negro ac-btn--grande">Ir a mi panel</Link>
              <button
                type="button"
                className="ac-btn ac-btn--gris ac-btn--grande"
                onClick={() => {
                  setAbierto(false);
                  cerrarSesion();
                  navigate('/');
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to={`/registro${volver}`} className="ac-btn ac-btn--negro ac-btn--grande">Crear cuenta gratis</Link>
              <Link to={`/entrar${volver}`} className="ac-btn ac-btn--gris ac-btn--grande">Entrar</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
