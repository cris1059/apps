import { useEffect, useMemo, useRef, useState } from 'react';
import { documentoWeb, nuevoCanal } from './ejecutor';

/* Editor de código ligero (sin dependencias): un <textarea> transparente encima del
   código resaltado. Tab / Shift+Tab indentan, Enter conserva la sangría y Esc suelta
   el foco (para seguir con Tab por la página).

   ⚠️ Este archivo es idéntico en el sistema y en la Academy. Si cambias uno, copia el otro. */

const COLORES = {
  comentario: 'text-[#7C8591] italic',
  texto: 'text-[#D4FF3F]',
  clave: 'text-[#C4B5FD]',
  numero: 'text-[#FDBA74]',
  funcion: 'text-[#7DD3FC]',
  etiqueta: 'text-[#F9A8D4]',
  atributo: 'text-[#FDE68A]',
  propiedad: 'text-[#7DD3FC]',
  regla: 'text-[#C4B5FD]',
};

const CLAVES_JS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|default|try|catch|finally|throw|typeof|instanceof|in|of|async|await|yield|this|null|undefined|true|false|delete|void|super|static|get|set';
const CLAVES_PY =
  'def|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|class|import|from|as|with|try|except|finally|raise|lambda|pass|break|continue|global|nonlocal|yield|async|await|del|assert|match|case';

/* Cada lenguaje: [clase, patrón] en orden de prioridad. */
const REGLAS = {
  javascript: [
    ['comentario', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/],
    ['texto', /`(?:\\[\s\S]|[^`\\])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/],
    ['clave', new RegExp(`\\b(?:${CLAVES_JS})\\b`)],
    ['numero', /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b|\b0x[\da-f]+\b/i],
    ['funcion', /\b[A-Za-z_$][\w$]*(?=\s*\()/],
  ],
  python: [
    ['comentario', /#[^\n]*/],
    ['texto', /[rbfu]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/i],
    ['clave', new RegExp(`\\b(?:${CLAVES_PY})\\b`)],
    ['numero', /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/i],
    ['funcion', /\b[A-Za-z_]\w*(?=\s*\()/],
  ],
  html: [
    ['comentario', /<!--[\s\S]*?(?:-->|$)/],
    ['etiqueta', /<\/?[A-Za-z][\w-]*|\/?>/],
    ['texto', /"[^"]*"?|'[^']*'?/],
    ['atributo', /\b[A-Za-z_:][\w:.-]*(?==)/],
  ],
  css: [
    ['comentario', /\/\*[\s\S]*?(?:\*\/|$)/],
    ['texto', /"[^"\n]*"?|'[^'\n]*'?/],
    ['regla', /@[\w-]+/],
    ['propiedad', /[\w-]+(?=\s*:(?!:)[^{};]*[;}\n])/],
    ['numero', /#[\da-f]{3,8}\b|-?\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b/i],
  ],
};

const combinar = (reglas) => new RegExp(reglas.map(([, re]) => `(${re.source})`).join('|'), 'gi');
const COMBINADAS = Object.fromEntries(Object.entries(REGLAS).map(([k, v]) => [k, combinar(v)]));

/* Texto → [{ texto, clase }] */
export const resaltar = (codigo, lenguaje) => {
  const reglas = REGLAS[lenguaje];
  if (!reglas) return [{ texto: codigo, clase: null }];
  const re = new RegExp(COMBINADAS[lenguaje].source, lenguaje === 'html' || lenguaje === 'css' ? 'gi' : 'g');
  const partes = [];
  let ultimo = 0;
  let m;
  while ((m = re.exec(codigo))) {
    if (!m[0]) {
      re.lastIndex += 1;
      continue;
    }
    if (m.index > ultimo) partes.push({ texto: codigo.slice(ultimo, m.index), clase: null });
    const grupo = m.slice(1).findIndex((g) => g !== undefined);
    partes.push({ texto: m[0], clase: reglas[grupo]?.[0] || null });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < codigo.length) partes.push({ texto: codigo.slice(ultimo), clase: null });
  return partes;
};

const SANGRIA = '  ';
const ABRE = { '{': '}', '[': ']', '(': ')' };

const EditorCodigo = ({
  valor = '',
  onCambiar,
  lenguaje = 'javascript',
  soloLectura = false,
  etiqueta = 'Editor de código',
  minAlto = 140,
  maxAlto = 420,
  className = '',
  id,
}) => {
  const ref = useRef(null);
  const avisoRef = useRef(null);
  const [avisoPegado, setAvisoPegado] = useState(false);
  const texto = String(valor ?? '');
  const partes = useMemo(() => resaltar(texto, lenguaje), [texto, lenguaje]);
  const numeros = useMemo(() => Array.from({ length: texto.split('\n').length }, (_, i) => i + 1).join('\n'), [texto]);

  const insertar = (nuevo) => {
    const ta = ref.current;
    // execCommand conserva el historial de deshacer (Ctrl+Z).
    let hecho = false;
    try {
      hecho = document.execCommand('insertText', false, nuevo);
    } catch {
      hecho = false;
    }
    if (!hecho) {
      ta.setRangeText(nuevo, ta.selectionStart, ta.selectionEnd, 'end');
      onCambiar?.(ta.value);
    }
  };

  useEffect(() => () => clearTimeout(avisoRef.current), []);

  const bloquearPegado = (e) => {
    if (soloLectura) return;
    e.preventDefault();
    setAvisoPegado(true);
    clearTimeout(avisoRef.current);
    avisoRef.current = setTimeout(() => setAvisoPegado(false), 2600);
  };

  const bloquearEntradaExterna = (e) => {
    const tipo = e.nativeEvent?.inputType || e.inputType;
    if (tipo === 'insertFromPaste' || tipo === 'insertFromDrop') bloquearPegado(e);
  };

  const alTeclear = (e) => {
    if (soloLectura) return;
    const ta = e.currentTarget;
    const { selectionStart: ini, selectionEnd: fin, value } = ta;

    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') || (e.shiftKey && e.key === 'Insert')) {
      bloquearPegado(e);
      return;
    }

    if (e.key === 'Escape') {
      ta.blur();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const inicioLinea = value.lastIndexOf('\n', ini - 1) + 1;
      if (ini === fin && !e.shiftKey) {
        insertar(SANGRIA);
        return;
      }
      // Indentar o quitar sangría a las líneas seleccionadas.
      const finLinea = value.indexOf('\n', fin - (fin > ini && value[fin - 1] === '\n' ? 1 : 0));
      const hasta = finLinea === -1 ? value.length : finLinea;
      const bloque = value.slice(inicioLinea, hasta);
      const lineas = bloque.split('\n');
      const nuevas = e.shiftKey ? lineas.map((l) => l.replace(/^( {1,2}|\t)/, '')) : lineas.map((l) => SANGRIA + l);
      ta.setSelectionRange(inicioLinea, hasta);
      insertar(nuevas.join('\n'));
      const delta = nuevas[0].length - lineas[0].length;
      ta.setSelectionRange(Math.max(inicioLinea, ini + delta), inicioLinea + nuevas.join('\n').length);
      return;
    }

    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const inicioLinea = value.lastIndexOf('\n', ini - 1) + 1;
      const linea = value.slice(inicioLinea, ini);
      const sangria = linea.match(/^[ \t]*/)[0];
      const antes = value[ini - 1];
      const despues = value[fin];
      const abre = ABRE[antes] !== undefined || (lenguaje === 'python' && /:\s*$/.test(linea));
      if (ABRE[antes] && despues === ABRE[antes]) {
        insertar(`\n${sangria}${SANGRIA}\n${sangria}`);
        const pos = ini + 1 + sangria.length + SANGRIA.length;
        ta.setSelectionRange(pos, pos);
        return;
      }
      insertar(`\n${sangria}${abre ? SANGRIA : ''}`);
    }
  };

  return (
    <div
      className={`scroll-fino relative overflow-auto rounded-xl bg-[#161616] ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-lima/70 ${className}`}
      style={{ maxHeight: maxAlto }}
    >
      {avisoPegado && (
        <span
          role="status"
          className="pointer-events-none absolute right-3 top-3 z-30 rounded-lg bg-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/15"
        >
          Escribe el código: pegar está deshabilitado.
        </span>
      )}
      <div className="flex w-max min-w-full font-mono text-[13px] leading-[1.65]">
        <pre
          aria-hidden="true"
          className="sticky left-0 z-10 m-0 select-none border-r border-white/[.06] bg-[#161616] py-3 pl-3 pr-2.5 text-right font-mono text-white/25"
          style={{ minHeight: minAlto }}
        >
          {numeros}
        </pre>
        <div className="relative min-w-0 flex-1">
          <pre
            aria-hidden="true"
            className="m-0 whitespace-pre py-3 pl-3 pr-6 font-mono text-[#E8EAED]"
            style={{ minHeight: minAlto, tabSize: 2 }}
          >
            {partes.map((p, i) =>
              p.clase ? (
                <span key={i} className={COLORES[p.clase]}>{p.texto}</span>
              ) : (
                p.texto
              )
            )}
            {/* Un salto extra: el <pre> ignora el último salto de línea y el textarea no. */}
            {'\n '}
          </pre>
          <textarea
            ref={ref}
            id={id}
            value={texto}
            onChange={(e) => onCambiar?.(e.target.value)}
            onKeyDown={alTeclear}
            onPaste={bloquearPegado}
            onDrop={bloquearPegado}
            onBeforeInput={bloquearEntradaExterna}
            readOnly={soloLectura}
            aria-label={`${etiqueta}. Tab agrega sangría; pegar está deshabilitado; Esc para salir del editor.`}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            className="absolute inset-0 m-0 h-full w-full resize-none overflow-hidden whitespace-pre bg-transparent py-3 pl-3 pr-6 font-mono text-[13px] leading-[1.65] text-transparent caret-lima outline-none selection:bg-white/20"
            style={{ tabSize: 2, WebkitTextFillColor: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorCodigo;

/* Consola: líneas de salida (log, aviso, error). */
export const Consola = ({ lineas = [], vacio = 'La salida de tu código aparecerá aquí.', className = '' }) => (
  <div
    className={`scroll-fino overflow-auto rounded-xl bg-[#0E0E0E] p-3 font-mono text-[12.5px] leading-relaxed ${className}`}
    role="log"
    aria-live="polite"
    aria-label="Consola"
  >
    {lineas.length === 0 ? (
      <p className="text-white/35">{vacio}</p>
    ) : (
      lineas.map((l, i) => (
        <pre
          key={i}
          className={`m-0 whitespace-pre-wrap break-words font-mono ${
            l.tipo === 'error' ? 'text-[#FF8A80]' : l.tipo === 'aviso' ? 'text-[#FFD180]' : 'text-[#E8EAED]'
          }`}
        >
          {l.tipo === 'error' ? '✖ ' : l.tipo === 'aviso' ? '⚠ ' : '› '}
          {l.texto}
        </pre>
      ))
    )}
  </div>
);

/* Vista previa en vivo de un reto web (iframe aislado). `onConsola(linea)` recibe lo que
   escribe la página; `onConsola(null)` avisa que se recargó. */
export const VistaWeb = ({ archivos, onConsola, className = '', titulo = 'Vista previa' }) => {
  const ref = useRef(null);
  const [canal] = useState(nuevoCanal);
  const { html = '', css = '', js = '' } = archivos || {};
  const [doc, setDoc] = useState(() => documentoWeb({ html, css, js }, { canal }));
  const avisar = useRef(onConsola);
  avisar.current = onConsola;

  useEffect(() => {
    const t = setTimeout(() => setDoc(documentoWeb({ html, css, js }, { canal })), 350);
    return () => clearTimeout(t);
  }, [html, css, js, canal]);

  useEffect(() => {
    avisar.current?.(null);
  }, [doc]);

  useEffect(() => {
    const oir = (e) => {
      if (e.source !== ref.current?.contentWindow || e.data?.canal !== canal) return;
      if (e.data.tipo === 'linea') avisar.current?.(e.data.linea);
    };
    window.addEventListener('message', oir);
    return () => window.removeEventListener('message', oir);
  }, [canal]);

  return (
    <iframe
      ref={ref}
      title={titulo}
      sandbox="allow-scripts allow-modals"
      srcDoc={doc}
      className={`block w-full border-0 bg-white ${className}`}
    />
  );
};
