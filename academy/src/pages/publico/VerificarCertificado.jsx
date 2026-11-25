import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, XCircle, ArrowRight, Search, Download } from 'lucide-react';
import { urlImagenCertificadoApi } from '../../utils/linkedin';
import { obtenerCertificado } from '../../services/publico';
import { mensajeError } from '../../services/api';
import Cargando from '../../components/UI/Cargando';
import CertificadoDiseno from '../../components/Certificado/CertificadoDiseno';

/* Verificación pública de un certificado por folio (/certificados/<folio>): es a
   donde lleva el QR del certificado. Muestra «Certificado válido», el certificado
   (la imagen que genera el servidor; si no carga, el diseño en vivo) y acciones.
   La página con solo el certificado, la que abre LinkedIn, es /verified/<folio>.
   Con un folio anterior (certificados migrados) cambia la dirección al actual. */
const VerificarCertificado = () => {
  const { folio } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | valido | no_encontrado | error
  const [certificado, setCertificado] = useState(null);
  const [error, setError] = useState('');
  const [otro, setOtro] = useState('');
  const [imagenFallo, setImagenFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    setEstado('cargando');
    obtenerCertificado(folio)
      .then(({ certificado: c }) => {
        if (!vigente) return;
        setCertificado(c);
        setEstado('valido');
        if (c.folio !== String(folio).toUpperCase()) navigate(`/certificados/${c.folio}`, { replace: true });
      })
      .catch((e) => {
        if (!vigente) return;
        if (e?.response?.status === 404) setEstado('no_encontrado');
        else {
          setError(mensajeError(e));
          setEstado('error');
        }
      });
    return () => {
      vigente = false;
    };
  }, [folio, navigate]);

  if (estado === 'cargando') return <Cargando texto="Verificando certificado…" />;

  return (
    <div className="ac-contenedor py-[clamp(32px,6vw,80px)]">
      <div className={`mx-auto ${estado === 'valido' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        {estado === 'valido' ? (
          <>
            {/* El certificado mismo, como imagen (la que también muestra LinkedIn). */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F8F82]/10 px-3 py-1 font-semibold text-[#0B7A6F]">
                <BadgeCheck size={16} /> Certificado válido
              </span>
              <span className="text-tinta-3">
                Emitido por AvantCode · Folio <span className="numero font-medium text-tinta-2">{certificado.folio}</span>
              </span>
            </div>

            {imagenFallo ? (
              <CertificadoDiseno certificado={certificado} />
            ) : (
              <img
                src={urlImagenCertificadoApi(certificado.folio)}
                alt={`Certificado de ${certificado.alumno_nombre}: ${certificado.curso_titulo}`}
                width={2000}
                height={1414}
                onError={() => setImagenFallo(true)}
                className="block h-auto w-full rounded-[18px] bg-white shadow-flotante ring-1 ring-black/[.06]"
                style={{ aspectRatio: '2000 / 1414' }}
              />
            )}

            {/* Página del QR: solo verificar. Compartir en LinkedIn está en el panel del alumno. */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <a href={urlImagenCertificadoApi(certificado.folio, { descargar: true })} className="ac-btn ac-btn--negro ac-btn--chico">
                <Download size={16} /> Descargar
              </a>
              <Link to={`/cursos/${certificado.curso_slug}`} className="ac-btn ac-btn--gris ac-btn--chico">
                Ver el curso <ArrowRight size={16} />
              </Link>
            </div>
          </>
        ) : (
          <div className="ac-centro">
            <span className="app-icono app-icono-rojo mx-auto mb-5 h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8"><XCircle /></span>
            <h1 className="ac-titulo">{estado === 'error' ? 'No pudimos verificarlo.' : 'No encontramos este certificado.'}</h1>
            <p className="ac-sub mt-3">
              {estado === 'error' ? error : <>No existe un certificado con el folio <b className="numero text-tinta">{folio}</b>. Revisa que esté bien escrito.</>}
            </p>
          </div>
        )}

        <form
          className="mt-10 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const f = otro.trim().toUpperCase();
            if (f) navigate(`/certificados/${encodeURIComponent(f)}`);
          }}
        >
          <label htmlFor="otro-folio" className="sr-only">Verificar otro folio</label>
          <div className="ac-campo-busqueda">
            <Search className="h-[18px] w-[18px]" />
            <input id="otro-folio" value={otro} onChange={(e) => setOtro(e.target.value)} placeholder="Verificar otro folio" autoComplete="off" />
          </div>
          <button type="submit" className="ac-btn ac-btn--gris ac-btn--grande" disabled={!otro.trim()}>Verificar</button>
        </form>
      </div>
    </div>
  );
};

export default VerificarCertificado;
