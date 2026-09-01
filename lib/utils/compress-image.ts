export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Stop shrinking once the JPEG is at or below this size. */
  maxBytes?: number;
};

const DEFAULTS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.72,
  maxBytes: 350_000,
} as const;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function scaleToFit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

function drawToCanvas(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress image");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress image"));
      },
      "image/jpeg",
      quality
    );
  });
}

function closeBitmap(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source && typeof source.close === "function") {
    source.close();
  }
}

/**
 * Resize and JPEG-compress an image in the browser, returning a data URL.
 * Falls back to the original file if the browser cannot decode it (e.g. HEIC).
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return blobToDataUrl(file);
  }

  const maxWidth = options.maxWidth ?? DEFAULTS.maxWidth;
  const maxHeight = options.maxHeight ?? DEFAULTS.maxHeight;
  const maxBytes = options.maxBytes ?? DEFAULTS.maxBytes;
  let quality = options.quality ?? DEFAULTS.quality;

  try {
    const bitmap = await loadBitmap(file);
    let { width, height } = scaleToFit(bitmap.width, bitmap.height, maxWidth, maxHeight);
    let blob = await canvasToJpegBlob(drawToCanvas(bitmap, width, height), quality);

    while (blob.size > maxBytes && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.1);
      blob = await canvasToJpegBlob(drawToCanvas(bitmap, width, height), quality);
    }

    while (blob.size > maxBytes && Math.max(width, height) > 640) {
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
      blob = await canvasToJpegBlob(drawToCanvas(bitmap, width, height), quality);
    }

    closeBitmap(bitmap);
    return blobToDataUrl(blob);
  } catch {
    return blobToDataUrl(file);
  }
}
