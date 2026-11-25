import { useMemo } from 'react';
import QRCode from 'qrcode';
// En línea (data URI): así el logo también sale al exportar con html2canvas y al imprimir.
import logoQR from '../assets/LogoQR.png?inline';

/* Código QR de puntos con el logo de AvantCode al centro (estilo qrcode-monkey):
   módulos en círculo, esquinas redondeadas y nivel de corrección H para que el
   logo no impida leerlo. Se dibuja en SVG: nítido en pantalla, PDF e impresión. */

const MARGEN = 1; // módulos de margen blanco alrededor
const RADIO_PUNTO = 0.46;

/* Rectángulo redondeado como trazo SVG. */
const rr = (x, y, w, h, r) =>
  `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
  `H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;

const calcular = (valor) => {
  const { modules } = QRCode.create(String(valor), { errorCorrectionLevel: 'H' });
  const n = modules.size;
  const enOjo = (f, c) => (f < 7 && c < 7) || (f < 7 && c >= n - 7) || (f >= n - 7 && c < 7);

  // Hueco circular para el logo (≈ 23 % del ancho; el nivel H tolera hasta 30 % de daño).
  const centro = n / 2;
  const radioLogo = n * 0.115;
  const hueco = radioLogo + 0.75;

  let puntos = '';
  for (let f = 0; f < n; f += 1) {
    for (let c = 0; c < n; c += 1) {
      if (!modules.get(f, c) || enOjo(f, c)) continue;
      const cx = c + 0.5;
      const cy = f + 0.5;
      if (Math.hypot(cx - centro, cy - centro) < hueco) continue;
      const x = cx + MARGEN;
      const y = cy + MARGEN;
      puntos += `M${(x - RADIO_PUNTO).toFixed(2)},${y}a${RADIO_PUNTO},${RADIO_PUNTO} 0 1,0 ${RADIO_PUNTO * 2},0a${RADIO_PUNTO},${RADIO_PUNTO} 0 1,0 ${-RADIO_PUNTO * 2},0`;
    }
  }

  // Ojos: marco redondeado de 7×7 y centro redondeado de 3×3.
  const ojos = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ].map(([c, f]) => {
    const x = c + MARGEN;
    const y = f + MARGEN;
    return {
      marco: rr(x, y, 7, 7, 2.3) + rr(x + 1, y + 1, 5, 5, 1.5),
      centro: rr(x + 2, y + 2, 3, 3, 0.9),
    };
  });

  return { lado: n + MARGEN * 2, puntos, ojos, centro: centro + MARGEN, radioLogo };
};

const QRPuntos = ({ valor, tamano = 160, color = '#000', fondo = '#fff', className = '', titulo = 'Código QR' }) => {
  const qr = useMemo(() => calcular(valor), [valor]);
  const { lado, puntos, ojos, centro, radioLogo } = qr;

  return (
    <svg
      viewBox={`0 0 ${lado} ${lado}`}
      width={tamano}
      height={tamano}
      role="img"
      aria-label={titulo}
      className={className}
      shapeRendering="geometricPrecision"
      style={{ display: 'block' }}
    >
      <rect width={lado} height={lado} fill={fondo} />
      <path d={puntos} fill={color} />
      {ojos.map((ojo, i) => (
        <g key={i} fill={color}>
          <path d={ojo.marco} fillRule="evenodd" />
          <path d={ojo.centro} />
        </g>
      ))}
      <circle cx={centro} cy={centro} r={radioLogo + 0.35} fill={fondo} />
      <image
        href={logoQR}
        x={centro - radioLogo}
        y={centro - radioLogo}
        width={radioLogo * 2}
        height={radioLogo * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
};

export default QRPuntos;
