"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

type UploadResponse = { ok: true; data: { path: string } } | { ok: false; error?: { message?: string } };

/** Uploads JPEG/PNG/WebP images (validated again on the server) and manages their order. The first image is the main photo. */
export function ImageUploader({ value, onChange, max = 8 }: { value: string[]; onChange: (next: string[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function upload(files: FileList) {
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(`Only ${room} more image${room === 1 ? "" : "s"} can be added.`);
    const added: string[] = [];
    setUploading(list.length);
    for (const file of list) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5 MB.`);
        setUploading((n) => n - 1);
        continue;
      }
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/admin/uploads", { method: "POST", body: form, credentials: "same-origin" });
        const json = (await res.json().catch(() => null)) as UploadResponse | null;
        if (json?.ok) added.push(json.data.path);
        else toast.error(`${file.name}: ${json?.error?.message ?? "upload failed"}`);
      } catch {
        toast.error(`${file.name}: upload failed`);
      }
      setUploading((n) => n - 1);
    }
    if (added.length) onChange([...value, ...added]);
  }

  return (
    <div className="space-y-3">
      {value.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((src, i) => (
            <li key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-card">
              <Image src={src} alt={`Image ${i + 1}`} fill sizes="100px" className="object-contain p-1" />
              {i === 0 ? <span className="absolute bottom-1 left-1 rounded bg-navy-950 px-1.5 text-[10px] font-semibold text-white">Main</span> : null}
              <div className="absolute top-1 right-1 flex gap-1">
                {i > 0 ? (
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded bg-white/90 shadow"
                    aria-label={`Move image ${i + 1} earlier`}
                    onClick={() => {
                      const next = [...value];
                      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                      onChange(next);
                    }}
                  >
                    <ArrowLeft className="size-3.5" />
                  </button>
                ) : null}
                <button type="button" className="flex size-6 items-center justify-center rounded bg-white/90 text-danger shadow" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                  <X className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No images yet. Products without images show a neutral placeholder.</p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        id="image-upload"
        onChange={(e) => {
          if (e.target.files?.length) void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <button type="button" className="btn-outline btn-sm w-full" disabled={uploading > 0 || value.length >= max} onClick={() => input.current?.click()}>
        <ImagePlus className="size-4" aria-hidden />
        {uploading > 0 ? `Uploading ${uploading}…` : value.length >= max ? `Maximum ${max} images` : "Upload images"}
      </button>
      <p className="text-xs text-muted">JPEG, PNG or WebP, up to 5 MB each. Square photos on a white background look best.</p>
    </div>
  );
}
