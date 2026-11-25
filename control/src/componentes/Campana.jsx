import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail } from "lucide-react";
import { api } from "../sesion";

/*
  La campana del panel: los avisos de cada persona (entradas no
  registradas, horas extra por aprobar, correcciones, actividades…). Se
  revisa sola cada minuto; al abrir un aviso se marca como leído.
*/

const hace = (fecha) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

function Campana() {
  const [datos, setDatos] = useState(null);
  const [abierta, setAbierta] = useState(false);
  const caja = useRef(null);
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      setDatos(await api("/avisos"));
    } catch {
      /* sin avisos si falla: no estorba al panel */
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(() => !document.hidden && cargar(), 60000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    if (!abierta) return undefined;
    const cerrar = (e) => caja.current && !caja.current.contains(e.target) && setAbierta(false);
    const tecla = (e) => e.key === "Escape" && setAbierta(false);
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierta]);

  const leer = async (datosLeidos) => {
    try {
      await api("/avisos/leidos", { metodo: "POST", datos: datosLeidos });
      cargar();
    } catch {
      /* se reintenta en la siguiente revisión */
    }
  };

  const abrir = (a) => {
    if (!a.leido) leer({ ids: [a.id] });
    setAbierta(false);
    if (a.enlace) navigate(a.enlace);
  };

  const n = datos?.no_leidos || 0;
  return (
    <div ref={caja} className="relative ml-auto">
      <button type="button" className="btn-icono relative" aria-label={n ? `Avisos: ${n} sin leer` : "Avisos"} aria-expanded={abierta} onClick={() => setAbierta((v) => !v)}>
        <Bell className="h-5 w-5" />
        {n > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-negro px-1 text-[10.5px] font-bold text-white tabular-nums">
            {n > 99 ? "99+" : n}
          </span>
        )}
      </button>
      {abierta && (
        <div className="glass-fuerte absolute right-0 top-12 z-30 w-[min(92vw,380px)] rounded-2xl p-2" role="dialog" aria-label="Avisos">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-tinta">Avisos</p>
            {n > 0 && (
              <button type="button" className="text-[13px] font-medium text-tinta-3 hover:text-tinta" onClick={() => leer({ todos: true })}>
                Marcar todo como leído
              </button>
            )}
          </div>
          {!datos?.avisos.length ? (
            <p className="px-2 py-6 text-center text-sm text-tinta-3">Aún no tienes avisos.</p>
          ) : (
            <ul className="scroll-fino max-h-[60vh] overflow-y-auto">
              {datos.avisos.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => abrir(a)} className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-black/[.04] ${a.leido ? "" : "bg-lima/20"}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-tinta">
                      {!a.leido && <span className="h-2 w-2 shrink-0 rounded-full bg-negro" aria-hidden="true" />}
                      {a.titulo}
                      {a.por_correo && <Mail className="h-3.5 w-3.5 text-tinta-3" aria-label="También llegó por correo" />}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-tinta-2">{a.texto}</span>
                    <span className="mt-1 block text-[12px] text-tinta-3">{hace(a.creado_en)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Campana;
