import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

/* Portada del curso; si no hay imagen (o falla), un degradado con el ícono. */
const PortadaCurso = ({ curso, className = '' }) => {
  const [fallo, setFallo] = useState(false);
  const url = curso?.imagen_portada;

  if (url && !fallo) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setFallo(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`grid h-full w-full place-items-center bg-[radial-gradient(120%_90%_at_100%_0%,rgba(212,255,63,.28),transparent_55%),radial-gradient(90%_80%_at_0%_100%,rgba(167,139,250,.35),transparent_60%),linear-gradient(160deg,#2A2A2A,#0E0E0E)] ${className}`}
    >
      <span className="app-icono bg-white/10 text-lima shadow-none ring-1 ring-white/15">
        <GraduationCap />
      </span>
    </div>
  );
};

export default PortadaCurso;
