import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { KeyRound, CheckCircle2, XCircle, Clock3, ArrowRight } from 'lucide-react';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { CampoContrasena, MedidorContrasena, reglasContrasena } from '../../components/Auth/Campos';
import { restablecerContrasena } from '../../services/publico';
import { codigoError, mensajeError } from '../../services/api';

/* /restablecer/:token — crear una contraseña nueva. */
const Restablecer = () => {
  const { token } = useParams();
  const [estado, setEstado] = useState('formulario'); // formulario | exito | expirado | invalido
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onTouched' });
  const contraseña = watch('contraseña');

  const onSubmit = async ({ contraseña: clave }) => {
    setError('');
    try {
      await restablecerContrasena(token, clave);
      setEstado('exito');
    } catch (e) {
      const codigo = codigoError(e);
      if (codigo === 'TOKEN_EXPIRADO') setEstado('expirado');
      else if (codigo === 'TOKEN_INVALIDO') setEstado('invalido');
      else setError(mensajeError(e, 'No pudimos cambiar tu contraseña.'));
    }
  };

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 sm:p-8">
        {estado === 'exito' ? (
          <div className="text-center">
            <span className="app-icono app-icono-teal mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8"><CheckCircle2 /></span>
            <h1 className="pagina-titulo text-[1.9rem]">Contraseña actualizada</h1>
            <p className="pagina-sub mx-auto">Ya puedes entrar con tu nueva contraseña.</p>
            <Link to="/entrar" className="btn-primary btn-lg mt-7 w-full">
              Entrar <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </div>
        ) : estado === 'expirado' || estado === 'invalido' ? (
          <div className="text-center">
            <span className={`app-icono mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8 ${estado === 'expirado' ? 'app-icono-ambar' : 'app-icono-rojo'}`}>
              {estado === 'expirado' ? <Clock3 /> : <XCircle />}
            </span>
            <h1 className="pagina-titulo text-[1.9rem]">{estado === 'expirado' ? 'Este enlace ya venció' : 'Enlace no válido'}</h1>
            <p className="pagina-sub mx-auto">
              {estado === 'expirado'
                ? 'Por seguridad, los enlaces para cambiar la contraseña duran 1 hora.'
                : 'Puede que ya lo hayas usado o que esté incompleto.'}
            </p>
            <Link to="/olvide-contrasena" className="btn-primary btn-lg mt-7 w-full">Pedir un enlace nuevo</Link>
          </div>
        ) : (
          <>
            <span className="app-icono app-icono-claro mb-5"><KeyRound /></span>
            <h1 className="pagina-titulo text-[2rem]">Crea una contraseña nueva</h1>
            <p className="pagina-sub">Usa al menos 8 caracteres con letras y números.</p>

            {error && <p role="alert" className="mt-5 rounded-2xl bg-[#FDE8E7] p-3 text-sm text-[#B3261E]">{error}</p>}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
              <div>
                <label htmlFor="contrasena" className="label">Contraseña nueva</label>
                <CampoContrasena id="contrasena" autoComplete="new-password" invalido={!!errors.contraseña} {...register('contraseña', reglasContrasena)} />
                {errors.contraseña ? <p className="campo-error">{errors.contraseña.message}</p> : <MedidorContrasena valor={contraseña} />}
              </div>
              <div>
                <label htmlFor="confirmar" className="label">Confirma la contraseña</label>
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
              <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
                {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-tinta-3">
        <Link to="/entrar" className="enlace">Volver a entrar</Link>
      </p>
    </AccesoLayout>
  );
};

export default Restablecer;
