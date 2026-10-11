import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PHOTO_EXTENSION,
  PHOTO_MAX_BYTES,
  PHOTO_MIME,
  detectPhotoFormat,
  photoFormatFromFilename,
} from "@/domain/photos";

/** Uploaded files live on a disk volume outside the repo (decision 16); UPLOADS_DIR points at it. */
function uploadsRoot(): string {
  return path.resolve(process.env.UPLOADS_DIR ?? "uploads");
}

function photosDir(): string {
  return path.join(uploadsRoot(), "photos");
}

export type PhotoSaveResult = { ok: true; filename: string } | { ok: false; reason: "type" | "size" };

/**
 * Validates and stores a member's profile photo as `photos/<userId>.<ext>`, replacing any previous
 * file for that user. No resizing (decision 20).
 */
export async function savePhoto(userId: string, file: File): Promise<PhotoSaveResult> {
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, reason: "size" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectPhotoFormat(bytes);
  if (!format) return { ok: false, reason: "type" };

  const filename = `${userId}.${PHOTO_EXTENSION[format]}`;
  const dir = photosDir();
  await mkdir(dir, { recursive: true });
  await Promise.all(
    Object.values(PHOTO_EXTENSION)
      .filter((ext) => ext !== PHOTO_EXTENSION[format])
      .map((ext) => rm(path.join(dir, `${userId}.${ext}`), { force: true })),
  );
  await writeFile(path.join(dir, filename), bytes);
  return { ok: true, filename };
}

/** Reads a stored photo by its filename as recorded on the profile. */
export async function readPhoto(filename: string): Promise<{ bytes: Buffer; mime: string } | null> {
  // The filename comes from our own database, but guard against traversal regardless.
  if (path.basename(filename) !== filename) return null;
  const format = photoFormatFromFilename(filename);
  if (!format) return null;
  try {
    const bytes = await readFile(path.join(photosDir(), filename));
    return { bytes, mime: PHOTO_MIME[format] };
  } catch {
    return null;
  }
}
