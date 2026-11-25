import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock, FlaskConical } from 'lucide-react';

export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Reglas de contraseña (las mismas que la API: ≥ 8 con letra y número). */
export const reglasContrasena = {
  required: 'Escribe una contraseña',
  minLength: { value: 8, message: 'Debe tener al menos 8 caracteres' },
  validate: {
    letra: (v) => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(v) || 'Incluye al menos una letra',
    numero: (v) => /\d/.test(v) || 'Incluye al menos un número',
  },
};

/* Seguridad 0–4 de una contraseña. */
export const seguridad = (v = '') => {
  let p = 0;
  if (v.length >= 8) p++;
  if (/[A-Za-z]/.test(v) && /\d/.test(v)) p++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) p++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) p++;
  return v ? Math.max(1, p) : 0;
};

const NIVELES = [
  { texto: '', color: '' },
  { texto: 'Débil', color: '#C62828' },
  { texto: 'Aceptable', color: '#E08600' },
  { texto: 'Buena', color: '#0F8F82' },
  { texto: 'Fuerte', color: '#0B655D' },
];

/* Medidor de seguridad: el texto acompaña al color (nunca solo color). */
export const MedidorContrasena = ({ valor }) => {
  const s = seguridad(valor);
  if (!valor) return null;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="ac-medidor !mt-0" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} style={i <= s ? { background: NIVELES[s].color } : undefined} />
        ))}
      </div>
      <p className="m-0 mt-1 text-xs text-tinta-3">
        Seguridad: <span className="font-semibold text-tinta">{NIVELES[s].texto}</span>
      </p>
    </div>
  );
};

/* Campo de contraseña con botón para mostrarla. Compatible con register() de react-hook-form. */
export const CampoContrasena = forwardRef(({ id, invalido, autoComplete = 'current-password', placeholder = '••••••••', ...props }, ref) => {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3" />
      <input
        ref={ref}
        id={id}
        type={ver ? 'text' : 'password'}
        autoComplete={autoComplete}
        className="input-field pl-11 pr-12"
        placeholder={placeholder}
        aria-invalid={invalido ? 'true' : 'false'}
        {...props}
      />
      <button
        type="button"
        className="btn-icono absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {ver ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
});
CampoContrasena.displayName = 'CampoContrasena';

/* En local sin SMTP la API devuelve el enlace del correo (dev_link) para poder probar. */
export const AvisoDev = ({ enlace, texto = 'Abrir el enlace del correo' }) => {
  if (!enlace) return null;
  let destino = enlace;
  try {
    const u = new URL(enlace);
    if (u.origin === (import.meta.env.VITE_ORIGEN_WEB || window.location.origin)) destino = u.pathname + u.search;
  } catch {
    /* enlace relativo */
  }
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-white/60 p-4">
      <p className="m-0 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">
        <FlaskConical className="h-4 w-4" /> Modo desarrollo
      </p>
      <p className="m-0 mt-1 text-sm text-tinta-2">No hay servidor de correo configurado; este es el enlace que recibirías.</p>
      <a href={destino} className="btn-secondary btn-sm mt-3">{texto}</a>
    </div>
  );
};
