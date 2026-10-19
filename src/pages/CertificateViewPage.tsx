import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCertificate, flattenCertificateValues, type CertificateRecord } from '../lib/api';
import CertificateOverlay from '../components/CertificateOverlay';
import { useContainedRect } from '../hooks/useContainedRect';
import { useElementSize } from '../hooks/useElementSize';

const CERTIFICATE_ASPECT = 760 / 976;

export const CertificateViewPage: React.FC = () => {
  const { idnum } = useParams<{ idnum: string }>();
  const [cert, setCert] = useState<CertificateRecord | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const certificateRect = useContainedRect(containerRef, CERTIFICATE_ASPECT);
  const containerSize = useElementSize(containerRef);

  useEffect(() => {
    if (!idnum) return;
    const cleanId = idnum.replace(/^id\./, '');
    getCertificate(cleanId)
      .then(setCert)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificate'));
  }, [idnum]);

  if (error) {
    return (
      <StatusPage message={error} tone="error" />
    );
  }

  if (cert === undefined) {
    return <StatusPage message="Loading certificate..." tone="neutral" />;
  }

  if (cert === null) {
    return <StatusPage message="No certificate found for this link." tone="neutral" />;
  }

  const values = flattenCertificateValues(cert);
  const sealX = cert.seal.x * (containerSize.width / 2);
  const sealY = cert.seal.y * (containerSize.height / 2);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-white px-4 py-10">
      <div ref={containerRef} className="relative aspect-[760/976] w-full max-w-[420px] overflow-hidden">
        <img
          src="/assets/certificate-bg.webp"
          alt="Meridian certificate"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-contain"
        />
        <img
          src="/assets/seal.webp"
          alt="Meridian registry seal"
          draggable={false}
          className="absolute left-1/2 top-1/2 h-24 w-24 select-none opacity-65 md:h-32 md:w-32"
          style={{
            transform: `translate(-50%, -50%) translate(${sealX}px, ${sealY}px) rotate(${cert.seal.rotation}deg) scale(${cert.seal.scale})`,
          }}
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
          <CertificateOverlay
            values={values}
            certKey={cert.key}
            shareUrl={`${window.location.origin}/cert/id.${cert.id}`}
          />
        </div>
      </div>
      <Link to="/" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
        Generate your own certificate
      </Link>
    </div>
  );
};

const StatusPage: React.FC<{ message: string; tone: 'error' | 'neutral' }> = ({ message, tone }) => (
  <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-white px-6 text-center">
    <p className={`text-sm ${tone === 'error' ? 'text-red-600' : 'text-zinc-500'}`}>{message}</p>
    <Link to="/" className="text-sm text-zinc-600 underline underline-offset-2">
      Back to Meridian Registry
    </Link>
  </div>
);

export default CertificateViewPage;
