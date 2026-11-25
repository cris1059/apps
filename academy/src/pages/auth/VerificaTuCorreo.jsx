import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, RefreshCw } from 'lucide-react';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { AvisoDev } from '../../components/Auth/Campos';
import { reenviarVerificacion } from '../../services/publico';
import { mensajeError } from '../../services/api';

const ESPERA = 60;

/* Después de registrarse: revisa tu correo y, si no llega, reenvíalo. */
const VerificaTuCorreo = () => {
  const [params] = useSearchParams();
  const { state } = useLocation();
  const correo = params.get('correo') || '';
  const [devLink, setDevLink] = useState(state?.dev_link || null);
  const [restante, setRestante] = useState(state?.recien || state?.reenviado ? ESPERA : 0);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (restante <= 0) return;
    const t = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [restante]);

  const reenviar = async () => {
    if (!correo) return;
    setEnviando(true);
    try {
      const datos = await reenviarVerificacion(correo);
      if (datos.dev_link) setDevLink(datos.dev_link);
      toast.success('Te enviamos un nuevo correo');
      setRestante(ESPERA);
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos reenviar el correo'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 text-center sm:p-8">
        <span className="app-icono app-icono-tinta mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8">
          <MailCheck />
        </span>
        <h1 className="pagina-titulo text-[1.9rem]">Revisa tu correo</h1>
        <p className="pagina-sub mx-auto">
          {correo ? (
            <>Enviamos un enlace de confirmación a <b className="text-tinta">{correo}</b>. Ábrelo para activar tu cuenta.</>
          ) : (
            'Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta.'
          )}
        </p>

        <ol className="superficie mx-auto mt-6 space-y-2 p-4 text-left text-sm text-tinta-2">
          <li>1. Abre el correo de <b>AvantCode Academy</b>.</li>
          <li>2. Da clic en <b>Confirmar mi correo</b>.</li>
          <li>3. Listo: entrarás directo a tu panel.</li>
        </ol>
        <p className="mb-0 mt-4 text-xs text-tinta-3">El enlace vence en 24 horas. Si no lo ves, revisa spam o promociones.</p>

        {correo && (
          <button type="button" className="btn-secondary mt-6 w-full" onClick={reenviar} disabled={enviando || restante > 0}>
            <RefreshCw className={`h-4 w-4 ${enviando ? 'animate-spin' : ''}`} />
            {restante > 0 ? `Reenviar correo en ${restante} s` : enviando ? 'Enviando…' : 'Reenviar correo'}
          </button>
        )}

        <AvisoDev enlace={devLink} texto="Confirmar mi correo" />
      </div>

      <p className="mt-6 text-center text-sm text-tinta-3">
        ¿Ya lo confirmaste? <Link to="/entrar" className="enlace">Entrar</Link>
        <span className="mx-2">·</span>
        <Link to="/registro" className="enlace">Usar otro correo</Link>
      </p>
    </AccesoLayout>
  );
};

export default VerificaTuCorreo;
