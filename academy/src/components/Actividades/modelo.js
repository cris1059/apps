import { ejecutarReto } from './ejecutor';

/* Lógica de los exámenes y prácticas en el navegador.
   - Prácticas: cada reto se comprueba aquí (el código corre en el navegador del alumno).
   - Exámenes: se califican en el servidor; aquí solo para la vista previa del instructor.
   ⚠️ partirHuecos, normalizar, preguntaPublica y calificarExamen son iguales a
   backend/servicios/actividades.js. */

const HUECO = /\[\[([^\]]+?)\]\]/g;

export const partirHuecos = (crudo) => {
  const texto = String(crudo || '');
  const partes = [];
  let ultimo = 0;
  let n = 0;
  for (const m of texto.matchAll(HUECO)) {
    if (m.index > ultimo) partes.push({ texto: texto.slice(ultimo, m.index) });
    const crudas = m[1].split('|').map((s) => s.trim());
    const respuestas = crudas.length > 1 && crudas.every(Boolean) ? crudas : [m[1].trim()];
    partes.push({ hueco: n, respuestas });
    n += 1;
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push({ texto: texto.slice(ultimo) });
  return partes;
};

export const normalizar = (valor, exacto = false) => {
  const texto = String(valor ?? '').replace(/\s+/g, ' ').trim();
  return exacto ? texto : texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
};

export const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

/* Revuelve sin dejarlo en el orden original (si se puede). */
const revolverDistinto = (lista) => {
  if (lista.length < 2) return [...lista];
  for (let i = 0; i < 8; i++) {
    const r = mezclar(lista);
    if (r.some((x, k) => x !== lista[k])) return r;
  }
  return [...lista.slice(1), lista[0]];
};

/* ---------- Preguntas (forma pública, sin respuestas) ---------- */

export const preguntaPublica = (p) => {
  const base = { id: p.id, tipo: p.tipo, enunciado: p.enunciado || '', puntos: Number(p.puntos) || 1 };
  if (p.tipo === 'opcion_multiple') {
    return {
      ...base,
      codigo: p.codigo || '',
      opciones: (p.opciones || []).map(({ id, texto }) => ({ id, texto })),
      multiple: (p.correctas || []).length > 1,
    };
  }
  if (p.tipo === 'completar') {
    const partes = partirHuecos(p.texto);
    const huecos = partes.filter((x) => x.respuestas);
    const publica = {
      ...base,
      modo: p.modo === 'elegir' ? 'elegir' : 'escribir',
      es_codigo: !!p.es_codigo,
      segmentos: partes.map((x) => (x.respuestas ? { hueco: x.hueco } : { texto: x.texto })),
      huecos: huecos.length,
    };
    if (publica.modo === 'elegir') {
      publica.opciones = mezclar([...new Set([...huecos.map((h) => h.respuestas[0]), ...(p.distractores || [])])]);
    }
    return publica;
  }
  return base;
};

export const examenPublico = (a) => ({
  tipo: 'examen',
  aprobar_con: Number(a.aprobar_con) || 70,
  intentos: Number(a.intentos) || 0,
  mezclar: a.mezclar !== false,
  retroalimentacion: a.retroalimentacion || 'aciertos',
  preguntas: (a.preguntas || []).map(preguntaPublica),
});

const calificarPregunta = (p, respuesta) => {
  if (p.tipo === 'opcion_multiple') {
    const elegidas = new Set((Array.isArray(respuesta) ? respuesta : []).map(String));
    const correctas = new Set(p.correctas || []);
    const ok = elegidas.size === correctas.size && [...correctas].every((c) => elegidas.has(c));
    return { valor: ok ? 1 : 0, correcta: [...correctas] };
  }
  if (p.tipo === 'completar') {
    const huecos = partirHuecos(p.texto).filter((x) => x.respuestas);
    const dadas = Array.isArray(respuesta) ? respuesta : [];
    const exacto = p.modo === 'elegir' || !!p.exacto;
    const bien = huecos.map((h, i) => {
      const dada = normalizar(dadas[i], exacto);
      return dada !== '' && h.respuestas.some((r) => normalizar(r, exacto) === dada);
    });
    return { valor: huecos.length ? bien.filter(Boolean).length / huecos.length : 0, huecos: bien, correcta: huecos.map((h) => h.respuestas[0]) };
  }
  return { valor: 0 };
};

const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/* Solo para la vista previa (el examen real se califica en el servidor). */
export const calificarExamen = (examen, respuestas = {}) => {
  let obtenidos = 0;
  let total = 0;
  let aciertos = 0;
  const detalle = (examen.preguntas || []).map((p) => {
    const puntos = Number(p.puntos) || 1;
    const r = calificarPregunta(p, respuestas[p.id]);
    total += puntos;
    obtenidos += r.valor * puntos;
    if (r.valor === 1) aciertos += 1;
    return { id: p.id, valor: redondear(r.valor, 3), ...(r.huecos ? { huecos: r.huecos } : {}), correcta: r.correcta, explicacion: p.explicacion || '' };
  });
  const puntaje = total ? redondear((obtenidos / total) * 100) : 0;
  return { puntaje, aprobado: puntaje >= (Number(examen.aprobar_con) || 70), aciertos, total: (examen.preguntas || []).length, detalle };
};

export const resultadoVisible = (intento, modo = 'aciertos') => {
  const base = { numero: intento.numero, puntaje: intento.puntaje, aprobado: intento.aprobado, aciertos: intento.aciertos, total: intento.total, fecha: intento.fecha };
  if (modo === 'calificacion') return base;
  return {
    ...base,
    detalle: intento.detalle.map((d) => ({
      id: d.id,
      valor: d.valor,
      ...(d.huecos ? { huecos: d.huecos } : {}),
      respuesta: intento.respuestas[d.id] || [],
      ...(modo === 'completa' ? { correcta: d.correcta, explicacion: d.explicacion } : {}),
    })),
  };
};

/* ---------- Retos de práctica ---------- */

export const NOMBRES_RETO = {
  codigo: 'Código',
  arrastrar: 'Arrastra para completar',
  ordenar: 'Ordena los bloques',
  relacionar: 'Conecta los nodos',
  clasificar: 'Clasifica',
  memorama: 'Memorama',
  opcion_multiple: 'Opción múltiple',
  completar: 'Completa',
};

/* Estado inicial de la respuesta (incluye el orden revuelto de cada reto). */
export const respuestaInicial = (reto) => {
  switch (reto.tipo) {
    case 'opcion_multiple':
      return { orden: mezclar((reto.opciones || []).map((o) => o.id)), elegidas: [] };
    case 'completar': {
      const publica = preguntaPublica(reto);
      return { publica, huecos: Array(publica.huecos).fill('') };
    }
    case 'arrastrar': {
      const partes = partirHuecos(reto.texto);
      const huecos = partes.filter((p) => p.respuestas);
      const textos = [...huecos.map((h) => h.respuestas[0]), ...(reto.distractores || [])];
      return { fichas: mezclar(textos.map((texto, i) => ({ id: `f${i}`, texto }))), huecos: Array(huecos.length).fill(null) };
    }
    case 'ordenar':
      return { orden: revolverDistinto((reto.elementos || []).map((_, i) => i)) };
    case 'relacionar':
      return { izquierda: mezclar((reto.pares || []).map((_, i) => i)), derecha: revolverDistinto((reto.pares || []).map((_, i) => i)), pares: {} };
    case 'clasificar': {
      const items = (reto.grupos || []).flatMap((g, gi) => (g.elementos || []).filter((e) => e.trim()).map((texto, k) => ({ id: `${gi}-${k}`, texto, grupo: gi })));
      return { items: mezclar(items), ubicacion: {} };
    }
    case 'memorama': {
      const cartas = (reto.pares || []).flatMap((p, i) => [
        { id: `${i}a`, par: i, texto: p.a },
        { id: `${i}b`, par: i, texto: p.b },
      ]);
      return { cartas: mezclar(cartas), resuelto: false, movimientos: 0 };
    }
    case 'codigo':
      return { archivos: { ...(reto.inicial || {}) } };
    default:
      return {};
  }
};

/* ¿Ya puede comprobar? (todo respondido) */
export const listoParaComprobar = (reto, r) => {
  if (!r) return false;
  switch (reto.tipo) {
    case 'opcion_multiple':
      return r.elegidas.length > 0;
    case 'completar':
      return r.huecos.every((h) => String(h).trim() !== '');
    case 'arrastrar':
      return r.huecos.every((h) => h !== null);
    case 'relacionar':
      return Object.keys(r.pares).length === (reto.pares || []).length;
    case 'clasificar':
      return r.items.every((it) => r.ubicacion[it.id] !== undefined);
    case 'memorama':
      return false; // se completa solo al encontrar todas las parejas
    default:
      return true;
  }
};

/* Comprueba la respuesta: { ok, detalle }. El código es asíncrono (se ejecuta). */
export const comprobarReto = async (reto, r, { onEstado } = {}) => {
  switch (reto.tipo) {
    case 'opcion_multiple': {
      const correctas = new Set(reto.correctas || []);
      const malas = r.elegidas.filter((id) => !correctas.has(id));
      const ok = !malas.length && r.elegidas.length === correctas.size;
      return { ok, detalle: { malas, faltan: !malas.length && !ok } };
    }
    case 'completar': {
      const res = calificarPregunta(reto, r.huecos);
      return { ok: res.valor === 1, detalle: { huecos: res.huecos } };
    }
    case 'arrastrar': {
      const huecos = partirHuecos(reto.texto).filter((p) => p.respuestas);
      const porId = Object.fromEntries(r.fichas.map((f) => [f.id, f.texto]));
      const bien = huecos.map((h, i) => r.huecos[i] !== null && h.respuestas.some((x) => normalizar(x, true) === normalizar(porId[r.huecos[i]], true)));
      return { ok: bien.every(Boolean), detalle: { huecos: bien } };
    }
    case 'ordenar': {
      // Elementos con el mismo texto son intercambiables.
      const elementos = reto.elementos || [];
      const bien = r.orden.map((indice, pos) => elementos[indice] === elementos[pos]);
      return { ok: bien.every(Boolean), detalle: { posiciones: bien } };
    }
    case 'relacionar': {
      const pares = reto.pares || [];
      const bien = Object.fromEntries(pares.map((p, i) => [i, r.pares[i] !== undefined && (r.pares[i] === i || normalizar(pares[r.pares[i]].b, true) === normalizar(p.b, true))]));
      return { ok: Object.values(bien).every(Boolean), detalle: { pares: bien } };
    }
    case 'clasificar': {
      const bien = Object.fromEntries(r.items.map((it) => [it.id, r.ubicacion[it.id] === it.grupo]));
      return { ok: Object.values(bien).every(Boolean), detalle: { items: bien } };
    }
    case 'memorama':
      return { ok: !!r.resuelto, detalle: {} };
    case 'codigo': {
      const resultado = await ejecutarReto(reto, r.archivos || {}, { onEstado });
      return { ok: resultado.ok, detalle: { resultado } };
    }
    default:
      return { ok: true, detalle: {} };
  }
};

const llenoCodigo = (a = {}) => Object.values(a).some((v) => String(v || '').trim());

/* ¿Se puede mostrar la solución? */
export const tieneSolucion = (reto) => reto.tipo !== 'memorama' && (reto.tipo !== 'codigo' || llenoCodigo(reto.solucion));

/* Respuesta con la solución puesta. */
export const respuestaSolucion = (reto, r) => {
  switch (reto.tipo) {
    case 'opcion_multiple':
      return { ...r, elegidas: [...(reto.correctas || [])] };
    case 'completar':
      return { ...r, huecos: partirHuecos(reto.texto).filter((p) => p.respuestas).map((h) => h.respuestas[0]) };
    case 'arrastrar': {
      const usadas = new Set();
      const huecos = partirHuecos(reto.texto)
        .filter((p) => p.respuestas)
        .map((h) => {
          const ficha = r.fichas.find((f) => !usadas.has(f.id) && normalizar(f.texto, true) === normalizar(h.respuestas[0], true));
          if (!ficha) return null;
          usadas.add(ficha.id);
          return ficha.id;
        });
      return { ...r, huecos };
    }
    case 'ordenar':
      return { ...r, orden: (reto.elementos || []).map((_, i) => i) };
    case 'relacionar':
      return { ...r, pares: Object.fromEntries((reto.pares || []).map((_, i) => [i, i])) };
    case 'clasificar':
      return { ...r, ubicacion: Object.fromEntries(r.items.map((it) => [it.id, it.grupo])) };
    case 'codigo':
      return { ...r, archivos: { ...(reto.solucion || {}) } };
    default:
      return r;
  }
};

/* Puntos del modo juego: primer intento 100, segundo 60, después 30; con la solución 0. */
export const puntosPorReto = (fallos, conAyuda) => (conAyuda ? 0 : fallos === 0 ? 100 : fallos === 1 ? 60 : 30);
