import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dock from './Dock';

/* Área del alumno: marco oscuro con la barra lateral + lienzo claro
   redondeado con luces ambientales detrás del vidrio (igual que el sistema). */
const PanelLayout = () => {
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);
  const scrollRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setCajonAbierto(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    if (!cajonAbierto) return;
    const alPresionar = (e) => e.key === 'Escape' && setCajonAbierto(false);
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [cajonAbierto]);

  return (
    <div className="app">
      <div className="relative hidden lg:flex">
        <Sidebar />
      </div>

      {cajonAbierto && (
        <>
          <div className="cajon-fondo lg:hidden" onClick={() => setCajonAbierto(false)} />
          <div className="cajon lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
            <Sidebar onItemClick={() => setCajonAbierto(false)} />
          </div>
        </>
      )}

      <div className="app-lienzo">
        <div className="ambiente" aria-hidden="true">
          <span className="ambiente-luz ambiente-luz--lima" />
          <span className="ambiente-luz ambiente-luz--violeta" />
          <span className="ambiente-luz ambiente-luz--teal" />
        </div>

        <div ref={scrollRef} className="app-scroll" onScroll={(e) => setConSombra(e.currentTarget.scrollTop > 8)}>
          <Header onMenuClick={() => setCajonAbierto(true)} conSombra={conSombra} />
          <main id="contenido" className="app-contenido">
            <Outlet />
          </main>
        </div>

        <Dock onMenuClick={() => setCajonAbierto(true)} />
      </div>
    </div>
  );
};

export default PanelLayout;
