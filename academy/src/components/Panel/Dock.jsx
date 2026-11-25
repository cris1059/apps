import { NavLink, Link } from 'react-router-dom';
import { LayoutGrid, BookOpen, Compass, Award, Menu } from 'lucide-react';

/* Dock flotante de vidrio para móvil. */
const Dock = ({ onMenuClick }) => (
  <nav className="dock glass-fuerte lg:hidden" aria-label="Accesos rápidos">
    <NavLink to="/panel" end aria-label="Inicio">
      <LayoutGrid className="h-5 w-5" />
    </NavLink>
    <NavLink to="/mis-cursos" end aria-label="Mis cursos">
      <BookOpen className="h-5 w-5" />
    </NavLink>
    <Link to="/cursos" className="dock-principal" aria-label="Explorar cursos">
      <Compass className="h-6 w-6" strokeWidth={2.2} />
    </Link>
    <NavLink to="/certificados" end aria-label="Certificados">
      <Award className="h-5 w-5" />
    </NavLink>
    <button type="button" onClick={onMenuClick} aria-label="Más opciones">
      <Menu className="h-5 w-5" />
    </button>
  </nav>
);

export default Dock;
