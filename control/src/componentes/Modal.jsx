import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* Modal de vidrio. Se renderiza en <body> con un portal: así ninguna
   tarjeta con backdrop-filter lo encierra (backdrop-filter crea un
   contenedor para los elementos `position: fixed`).
   En móvil sube como hoja inferior; en escritorio aparece centrado. */
const Modal = ({ abierto = true, onCerrar, titulo, descripcion, children, ancho = 'sm:max-w-lg', className = '' }) => {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => e.key === 'Escape' && onCerrar?.();
    window.addEventListener('keydown', alPresionar);
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', alPresionar);
      html.style.overflow = previo;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar?.()}>
      <div className={`modal-panel ${ancho} ${className}`} role="dialog" aria-modal="true" aria-label={typeof titulo === 'string' ? titulo : undefined}>
        {(titulo || onCerrar) && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {titulo && <h2 className="modal-titulo">{titulo}</h2>}
              {descripcion && <p className="mt-1 text-sm text-tinta-3">{descripcion}</p>}
            </div>
            {onCerrar && (
              <button type="button" onClick={onCerrar} className="btn-icono -mr-2 -mt-1" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
