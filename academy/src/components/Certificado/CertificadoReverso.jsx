import logo from '../../img/LogoI.webp';
import { fechaLarga } from '../../utils/formato';

/* Reverso del certificado: el temario del curso que se completó.
   Mismo formato que CertificadoDiseno (proporción A4 horizontal, medidas en cqw). */
const CertificadoReverso = ({ certificado, temario, deEmision = true, className = '' }) => {
  if (!certificado) return null;
  const modulos = Array.isArray(temario) ? temario : [];
  const lecciones = modulos.reduce((total, m) => total + (Number(m.lecciones) || 0), 0);
  const horas = Number(certificado.horas) || 0;
  const muchos = modulos.length > 8;

  return (
    <div className={`w-full ${className}`} style={{ containerType: 'inline-size' }}>
      <article
        className="relative w-full overflow-hidden bg-white text-tinta shadow-flotante ring-1 ring-black/[.06]"
        style={{ aspectRatio: '1.414 / 1', borderRadius: '1.6cqw' }}
        aria-label={`Temario del curso ${certificado.curso_titulo}`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60cqw 40cqw at 0% 0%, rgba(212,255,63,.14), transparent 70%), radial-gradient(60cqw 45cqw at 100% 100%, rgba(167,139,250,.12), transparent 70%)',
          }}
        />

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
              <span className="rounded-full bg-negro font-semibold text-lima" style={{ fontSize: '1.15cqw', padding: '.35cqw 1cqw' }}>
                Academy
              </span>
            </div>
            <span className="flex flex-col items-end">
              <span className="font-semibold uppercase text-tinta-3" style={{ fontSize: '.95cqw', letterSpacing: '.22em' }}>
                Folio de verificación
              </span>
              <span className="numero font-semibold text-tinta" style={{ fontSize: '1.75cqw', letterSpacing: '.08em', marginTop: '.3cqw' }}>
                {certificado.folio}
              </span>
            </span>
          </header>

          {/* Título */}
          <div style={{ marginTop: '3.6cqw' }}>
            <p className="font-semibold uppercase text-tinta-3" style={{ fontSize: '1.2cqw', letterSpacing: '.32em' }}>
              {deEmision ? 'Temario del curso' : 'Temario actual del curso'}
            </p>
            <p
              className="font-display font-semibold text-tinta"
              style={{ fontSize: '2.6cqw', lineHeight: 1.15, letterSpacing: '-.025em', marginTop: '.9cqw', maxWidth: '72cqw' }}
            >
              {certificado.curso_titulo}
            </p>
            <span aria-hidden="true" className="block rounded-full bg-lima" style={{ width: '6cqw', height: '.35cqw', marginTop: '1.8cqw' }} />
          </div>

          {/* Módulos */}
          <div className="flex-1" style={{ marginTop: '2.6cqw' }}>
            {modulos.length ? (
              <ol
                className="grid"
                style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '4cqw', rowGap: muchos ? '1.1cqw' : '1.7cqw' }}
              >
                {modulos.map((m, i) => (
                  <li key={`${i}-${m.titulo}`} className="flex items-baseline" style={{ gap: '1.4cqw' }}>
                    <span className="numero font-semibold text-tinta-3" style={{ fontSize: muchos ? '1.2cqw' : '1.4cqw', minWidth: '2.4cqw' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-tinta" style={{ fontSize: muchos ? '1.35cqw' : '1.6cqw', lineHeight: 1.25 }}>
                        {m.titulo}
                      </span>
                      <span className="block text-tinta-3" style={{ fontSize: muchos ? '1.05cqw' : '1.2cqw', marginTop: '.25cqw' }}>
                        {m.lecciones} {Number(m.lecciones) === 1 ? 'lección' : 'lecciones'}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-tinta-3" style={{ fontSize: '1.5cqw' }}>
                El temario de este curso ya no está disponible en línea.
              </p>
            )}
          </div>

          {/* Pie */}
          <footer className="flex items-end justify-between" style={{ gap: '4cqw', borderTop: '0.12cqw solid rgba(20,20,20,.12)', paddingTop: '1.6cqw' }}>
            <p className="text-tinta-2" style={{ fontSize: '1.3cqw', lineHeight: 1.5 }}>
              {deEmision && lecciones > 0 && (
                <>
                  Completó las <b className="font-semibold text-tinta">{lecciones} lecciones</b> del curso
                  <br />
                </>
              )}
              <span className="text-tinta-3">
                {horas > 0 && `${horas} ${horas === 1 ? 'hora' : 'horas'} de formación · `}
                {fechaLarga(certificado.fecha_emision)}
              </span>
            </p>
            <p className="text-right text-tinta-3" style={{ fontSize: '1.1cqw', lineHeight: 1.45 }}>
              Certificado emitido por
              <br />
              <b className="font-semibold text-tinta-2">AvantCode</b>
            </p>
          </footer>
        </div>
      </article>
    </div>
  );
};

export default CertificadoReverso;
