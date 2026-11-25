import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import { api, useSesion } from "../../sesion";
import { TIPOS, duracion, fechaCorta } from "./comun";

/*
  Solicitudes (igual que en la demo):
  - Correcciones: lo que pide el equipo cuando olvidó marcar o marcó mal.
    Al aprobar se crea el registro con la hora correcta y el original queda
    como «corregido» (nunca se borra).
  - Horas extra: cada día con tiempo extra (HE-…) se aprueba o se rechaza;
    hasta aprobarse no entra al costo.
  Todo queda en la bitácora.
*/

function HorasExtra({ estado, sesion }) {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [comentarios, setComentarios] = useState({});
  const [resolviendo, setResolviendo] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLista((await api(`/jornada/horas-extra?estado=${estado}`)).solicitudes);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [estado]);

  useEffect(() => {
    setLista(null);
    cargar();
  }, [cargar]);

  const resolver = async (h, decision) => {
    setResolviendo(h.folio);
    try {
      await api("/jornada/horas-extra/resolver", { metodo: "POST", datos: { id_usuario: h.id_usuario, fecha: h.fecha, decision, comentario: comentarios[h.folio] || "" } });
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setResolviendo(null);
    }
  };

  if (error) return <p className="ctl-aviso">{error}</p>;
  if (!lista) return <p className="text-sm text-tinta-3">Cargando…</p>;
  if (!lista.length)
    return (
      <div className="card vacio">
        <p className="font-semibold text-tinta">{estado === "pendiente" ? "No hay horas extra por autorizar" : "Nada por aquí"}</p>
        <p className="max-w-md text-sm">Cuando alguien trabaja más que su turno, el día aparece aquí para aprobarlo o rechazarlo.</p>
      </div>
    );
  return (
    <ul className="space-y-3">
      {lista.map((h) => (
        <li key={h.folio} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-neutral tabular-nums">{h.folio}</span>
            <span className="font-semibold text-tinta">{h.persona}</span>
            <span className="text-sm text-tinta-3">
              <b className="text-tinta">{duracion(h.minutos)}</b> de tiempo extra el <span className="capitalize">{fechaCorta(h.fecha)}</span> · de {h.entrada} a {h.salida}
              {h.sucursal ? ` · ${h.sucursal}` : ""}
            </span>
            {h.obligatorio && <span className="badge badge-warning">Descanso obligatorio</span>}
            {h.domingo && <span className="badge badge-info">Domingo</span>}
          </div>
          {estado === "pendiente" ? (
            h.id_usuario === sesion.usuario.id && sesion.usuario.rol !== "dueno" ? (
              <p className="text-[13px] text-tinta-3">Son tuyas: las autoriza otra persona que administre.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input-field min-w-0 flex-1"
                  placeholder="Comentario (opcional)"
                  maxLength={255}
                  value={comentarios[h.folio] || ""}
                  onChange={(e) => setComentarios((m) => ({ ...m, [h.folio]: e.target.value }))}
                />
                <button type="button" className="btn-secondary btn-sm" disabled={resolviendo === h.folio} onClick={() => resolver(h, "rechazar")}>
                  <X className="h-4 w-4" /> Rechazar
                </button>
                <button type="button" className="btn-primary btn-sm" disabled={resolviendo === h.folio} onClick={() => resolver(h, "aprobar")}>
                  <Check className="h-4 w-4" /> Aprobar
                </button>
              </div>
            )
          ) : (
            <p className="text-[13px] text-tinta-3">
              {estado === "aprobada" ? "Aprobadas" : "Rechazadas"}
              {h.resolvio ? ` por ${h.resolvio}` : ""}
              {h.comentario ? ` · «${h.comentario}»` : ""}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Correcciones() {
  const sesion = useSesion();
  const [tipo, setTipo] = useState("correcciones");
  const [estado, setEstado] = useState("pendiente");
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [comentarios, setComentarios] = useState({});
  const [resolviendo, setResolviendo] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLista((await api(`/jornada/correcciones?estado=${estado}`)).correcciones);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (c, decision) => {
    setResolviendo(c.id);
    try {
      await api(`/jornada/correcciones/${c.id}/resolver`, { metodo: "POST", datos: { decision, comentario: comentarios[c.id] || "" } });
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setResolviendo(null);
    }
  };

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Operación"
        titulo="Solicitudes."
        apagado="Correcciones y horas extra."
        sub={
          tipo === "correcciones"
            ? "Al aprobar una corrección, el marcaje original se conserva y el ajuste queda como registro nuevo en la bitácora."
            : "Cada día con tiempo extra se aprueba o se rechaza. Hasta aprobarse, no entra al costo de Horas extra y costos."
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}
      <div className="flex flex-wrap gap-2">
      <div className="segmentado" role="group" aria-label="Tipo de solicitud">
        {[
          ["correcciones", "Correcciones"],
          ["extra", "Horas extra"],
        ].map(([v, t]) => (
          <button key={v} type="button" aria-pressed={tipo === v} onClick={() => setTipo(v)}>
            {t}
          </button>
        ))}
      </div>
      <div className="segmentado" role="group" aria-label="Estado">
        {[
          ["pendiente", "Por revisar"],
          ["aprobada", "Aprobadas"],
          ["rechazada", "Rechazadas"],
        ].map(([v, t]) => (
          <button key={v} type="button" aria-pressed={estado === v} onClick={() => setEstado(v)}>
            {t}
          </button>
        ))}
      </div>
      </div>

      {tipo === "extra" ? (
        <HorasExtra estado={estado} sesion={sesion} />
      ) : !lista ? (
        <p className="text-sm text-tinta-3">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="card vacio">
          <p className="font-semibold text-tinta">{estado === "pendiente" ? "No hay correcciones por revisar" : "Nada por aquí"}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => (
            <li key={c.id} className="card space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-tinta">{c.persona?.nombre}</span>
                <span className="text-sm text-tinta-3">
                  pide registrar <b className="text-tinta">{TIPOS[c.tipo].texto.toLowerCase()}</b> el <span className="capitalize">{fechaCorta(c.fecha_local)}</span> a las{" "}
                  <b className="tabular-nums text-tinta">{c.hora_local}</b>
                </span>
              </div>
              {c.original && (
                <p className="text-[13px] text-tinta-3">
                  Reemplaza su registro de las {c.original.hora_local} ({TIPOS[c.original.tipo].texto.toLowerCase()}).
                </p>
              )}
              <p className="rounded-xl bg-black/[.04] px-3 py-2 text-sm text-tinta-2">«{c.motivo}»</p>
              {estado === "pendiente" ? (
                c.persona?.id === sesion.usuario.id && sesion.usuario.rol !== "dueno" ? (
                  <p className="text-[13px] text-tinta-3">Es tuya: la resuelve otra persona que administre.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="input-field min-w-0 flex-1"
                      placeholder="Comentario (opcional)"
                      maxLength={255}
                      value={comentarios[c.id] || ""}
                      onChange={(e) => setComentarios((m) => ({ ...m, [c.id]: e.target.value }))}
                    />
                    <button type="button" className="btn-secondary btn-sm" disabled={resolviendo === c.id} onClick={() => resolver(c, "rechazar")}>
                      <X className="h-4 w-4" /> Rechazar
                    </button>
                    <button type="button" className="btn-primary btn-sm" disabled={resolviendo === c.id} onClick={() => resolver(c, "aprobar")}>
                      <Check className="h-4 w-4" /> Aprobar
                    </button>
                  </div>
                )
              ) : (
                c.comentario && <p className="text-[13px] text-tinta-3">Comentario: {c.comentario}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Correcciones;
