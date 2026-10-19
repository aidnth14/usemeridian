import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'meridian-cookie-consent';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-600">
          This site is a fun, unofficial keepsake generator - not a legal document service. It uses local storage to
          remember this preference. See our{' '}
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy &amp; Cookies notice
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 ease-out hover:bg-zinc-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
