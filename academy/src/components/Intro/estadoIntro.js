/* Estado global de la intro de marca.

   Se marca en <html data-intro="…"> ANTES de que React pinte la app, para que
   las animaciones de entrada esperen a que la pantalla negra se desvanezca:
     activa   → la intro está en pantalla (la página espera detrás)
     fin      → la intro terminó: la página entra de forma dinámica
     (sin atributo) → estado normal */

export const EVENTO_FIN = 'academy:intro-fin';

const raiz = () => document.documentElement;

export const introActiva = () => typeof document !== 'undefined' && raiz().dataset.intro === 'activa';

export const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Se llama una vez en main.jsx, antes de montar React. */
export const prepararIntro = () => {
  raiz().dataset.intro = 'activa';
};

/* La intro avisa que terminó: la página entra y, poco después, se limpia el atributo. */
export const terminarIntro = () => {
  raiz().dataset.intro = 'fin';
  window.dispatchEvent(new Event(EVENTO_FIN));
  window.setTimeout(() => {
    if (raiz().dataset.intro === 'fin') delete raiz().dataset.intro;
  }, 2600);
};
