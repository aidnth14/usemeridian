import React, { useEffect, useRef } from 'react';
import RegistryForm from './components/RegistryForm';
import { LiveCertificateOverlay } from './components/CertificateOverlay';
import { useRegistryForm } from './context/RegistryFormContext';
import { useContainedRect } from './hooks/useContainedRect';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;
const MIN_ROTATION = -45;
const MAX_ROTATION = 45;
const CERTIFICATE_ASPECT = 760 / 976;

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLImageElement>(null);
  const certificateRect = useContainedRect(containerRef, CERTIFICATE_ASPECT);
  const { sealTransformRef } = useRegistryForm();

  useEffect(() => {
    const container = containerRef.current;
    const seal = sealRef.current;
    if (!container || !seal) return;

    let dragging = false;
    let x = 0;
    let y = 0;
    let rotation = 0;
    let scale = 1;
    let originX = 0;
    let originY = 0;
    let startX = 0;
    let startY = 0;

    const render = () => {
      seal.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
      // Persist x/y as a fraction of the container's own half-size, not raw px,
      // so the saved position reproduces correctly in a differently-sized viewer.
      const rect = container.getBoundingClientRect();
      sealTransformRef.current = {
        x: rect.width ? x / (rect.width / 2) : 0,
        y: rect.height ? y / (rect.height / 2) : 0,
        scale,
        rotation,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originX = x;
      originY = y;
      seal.setPointerCapture(e.pointerId);
      seal.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const containerRect = container.getBoundingClientRect();
      const halfW = (seal.offsetWidth / 2) * scale;
      const halfH = (seal.offsetHeight / 2) * scale;

      const nextX = originX + (e.clientX - startX);
      const nextY = originY + (e.clientY - startY);

      x = clamp(nextX, -containerRect.width / 2 + halfW, containerRect.width / 2 - halfW);
      y = clamp(nextY, -containerRect.height / 2 + halfH, containerRect.height / 2 - halfH);
      render();
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      seal.style.cursor = 'grab';
      seal.releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        rotation = clamp(rotation - e.deltaY * 0.15, MIN_ROTATION, MAX_ROTATION);
      } else {
        scale = clamp(scale - e.deltaY * 0.001, MIN_SCALE, MAX_SCALE);
      }
      render();
    };

    seal.addEventListener('pointerdown', onPointerDown);
    seal.addEventListener('pointermove', onPointerMove);
    seal.addEventListener('pointerup', onPointerUp);
    seal.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      seal.removeEventListener('pointerdown', onPointerDown);
      seal.removeEventListener('pointermove', onPointerMove);
      seal.removeEventListener('pointerup', onPointerUp);
      seal.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white md:h-dvh md:flex-row md:overflow-hidden">
      <div
        ref={containerRef}
        className="relative my-[15px] ml-[10px] h-48 w-[calc(100%-10px)] shrink-0 overflow-hidden md:h-[calc(100dvh-30px)] md:w-[calc(42%+25px)]"
      >
        <img
          key="certificate-image"
          src="/assets/certificate-bg.webp"
          alt="Meridian certificate"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
        <img
          key="seal-image"
          ref={sealRef}
          src="/assets/seal.webp"
          alt="Meridian registry seal"
          draggable={false}
          className="absolute left-1/2 top-1/2 h-24 w-24 touch-none select-none cursor-grab opacity-65 md:h-32 md:w-32"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute',
            top: certificateRect.top,
            left: certificateRect.left,
            width: certificateRect.width,
            height: certificateRect.height,
          }}
        >
          <LiveCertificateOverlay />
        </div>
      </div>
      <div className="flex-1 px-6 py-[15px] sm:px-10 lg:px-14 md:h-[calc(100dvh-30px)] md:overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <RegistryForm />
      </div>
    </div>
  );
};

export default App;
