import React from 'react';
import clsx from 'clsx';

// The certificate is authored once at this fixed "design" resolution, then the
// whole thing is scaled with a single CSS transform to fit whatever space it's
// rendered into. That makes it pixel-identical (just scaled) on mobile, on
// desktop, and in downloads - instead of the old approach where the background
// scaled responsively but the text and seal stayed fixed-px and went wildly
// out of proportion on small screens.
export const BASE_W = 760;
export const BASE_H = 976;
export const SEAL_SIZE = 150;

export type SealTransform = { x: number; y: number; scale: number; rotation: number };

export function sealDesignTransform(seal: SealTransform): string {
  // x/y are stored as fractions of half the design dimension, so a saved
  // position reproduces identically regardless of the rendered size.
  const dx = seal.x * (BASE_W / 2);
  const dy = seal.y * (BASE_H / 2);
  return `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${seal.rotation}deg) scale(${seal.scale})`;
}

type Props = {
  left: number;
  top: number;
  scale: number;
  seal: SealTransform;
  overlay: React.ReactNode;
  sealRef?: React.Ref<HTMLImageElement>;
  interactive?: boolean;
};

export const CertificateStage: React.FC<Props> = ({ left, top, scale, seal, overlay, sealRef, interactive }) => (
  <div
    className="absolute origin-top-left"
    style={{ left, top, width: BASE_W, height: BASE_H, transform: `scale(${scale})` }}
  >
    <img
      src="/assets/certificate-bg.webp"
      alt="Meridian certificate"
      draggable={false}
      className="absolute inset-0 h-full w-full select-none object-contain"
    />
    {/* Seal renders beneath the text layer (DOM order) at 65% opacity. */}
    <img
      ref={sealRef}
      src="/assets/seal.webp"
      alt="Meridian registry seal"
      draggable={false}
      className={clsx('absolute left-1/2 top-1/2 select-none opacity-65', interactive && 'cursor-grab touch-none')}
      style={{ width: SEAL_SIZE, height: SEAL_SIZE, transform: sealDesignTransform(seal) }}
    />
    <div className="absolute inset-0">{overlay}</div>
  </div>
);

export default CertificateStage;
