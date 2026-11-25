import './compartido/arranque.js';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./estilos/sistema.css";
import "./estilos/control.css";

/*
  Se siente como app en el celular: sin zoom al pellizcar (Safari ignora
  «user-scalable=no», por eso se detienen sus gestos). El doble toque se
  quita con CSS (touch-action), que no frena los toques rápidos del kiosco.
  Dentro del mapa sí se puede acercar con dos dedos.
*/
const dentroDelMapa = (e) => e.target instanceof Element && e.target.closest(".mapa, .maplibregl-map, .leaflet-container");
for (const evento of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(evento, (e) => !dentroDelMapa(e) && e.preventDefault(), { passive: false });
}
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1 && !dentroDelMapa(e)) e.preventDefault();
  },
  { passive: false }
);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
