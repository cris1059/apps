import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock3, ArrowRight, Mail, Gift } from 'lucide-react';
import { borrarInvitacion } from '../../utils/invitacion';
import { moneda } from '../../utils/formato';
import AccesoLayout from '../../components/Auth/AccesoLayout';
import { AvisoDev, CORREO_REGEX } from '../../components/Auth/Campos';
import { useAuth } from '../../hooks/useAuth';
import { verificarCorreo, reenviarVerificacion } from '../../services/publico';
import { almacen, codigoError, mensajeError } from '../../services/api';
import { CLAVE_VOLVER } from './Registro';
import { destinoSeguro } from './Entrar';

/* /verificar/:token — confirma el correo y deja la sesión iniciada. */
const VerificarCorreo = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { iniciarConToken } = useAuth();
  const [estado, setEstado] = useState('verificando'); // verificando | exito | expirado | invalido
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre] = useState('');
  const [bienvenida, setBienvenida] = useState(0);
  const [devLink, setDevLink] = useState(null);
  const pedido = useRef(false); // el token es de un solo uso: no pedirlo dos veces
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const destino = destinoSeguro(almacen.leer(CLAVE_VOLVER), '/panel');

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    verificarCorreo(token)
      .then((datos) => {
        iniciarConToken(datos.token, datos.alumno);
        setNombre(datos.alumno?.nombre_completo?.split(' ')[0] || '');
        setBienvenida(Number(datos.saldo_bienvenida) || 0);
        borrarInvitacion();
        setEstado('exito');
      })
      .catch((e) => {
        setMensaje(mensajeError(e, 'El enlace no es válido.'));
        setEstado(codigoError(e) === 'TOKEN_EXPIRADO' ? 'expirado' : 'invalido');
      });
  }, [token, iniciarConToken]);

  // Tras confirmar, entra solo al panel (o al curso desde donde se registró).
  useEffect(() => {
    if (estado !== 'exito') return;
    const t = setTimeout(() => {
      almacen.borrar(CLAVE_VOLVER);
      navigate(destino, { replace: true });
    }, bienvenida > 0 ? 5000 : 3500);
    return () => clearTimeout(t);
  }, [estado, destino, navigate, bienvenida]);

  const reenviar = async ({ correo }) => {
    try {
      const datos = await reenviarVerificacion(correo.trim().toLowerCase());
      setDevLink(datos.dev_link || null);
      toast.success('Si el correo está registrado, te enviamos un nuevo enlace');
    } catch (e) {
      toast.error(mensajeError(e, 'No pudimos reenviar el correo'));
    }
  };

  return (
    <AccesoLayout>
      <div className="glass rounded-[28px] p-6 text-center sm:p-8" role="status" aria-live="polite">
        {estado === 'verificando' && (
          <>
            <span className="cargador mx-auto mb-6 block" />
            <h1 className="pagina-titulo text-[1.9rem]">Confirmando tu correo…</h1>
            <p className="pagina-sub mx-auto">Un momento, por favor.</p>
          </>
        )}

        {estado === 'exito' && (
          <>
            <span className="app-icono app-icono-teal mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8"><CheckCircle2 /></span>
            <h1 className="pagina-titulo text-[1.9rem]">¡Correo confirmado{nombre ? `, ${nombre}` : ''}!</h1>
            <p className="pagina-sub mx-auto">Tu cuenta está activa. Te llevamos a tu panel en un momento.</p>
            {bienvenida > 0 && (
              <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-negro px-4 py-2 text-sm font-semibold text-white">
                <Gift className="h-4 w-4 text-lima" /> Recibiste {moneda(bienvenida)} de saldo de bienvenida
              </p>
            )}
            <button
              type="button"
              className="btn-primary btn-lg mt-7 w-full"
              onClick={() => {
                almacen.borrar(CLAVE_VOLVER);
                navigate(destino, { replace: true });
              }}
            >
              {destino === '/panel' ? 'Ir a mi panel' : 'Continuar'} <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </>
        )}

        {(estado === 'expirado' || estado === 'invalido') && (
          <>
            <span className={`app-icono mx-auto mb-6 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8 ${estado === 'expirado' ? 'app-icono-ambar' : 'app-icono-rojo'}`}>
              {estado === 'expirado' ? <Clock3 /> : <XCircle />}
            </span>
            <h1 className="pagina-titulo text-[1.9rem]">{estado === 'expirado' ? 'Este enlace ya venció' : 'Enlace no válido'}</h1>
            <p className="pagina-sub mx-auto">
              {estado === 'expirado'
                ? 'Los enlaces de confirmación duran 24 horas. Pide uno nuevo con tu correo.'
                : `${mensaje} Puede que ya lo hayas usado: intenta entrar con tu cuenta.`}
            </p>

            <form onSubmit={handleSubmit(reenviar)} className="mt-6 space-y-3 text-left" noValidate>
              <label htmlFor="correo" className="label">Tu correo</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-3" />
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  className="input-field pl-11"
                  placeholder="tu@correo.com"
                  aria-invalid={errors.correo ? 'true' : 'false'}
                  {...register('correo', { required: 'Escribe tu correo', pattern: { value: CORREO_REGEX, message: 'Correo no válido' } })}
                />
              </div>
              {errors.correo && <p className="campo-error">{errors.correo.message}</p>}
              <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando…' : 'Enviarme un nuevo enlace'}
              </button>
            </form>
            <AvisoDev enlace={devLink} texto="Confirmar mi correo" />
          </>
        )}
      </div>

      {estado !== 'exito' && (
        <p className="mt-6 text-center text-sm text-tinta-3">
          ¿Ya confirmaste tu cuenta? <Link to="/entrar" className="enlace">Entrar</Link>
        </p>
      )}
    </AccesoLayout>
  );
};

export default VerificarCorreo;
