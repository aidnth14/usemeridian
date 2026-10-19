// All generation libraries are dynamically imported here so none of them
// touch the initial page-weight budget - they only load when a download
// button is actually clicked.

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadAsPng(imageDataUrl: string, filename: string) {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('could not encode PNG');
  triggerDownload(blob, filename);
}

async function toPngDataUrl(img: HTMLImageElement): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function downloadAsPdf(imageDataUrl: string, filename: string) {
  const img = await loadImage(imageDataUrl);
  // jsPDF's WEBP support is unreliable across versions - go through PNG instead.
  const pngDataUrl = await toPngDataUrl(img);
  const { jsPDF } = await import('jspdf');
  const orientation = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'px', format: [img.naturalWidth, img.naturalHeight] });
  doc.addImage(pngDataUrl, 'PNG', 0, 0, img.naturalWidth, img.naturalHeight);
  doc.save(filename);
}

export async function downloadAsDocx(imageDataUrl: string, filename: string) {
  const img = await loadImage(imageDataUrl);
  const { Document, Packer, Paragraph, ImageRun, AlignmentType } = await import('docx');

  // docx needs a format it can embed reliably - convert to PNG via canvas
  // regardless of the source format (webp isn't universally supported in Word).
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0);
  const pngBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!pngBlob) throw new Error('could not encode PNG for docx');
  const imageBuffer = await pngBlob.arrayBuffer();

  // Fit the image to a standard page width while preserving aspect ratio.
  const maxWidth = 500;
  const scale = Math.min(1, maxWidth / img.naturalWidth);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: 'png',
                data: imageBuffer,
                transformation: {
                  width: Math.round(img.naturalWidth * scale),
                  height: Math.round(img.naturalHeight * scale),
                },
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename);
}
