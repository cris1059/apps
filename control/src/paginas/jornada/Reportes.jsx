import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, FileText, Scale } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import { api } from "../../sesion";
import { descargar, duracion, fechaCorta, horasDecimal, hoyLocal, sumarDias } from "./comun";

/*
  Reportes: por persona, días trabajados, horas, retardos, horas extra
  (al doble y al triple por semana, con la tabla del decreto 2026–2030),
  domingos y alertas (sin salida, fuera de zona, más de 12 h). Se descarga
  en CSV para Excel o la nómina.
*/

const inicioDeMes = () => `${hoyLocal().slice(0, 8)}01`;

function Reportes() {
  const [rango, setRango] = useState({ desde: inicioDeMes(), hasta: hoyLocal() });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [bajando, setBajando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/jornada/reporte?desde=${rango.desde}&hasta=${rango.hasta}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const csv = async () => {
    setBajando(true);
    try {
      await descargar(`/jornada/reporte?desde=${rango.desde}&hasta=${rango.hasta}&formato=csv`, `asistencia-${rango.desde}-a-${rango.hasta}.csv`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBajando(false);
    }
  };

  const atajos = [
    ["Este mes", inicioDeMes(), hoyLocal()],
    ["Últimos 7 días", sumarDias(hoyLocal(), -6), hoyLocal()],
    ["Últimos 15 días", sumarDias(hoyLocal(), -14), hoyLocal()],
  ];

  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Nómina y ley"
        titulo="Reportes."
        apagado="Asistencia, horas y tiempo extra."
        acciones={
          <>
            <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
              <FileText className="h-4 w-4" /> Guardar en PDF
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={csv} disabled={bajando}>
              <Download className="h-4 w-4" /> {bajando ? "Preparando…" : "Excel (CSV)"}
            </button>
          </>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="rp-desde">Desde</label>
          <input id="rp-desde" type="date" className="input-field" value={rango.desde} max={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="rp-hasta">Hasta</label>
          <input id="rp-hasta" type="date" className="input-field" value={rango.hasta} max={hoyLocal()} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {atajos.map(([t, d, h]) => (
            <button key={t} type="button" className="btn-ghost btn-sm" onClick={() => setRango({ desde: d, hasta: h })}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        {!datos ? (
          <p className="text-sm text-tinta-3">Cargando…</p>
        ) : datos.personas.length === 0 ? (
          <div className="vacio">
            <p className="font-semibold text-tinta">Aún no hay personas</p>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th className="text-right">Días</th>
                  <th className="text-right">Horas</th>
                  <th className="text-right">Retardos</th>
                  <th className="text-right">Extra al doble</th>
                  <th className="text-right">Extra al triple</th>
                  <th className="text-right">Domingos</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                {datos.personas.map((p) => {
                  const t = p.totales;
                  const alertas = [
                    t.sin_salida && `${t.sin_salida} sin salida`,
                    t.fuera_de_zona && `${t.fuera_de_zona} fuera de zona`,
                    t.mas_de_12 && `${t.mas_de_12} de más de 12 h`,
                    t.extra.excedente && `${t.extra.excedente} h sobre el límite semanal`,
                    t.descansos_trabajados && `${t.descansos_trabajados} descanso${t.descansos_trabajados === 1 ? "" : "s"} trabajado${t.descansos_trabajados === 1 ? "" : "s"}`,
                  ].filter(Boolean);
                  return (
                    <Fragment key={p.id}>
                      <tr>
                        <td>
                          <button type="button" className="flex items-center gap-1.5 text-left font-medium text-tinta" onClick={() => setAbierto(abierto === p.id ? null : p.id)} aria-expanded={abierto === p.id}>
                            <ChevronDown className={`h-4 w-4 transition-transform ${abierto === p.id ? "rotate-180" : ""}`} />
                            {p.nombre}
                          </button>
                          <span className="ml-6 block text-[12.5px] text-tinta-3">{[p.puesto, p.sucursal].filter(Boolean).join(" · ") || "—"}</span>
                        </td>
                        <td className="text-right tabular-nums">{t.dias}</td>
                        <td className="text-right tabular-nums">{horasDecimal(t.minutos)} h</td>
                        <td className="text-right tabular-nums">{t.retardos ? `${t.retardos} (${duracion(t.minutos_retardo)})` : "—"}</td>
                        <td className="text-right tabular-nums">{t.extra.dobles ? `${t.extra.dobles} h` : "—"}</td>
                        <td className="text-right tabular-nums">{t.extra.triples ? `${t.extra.triples} h` : "—"}</td>
                        <td className="text-right tabular-nums">{t.domingos || "—"}</td>
                        <td>{alertas.length ? alertas.map((a) => <span key={a} className="badge badge-warning mb-1 mr-1">{a}</span>) : <span className="text-tinta-3">—</span>}</td>
                      </tr>
                      {abierto === p.id && (
                        <tr>
                          <td colSpan={8} className="!bg-black/[.02]">
                            {p.dias.length === 0 ? (
                              <p className="text-sm text-tinta-3">Sin jornadas en estas fechas.</p>
                            ) : (
                              <table className="w-full text-[13px]">
                                <thead>
                                  <tr className="text-left text-tinta-3">
                                    <th className="py-1 font-medium">Día</th>
                                    <th className="py-1 font-medium">Entrada</th>
                                    <th className="py-1 font-medium">Salida</th>
                                    <th className="py-1 text-right font-medium">Trabajado</th>
                                    <th className="py-1 text-right font-medium">Retardo</th>
                                    <th className="py-1 text-right font-medium">Extra</th>
                                    <th className="py-1 font-medium">Notas</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.dias.map((d) => (
                                    <tr key={d.fecha + d.entrada} className="border-t border-black/5">
                                      <td className="py-1.5 capitalize">{fechaCorta(d.fecha)}</td>
                                      <td className="py-1.5 tabular-nums">{d.entrada || "—"}</td>
                                      <td className="py-1.5 tabular-nums">{d.salida || "—"}</td>
                                      <td className="py-1.5 text-right tabular-nums">{duracion(d.minutos)}</td>
                                      <td className="py-1.5 text-right tabular-nums">{d.retardo ? duracion(d.retardo) : "—"}</td>
                                      <td className="py-1.5 text-right tabular-nums">{d.extra ? duracion(d.extra) : "—"}</td>
                                      <td className="py-1.5 text-tinta-3">
                                        {[d.domingo && "Domingo", d.descanso_trabajado && "Descanso trabajado", d.sin_salida && "Sin salida", d.fuera_de_zona && "Fuera de zona", d.mas_de_12 && "Más de 12 h", d.corregido && "Con corrección"]
                                          .filter(Boolean)
                                          .join(" · ")}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {datos && (
          <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-tinta-3">
            <Scale className="mt-0.5 h-4 w-4 shrink-0" />
            {datos.reglas.version} · {datos.reglas.fundamento}. El tiempo extra se cuenta sobre el horario de cada persona (sin horario, sobre 8 h) y
            se clasifica por semana: primero al doble y luego al triple. Es una guía para tu nómina; revísala con tu asesor laboral.
          </p>
        )}
      </section>
    </div>
  );
}

export default Reportes;
