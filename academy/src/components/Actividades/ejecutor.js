/* Ejecuta el código de los retos de práctica en el navegador, aislado de la página.
   - JavaScript: en un Web Worker (sin acceso a la página, al DOM ni a la sesión). Se detiene a los 5 s.
   - Python: Pyodide (Python compilado a WebAssembly) en un Web Worker. Se descarga la primera vez.
   - Web (HTML + CSS + JS): en un iframe con sandbox (sin el origen de la página).

   ⚠️ Este archivo es idéntico en el sistema (editor del curso: "Probar con la solución")
   y en la Academy (alumno). Si cambias uno, copia el otro. */

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const LIMITE_JS = 5000;
const LIMITE_PY = 10000;
const CARGA_PY = 120000;

/* ---------- JavaScript (Web Worker) ----------
   El código del worker va como texto (no como función) para que el empaquetador no lo transforme.
   No usa plantillas con comillas invertidas. */
const CODIGO_JS = `
var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
var repr = function (v, prof) {
  prof = prof || 0;
  if (typeof v === 'string') return prof ? JSON.stringify(v) : v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return '[función ' + (v.name || 'anónima') + ']';
  if (typeof v === 'symbol') return v.toString();
  if (typeof v === 'bigint') return v + 'n';
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (v === null || typeof v !== 'object') return String(v);
  if (prof > 4) return '…';
  if (Array.isArray(v)) return '[' + v.map(function (x) { return repr(x, prof + 1); }).join(', ') + ']';
  if (v instanceof Error) return v.name + ': ' + v.message;
  if (v instanceof Map) return 'Map(' + v.size + ') {' + Array.from(v).map(function (e) { return repr(e[0], prof + 1) + ' => ' + repr(e[1], prof + 1); }).join(', ') + '}';
  if (v instanceof Set) return 'Set(' + v.size + ') {' + Array.from(v).map(function (x) { return repr(x, prof + 1); }).join(', ') + '}';
  return '{' + Object.keys(v).map(function (k) {
    return (/^[A-Za-z_$][\\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + repr(v[k], prof + 1);
  }).join(', ') + '}';
};
var igual = function (a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b || (a !== a && b !== b) || Math.abs(a - b) < 1e-9;
  }
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Set || a instanceof Map) {
    if (a.constructor !== b.constructor || a.size !== b.size) return false;
    var restantes = Array.from(b);
    return Array.from(a).every(function (x) {
      var i = restantes.findIndex(function (y) { return igual(x, y); });
      if (i < 0) return false;
      restantes.splice(i, 1);
      return true;
    });
  }
  var ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(function (k) { return Object.prototype.hasOwnProperty.call(b, k) && igual(a[k], b[k]); });
};
var nombreError = function (e) { return e && e.name ? e.name + ': ' + e.message : String(e); };
var compila = function (codigo) { try { new AsyncFunction(codigo); return null; } catch (e) { return e; } };

self.onmessage = async function (ev) {
  var d = ev.data;
  var lineas = 0;
  var escribir = function (tipo) {
    return function () {
      lineas += 1;
      if (lineas > 500) throw new Error('Tu código escribió más de 500 líneas en la consola');
      var texto = Array.prototype.map.call(arguments, function (x) { return repr(x); }).join(' ');
      postMessage({ tipo: 'linea', linea: { tipo: tipo, texto: texto } });
    };
  };
  var consola = {
    log: escribir('log'), info: escribir('log'), debug: escribir('log'), table: escribir('log'),
    warn: escribir('aviso'), error: escribir('error')
  };
  self.onerror = function (mensaje) {
    postMessage({ tipo: 'linea', linea: { tipo: 'error', texto: String(mensaje) } });
    return true;
  };
  self.onunhandledrejection = function (e) {
    postMessage({ tipo: 'linea', linea: { tipo: 'error', texto: nombreError(e.reason) } });
  };

  var pruebas = d.pruebas || [];
  var errorPropio = compila(d.codigo);
  if (errorPropio) return postMessage({ tipo: 'fin', error: nombreError(errorPropio), pruebas: [] });

  var resultados = [];
  var fns = [];
  // Sin resultado esperado (el editor lo llena con "Usar lo que da la solución") solo se calcula lo obtenido.
  var vacio = function (p) { return !String(p.esperado || '').trim(); };
  var conPruebas = pruebas.filter(function (p) {
    if (compila('return (' + p.expresion + '\\n);') || (!vacio(p) && compila('return (' + p.esperado + '\\n);'))) {
      resultados.push({ id: p.id, ok: false, error: 'La prueba tiene un error de sintaxis' });
      return false;
    }
    return true;
  });
  var cuerpo = d.codigo + '\\n;return [' + conPruebas.map(function (p) {
    return 'async function () { return (' + p.expresion + '\\n); }';
  }).join(',') + '];';

  try {
    fns = await new AsyncFunction('console', cuerpo)(consola);
  } catch (e) {
    return postMessage({ tipo: 'fin', error: nombreError(e), pruebas: [] });
  }

  for (var i = 0; i < conPruebas.length; i++) {
    var p = conPruebas[i];
    try {
      var obtenido = await fns[i]();
      if (vacio(p)) {
        resultados.push({ id: p.id, ok: false, obtenido: repr(obtenido, 1), esperado: '' });
        continue;
      }
      var esperado = await new AsyncFunction('return (' + p.esperado + '\\n);')();
      resultados.push({ id: p.id, ok: igual(obtenido, esperado), obtenido: repr(obtenido, 1), esperado: repr(esperado, 1) });
    } catch (e) {
      resultados.push({ id: p.id, ok: false, error: nombreError(e) });
    }
  }
  // Un momento para lo que el código programó con setTimeout corto.
  setTimeout(function () { postMessage({ tipo: 'fin', error: null, pruebas: resultados }); }, 40);
};
`;

const conWorker = (codigoWorker, mensaje, limite) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([codigoWorker], { type: 'text/javascript' }));
    const worker = new Worker(url);
    const salida = [];
    const terminar = (resultado) => {
      clearTimeout(reloj);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ salida, error: null, pruebas: [], ...resultado });
    };
    const reloj = setTimeout(
      () => terminar({ error: `Tu código tardó más de ${limite / 1000} segundos. ¿Hay un ciclo que nunca termina?`, agotado: true }),
      limite
    );
    worker.onmessage = ({ data }) => {
      if (data.tipo === 'linea') salida.push(data.linea);
      else if (data.tipo === 'fin') terminar({ error: data.error, pruebas: data.pruebas || [] });
    };
    worker.onerror = (e) => {
      e.preventDefault();
      terminar({ error: e.message || 'No se pudo ejecutar el código' });
    };
    worker.postMessage(mensaje);
  });

const soloPruebas = (pruebas = []) => pruebas.map(({ id, expresion, esperado }) => ({ id, expresion, esperado }));

export const ejecutarJS = (codigo, { pruebas = [], limite = LIMITE_JS } = {}) =>
  conWorker(CODIGO_JS, { codigo: String(codigo || ''), pruebas: soloPruebas(pruebas) }, limite);

/* ---------- Python (Pyodide en un Web Worker) ---------- */

const CODIGO_PY = `
importScripts('__PYODIDE__pyodide.js');
var AYUDA = [
  'import math as _ac_math',
  'def _ac_igual(a, b):',
  '    if isinstance(a, float) or isinstance(b, float):',
  '        try:',
  '            return _ac_math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)',
  '        except TypeError:',
  '            return False',
  '    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)) and type(a) == type(b):',
  '        return len(a) == len(b) and all(_ac_igual(x, y) for x, y in zip(a, b))',
  '    if isinstance(a, dict) and isinstance(b, dict):',
  '        return a.keys() == b.keys() and all(_ac_igual(a[k], b[k]) for k in a)',
  '    return a == b'
].join('\\n');
// "Traceback… File "<exec>", line 2, in <module>… NameError: …" → "Línea 2: NameError: …"
var limpiar = function (e) {
  var lineas = String((e && e.message) || e).trim().split('\\n');
  var donde = null;
  for (var i = lineas.length - 1; i >= 0 && !donde; i--) {
    var m = /File "<exec>", line (\\d+)/.exec(lineas[i]);
    if (m) donde = m[1];
  }
  return (donde ? 'Línea ' + donde + ': ' : '') + lineas[lineas.length - 1].trim();
};
var listo = loadPyodide({ indexURL: '__PYODIDE__' }).then(
  function (py) { postMessage({ tipo: 'listo' }); return py; },
  function (e) { postMessage({ tipo: 'error_carga', error: String((e && e.message) || e) }); throw e; }
);
self.onmessage = async function (ev) {
  var d = ev.data;
  var py = await listo;
  var lineas = 0;
  var escribir = function (tipo) {
    return function (texto) {
      lineas += 1;
      if (lineas <= 500) postMessage({ tipo: 'linea', linea: { tipo: tipo, texto: texto } });
    };
  };
  py.setStdout({ batched: escribir('log') });
  py.setStderr({ batched: escribir('error') });
  py.setStdin({ error: true });
  var ns = py.globals.get('dict')();
  var resultados = [];
  try {
    try {
      await py.loadPackagesFromImports(d.codigo);
    } catch (e) { /* sin red: se intenta igual */ }
    await py.runPythonAsync(d.codigo, { globals: ns });
  } catch (e) {
    ns.destroy();
    return postMessage({ tipo: 'fin', error: limpiar(e), pruebas: [] });
  }
  try {
    py.runPython(AYUDA, { globals: ns });
    (d.pruebas || []).forEach(function (p) {
      try {
        if (!String(p.esperado || '').trim()) {
          resultados.push({ id: p.id, ok: false, obtenido: py.runPython('repr(' + p.expresion + '\\n)', { globals: ns }), esperado: '' });
          return;
        }
        var ok = py.runPython('_ac_igual((' + p.expresion + '\\n), (' + p.esperado + '\\n))', { globals: ns });
        var obtenido = py.runPython('repr(' + p.expresion + '\\n)', { globals: ns });
        var esperado = py.runPython('repr(' + p.esperado + '\\n)', { globals: ns });
        resultados.push({ id: p.id, ok: ok === true, obtenido: obtenido, esperado: esperado });
      } catch (e) {
        resultados.push({ id: p.id, ok: false, error: limpiar(e) });
      }
    });
  } finally {
    ns.destroy();
  }
  postMessage({ tipo: 'fin', error: null, pruebas: resultados });
};
`.split('__PYODIDE__').join(PYODIDE);

/* Un solo worker de Python por pestaña (cargar Pyodide tarda): las ejecuciones van en fila. */
let python = null; // { worker, listo: Promise, url }
let fila = Promise.resolve();

const iniciarPython = () => {
  if (python) return python;
  const url = URL.createObjectURL(new Blob([CODIGO_PY], { type: 'text/javascript' }));
  const worker = new Worker(url);
  const listo = new Promise((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error('Python tardó demasiado en cargar. Revisa tu conexión.')), CARGA_PY);
    const oir = ({ data }) => {
      if (data.tipo === 'listo') resolve();
      else if (data.tipo === 'error_carga') reject(new Error('No se pudo cargar Python. Revisa tu conexión e inténtalo de nuevo.'));
      else return;
      clearTimeout(reloj);
      worker.removeEventListener('message', oir);
    };
    worker.addEventListener('message', oir);
    worker.onerror = (e) => {
      e.preventDefault();
      clearTimeout(reloj);
      reject(new Error('No se pudo cargar Python. Revisa tu conexión e inténtalo de nuevo.'));
    };
  });
  python = { worker, listo, url };
  listo.catch(() => detenerPython());
  return python;
};

const detenerPython = () => {
  if (!python) return;
  python.worker.terminate();
  URL.revokeObjectURL(python.url);
  python = null;
};

export const pythonListo = () => !!python;

const correrPython = async (codigo, pruebas, onEstado) => {
  const actual = iniciarPython();
  onEstado?.('cargando');
  try {
    await actual.listo;
  } catch (error) {
    return { salida: [], error: error.message, pruebas: [] };
  }
  onEstado?.('ejecutando');
  return new Promise((resolve) => {
    const salida = [];
    const terminar = (resultado) => {
      clearTimeout(reloj);
      actual.worker.removeEventListener('message', oir);
      resolve({ salida, error: null, pruebas: [], ...resultado });
    };
    const reloj = setTimeout(() => {
      detenerPython(); // la única forma de cortar un ciclo infinito
      terminar({ error: `Tu código tardó más de ${LIMITE_PY / 1000} segundos. ¿Hay un ciclo que nunca termina?`, agotado: true });
    }, LIMITE_PY);
    const oir = ({ data }) => {
      if (data.tipo === 'linea') salida.push(data.linea);
      else if (data.tipo === 'fin') terminar({ error: data.error, pruebas: data.pruebas || [] });
    };
    actual.worker.addEventListener('message', oir);
    actual.worker.postMessage({ codigo: String(codigo || ''), pruebas: soloPruebas(pruebas) });
  });
};

export const ejecutarPython = (codigo, { pruebas = [], onEstado } = {}) => {
  const turno = fila.then(() => correrPython(codigo, pruebas, onEstado));
  fila = turno.catch(() => {});
  return turno;
};

/* ---------- Web (iframe aislado) ---------- */

const CONSOLA_WEB = `(function () {
  var canal = __CANAL__;
  var texto = function (x) {
    if (typeof x === 'string') return x;
    try { return JSON.stringify(x); } catch (e) { return String(x); }
  };
  var enviar = function (tipo, args) {
    try {
      parent.postMessage({ canal: canal, tipo: 'linea', linea: { tipo: tipo, texto: Array.prototype.map.call(args, texto).join(' ') } }, '*');
    } catch (e) {}
  };
  ['log', 'info', 'warn', 'error'].forEach(function (k) {
    var original = console[k];
    console[k] = function () {
      enviar(k === 'warn' ? 'aviso' : k === 'error' ? 'error' : 'log', arguments);
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (e) { enviar('error', [e.message || 'Error en el código']); });
})();`;

const REVISOR_WEB = `(function () {
  var canal = __CANAL__;
  var C = __COMPROBACIONES__;
  var norm = function (s) { return String(s == null ? '' : s).replace(/\\s+/g, ' ').trim().toLowerCase(); };
  var corto = function (s) { s = String(s || '').replace(/\\s+/g, ' ').trim(); return s.length > 60 ? s.slice(0, 60) + '…' : s; };
  var calculado = function (el, prop, valor) {
    var t = document.createElement(el.tagName === 'BODY' || el.tagName === 'HTML' ? 'div' : el.tagName);
    t.style.setProperty(prop, valor);
    (el.parentNode && el.parentNode.appendChild ? el.parentNode : document.body).appendChild(t);
    var r = getComputedStyle(t).getPropertyValue(prop);
    t.remove();
    return r;
  };
  var revisar = function (c) {
    if (c.tipo === 'js') return { ok: !!(new Function('return (' + c.valor + '\\n);'))() };
    if (c.tipo === 'cantidad') {
      var n = document.querySelectorAll(c.selector).length;
      return { ok: n >= Number(c.valor), detalle: 'Encontrados: ' + n };
    }
    var el = document.querySelector(c.selector);
    if (!el) return { ok: false, detalle: 'No se encontró ' + c.selector };
    if (c.tipo === 'existe') return { ok: true };
    if (c.tipo === 'texto') return { ok: norm(el.textContent).indexOf(norm(c.valor)) !== -1, detalle: 'Texto: "' + corto(el.textContent) + '"' };
    if (c.tipo === 'estilo') {
      var actual = getComputedStyle(el).getPropertyValue(c.propiedad).trim();
      var esperado = calculado(el, c.propiedad, c.valor).trim();
      return { ok: actual === esperado || norm(actual) === norm(c.valor), detalle: c.propiedad + ': ' + (actual || '(sin valor)') };
    }
    if (c.tipo === 'atributo') {
      var v = el.getAttribute(c.propiedad);
      if (v === null) return { ok: false, detalle: 'Sin el atributo ' + c.propiedad };
      return { ok: c.valor ? v.trim() === String(c.valor).trim() : true, detalle: c.propiedad + '="' + corto(v) + '"' };
    }
    return { ok: false };
  };
  var correr = function () {
    var r = C.map(function (c) {
      try { var x = revisar(c); return { id: c.id, ok: !!x.ok, detalle: x.detalle || '' }; }
      catch (e) { return { id: c.id, ok: false, detalle: String((e && e.message) || e) }; }
    });
    parent.postMessage({ canal: canal, tipo: 'resultado', pruebas: r }, '*');
  };
  if (document.readyState === 'complete') setTimeout(correr, 30);
  else window.addEventListener('load', function () { setTimeout(correr, 30); });
})();`;

const seguroEnScript = (texto) => String(texto || '').replace(/<\/(script)/gi, '<\\/$1');
const jsonEnScript = (valor) => JSON.stringify(valor).replace(/</g, '\\u003c');

/* Documento para el iframe. El HTML del alumno puede ser solo el contenido del <body>
   o un documento completo. */
export const documentoWeb = ({ html = '', css = '', js = '' } = {}, { canal = '', comprobaciones = null } = {}) => {
  const estilo = `<style>${String(css || '').replace(/<\/(style)/gi, '<\\/$1')}</style>`;
  const scripts = [
    // Reemplazos con función: el código puede traer "$&", "$'"… que replace() interpretaría.
    `<script>${CONSOLA_WEB.replace('__CANAL__', () => jsonEnScript(canal))}</script>`,
    js ? `<script>${seguroEnScript(js)}</script>` : '',
    comprobaciones
      ? `<script>${REVISOR_WEB.replace('__CANAL__', () => jsonEnScript(canal)).replace('__COMPROBACIONES__', () => jsonEnScript(comprobaciones))}</script>`
      : '',
  ].join('');
  let doc = String(html || '');
  if (!/<html[\s>]/i.test(doc)) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${estilo}</head><body>${doc}${scripts}</body></html>`;
  }
  doc = /<\/head>/i.test(doc)
    ? doc.replace(/<\/head>/i, () => `${estilo}</head>`)
    : doc.replace(/<html[^>]*>/i, (m) => `${m}<head>${estilo}</head>`);
  doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => `${scripts}</body>`) : `${doc}${scripts}`;
  return doc;
};

export const nuevoCanal = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* Carga la página en un iframe oculto y revisa las comprobaciones. */
export const comprobarWeb = (archivos, comprobaciones = [], { limite = 6000 } = {}) =>
  new Promise((resolve) => {
    const canal = nuevoCanal();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;visibility:hidden';
    const salida = [];
    const terminar = (resultado) => {
      clearTimeout(reloj);
      window.removeEventListener('message', oir);
      iframe.remove();
      resolve({ salida, error: null, pruebas: [], ...resultado });
    };
    const oir = (e) => {
      if (e.source !== iframe.contentWindow || e.data?.canal !== canal) return;
      if (e.data.tipo === 'linea') salida.push(e.data.linea);
      else if (e.data.tipo === 'resultado') terminar({ pruebas: e.data.pruebas || [] });
    };
    const reloj = setTimeout(() => terminar({ error: 'La página tardó demasiado en cargar. ¿Hay un ciclo que nunca termina?', agotado: true }), limite);
    window.addEventListener('message', oir);
    iframe.srcdoc = documentoWeb(archivos, { canal, comprobaciones: comprobaciones.map(({ id, tipo, selector, propiedad, valor }) => ({ id, tipo, selector, propiedad, valor })) });
    document.body.appendChild(iframe);
  });

/* ---------- Reto completo ---------- */

export const normalizarSalida = (texto) =>
  String(texto || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim();

export const textoSalida = (salida = []) =>
  salida
    .filter((l) => l.tipo !== 'error')
    .map((l) => l.texto)
    .join('\n');

/* Ejecuta un reto de código con los archivos dados y decide si pasa:
   - libre: basta con que corra sin errores
   - salida: lo que imprime debe ser igual a la salida esperada
   - pruebas: todas las pruebas (JS/Python) o comprobaciones (web) deben pasar
   Devuelve { ok, salida, error, pruebas, agotado } */
export const ejecutarReto = async (reto, archivos, { onEstado } = {}) => {
  const validacion = reto.validacion || 'libre';
  if (reto.lenguaje === 'web') {
    const comprobaciones = validacion === 'pruebas' ? reto.comprobaciones || [] : [];
    const r = await comprobarWeb(archivos, comprobaciones);
    const ok = !r.error && (validacion !== 'pruebas' || (r.pruebas.length > 0 && r.pruebas.every((p) => p.ok)));
    return { ...r, ok };
  }
  const pruebas = validacion === 'pruebas' ? reto.pruebas || [] : [];
  const r =
    reto.lenguaje === 'python'
      ? await ejecutarPython(archivos.codigo, { pruebas, onEstado })
      : await ejecutarJS(archivos.codigo, { pruebas });
  let ok = !r.error;
  if (ok && validacion === 'salida') ok = normalizarSalida(textoSalida(r.salida)) === normalizarSalida(reto.salida_esperada);
  if (ok && validacion === 'pruebas') ok = r.pruebas.length > 0 && r.pruebas.every((p) => p.ok);
  return { ...r, ok };
};
