import React, { useEffect, useRef } from 'react';
import RegistryForm from './components/RegistryForm';
import Footer from './components/Footer';
import CertificateSearch from './components/CertificateSearch';
import { LiveCertificateOverlay } from './components/CertificateOverlay';
import { CertificateStage, BASE_W, BASE_H, SEAL_SIZE } from './components/CertificateStage';
import { useRegistryForm } from './context/RegistryFormContext';
import { useContainedRect } from './hooks/useContainedRect';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;
const MIN_ROTATION = -45;
const MAX_ROTATION = 45;
const CERTIFICATE_ASPECT = BASE_W / BASE_H;

type Gesture = { cx: number; cy: number; dist: number; angle: number };

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const certWrapperRef = useRef<HTMLDivElement | null>(null);
  const sealRef = useRef<HTMLImageElement>(null);
  const certificateRect = useContainedRect(containerRef, CERTIFICATE_ASPECT);
  const { sealTransformRef, certificateNodeRef } = useRegistryForm();
  const stageScale = certificateRect.width > 0 ? certificateRect.width / BASE_W : 0;
  // The seal element only exists once the stage renders (scale > 0, after the
  // ResizeObserver reports a real size), so the drag/gesture listeners must
  // attach then - not on the initial mount, when sealRef is still null.
  const stageReady = stageScale > 0;

  useEffect(() => {
    const seal = sealRef.current;
    if (!seal) return;

    // Everything below works in the certificate's design-pixel space; the parent
    // stage transform scales it to screen. Screen deltas are divided by the
    // current render scale so a drag/pinch feels 1:1 regardless of device size.
    let { x, y, scale, rotation } = {
      x: sealTransformRef.current.x * (BASE_W / 2),
      y: sealTransformRef.current.y * (BASE_H / 2),
      scale: sealTransformRef.current.scale,
      rotation: sealTransformRef.current.rotation,
    };

    const pointers = new Map<number, { x: number; y: number }>();
    let prevGesture: Gesture | null = null;
    let dragPrev: { x: number; y: number } | null = null;

    const currentScale = () => {
      const w = certWrapperRef.current?.clientWidth ?? BASE_W;
      return w > 0 ? w / BASE_W : 1;
    };

    const clampPosition = () => {
      const halfW = (SEAL_SIZE / 2) * scale;
      const halfH = (SEAL_SIZE / 2) * scale;
      x = clamp(x, -(BASE_W / 2 - halfW), BASE_W / 2 - halfW);
      y = clamp(y, -(BASE_H / 2 - halfH), BASE_H / 2 - halfH);
    };

    const render = () => {
      seal.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
      sealTransformRef.current = { x: x / (BASE_W / 2), y: y / (BASE_H / 2), scale, rotation };
    };

    const computeGesture = (): Gesture => {
      const [a, b] = [...pointers.values()];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return { cx, cy, dist: Math.hypot(dx, dy), angle: (Math.atan2(dy, dx) * 180) / Math.PI };
    };

    const onPointerDown = (e: PointerEvent) => {
      seal.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragPrev = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        prevGesture = computeGesture();
        dragPrev = null;
      }
      seal.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s = currentScale();

      if (pointers.size === 1 && dragPrev) {
        x += (e.clientX - dragPrev.x) / s;
        y += (e.clientY - dragPrev.y) / s;
        dragPrev = { x: e.clientX, y: e.clientY };
        clampPosition();
        render();
      } else if (pointers.size >= 2 && prevGesture) {
        const g = computeGesture();
        if (prevGesture.dist > 0) {
          scale = clamp(scale * (g.dist / prevGesture.dist), MIN_SCALE, MAX_SCALE);
        }
        let dAngle = g.angle - prevGesture.angle;
        if (dAngle > 180) dAngle -= 360;
        if (dAngle < -180) dAngle += 360;
        rotation = clamp(rotation + dAngle, MIN_ROTATION, MAX_ROTATION);
        x += (g.cx - prevGesture.cx) / s;
        y += (g.cy - prevGesture.cy) / s;
        prevGesture = g;
        clampPosition();
        render();
      }
    };

    const endPointer = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      try {
        seal.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer may already be released */
      }
      if (pointers.size < 2) prevGesture = null;
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        dragPrev = { x: p.x, y: p.y };
      } else {
        dragPrev = null;
      }
      if (pointers.size === 0) seal.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        rotation = clamp(rotation - e.deltaY * 0.15, MIN_ROTATION, MAX_ROTATION);
      } else {
        scale = clamp(scale - e.deltaY * 0.001, MIN_SCALE, MAX_SCALE);
      }
      clampPosition();
      render();
    };

    seal.addEventListener('pointerdown', onPointerDown);
    seal.addEventListener('pointermove', onPointerMove);
    seal.addEventListener('pointerup', endPointer);
    seal.addEventListener('pointercancel', endPointer);
    seal.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      seal.removeEventListener('pointerdown', onPointerDown);
      seal.removeEventListener('pointermove', onPointerMove);
      seal.removeEventListener('pointerup', endPointer);
      seal.removeEventListener('pointercancel', endPointer);
      seal.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageReady]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white md:h-dvh md:flex-row md:overflow-hidden">
      <div
        ref={containerRef}
        className="relative my-[15px] ml-[10px] h-96 w-[calc(100%-10px)] shrink-0 overflow-hidden sm:h-[28rem] md:h-[calc(100dvh-30px)] md:w-[calc(42%+25px)]"
      >
        <div
          ref={certWrapperRef}
          className="absolute overflow-hidden"
          style={{
            left: certificateRect.left,
            top: certificateRect.top,
            width: certificateRect.width,
            height: certificateRect.height,
          }}
        >
          {stageReady && (
            <CertificateStage
              left={0}
              top={0}
              scale={stageScale}
              seal={sealTransformRef.current}
              sealRef={sealRef}
              interactive
              overlay={<LiveCertificateOverlay />}
            />
          )}
        </div>
      </div>

      {/* Off-screen full-resolution copy, used only to rasterize the archival
          snapshot - capturing the on-screen transform:scale()'d copy with
          html2canvas is unreliable, so this clean scale=1 version is captured
          instead. */}
      <div aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 h-0 w-0 overflow-hidden">
        <div ref={certificateNodeRef} className="relative" style={{ width: BASE_W, height: BASE_H }}>
          <CertificateStage
            left={0}
            top={0}
            scale={1}
            seal={sealTransformRef.current}
            overlay={<LiveCertificateOverlay />}
          />
        </div>
      </div>
      <div className="flex-1 md:h-[calc(100dvh-30px)] md:overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 px-6 py-[15px] sm:px-10 lg:px-14">
          <CertificateSearch />
          <div className="h-px bg-zinc-200" />
          <RegistryForm />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default App;
