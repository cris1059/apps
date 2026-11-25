import { Link } from 'react-router-dom';
import { Award, Compass, PartyPopper } from 'lucide-react';
import Modal from '../UI/Modal';
import CertificadoDiseno from '../Certificado/CertificadoDiseno';

/* Se muestra al llegar al 100 %: felicitación y el certificado recién emitido. */
const Celebracion = ({ certificado, onCerrar }) => (
  <Modal abierto={!!certificado} onCerrar={onCerrar} ancho="sm:max-w-2xl">
    <div className="text-center">
      <span className="app-icono app-icono-tinta mx-auto h-14 w-14 rounded-2xl [&_svg]:h-7 [&_svg]:w-7">
        <PartyPopper />
      </span>
      <h2 className="pagina-titulo mt-4 text-[2rem]">¡Terminaste el curso!</h2>
      <p className="pagina-sub mx-auto">
        Completaste todas las lecciones de <b className="font-semibold text-tinta">{certificado?.curso_titulo}</b>. Aquí está tu
        certificado.
      </p>
    </div>

    <div className="mt-6">
      <CertificadoDiseno certificado={certificado} />
    </div>

    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
      <Link to="/cursos" className="btn-secondary">
        <Compass className="h-4 w-4" />
        Seguir aprendiendo
      </Link>
      <Link to={`/certificados?folio=${encodeURIComponent(certificado?.folio || '')}`} className="btn-primary">
        <Award className="h-4 w-4" />
        Ver e imprimir certificado
      </Link>
    </div>
  </Modal>
);

export default Celebracion;
