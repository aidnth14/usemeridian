import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => (
  <div className="mx-auto w-full max-w-2xl px-6 py-12 text-sm leading-relaxed text-zinc-700 sm:px-10">
    <Link to="/" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
      Back to Meridian Registry
    </Link>

    <h1 className="mt-6 text-xl font-semibold text-zinc-900">Privacy &amp; Cookies</h1>

    <p className="mt-4 text-zinc-600">
      Meridian is an unofficial, for-fun way for couples - online or in person - to create a memorable keepsake
      together. It is a playful act, not a legal filing. Nothing generated here registers, licenses, or certifies a
      marriage in any jurisdiction, and it carries no legal weight.
    </p>

    <h2 className="mt-8 text-base font-semibold text-zinc-900">How your data is handled</h2>
    <p className="mt-2 text-zinc-600">
      Every certificate you create is encrypted in your browser before it ever leaves your device, using a key that
      is generated locally and only ever travels inside your share link (after the <code>#</code> character, which
      browsers never send to any server). Our server stores only the resulting ciphertext - it does not hold the key
      and cannot read the names, dates, or any other details you enter. The same applies to anyone with direct
      database access, including us. If a share link is lost, the certificate behind it cannot be recovered or read
      by anyone, including Meridian.
    </p>
    <p className="mt-2 text-zinc-600">
      Because the encryption is authenticated, any attempt to alter stored data - by us or anyone else - makes it
      fail to decrypt rather than silently showing different content.
    </p>

    <h2 className="mt-8 text-base font-semibold text-zinc-900">Cookies &amp; local storage</h2>
    <p className="mt-2 text-zinc-600">
      We don't use advertising or tracking cookies. We use your browser's local storage only to remember that you've
      seen this notice. No data is shared with third parties for marketing purposes.
    </p>

    <h2 className="mt-8 text-base font-semibold text-zinc-900">What we do collect</h2>
    <p className="mt-2 text-zinc-600">
      When a certificate is created, we record the originating IP address and a timestamp, kept separately from the
      certificate's encrypted content, for basic abuse prevention. This is never linked back to the encrypted content
      itself.
    </p>
  </div>
);

export default PrivacyPolicyPage;
