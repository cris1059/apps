import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, ShieldCheck } from "lucide-react";
import { api, actualizarSesion, leerSesion } from "../sesion";

/*
  Activar la verificación en dos pasos: código QR para la app autenticadora
  (Google Authenticator, Microsoft Authenticator, 1Password…), confirmar con
  un código y guardar los códigos de respaldo, que se muestran una sola vez.
*/
function ActivarDosPasos({ onListo, onCancelar }) {
  const [paso, setPaso] = useState("cargando"); // cargando | escanear | respaldo | error
  const [qr, setQr] = useState("");
  const [secreto, setSecreto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigos, setCodigos] = useState([]);
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    api("/cuenta/dos-pasos/iniciar", { metodo: "POST" })
      .then(async (r) => {
        if (!vivo) return;
        setSecreto(r.secreto);
        setQr(await QRCode.toDataURL(r.enlace, { width: 220, margin: 1 }));
        setPaso("escanear");
      })
      .catch((e) => {
        if (!vivo) return;
        setAviso(e.message);
        setPaso("error");
      });
    return () => {
      vivo = false;
    };
  }, []);

  const confirmar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAviso("");
    try {
      const r = await api("/cuenta/dos-pasos/confirmar", { metodo: "POST", datos: { codigo } });
      setCodigos(r.codigos);
      actualizarSesion({ usuario: { ...leerSesion().usuario, dos_pasos_activo: true } });
      setPaso("respaldo");
    } catch (error) {
      setAviso(error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (paso === "cargando") return <p className="text-sm text-tinta-3">Preparando…</p>;
  if (paso === "error")
    return (
      <div className="space-y-4">
        <p className="ctl-aviso">{aviso}</p>
        {onCancelar && (
          <button type="button" className="btn-secondary w-full" onClick={onCancelar}>
            Volver
          </button>
        )}
      </div>
    );

  if (paso === "respaldo")
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 font-semibold text-tinta">
          <ShieldCheck className="h-5 w-5 text-[#0B8A6B]" /> Verificación en dos pasos activada
        </p>
        <p className="text-sm text-tinta-2">
          Guarda estos códigos de respaldo en un lugar seguro. Si pierdes tu celular, cada uno te deja entrar una sola
          vez. No los volverás a ver.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-2xl bg-black/[.04] p-4 font-mono text-[15px] tracking-wider text-tinta">
          {codigos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => navigator.clipboard?.writeText(codigos.join("\n"))}
        >
          <Copy className="h-4 w-4" /> Copiar códigos
        </button>
        <button type="button" className="btn-primary btn-lg w-full" onClick={onListo}>
          Ya los guardé
        </button>
      </div>
    );

  return (
    <form onSubmit={confirmar} className="space-y-4" noValidate>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-tinta-2">
        <li>Abre tu app autenticadora (Google Authenticator, Microsoft Authenticator u otra).</li>
        <li>Escanea este código.</li>
        <li>Escribe el código de 6 dígitos que te muestra.</li>
      </ol>
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-black/[.06]">
        <img src={qr} alt="Código QR para la app autenticadora" width="220" height="220" />
        <p className="text-center text-xs text-tinta-3">
          ¿No puedes escanearlo? Escribe esta clave en la app:
          <br />
          <span className="select-all break-all font-mono text-[13px] text-tinta">{secreto}</span>
        </p>
      </div>
      <div>
        <label htmlFor="codigo-2p" className="label">
          Código de 6 dígitos
        </label>
        <input
          id="codigo-2p"
          className="input-field text-center font-mono text-lg tracking-[.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
      </div>
      {aviso && (
        <p className="ctl-aviso" role="alert">
          {aviso}
        </p>
      )}
      <button type="submit" className="btn-primary btn-lg w-full" disabled={codigo.length !== 6 || enviando}>
        {enviando ? "Revisando…" : "Activar"}
      </button>
      {onCancelar && (
        <button type="button" className="btn-secondary w-full" onClick={onCancelar}>
          Ahora no
        </button>
      )}
    </form>
  );
}

export default ActivarDosPasos;
