import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="w-full border-t border-zinc-200 px-6 py-6 text-xs text-zinc-400 sm:px-10">
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <p className="text-zinc-500">
        Meridian Registry lets couples create and share a beautifully designed marriage certificate keepsake, from
        anywhere.
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link to="/privacy" className="underline underline-offset-2 hover:text-zinc-600">
          Privacy &amp; Cookies
        </Link>
        <span>© {new Date().getFullYear()} Meridian Registry</span>
      </div>
    </div>
  </footer>
);

export default Footer;
