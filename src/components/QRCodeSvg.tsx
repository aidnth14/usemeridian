import React, { useMemo } from 'react';
import QRCode from 'qrcode';

// @types/qrcode only types the high-level toCanvas/toDataURL/toString helpers,
// not the low-level matrix API we want (renders crisper and lighter as raw SVG
// rects than asking the library to produce and then re-parsing an SVG string).
type QRModules = { size: number; data: Uint8Array };
const createMatrix = (QRCode as unknown as { create: (text: string, opts?: object) => { modules: QRModules } })
  .create;

export const QRCodeSvg: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 64,
  className,
}) => {
  const modules = useMemo(() => createMatrix(value, { errorCorrectionLevel: 'M' }).modules, [value]);
  const n = modules.size;
  // QR spec requires a quiet zone of >= 4 modules on every side - without it,
  // scanners can't lock onto the finder patterns at all (verified: a matrix
  // rendered with no margin failed to decode even though the data was correct).
  const margin = 4;
  const total = n + margin * 2;

  const cells = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (modules.data[row * n + col]) {
          out.push(<rect key={row * n + col} x={col + margin} y={row + margin} width={1} height={1} />);
        }
      }
    }
    return out;
  }, [modules, n]);

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="QR code linking to this certificate"
    >
      <rect width={total} height={total} fill="white" />
      <g fill="currentColor">{cells}</g>
    </svg>
  );
};

export default QRCodeSvg;
