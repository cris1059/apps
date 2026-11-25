import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { obtenerCertificado } from '../../services/publico';
import Cargando from '../../components/UI/Cargando';
import CertificadoDiseno from '../../components/Certificado/CertificadoDiseno';
import CertificadoReverso from '../../components/Certificado/CertificadoReverso';

/* Página pública del certificado: academy.avantcode.mx/verified/<folio>.
   Solo el certificado al centro (sin menú ni pie), con una flecha para voltearlo
   y ver el temario del curso. Es lo que abre «Mostrar credencial» en LinkedIn
   y el QR del certificado. Acepta el folio anterior y cambia la dirección al nuevo. */
const CertificadoPublico = () => {
  const { folio } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | no_encontrado | error
  const [datos, setDatos] = useState(null);
  const [volteado, setVolteado] = useState(false);

  useEffect(() => {
    let vigente = true;
    setEstado('cargando');
    obtenerCertificado(folio)
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setEstado('listo');
        // Folio anterior (enlaces y QR viejos): la dirección pasa al folio actual.
        if (d.certificado.folio !== String(folio).toUpperCase()) {
          navigate(`/verified/${d.certificado.folio}`, { replace: true });
        }
      })
      .catch((e) => vigente && setEstado(e?.response?.status === 404 ? 'no_encontrado' : 'error'));
    return () => {
      vigente = false;
    };
  }, [folio, navigate]);

  useEffect(() => {
    if (!datos?.certificado) return undefined;
    const anterior = document.title;
    document.title = `${datos.certificado.alumno_nombre} - ${datos.certificado.curso_titulo} - AvantCode`;
    return () => {
      document.title = anterior;
    };
  }, [datos]);

  if (estado === 'cargando') return <Cargando texto="Cargando certificado…" />;

  if (estado !== 'listo') {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-[#F4F4F2] px-6 text-center">
        <div>
          <p className="text-lg font-semibold text-tinta">
            {estado === 'error' ? 'No pudimos cargar el certificado.' : 'No existe un certificado con este folio.'}
          </p>
          <p className="mt-1 text-sm text-tinta-3">
            Folio <span className="numero font-medium">{String(folio).toUpperCase()}</span>
          </p>
          <Link to="/" className="ac-btn ac-btn--gris ac-btn--chico mt-5 inline-flex">
            Ir a AvantCode Academy
          </Link>
        </div>
      </main>
    );
  }

  const { certificado, temario, temario_de_emision: deEmision = true } = datos;
  const Flecha = volteado ? ArrowLeft : ArrowRight;
  const etiqueta = volteado ? 'Ver el certificado' : 'Ver el temario del curso';

  return (
    <main className="cert-pagina grid min-h-[100svh] place-items-center bg-[#F4F4F2] px-4 py-8 sm:px-8">
      <style>{`
        .cert-pagina { --ancho: min(1120px, 92vw, calc((100svh - 160px) * 1.414)); }
        .cert-tarjeta { perspective: 2400px; width: var(--ancho); }
        /* Giro con curva simétrica: a la mitad del tiempo (.35 s) la tarjeta está de canto
           (90°) y ahí se cambia la cara visible. No se depende solo de backface-visibility:
           en Safari de iPhone falla con hijos que tienen filtros o mezcla (la marca de agua)
           y se veía el frente al revés a través del reverso. */
        .cert-giro {
          display: grid;
          transform-style: preserve-3d;
          transition: transform .7s cubic-bezier(.45,0,.55,1);
        }
        .cert-giro.volteado { transform: rotateY(180deg); }
        .cert-cara {
          grid-area: 1 / 1;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition: visibility 0s linear .35s;
        }
        .cert-frente { visibility: visible; }
        .cert-reverso { transform: rotateY(180deg); visibility: hidden; }
        .cert-giro.volteado .cert-frente { visibility: hidden; }
        .cert-giro.volteado .cert-reverso { visibility: visible; }
        @media (prefers-reduced-motion: reduce) {
          .cert-giro { transition: none; transform: none !important; }
          .cert-cara { transition: none; }
          .cert-giro .cert-reverso { transform: none; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 lg:flex-row lg:gap-6">
        <div className="cert-tarjeta">
          <div className={`cert-giro ${volteado ? 'volteado' : ''}`}>
            <div className="cert-cara cert-frente" aria-hidden={volteado}>
              <CertificadoDiseno certificado={certificado} />
            </div>
            <div className="cert-cara cert-reverso" aria-hidden={!volteado}>
              <CertificadoReverso certificado={certificado} temario={temario} deEmision={deEmision} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVolteado((v) => !v)}
          aria-label={etiqueta}
          title={etiqueta}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-tinta shadow-flotante ring-1 ring-black/[.08] transition-transform hover:scale-105 active:scale-95"
        >
          <Flecha className="h-5 w-5" />
        </button>
      </div>
    </main>
  );
};

export default CertificadoPublico;
