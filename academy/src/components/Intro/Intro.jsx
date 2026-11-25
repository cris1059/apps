import { useEffect, useRef, useState } from 'react';
import logo from '../../img/LogoI.webp';
import { introActiva, sinMovimiento, terminarIntro } from './estadoIntro';
import './intro.css';

/* Intro de AvantCode Academy: pantalla negra, el logo al centro, debajo el
   nombre de la empresa y la etiqueta verde "Academy"; después el negro se
   desvanece mientras la página entra de forma dinámica (fundido cruzado).
   Un clic, toque o tecla la adelanta. */
const DURACION_VISIBLE = 2100; // ms en pantalla antes de desvanecerse
const DURACION_SALIDA = 850; // debe coincidir con la transición de .intro

const Intro = () => {
  const [fase, setFase] = useState(() => (introActiva() ? 'entrando' : 'oculta'));
  const saliendo = useRef(false);
  const overflowPrevio = useRef('');

  const liberarScroll = () => {
    document.documentElement.style.overflow = overflowPrevio.current;
  };

  const salir = () => {
    if (saliendo.current) return;
    saliendo.current = true;
    // La página empieza a entrar al mismo tiempo que el negro se desvanece.
    liberarScroll();
    terminarIntro();
    setFase('saliendo');
    window.setTimeout(() => setFase('oculta'), sinMovimiento() ? 250 : DURACION_SALIDA);
  };

  useEffect(() => {
    if (fase === 'oculta') return undefined;
    const html = document.documentElement;
    overflowPrevio.current = html.style.overflow;
    html.style.overflow = 'hidden';

    const t = window.setTimeout(salir, sinMovimiento() ? 900 : DURACION_VISIBLE);
    const alPresionar = () => salir();
    window.addEventListener('keydown', alPresionar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', alPresionar);
      if (!saliendo.current) liberarScroll();
    };
    // Solo al montar: la secuencia corre una vez por carga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fase === 'oculta') return null;

  return (
    <div className={`intro${fase === 'saliendo' ? ' intro--saliendo' : ''}`} onClick={salir} aria-hidden="true">
      <div className="intro-contenido">
        <div className="intro-halo" />
        <img className="intro-logo" src={logo} alt="" width="104" height="104" />
        <p className="intro-nombre">
          <b>ΛVΛNT</b>CODE
        </p>
        <span className="intro-etiqueta">Academy</span>
      </div>
    </div>
  );
};

export default Intro;
