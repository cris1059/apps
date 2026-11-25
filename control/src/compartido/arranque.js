/*
  Arranque común de las apps de AvantCode (Academy y Control) en Capacitor.
  sincronizar.mjs lo copia a <app>/src/compartido/ y lo importa primero en main.jsx.
  No editar la copia de cada app: se cambia aquí (compartido/src) y se vuelve a sincronizar.

  - En la app la página vive en https://localhost (Android) o capacitor://localhost (iOS):
    las llamadas relativas a /api se mandan al servidor (VITE_ORIGEN_API).
  - Botón «atrás» de Android: regresa en la app y, en la primera pantalla, la minimiza.
  - Enlaces a otros sitios: se abren en el navegador del teléfono, no dentro de la app.
  - Enlaces de la propia web (p. ej. https://academy.avantcode.mx/cursos/x): se abren dentro de la app.
*/
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const limpiar = (u) => String(u || '').replace(/\/+$/, '');
export const ORIGEN_API = limpiar(import.meta.env.VITE_ORIGEN_API);
export const ORIGEN_WEB = limpiar(import.meta.env.VITE_ORIGEN_WEB);
export const esApp = Capacitor.isNativePlatform();

/* fetch('/api/…') relativo → https://<servidor>/api/… */
if (ORIGEN_API && typeof window !== 'undefined' && window.fetch) {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (entrada, opciones) => {
    if (typeof entrada === 'string' && entrada.startsWith('/api')) return fetchOriginal(ORIGEN_API + entrada, opciones);
    if (entrada instanceof URL && entrada.origin === window.location.origin && entrada.pathname.startsWith('/api')) {
      return fetchOriginal(ORIGEN_API + entrada.pathname + entrada.search, opciones);
    }
    if (typeof Request !== 'undefined' && entrada instanceof Request) {
      const u = new URL(entrada.url);
      if (u.origin === window.location.origin && u.pathname.startsWith('/api')) return fetchOriginal(new Request(ORIGEN_API + u.pathname + u.search, entrada), opciones);
    }
    return fetchOriginal(entrada, opciones);
  };
}

/* Ruta interna de un enlace de la propia web (o null si es de otro sitio). */
const rutaInterna = (href) => {
  try {
    const u = new URL(href, window.location.href);
    if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
    if (ORIGEN_WEB && u.origin === ORIGEN_WEB) return u.pathname + u.search + u.hash;
  } catch {
    /* enlace inválido: lo resuelve el navegador */
  }
  return null;
};

const irA = (ruta) => {
  if (!ruta || ruta === window.location.pathname + window.location.search + window.location.hash) return;
  window.history.pushState({}, '', ruta);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

if (esApp) {
  document.documentElement.classList.add('es-app', `es-app-${Capacitor.getPlatform()}`);

  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  if (Capacitor.getPlatform() === 'android') StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  window.addEventListener('load', () => setTimeout(() => SplashScreen.hide().catch(() => {}), 150));

  // Atrás (Android): historial de la app; en la primera pantalla, minimizar.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.minimizeApp().catch(() => {});
  });

  // Enlace profundo (https://<web>/ruta): abre esa ruta dentro de la app.
  App.addListener('appUrlOpen', ({ url }) => irA(rutaInterna(url)));

  // Enlaces externos al navegador del teléfono; los de la propia web, dentro de la app.
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target?.closest?.('a[href]');
      if (!a || e.defaultPrevented) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(mailto|tel|sms|whatsapp|geo):/i.test(href)) return;
      const interna = rutaInterna(href);
      if (interna !== null) {
        // Absoluta a la propia web (no relativa): se navega dentro de la app.
        if (/^https?:\/\//i.test(href)) {
          e.preventDefault();
          irA(interna);
        }
        return;
      }
      if (/^https?:\/\//i.test(href)) {
        e.preventDefault();
        Browser.open({ url: href }).catch(() => window.open(href, '_blank'));
      }
    },
    true
  );
}
