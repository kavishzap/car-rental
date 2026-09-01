import { compressImageToDataUrl, type CompressImageOptions } from "@/lib/utils/compress-image";

export async function fileToBase64(
  file: File,
  options?: CompressImageOptions
): Promise<string> {
  return compressImageToDataUrl(file, options);
}
