import { useEffect, useState } from "react";
import { ArrowUpRight, Banknote, Boxes, Check, Copy, CreditCard, Landmark, Layers, MapPin, Plus, Send, Store } from "lucide-react";
import Encabezado from "../../componentes/Encabezado";
import Modal from "../../componentes/Modal";
import { api, esDueno, useSesion } from "../../sesion";

/*
  Mi empresa › Suscripción: el plan que contrató, tal como lo configuró, lo
  que usa, sus pagos y las solicitudes para mejorarlo (llegan a AvantCode).
*/

const pesos = (n) => Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });
const fecha = (f) => (f ? new Date(f).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "");
const FORMAS = { tarjeta: "Tarjeta", efectivo: "Depósito en efectivo", transferencia: "Transferencia" };

/* Un dato de la transferencia con su botón para copiarlo. */
function DatoCopiable({ etiqueta, valor, destacado = false }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin portapapeles: el dato queda a la vista para copiarlo a mano */
    }
  };
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${destacado ? "bg-lima/25 ring-1 ring-black/10" : "bg-black/[.035]"}`}>
      <div className="min-w-0">
        <p className="text-xs text-tinta-3">{etiqueta}</p>
        <p className={`break-all font-semibold text-tinta ${destacado ? "text-lg" : "tabular-nums"}`}>{valor}</p>
      </div>
      <button type="button" className="btn-ghost btn-sm shrink-0" onClick={copiar} aria-label={`Copiar ${etiqueta.toLowerCase()}`}>
        {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/* Cómo pagar la mensualidad: transferencia con el folio en el concepto; tarjeta con
   cobro automático y efectivo en OXXO y tiendas, cuando AvantCode los active. */
function ComoPagar({ cobro, mensualidad, dueno }) {
  const t = cobro?.transferencia;
  const [pagando, setPagando] = useState(null);
  const [error, setError] = useState("");
  const pagar = async (metodo) => {
    setPagando(metodo);
    setError("");
    try {
      const r = await api("/empresa/pagar", { metodo: "POST", datos: { metodo } });
      window.location.assign(r.url);
    } catch (e) {
      setError(e.message);
      setPagando(null);
    }
  };
  return (
    <section className="card space-y-4">
      <div>
        <h2 className="card-titulo">
          <Banknote className="h-5 w-5 text-tinta-3" /> Cómo pagar tu mensualidad
        </h2>
        {mensualidad != null && <p className="mt-1 text-sm text-tinta-3">Tu mensualidad es de {pesos(mensualidad)}.</p>}
      </div>
      {!cobro ? (
        <p className="text-sm text-tinta-3">No pudimos consultar los datos de pago en este momento. Intenta más tarde o escríbenos.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
              <Landmark className="h-4 w-4 text-tinta-3" /> Transferencia (SPEI)
            </p>
            {t ? (
              <>
                {t.banco && <DatoCopiable etiqueta="Banco" valor={t.banco} />}
                {t.beneficiario && <DatoCopiable etiqueta="A nombre de" valor={t.beneficiario} />}
                <DatoCopiable etiqueta="CLABE" valor={t.clabe} />
                {t.concepto && <DatoCopiable etiqueta="Concepto o referencia (obligatorio)" valor={t.concepto} destacado />}
                <p className="text-[13px] leading-relaxed text-tinta-2">
                  Escribe el folio <strong>{t.concepto || "de tu solicitud"}</strong> en el concepto o la referencia: así identificamos tu pago.
                  {cobro.comprobantes?.correo ? ` Envía el comprobante a ${cobro.comprobantes.correo}.` : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-tinta-3">Te enviamos los datos para transferir por correo o WhatsApp.</p>
            )}
            {cobro.instrucciones && <p className="text-[13px] text-tinta-3">{cobro.instrucciones}</p>}
          </div>
          <div className="space-y-2">
            <div className="rounded-xl bg-black/[.035] px-3 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-tinta">
                <CreditCard className="h-4 w-4 text-tinta-3" /> Tarjeta con cobro automático
                {!cobro.tarjeta && <span className="badge badge-neutral">Muy pronto</span>}
              </p>
              <p className="mt-1 text-[13px] text-tinta-3">Registras tu tarjeta una vez y se cobra sola cada mes. Pago seguro con Stripe.</p>
              {cobro.tarjeta && dueno && (
                <button type="button" className="btn-primary btn-sm mt-2" onClick={() => pagar("tarjeta")} disabled={!!pagando}>
                  <CreditCard className="h-4 w-4" /> {pagando === "tarjeta" ? "Abriendo…" : "Activar cobro automático"}
                </button>
              )}
            </div>
            <div className="rounded-xl bg-black/[.035] px-3 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-tinta">
                <Store className="h-4 w-4 text-tinta-3" /> Efectivo en OXXO y tiendas
                {!cobro.efectivo && <span className="badge badge-neutral">Muy pronto</span>}
              </p>
              <p className="mt-1 text-[13px] text-tinta-3">Una ficha por mes; la pagas en cualquier OXXO antes de que venza (3 días).</p>
              {cobro.efectivo && dueno && (
                <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => pagar("oxxo")} disabled={!!pagando}>
                  <Store className="h-4 w-4" /> {pagando === "oxxo" ? "Abriendo…" : "Generar ficha de este mes"}
                </button>
              )}
            </div>
            {error && <p className="ctl-aviso">{error}</p>}
            {(cobro.tarjeta || cobro.efectivo) && !dueno && <p className="text-[12.5px] text-tinta-3">Solo el dueño de la empresa paga en línea.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function Medidor({ titulo, usadas, limite }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-tinta-3">{titulo}</span>
        <span className="font-semibold text-tinta tabular-nums">
          {usadas} de {limite}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[.06]">
        <div className="h-full rounded-full bg-negro" style={{ width: `${Math.min(100, (usadas / Math.max(1, limite)) * 100)}%` }} />
      </div>
    </div>
  );
}

function Solicitar({ datos, tipoInicial, onCerrar, onEnviada }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [plan, setPlan] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const contratados = datos.modulos.map((m) => m.id);
  const disponibles = datos.catalogo.filter((m) => !contratados.includes(m.id));
  const planesMejores = datos.planes.filter((p) => p.personas > (datos.planes.find((x) => x.id === datos.plan.id)?.personas || 0));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAviso("");
    try {
      onEnviada(await api("/empresa/solicitudes", { metodo: "POST", datos: { tipo, plan, modulos, mensaje } }));
    } catch (error) {
      setAviso(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo="Solicitar un cambio" descripcion="Llega a AvantCode: te contactamos para confirmarlo y cotizarlo antes de aplicarlo.">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <div className="segmentado max-w-full overflow-x-auto" role="group" aria-label="¿Qué necesitas?">
          {[
            ["plan", "Mejorar plan"],
            ["modulos", "Agregar módulos"],
            ["lugares", "Más lugares"],
          ].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={tipo === v} onClick={() => (setTipo(v), setAviso(""))}>
              {t}
            </button>
          ))}
        </div>

        {tipo === "plan" &&
          (planesMejores.length ? (
            <div className="grid gap-2">
              {planesMejores.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  aria-pressed={plan === p.id}
                  className={`flex items-center justify-between rounded-2xl p-4 text-left ring-1 transition ${plan === p.id ? "bg-negro text-white ring-negro" : "bg-white/70 ring-black/10 hover:ring-black/25"}`}
                >
                  <span>
                    <span className="block font-semibold">Plan {p.nombre}</span>
                    <span className={`block text-sm ${plan === p.id ? "text-white/70" : "text-tinta-3"}`}>
                      Tú + {p.personas} personas · hasta {p.sucursales} {p.sucursales === 1 ? "sucursal" : "sucursales"}
                    </span>
                  </span>
                  {plan === p.id && <Check className="h-5 w-5 text-lima" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-tinta-3">Ya tienes el plan más completo. Si necesitas más, cuéntanos abajo.</p>
          ))}

        {tipo === "modulos" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {disponibles.map((m) => {
              const elegido = modulos.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => setModulos((x) => (elegido ? x.filter((y) => y !== m.id) : [...x, m.id]))}
                  className={`flex items-center gap-2 rounded-2xl p-3 text-left text-sm ring-1 transition ${elegido ? "bg-negro text-white ring-negro" : "bg-white/70 ring-black/10 hover:ring-black/25"}`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${elegido ? "bg-lima text-negro" : "ring-1 ring-black/20"}`}>
                    {elegido && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {m.titulo}
                </button>
              );
            })}
          </div>
        )}

        <div>
          <label htmlFor="sol-mensaje" className="label">
            {tipo === "lugares" ? "¿Cuántas personas o sucursales más necesitas?" : "Algo más que debamos saber"}{" "}
            <span className="font-normal text-tinta-3">{tipo === "lugares" ? "" : "(opcional)"}</span>
          </label>
          <textarea id="sol-mensaje" className="input-field min-h-[96px]" maxLength={1500} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
        </div>

        {aviso && (
          <p className="ctl-aviso" role="alert">
            {aviso}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={enviando || (tipo === "plan" && !plan) || (tipo === "modulos" && !modulos.length) || (tipo === "lugares" && !mensaje.trim())}
          >
            <Send className="h-4 w-4" /> {enviando ? "Enviando…" : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Suscripcion() {
  const sesion = useSesion();
  const dueno = esDueno(sesion);
  const [datos, setDatos] = useState(null);
  const [regresoPago] = useState(() => new URLSearchParams(window.location.search).get("pago"));
  const [error, setError] = useState("");
  const [solicitar, setSolicitar] = useState(null);
  const [folio, setFolio] = useState("");

  useEffect(() => {
    api("/empresa/suscripcion")
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="ctl-aviso">{error}</p>;
  if (!datos) return <p className="text-sm text-tinta-3">Cargando…</p>;

  const otros = datos.modulos.filter((m) => m.id !== "jornada");
  return (
    <div className="pagina">
      <Encabezado
        etiqueta="Mi empresa · Suscripción"
        titulo={`Plan ${datos.plan.nombre || ""}.`}
        apagado="Lo que contrataste."
        sub={datos.empresa.activada_en ? `Activo desde el ${fecha(datos.empresa.activada_en)}${datos.empresa.folio ? ` · Solicitud ${datos.empresa.folio}` : ""}.` : null}
        acciones={
          dueno && (
            <>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setSolicitar("modulos")}>
                <Plus className="h-4 w-4" /> Agregar módulos
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={() => setSolicitar("plan")}>
                <ArrowUpRight className="h-4 w-4" /> Mejorar plan
              </button>
            </>
          )
        }
      />

      {folio && (
        <p className="ctl-ok" role="status">
          Recibimos tu solicitud {folio}. Te contactamos para confirmarla.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-4 lg:col-span-1">
          <h2 className="card-titulo">
            <Layers className="h-5 w-5 text-tinta-3" /> Tu plan
          </h2>
          {datos.mensualidad != null && (
            <p className="text-3xl font-semibold tracking-tight text-tinta">
              {pesos(datos.mensualidad)} <span className="text-sm font-normal text-tinta-3">al mes</span>
            </p>
          )}
          <Medidor titulo="Personas (además del dueño)" {...datos.limites.personas} />
          <Medidor titulo="Sucursales" {...datos.limites.sucursales} />
          <ul className="space-y-1.5 text-sm text-tinta-2">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-tinta-3" /> Geocercas y mapa: {datos.limites.geocercas ? "incluidos" : "no incluidos"}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-tinta-3" /> {datos.limites.varios_administradores ? "Varios administradores" : "Un administrador: el dueño"}
            </li>
          </ul>
        </section>

        <section className="card space-y-3 lg:col-span-2">
          <h2 className="card-titulo">
            <Boxes className="h-5 w-5 text-tinta-3" /> Módulos
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {datos.modulos.map((m) => (
              <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-black/[.035] px-3 py-2.5 text-sm text-tinta">
                <Check className="h-4 w-4 shrink-0 text-[#0B8A6B]" /> {m.titulo}
                {m.id === "jornada" && <span className="ml-auto text-xs text-tinta-3">En todos los planes</span>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-tinta-3">
            {otros.length} de {datos.plan.modulos_incluidos} módulos a elegir incluidos en tu plan.
          </p>
          {datos.complementos?.length > 0 && <p className="text-sm text-tinta-2">Complementos: {datos.complementos.join(" · ")}</p>}
        </section>
      </div>

      {regresoPago === "listo" && <p className="ctl-ok" role="status">¡Gracias! Tu cobro automático con tarjeta quedó activo; cada mes se cobra solo.</p>}
      {regresoPago === "ficha" && <p className="ctl-ok" role="status">Tu ficha OXXO está lista (también te llega por correo). Págala antes de que venza; se acredita sola.</p>}
      {regresoPago === "cancelado" && <p className="ctl-aviso ctl-aviso--suave" role="status">No se completó el pago. Puedes intentarlo de nuevo.</p>}
      <ComoPagar cobro={datos.cobro} mensualidad={datos.mensualidad} dueno={esDueno(sesion)} />

      <section className="card">
        <h2 className="card-titulo mb-3">
          <CreditCard className="h-5 w-5 text-tinta-3" /> Pagos
        </h2>
        {datos.pagos === null ? (
          <p className="text-sm text-tinta-3">No pudimos consultar tus pagos en este momento. Intenta más tarde.</p>
        ) : datos.pagos.length === 0 ? (
          <p className="text-sm text-tinta-3">Aún no hay pagos registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Forma de pago</th>
                  <th>Referencia</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {datos.pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{fecha(p.fecha)}</td>
                    <td>{FORMAS[p.forma] || p.forma}</td>
                    <td>{p.referencia || "—"}</td>
                    <td className="text-right tabular-nums">{pesos(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {solicitar && (
        <Solicitar
          datos={datos}
          tipoInicial={solicitar}
          onCerrar={() => setSolicitar(null)}
          onEnviada={(r) => {
            setSolicitar(null);
            setFolio(r.folio);
          }}
        />
      )}
    </div>
  );
}

export default Suscripcion;
