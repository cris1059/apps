import { useEffect, useRef, useState } from 'react';
import { EVENTO_FIN, introActiva } from '../Intro/estadoIntro';

const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Aparece al entrar en pantalla (sube y se desvanece), como en el sitio. */
const Revelar = ({ as: Etiqueta = 'div', retraso = 0, className = '', children, ...resto }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(sinMovimiento);
  // Mientras la intro de marca está en pantalla, se espera: así la animación se ve.
  const [listo, setListo] = useState(() => !introActiva());

  useEffect(() => {
    if (listo) return undefined;
    const alTerminar = () => setListo(true);
    window.addEventListener(EVENTO_FIN, alTerminar);
    return () => window.removeEventListener(EVENTO_FIN, alTerminar);
  }, [listo]);

  useEffect(() => {
    if (!listo) return undefined;
    if (visible || !ref.current || typeof IntersectionObserver === 'undefined') {
      if (typeof IntersectionObserver === 'undefined') setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible, listo]);

  return (
    <Etiqueta
      ref={ref}
      className={`ac-revelar${visible ? ' ac-revelar--visible' : ''} ${className}`}
      style={{ '--retraso': `${retraso}ms` }}
      {...resto}
    >
      {children}
    </Etiqueta>
  );
};

export default Revelar;
