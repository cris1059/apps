import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, AlertCircle, MailWarning } from 'lucide-react';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { CampoContrasena, CORREO_REGEX } from '../../components/Auth/Campos';
import { useAuth } from '../../hooks/useAuth';
import { reenviarVerificacion } from '../../services/publico';
import { codigoError, mensajeError } from '../../services/api';

/* Solo rutas internas para ?volver= (evita redirecciones abiertas). */
export const destinoSeguro = (volver, porDefecto = '/panel') =>
  volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : porDefecto;

const Entrar = () => {
  const [params] = useSearchParams();
  const volver = params.get('volver') || '';
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [error, setError] = useState('');
  const [sinVerificar, setSinVerificar] = useState(null); // correo pendiente de verificar
  const [reenviando, setReenviando] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async ({ correo, contraseña }) => {
    setError('');
    setSinVerificar(null);
    try {
      const alumno = await iniciarSesion(correo.trim().toLowerCase(), contraseña);
      toast.success(`Hola, ${alumno?.nombre_completo?.split(' ')[0] || 'de nuevo'}`);
      navigate(destinoSeguro(volver), { replace: true });
    } catch (e) {
      if (codigoError(e) === 'CORREO_NO_VERIFICADO') {
        setSinVerificar(e.response?.data?.correo || correo.trim().toLowerCase());
      } else {
        setError(mensajeError(e, 'No pudimos iniciar sesión.'));
      }
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    try {
      const datos = await reenviarVerificacion(sinVerificar);
      navigate(`/verifica-tu-correo?correo=${encodeURIComponent(sinVerificar)}`, {
        state: { dev_link: datos.dev_link || null, reenviado: true },
      });
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos reenviar el correo'));
    } finally {
      setReenviando(false);
    }
  };

  const sufijo = volver ? `?volver=${encodeURIComponent(volver)}` : '';

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        <h1 className="pagina-titulo text-[2rem]">Bienvenido de vuelta</h1>
        <p className="pagina-sub">Entra para seguir aprendiendo donde te quedaste.</p>

        {error && (
          <div role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#FDE8E7] p-3 text-sm text-[#B3261E]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {sinVerificar && (
          <div role="alert" className="mt-5 rounded-2xl bg-[#FFF1D2] p-4 text-sm text-[#8A5A00]">
            <p className="m-0 flex items-center gap-2 font-semibold">
              <MailWarning className="h-4 w-4 shrink-0" /> Confirma tu correo para entrar
            </p>
            <p className="m-0 mt-1">
              Te enviamos un enlace a <b>{sinVerificar}</b>. Si no lo encuentras, revisa tu carpeta de spam o pide uno nuevo.
            </p>
            <button type="button" className="btn-secondary btn-sm mt-3" onClick={reenviar} disabled={reenviando}>
              {reenviando ? 'Enviando…' : 'Reenviar correo de verificación'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="correo" className="label">Correo electrónico</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3" />
              <input
                id="correo"
                type="email"
                autoComplete="email"
                inputMode="email"
                className="input-field pl-11"
                placeholder="tu@correo.com"
                aria-invalid={errors.correo ? 'true' : 'false'}
                {...register('correo', {
                  required: 'Escribe tu correo',
                  pattern: { value: CORREO_REGEX, message: 'Escribe un correo válido' },
                })}
              />
            </div>
            {errors.correo && <p className="campo-error">{errors.correo.message}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="contrasena" className="label mb-0">Contraseña</label>
              <Link to="/olvide-contrasena" className="text-[13px] font-semibold text-tinta-2 hover:text-tinta hover:underline underline-offset-4">
                ¿La olvidaste?
              </Link>
            </div>
            <CampoContrasena id="contrasena" invalido={!!errors.contraseña} {...register('contraseña', { required: 'Escribe tu contraseña' })} />
            {errors.contraseña && <p className="campo-error">{errors.contraseña.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
            {isSubmitting ? (
              <>
                <span className="cargador cargador-sm border-white/30 border-t-white" /> Entrando…
              </>
            ) : (
              <>
                Entrar <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-tinta-3">
        ¿No tienes cuenta?{' '}
        <Link to={`/registro${sufijo}`} className="enlace">Crea una gratis</Link>
      </p>
    </AccesoLayout>
  );
};

export default Entrar;
