import { ORIGEN_API } from '../services/api';

/* Enlaces de LinkedIn y de la imagen del certificado.
   - El certificado se emite a nombre de la empresa AvantCode: con su id de página
     de LinkedIn (146928326, linkedin.com/company/avantcode) aparece con su logo.
   - «Mostrar credencial» en LinkedIn abre la página del certificado
     (academy.avantcode.mx/verified/<folio>): solo el certificado al centro, con su
     temario al reverso.
   - Al compartir, LinkedIn arma la vista previa con la imagen del certificado o la
     portada del curso (el backend la sirve en /api/compartir/… a sus robots). */

export const ORGANIZACION = 'AvantCode';
const ID_ORGANIZACION = import.meta.env.VITE_LINKEDIN_ORG_ID || '146928326';

export const urlCompartirLinkedIn = (url) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

/* Imagen PNG del certificado (para descargarla), directo de la API. */
export const urlImagenCertificadoApi = (folio, { descargar = false } = {}) =>
  `${ORIGEN_API}/api/compartir/certificados/${encodeURIComponent(folio)}/certificado.png${descargar ? '?descargar=1' : ''}`;

export const urlAgregarCertificadoLinkedIn = (certificado) => {
  const fecha = new Date(certificado.fecha_emision);
  const parametros = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: certificado.curso_titulo,
    organizationId: ID_ORGANIZACION,
    issueYear: String(fecha.getFullYear()),
    issueMonth: String(fecha.getMonth() + 1),
    certUrl: certificado.url_certificado || `${(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)}/verified/${encodeURIComponent(certificado.folio)}`,
    certId: certificado.folio,
  });
  return `https://www.linkedin.com/profile/add?${parametros}`;
};
