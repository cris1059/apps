import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, MonitorPlay, ClipboardCheck, Dumbbell } from 'lucide-react';
import Marca from '../../components/Marca/Marca';
import ContenidoTexto from '../../components/Aprender/ContenidoTexto';
import Examen from '../../components/Actividades/Examen';
import Practica from '../../components/Actividades/Practica';
import { examenPublico, calificarExamen, resultadoVisible } from '../../components/Actividades/modelo';

/* Vista previa del examen o la práctica mientras se edita en el sistema AvantCode.
   El editor abre esta página y le envía la lección con postMessage (solo se aceptan
   mensajes del sistema). Nada se guarda: el examen se califica aquí mismo. */

const origenDe = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
};
const ORIGENES = [origenDe(import.meta.env.VITE_SISTEMA_URL || 'https://sistema.avantcodeapp.com')];
const permitido = (origen) =>
  ORIGENES.includes(origen) || (import.meta.env.DEV && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen));

/* Examen con intentos simulados en memoria. */
const ExamenPrevio = ({ actividad }) => {
  const examen = useMemo(() => examenPublico(actividad), [actividad]);
  const intentos = useRef([]);
  const modo = actividad.retroalimentacion || 'aciertos';
  const estado = () => {
    const lista = intentos.current;
    const limite = Number(actividad.intentos) || 0;
    return {
      intentos: lista.map(({ numero, puntaje, aprobado, fecha }) => ({ numero, puntaje, aprobado, fecha })),
      usados: lista.length,
      restantes: limite ? Math.max(0, limite - lista.length) : null,
      aprobado: lista.some((i) => i.aprobado),
      mejor: lista.length ? Math.max(...lista.map((i) => i.puntaje)) : null,
      ultimo: lista.length ? resultadoVisible(lista[lista.length - 1], modo) : null,
    };
  };
  return (
    <Examen
      examen={examen}
      vistaPrevia
      cargarEstado={() => Promise.resolve(estado())}
      enviar={(respuestas) => {
        const calificacion = calificarExamen(actividad, respuestas);
        const intento = { numero: intentos.current.length + 1, ...calificacion, respuestas, fecha: new Date().toISOString() };
        intentos.current = [...intentos.current, intento];
        return Promise.resolve({ resultado: resultadoVisible(intento, modo), estado: estado() });
      }}
    />
  );
};

const VistaPreviaActividad = () => {
  const [leccion, setLeccion] = useState(null);
  const [version, setVersion] = useState(0);
  const [sinEditor, setSinEditor] = useState(false);

  useEffect(() => {
    document.title = 'Vista previa · AvantCode Academy';
    const oir = (e) => {
      if (!permitido(e.origin) || e.data?.tipo !== 'avantcode:actividad' || !e.data.leccion) return;
      setLeccion(e.data.leccion);
      setVersion((v) => v + 1);
    };
    window.addEventListener('message', oir);
    // Avisa al editor que ya puede mandar la lección (el mensaje no lleva datos).
    if (window.opener) window.opener.postMessage({ tipo: 'avantcode:vista-previa-lista' }, '*');
    else setSinEditor(true);
    return () => window.removeEventListener('message', oir);
  }, []);

  const actividad = leccion?.actividad;
  const examen = actividad?.tipo === 'examen';
  const vacia = !actividad || !(examen ? actividad.preguntas : actividad.retos)?.length;
  const Icono = examen ? ClipboardCheck : Dumbbell;

  return (
    <div className="relative isolate min-h-screen bg-gray-100">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="ambiente">
          <span className="ambiente-luz ambiente-luz--lima" />
          <span className="ambiente-luz ambiente-luz--violeta" />
          <span className="ambiente-luz ambiente-luz--teal" />
        </div>
      </div>

      <header className="barra gap-3">
        <Marca />
        <span className="flex-1" />
        <span className="badge badge-dark">
          <Eye className="h-3.5 w-3.5" /> Vista previa
        </span>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        {!leccion ? (
          <div className="card mt-10 text-center">
            <span className="app-icono app-icono-claro mx-auto"><MonitorPlay /></span>
            <p className="mt-3 text-sm text-tinta-3">
              {sinEditor
                ? 'Abre la vista previa desde el editor del curso en el sistema AvantCode (botón «Vista previa» del examen o la práctica).'
                : 'Esperando la lección desde el editor del curso…'}
            </p>
          </div>
        ) : (
          <article style={{ animation: 'entrar .4s cubic-bezier(.22,.61,.36,1) backwards' }}>
            <p className="mb-4 rounded-2xl bg-negro px-4 py-2.5 text-sm text-white/80">
              Así lo verá el alumno. Se actualiza mientras editas; los resultados no se guardan.
            </p>
            <p className="flex items-center gap-1.5 text-sm text-tinta-3">
              <Icono className="h-4 w-4" /> {examen ? 'Examen' : 'Práctica'}
            </p>
            <h1 className="pagina-titulo text-[clamp(1.6rem,3vw,2.3rem)]">{leccion.titulo || 'Lección sin título'}</h1>

            <div className="mt-6 space-y-5">
              {leccion.contenido?.trim() && (
                <section className="card md:p-8">
                  <ContenidoTexto texto={leccion.contenido} />
                </section>
              )}
              {vacia ? (
                <p className="card text-center text-sm text-tinta-3">Agrega {examen ? 'preguntas' : 'retos'} en el editor para verlos aquí.</p>
              ) : examen ? (
                <ExamenPrevio key={version} actividad={actividad} />
              ) : (
                <Practica key={version} actividad={actividad} clave="vista-previa" vistaPrevia />
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default VistaPreviaActividad;
