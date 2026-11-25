import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Marca from '../Marca/Marca';
import Avatar from '../UI/Avatar';
import { SECCIONES } from './navegacion';

/* Barra lateral oscura del área del alumno (igual que en el sistema). */
const Sidebar = ({ onItemClick }) => {
  const { alumno, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const cerrar = () => onItemClick?.();

  return (
    <aside className="lateral h-full" aria-label="Navegación principal">
      <div className="px-3 pb-2">
        <Link to="/panel" onClick={cerrar} aria-label="AvantCode Academy, inicio">
          <Marca claro />
        </Link>
      </div>

      <nav className="scroll-fino -mx-1 flex-1 overflow-y-auto px-1">
        {SECCIONES.map((seccion) => (
          <div key={seccion.titulo}>
            <p className="lateral-seccion">{seccion.titulo}</p>
            <ul className="space-y-0.5">
              {seccion.enlaces.map(({ to, icono: Icono, texto }) => (
                <li key={to}>
                  <NavLink to={to} end onClick={cerrar} className="lateral-enlace">
                    <Icono strokeWidth={1.9} />
                    <span className="truncate">{texto}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Invitación al catálogo */}
        <Link
          to="/cursos"
          onClick={cerrar}
          className="mx-1 mt-6 block rounded-[20px] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.03] p-4 text-white transition-colors hover:from-white/[.13]"
        >
          <span className="app-icono app-icono-sm bg-lima/15 text-lima shadow-none ring-1 ring-lima/20">
            <Compass />
          </span>
          <span className="mt-3 block text-sm font-semibold">Aprende algo nuevo</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
            Desarrollo web, IA, marketing y más.
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-lima">
            Ver catálogo <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </nav>

      <div className="glass-oscuro mt-4 flex items-center gap-3 rounded-[18px] p-2.5">
        <Link to="/perfil" onClick={cerrar} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl">
          <Avatar persona={alumno} tamano={38} className="!ring-white/10" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{alumno?.nombre_completo}</span>
            <span className="block truncate text-xs text-white/50">Alumno</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            cerrarSesion();
            cerrar();
            navigate('/');
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-[17px] w-[17px]" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
