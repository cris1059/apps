import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import '../../styles/sitio.css';

/* Sitio público: página blanca con esquinas redondeadas sobre el pie oscuro
   (como avantcodeapp.com, rama version-2027). */
const SitioLayout = () => {
  const { hash, pathname } = useLocation();

  // Enlaces con ancla (/#como-funciona): desplazarse a la sección.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [hash, pathname]);

  return (
    <div className="ac-sitio">
      <div className="ac-pagina">
        <Navbar />
        <main id="contenido" tabIndex={-1} className="outline-none">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default SitioLayout;
