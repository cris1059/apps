import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../componentes/Modal";
import Mapa from "../../componentes/Mapa";
import { api } from "../../sesion";
import { MODALIDADES, enlaceMapa } from "./comun";

/*
  Jornada de una persona (desde Empleados): si registra jornada, dónde marca
  (su sucursal u oficina, home office o de viaje), su sucursal, su turno, su
  número de empleado, su departamento y su salario diario (para el costo de
  las horas extra). Lo cambian el dueño y los administradores.
*/
function JornadaPersona({ persona, onCerrar, onGuardada }) {
  const [opciones, setOpciones] = useState(null);
  const [datos, setDatos] = useState({
    registra_jornada: persona.registra_jornada !== false,
    modalidad: persona.modalidad || "sucursal",
    metodo_marcaje: persona.metodo_marcaje || "ambos",
    id_sucursal: persona.id_sucursal ? String(persona.id_sucursal) : "",
    id_turno: persona.turno?.id ? String(persona.turno.id) : "",
    numero_empleado: persona.numero_empleado || "",
    casa_latitud: persona.casa_latitud ?? "",
    casa_longitud: persona.casa_longitud ?? "",
    casa_radio_metros: persona.casa_radio_metros || 150,
    departamento: persona.departamento || "",
    salario_diario: persona.salario_diario != null ? String(Number(persona.salario_diario)) : "",
  });
  const lat = Number(datos.casa_latitud);
  const lng = Number(datos.casa_longitud);
  const conCasaValida = datos.casa_latitud !== "" && datos.casa_longitud !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  const zonasCasa = useMemo(
    () => (conCasaValida ? [{ id: "casa", lat, lng, radio: Number(datos.casa_radio_metros) || 150, tipo: "casa" }] : []),
    [conCasaValida, lat, lng, datos.casa_radio_metros]
  );
  const elegirCasa = useCallback((la, ln) => setDatos((d) => ({ ...d, casa_latitud: la.toFixed(7), casa_longitud: ln.toFixed(7) })), []);
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([api("/sucursales"), api("/turnos"), api("/dispositivos").catch(() => ({ dispositivos: [] }))])
      .then(([s, t, d]) =>
        setOpciones({ sucursales: s.sucursales.filter((x) => x.activa), turnos: t.turnos.filter((x) => x.activo), kioscos: d.dispositivos.filter((x) => x.estado === "activo") })
      )
      .catch((e) => setAviso(e.message));
  }, []);

  const cambiar = (c) => (e) => setDatos((d) => ({ ...d, [c]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    const conCasa = datos.casa_latitud !== "" && datos.casa_longitud !== "";
    if ((datos.casa_latitud === "") !== (datos.casa_longitud === "")) return setAviso("Escribe la latitud y la longitud de su casa, o deja las dos vacías.");
    const salario = datos.salario_diario.trim() === "" ? null : Number(datos.salario_diario.replace(/[$,s]/g, ""));
    if (salario !== null && (!Number.isFinite(salario) || salario < 0)) return setAviso("Escribe el salario diario con números, por ejemplo 450.");
    setGuardando(true);
    try {
      const r = await api(`/personas/${persona.id_usuario}/jornada`, {
        metodo: "PATCH",
        datos: {
          registra_jornada: datos.registra_jornada,
          modalidad: datos.modalidad,
          metodo_marcaje: datos.metodo_marcaje,
          id_sucursal: datos.id_sucursal ? Number(datos.id_sucursal) : null,
          id_turno: datos.id_turno ? Number(datos.id_turno) : null,
          numero_empleado: datos.numero_empleado.trim(),
          casa_latitud: conCasa ? Number(datos.casa_latitud) : null,
          casa_longitud: conCasa ? Number(datos.casa_longitud) : null,
          casa_radio_metros: Number(datos.casa_radio_metros),
          departamento: datos.departamento.trim(),
          salario_diario: salario,
        },
      });
      onGuardada(r.persona);
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo={`Jornada de ${persona.nombre.split(" ")[0]}`} descripcion="Dónde marca, su sucursal, su turno y su salario. Los cambios aplican desde hoy." ancho="sm:max-w-xl">
      {!opciones ? (
        <p className="text-sm text-tinta-3">{aviso || "Cargando…"}</p>
      ) : (
        <form onSubmit={guardar} className="space-y-4" noValidate>
          <label className="flex items-start gap-2.5 text-sm font-medium text-tinta">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-black" checked={datos.registra_jornada} onChange={cambiar("registra_jornada")} />
            <span>
              Registra su jornada
              <span className="block text-[13px] font-normal text-tinta-3">Si no, no ve el botón para marcar y no aparece en el equipo ni en los reportes.</span>
            </span>
          </label>

          {datos.registra_jornada && (
            <>
              <fieldset>
                <legend className="label">¿Cómo marca?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["app", "En la app", "Un clic desde su celular, con su ubicación"],
                    ["kiosco", "En el kiosco", opciones.kioscos.length ? "Con el QR o su PIN en la tableta de su sucursal" : "Primero activa un kiosco"],
                    ["ambos", "Las dos", "En la app o en el kiosco"],
                  ].map(([v, t, ayuda]) => {
                    const sinKiosco = v === "kiosco" && !opciones.kioscos.length;
                    return (
                      <button key={v} type="button" disabled={sinKiosco} aria-pressed={datos.metodo_marcaje === v} className={`rounded-xl px-3 py-2.5 text-left text-sm disabled:opacity-50 ${datos.metodo_marcaje === v ? "bg-negro text-white" : "bg-black/[.04] text-tinta"}`} onClick={() => setDatos((d) => ({ ...d, metodo_marcaje: v }))}>
                        <b className="block">{t}</b>
                        <span className={`text-[12.5px] ${datos.metodo_marcaje === v ? "text-white/70" : "text-tinta-3"}`}>{ayuda}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {datos.metodo_marcaje !== "kiosco" && (
              <fieldset>
                <legend className="label">¿Dónde marca en la app?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {Object.entries(MODALIDADES).map(([v, m]) => (
                    <button key={v} type="button" aria-pressed={datos.modalidad === v} className={`rounded-xl px-3 py-2.5 text-left text-sm ${datos.modalidad === v ? "bg-negro text-white" : "bg-black/[.04] text-tinta"}`} onClick={() => setDatos((d) => ({ ...d, modalidad: v }))}>
                      <b className="block">{m.corto}</b>
                      <span className={`text-[12.5px] ${datos.modalidad === v ? "text-white/70" : "text-tinta-3"}`}>
                        {v === "sucursal" ? "Dentro de la geocerca de su sucursal" : v === "home_office" ? "Desde su casa" : "Desde donde esté; se guarda la ubicación"}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="jp-suc">Sucursal u oficina</label>
                  <select id="jp-suc" className="input-field" value={datos.id_sucursal} onChange={cambiar("id_sucursal")}>
                    <option value="">Sin sucursal</option>
                    {opciones.sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                  {opciones.sucursales.length === 0 && (
                    <p className="campo-ayuda">
                      Aún no hay sucursales. <Link to="/panel/ubicacion" className="underline">Agrega una</Link>.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor="jp-turno">Turno</label>
                  <select id="jp-turno" className="input-field" value={datos.id_turno} onChange={cambiar("id_turno")}>
                    <option value="">Sin turno</option>
                    {opciones.turnos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre} · {t.hora_entrada} a {t.hora_salida}</option>
                    ))}
                  </select>
                  {opciones.turnos.length === 0 && (
                    <p className="campo-ayuda">
                      Aún no hay turnos. <Link to="/panel/turnos" className="underline">Crea uno</Link>.
                    </p>
                  )}
                </div>
              </div>

              {datos.modalidad === "home_office" && (
                <div className="superficie space-y-3 p-4">
                  <p className="text-sm font-semibold text-tinta">Su casa <span className="font-normal text-tinta-3">(opcional)</span></p>
                  <p className="text-[13px] text-tinta-3">Si eliges el punto (toca el mapa), sus marcajes se validan dentro del radio; si no, se guarda su ubicación sin validar.</p>
                  <Mapa zonas={zonasCasa} onElegir={elegirCasa} enfoque={persona.id_usuario} alto={220} etiqueta="Toca el mapa para elegir su casa" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className="input-field tabular-nums" inputMode="decimal" placeholder="Latitud" aria-label="Latitud de su casa" value={datos.casa_latitud} onChange={cambiar("casa_latitud")} />
                    <input className="input-field tabular-nums" inputMode="decimal" placeholder="Longitud" aria-label="Longitud de su casa" value={datos.casa_longitud} onChange={cambiar("casa_longitud")} />
                    <select className="input-field" aria-label="Radio" value={datos.casa_radio_metros} onChange={cambiar("casa_radio_metros")}>
                      {[100, 150, 300, 500].map((m) => (
                        <option key={m} value={m}>{m} m</option>
                      ))}
                    </select>
                  </div>
                  {datos.casa_latitud !== "" && datos.casa_longitud !== "" && (
                    <a className="text-[13px] font-medium text-tinta-3 hover:text-tinta" href={enlaceMapa(datos.casa_latitud, datos.casa_longitud)} target="_blank" rel="noopener noreferrer">
                      Revisar en el mapa
                    </a>
                  )}
                </div>
              )}

              <div>
                <label className="label" htmlFor="jp-num">Número de empleado <span className="font-normal text-tinta-3">(opcional, sale en el reporte)</span></label>
                <input id="jp-num" className="input-field" value={datos.numero_empleado} maxLength={20} onChange={cambiar("numero_empleado")} />
              </div>
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="jp-depto">Departamento <span className="font-normal text-tinta-3">(opcional)</span></label>
              <input id="jp-depto" className="input-field" value={datos.departamento} maxLength={80} onChange={cambiar("departamento")} placeholder="Ventas, Almacén…" />
            </div>
            <div>
              <label className="label" htmlFor="jp-salario">Salario diario <span className="font-normal text-tinta-3">(para el costo de horas extra)</span></label>
              <input id="jp-salario" className="input-field tabular-nums" inputMode="decimal" value={datos.salario_diario} onChange={cambiar("salario_diario")} placeholder="450" />
              <p className="campo-ayuda">Solo lo ven quienes administran y Recursos Humanos.</p>
            </div>
          </div>

          {aviso && <p className="ctl-aviso">{aviso}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default JornadaPersona;
