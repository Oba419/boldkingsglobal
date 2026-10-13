"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { slugify } from "@/lib/utils";
import { categoryInputSchema, type CategoryFormValues, type CategoryInput } from "@/schemas/admin";
import { ImageUploader } from "./image-uploader";

type Row = { id: string; name: string; slug: string; description: string | null; image: string | null; sortOrder: number; isActive: boolean; productCount: number };

const EMPTY: CategoryFormValues = { name: "", slug: "", description: "", image: "", sortOrder: 0, isActive: true };

export function CategoryManager({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | "new" | null>(categories.length ? null : "new");

  async function remove(c: Row) {
    if (!confirm(`Delete the category "${c.name}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      if (editing !== "new" && editing?.id === c.id) setEditing(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">All categories</h2>
          <button type="button" className="btn-primary btn-sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden /> New category
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface/70 text-left text-[11px] tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Products</th>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.length ? (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-line bg-card">
                          {c.image ? <Image src={c.image} alt="" fill sizes="36px" className="object-contain" /> : null}
                        </span>
                        <span>
                          <span className="block font-medium">{c.name}</span>
                          <span className="font-mono text-xs text-muted">/{c.slug}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{c.productCount}</td>
                    <td className="px-4 py-2.5">{c.sortOrder}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isActive ? "bg-success-bg text-success" : "bg-surface text-muted"}`}>{c.isActive ? "Visible" : "Hidden"}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-danger"
                        onClick={() => remove(c)}
                        disabled={c.productCount > 0}
                        title={c.productCount > 0 ? "Move or archive its products first" : undefined}
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No categories yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function CategoryForm({ category, onDone, onCancel }: { category: Row | null; onDone: () => void; onCancel: () => void }) {
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues, unknown, CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, description: category.description ?? "", image: category.image ?? "", sortOrder: category.sortOrder, isActive: category.isActive }
      : EMPTY,
  });

  async function onValid() {
    setFormError(null);
    try {
      await api(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", { method: category ? "PUT" : "POST", body: getValues() });
      toast.success(category ? "Category saved" : "Category created");
      onDone();
    } catch (err) {
      const field = err instanceof ApiClientError ? (err.details as { field?: string } | undefined)?.field : undefined;
      if (field) setError(field as never, { message: errorMessage(err) });
      else if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="card h-fit space-y-4 p-5">
      <h2 className="font-semibold">{category ? `Edit “${category.name}”` : "New category"}</h2>
      <div>
        <label htmlFor="c-name" className="label">
          Name
        </label>
        <input
          id="c-name"
          className="input"
          {...register("name", { onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value)) })}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
      </div>
      <div>
        <label htmlFor="c-slug" className="label">
          URL slug
        </label>
        <input id="c-slug" className="input font-mono" {...register("slug", { onChange: () => setSlugTouched(true) })} aria-invalid={errors.slug ? true : undefined} />
        {errors.slug ? <p className="field-error">{errors.slug.message}</p> : null}
      </div>
      <div>
        <label htmlFor="c-description" className="label">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea id="c-description" rows={3} className="input" {...register("description")} />
        {errors.description ? <p className="field-error">{errors.description.message}</p> : null}
      </div>
      <div>
        <p className="label">Image</p>
        <Controller
          control={control}
          name="image"
          render={({ field }) => <ImageUploader value={field.value ? [field.value] : []} onChange={(next) => field.onChange(next[next.length - 1] ?? "")} max={1} />}
        />
        {errors.image ? <p className="field-error">{errors.image.message}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-sortOrder" className="label">
            Display order
          </label>
          <input id="c-sortOrder" type="number" min={0} className="input" {...register("sortOrder")} />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" className="size-4 accent-gold-500" {...register("isActive")} /> Visible
        </label>
      </div>
      {formError ? (
        <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : category ? "Save" : "Create"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
