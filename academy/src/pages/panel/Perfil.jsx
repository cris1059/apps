import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Camera, Save, Lock, Eye, EyeOff, BadgeCheck, Mail, CalendarDays, UserCircle2, ShieldCheck, X, Gift, Copy } from 'lucide-react';
import { copiarTexto } from '../../components/Panel/util';
import { moneda } from '../../utils/formato';
import { useAuth } from '../../hooks/useAuth';
import { alumnoService } from '../../services/alumno';
import { codigoError, mensajeError } from '../../services/api';
import Encabezado from '../../components/UI/Encabezado';
import Avatar from '../../components/UI/Avatar';
import { fechaLarga } from '../../utils/formato';

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FOTO = 3 * 1024 * 1024;

const CampoContrasena = ({ id, etiqueta, registro, error, autoComplete }) => {
  const [ver, setVer] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{etiqueta}</label>
      <div className="relative">
        <input
          id={id}
          type={ver ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="input-field pr-12"
          aria-invalid={error ? 'true' : 'false'}
          {...registro}
        />
        <button
          type="button"
          className="btn-icono absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {ver ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error && <p className="campo-error">{error.message}</p>}
    </div>
  );
};

const Perfil = () => {
  const { alumno, actualizarAlumno } = useAuth();
  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const archivoRef = useRef(null);

  const datosForm = useForm({
    defaultValues: {
      nombre_completo: alumno?.nombre_completo || '',
      telefono: alumno?.telefono || '',
      pais: alumno?.pais || '',
      ciudad: alumno?.ciudad || '',
      bio: alumno?.bio || '',
    },
  });
  const claveForm = useForm();
  const [invita, setInvita] = useState(null);

  useEffect(() => {
    alumnoService.saldo().then(setInvita).catch(() => {});
  }, []);

  const copiarInvitacion = async () => {
    if (invita && (await copiarTexto(invita.enlace))) toast.success('Enlace para invitar copiado');
    else toast.error('No se pudo copiar el enlace');
  };
  const nueva = claveForm.watch('nueva');
  const bio = datosForm.watch('bio') || '';

  // Libera la URL de la vista previa.
  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type)) return toast.error('Usa una imagen JPG, PNG o WebP.');
    if (archivo.size > MAX_FOTO) return toast.error('La foto debe pesar menos de 3 MB.');
    setFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const descartarFoto = () => {
    setFoto(null);
    setVistaPrevia('');
  };

  const guardarFoto = async () => {
    if (!foto) return;
    setSubiendo(true);
    try {
      const actualizado = await alumnoService.subirFoto(foto);
      actualizarAlumno(actualizado);
      descartarFoto();
      toast.success('Foto actualizada');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo subir la foto.'));
    } finally {
      setSubiendo(false);
    }
  };

  const guardarDatos = async (datos) => {
    try {
      const limpio = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      const actualizado = await alumnoService.actualizarPerfil(limpio);
      actualizarAlumno(actualizado);
      datosForm.reset({
        nombre_completo: actualizado.nombre_completo || '',
        telefono: actualizado.telefono || '',
        pais: actualizado.pais || '',
        ciudad: actualizado.ciudad || '',
        bio: actualizado.bio || '',
      });
      toast.success('Datos guardados');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudieron guardar tus datos.'));
    }
  };

  const cambiarClave = async ({ actual, nueva: nuevaClave }) => {
    try {
      await alumnoService.cambiarContrasena(actual, nuevaClave);
      claveForm.reset();
      toast.success('Contraseña actualizada');
    } catch (e) {
      if (codigoError(e) === 'CONTRASENA_INCORRECTA') {
        claveForm.setError('actual', { type: 'server', message: 'La contraseña actual no es correcta' }, { shouldFocus: true });
      } else {
        toast.error(mensajeError(e, 'No se pudo cambiar la contraseña.'));
      }
    }
  };

  const errD = datosForm.formState.errors;
  const errC = claveForm.formState.errors;

  return (
    <div className="pagina">
      <Encabezado etiqueta="Cuenta" titulo="Mi perfil." apagado="Tus datos y tu seguridad." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Tarjeta de identidad */}
        <aside className="space-y-4 lg:order-2 lg:space-y-5">
          <section className="kpi-oscuro items-center text-center">
            <div className="relative">
              <Avatar persona={alumno} foto={vistaPrevia || undefined} tamano={96} className="!ring-white/15" />
              <button
                type="button"
                onClick={() => archivoRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-lima text-negro shadow-flotante ring-4 ring-[#161616] transition-transform hover:scale-105"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={archivoRef} type="file" accept={TIPOS_FOTO.join(',')} className="sr-only" onChange={elegirFoto} />
            </div>
            <div>
              <p className="display text-xl font-semibold text-white">{alumno?.nombre_completo}</p>
              <p className="mt-0.5 text-sm text-white/55">{alumno?.correo}</p>
            </div>
            {foto ? (
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={descartarFoto} className="btn btn-sm bg-white/10 text-white hover:bg-white/15" disabled={subiendo}>
                  <X className="h-4 w-4" /> Descartar
                </button>
                <button type="button" onClick={guardarFoto} className="btn-lima btn-sm" disabled={subiendo}>
                  <Save className="h-4 w-4" /> {subiendo ? 'Subiendo…' : 'Guardar foto'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/45">JPG, PNG o WebP · máx. 3 MB</p>
            )}
          </section>

          <section className="card">
            <h2 className="card-titulo mb-3">Tu cuenta</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-tinta-2"><Mail className="h-4 w-4 text-tinta-3" /> Correo</span>
                {alumno?.email_verificado ? (
                  <span className="badge badge-success"><BadgeCheck className="h-3.5 w-3.5" /> Verificado</span>
                ) : (
                  <span className="badge badge-warning">Sin verificar</span>
                )}
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-tinta-2"><CalendarDays className="h-4 w-4 text-tinta-3" /> Alumno desde</span>
                <span className="font-medium text-tinta">{fechaLarga(alumno?.fecha_registro)}</span>
              </li>
            </ul>
          </section>

          {/* Invita y gana: el enlace para compartir desde el perfil */}
          {invita && (
            <section className="card" aria-labelledby="titulo-invita">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="titulo-invita" className="card-titulo">Invita y gana</h2>
                  <p className="mt-1 text-sm text-tinta-3">
                    {moneda(invita.reglas.por_invitado)} por cada persona que se una, hasta {invita.reglas.tope_invitados}.
                  </p>
                </div>
                <span className="app-icono app-icono-tinta shrink-0"><Gift /></span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-tinta-2">Tu saldo</span>
                <span className="display text-2xl font-semibold text-tinta">{moneda(invita.saldo)}</span>
              </div>
              <p className="mt-1 text-xs text-tinta-3">{invita.premiados} de {invita.reglas.tope_invitados} invitaciones con premio</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={copiarInvitacion} className="btn-primary btn-sm"><Copy className="h-4 w-4" /> Copiar mi enlace</button>
                <Link to="/invita" className="btn-ghost btn-sm">Ver detalles</Link>
              </div>
            </section>
          )}
        </aside>

        <div className="space-y-4 lg:order-1 lg:col-span-2 lg:space-y-5">
          {/* Datos personales */}
          <section className="card" aria-labelledby="titulo-datos">
            <div className="mb-5 flex items-center gap-3">
              <span className="app-icono app-icono-sm app-icono-tinta"><UserCircle2 /></span>
              <div>
                <h2 id="titulo-datos" className="card-titulo">Datos personales</h2>
                <p className="text-sm text-tinta-3">Tu nombre aparece en tus certificados.</p>
              </div>
            </div>

            <form onSubmit={datosForm.handleSubmit(guardarDatos)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nombre" className="label">Nombre completo</label>
                <input
                  id="nombre"
                  className="input-field"
                  autoComplete="name"
                  aria-invalid={errD.nombre_completo ? 'true' : 'false'}
                  {...datosForm.register('nombre_completo', {
                    required: 'Escribe tu nombre',
                    minLength: { value: 3, message: 'Debe tener al menos 3 caracteres' },
                    maxLength: { value: 120, message: 'Máximo 120 caracteres' },
                  })}
                />
                {errD.nombre_completo ? (
                  <p className="campo-error">{errD.nombre_completo.message}</p>
                ) : (
                  <p className="campo-ayuda">Escríbelo como quieres que salga en tus certificados.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="telefono" className="label">Teléfono</label>
                  <input
                    id="telefono"
                    type="tel"
                    className="input-field"
                    autoComplete="tel"
                    placeholder="55 1234 5678"
                    aria-invalid={errD.telefono ? 'true' : 'false'}
                    {...datosForm.register('telefono', {
                      pattern: { value: /^[+\d\s()-]{7,20}$/, message: 'Teléfono no válido' },
                    })}
                  />
                  {errD.telefono && <p className="campo-error">{errD.telefono.message}</p>}
                </div>
                <div>
                  <label htmlFor="pais" className="label">País</label>
                  <input id="pais" className="input-field" autoComplete="country-name" placeholder="México" {...datosForm.register('pais', { maxLength: 60 })} />
                </div>
                <div>
                  <label htmlFor="ciudad" className="label">Ciudad</label>
                  <input id="ciudad" className="input-field" autoComplete="address-level2" placeholder="Ciudad de México" {...datosForm.register('ciudad', { maxLength: 80 })} />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="label">Sobre ti</label>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={300}
                  className="input-field"
                  placeholder="Qué haces, qué quieres aprender…"
                  {...datosForm.register('bio', { maxLength: { value: 300, message: 'Máximo 300 caracteres' } })}
                />
                <p className="campo-ayuda numero text-right">{bio.length}/300</p>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={datosForm.formState.isSubmitting || !datosForm.formState.isDirty}>
                  <Save className="h-4 w-4" />
                  {datosForm.formState.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </section>

          {/* Seguridad */}
          <section className="card" aria-labelledby="titulo-seguridad">
            <div className="mb-5 flex items-center gap-3">
              <span className="app-icono app-icono-sm app-icono-violeta"><ShieldCheck /></span>
              <div>
                <h2 id="titulo-seguridad" className="card-titulo">Contraseña</h2>
                <p className="text-sm text-tinta-3">Usa al menos 8 caracteres con letras y números.</p>
              </div>
            </div>

            <form onSubmit={claveForm.handleSubmit(cambiarClave)} className="space-y-4" noValidate>
              <CampoContrasena
                id="actual"
                etiqueta="Contraseña actual"
                autoComplete="current-password"
                error={errC.actual}
                registro={claveForm.register('actual', { required: 'Escribe tu contraseña actual' })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoContrasena
                  id="nueva"
                  etiqueta="Nueva contraseña"
                  autoComplete="new-password"
                  error={errC.nueva}
                  registro={claveForm.register('nueva', {
                    required: 'Escribe la nueva contraseña',
                    minLength: { value: 8, message: 'Debe tener al menos 8 caracteres' },
                    validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || 'Incluye letras y números',
                  })}
                />
                <CampoContrasena
                  id="confirmar"
                  etiqueta="Confirmar"
                  autoComplete="new-password"
                  error={errC.confirmar}
                  registro={claveForm.register('confirmar', {
                    required: 'Confirma la nueva contraseña',
                    validate: (v) => v === nueva || 'Las contraseñas no coinciden',
                  })}
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={claveForm.formState.isSubmitting}>
                  <Lock className="h-4 w-4" />
                  {claveForm.formState.isSubmitting ? 'Actualizando…' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
