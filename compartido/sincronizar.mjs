#!/usr/bin/env node
/*
  Trae el frontend de la web a su app y lo adapta para Capacitor.
  Uso (desde la raíz del repo):  node compartido/sincronizar.mjs academy|control|todas

  La fuente del código web sigue siendo su repo (academy-avantcode / control-avantcode,
  junto a este repo en Documents/sistema). Aquí se copia y se adapta; lo propio de cada
  app (capacitor.config.json, android/, ios/, recursos/) no se toca.

  Qué hace:
  1. Copia index.html, src/, public/ y la configuración de Vite/Tailwind/PostCSS.
  2. Copia compartido/src a <app>/src/compartido y lo importa primero en main.jsx.
  3. window.location.origin → VITE_ORIGEN_WEB (enlaces para compartir, QR del kiosco):
     en la app el origen es https://localhost, no la web.
  4. package.json = el de la web + Capacitor + scripts de la app.
  5. .env.app con las direcciones del servidor (vite build --mode app).
  6. Permisos nativos (ubicación, cámara) si ya existen android/ o ios/.
  7. ORIGEN-WEB.txt: de qué commit de la web salió la copia.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'compartido/apps.json'), 'utf8'));
const COPIAR = ['index.html', 'src', 'public', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'];
const IGNORAR = new Set(['node_modules', 'dist', '.env', '.env.local', '.env.production', '.env.development']);

const copiar = (de, a) => {
  const info = fs.statSync(de);
  if (info.isDirectory()) {
    fs.mkdirSync(a, { recursive: true });
    for (const n of fs.readdirSync(de)) if (!IGNORAR.has(n)) copiar(path.join(de, n), path.join(a, n));
  } else fs.copyFileSync(de, a);
};
const archivos = (dir, ext = /\.(jsx?|mjs)$/) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? archivos(p, ext) : ext.test(e.name) ? [p] : [];
  });

const PERMISOS_ANDROID = {
  ubicacion: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'],
  camara: ['android.permission.CAMERA'],
};
const PERMISOS_IOS = {
  ubicacion: [['NSLocationWhenInUseUsageDescription', 'Para registrar tu entrada y salida con la ubicación de tu centro de trabajo.']],
  camara: [['NSCameraUsageDescription', 'Para leer el código QR del kiosco al registrar tu entrada o salida.']],
};

const permisosNativos = (dir, permisos) => {
  const manifiesto = path.join(dir, 'android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifiesto)) {
    let m = fs.readFileSync(manifiesto, 'utf8');
    const faltan = permisos.flatMap((p) => PERMISOS_ANDROID[p] || []).filter((p) => !m.includes(`"${p}"`));
    if (faltan.length) {
      m = m.replace('</manifest>', `${faltan.map((p) => `    <uses-permission android:name="${p}" />`).join('\n')}\n</manifest>`);
      fs.writeFileSync(manifiesto, m);
      console.log(`  + Android: ${faltan.join(', ')}`);
    }
  }
  const plist = path.join(dir, 'ios/App/App/Info.plist');
  if (fs.existsSync(plist)) {
    let p = fs.readFileSync(plist, 'utf8');
    const faltan = permisos.flatMap((x) => PERMISOS_IOS[x] || []).filter(([k]) => !p.includes(`<key>${k}</key>`));
    if (faltan.length) {
      p = p.replace(/<\/dict>\s*<\/plist>\s*$/, `${faltan.map(([k, v]) => `\t<key>${k}</key>\n\t<string>${v}</string>`).join('\n')}\n</dict>\n</plist>\n`);
      fs.writeFileSync(plist, p);
      console.log(`  + iOS: ${faltan.map(([k]) => k).join(', ')}`);
    }
  }
};

const sincronizar = (clave) => {
  const app = CONFIG.apps[clave];
  if (!app) throw new Error(`No existe la app «${clave}» (usa: ${Object.keys(CONFIG.apps).join(', ')}, todas)`);
  const dir = path.join(RAIZ, clave);
  const origen = path.resolve(RAIZ, app.origen);
  if (!fs.existsSync(path.join(origen, 'package.json'))) throw new Error(`No encontré el frontend de ${clave} en ${origen}`);
  console.log(`${app.nombre} ← ${path.relative(RAIZ, origen)}`);
  fs.mkdirSync(dir, { recursive: true });

  // 1. Código web (src/ y public/ se reemplazan completos).
  for (const n of COPIAR) {
    const de = path.join(origen, n);
    if (!fs.existsSync(de)) continue;
    fs.rmSync(path.join(dir, n), { recursive: true, force: true });
    copiar(de, path.join(dir, n));
  }

  // 2. Compartido + arranque.
  copiar(path.join(RAIZ, 'compartido/src'), path.join(dir, 'src/compartido'));
  fs.writeFileSync(path.join(dir, 'src/compartido/LEEME.txt'), 'Copia de compartido/src (la pone compartido/sincronizar.mjs). No la edites aquí.\n');
  const main = ['src/main.jsx', 'src/main.js', 'src/main.tsx'].map((m) => path.join(dir, m)).find((m) => fs.existsSync(m));
  if (!main) throw new Error('No encontré src/main.jsx');
  const textoMain = fs.readFileSync(main, 'utf8');
  if (!textoMain.includes("./compartido/arranque")) fs.writeFileSync(main, `import './compartido/arranque.js';\n${textoMain}`);

  // 3. El origen de la web (no el de la app) para enlaces y códigos QR.
  let cambiados = 0;
  for (const f of archivos(path.join(dir, 'src'))) {
    if (f.includes(`${path.sep}compartido${path.sep}`)) continue;
    const t = fs.readFileSync(f, 'utf8');
    if (!t.includes('window.location.origin')) continue;
    fs.writeFileSync(f, t.replaceAll('window.location.origin', '(import.meta.env.VITE_ORIGEN_WEB || window.location.origin)'));
    cambiados += 1;
  }
  if (cambiados) console.log(`  ~ origen de la web en ${cambiados} archivos`);

  // 4. package.json: el de la web + Capacitor + scripts de la app.
  const web = JSON.parse(fs.readFileSync(path.join(origen, 'package.json'), 'utf8'));
  const pkg = {
    name: `avantcode-${clave}-app`,
    version: web.version || '1.0.0',
    private: true,
    type: web.type || 'module',
    scripts: {
      dev: 'vite --mode app',
      build: 'vite build --mode app',
      'cap:sync': 'vite build --mode app && cap sync',
      android: 'vite build --mode app && cap sync android && cap open android',
      ios: 'vite build --mode app && cap sync ios && cap open ios',
      sincronizar: `node ../compartido/sincronizar.mjs ${clave}`,
    },
    dependencies: { ...web.dependencies, ...CONFIG.capacitor },
    devDependencies: { ...web.devDependencies, ...CONFIG.capacitorDev },
  };
  fs.writeFileSync(path.join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

  // 5. Direcciones del servidor para el build de la app.
  const env = { VITE_ORIGEN_API: app.api, VITE_ORIGEN_WEB: app.web, ...app.env };
  fs.writeFileSync(
    path.join(dir, '.env.app'),
    `# Lo escribe compartido/sincronizar.mjs (de compartido/apps.json). Se usa con vite --mode app.\n${Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')}\n`
  );

  // 6. Permisos nativos.
  permisosNativos(dir, app.permisos || []);

  // 7. De qué versión de la web salió.
  let commit = 'desconocido';
  try {
    commit = execSync('git log -1 --format="%h %s"', { cwd: origen, encoding: 'utf8' }).trim();
  } catch {
    /* sin git */
  }
  fs.writeFileSync(path.join(dir, 'ORIGEN-WEB.txt'), `Frontend copiado de ${app.origen}\nCommit: ${commit}\nFecha: ${new Date().toISOString()}\n`);
  console.log(`  ✓ listo (web: ${commit})`);
};

const pedido = process.argv[2] || 'todas';
for (const clave of pedido === 'todas' ? Object.keys(CONFIG.apps) : [pedido]) sincronizar(clave);
