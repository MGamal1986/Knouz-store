import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getListCouponsQueryOptions,
  useCreateCoupon,
  useDeleteCoupon,
} from "@workspace/api-client-react";
import type { Coupon } from "@workspace/api-client-react";

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function AdminCouponsPage() {
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
        toast({ title: "تم إضافة الكوبون بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryOptions().queryKey });
        setOpen(false);
        setForm({ code: "", discount: "", type: "PERCENTAGE", minOrder: "", expiresAt: "", usageLimit: "" });
      },
      onError: () => toast({ title: "خطأ في إضافة الكوبون", variant: "destructive" }),
    },
  });

  const deleteCoupon = useDeleteCoupon({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم حذف الكوبون" });
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
        <p className="text-sm text-gray-500">{(coupons ?? []).length} كوبون</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-black gap-2">
              <Plus size={16} />
              إنشاء كوبون
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء كوبون خصم جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>كود الخصم *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => setForm({ ...form, code: generateCode() })}>
                    توليد
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>نوع الخصم</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">نسبة مئوية %</SelectItem>
                    <SelectItem value="FIXED">مبلغ ثابت جنيه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>قيمة الخصم *</Label>
                <Input type="number" dir="ltr" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأدنى للطلب (جنيه)</Label>
                <Input type="number" dir="ltr" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" dir="ltr" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>حد الاستخدام (اتركه فارغاً لعدد غير محدود)</Label>
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
                {createCoupon.isPending ? "جاري الإنشاء..." : "إنشاء الكوبون"}
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
            <p>لا توجد كوبونات بعد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              <tr>
                <th className="text-start px-4 py-3 font-medium">الكود</th>
                <th className="text-start px-4 py-3 font-medium">نوع الخصم</th>
                <th className="text-start px-4 py-3 font-medium">قيمة الخصم</th>
                <th className="text-start px-4 py-3 font-medium">الحد الأدنى</th>
                <th className="text-start px-4 py-3 font-medium">الاستخدام</th>
                <th className="text-start px-4 py-3 font-medium">الحالة</th>
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
                      {c.type === "PERCENTAGE" ? "نسبة %" : "مبلغ ثابت"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.type === "PERCENTAGE" ? `${c.discount}%` : formatPrice(c.discount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.minOrder ? formatPrice(c.minOrder) : "لا يوجد"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {active ? "نشط" : expired ? "منتهي" : "مستنفد"}
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
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد حذف الكوبون</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">هل أنت متأكد من حذف هذا الكوبون؟</p>
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={() => deleteId && deleteCoupon.mutate({ id: deleteId })} disabled={deleteCoupon.isPending}>
              {deleteCoupon.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
