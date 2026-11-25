import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Award, Compass, Clock3, CalendarDays, ArrowUpRight } from 'lucide-react';
import { alumnoService } from '../../services/alumno';
import { mensajeError } from '../../services/api';
import Encabezado from '../../components/UI/Encabezado';
import Cargando from '../../components/UI/Cargando';
import CertificadoDiseno from '../../components/Certificado/CertificadoDiseno';
import CertificadoModal from '../../components/Certificado/CertificadoModal';
import { fechaCorta } from '../../utils/formato';

const Certificados = () => {
  const [params, setParams] = useSearchParams();
  const [certificados, setCertificados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    alumnoService
      .misCertificados()
      .then(setCertificados)
      .catch((e) => toast.error(mensajeError(e, 'No pudimos cargar tus certificados.')))
      .finally(() => setCargando(false));
  }, []);

  // ?folio=… abre directamente un certificado (desde el reproductor o Mis cursos).
  const folioAbierto = params.get('folio');
  const abierto = certificados.find((c) => c.folio === folioAbierto) || null;
  const abrir = (folio) => setParams(folio ? { folio } : {}, { replace: true });

  if (cargando) return <Cargando />;

  return (
    <div className="pagina">
      <Encabezado
        etiqueta={`${certificados.length} ${certificados.length === 1 ? 'certificado' : 'certificados'}`}
        titulo="Certificados."
        apagado="Lo que ya lograste."
        sub="Cada certificado tiene un folio y un código QR para que cualquiera pueda verificarlo."
      />

      {certificados.length === 0 ? (
        <section className="card">
          <div className="vacio py-14">
            <span className="app-icono app-icono-ambar h-14 w-14 rounded-2xl [&_svg]:h-6 [&_svg]:w-6"><Award /></span>
            <p className="display mt-2 text-xl font-semibold text-tinta">Tu primer certificado te espera</p>
            <p className="max-w-sm text-sm">Completa todas las lecciones de un curso y lo recibirás al instante.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link to="/mis-cursos" className="btn-secondary">Mis cursos</Link>
              <Link to="/cursos" className="btn-primary"><Compass className="h-4 w-4" /> Explorar cursos</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Mis certificados">
          {certificados.map((c) => (
            <article key={c.folio} className="card group flex flex-col gap-4 p-4">
              <button
                type="button"
                onClick={() => abrir(c.folio)}
                className="block overflow-hidden rounded-2xl bg-black/[.03] p-3 text-left transition-transform group-hover:-translate-y-0.5"
                aria-label={`Abrir certificado de ${c.curso_titulo}`}
              >
                {/* Miniatura: el mismo diseño, a escala */}
                <div className="pointer-events-none">
                  <CertificadoDiseno certificado={c} />
                </div>
              </button>
              <div className="flex flex-1 flex-col gap-2 px-1">
                <h3 className="display text-base font-semibold leading-snug text-tinta">{c.curso_titulo}</h3>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-3">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fechaCorta(c.fecha_emision)}</span>
                  {Number(c.horas) > 0 && (
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{c.horas} h</span>
                  )}
                  <span className="numero">{c.folio}</span>
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => abrir(c.folio)} className="btn-primary btn-sm">
                    <Award className="h-4 w-4" /> Ver e imprimir
                  </button>
                  <Link to={`/cursos/${c.curso_slug}`} className="btn-ghost btn-sm">
                    Curso <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {abierto && <CertificadoModal certificado={abierto} onCerrar={() => abrir(null)} />}
    </div>
  );
};

export default Certificados;
