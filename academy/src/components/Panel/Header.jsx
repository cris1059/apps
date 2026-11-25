import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Compass, Gift } from 'lucide-react';
import Marca from '../Marca/Marca';
import MenuPerfil from './MenuPerfil';
import { tituloDeRuta } from './navegacion';
import { alumnoService } from '../../services/alumno';
import { moneda } from '../../utils/formato';

/* Barra superior de vidrio dentro del lienzo. */
const Header = ({ onMenuClick, conSombra }) => {
  const { pathname } = useLocation();
  const [saldo, setSaldo] = useState(null);

  // Saldo por invitaciones (se vuelve a leer al cambiar de sección, p. ej. después de inscribirse).
  useEffect(() => {
    let vivo = true;
    alumnoService
      .saldo()
      .then((d) => vivo && setSaldo(d.saldo))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [pathname]);

  return (
    <header className={`barra${conSombra ? ' barra--sombra' : ''}`}>
      <button type="button" onClick={onMenuClick} className="btn-icono -ml-2 lg:hidden" aria-label="Abrir menú">
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/panel" className="lg:hidden" aria-label="AvantCode Academy, inicio">
        <Marca className="[&_.marca-nombre]:hidden sm:[&_.marca-nombre]:inline" />
      </Link>

      <nav aria-label="Ubicación" className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
        <span className="text-tinta-3">Academy</span>
        <span className="text-gray-300">/</span>
        <span className="truncate font-semibold text-tinta">{tituloDeRuta(pathname)}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {saldo !== null && (
          <Link
            to="/invita"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-negro px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            title="Tu saldo por invitaciones"
          >
            <Gift className="h-4 w-4 text-lima" />
            <span className="numero">{moneda(saldo)}</span>
            <span className="sr-only">de saldo. Invita y gana.</span>
          </Link>
        )}
        <Link to="/cursos" className="btn-primary btn-sm hidden sm:inline-flex">
          <Compass className="h-4 w-4" />
          Explorar cursos
        </Link>
        <span className="mx-1 hidden h-6 w-px bg-black/10 sm:block" aria-hidden="true" />
        <MenuPerfil />
      </div>
    </header>
  );
};

export default Header;
