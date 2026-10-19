import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Full-id lookup only - no partial matching, no autocomplete, no "search as you
// type" suggestions. Those would let someone probe for valid id prefixes and
// shrink the effective search space; requiring the exact id (and, to actually
// decrypt anything, the key fragment) keeps the full entropy intact. This is
// pure client-side parsing - it never queries the server for anything short
// of the exact id the user already has, same as navigating the link directly.
// Normalizes just the id portion (digits + letters) to the stored casing -
// the key fragment after #k= is base64url and must be left exactly as pasted.
function normalizeIdAndFragment(idAndFragment: string): string | null {
  const [idPart, ...rest] = idAndFragment.split('#');
  if (!/^\d{16}[A-Za-z]{4}$/.test(idPart)) return null;
  const normalizedId = idPart.slice(0, 16) + idPart.slice(16).toUpperCase();
  const fragment = rest.length ? `#${rest.join('#')}` : '';
  return normalizedId + fragment;
}

function parseCertificateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Accepts a pasted full share link (with or without the #k= fragment)...
  const match = trimmed.match(/cert\/id\.([0-9A-Za-z]+(?:#k=[\w-]+)?)/);
  const candidate = match ? match[1] : trimmed.replace(/^#/, '');

  const normalized = normalizeIdAndFragment(candidate);
  return normalized ? `/cert/id.${normalized}` : null;
}

export const CertificateSearch: React.FC = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseCertificateInput(value);
    if (!target) {
      setError('Paste the full certificate ID or share link - partial IDs can\'t be looked up.');
      return;
    }
    setError(null);
    navigate(target);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <label htmlFor="cert-search" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Already have a certificate?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="cert-search"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste the full certificate ID or link"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none transition-colors duration-200 ease-out focus:border-zinc-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-zinc-700"
        >
          Find
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
};

export default CertificateSearch;
