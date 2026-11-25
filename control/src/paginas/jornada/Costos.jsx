import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText, Lock } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Cifra from "../../componentes/Cifra";
import { administra, api, useSesion } from "../../sesion";
import { descargar, hoyLocal, sumarDias } from "./comun";

/*
  Horas extra y costos (igual que en la demo): horas al doble y al triple
  por semana (LFT y decreto DOF del 1 de mayo de 2026), prima dominical
  (25 %, art. 71) y descansos trabajados al doble (arts. 73 y 75), con su
  importe según el salario diario de cada persona (se captura en
  Empleados). Desde el Empresarial, el desglose por sucursal y por
  departamento y la exportación para nómina.
*/

const pesos = (n) => (n == null ? "—" : `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const horas = (h) => `${(Math.round(h * 100) / 100).toLocaleString("es-MX")} h`;
const lunesDe = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`).getDay();
  return sumarDias(fecha, d === 0 ? -6 : 1 - d);
};

function Calculadora({ reglas }) {
  const [salario, setSalario] = useState("");
  const [extra, setExtra] = useState("");
  const s = Number(salario) || 0;
  const h = Math.max(0, Number(extra) || 0);
  const dobles = Math.min(h, reglas.tabla.dobles);
  const triples = Math.min(Math.max(0, h - reglas.tabla.dobles), reglas.tabla.triples);
  const excedente = Math.max(0, h - reglas.tabla.dobles - reglas.tabla.triples);
  const hora = s / reglas.horas_jornada;
  const importe = dobles * hora * 2 + (triples + excedente) * hora * 3;
  return (
    <section className="card">
      <h2 className="card-titulo">Calculadora de horas extra</h2>
      <p className="mt-1 text-sm text-tinta-3">
        En {reglas.tabla.anio}: las primeras {reglas.tabla.dobles} h extra de la semana se pagan al doble y hasta {reglas.tabla.triples} h más al triple.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="ca-salario">Salario diario</label>
          <input id="ca-salario" className="input-field tabular-nums" inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="450" />
        </div>
        <div>
          <label className="label" htmlFor="ca-horas">Horas extra en la semana</label>
          <input id="ca-horas" className="input-field tabular-nums" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="10" />
        </div>
        <div className="superficie p-3">
          <p className="text-[13px] text-tinta-3">Importe</p>
          <p className="text-xl font-semibold tabular-nums text-tinta">{pesos(importe)}</p>
          <p className="text-[12.5px] text-tinta-3">
            {horas(dobles)} al doble · {horas(triples)} al triple{excedente ? ` · ${horas(excedente)} pasan del límite legal` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function Desglose({ titulo, filas }) {
  return (
    <section className="card">
      <h2 className="card-titulo">{titulo}</h2>
      <div className="tabla-contenedor mt-3">
        <table className="tabla">
          <thead>
            <tr>
              <th>{titulo.includes("sucursal") ? "Sucursal" : "Departamento"}</th>
              <th className="text-right">Personas</th>
              <th className="text-right">Horas extra</th>
              <th className="text-right">Domingos y descansos</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.nombre}>
                <td className="font-medium text-tinta">{f.nombre}</td>
                <td className="text-right tabular-nums">{f.personas}</td>
                <td className="text-right tabular-nums">{pesos(f.extra_doble + f.extra_triple)}</td>
                <td className="text-right tabular-nums">{pesos(f.prima_dominical + f.obligatorios + f.descansos)}</td>
                <td className="text-right font-semibold tabular-nums">{pesos(f.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Costos() {
  const sesion = useSesion();
  const hoy = hoyLocal();
  const [periodo, setPeriodo] = useState({ desde: lunesDe(hoy), hasta: hoy });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [bajando, setBajando] = useState(false);
  const esencial = sesion.empresa.plan === "esencial";

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(`/jornada/costos?desde=${periodo.desde}&hasta=${periodo.hasta}`));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [periodo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const atajos = useMemo(() => {
    const lunes = lunesDe(hoy);
    return [
      ["Esta semana", { desde: lunes, hasta: hoy }],
      ["Semana pasada", { desde: sumarDias(lunes, -7), hasta: sumarDias(lunes, -1) }],
      ["Últimas 2 semanas", { desde: sumarDias(lunes, -7), hasta: hoy }],
      ["Este mes", { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy }],
    ];
  }, [hoy]);

  const exportar = async () => {
    setBajando(true);
    try {
      await descargar(`/jornada/costos?desde=${periodo.desde}&hasta=${periodo.hasta}&formato=csv`, `nomina-${periodo.desde}-a-${periodo.hasta}.csv`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBajando(false);
    }
  };

  const t = datos?.totales;
  const sumaHoras = (k) => (datos ? datos.personas.reduce((s, p) => s + p.horas[k], 0) : 0);
  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Nómina y ley"
        titulo="Horas extra y costos."
        apagado="Con la ley 2026–2030."
        sub="Cada hora se cuenta una sola vez: primero al doble y luego al triple, por semana de lunes a domingo. Solo cuentan las horas extra aprobadas en Solicitudes."
        acciones={
          <>
          <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
            <FileText className="h-4 w-4" /> Guardar en PDF
          </button>
          {esencial ? (
            <span className="badge badge-neutral" title="Exportación para nómina: desde el plan Empresarial">
              <Lock className="mr-1 h-3.5 w-3.5" /> Exportar para nómina: Empresarial
            </span>
          ) : (
            <button type="button" className="btn-secondary btn-sm" onClick={exportar} disabled={bajando || !datos}>
              <Download className="h-4 w-4" /> {bajando ? "Preparando…" : "Exportar para nómina"}
            </button>
          )}
          </>
        }
      />
      {error && <p className="ctl-aviso">{error}</p>}

      <section className="card flex flex-wrap items-end gap-3">
        <div className="segmentado max-w-full overflow-x-auto" role="group" aria-label="Periodo">
          {atajos.map(([texto, p]) => (
            <button key={texto} type="button" aria-pressed={periodo.desde === p.desde && periodo.hasta === p.hasta} onClick={() => setPeriodo(p)}>
              {texto}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-tinta-3">
          <input type="date" className="input-field !w-auto" value={periodo.desde} max={periodo.hasta} onChange={(e) => e.target.value && setPeriodo((p) => ({ ...p, desde: e.target.value }))} aria-label="Desde" />
          a
          <input type="date" className="input-field !w-auto" value={periodo.hasta} min={periodo.desde} max={hoy} onChange={(e) => e.target.value && setPeriodo((p) => ({ ...p, hasta: e.target.value }))} aria-label="Hasta" />
        </div>
      </section>

      {t && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cifra
            titulo="Costo adicional del periodo"
            valor={pesos(t.total)}
            detalle={[t.por_aprobar.dias ? `${horas(t.por_aprobar.horas)} extra por aprobar` : null, t.sin_salario ? `${t.sin_salario} sin salario capturado` : null].filter(Boolean).join(" · ") || "Horas extra, domingos y descansos"}
            tono={t.sin_salario || t.por_aprobar.dias ? "aviso" : undefined}
          />
          <Cifra titulo="Horas extra al doble" valor={horas(sumaHoras("dobles"))} detalle={pesos(t.extra_doble)} />
          <Cifra titulo="Horas extra al triple" valor={horas(sumaHoras("triples") + sumaHoras("excedente"))} detalle={sumaHoras("excedente") ? `${horas(sumaHoras("excedente"))} pasan del límite legal` : pesos(t.extra_triple)} tono={sumaHoras("excedente") ? "aviso" : undefined} />
          <Cifra titulo="Domingos y descansos trabajados" valor={pesos(t.prima_dominical + t.obligatorios + t.descansos)} detalle="Prima dominical y pago doble" />
        </div>
      )}

      {datos && <Calculadora reglas={datos.reglas} />}

      <section className="card">
        <h2 className="card-titulo">Horas extra por persona</h2>
        {!datos ? (
          <p className="mt-3 text-sm text-tinta-3">Cargando…</p>
        ) : datos.personas.length === 0 ? (
          <p className="mt-3 text-sm text-tinta-3">Todavía no hay personas que registren jornada.</p>
        ) : (
          <div className="tabla-contenedor mt-3">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th className="text-right">Al doble</th>
                  <th className="text-right">Al triple</th>
                  <th className="text-right">Domingos</th>
                  <th className="text-right">Descansos trabajados</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {datos.personas.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="block font-medium text-tinta">{p.nombre}</span>
                      <span className="text-[12.5px] text-tinta-3">
                        {p.salario_diario != null ? `Salario diario ${pesos(p.salario_diario)}` : "Sin salario capturado"}
                        {p.sucursal ? ` · ${p.sucursal}` : ""}
                      </span>
                      {p.por_aprobar.dias > 0 && (
                        <Link to="/panel/solicitudes" className="badge badge-warning mt-1">
                          {horas(p.por_aprobar.horas)} por aprobar
                        </Link>
                      )}
                    </td>
                    <td className="text-right tabular-nums">{horas(p.horas.dobles)}</td>
                    <td className="text-right tabular-nums">
                      {horas(p.horas.triples + p.horas.excedente)}
                      {p.horas.excedente > 0 && <span className="badge badge-warning ml-1">Pasa del límite</span>}
                    </td>
                    <td className="text-right tabular-nums">{p.domingos}</td>
                    <td className="text-right tabular-nums">{p.obligatorios + p.descansos}</td>
                    <td className="text-right font-semibold tabular-nums">{p.costo ? pesos(p.costo.total) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {t?.sin_salario > 0 && (
          <p className="mt-3 text-[13px] text-tinta-3">
            Para ver el importe de todos, captura el salario diario de cada persona en{" "}
            {administra(sesion) ? <Link to="/panel/empleados" className="underline underline-offset-2">Empleados</Link> : "Empleados"} (solo lo ven quienes administran y RH).
          </p>
        )}
      </section>

      {datos?.desglose ? (
        <>
          <Desglose titulo="Costos por sucursal" filas={datos.desglose.sucursales} />
          <Desglose titulo="Costos por departamento" filas={datos.desglose.departamentos} />
        </>
      ) : (
        datos && (
          <section className="card flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-tinta">Costos por sucursal y por departamento</p>
              <p className="text-sm text-tinta-3">Desde el plan Empresarial, junto con la exportación para nómina.</p>
            </div>
            <span className="badge badge-neutral">No incluido</span>
          </section>
        )
      )}

      {datos && (
        <p className="text-[12.5px] text-tinta-3">
          {datos.reglas.version} · {datos.reglas.fundamento}. Salario por hora = salario diario ÷ {datos.reglas.horas_jornada}. Prima dominical del 25 % (art. 71); descanso semanal u obligatorio trabajado, salario doble adicional (arts. 73 y 75).
        </p>
      )}
    </div>
  );
}

export default Costos;
