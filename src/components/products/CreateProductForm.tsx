import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { useToast } from "@/hooks/useToast";
import { InfiniteScrollSelect } from "@/components/common/InfiniteScrollSelect";
import { InfiniteScrollMultiSelect } from "@/components/common/InfiniteScrollMultiSelect";
import GenericButton from "@/components/common/GenericButton";
import { Input } from "@/components/ui/input";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "@/components/auth/create-product.schema";
import {
  createProduct,
  uploadProductImage,
  getAdminProducts,
  getAdminCategories,
  getAdminBrands,
  getAdminMaterials,
  getAdminAttributesPage,
  type Category,
  type AdminBrand,
  type AdminMaterial,
  type AdminAttribute,
  type AdminAttributeValue,
  type PageResponse,
} from "@/api/api";

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[60px]">
              <div
                className={cn(
                  "h-7 w-7 flex items-center justify-center text-xs font-store-body font-semibold border transition-colors",
                  done && "bg-stone-900 border-stone-900 text-white",
                  active && "bg-white border-stone-900 text-stone-900",
                  !done && !active && "bg-white border-stone-300 text-stone-400",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "text-[10px] font-store-body whitespace-nowrap",
                  active ? "text-stone-800 font-medium" : "text-stone-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-1 mb-4",
                  step > n ? "bg-stone-900" : "bg-stone-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-store-body text-xs font-semibold uppercase tracking-widest text-stone-500 pb-1 border-b border-stone-100">
      {children}
    </h3>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function FieldWrap({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-store-body text-stone-700 font-medium">
        {label}
        {optional && (
          <span className="ml-1 text-stone-400 font-normal">{t("optional")}</span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 font-store-body">{t(error)}</p>
      )}
    </div>
  );
}

// ─── Attribute value adder (per variant) ─────────────────────────────────────

interface AttrValueTag {
  attributeValueId: number;
  label: string;
}

interface AttributeValueAdderProps {
  tags: AttrValueTag[];
  onAdd: (tag: AttrValueTag) => void;
  onRemove: (attributeValueId: number) => void;
  fetchAttrsFn: (page: number, size: number) => Promise<PageResponse<AdminAttribute>>;
}

function AttributeValueAdder({
  tags,
  onAdd,
  onRemove,
  fetchAttrsFn,
}: AttributeValueAdderProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedAttr, setSelectedAttr] = useState<AdminAttribute | null>(null);
  const [selectedValue, setSelectedValue] = useState<AdminAttributeValue | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["admin", "attributes"],
      queryFn: ({ pageParam }) => fetchAttrsFn(pageParam as number, 20),
      initialPageParam: 0,
      getNextPageParam: (lastPage: PageResponse<AdminAttribute>) =>
        lastPage.last ? undefined : lastPage.page + 1,
      enabled: open,
    });

  const allAttributes = data?.pages.flatMap((p) => p.content) ?? [];

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 460),
        zIndex: 9999,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
        setSelectedAttr(null);
        setSelectedValue(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allAttributes.length]);

  const addedIds = new Set(tags.map((tag) => tag.attributeValueId));

  const handleAdd = () => {
    if (!selectedAttr || !selectedValue) return;
    if (addedIds.has(selectedValue.attributeValueId)) return;
    onAdd({
      attributeValueId: selectedValue.attributeValueId,
      label: `${selectedAttr.name}: ${selectedValue.value}`,
    });
    setOpen(false);
    setSelectedAttr(null);
    setSelectedValue(null);
  };

  const portalDropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{ ...dropdownStyle, pointerEvents: "auto" }}
          className="bg-white border border-stone-200 shadow-md rounded-none"
        >
          <div className="p-3 space-y-3">
            {/* Side-by-side: attribute list | value list */}
            <div className="flex gap-3">
              {/* Left: Attribute list */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-xs text-stone-500 font-store-body font-medium">
                  {t("selectAttribute")}
                </span>
                <div
                  className="max-h-40 overflow-y-auto border border-stone-200"
                  onWheelCapture={(e) => e.stopPropagation()}
                >
                  {allAttributes.map((attr) => (
                    <button
                      key={attr.attributeId}
                      type="button"
                      onClick={() => {
                        setSelectedAttr(attr);
                        setSelectedValue(null);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm font-store-body hover:bg-stone-50 transition-colors flex items-center justify-between gap-1",
                        selectedAttr?.attributeId === attr.attributeId &&
                          "bg-stone-100 font-medium",
                      )}
                    >
                      <span className="truncate">{attr.name}</span>
                      {selectedAttr?.attributeId === attr.attributeId && (
                        <Check className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                      )}
                    </button>
                  ))}
                  <div ref={sentinelRef} className="h-1" />
                  {isFetchingNextPage && (
                    <p className="px-3 py-1 text-xs text-stone-400 text-center font-store-body">
                      Cargando...
                    </p>
                  )}
                  {!isFetchingNextPage && allAttributes.length === 0 && (
                    <p className="px-3 py-2 text-xs text-stone-400 text-center font-store-body">
                      Sin atributos
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Value list */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-xs text-stone-500 font-store-body font-medium">
                  {t("selectValue")}
                </span>
                {selectedAttr ? (
                  <div
                    className="max-h-40 overflow-y-auto border border-stone-200"
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    {selectedAttr.attributeValues.map((val) => {
                      const disabled = addedIds.has(val.attributeValueId);
                      return (
                        <button
                          key={val.attributeValueId}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedValue(val)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm font-store-body hover:bg-stone-50 transition-colors flex items-center justify-between gap-1",
                            selectedValue?.attributeValueId ===
                              val.attributeValueId && "bg-stone-100 font-medium",
                            disabled && "opacity-40 cursor-not-allowed",
                          )}
                        >
                          <span className="truncate">{val.value}</span>
                          {selectedValue?.attributeValueId ===
                            val.attributeValueId && (
                            <Check className="h-3.5 w-3.5 text-stone-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {selectedAttr.attributeValues.length === 0 && (
                      <p className="px-3 py-2 text-xs text-stone-400 text-center font-store-body">
                        Sin valores
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-40 border border-stone-100 bg-stone-50 flex items-center justify-center">
                    <p className="px-3 py-4 text-xs text-stone-400 font-store-body text-center leading-relaxed">
                      Selecciona un<br />atributo primero
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedAttr || !selectedValue}
              onClick={handleAdd}
              className="w-full h-8 bg-stone-900 text-white text-xs font-store-body tracking-wide hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-none transition-colors"
            >
              {t("add")}
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag.attributeValueId}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-store-body bg-stone-100 border border-stone-300 text-stone-700 rounded-none"
          >
            {tag.label}
            <button
              type="button"
              aria-label={"Eliminar atributo " + tag.label}
              onClick={() => onRemove(tag.attributeValueId)}
              className="text-stone-400 hover:text-stone-700 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2 text-xs font-store-body border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors rounded-none",
            open && "border-stone-600 bg-stone-50",
          )}
        >
          <Plus className="h-3 w-3" />
          {t("addAttributeValue")}
          <ChevronDown
            className={cn(
              "h-3 w-3 text-stone-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>
      {portalDropdown}
    </div>
  );
}

// ─── Variant row ──────────────────────────────────────────────────────────────

interface VariantRowProps {
  index: number;
  canRemove: boolean;
  register: ReturnType<typeof useForm<CreateProductFormValues>>["register"];
  errors: ReturnType<typeof useForm<CreateProductFormValues>>["formState"]["errors"];
  attrTags: AttrValueTag[];
  onAddAttrTag: (tag: AttrValueTag) => void;
  onRemoveAttrTag: (id: number) => void;
  onRemove: () => void;
  fetchAttrsFn: (page: number, size: number) => Promise<PageResponse<AdminAttribute>>;
}

function VariantRow({
  index,
  canRemove,
  register,
  errors,
  attrTags,
  onAddAttrTag,
  onRemoveAttrTag,
  onRemove,
  fetchAttrsFn,
}: VariantRowProps) {
  const { t } = useTranslation();
  const variantErrors = errors.variants?.[index];

  return (
    <div className="border border-stone-200 p-4 space-y-4 rounded-none bg-stone-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-store-body font-semibold text-stone-600 uppercase tracking-wider">
          {t("variant")} {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-stone-400 hover:text-red-500 transition-colors"
            title={t("removeVariant")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FieldWrap label={t("sku")} error={variantErrors?.sku?.message}>
          <Input
            {...register(`variants.${index}.sku`)}
            placeholder="SKU-001"
            className="rounded-none h-9"
          />
        </FieldWrap>

        <FieldWrap label={t("price")} error={variantErrors?.price?.message}>
          <Input
            {...register(`variants.${index}.price`, { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="rounded-none h-9"
          />
        </FieldWrap>

        <FieldWrap
          label={t("discountPrice")}
          error={variantErrors?.discountPrice?.message}
          optional
        >
          <Input
            {...register(`variants.${index}.discountPrice`, {
              setValueAs: (v: string) =>
                v === "" || v === undefined ? null : Number(v),
            })}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="rounded-none h-9"
          />
        </FieldWrap>

        <FieldWrap label={t("stock")} error={variantErrors?.stock?.message}>
          <Input
            {...register(`variants.${index}.stock`, { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="0"
            className="rounded-none h-9"
          />
        </FieldWrap>

        <FieldWrap
          label={t("weightGrams")}
          error={variantErrors?.weightGrams?.message}
          optional
        >
          <Input
            {...register(`variants.${index}.weightGrams`, {
              setValueAs: (v: string) =>
                v === "" || v === undefined ? null : parseInt(v, 10),
            })}
            type="number"
            min="1"
            placeholder="0"
            className="rounded-none h-9"
          />
        </FieldWrap>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-store-body text-stone-700 font-medium">
          {t("attributeValues")}{" "}
          <span className="text-stone-400 font-normal">{t("optional")}</span>
        </span>
        <AttributeValueAdder
          tags={attrTags}
          onAdd={onAddAttrTag}
          onRemove={onRemoveAttrTag}
          fetchAttrsFn={fetchAttrsFn}
        />
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface CreateProductFormProps {
  onClose: () => void;
}

export default function CreateProductForm({ onClose }: CreateProductFormProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [brandLabel, setBrandLabel] = useState<string | undefined>();
  const [categoryLabel, setCategoryLabel] = useState<string | undefined>();
  const [materialLabels, setMaterialLabels] = useState<string[]>([]);

  const [attrTagsMap, setAttrTagsMap] = useState<Record<string, AttrValueTag[]>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
    control,
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      featured: false,
      materialIds: [],
      variants: [
        {
          sku: "",
          price: NaN,
          stock: NaN,
          discountPrice: null,
          weightGrams: null,
          attributeValueIds: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    setAttrTagsMap((prev) => {
      const updated = { ...prev };
      fields.forEach((f) => {
        if (!(f.id in updated)) updated[f.id] = [];
      });
      return updated;
    });
  }, [fields]);

  const watchedBrandId = watch("brandId");
  const watchedCategoryId = watch("categoryId");
  const watchedMaterialIds = watch("materialIds") ?? [];

  const fetchCategories = useCallback(
    (p: number, s: number, q: string) => getAdminCategories(p, s, q, user!.token),
    [user],
  );
  const fetchBrands = useCallback(
    (p: number, s: number, q: string) => getAdminBrands(p, s, q, user!.token),
    [user],
  );
  const fetchMaterials = useCallback(
    (p: number, s: number, q: string) => getAdminMaterials(p, s, q, user!.token),
    [user],
  );
  const fetchAttrs = useCallback(
    (p: number, s: number) => getAdminAttributesPage(p, s, user!.token),
    [user],
  );

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createProduct>[0]) =>
      createProduct(payload, user!.token),
  });

  const imageMutation = useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      uploadProductImage(productId, file, user!.token),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(["name", "shortDescription", "longDescription"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const onSubmit = async (data: CreateProductFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        shortDescription: data.shortDescription || null,
        longDescription: data.longDescription || null,
        status: "ACTIVE",
        featured: data.featured,
        brandId: data.brandId ?? null,
        categoryId: data.categoryId ?? null,
        materialIds: data.materialIds,
        variants: fields.map((field, idx) => ({
          sku: data.variants[idx].sku,
          price: data.variants[idx].price,
          discountPrice: data.variants[idx].discountPrice ?? null,
          stock: data.variants[idx].stock,
          weightGrams: data.variants[idx].weightGrams ?? null,
          attributeValueIds: (attrTagsMap[field.id] ?? []).map(
            (tag) => tag.attributeValueId,
          ),
        })),
      });

      if (imageFile) {
        try {
          const recent = await getAdminProducts(
            { page: 0, size: 1, sortBy: "createdAt", sortDirection: "DESC" },
            user!.token,
          );
          const newId = recent.content[0]?.productId;
          if (newId) {
            await imageMutation.mutateAsync({ productId: newId, file: imageFile });
          }
        } catch {
          toastError(t("productImageUploadFailed"));
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      success(t("productCreatedSuccessfully"));
      onClose();
    } catch (err) {
      handleError(err as Error, t("productNotCreatedSuccessfully"));
    }
  };

  const handleAddVariant = () => {
    append({
      sku: "",
      price: NaN,
      stock: NaN,
      discountPrice: null,
      weightGrams: null,
      attributeValueIds: [],
    });
  };

  const handleRemoveVariant = (index: number) => {
    const fieldId = fields[index].id;
    remove(index);
    setAttrTagsMap((prev) => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });
  };

  const handleAddAttrTag = (fieldId: string, tag: AttrValueTag) => {
    setAttrTagsMap((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] ?? []), tag],
    }));
  };

  const handleRemoveAttrTag = (fieldId: string, valueId: number) => {
    setAttrTagsMap((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] ?? []).filter(
        (tag) => tag.attributeValueId !== valueId,
      ),
    }));
  };

  const isPending = isSubmitting || createMutation.isPending || imageMutation.isPending;

  const variantsRootError =
    (errors.variants as { root?: { message?: string } } | undefined)?.root
      ?.message ??
    (errors.variants as { message?: string } | undefined)?.message;

  const stepLabels = [t("basicInfo"), t("categorization"), t("variantsSection")];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white border border-stone-200 rounded-none shadow-none w-[95vw] max-w-3xl flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 shrink-0 space-y-4">
          <h2 className="font-store-heading text-2xl font-semibold text-stone-900">
            {t("createProduct")}
          </h2>
          <StepIndicator step={step} labels={stepLabels} />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[65vh] px-6 py-5 space-y-6">

          {/* ── Step 1: Información básica + Imagen ───────────── */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <SectionTitle>{t("basicInfo")}</SectionTitle>

                <FieldWrap label={t("name")} error={errors.name?.message}>
                  <Input
                    {...register("name")}
                    placeholder={t("name")}
                    className="rounded-none h-9"
                  />
                </FieldWrap>

                <FieldWrap
                  label={t("shortDescription")}
                  error={errors.shortDescription?.message}
                  optional
                >
                  <textarea
                    {...register("shortDescription")}
                    rows={2}
                    placeholder={t("shortDescription")}
                    className="w-full px-3 py-2 text-sm font-store-body border border-stone-300 rounded-none bg-white focus:outline-none focus:border-stone-600 transition-colors placeholder:text-stone-400 resize-none"
                  />
                </FieldWrap>

                <FieldWrap
                  label={t("longDescription")}
                  error={errors.longDescription?.message}
                  optional
                >
                  <textarea
                    {...register("longDescription")}
                    rows={3}
                    placeholder={t("longDescription")}
                    className="w-full px-3 py-2 text-sm font-store-body border border-stone-300 rounded-none bg-white focus:outline-none focus:border-stone-600 transition-colors placeholder:text-stone-400 resize-none"
                  />
                </FieldWrap>

                <FieldWrap label={t("featured")}>
                  <div className="flex items-center h-9 gap-2">
                    <input
                      {...register("featured")}
                      type="checkbox"
                      id="prod-featured"
                      className="h-4 w-4 accent-stone-900 cursor-pointer"
                    />
                    <label
                      htmlFor="prod-featured"
                      className="text-sm font-store-body text-stone-700 cursor-pointer select-none"
                    >
                      {t("yes")}
                    </label>
                  </div>
                </FieldWrap>
              </div>

              <div className="space-y-3">
                <SectionTitle>{t("image")}</SectionTitle>
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="h-16 w-16 object-cover border border-stone-200 rounded-none shrink-0"
                    />
                  )}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-store-body text-stone-700 font-medium">
                      {t("uploadImage")}{" "}
                      <span className="text-stone-400 font-normal">{t("optional")}</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-xs font-store-body text-stone-700 file:mr-3 file:h-8 file:px-3 file:border-0 file:rounded-none file:bg-stone-900 file:text-white file:text-xs file:cursor-pointer file:font-store-body hover:file:bg-stone-800"
                    />
                    {imageFile && (
                      <p className="text-xs text-stone-500 font-store-body truncate">
                        {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Categorización ─────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <SectionTitle>{t("categorization")}</SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-store-body text-stone-700 font-medium">
                    {t("category")}{" "}
                    <span className="text-stone-400 font-normal">{t("optional")}</span>
                  </span>
                  <InfiniteScrollSelect<Category>
                    queryKeyPrefix={["admin", "form", "categories"]}
                    fetchFn={fetchCategories}
                    getId={(c) => c.categoryId}
                    getLabel={(c) => c.name}
                    selectedId={watchedCategoryId ?? undefined}
                    selectedLabel={categoryLabel}
                    onSelect={(id, lbl) => {
                      setValue("categoryId", id ?? null);
                      setCategoryLabel(lbl);
                    }}
                    allLabel={t("all")}
                    searchPlaceholder={`${t("searchFor")} ${t("categories").toLowerCase()}...`}
                    modal
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-store-body text-stone-700 font-medium">
                    {t("brands")}{" "}
                    <span className="text-stone-400 font-normal">{t("optional")}</span>
                  </span>
                  <InfiniteScrollSelect<AdminBrand>
                    queryKeyPrefix={["admin", "form", "brands"]}
                    fetchFn={fetchBrands}
                    getId={(b) => b.brandId}
                    getLabel={(b) => b.name}
                    selectedId={watchedBrandId ?? undefined}
                    selectedLabel={brandLabel}
                    onSelect={(id, lbl) => {
                      setValue("brandId", id ?? null);
                      setBrandLabel(lbl);
                    }}
                    allLabel={t("all")}
                    searchPlaceholder={`${t("searchFor")} ${t("brands").toLowerCase()}...`}
                    modal
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-store-body text-stone-700 font-medium">
                  {t("materials")}{" "}
                  <span className="text-stone-400 font-normal">{t("optional")}</span>
                </span>
                <InfiniteScrollMultiSelect<AdminMaterial>
                  queryKeyPrefix={["admin", "form", "materials"]}
                  fetchFn={fetchMaterials}
                  getId={(m) => m.materialId}
                  getLabel={(m) => m.name}
                  selectedIds={watchedMaterialIds}
                  selectedLabels={materialLabels}
                  onSelect={(ids, lbls) => {
                    setValue("materialIds", ids);
                    setMaterialLabels(lbls);
                  }}
                  placeholder={t("all")}
                  searchPlaceholder={`${t("searchFor")} ${t("materials").toLowerCase()}...`}
                  modal
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Variantes ───────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-3">
              <SectionTitle>{t("variantsSection")}</SectionTitle>

              {variantsRootError && (
                <p className="text-xs text-red-500 font-store-body">
                  {t(variantsRootError)}
                </p>
              )}

              {fields.map((field, index) => (
                <VariantRow
                  key={field.id}
                  index={index}
                  canRemove={fields.length > 1}
                  register={register}
                  errors={errors}
                  attrTags={attrTagsMap[field.id] ?? []}
                  onAddAttrTag={(tag) => handleAddAttrTag(field.id, tag)}
                  onRemoveAttrTag={(valueId) =>
                    handleRemoveAttrTag(field.id, valueId)
                  }
                  onRemove={() => handleRemoveVariant(index)}
                  fetchAttrsFn={fetchAttrs}
                />
              ))}

              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-2 h-9 px-4 border border-dashed border-stone-300 text-stone-600 text-sm font-store-body hover:border-stone-500 hover:text-stone-800 transition-colors w-full justify-center rounded-none"
              >
                <Plus className="h-4 w-4" />
                {t("addVariant")}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 shrink-0 space-y-2">
          {step === 3 && createMutation.isError && (
            <p className="text-xs text-red-500 text-center font-store-body">
              {t(
                (createMutation.error as Error)?.message ??
                  "productNotCreatedSuccessfully",
              )}
            </p>
          )}

          <div className={cn("flex gap-3", step > 1 ? "justify-between" : "justify-end")}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="h-10 px-6 border border-stone-300 text-stone-700 text-sm font-store-body hover:bg-stone-50 transition-colors rounded-none"
              >
                {t("back")}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="h-10 px-6 bg-stone-900 text-white text-sm font-store-body hover:bg-stone-800 transition-colors rounded-none"
              >
                {t("next")}
              </button>
            ) : (
              <div className="flex-1">
                <GenericButton
                  label={t("createProduct")}
                  type="submit"
                  isLoading={isPending}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
