import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="w-full border-t border-zinc-200 px-6 py-6 text-xs text-zinc-400 sm:px-10">
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <p className="text-zinc-500">
        Meridian is an unofficial, just-for-fun way for couples (online or in person) to create a memorable keepsake
        together. It is not a legal document and does not register, license, or certify a marriage in any
        jurisdiction.
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link to="/privacy" className="underline underline-offset-2 hover:text-zinc-600">
          Privacy &amp; Cookies
        </Link>
        <span>© {new Date().getFullYear()} Meridian Registry · For entertainment purposes only</span>
      </div>
    </div>
  </footer>
);

export default Footer;
