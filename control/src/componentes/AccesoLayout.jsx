import { FileCheck2, Fingerprint, MapPin, Users } from "lucide-react";
import Marca from "./Marca";
import EnlacesLegales from "./EnlacesLegales";

/*
  Pantalla dividida, igual que el acceso de sistema.avantcode.mx:
  izquierda, arte oscuro con la marca y tarjetas de vidrio flotantes (aquí,
  de registro de jornada); derecha, el formulario sobre el lienzo claro con
  luces ambientales. La usan el inicio de sesión, el primer acceso y "Muy pronto";
  al pie, el aviso de privacidad, los términos y la licencia de uso.
*/
const AccesoLayout = ({ children, pie }) => (
  <div className="acceso">
    <aside className="acceso-arte" aria-hidden="true">
      <Marca claro />

      <div className="relative">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-medium text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-lima shadow-[0_0_10px_rgba(212,255,63,.9)]" />
          Registro de jornada laboral
        </span>
        <p className="display max-w-[15ch] text-[clamp(2.6rem,4.6vw,4.2rem)] font-semibold leading-[1.02] tracking-[-.045em]">
          Tu equipo y su jornada, <span className="text-white/45">en un solo lugar.</span>
        </p>

        {/* Tarjetas flotantes de vidrio */}
        <div className="relative mt-12 h-[236px] max-w-md">
          <div className="glass-oscuro absolute left-0 top-0 w-[300px] -rotate-3 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <span className="app-icono app-icono-sm app-icono-tinta">
                <Fingerprint />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Entrada · 08:57</p>
                <p className="truncate text-xs text-white/50">Andrea Lozano · Matriz</p>
              </div>
              <span className="ml-auto rounded-full bg-[#0F8F82]/25 px-2 py-0.5 text-[11px] font-semibold text-[#7FE3D6]">
                Registrado
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
              <MapPin className="h-3.5 w-3.5 text-lima" /> Ubicación guardada · ±8 m
            </p>
          </div>

          <div className="glass-oscuro absolute right-0 top-16 w-[220px] rotate-2 rounded-3xl p-4">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <Users className="h-4 w-4 text-lima" />
              Trabajando ahora
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              37 <span className="text-sm font-medium text-white/45">de 48</span>
            </p>
            <div className="mt-3 flex h-10 items-end gap-1.5">
              {[62, 40, 18, 70, 74, 68, 77].map((h, i) => (
                <span key={i} className={`flex-1 rounded-t ${i === 6 ? "bg-lima" : "bg-white/15"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="glass-oscuro absolute bottom-0 left-0 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/80">
            <FileCheck2 className="h-4 w-4 text-[#7FE3D6]" />
            Reporte para la STPS listo
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40">© {new Date().getFullYear()} AvantCode · control.avantcode.mx</p>
    </aside>

    <main className="acceso-panel">
      <div className="ambiente">
        <span className="ambiente-luz ambiente-luz--lima" />
        <span className="ambiente-luz ambiente-luz--violeta" />
        <span className="ambiente-luz ambiente-luz--teal" />
      </div>
      <div className="acceso-form">
        <div className="mb-8 lg:hidden">
          <Marca />
        </div>
        {children}
        {pie}
        <EnlacesLegales />
      </div>
    </main>
  </div>
);

export default AccesoLayout;
