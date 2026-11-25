import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import Modal from "./Modal";
import Mapa from "./Mapa";
import { ESTADOS_MARCAJE, TIPOS, enlaceMapa, fechaCorta } from "../paginas/jornada/comun";

/*
  Dónde se hizo un marcaje, dentro del panel: el punto en el mapa y, si la
  persona marca en su sucursal, la geocerca alrededor. Abajo, la distancia,
  la precisión del teléfono y el enlace para abrirlo en Google Maps.
*/
function VerUbicacion({ marcaje: m, persona, onCerrar }) {
  const zonas = useMemo(
    () => [
      ...(m.geocerca ? [{ id: "geocerca", lat: m.geocerca.latitud, lng: m.geocerca.longitud, radio: m.geocerca.radio, nombre: m.geocerca.nombre, tipo: "sucursal" }] : []),
      // Aproximada: el círculo muestra todo lo que puede estar equivocada.
      ...(m.aproximada && m.precision ? [{ id: "precision", lat: m.latitud, lng: m.longitud, radio: Math.min(m.precision, 30000), tipo: "precision" }] : []),
    ],
    [m]
  );
  const puntos = useMemo(
    () => [
      {
        id: m.id || "punto",
        lat: m.latitud,
        lng: m.longitud,
        tono: m.estado === "validado" ? "ok" : m.estado === "fuera_de_zona" ? "aviso" : "neutro",
        titulo: `${persona || m.persona || ""} · ${TIPOS[m.tipo]?.texto || ""} ${m.hora_local || m.hora || ""}`.trim(),
        detalle: m.lugar || "",
      },
    ],
    [m, persona]
  );
  const estado = ESTADOS_MARCAJE[m.estado];
  return (
    <Modal onCerrar={onCerrar} titulo={`${TIPOS[m.tipo]?.texto || "Registro"} de ${persona || m.persona || ""}`} descripcion={`A las ${m.hora_local || m.hora}${m.fecha_local ? ` · ${fechaCorta(m.fecha_local)}` : ""}`} ancho="sm:max-w-2xl">
      <Mapa zonas={zonas} puntos={puntos} alto={340} etiqueta="Ubicación del registro" />
      {m.aproximada && (
        <p className="ctl-aviso ctl-aviso--suave mt-3 text-[13px]">
          Marcó desde una computadora: la ubicación es aproximada{m.precision ? ` (±${m.precision >= 1000 ? `${Math.round(m.precision / 1000)} km` : `${m.precision} m`})` : ""} y no se comparó con la geocerca. Desde el celular se guarda la exacta.
        </p>
      )}
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[13px] text-tinta-3">Lugar</dt>
          <dd className="text-tinta">{m.lugar || "—"}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-tinta-3">Estado</dt>
          <dd>
            <span className={`badge ${estado?.clase || "badge-neutral"}`}>{estado?.texto || m.estado}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-tinta-3">Distancia a su geocerca</dt>
          <dd className="text-tinta">{m.distancia != null ? `${m.distancia} m${m.geocerca ? ` (radio de ${m.geocerca.radio} m)` : ""}` : "Sin geocerca para comparar"}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-tinta-3">Coordenadas y precisión</dt>
          <dd className="tabular-nums text-tinta">
            {Number(m.latitud).toFixed(5)}, {Number(m.longitud).toFixed(5)}
            {m.precision ? ` · ±${m.precision} m` : ""}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <a className="btn-ghost btn-sm" href={enlaceMapa(m.latitud, m.longitud)} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" /> Abrir en Google Maps
        </a>
        <button type="button" className="btn-primary btn-sm" onClick={onCerrar}>
          Listo
        </button>
      </div>
    </Modal>
  );
}

export default VerUbicacion;
