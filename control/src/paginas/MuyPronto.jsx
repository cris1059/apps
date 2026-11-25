import { ArrowUpRight } from "lucide-react";
import AccesoLayout from "../componentes/AccesoLayout";

/* Lo que ve el público mientras control.avantcode.mx no abre: la misma
   pantalla del inicio de sesión, con el aviso en lugar del formulario. */
function MuyPronto() {
  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-black/[.05] px-3 py-1.5 text-[13px] font-semibold text-tinta">
          <span className="h-1.5 w-1.5 rounded-full bg-lima shadow-[0_0_0_3px_rgba(212,255,63,.35)]" />
          Muy pronto
        </span>
        <h1 className="pagina-titulo mt-4 text-[2rem]">AvantCode Control</h1>
        <p className="pagina-sub">
          Aquí vas a administrar el registro de jornada de tu empresa, y tu equipo va a marcar su entrada y su salida.
          Mientras tanto, conoce la plataforma y prueba la demo.
        </p>
        <a className="btn-primary btn-lg mt-7 w-full" href="https://avantcode.mx/control">
          Conocer AvantCode Control
          <ArrowUpRight className="h-[18px] w-[18px]" />
        </a>
      </div>
    </AccesoLayout>
  );
}

export default MuyPronto;
