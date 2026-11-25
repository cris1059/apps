import { Link } from 'react-router-dom';
import { Clock3, PlayCircle, GraduationCap } from 'lucide-react';
import Estrellas from './Estrellas';
import Precio, { descuento } from './Precio';
import Avatar from '../UI/Avatar';
import { NIVELES, duracion, esGratis } from '../../utils/formato';

/* Tarjeta de curso del catálogo (estilo de los mosaicos grises del sitio). */
const TarjetaCurso = ({ curso }) => {
  const off = descuento(curso);
  // Sin lecciones todavía: aún no tiene precio anunciado.
  const sinContenido = curso.proximamente && !curso.total_lecciones;
  const minutos = curso.duracion_total_min || (curso.duracion_horas ? curso.duracion_horas * 60 : 0);
  const cal = curso.calificacion || {};

  return (
    <Link to={`/cursos/${curso.slug}`} className="ac-curso group" aria-label={curso.titulo}>
      <div className="ac-curso-portada">
        {curso.imagen_portada ? (
          <img src={curso.imagen_portada} alt="" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="app-icono h-14 w-14 rounded-2xl bg-white/10 text-lima shadow-none ring-1 ring-white/15 [&_svg]:h-7 [&_svg]:w-7">
              <GraduationCap />
            </span>
          </div>
        )}
        <div className="ac-curso-insignias">
          {curso.destacado && <span className="badge badge-dark">Destacado</span>}
          {curso.proximamente && <span className="badge bg-white/90 text-tinta">{curso.abre_el ? `Abre el ${curso.abre_el.replace(/ de d{4}$/, '')}` : 'Próximamente'}</span>}
          {esGratis(curso) && !sinContenido && <span className="badge bg-lima text-negro before:bg-negro">Gratis</span>}
          {off && !esGratis(curso) && <span className="badge bg-white/90 text-tinta">−{off}%</span>}
        </div>
      </div>

      <div className="ac-curso-cuerpo">
        <div className="flex flex-wrap items-center gap-1.5">
          {curso.categoria && <span className="badge badge-neutral">{curso.categoria}</span>}
          {curso.nivel && <span className="badge badge-neutral">{NIVELES[curso.nivel] || curso.nivel}</span>}
        </div>
        <h3 className="ac-curso-titulo">{curso.titulo}</h3>
        {curso.resumen && <p className="ac-curso-resumen">{curso.resumen}</p>}

        <div className="ac-curso-meta">
          {cal.total > 0 ? (
            <Estrellas valor={cal.promedio} mostrarValor total={cal.total} tamano={13} />
          ) : (
            <span>Nuevo</span>
          )}
          {minutos > 0 && (
            <span><Clock3 className="h-3.5 w-3.5" /> {duracion(minutos)}</span>
          )}
          {curso.total_lecciones > 0 && (
            <span><PlayCircle className="h-3.5 w-3.5" /> {curso.total_lecciones} lecciones</span>
          )}
        </div>

        <div className="ac-curso-pie">
          {curso.instructor ? (
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-tinta-2">
              <Avatar nombre={curso.instructor.nombre} foto={curso.instructor.foto} tamano={26} />
              <span className="truncate">{curso.instructor.nombre}</span>
            </span>
          ) : (
            <span className="text-[13px] text-tinta-3">AvantCode</span>
          )}
          {sinContenido ? <span className="ac-precio text-tinta-3">Muy pronto</span> : <Precio curso={curso} className="shrink-0 text-[17px]" />}
        </div>
      </div>
    </Link>
  );
};

/* Esqueleto mientras carga el catálogo. */
export const TarjetaCursoEsqueleto = () => (
  <div className="ac-esqueleto h-[380px]" aria-hidden="true" />
);

export default TarjetaCurso;
