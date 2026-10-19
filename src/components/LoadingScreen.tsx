import React, { useEffect, useRef } from 'react';

// Ported from a standalone canvas sprite-rig: a single illustration is cut into
// named body parts, each rotated/scaled per frame from continuous sine functions
// of elapsed time. Being time-driven (not frame-counted) the walk cycle has no
// seams or resets to stutter at - smoothness here comes from the transform math,
// not from easing tricks layered on top.
const K = 2;
const OX = 150;
const OY = 70;
const TAU = Math.PI * 2;
const { sin, cos } = Math;

type Pt = [number, number];

const R = (a: number, b: number, c: number, d: number): Pt[] => [
  [a, b],
  [c, b],
  [c, d],
  [a, d],
];

type FrameFn = (u: number, t: number) => { r?: number; sy?: number };

const leg = (ph: number, k: number): [FrameFn, FrameFn] => [
  (u) => ({ r: 0.11 * sin(TAU * (u + ph)) }),
  (u) => ({ r: k * Math.max(0, -cos(TAU * (u + ph))) + 0.04 * sin(TAU * (u + ph) + 1) }),
];

const [fa, fb] = leg(0, 0.32);
const [fc] = leg(0.25, 0.3);
const [fe, ff] = leg(0.5, 0.32);
const [fg, fh] = leg(0.75, 0.3);

type Part = {
  id: string;
  p: Pt[];
  pv: Pt;
  par?: string;
  f?: FrameFn;
  wave?: { a: number; w: number; amp: number; flag?: number };
};

const P: Part[] = [
  { id: 'hips', p: R(204, 320, 250, 404), pv: [250, 362], f: (u) => ({ r: 0.018 * sin(TAU * u * 2) }) },
  {
    id: 'tail',
    p: R(172, 320, 204, 404),
    pv: [199, 328],
    par: 'hips',
    f: (u, t) => ({ r: 0.1 * sin(TAU * u - 0.8) + 0.05 * sin(t * 3.1) }),
  },
  { id: 'hf1', p: R(170, 404, 216, 438), pv: [202, 404], par: 'hips', f: fa },
  { id: 'hf2', p: R(170, 438, 216, 486), pv: [187, 438], par: 'hf1', f: fb },
  { id: 'hn1', p: R(217, 404, 264, 436), pv: [236, 404], par: 'hips', f: fe },
  { id: 'hn2', p: R(217, 436, 266, 478), pv: [240, 436], par: 'hn1', f: ff },
  { id: 'fs1', p: R(304, 400, 342, 432), pv: [322, 400], f: fg },
  { id: 'fs2', p: R(304, 432, 342, 494), pv: [322, 432], par: 'fs1', f: fh },
  { id: 'fr1', p: R(340, 392, 376, 406), pv: [344, 398], f: fc },
  {
    id: 'fr2',
    p: R(354, 406, 394, 462),
    pv: [368, 404],
    par: 'fr1',
    f: (u) => ({ r: 0.2 * sin(TAU * (u + 0.25) - 0.5) }),
  },
  { id: 'neck', p: R(313, 296, 356, 376), pv: [320, 352], f: (u) => ({ r: 0.03 * sin(TAU * u * 2 - 0.5) }) },
  {
    id: 'head',
    p: [
      [356, 294],
      [404, 294],
      [404, 380],
      [360, 380],
      [356, 360],
    ],
    pv: [358, 336],
    par: 'neck',
    f: (u) => ({ r: 0.06 * sin(TAU * u * 2 - 1.4) }),
  },
  { id: 'thigh', p: R(262, 326, 313, 356), pv: [284, 336], f: (u) => ({ r: 0.05 * sin(TAU * u + 0.5) }) },
  { id: 'shin', p: R(284, 356, 313, 404), pv: [302, 358], par: 'thigh', f: (u) => ({ r: 0.06 * sin(TAU * u + 1.3) }) },
  {
    id: 'torso',
    p: [
      [254, 254],
      [296, 254],
      [296, 300],
      [314, 300],
      [314, 326],
      [254, 326],
    ],
    pv: [280, 326],
    f: (u) => ({ r: 0.012 * sin(TAU * u * 2 + 0.6), sy: 1 + 0.017 * sin(TAU * u * 2 - 0.9) }),
  },
  { id: 'cape', p: R(212, 262, 254, 320), pv: [254, 270], par: 'torso', wave: { a: 254, w: 42, amp: 4 } },
  { id: 'kneck', p: R(256, 243, 296, 254), pv: [277, 254], par: 'torso', f: (u) => ({ r: 0.02 * sin(TAU * u * 2 + 0.2) }) },
  { id: 'helmet', p: R(256, 204, 296, 243), pv: [277, 243], par: 'kneck', f: (u) => ({ r: 0.05 * sin(TAU * u * 2 - 0.3) }) },
  { id: 'karm', p: R(296, 232, 314, 300), pv: [304, 298], par: 'torso', f: (u) => ({ r: 0.035 * sin(TAU * u * 2 + 1) }) },
  {
    id: 'lance',
    p: R(296, 84, 314, 232),
    pv: [305, 238],
    par: 'karm',
    f: (u, t) => ({ r: 0.025 * sin(TAU * u * 2 + 1.6) + 0.012 * sin(t * 1.3) }),
  },
  { id: 'flag', p: R(208, 96, 296, 176), pv: [296, 130], par: 'lance', wave: { a: 296, w: 88, amp: 7, flag: 1 } },
];

const ORDER = [
  'hf1', 'hf2', 'tail', 'BASE', 'hips', 'hn1', 'hn2', 'fs1', 'fs2', 'fr1', 'fr2',
  'neck', 'head', 'thigh', 'shin', 'torso', 'cape', 'kneck', 'helmet', 'karm', 'lance', 'flag',
];

const by: Record<string, Part> = {};
P.forEach((q) => (by[q.id] = q));

type PartRuntime = Part & { bx: number; by: number; bw: number; bh: number; sp: HTMLCanvasElement };

export const LoadingScreen: React.FC<{ onLoaded?: () => void }> = ({ onLoaded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let last = 0;
    let base: HTMLCanvasElement;
    const runtime: Record<string, PartRuntime> = {};
    const spd = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.4 : 1;

    const path = (g: CanvasRenderingContext2D, p: Pt[], ox: number, oy: number) => {
      g.beginPath();
      p.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo']((x - ox) * K, (y - oy) * K));
      g.closePath();
    };

    const xf = (q: Part) => {
      if (q.par) xf(by[q.par]);
      const a = q.f ? q.f(u, t) : {};
      ctx.translate(q.pv[0], q.pv[1]);
      ctx.rotate(a.r || 0);
      ctx.scale(1, a.sy || 1);
      ctx.translate(-q.pv[0], -q.pv[1]);
    };

    let u = 0;

    const drawPart = (q: PartRuntime) => {
      ctx.save();
      xf(q);
      if (!q.wave) {
        ctx.drawImage(q.sp, q.bx, q.by, q.bw, q.bh);
      } else {
        const w = q.wave;
        const gust = 0.5 + 0.5 * sin(t * 0.7);
        const amp = w.amp * (w.flag ? 0.7 + 0.6 * gust : 1 + 0.4 * gust);
        for (let x = q.bx; x < q.bx + q.bw; x += 2) {
          const d = (w.a - x) / w.w;
          const ph = d * (w.flag ? 6 : 5) - t * (w.flag ? 6.5 : 5.5);
          const dx = -d * (w.flag ? 3 : 2) * (1 + sin(ph));
          ctx.drawImage(
            q.sp,
            (x - q.bx) * K,
            0,
            2 * K,
            q.sp.height,
            x + dx,
            q.by + amp * d * sin(ph) + 1.5 * d * sin(t * 2.3 + d * 3),
            2,
            q.bh
          );
        }
      }
      ctx.restore();
    };

    const frame = (ms: number) => {
      const dt = Math.min(0.05, (ms - last) / 1000);
      last = ms;
      t += dt * spd;
      u = t / 1.0;
      const bob = sin(TAU * u * 2) * 1.6;
      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, 270, 435);
      ctx.translate(-OX, -OY);
      ctx.fillStyle = 'rgba(0,0,0,.07)';
      ctx.beginPath();
      ctx.ellipse(283, 488, 118, 6, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(0, bob);
      for (const id of ORDER) {
        if (id === 'BASE') ctx.drawImage(base, OX, OY, 270, 435);
        else drawPart(runtime[id]);
      }
      ctx.restore();
      raf = requestAnimationFrame(frame);
    };

    const im = new Image();
    im.onload = () => {
      base = document.createElement('canvas');
      base.width = im.width;
      base.height = im.height;
      const b = base.getContext('2d')!;
      b.drawImage(im, 0, 0);
      b.globalCompositeOperation = 'destination-out';

      P.forEach((q) => {
        path(b, q.p, OX, OY);
        b.fill();
        const xs = q.p.map((a) => a[0]);
        const ys = q.p.map((a) => a[1]);
        const bx = Math.min(...xs);
        const by_ = Math.min(...ys);
        const bw = Math.max(...xs) - bx;
        const bh = Math.max(...ys) - by_;
        const c = document.createElement('canvas');
        c.width = Math.ceil(bw * K);
        c.height = Math.ceil(bh * K);
        const g = c.getContext('2d')!;
        g.imageSmoothingEnabled = true;
        path(g, q.p, bx, by_);
        g.clip();
        g.drawImage(im, -(bx - OX) * K, -(by_ - OY) * K);
        runtime[q.id] = { ...q, bx, by: by_, bw, bh, sp: c };
      });

      onLoaded?.();
      raf = requestAnimationFrame(frame);
    };
    im.src = '/assets/knight-sprite.webp';

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={540}
      height={870}
      role="img"
      aria-label="Loading"
      className="aspect-[270/435] max-h-[70vh] max-w-[80vw]"
    />
  );
};

export default LoadingScreen;
