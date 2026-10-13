import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Errors } from "./http";

/**
 * Local-disk image uploads for self-hosted deployments. Files are stored
 * outside /public (in ./storage/uploads) and served by /uploads/[file].
 * On serverless hosts with ephemeral disks, swap this module for object
 * storage (S3, Cloudinary, …) — see README "Product images".
 */

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const TYPES = {
  "image/jpeg": { ext: "jpg", magic: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b: Buffer) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
} as const;

export const FILE_NAME_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

export const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Validates type (by declared MIME *and* magic bytes) and size, then stores the file. SVG is deliberately not allowed. */
export async function saveUpload(file: File): Promise<string> {
  const spec = TYPES[file.type as keyof typeof TYPES];
  if (!spec) throw Errors.validation("Only JPEG, PNG or WebP images are allowed");
  if (file.size > MAX_UPLOAD_BYTES) throw Errors.validation("Images must be 5 MB or smaller");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!spec.magic(buffer)) throw Errors.validation("The file content does not match its image type");
  const name = `${randomBytes(16).toString("hex")}.${spec.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

export async function readUpload(name: string): Promise<Buffer | null> {
  if (!FILE_NAME_RE.test(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}
