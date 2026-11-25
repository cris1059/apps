import logo from '../../img/LogoI.webp';
import firmaDirector from '../../img/FirmaDirector.png';
import QRPuntos from '../UI/QRPuntos';
import { fechaLarga } from '../../utils/formato';

/* Página de verificación (a donde lleva el QR): /certificados/<folio>. */
export const urlVerificacion = (certificado) =>
  certificado?.url_verificacion || `${(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)}/certificados/${encodeURIComponent(certificado?.folio || '')}`;

/* Página del certificado, solo el certificado (la que abre LinkedIn): /verified/<folio>. */
export const urlPaginaCertificado = (certificado) =>
  certificado?.url_certificado || `${(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)}/verified/${encodeURIComponent(certificado?.folio || '')}`;

/* Certificado de finalización: diseño monocromo horizontal (proporción A4).
   Todas las medidas usan `cqw` (ancho del contenedor), así se ve igual en
   un modal de celular, en escritorio y al imprimir. */
const CertificadoDiseno = ({ certificado, className = '' }) => {
  if (!certificado) return null;
  const url = urlVerificacion(certificado);
  const horas = Number(certificado.horas) || 0;

  return (
    <div className={`certificado-contenedor w-full ${className}`} style={{ containerType: 'inline-size' }}>
      <article
        className="certificado-imprimible relative w-full overflow-hidden bg-white text-tinta shadow-flotante ring-1 ring-black/[.06]"
        style={{ aspectRatio: '1.414 / 1', borderRadius: '1.6cqw' }}
        aria-label={`Certificado de ${certificado.alumno_nombre}`}
      >
        {/* Luz de fondo muy tenue */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60cqw 40cqw at 100% 0%, rgba(212,255,63,.16), transparent 70%), radial-gradient(60cqw 45cqw at 0% 100%, rgba(167,139,250,.12), transparent 70%)',
          }}
        />

        {/* Marca de agua centrada detrás del contenido. */}
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute select-none"
          style={{
            width: '34cqw',
            height: '34cqw',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
            opacity: 0.055,
            filter: 'grayscale(1) contrast(1.35)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Marco */}
        <div
          className="absolute flex flex-col"
          style={{ inset: '2.6cqw', zIndex: 1, border: '0.12cqw solid rgba(20,20,20,.14)', borderRadius: '1cqw', padding: '4cqw 5cqw 3.6cqw' }}
        >
          {/* Cabecera */}
          <header className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: '1.1cqw' }}>
              <img src={logo} alt="" style={{ width: '3.6cqw', height: '3.6cqw', borderRadius: '50%' }} />
              <span className="font-display" style={{ fontSize: '2cqw', letterSpacing: '.08em', fontWeight: 300 }}>
                <b style={{ fontWeight: 600 }}>ΛVΛNT</b>CODE
              </span>
              <span
                className="rounded-full bg-negro font-semibold text-lima"
                style={{ fontSize: '1.15cqw', padding: '.35cqw 1cqw' }}
              >
                Academy
              </span>
            </div>
            {/* Folio de verificación, visible (igual que en la imagen que genera el servidor). */}
            <span className="flex flex-col items-end">
              <span className="font-semibold uppercase text-tinta-3" style={{ fontSize: '.95cqw', letterSpacing: '.22em' }}>
                Folio de verificación
              </span>
              <span className="numero font-semibold text-tinta" style={{ fontSize: '1.75cqw', letterSpacing: '.08em', marginTop: '.3cqw' }}>
                {certificado.folio}
              </span>
            </span>
          </header>

          {/* Cuerpo */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-semibold uppercase text-tinta-3" style={{ fontSize: '1.3cqw', letterSpacing: '.32em' }}>
              Certificado de finalización
            </p>
            <p className="text-tinta-3" style={{ fontSize: '1.6cqw', marginTop: '2.6cqw' }}>
              Se otorga a
            </p>
            <h2
              className="font-display font-semibold text-tinta"
              style={{ fontSize: '5.2cqw', lineHeight: 1.05, letterSpacing: '-.035em', marginTop: '.8cqw', maxWidth: '78cqw' }}
            >
              {certificado.alumno_nombre}
            </h2>
            <span aria-hidden="true" className="block rounded-full bg-lima" style={{ width: '6cqw', height: '.35cqw', marginTop: '2.2cqw' }} />
            <p className="text-tinta-2" style={{ fontSize: '1.6cqw', marginTop: '2.2cqw' }}>
              por completar satisfactoriamente el curso
            </p>
            <p
              className="font-display font-semibold text-tinta"
              style={{ fontSize: '2.9cqw', lineHeight: 1.15, letterSpacing: '-.025em', marginTop: '.8cqw', maxWidth: '74cqw' }}
            >
              {certificado.curso_titulo}
            </p>
            <p className="text-tinta-3" style={{ fontSize: '1.45cqw', marginTop: '1.6cqw' }}>
              {horas > 0 && `${horas} ${horas === 1 ? 'hora' : 'horas'} de formación · `}
              {fechaLarga(certificado.fecha_emision)}
            </p>
          </div>

          {/* Pie: firma y verificación */}
          <footer className="flex items-end justify-between" style={{ gap: '4cqw' }}>
            <div style={{ minWidth: '24cqw' }}>
              <div
                aria-label="Firma de Christopher C."
                style={{ position: 'relative', width: '24cqw', height: '5.25cqw', overflow: 'hidden' }}
              >
                <img
                  src={firmaDirector}
                  alt="Firma de Christopher C."
                  style={{
                    position: 'absolute',
                    top: '-3.25cqw',
                    left: 0,
                    width: '24cqw',
                    maxWidth: 'none',
                    filter: 'contrast(1.8)',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>
              <div style={{ borderTop: '0.12cqw solid rgba(20,20,20,.5)', paddingTop: '.9cqw' }}>
                <p className="font-semibold text-tinta" style={{ fontSize: '1.45cqw' }}>
                  Director General
                </p>
                <p className="text-tinta-3" style={{ fontSize: '1.15cqw' }}>
                  AvantCode Academy
                </p>
              </div>
            </div>
            <div className="flex items-end" style={{ gap: '1.6cqw' }}>
              <p className="text-right text-tinta-3" style={{ fontSize: '1.05cqw', lineHeight: 1.45, maxWidth: '26cqw' }}>
                Verifica la autenticidad en
                <br />
                <span className="font-medium text-tinta-2">{url.replace(/^https?:\/\//, '').replace(/[^/]+$/, '')}</span>
                <br />
                <span className="font-medium text-tinta-2">{certificado.folio}</span>
              </p>
              <div className="text-center">
                <p className="font-medium text-tinta-2" style={{ margin: '0 0 .55cqw', fontSize: '1.05cqw' }}>
                  Consulta en línea
                </p>
                <div
                  className="bg-white"
                  style={{ width: '10.8cqw', padding: '.45cqw', borderRadius: '.7cqw', boxShadow: 'inset 0 0 0 0.1cqw rgba(20,20,20,.1)' }}
                >
                  <QRPuntos
                    valor={url}
                    tamano={256}
                    titulo={`Código QR del certificado ${certificado.folio}`}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
};

/* Reglas de impresión: solo se imprime el certificado, en A4 horizontal.
   Se monta únicamente mientras el certificado está abierto. Neutraliza el
   vidrio y las transformaciones del modal para que `position: fixed` sea
   relativo a la hoja. */
export const EstilosImpresion = () => (
  <style>{`
    @media print {
      @page { size: A4 landscape; margin: 0; }
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      .certificado-imprimible, .certificado-imprimible * { visibility: visible !important; }
      .modal-fondo, .modal-panel {
        position: static !important; inset: auto !important; transform: none !important; animation: none !important;
        -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
        overflow: visible !important; max-height: none !important; padding: 0 !important;
        background: none !important; box-shadow: none !important; border: 0 !important;
      }
      .certificado-contenedor {
        position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
        visibility: visible !important;
      }
      .certificado-imprimible {
        position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important;
        aspect-ratio: auto !important; border-radius: 0 !important; box-shadow: none !important;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
    }
  `}</style>
);

export default CertificadoDiseno;
