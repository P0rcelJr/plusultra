import { describe, expect, it } from "vitest";
import { detectPhotoFormat, photoFormatFromFilename } from "./photos";

describe("detectPhotoFormat", () => {
  it("recognises JPEG, PNG and WebP headers", () => {
    expect(detectPhotoFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("jpeg");
    expect(detectPhotoFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
    expect(detectPhotoFormat(webp)).toBe("webp");
  });

  it("rejects other content, including RIFF files that are not WebP", () => {
    expect(detectPhotoFormat(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBeNull(); // %PDF
    const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]);
    expect(detectPhotoFormat(wav)).toBeNull();
    expect(detectPhotoFormat(new Uint8Array([]))).toBeNull();
  });
});

describe("photoFormatFromFilename", () => {
  it("maps stored extensions back to a format", () => {
    expect(photoFormatFromFilename("abc.jpg")).toBe("jpeg");
    expect(photoFormatFromFilename("abc.PNG")).toBe("png");
    expect(photoFormatFromFilename("abc.webp")).toBe("webp");
    expect(photoFormatFromFilename("abc.gif")).toBeNull();
  });
});
