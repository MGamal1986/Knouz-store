import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getListCategoriesQueryOptions,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";

type FormState = { nameAr: string; slug: string; image: string };
const EMPTY: FormState = { nameAr: "", slug: "", image: "" };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (c) => c)
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 40);
}

function CategoryModal({
  open, onClose, editCategory,
}: {
  open: boolean; onClose: () => void; editCategory?: Category | null;
}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editCategory
      ? { nameAr: editCategory.nameAr, slug: editCategory.slug, image: editCategory.image ?? "" }
      : EMPTY
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryOptions().queryKey });

  const create = useCreateCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: locale === "ar" ? "تم إضافة الفئة" : "Category added" });
        invalidate();
        onClose();
      },
      onError: () => toast({ title: locale === "ar" ? "خطأ في حفظ الفئة" : "Error saving category", variant: "destructive" }),
    },
  });

  const update = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: locale === "ar" ? "تم تحديث الفئة" : "Category updated" });
        invalidate();
        onClose();
      },
      onError: () => toast({ title: locale === "ar" ? "خطأ في تحديث الفئة" : "Error updating category", variant: "destructive" }),
    },
  });

  const handleSave = () => {
    const data = { nameAr: form.nameAr, slug: form.slug || slugify(form.nameAr), image: form.image || undefined };
    if (editCategory) {
      update.mutate({ id: editCategory.id, data });
    } else {
      create.mutate({ data });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>
            {editCategory
              ? (locale === "ar" ? "تعديل الفئة" : "Edit Category")
              : (locale === "ar" ? "إضافة فئة جديدة" : "Add New Category")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>{locale === "ar" ? "اسم الفئة بالعربي *" : "Arabic Category Name *"}</Label>
            <Input
              value={form.nameAr}
              onChange={(e) => {
                const v = e.target.value;
                setForm({ ...form, nameAr: v, slug: form.slug || slugify(v) });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{locale === "ar" ? "الـ Slug (رابط مختصر)" : "Slug (URL identifier)"}</Label>
            <Input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="jewelry" />
          </div>
          <div className="space-y-1.5">
            <Label>{locale === "ar" ? "رابط الصورة" : "Image URL"}</Label>
            <Input dir="ltr" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            {form.image && (
              <img src={form.image} alt="" className="w-full h-28 object-cover rounded-lg mt-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-[#C9A84C] hover:bg-[#b8963e] text-black"
              disabled={!form.nameAr || isPending}
              onClick={handleSave}
            >
              {isPending ? t("admin.loading") : t("admin.save")}
            </Button>
            <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery(getListCategoriesQueryOptions());

  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: t("common.delete_success") });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryOptions().queryKey });
        setDeleteId(null);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: msg ?? (locale === "ar" ? "لا يمكن حذف هذه الفئة" : "Cannot delete this category"), variant: "destructive" });
        setDeleteId(null);
      },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {(categories ?? []).length} {locale === "ar" ? "فئة" : "categories"}
        </p>
        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-black gap-2"
          onClick={() => { setEditCategory(null); setModalOpen(true); }}
        >
          <Plus size={16} />
          {locale === "ar" ? "إضافة فئة" : "Add Category"}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (categories ?? []).length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {locale === "ar" ? "لا توجد فئات" : "No categories yet"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              <tr>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الصورة" : "Image"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "اسم الفئة" : "Name"}</th>
                <th className="text-start px-4 py-3 font-medium">Slug</th>
                <th className="text-center px-4 py-3 font-medium">{locale === "ar" ? "عدد المنتجات" : "Products"}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(categories ?? []).map((c: Category) => (
                <tr key={c.id} className="hover:bg-[#FAF5EB] transition-colors">
                  <td className="px-4 py-3">
                    {c.image ? (
                      <img src={c.image} alt={c.nameAr} className="w-10 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🏷️</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.nameAr}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{(c as Category & { productCount?: number }).productCount ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => { setEditCategory(c); setModalOpen(true); }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => setDeleteId(c.id)}
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

      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCategory(null); }}
        editCategory={editCategory}
      />

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("admin.confirm_delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            {locale === "ar"
              ? "هل أنت متأكد من حذف هذه الفئة؟ لا يمكن حذف فئة تحتوي على منتجات."
              : "Are you sure you want to delete this category? Categories with products cannot be deleted."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteId && deleteCategory.mutate({ id: deleteId })}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? t("admin.loading") : (locale === "ar" ? "حذف" : "Delete")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              {t("admin.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
