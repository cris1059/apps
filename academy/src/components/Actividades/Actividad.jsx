import Examen from './Examen';
import Practica from './Practica';
import { alumnoService } from '../../services/alumno';

/* Examen o práctica de una lección (ver API.md).
   - onEnviado(respuesta del examen): trae progreso y certificado
   - onCompletar(): la práctica terminó; se marca la lección */
const Actividad = ({ leccion, slug, completada, onEnviado, onCompletar }) => {
  const actividad = leccion?.actividad;
  if (!actividad) return null;
  if (actividad.tipo === 'examen' && actividad.preguntas?.length) {
    return (
      <Examen
        key={leccion.id}
        examen={actividad}
        cargarEstado={() => alumnoService.examen(slug, leccion.id)}
        enviar={(respuestas) => alumnoService.enviarExamen(slug, leccion.id, respuestas)}
        onEnviado={onEnviado}
      />
    );
  }
  if (actividad.tipo === 'practica' && actividad.retos?.length) {
    return <Practica key={leccion.id} actividad={actividad} clave={`${slug}:${leccion.id}`} completada={completada} onCompletar={onCompletar} />;
  }
  return null;
};

export default Actividad;
