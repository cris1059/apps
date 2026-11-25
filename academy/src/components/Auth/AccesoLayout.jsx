import { Link } from 'react-router-dom';
import { Award, Check, PlayCircle } from 'lucide-react';
import Marca from '../Marca/Marca';

/* Pantalla dividida de acceso (como el login del sistema AvantCode):
   izquierda, arte oscuro con la marca y tarjetas de vidrio flotantes;
   derecha, el formulario sobre el lienzo claro con luces ambientales. */
const AccesoLayout = ({ children }) => (
  <div className="acceso">
    <aside className="acceso-arte" aria-hidden="true">
      <Link to="/" tabIndex={-1}>
        <Marca claro />
      </Link>

      <div className="relative">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-medium text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-lima shadow-[0_0_10px_rgba(212,255,63,.9)]" />
          AvantCode Academy
        </span>
        <p className="display max-w-[15ch] text-[clamp(2.6rem,4.6vw,4.2rem)] font-semibold leading-[1.02] tracking-[-.045em]">
          Aprende a tu ritmo, <span className="text-white/45">certifícate con nosotros.</span>
        </p>

        {/* Tarjetas flotantes de vidrio (ilustración) */}
        <div className="relative mt-12 h-[236px] max-w-md">
          <div className="glass-oscuro absolute left-0 top-0 w-[290px] -rotate-3 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <span className="app-icono app-icono-sm app-icono-tinta"><PlayCircle /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Lección 4 · Diseño adaptable</p>
                <p className="truncate text-xs text-white/50">Video · 12 min</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/55">
              <span>Tu avance</span>
              <span>68 %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68%] rounded-full bg-lima" />
            </div>
          </div>

          <div className="glass-oscuro absolute right-0 top-14 w-[230px] rotate-2 rounded-3xl p-4">
            <span className="app-icono app-icono-sm app-icono-teal"><Award /></span>
            <p className="mt-3 text-sm font-semibold">Certificado de finalización</p>
            <p className="text-xs text-white/50">Folio verificable en línea</p>
          </div>

          <div className="glass-oscuro absolute bottom-0 left-0 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/80">
            <Check className="h-4 w-4 text-lima" strokeWidth={3} />
            Correo confirmado · cuenta activa
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40">© {new Date().getFullYear()} AvantCode Academy</p>
    </aside>

    <main className="acceso-panel">
      <div className="ambiente">
        <span className="ambiente-luz ambiente-luz--lima" />
        <span className="ambiente-luz ambiente-luz--violeta" />
        <span className="ambiente-luz ambiente-luz--teal" />
      </div>
      <div className="acceso-form">
        <Link to="/" className="mb-8 inline-flex lg:hidden" aria-label="AvantCode Academy, inicio">
          <Marca />
        </Link>
        {children}
      </div>
    </main>
  </div>
);

export default AccesoLayout;
