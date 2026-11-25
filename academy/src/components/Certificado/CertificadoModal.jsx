import toast from 'react-hot-toast';
import { Printer, Link2, Linkedin, Share2, Download, ExternalLink } from 'lucide-react';
import Modal from '../UI/Modal';
import CertificadoDiseno, { EstilosImpresion, urlPaginaCertificado } from './CertificadoDiseno';
import { copiarTexto } from '../Panel/util';
import { urlAgregarCertificadoLinkedIn, urlCompartirLinkedIn, urlImagenCertificadoApi } from '../../utils/linkedin';

/* Certificado abierto en un modal amplio: agregarlo al perfil de LinkedIn (a nombre
   de AvantCode; «Mostrar credencial» abre la imagen del certificado), compartirlo
   (la publicación lleva la imagen), descargar la imagen, imprimir y copiar el enlace. */
const CertificadoModal = ({ certificado, onCerrar }) => {
  if (!certificado) return null;
  // Página del certificado (la que abre LinkedIn); el QR lleva a la de verificación.
  const url = urlPaginaCertificado(certificado);
  const conUrl = { ...certificado, url_certificado: url };

  const copiar = async () => {
    if (await copiarTexto(url)) toast.success('Enlace del certificado copiado');
    else toast.error('No se pudo copiar el enlace');
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={certificado.curso_titulo}
      descripcion={`Certificado ${certificado.folio}`}
      ancho="sm:max-w-4xl"
    >
      <EstilosImpresion />
      <CertificadoDiseno certificado={certificado} />

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={urlAgregarCertificadoLinkedIn(conUrl)} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <Linkedin className="h-4 w-4" />
            Agregar a mi perfil de LinkedIn
          </a>
          <a href={urlCompartirLinkedIn(url)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <Share2 className="h-4 w-4" />
            Compartir publicación
          </a>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <ExternalLink className="h-4 w-4" />
            Ver página
          </a>
          <a href={urlImagenCertificadoApi(certificado.folio, { descargar: true })} className="btn-ghost">
            <Download className="h-4 w-4" />
            Descargar imagen
          </a>
          <button type="button" onClick={() => window.print()} className="btn-ghost">
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button type="button" onClick={copiar} className="btn-ghost" aria-label="Copiar enlace de verificación" title="Copiar enlace">
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-tinta-3 lg:text-left">
        Se agrega en <b className="font-semibold">Licencias y certificaciones</b> a nombre de AvantCode, y «Mostrar credencial» abre la página de tu
        certificado (con el temario al reverso). Al compartirlo, la publicación lleva la imagen del certificado.
      </p>
    </Modal>
  );
};

export default CertificadoModal;
