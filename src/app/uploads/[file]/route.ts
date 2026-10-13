import { CONTENT_TYPES, readUpload } from "@/server/uploads";

export const dynamic = "force-dynamic";

/** Serves uploaded product images from ./storage/uploads. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = await readUpload(file);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = file.split(".").pop()!;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
