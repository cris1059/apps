import { useState } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";

/* Reglas visibles de una contraseña nueva (las mismas que revisa la API). */
export const reglasContrasena = (c) => [
  { texto: "Al menos 8 caracteres", ok: c.length >= 8 },
  { texto: "Letras y números", ok: /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(c) && /\d/.test(c) },
];

/* Campo de contraseña con ícono y botón para mostrarla, como en el sistema. */
export function CampoContrasena({ id, etiqueta, valor, onCambio, autoComplete = "new-password", error, accion }) {
  const [ver, setVer] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">
          {etiqueta}
        </label>
        {accion}
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3" />
        <input
          id={id}
          type={ver ? "text" : "password"}
          autoComplete={autoComplete}
          className="input-field pl-11 pr-12"
          placeholder="••••••••"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error ? "true" : "false"}
        />
        <button
          type="button"
          className="btn-icono absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {ver ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error && <p className="campo-error">{error}</p>}
    </div>
  );
}

export function ListaReglas({ valor }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
      {reglasContrasena(valor).map((r) => (
        <li key={r.texto} className={`flex items-center gap-1.5 ${r.ok ? "text-[#0B8A6B]" : "text-tinta-3"}`}>
          <Check className={`h-3.5 w-3.5 ${r.ok ? "" : "opacity-30"}`} /> {r.texto}
        </li>
      ))}
    </ul>
  );
}
