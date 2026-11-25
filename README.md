# apps

Apps móviles de AvantCode (Android e iOS), hechas con [Capacitor](https://capacitorjs.com) a partir del frontend de cada sitio.

| Carpeta | App | Web | API |
| --- | --- | --- | --- |
| `academy/` | AvantCode Academy (`mx.avantcode.academy`) | academy.avantcode.mx | api-academy.avantcode.mx |
| `control/` | AvantCode Control (`mx.avantcode.control`) | control.avantcode.mx | control.avantcode.mx/api |
| `compartido/` | Lo común a las dos: arranque de la app y sincronización | | |

## Cómo está armado

El código web **no se escribe aquí**: su fuente sigue siendo su repo (`avantcode-academy` y `avantcode-control`, clonados junto a este en `Documents/sistema`). `compartido/sincronizar.mjs` lo copia a cada app y lo adapta:

- Copia `index.html`, `src/`, `public/` y la configuración de Vite, Tailwind y PostCSS.
- Agrega `src/compartido/arranque.js` (copia de `compartido/src`) y lo importa primero en `main.jsx`. Ese arranque:
  - manda las llamadas relativas a `/api` al servidor (en la app la página vive en `https://localhost`);
  - hace que el botón «atrás» de Android regrese en la app;
  - abre en el navegador del teléfono los enlaces a otros sitios, y dentro de la app los de la propia web;
  - oculta la pantalla de inicio.
- Cambia `window.location.origin` por la dirección de la web (`VITE_ORIGEN_WEB`), para que los enlaces de certificados, cursos y el QR del kiosco apunten a la web y no al teléfono.
- Escribe `package.json` (el de la web, más Capacitor) y `.env.app` con las direcciones del servidor (de `compartido/apps.json`).
- Agrega los permisos nativos de Control: ubicación y cámara (marcar entrada con ubicación y leer el QR del kiosco).
- Anota en `ORIGEN-WEB.txt` de qué commit de la web salió la copia.

Lo propio de cada app sí vive aquí y no lo toca la sincronización: `capacitor.config.json`, `android/` e `ios/`.

Las API aceptan las apps por CORS: `https://localhost` en Android y `capacitor://localhost` en iOS.

## Uso

```bash
# Traer los últimos cambios de la web (desde la raíz del repo)
node compartido/sincronizar.mjs academy      # o control, o todas

# En cada app
cd academy
npm install
npm run cap:sync      # build de la app (vite --mode app) + copia a android/ e ios/
npm run android       # lo anterior y abre Android Studio
npm run ios           # lo anterior y abre Xcode (solo en Mac)
```

Para compilar el APK/AAB hace falta Android Studio (JDK y Android SDK). Para iOS hacen falta una Mac con Xcode y una cuenta de Apple Developer. El proyecto de iOS usa Swift Package Manager (no necesita CocoaPods).

## Pendiente

- Íconos y pantalla de inicio con el logo de cada app (`npx @capacitor/assets generate` con un PNG de 1024 px por app).
- Firmar y publicar: Google Play Console y App Store Connect.
- Enlaces profundos (abrir `https://academy.avantcode.mx/...` directo en la app): `assetlinks.json` y `apple-app-site-association` en cada web.
