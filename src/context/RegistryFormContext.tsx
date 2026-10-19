import React, { createContext, useContext, useRef, useState } from 'react';

type Values = Record<string, string>;

export type SealTransform = { x: number; y: number; scale: number; rotation: number };
export type PreviewMeta = { certKey: string; shareUrl: string } | null;

type RegistryFormContextValue = {
  values: Values;
  setValue: (id: string, value: string) => void;
  // A ref (not state) so continuous drag/resize/rotate updates never trigger a
  // re-render - the "Generate Certificate" action just reads .current at submit time.
  sealTransformRef: React.MutableRefObject<SealTransform>;
  // Points at the live certificate preview DOM node so it can be rasterized
  // (html2canvas) at submit time - captures exactly what the editor rendered,
  // sidestepping any live-reconstruction layout bugs on the view page.
  certificateNodeRef: React.MutableRefObject<HTMLDivElement | null>;
  // Set briefly right before capture so the editor's QR code/key number render
  // with the real (pre-generated) share link, then cleared back to null after -
  // otherwise the snapshot would be taken before any link exists to encode.
  previewMeta: PreviewMeta;
  setPreviewMeta: (meta: PreviewMeta) => void;
};

const RegistryFormContext = createContext<RegistryFormContextValue | null>(null);

export const RegistryFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [values, setValues] = useState<Values>({});
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta>(null);
  const sealTransformRef = useRef<SealTransform>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const certificateNodeRef = useRef<HTMLDivElement | null>(null);

  const setValue = (id: string, value: string) => {
    setValues((prev) => (prev[id] === value ? prev : { ...prev, [id]: value }));
  };

  return (
    <RegistryFormContext.Provider
      value={{ values, setValue, sealTransformRef, certificateNodeRef, previewMeta, setPreviewMeta }}
    >
      {children}
    </RegistryFormContext.Provider>
  );
};

export const useRegistryForm = () => {
  const ctx = useContext(RegistryFormContext);
  if (!ctx) throw new Error('useRegistryForm must be used within a RegistryFormProvider');
  return ctx;
};
