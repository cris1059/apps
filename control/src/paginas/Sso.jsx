import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import AccesoLayout from "../componentes/AccesoLayout";
import { api, guardarSesion } from "../sesion";

/*
  /sso#t=<pase> — «Entrar a Control» desde Mi AvantCode: una sola cuenta.
  El pase llega en el fragmento (#), que no se manda a ningún servidor ni
  queda en registros; se quita de la barra en cuanto se lee y se cambia por
  la sesión. Con verificación en dos pasos, pasa al inicio de sesión para
  escribir el código.
*/
function Sso() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const intentado = useRef(false);

  useEffect(() => {
    if (intentado.current) return;
    intentado.current = true;
    const pase = new URLSearchParams(window.location.hash.slice(1)).get("t");
    window.history.replaceState(null, "", window.location.pathname);
    if (!pase) {
      setError("Este acceso no es válido.");
      return;
    }
    api("/auth/sso", { metodo: "POST", datos: { pase } })
      .then((r) => {
        if (r.dos_pasos) return navigate("/", { replace: true, state: { desafio: r.desafio } });
        guardarSesion(r);
        return navigate("/panel", { replace: true });
      })
      .catch((e) => setError(e.message));
  }, [navigate]);

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        {error ? (
          <>
            <h1 className="pagina-titulo text-[1.75rem]">No pudimos abrir Control</h1>
            <p className="pagina-sub">{error}</p>
            <a className="btn-primary btn-lg mt-6 w-full" href="https://mi.avantcode.mx/panel">
              Volver a Mi AvantCode <ArrowUpRight className="h-[18px] w-[18px]" />
            </a>
            <Link className="btn-secondary btn-lg mt-3 w-full" to="/">
              Entrar con correo y contraseña
            </Link>
          </>
        ) : (
          <>
            <h1 className="pagina-titulo text-[1.75rem]">Abriendo AvantCode Control…</h1>
            <p className="pagina-sub">Entras con tu cuenta de Mi AvantCode.</p>
          </>
        )}
      </div>
    </AccesoLayout>
  );
}

export default Sso;
