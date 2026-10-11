/** Profile photos (decisions 20, A6): JPEG, PNG or WebP, at most 5 MB, stored as uploaded. */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export type PhotoFormat = "jpeg" | "png" | "webp";

export const PHOTO_MIME: Record<PhotoFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const PHOTO_EXTENSION: Record<PhotoFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

/** Detects the format from the file's magic bytes; the browser-supplied MIME type is not trusted. */
export function detectPhotoFormat(bytes: Uint8Array): PhotoFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "webp";
  }
  return null;
}

export function photoFormatFromFilename(filename: string): PhotoFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "jpeg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    default:
      return null;
  }
}
