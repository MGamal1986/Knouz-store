import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice } from "@/lib/formatters";
import {
  getListCouponsQueryOptions,
  useCreateCoupon,
  useDeleteCoupon,
} from "@workspace/api-client-react";
import type { Coupon } from "@workspace/api-client-react";

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function AdminCouponsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "", discount: "", type: "PERCENTAGE", minOrder: "", expiresAt: "", usageLimit: "",
  });

  const { data: coupons, isLoading } = useQuery(getListCouponsQueryOptions());

  const createCoupon = useCreateCoupon({
    mutation: {
      onSuccess: () => {
        toast({ title: locale === "ar" ? "تم إضافة الكوبون بنجاح" : "Coupon created successfully" });
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryOptions().queryKey });
        setOpen(false);
        setForm({ code: "", discount: "", type: "PERCENTAGE", minOrder: "", expiresAt: "", usageLimit: "" });
      },
      onError: () => toast({ title: locale === "ar" ? "خطأ في إضافة الكوبون" : "Error creating coupon", variant: "destructive" }),
    },
  });

  const deleteCoupon = useDeleteCoupon({
    mutation: {
      onSuccess: () => {
        toast({ title: t("common.delete_success") });
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryOptions().queryKey });
        setDeleteId(null);
      },
    },
  });

  const isExpired = (c: Coupon) =>
    c.expiresAt ? new Date(c.expiresAt) < new Date() : false;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {(coupons ?? []).length} {locale === "ar" ? "كوبون" : "coupons"}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-black gap-2">
              <Plus size={16} />
              {locale === "ar" ? "إنشاء كوبون" : "Create Coupon"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{locale === "ar" ? "إنشاء كوبون خصم جديد" : "Create New Discount Coupon"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "كود الخصم *" : "Discount Code *"}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, code: generateCode() })}>
                    {locale === "ar" ? "توليد" : "Generate"}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "نوع الخصم" : "Discount Type"}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{locale === "ar" ? "نسبة مئوية %" : "Percentage %"}</SelectItem>
                    <SelectItem value="FIXED">{locale === "ar" ? "مبلغ ثابت جنيه" : "Fixed Amount EGP"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "قيمة الخصم *" : "Discount Value *"}</Label>
                <Input type="number" dir="ltr" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "الحد الأدنى للطلب (جنيه)" : "Minimum Order (EGP)"}</Label>
                <Input type="number" dir="ltr" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                <Input type="date" dir="ltr" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{locale === "ar" ? "حد الاستخدام (اتركه فارغاً لعدد غير محدود)" : "Usage Limit (leave blank for unlimited)"}</Label>
                <Input type="number" dir="ltr" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="∞" />
              </div>
              <Button
                className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-black"
                disabled={!form.code || !form.discount || createCoupon.isPending}
                onClick={() =>
                  createCoupon.mutate({
                    data: {
                      code: form.code,
                      discount: Number(form.discount),
                      type: form.type as "PERCENTAGE" | "FIXED",
                      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
                      expiresAt: form.expiresAt || undefined,
                      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
                    },
                  })
                }
              >
                {createCoupon.isPending
                  ? t("admin.loading")
                  : (locale === "ar" ? "إنشاء الكوبون" : "Create Coupon")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (coupons ?? []).length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Tag size={32} strokeWidth={1} className="mx-auto mb-2" />
            <p>{locale === "ar" ? "لا توجد كوبونات بعد" : "No coupons yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              <tr>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الكود" : "Code"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "نوع الخصم" : "Type"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "قيمة الخصم" : "Value"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الحد الأدنى" : "Min Order"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الاستخدام" : "Usage"}</th>
                <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(coupons ?? []).map((c: Coupon) => {
                const expired = isExpired(c);
                const exhausted = c.usageLimit !== null && (c.usedCount ?? 0) >= (c.usageLimit ?? 0);
                const active = !expired && !exhausted;
                return (
                  <tr key={c.id} className="hover:bg-[#FAF5EB] transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-bold text-[#C9A84C]">{c.code}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.type === "PERCENTAGE"
                        ? (locale === "ar" ? "نسبة %" : "Percentage")
                        : (locale === "ar" ? "مبلغ ثابت" : "Fixed")}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.type === "PERCENTAGE" ? `${c.discount}%` : formatPrice(c.discount, locale)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.minOrder ? formatPrice(c.minOrder, locale) : (locale === "ar" ? "لا يوجد" : "None")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {active
                          ? (locale === "ar" ? "نشط" : "Active")
                          : expired
                            ? (locale === "ar" ? "منتهي" : "Expired")
                            : (locale === "ar" ? "مستنفد" : "Exhausted")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="max-w-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("admin.confirm_delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            {locale === "ar" ? "هل أنت متأكد من حذف هذا الكوبون؟" : "Are you sure you want to delete this coupon?"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteId && deleteCoupon.mutate({ id: deleteId })}
              disabled={deleteCoupon.isPending}
            >
              {deleteCoupon.isPending ? t("admin.loading") : (locale === "ar" ? "حذف" : "Delete")}
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
