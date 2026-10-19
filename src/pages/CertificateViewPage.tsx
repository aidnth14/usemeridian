import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCertificate,
  flattenCertificateValues,
  SITE_URL,
  type RawCertificateRecord,
  type ResolvedCertificate,
} from '../lib/api';
import { importKey, decryptJSON, decryptString } from '../lib/crypto';
import { downloadAsPng, downloadAsPdf, downloadAsDocx } from '../lib/downloads';
import CertificateOverlay from '../components/CertificateOverlay';
import Footer from '../components/Footer';
import { useContainedRect } from '../hooks/useContainedRect';
import { useElementSize } from '../hooks/useElementSize';

const CERTIFICATE_ASPECT = 760 / 976;

async function resolveCertificate(raw: RawCertificateRecord): Promise<ResolvedCertificate> {
  const { id, key, certificateTemplate, sealTemplate, seal, createdAt } = raw;
  const base = { id, key, certificateTemplate, sealTemplate, seal, createdAt };

  if (!raw.encrypted) {
    return { ...base, groom: raw.groom, bride: raw.bride, imageData: raw.imageData };
  }

  const fragmentKey = new URLSearchParams(window.location.hash.slice(1)).get('k');
  if (!fragmentKey) {
    throw new Error('This link is missing its decryption key, so the certificate cannot be opened.');
  }

  try {
    const cryptoKey = await importKey(fragmentKey);
    const [groom, bride, imageData] = await Promise.all([
      decryptJSON<ResolvedCertificate['groom']>(cryptoKey, raw.groomCipher),
      decryptJSON<ResolvedCertificate['bride']>(cryptoKey, raw.brideCipher),
      raw.imageCipher ? decryptString(cryptoKey, raw.imageCipher) : Promise.resolve(null),
    ]);
    return { ...base, groom, bride, imageData };
  } catch {
    throw new Error(
      'This certificate could not be verified - the link may be wrong or the data may have been tampered with.'
    );
  }
}

export const CertificateViewPage: React.FC = () => {
  const { idnum } = useParams<{ idnum: string }>();
  const [cert, setCert] = useState<ResolvedCertificate | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'png' | 'pdf' | 'docx' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const certificateRect = useContainedRect(containerRef, CERTIFICATE_ASPECT);
  const containerSize = useElementSize(containerRef);

  useEffect(() => {
    if (!idnum) return;
    const cleanId = idnum.replace(/^id\./, '');
    getCertificate(cleanId)
      .then((raw) => (raw ? resolveCertificate(raw) : null))
      .then(setCert)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificate'));
  }, [idnum]);

  if (error) {
    return <StatusPage message={error} tone="error" />;
  }

  if (cert === null) {
    return <StatusPage message="No certificate found for this link." tone="neutral" />;
  }

  // Deliberately NOT early-returning while cert is still loading (undefined) -
  // the container below must mount on the very first render so containerRef
  // is attached before useContainedRect's effect runs. Early-returning here
  // was the actual cause of a nasty bug: the effect would run once against a
  // null ref, then never again, permanently freezing the overlay at 0x0.
  const values = cert ? flattenCertificateValues(cert) : {};
  const sealX = cert ? cert.seal.x * (containerSize.width / 2) : 0;
  const sealY = cert ? cert.seal.y * (containerSize.height / 2) : 0;

  const handleDownload = async (format: 'png' | 'pdf' | 'docx') => {
    if (!captureRef.current) return;
    setDownloading(format);
    try {
      await document.fonts.ready;
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(captureRef.current, { backgroundColor: null, useCORS: true, scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `meridian-certificate-${cert?.key ?? 'download'}`;
      if (format === 'png') await downloadAsPng(dataUrl, `${filename}.png`);
      if (format === 'pdf') await downloadAsPdf(dataUrl, `${filename}.pdf`);
      if (format === 'docx') await downloadAsDocx(dataUrl, `${filename}.docx`);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-6 bg-white px-4 py-6 sm:items-start sm:px-10 sm:py-10">
      <div
        ref={containerRef}
        className="relative aspect-[760/976] w-full max-w-[320px] overflow-hidden sm:max-w-[380px] md:max-w-[420px]"
      >
        <div ref={captureRef} className="absolute inset-0">
          <img
            src="/assets/certificate-bg.webp"
            alt="Meridian certificate"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-contain"
          />
          {cert && (
            <img
              src="/assets/seal.webp"
              alt="Meridian registry seal"
              draggable={false}
              className="absolute left-1/2 top-1/2 h-24 w-24 select-none opacity-65 md:h-32 md:w-32"
              style={{
                transform: `translate(-50%, -50%) translate(${sealX}px, ${sealY}px) rotate(${cert.seal.rotation}deg) scale(${cert.seal.scale})`,
              }}
            />
          )}
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
              certKey={cert?.key}
              shareUrl={cert ? `${SITE_URL}/cert/id.${cert.id}` : undefined}
            />
          </div>
        </div>
      </div>

      {cert && (
        <div className="flex flex-wrap gap-2">
          {(['png', 'pdf', 'docx'] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => handleDownload(format)}
              disabled={downloading !== null}
              className="rounded-md border border-zinc-300 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors duration-200 ease-out hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading === format ? 'Preparing...' : `Download ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      )}

      <Link to="/" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
        Generate your own certificate
      </Link>

      <div className="w-full">
        <Footer />
      </div>
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
