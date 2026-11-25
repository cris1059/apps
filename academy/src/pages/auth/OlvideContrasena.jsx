import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, KeyRound, MailCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { AvisoDev, CORREO_REGEX } from '../../components/Auth/Campos';
import { olvideContrasena } from '../../services/publico';
import { mensajeError } from '../../services/api';

const OlvideContrasena = () => {
  const [enviado, setEnviado] = useState(null); // { correo, dev_link }
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async ({ correo }) => {
    setError('');
    try {
      const limpio = correo.trim().toLowerCase();
      const datos = await olvideContrasena(limpio);
      setEnviado({ correo: limpio, dev_link: datos.dev_link || null });
    } catch (e) {
      setError(mensajeError(e, 'No pudimos procesar tu solicitud.'));
    }
  };

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        {enviado ? (
          <div className="text-center">
            <span className="app-icono app-icono-tinta mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8"><MailCheck /></span>
            <h1 className="pagina-titulo text-[1.9rem]">Revisa tu correo</h1>
            <p className="pagina-sub mx-auto">
              Si <b className="text-tinta">{enviado.correo}</b> tiene una cuenta, recibirás un enlace para crear una contraseña nueva.
              El enlace vence en 1 hora.
            </p>
            <AvisoDev enlace={enviado.dev_link} texto="Crear contraseña nueva" />
            <button type="button" className="btn-secondary mt-6 w-full" onClick={() => setEnviado(null)}>
              Usar otro correo
            </button>
          </div>
        ) : (
          <>
            <span className="app-icono app-icono-claro mb-5"><KeyRound /></span>
            <h1 className="pagina-titulo text-[2rem]">¿Olvidaste tu contraseña?</h1>
            <p className="pagina-sub">Escribe tu correo y te enviaremos un enlace para crear una nueva.</p>

            {error && (
              <div role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#FDE8E7] p-3 text-sm text-[#B3261E]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
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
                    {...register('correo', { required: 'Escribe tu correo', pattern: { value: CORREO_REGEX, message: 'Escribe un correo válido' } })}
                  />
                </div>
                {errors.correo && <p className="campo-error">{errors.correo.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
                {isSubmitting ? 'Enviando…' : 'Enviarme el enlace'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-tinta-3">
        <Link to="/entrar" className="enlace inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Volver a entrar
        </Link>
      </p>
    </AccesoLayout>
  );
};

export default OlvideContrasena;
