import { useMemo } from 'react';
import QRCode from 'qrcode';
import logoQR from '../../img/LogoI.webp?inline';

const MARGEN = 1;
const RADIO_PUNTO = 0.46;

const rectanguloRedondeado = (x, y, ancho, alto, radio) =>
  `M${x + radio},${y}H${x + ancho - radio}A${radio},${radio} 0 0 1 ${x + ancho},${y + radio}` +
  `V${y + alto - radio}A${radio},${radio} 0 0 1 ${x + ancho - radio},${y + alto}` +
  `H${x + radio}A${radio},${radio} 0 0 1 ${x},${y + alto - radio}V${y + radio}` +
  `A${radio},${radio} 0 0 1 ${x + radio},${y}Z`;

const calcularQR = (valor) => {
  const { modules } = QRCode.create(String(valor), { errorCorrectionLevel: 'H' });
  const n = modules.size;
  const esOjo = (fila, columna) =>
    (fila < 7 && columna < 7) ||
    (fila < 7 && columna >= n - 7) ||
    (fila >= n - 7 && columna < 7);

  const centro = n / 2;
  const radioLogo = n * 0.115;
  const huecoLogo = radioLogo + 0.75;
  let puntos = '';

  for (let fila = 0; fila < n; fila += 1) {
    for (let columna = 0; columna < n; columna += 1) {
      if (!modules.get(fila, columna) || esOjo(fila, columna)) continue;
      const cx = columna + 0.5;
      const cy = fila + 0.5;
      if (Math.hypot(cx - centro, cy - centro) < huecoLogo) continue;
      const x = cx + MARGEN;
      const y = cy + MARGEN;
      puntos +=
        `M${(x - RADIO_PUNTO).toFixed(2)},${y}` +
        `a${RADIO_PUNTO},${RADIO_PUNTO} 0 1,0 ${RADIO_PUNTO * 2},0` +
        `a${RADIO_PUNTO},${RADIO_PUNTO} 0 1,0 ${-RADIO_PUNTO * 2},0`;
    }
  }

  const ojos = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ].map(([columna, fila]) => {
    const x = columna + MARGEN;
    const y = fila + MARGEN;
    return {
      marco:
        rectanguloRedondeado(x, y, 7, 7, 2.3) +
        rectanguloRedondeado(x + 1, y + 1, 5, 5, 1.5),
      centro: rectanguloRedondeado(x + 2, y + 2, 3, 3, 0.9),
    };
  });

  return { lado: n + MARGEN * 2, puntos, ojos, centro: centro + MARGEN, radioLogo };
};

const QRPuntos = ({ valor, tamano = 160, color = '#141414', fondo = '#fff', className = '', titulo = 'Código QR' }) => {
  const qr = useMemo(() => calcularQR(valor), [valor]);

  return (
    <svg
      viewBox={`0 0 ${qr.lado} ${qr.lado}`}
      width={tamano}
      height={tamano}
      role="img"
      aria-label={titulo}
      className={className}
      shapeRendering="geometricPrecision"
      style={{ display: 'block' }}
    >
      <rect width={qr.lado} height={qr.lado} fill={fondo} />
      <path d={qr.puntos} fill={color} />
      {qr.ojos.map((ojo, indice) => (
        <g key={indice} fill={color}>
          <path d={ojo.marco} fillRule="evenodd" />
          <path d={ojo.centro} />
        </g>
      ))}
      <circle cx={qr.centro} cy={qr.centro} r={qr.radioLogo + 0.35} fill={fondo} />
      <image
        href={logoQR}
        x={qr.centro - qr.radioLogo}
        y={qr.centro - qr.radioLogo}
        width={qr.radioLogo * 2}
        height={qr.radioLogo * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
};

export default QRPuntos;
