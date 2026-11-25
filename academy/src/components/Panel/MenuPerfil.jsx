import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle2, LogOut, ChevronDown, BadgeCheck, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../UI/Avatar';

/* Menú del avatar: datos de la cuenta, "Mi perfil" y "Cerrar sesión".
   Vive en <body> (portal) para que su vidrio difumine la página. */
const MenuPerfil = () => {
  const { alumno, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: 72, right: 16 });
  const botonRef = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    if (!abierto || !botonRef.current) return;
    const colocar = () => {
      const r = botonRef.current.getBoundingClientRect();
      setPosicion({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) });
    };
    colocar();
    window.addEventListener('resize', colocar);
    return () => window.removeEventListener('resize', colocar);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => {
      if (panelRef.current?.contains(e.target) || botonRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const alPresionar = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', alClicFuera);
    window.addEventListener('keydown', alPresionar);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      window.removeEventListener('keydown', alPresionar);
    };
  }, [abierto]);

  const opcion = 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-tinta transition-colors hover:bg-black/[.05]';

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5 sm:pr-2.5 ${abierto ? 'bg-black/5' : ''}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de la cuenta"
      >
        <Avatar persona={alumno} tamano={32} />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-tinta sm:block">
          {alumno?.nombre_completo?.split(' ')[0]}
        </span>
        <ChevronDown className={`hidden h-4 w-4 text-tinta-3 transition-transform sm:block ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label="Cuenta"
            className="glass-fuerte fixed z-[65] w-[min(300px,calc(100vw-24px))] overflow-hidden rounded-3xl p-2"
            style={{ top: posicion.top, right: posicion.right, animation: 'escalar .22s cubic-bezier(.22,.61,.36,1) both' }}
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
              <Avatar persona={alumno} tamano={44} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-tinta">
                  <span className="truncate">{alumno?.nombre_completo}</span>
                  {alumno?.email_verificado && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-[#0F8F82]" aria-label="Correo verificado" />
                  )}
                </p>
                <p className="truncate text-xs text-tinta-3">{alumno?.correo}</p>
              </div>
            </div>

            <div className="divisor mx-1" />

            <div className="pt-1.5">
              <Link to="/perfil" role="menuitem" onClick={() => setAbierto(false)} className={opcion}>
                <UserCircle2 className="h-[18px] w-[18px] text-tinta-2" />
                Mi perfil
              </Link>
              <Link to="/certificados" role="menuitem" onClick={() => setAbierto(false)} className={opcion}>
                <Award className="h-[18px] w-[18px] text-tinta-2" />
                Mis certificados
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false);
                  cerrarSesion();
                  navigate('/');
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/[.08]"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Cerrar sesión
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MenuPerfil;
