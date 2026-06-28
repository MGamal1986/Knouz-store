import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getListProductsQueryOptions,
  getListCategoriesQueryOptions,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  ListProductsSort,
} from "@workspace/api-client-react";
import type { Product, Category } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice } from "@/lib/formatters";

type FormState = {
  nameAr: string;
  descriptionAr: string;
  price: string;
  comparePrice: string;
  stock: string;
  categoryId: string;
  featured: boolean;
  images: string;
};

const EMPTY_FORM: FormState = {
  nameAr: "", descriptionAr: "", price: "", comparePrice: "",
  stock: "", categoryId: "", featured: false, images: "",
};

function ProductModal({
  open, onClose, editProduct,
}: {
  open: boolean; onClose: () => void; editProduct?: Product | null;
}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editProduct
      ? {
          nameAr: editProduct.nameAr,
          descriptionAr: editProduct.descriptionAr,
          price: String(editProduct.price),
          comparePrice: editProduct.comparePrice ? String(editProduct.comparePrice) : "",
          stock: String(editProduct.stock),
          categoryId: editProduct.categoryId,
          featured: editProduct.featured ?? false,
          images: (editProduct.images ?? []).join("\n"),
        }
      : EMPTY_FORM
  );
  const { data: categories } = useQuery(getListCategoriesQueryOptions());

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryOptions({}).queryKey });
  };

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("common.save_success") });
        invalidate();
        onClose();
      },
      onError: () => toast({ title: t("common.error"), variant: "destructive" }),
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("common.save_success") });
        invalidate();
        onClose();
      },
      onError: () => toast({ title: t("common.error"), variant: "destructive" }),
    },
  });

  const handleSave = () => {
    const data = {
      nameAr: form.nameAr,
      descriptionAr: form.descriptionAr,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock),
      categoryId: form.categoryId,
      featured: form.featured,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
    };

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data });
    } else {
      createProduct.mutate({ data });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editProduct ? t("admin.edit_product") : t("admin.add_product")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>اسم المنتج بالعربي *</Label>
            <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>الوصف بالعربي *</Label>
            <Textarea rows={3} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>السعر (جنيه) *</Label>
              <Input type="number" dir="ltr" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>سعر المقارنة</Label>
              <Input type="number" dir="ltr" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>المخزون *</Label>
            <Input type="number" dir="ltr" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.categories")}</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c: Category) => (
                  <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>روابط الصور (رابط في كل سطر)</Label>
            <Textarea
              rows={3}
              dir="ltr"
              placeholder="https://..."
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.featured}
              onCheckedChange={(v) => setForm({ ...form, featured: v })}
            />
            <Label>منتج مميز</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-black"
              onClick={handleSave}
              disabled={!form.nameAr || !form.price || !form.categoryId || isPending}
            >
              {isPending ? t("common.loading") : t("admin.save")}
            </Button>
            <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  open, onClose, onConfirm, title, isPending,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; isPending: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("admin.confirm_delete")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 py-2">{title}</p>
        <div className="flex gap-2">
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={isPending}>
            {isPending ? t("common.loading") : t("admin.delete_product")}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>{t("admin.cancel")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<typeof ListProductsSort[keyof typeof ListProductsSort]>(ListProductsSort.newest);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery(
    getListProductsQueryOptions({ search: search || undefined, category: category || undefined, sort, page, limit: 10 })
  );
  const { data: categories } = useQuery(getListCategoriesQueryOptions());

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: t("common.delete_success") });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryOptions({}).queryKey });
        setDeleteId(null);
      },
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryOptions({}).queryKey });
      },
    },
  });

  const totalPages = Math.ceil((products?.total ?? 0) / 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("admin.search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ps-8"
          />
        </div>
        <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SlidersHorizontal size={14} className="me-1" />
            <SelectValue placeholder={t("shop.filter_category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("shop.all_categories")}</SelectItem>
            {(categories ?? []).map((c: Category) => (
              <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof ListProductsSort[keyof typeof ListProductsSort])}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("shop.sort_newest")}</SelectItem>
            <SelectItem value="price_asc">{t("shop.sort_price_asc")}</SelectItem>
            <SelectItem value="price_desc">{t("shop.sort_price_desc")}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-black gap-2"
          onClick={() => { setEditProduct(null); setModalOpen(true); }}
        >
          <Plus size={16} />
          {t("admin.add_product")}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (products?.products ?? []).length === 0 ? (
            <div className="py-16 text-center text-gray-400">{t("admin.no_results")}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الصورة" : "Image"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "اسم المنتج" : "Product"}</th>
                  <th className="text-start px-4 py-3 font-medium">{t("admin.categories")}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "السعر" : "Price"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "المخزون" : "Stock"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "مميز" : "Featured"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(products?.products ?? []).map((p: Product) => (
                  <tr key={p.id} className="hover:bg-[#FAF5EB] transition-colors">
                    <td className="px-4 py-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.nameAr} className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🛍️</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 max-w-48 line-clamp-2">{p.nameAr}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-xs">{(p as Product & { category?: { nameAr?: string } }).category?.nameAr ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#C9A84C]">{formatPrice(p.price, locale)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock < 5 ? "text-red-600" : "text-gray-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.featured ?? false}
                        onCheckedChange={(v) => updateProduct.mutate({ id: p.id, data: { featured: v } })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => { setEditProduct(p); setModalOpen(true); }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {t("shop.results_count", { count: products?.total ?? 0 })}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                {t("shop.prev")}
              </Button>
              <span className="flex items-center text-xs text-gray-500 px-2">{page}/{totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("shop.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        editProduct={editProduct}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteProduct.mutate({ id: deleteId })}
        title={locale === "ar"
          ? "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure you want to delete this product? This action cannot be undone."}
        isPending={deleteProduct.isPending}
      />
    </div>
  );
}
