import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Gift, Copy, Check, Share2, UserPlus, MailCheck, Wallet, Compass, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { alumnoService } from '../../services/alumno';
import { mensajeError } from '../../services/api';
import Encabezado from '../../components/UI/Encabezado';
import Cargando from '../../components/UI/Cargando';
import { copiarTexto } from '../../components/Panel/util';
import { moneda, fechaCorta } from '../../utils/formato';

const ESTADOS = {
  premiado: { texto: 'Ganaste', badge: 'badge-success' },
  pendiente: { texto: 'Falta confirmar su correo', badge: 'badge-warning' },
  sin_premio: { texto: 'Sin premio', badge: 'badge-neutral' },
};

/* /invita — saldo por invitaciones: enlace para compartir, avance, invitados y movimientos. */
const Invita = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    alumnoService
      .saldo()
      .then(setDatos)
      .catch((e) => setError(mensajeError(e, 'No pudimos cargar tu saldo.')));
  }, []);

  if (error) {
    return (
      <div className="pagina">
        <section className="card"><div className="vacio py-14"><p className="text-sm">{error}</p></div></section>
      </div>
    );
  }
  if (!datos) return <Cargando />;

  const { saldo, enlace, reglas, premiados, restantes, invitados, movimientos } = datos;
  const mensaje = `Estoy aprendiendo en AvantCode Academy: cursos de tecnología con certificado. Crea tu cuenta con mi enlace y recibe ${moneda(reglas.bienvenida)} de saldo para tus cursos.`;
  const avance = Math.min(100, Math.round((premiados / reglas.tope_invitados) * 100));

  const copiar = async () => {
    if (await copiarTexto(enlace)) {
      setCopiado(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopiado(false), 2000);
    } else toast.error('No se pudo copiar el enlace');
  };

  const compartir = async () => {
    try {
      await navigator.share({ title: 'AvantCode Academy', text: mensaje, url: enlace });
    } catch {
      /* canceló o el navegador no deja */
    }
  };

  const redes = [
    { nombre: 'WhatsApp', Icono: FaWhatsapp, url: `https://wa.me/?text=${encodeURIComponent(`${mensaje} ${enlace}`)}` },
    { nombre: 'LinkedIn', Icono: FaLinkedinIn, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(enlace)}` },
    { nombre: 'Facebook', Icono: FaFacebookF, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(enlace)}` },
    { nombre: 'X', Icono: FaXTwitter, url: `https://x.com/intent/post?text=${encodeURIComponent(mensaje)}&url=${encodeURIComponent(enlace)}` },
  ];

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Saldo por invitaciones"
        titulo="Invita y gana."
        apagado={`${moneda(reglas.por_invitado)} por cada persona.`}
        sub={`Comparte tu enlace. Por cada persona que cree su cuenta y confirme su correo ganas ${moneda(reglas.por_invitado)}, hasta ${reglas.tope_invitados} personas. Quien se une recibe ${moneda(reglas.bienvenida)} de bienvenida.`}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Saldo */}
        <article className="relative overflow-hidden rounded-[28px] bg-negro p-6 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lima/20 blur-3xl" aria-hidden="true" />
          <p className="m-0 flex items-center gap-2 text-sm text-white/60"><Wallet className="h-4 w-4" /> Tu saldo</p>
          <p className="display m-0 mt-2 text-[3.25rem] font-semibold leading-none tracking-tight">{moneda(saldo)}</p>
          <p className="m-0 mt-2 text-sm text-white/60">MXN para tus cursos de pago en AvantCode Academy.</p>

          <div className="mt-7">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-white/70">Invitaciones con premio</span>
              <span className="font-semibold"><span className="text-lima">{premiados}</span> de {reglas.tope_invitados}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={reglas.tope_invitados} aria-valuenow={premiados}>
              <div className="h-full rounded-full bg-lima transition-[width] duration-700" style={{ width: `${avance}%` }} />
            </div>
            <p className="m-0 mt-2 text-xs text-white/50">
              {restantes > 0
                ? `Puedes ganar ${moneda(restantes * reglas.por_invitado)} más (máximo ${moneda(reglas.maximo)}).`
                : `Llegaste al máximo de ${reglas.tope_invitados} invitaciones con premio. ¡Gracias por compartir!`}
            </p>
          </div>
        </article>

        {/* Enlace */}
        <article className="card flex flex-col gap-5 p-6 sm:p-7">
          <div>
            <h2 className="display m-0 text-lg font-semibold text-tinta">Tu enlace para invitar</h2>
            <p className="m-0 mt-1 text-sm text-tinta-3">Compártelo desde tu perfil, por WhatsApp o en tus redes.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={enlace} onFocus={(e) => e.target.select()} className="input-field numero min-w-0 flex-1 text-sm" aria-label="Tu enlace para invitar" />
            <button type="button" onClick={copiar} className="btn-primary shrink-0">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiado ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {redes.map(({ nombre, Icono, url }) => (
              <a key={nombre} href={url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" aria-label={`Compartir en ${nombre}`}>
                <Icono className="h-4 w-4" /> {nombre}
              </a>
            ))}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button type="button" onClick={compartir} className="btn-ghost btn-sm"><Share2 className="h-4 w-4" /> Más opciones</button>
            )}
          </div>
          <ol className="m-0 grid list-none gap-3 border-t border-black/[.07] p-0 pt-5 sm:grid-cols-3">
            {[
              { Icono: Share2, texto: 'Comparte tu enlace' },
              { Icono: UserPlus, texto: 'Crean su cuenta con él' },
              { Icono: MailCheck, texto: `Confirman su correo y ganas ${moneda(reglas.por_invitado)}` },
            ].map(({ Icono, texto }, i) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-tinta-2">
                <span className="app-icono app-icono-claro app-icono-sm shrink-0"><Icono /></span>
                <span><b className="text-tinta">{i + 1}.</b> {texto}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Invitados */}
        <article className="card p-6">
          <h2 className="display m-0 text-lg font-semibold text-tinta">Personas que invitaste</h2>
          {invitados.length === 0 ? (
            <div className="vacio py-10">
              <span className="app-icono app-icono-claro"><Gift /></span>
              <p className="m-0 max-w-xs text-sm">Aún nadie se une con tu enlace. Compártelo y aquí verás a cada persona.</p>
            </div>
          ) : (
            <ul className="m-0 mt-4 list-none divide-y divide-black/[.06] p-0">
              {invitados.map((i, n) => (
                <li key={`${i.nombre}-${n}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-tinta">{i.nombre}</span>
                    <span className="block text-xs text-tinta-3">Se registró el {fechaCorta(i.fecha)}</span>
                  </span>
                  <span className={`badge ${ESTADOS[i.estado]?.badge || 'badge-neutral'} shrink-0`}>
                    {i.estado === 'premiado' ? `+${moneda(reglas.por_invitado)}` : ESTADOS[i.estado]?.texto}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Movimientos */}
        <article className="card p-6">
          <h2 className="display m-0 text-lg font-semibold text-tinta">Movimientos</h2>
          {movimientos.length === 0 ? (
            <div className="vacio py-10">
              <span className="app-icono app-icono-claro"><Wallet /></span>
              <p className="m-0 max-w-xs text-sm">Aquí verás lo que ganas y lo que usas en tus cursos.</p>
            </div>
          ) : (
            <ul className="m-0 mt-4 list-none divide-y divide-black/[.06] p-0">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`app-icono app-icono-sm shrink-0 ${m.monto >= 0 ? 'app-icono-teal' : 'app-icono-claro'}`}>
                      {m.monto >= 0 ? <ArrowDownRight /> : <ArrowUpRight />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-tinta">{m.descripcion}</span>
                      <span className="block text-xs text-tinta-3">{fechaCorta(m.fecha)}</span>
                    </span>
                  </span>
                  <span className={`numero shrink-0 text-sm font-semibold ${m.monto >= 0 ? 'text-[#0F8F82]' : 'text-tinta'}`}>
                    {m.monto >= 0 ? '+' : '−'}{moneda(Math.abs(m.monto))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[28px] bg-black/[.03] p-6 sm:flex-row sm:items-center">
        <p className="m-0 max-w-2xl text-sm text-tinta-3">
          El saldo se descuenta solo al inscribirte a un curso de pago. No se cambia por dinero ni se transfiere a otra cuenta.
          Si cancelas una inscripción que usó saldo, te lo devolvemos.
        </p>
        <Link to="/cursos" className="btn-secondary shrink-0"><Compass className="h-4 w-4" /> Explorar cursos</Link>
      </section>
    </div>
  );
};

export default Invita;
