import React from 'react';
import clsx from 'clsx';
import { useRegistryForm } from '../context/RegistryFormContext';
import QRCodeSvg from './QRCodeSvg';

type Values = Record<string, string>;

const Blank: React.FC<{ value?: string; placeholder: string }> = ({ value, placeholder }) => {
  const trimmed = value?.trim();
  return (
    <span className={clsx('border-b border-slate-400 px-[1px]', trimmed ? 'text-slate-800' : 'text-slate-300')}>
      {trimmed || placeholder}
    </span>
  );
};

// All sizes here are in the certificate's fixed design space (see CertificateStage) -
// no responsive breakpoints, because the whole certificate is scaled as a unit.
export const CertificateOverlay: React.FC<{ values: Values; certKey?: string; shareUrl?: string }> = ({
  values,
  certKey,
  shareUrl,
}) => {
  const v = (id: string) => values[id];
  const groomSignature = v('groom-signature');
  const brideSignature = v('bride-signature');

  return (
    <div
      className="pointer-events-none absolute inset-0 flex select-none flex-col px-[9%] pb-[11%]"
      style={{ fontFamily: "'Malevice Inkbleed', serif" }}
    >
      {shareUrl && (
        <div className="absolute left-[6.5%] top-[5%] text-slate-700">
          <QRCodeSvg value={shareUrl} size={48} />
        </div>
      )}
      {certKey && (
        <p className="absolute right-[6.5%] top-[5.5%] font-mono text-[9px] tracking-wide text-slate-400">
          No. {certKey}
        </p>
      )}

      <div className="flex shrink-0 flex-col items-center pt-[74px] text-center">
        <p className="text-[12px] uppercase tracking-[0.25em] text-slate-400">Meridian Registry</p>
        <p className="mt-[2%] text-[23px] font-semibold uppercase tracking-wide text-slate-700">
          Certificate of Marriage
        </p>
      </div>

      <p className="mt-[6%] text-left text-[12px] leading-[1.75] text-slate-600">
        This is to certify that <Blank value={v('groom-legal-name')} placeholder="groom's legal name" />,{' '}
        <Blank value={v('groom-sex')} placeholder="sex" />, born{' '}
        <Blank value={v('groom-birthdate')} placeholder="birthdate" />, of{' '}
        <Blank value={v('groom-nationality')} placeholder="nationality" /> nationality and{' '}
        <Blank value={v('groom-religion')} placeholder="faith" /> faith, son of{' '}
        <Blank value={v('groom-father-name')} placeholder="father's name" />, and{' '}
        <Blank value={v('bride-legal-name')} placeholder="bride's legal name" />,{' '}
        <Blank value={v('bride-sex')} placeholder="sex" />, born{' '}
        <Blank value={v('bride-birthdate')} placeholder="birthdate" />, of{' '}
        <Blank value={v('bride-nationality')} placeholder="nationality" /> nationality and{' '}
        <Blank value={v('bride-religion')} placeholder="faith" /> faith, daughter of{' '}
        <Blank value={v('bride-father-name')} placeholder="father's name" />, were united in lawful marriage with
        mutual consent, recorded by the Meridian Registry.
      </p>

      <div className="mt-auto flex flex-col gap-[5%]">
        <div className="text-left text-[12px] leading-[1.75] text-slate-600">
          <p>
            The groom resides at <Blank value={v('groom-address-1')} placeholder="address line 1" />,{' '}
            <Blank value={v('groom-address-2')} placeholder="address line 2" />,{' '}
            <Blank value={v('groom-postal-code')} placeholder="postal code" />, reachable at{' '}
            <Blank value={v('groom-email')} placeholder="email" /> or{' '}
            <Blank value={v('groom-phone')} placeholder="phone" />.
          </p>
          <p className="mt-[3%]">
            The bride resides at <Blank value={v('bride-address-1')} placeholder="address line 1" />,{' '}
            <Blank value={v('bride-address-2')} placeholder="address line 2" />,{' '}
            <Blank value={v('bride-postal-code')} placeholder="postal code" />, reachable at{' '}
            <Blank value={v('bride-email')} placeholder="email" /> or{' '}
            <Blank value={v('bride-phone')} placeholder="phone" />.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-[6%] text-left">
          <div className="border-t border-slate-400 pt-[10px]">
            <p
              className={
                groomSignature?.trim()
                  ? 'overflow-visible whitespace-nowrap text-[26px] leading-[1.4] text-slate-800'
                  : 'text-[13px] italic text-slate-300'
              }
              style={groomSignature?.trim() ? { fontFamily: "'Dalton White', cursive" } : undefined}
            >
              {groomSignature?.trim() || 'Groom signature'}
            </p>
            <p className="mt-[10px] text-[9px] uppercase tracking-wide text-slate-500">Signature of Groom</p>
          </div>
          <div className="border-t border-slate-400 pt-[10px]">
            <p
              className={
                brideSignature?.trim()
                  ? 'overflow-visible whitespace-nowrap text-[26px] leading-[1.4] text-slate-800'
                  : 'text-[13px] italic text-slate-300'
              }
              style={brideSignature?.trim() ? { fontFamily: "'Dalton White', cursive" } : undefined}
            >
              {brideSignature?.trim() || 'Bride signature'}
            </p>
            <p className="mt-[10px] text-[9px] uppercase tracking-wide text-slate-500">Signature of Bride</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Convenience wrapper for the live editor, which reads from RegistryFormContext.
// previewMeta is only set briefly right before a snapshot capture, so the QR
// code/key number appear in the image even though no certificate exists yet
// at that point otherwise.
export const LiveCertificateOverlay: React.FC = () => {
  const { values, previewMeta } = useRegistryForm();
  return <CertificateOverlay values={values} certKey={previewMeta?.certKey} shareUrl={previewMeta?.shareUrl} />;
};

export default CertificateOverlay;
