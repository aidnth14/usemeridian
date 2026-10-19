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
import { CertificateStage, BASE_W, BASE_H } from '../components/CertificateStage';
import Footer from '../components/Footer';
import { useElementSize } from '../hooks/useElementSize';

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
  const size = useElementSize(containerRef);

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

  const values = cert ? flattenCertificateValues(cert) : {};
  const scale = size.width > 0 ? size.width / BASE_W : 0;

  const handleDownload = async (format: 'png' | 'pdf' | 'docx') => {
    if (!captureRef.current || !cert) return;
    setDownloading(format);
    try {
      await document.fonts.ready;
      const { default: html2canvas } = await import('html2canvas');
      // Capture the hidden scale=1 (760x976) copy at 2x for a crisp ~1520px
      // export, regardless of how small the on-screen certificate is.
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `meridian-certificate-${cert.key}`;
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
        className="relative aspect-[760/976] w-full max-w-[min(92vw,440px)] overflow-hidden"
      >
        {scale > 0 && cert && (
          <CertificateStage
            left={0}
            top={0}
            scale={scale}
            seal={cert.seal}
            overlay={
              <CertificateOverlay values={values} certKey={cert.key} shareUrl={`${SITE_URL}/cert/id.${cert.id}`} />
            }
          />
        )}
      </div>

      {/* Hidden full-resolution copy captured for downloads. */}
      {cert && (
        <div aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 h-0 w-0 overflow-hidden">
          <div ref={captureRef} className="relative" style={{ width: BASE_W, height: BASE_H }}>
            <CertificateStage
              left={0}
              top={0}
              scale={1}
              seal={cert.seal}
              overlay={
                <CertificateOverlay values={values} certKey={cert.key} shareUrl={`${SITE_URL}/cert/id.${cert.id}`} />
              }
            />
          </div>
        </div>
      )}

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

      {cert === undefined && !error && <p className="text-sm text-zinc-500">Loading certificate...</p>}

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
