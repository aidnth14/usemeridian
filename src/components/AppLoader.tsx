import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import LoadingScreen from './LoadingScreen';

const MIN_DURATION_MS = 1800;

export const AppLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [minDurationDone, setMinDurationDone] = useState(false);
  const [assetLoaded, setAssetLoaded] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(true);
  const reduceMotion = useRef(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationDone(true), MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minDurationDone && assetLoaded && !fadingOut) {
      setFadingOut(true);
      if (reduceMotion.current) setOverlayMounted(false);
    }
  }, [minDurationDone, assetLoaded, fadingOut]);

  return (
    <>
      {children}
      {overlayMounted && (
        <div
          className={clsx(
            'fixed inset-0 z-50 flex items-center justify-center bg-white',
            'transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
          )}
          onTransitionEnd={() => fadingOut && setOverlayMounted(false)}
        >
          <LoadingScreen onLoaded={() => setAssetLoaded(true)} />
        </div>
      )}
    </>
  );
};

export default AppLoader;
