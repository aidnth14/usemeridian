import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useRegistryForm } from '../context/RegistryFormContext';
import { createCertificate } from '../lib/api';
import LoadingScreen from './LoadingScreen';

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  options?: string[];
  span2?: boolean;
  required?: boolean;
};

const labelBase =
  'pointer-events-none absolute left-0 text-zinc-500 transition-all duration-300 ease-out motion-reduce:transition-none';
const restingLabel = 'top-1/2 left-3 -translate-y-1/2 text-sm';
const floatedLabel = 'top-0 text-xs';

const inputBase =
  'peer w-full appearance-none bg-transparent text-sm text-zinc-900 outline-none transition-all duration-300 ease-out motion-reduce:transition-none';
const boxShape = 'rounded-md border border-zinc-300 px-3 pb-2.5 pt-2.5';
const lineShape = 'rounded-none border-0 border-b border-zinc-300 px-0 pb-2 pt-5';

// Native date/time inputs always render their own "mm/dd/yyyy" style hint and
// never match :placeholder-shown reliably, so they stay permanently floated.
const NATIVE_HINT_TYPES = new Set(['date', 'time', 'month', 'week']);

const Field: React.FC<FieldProps> = ({ id, label, type = 'text', options, span2, required = true }) => {
  const { setValue } = useRegistryForm();

  // Selects have no :placeholder-shown, so track their state in React instead.
  const [selectFilled, setSelectFilled] = useState(false);
  const [selectFocused, setSelectFocused] = useState(false);
  const selectActive = selectFocused || selectFilled;

  if (options) {
    return (
      <div className={clsx('relative', span2 && 'sm:col-span-2')}>
        <select
          id={id}
          name={id}
          defaultValue=""
          required={required}
          onFocus={() => setSelectFocused(true)}
          onChange={(e) => setValue(id, e.target.value)}
          onBlur={(e) => {
            setSelectFocused(false);
            setSelectFilled(e.target.value !== '');
          }}
          className={clsx(inputBase, selectActive ? lineShape : boxShape, selectActive ? 'pr-5' : 'pr-8')}
        >
          <option value="" disabled hidden />
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          strokeWidth={1.5}
          className={clsx(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-all duration-300 ease-out motion-reduce:transition-none',
            selectActive ? 'right-0' : 'right-3'
          )}
        />
        <label htmlFor={id} className={clsx(labelBase, selectActive ? floatedLabel : restingLabel)}>
          {label}
        </label>
      </div>
    );
  }

  if (NATIVE_HINT_TYPES.has(type)) {
    return (
      <div className={clsx('relative', span2 && 'sm:col-span-2')}>
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          onChange={(e) => setValue(id, e.target.value)}
          className={clsx(inputBase, lineShape)}
        />
        <label htmlFor={id} className={clsx(labelBase, floatedLabel)}>
          {label}
        </label>
      </div>
    );
  }

  // Text-like inputs: driven purely by CSS (:focus / :placeholder-shown) so
  // browser autofill, which never fires React's blur handler, still floats the label.
  return (
    <div className={clsx('relative', span2 && 'sm:col-span-2')}>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder=" "
        onChange={(e) => setValue(id, e.target.value)}
        className={clsx(
          inputBase,
          'placeholder:text-transparent',
          boxShape,
          'focus:rounded-none focus:border-x-0 focus:border-t-0 focus:border-zinc-900 focus:px-0 focus:pb-2 focus:pt-5',
          '[&:not(:placeholder-shown)]:rounded-none [&:not(:placeholder-shown)]:border-x-0 [&:not(:placeholder-shown)]:border-t-0 [&:not(:placeholder-shown)]:px-0 [&:not(:placeholder-shown)]:pb-2 [&:not(:placeholder-shown)]:pt-5'
        )}
      />
      <label
        htmlFor={id}
        className={clsx(
          labelBase,
          restingLabel,
          'peer-focus:left-0 peer-focus:top-0 peer-focus:translate-y-0 peer-focus:text-xs',
          'peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
        )}
      >
        {label}
      </label>
    </div>
  );
};

const PersonFields: React.FC<{ title: string; prefix: string }> = ({ title, prefix }) => (
  <section className="space-y-6">
    <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
      <Field id={`${prefix}-legal-name`} label="Legal name" />
      <Field id={`${prefix}-birthdate`} label="Birthdate" type="date" />
      <Field id={`${prefix}-email`} label="Email" type="email" />
      <Field id={`${prefix}-phone`} label="Phone" type="tel" />
      <Field id={`${prefix}-father-name`} label="Father's name" />
      <Field id={`${prefix}-religion`} label="Religion" />
      <Field id={`${prefix}-sex`} label="Sex" options={['Male', 'Female']} />
      <Field id={`${prefix}-nationality`} label="Nationality" />
      <Field id={`${prefix}-address-1`} label="Address line 1" span2 />
      <Field id={`${prefix}-address-2`} label="Address line 2 (optional)" span2 required={false} />
      <Field id={`${prefix}-postal-code`} label="Postal code" />
      <Field id={`${prefix}-signature`} label="Signature" span2 />
    </div>
  </section>
);

export const RegistryForm: React.FC = () => {
  const { values, sealTransformRef, certificateNodeRef } = useRegistryForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureCertificateImage = async (): Promise<string | null> => {
    const node = certificateNodeRef.current;
    if (!node) return null;
    try {
      // Wait for custom @font-face fonts to finish loading - otherwise html2canvas
      // can rasterize with the fallback font still showing.
      await document.fonts.ready;
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(node, { backgroundColor: null, useCORS: true, scale: 2 });
      return canvas.toDataURL('image/webp', 0.85);
    } catch (err) {
      console.error('Certificate snapshot failed, continuing without it', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const image = await captureCertificateImage();
      const { id } = await createCertificate(values, sealTransformRef.current, image);
      navigate(`/cert/id.${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-10">
      <PersonFields title="Groom" prefix="groom" />
      <div className="h-px bg-zinc-200" />
      <PersonFields title="Bride" prefix="bride" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img src="/assets/gavel-white.png" alt="" className="h-4 w-4" />
        {submitting ? 'Generating...' : 'Generate Certificate'}
      </button>

      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white">
          <LoadingScreen />
          <p className="text-xs text-zinc-400">Sealing your certificate...</p>
        </div>
      )}
    </form>
  );
};

export default RegistryForm;
