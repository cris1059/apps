import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, User, ArrowRight, AlertCircle, Gift } from 'lucide-react';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { CampoContrasena, CORREO_REGEX, MedidorContrasena, reglasContrasena } from '../../components/Auth/Campos';
import { registrar, obtenerInvitacion } from '../../services/publico';
import { almacen, mensajeError } from '../../services/api';
import { guardarInvitacion, leerInvitacion } from '../../utils/invitacion';
import { moneda } from '../../utils/formato';

const PRIVACIDAD = 'https://www.avantcodeapp.com/aviso-de-privacidad';
const TERMINOS = 'https://www.avantcodeapp.com/terminos-y-condiciones';
export const CLAVE_VOLVER = 'academy_volver';

const icono = 'pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3';

const Registro = () => {
  const [params] = useSearchParams();
  const volver = params.get('volver') || '';
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [yaExiste, setYaExiste] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });
  const contraseña = watch('contraseña');

  // Invitación: del enlace (?invita=) o guardada al llegar a otra página de la Academy.
  const codigoUrl = params.get('invita') || '';
  const [invitacion, setInvitacion] = useState(null); // { codigo, nombre, vigente, bienvenida }
  useEffect(() => {
    if (codigoUrl) guardarInvitacion(codigoUrl);
    const codigo = (codigoUrl || leerInvitacion()).toUpperCase();
    if (!codigo) return;
    let vivo = true;
    obtenerInvitacion(codigo)
      .then((d) => vivo && setInvitacion({ codigo, ...d }))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [codigoUrl]);

  const onSubmit = async ({ nombre_completo, correo, contraseña: clave, acepta_terminos }) => {
    setError('');
    setYaExiste(false);
    try {
      const datos = await registrar({
        nombre_completo: nombre_completo.trim(),
        correo: correo.trim().toLowerCase(),
        contraseña: clave,
        acepta_terminos,
        invitacion: invitacion?.vigente ? invitacion.codigo : undefined,
      });
      // Para regresar al curso después de confirmar el correo (aunque sea en otra pestaña).
      if (volver.startsWith('/')) almacen.guardar(CLAVE_VOLVER, volver);
      navigate(`/verifica-tu-correo?correo=${encodeURIComponent(datos.correo || correo)}`, {
        state: { dev_link: datos.dev_link || null, recien: true },
      });
    } catch (e) {
      if (e?.response?.status === 409) setYaExiste(true);
      setError(mensajeError(e, 'No pudimos crear tu cuenta.'));
    }
  };

  const sufijo = volver ? `?volver=${encodeURIComponent(volver)}` : '';

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        <h1 className="pagina-titulo text-[2rem]">Crea tu cuenta</h1>
        <p className="pagina-sub">Es gratis. Te enviaremos un correo para confirmarla.</p>

        {invitacion?.vigente && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-negro p-3.5 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lima text-negro">
              <Gift className="h-5 w-5" />
            </span>
            <p className="m-0 text-sm leading-snug">
              <b>{invitacion.nombre}</b> te invitó.
              {invitacion.bienvenida > 0 && (
                <>
                  {' '}Recibes <b className="text-lima">{moneda(invitacion.bienvenida)}</b> de saldo para tus cursos al confirmar tu correo.
                </>
              )}
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-5 flex gap-2 rounded-2xl bg-[#FDE8E7] p-3 text-sm text-[#B3261E]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {error}
              {yaExiste && (
                <>
                  {' '}
                  <Link to={`/entrar${sufijo}`} className="font-semibold underline underline-offset-2">Entrar</Link>
                  {' · '}
                  <Link to="/olvide-contrasena" className="font-semibold underline underline-offset-2">Recuperar contraseña</Link>
                </>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="nombre" className="label">Nombre completo</label>
            <div className="relative">
              <User className={icono} />
              <input
                id="nombre"
                type="text"
                autoComplete="name"
                className="input-field pl-11"
                placeholder="Nombre y apellidos"
                aria-invalid={errors.nombre_completo ? 'true' : 'false'}
                {...register('nombre_completo', {
                  required: 'Escribe tu nombre',
                  validate: (v) => v.trim().length >= 3 || 'Escribe tu nombre completo',
                  maxLength: { value: 120, message: 'Máximo 120 caracteres' },
                })}
              />
            </div>
            {errors.nombre_completo ? <p className="campo-error">{errors.nombre_completo.message}</p> : <p className="campo-ayuda">Así aparecerá en tus certificados.</p>}
          </div>

          <div>
            <label htmlFor="correo" className="label">Correo electrónico</label>
            <div className="relative">
              <Mail className={icono} />
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
            <label htmlFor="contrasena" className="label">Contraseña</label>
            <CampoContrasena
              id="contrasena"
              autoComplete="new-password"
              placeholder="Mínimo 8, con letras y números"
              invalido={!!errors.contraseña}
              {...register('contraseña', reglasContrasena)}
            />
            {errors.contraseña ? <p className="campo-error">{errors.contraseña.message}</p> : <MedidorContrasena valor={contraseña} />}
          </div>

          <div>
            <label htmlFor="confirmar" className="label">Confirma tu contraseña</label>
            <CampoContrasena
              id="confirmar"
              autoComplete="new-password"
              invalido={!!errors.confirmar}
              {...register('confirmar', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === contraseña || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirmar && <p className="campo-error">{errors.confirmar.message}</p>}
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-tinta-2">
              <input
                type="checkbox"
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-[#161616]"
                aria-invalid={errors.acepta_terminos ? 'true' : 'false'}
                {...register('acepta_terminos', { required: 'Debes aceptar para crear tu cuenta' })}
              />
              <span>
                Acepto los{' '}
                <a href={TERMINOS} target="_blank" rel="noopener noreferrer" className="enlace">términos y condiciones</a> y el{' '}
                <a href={PRIVACIDAD} target="_blank" rel="noopener noreferrer" className="enlace">aviso de privacidad</a>.
              </span>
            </label>
            {errors.acepta_terminos && <p className="campo-error">{errors.acepta_terminos.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
            {isSubmitting ? (
              <>
                <span className="cargador cargador-sm border-white/30 border-t-white" /> Creando tu cuenta…
              </>
            ) : (
              <>
                Crear cuenta <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-tinta-3">
        ¿Ya tienes cuenta?{' '}
        <Link to={`/entrar${sufijo}`} className="enlace">Entrar</Link>
      </p>
    </AccesoLayout>
  );
};

export default Registro;
