"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError, applyFieldErrors, errorMessage } from "@/lib/api-client";
import { slugify } from "@/lib/utils";
import { productInputSchema, type ProductFormValues, type ProductInput } from "@/schemas/admin";
import { ImageUploader } from "./image-uploader";

type CategoryOption = { id: string; name: string; isActive: boolean };

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  sku: "",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  images: [],
  specifications: [],
  isActive: true,
  isFeatured: false,
  variants: [{ name: "Standard", sku: "", priceOverride: "", stock: 0, isActive: true }],
};

function msg(e: unknown): string | undefined {
  return (e as { message?: string } | undefined)?.message;
}

export function ProductForm({ productId, categories, initial }: { productId?: string; categories: CategoryOption[]; initial?: ProductFormValues }) {
  const router = useRouter();
  const isNew = !productId;
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: initial ?? EMPTY,
  });
  const variants = useFieldArray({ control, name: "variants" });
  const specs = useFieldArray({ control, name: "specifications" });

  async function onValid() {
    setFormError(null);
    // Send the raw form values (naira strings): the API parses and converts them itself.
    const body = getValues();
    try {
      const res = await api<{ id: string }>(isNew ? "/api/admin/products" : `/api/admin/products/${productId}`, { method: isNew ? "POST" : "PUT", body });
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) router.replace(`/admin/products/${res.id}`);
      else reset(body);
      router.refresh();
    } catch (err) {
      const field = err instanceof ApiClientError ? (err.details as { field?: string } | undefined)?.field : undefined;
      if (field) setError(field as never, { message: errorMessage(err) });
      else if (!applyFieldErrors(err, setError)) setFormError(errorMessage(err));
      toast.error(errorMessage(err));
    }
  }

  function onInvalid(errs: FieldErrors<ProductFormValues>) {
    setFormError("Some fields need attention — see the messages highlighted below.");
    const first = Object.keys(errs)[0];
    if (first) document.getElementsByName(first)[0]?.focus();
  }

  const inv = (e: unknown) => (e ? { "aria-invalid": true as const } : {});

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card animate-fade-up space-y-4 p-6">
          <h2 className="font-semibold">Details</h2>
          <div>
            <label htmlFor="p-name" className="label">
              Product name
            </label>
            <input
              id="p-name"
              className="input"
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false });
                },
              })}
              {...inv(errors.name)}
            />
            <FieldError e={errors.name} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-brand" className="label">
                Brand
              </label>
              <input id="p-brand" className="input" {...register("brand")} {...inv(errors.brand)} />
              <FieldError e={errors.brand} />
            </div>
            <div>
              <label htmlFor="p-categoryId" className="label">
                Category
              </label>
              <select id="p-categoryId" className="input" {...register("categoryId")} {...inv(errors.categoryId)}>
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isActive ? "" : " (hidden)"}
                  </option>
                ))}
              </select>
              <FieldError e={errors.categoryId} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-slug" className="label">
                URL slug
              </label>
              <input id="p-slug" className="input font-mono" {...register("slug", { onChange: () => setSlugTouched(true) })} {...inv(errors.slug)} />
              <p className="mt-1 text-xs text-muted">Used in the product link: /product/{"{slug}"}</p>
              <FieldError e={errors.slug} />
            </div>
            <div>
              <label htmlFor="p-sku" className="label">
                Product SKU <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="p-sku" className="input font-mono uppercase" {...register("sku")} {...inv(errors.sku)} />
              <FieldError e={errors.sku} />
            </div>
          </div>
          <div>
            <label htmlFor="p-description" className="label">
              Description
            </label>
            <textarea id="p-description" rows={6} className="input" {...register("description")} {...inv(errors.description)} />
            <FieldError e={errors.description} />
          </div>
        </section>

        <section className="card animate-fade-up space-y-4 p-6">
          <h2 className="font-semibold">Pricing (₦)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-price" className="label">
                Price
              </label>
              <input id="p-price" inputMode="decimal" placeholder="e.g. 450000" className="input" {...register("price")} {...inv(errors.price)} />
              <FieldError e={errors.price} />
            </div>
            <div>
              <label htmlFor="p-compareAtPrice" className="label">
                Previous price <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="p-compareAtPrice" inputMode="decimal" className="input" {...register("compareAtPrice")} {...inv(errors.compareAtPrice)} />
              <p className="mt-1 text-xs text-muted">Only if the product was genuinely sold at this higher price. Shown crossed out.</p>
              <FieldError e={errors.compareAtPrice} />
            </div>
          </div>
        </section>

        <section className="card animate-fade-up space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Variants & stock</h2>
              <p className="text-xs text-muted">Each purchasable option (e.g. storage or colour). Simple products keep one “Standard” variant.</p>
            </div>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => variants.append({ name: "", sku: "", priceOverride: "", stock: 0, isActive: true })}
              disabled={variants.fields.length >= 30}
            >
              <Plus className="size-4" aria-hidden /> Add variant
            </button>
          </div>
          <FieldError e={errors.variants} />
          <FieldError e={errors.variants?.root} />
          <div className="space-y-3">
            {variants.fields.map((f, i) => {
              const ve = errors.variants?.[i];
              return (
                <fieldset key={f.id} className="rounded-xl border border-line p-3">
                  <legend className="px-1 text-xs font-medium text-muted">Variant {i + 1}</legend>
                  <input type="hidden" {...register(`variants.${i}.id`)} />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_0.7fr_auto]">
                    <div>
                      <label htmlFor={`v-${i}-name`} className="label text-xs">
                        Name
                      </label>
                      <input id={`v-${i}-name`} placeholder="256GB / Black" className="input" {...register(`variants.${i}.name`)} {...inv(ve?.name)} />
                      <FieldError e={ve?.name} />
                    </div>
                    <div>
                      <label htmlFor={`v-${i}-sku`} className="label text-xs">
                        SKU
                      </label>
                      <input id={`v-${i}-sku`} className="input font-mono uppercase" {...register(`variants.${i}.sku`)} {...inv(ve?.sku)} />
                      <FieldError e={ve?.sku} />
                    </div>
                    <div>
                      <label htmlFor={`v-${i}-price`} className="label text-xs">
                        Price (if different)
                      </label>
                      <input id={`v-${i}-price`} inputMode="decimal" placeholder="Base price" className="input" {...register(`variants.${i}.priceOverride`)} {...inv(ve?.priceOverride)} />
                      <FieldError e={ve?.priceOverride} />
                    </div>
                    <div>
                      <label htmlFor={`v-${i}-stock`} className="label text-xs">
                        Stock
                      </label>
                      <input id={`v-${i}-stock`} type="number" min={0} inputMode="numeric" className="input" {...register(`variants.${i}.stock`)} {...inv(ve?.stock)} />
                      <FieldError e={ve?.stock} />
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" className="size-4 accent-gold-500" {...register(`variants.${i}.isActive`)} /> On sale
                      </label>
                      <button type="button" className="btn-ghost btn-sm text-danger" aria-label={`Remove variant ${i + 1}`} disabled={variants.fields.length <= 1} onClick={() => variants.remove(i)}>
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </fieldset>
              );
            })}
          </div>
          {!isNew ? <p className="text-xs text-muted">Stock changes are logged as inventory adjustments. Removing a variant that appears in past orders hides it instead of deleting it.</p> : null}
        </section>

        <section className="card animate-fade-up space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Specifications</h2>
            <button type="button" className="btn-outline btn-sm" onClick={() => specs.append({ label: "", value: "" })} disabled={specs.fields.length >= 40}>
              <Plus className="size-4" aria-hidden /> Add row
            </button>
          </div>
          {specs.fields.length ? (
            <ul className="space-y-2">
              {specs.fields.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <div>
                    <label htmlFor={`s-${i}-label`} className="sr-only">
                      Specification {i + 1} label
                    </label>
                    <input id={`s-${i}-label`} placeholder="e.g. Battery" className="input" {...register(`specifications.${i}.label`)} {...inv(errors.specifications?.[i]?.label)} />
                    <FieldError e={errors.specifications?.[i]?.label} />
                  </div>
                  <div>
                    <label htmlFor={`s-${i}-value`} className="sr-only">
                      Specification {i + 1} value
                    </label>
                    <input id={`s-${i}-value`} placeholder="e.g. 5000 mAh" className="input" {...register(`specifications.${i}.value`)} {...inv(errors.specifications?.[i]?.value)} />
                    <FieldError e={errors.specifications?.[i]?.value} />
                  </div>
                  <button type="button" className="btn-ghost btn-sm text-danger" aria-label={`Remove specification ${i + 1}`} onClick={() => specs.remove(i)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No specifications yet. Add key facts such as screen size, memory and battery.</p>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Visibility</h2>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-gold-500" {...register("isActive")} />
            <span>
              <span className="font-medium">Visible in store</span>
              <span className="block text-xs text-muted">Hidden products can&apos;t be viewed or ordered.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-gold-500" {...register("isFeatured")} />
            <span>
              <span className="font-medium">Featured</span>
              <span className="block text-xs text-muted">Shown on the homepage.</span>
            </span>
          </label>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Images</h2>
          <Controller control={control} name="images" render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} max={8} />} />
          <FieldError e={errors.images} />
        </section>

        <div className="card sticky bottom-4 space-y-3 p-5 xl:top-6 xl:bottom-auto">
          {formError ? (
            <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          {!isNew && !isDirty ? <p className="text-center text-xs text-muted">No unsaved changes</p> : null}
        </div>
      </div>
    </form>
  );
}

function FieldError({ e }: { e: unknown }) {
  const m = msg(e);
  return m ? <p className="field-error">{m}</p> : null;
}
