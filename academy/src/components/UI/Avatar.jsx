import { useState } from 'react';

/* Avatar circular: foto (foto_url) o iniciales sobre fondo oscuro. */
const Avatar = ({ persona, nombre, foto, tamano = 34, className = '' }) => {
  const [fallo, setFallo] = useState(false);
  const texto = nombre || persona?.nombre_completo || persona?.nombre || '';
  const url = foto ?? persona?.foto_url ?? persona?.foto ?? null;
  const iniciales =
    texto
      .split(/\s+/)
      .filter((p) => /^\p{L}/u.test(p))
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || 'AC';

  const estilo = { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.36) };

  if (url && !fallo) {
    return (
      <img
        src={url}
        alt={texto}
        style={estilo}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white/70 ${className}`}
        onError={() => setFallo(true)}
      />
    );
  }

  return (
    <span
      style={estilo}
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2A2A2A] to-[#0D0D0D] font-semibold text-lima ring-2 ring-white/70 ${className}`}
    >
      {iniciales}
    </span>
  );
};

export default Avatar;
