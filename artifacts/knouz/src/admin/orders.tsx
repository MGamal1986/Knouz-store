import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice } from "@/lib/formatters";
import {
  getListOrdersQueryOptions,
  useUpdateOrder,
  OrderStatusUpdateStatus,
} from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; class: string }> = {
  PENDING:    { labelAr: "قيد الانتظار", labelEn: "Pending",    class: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:  { labelAr: "مؤكد",         labelEn: "Confirmed",  class: "bg-blue-100 text-blue-800" },
  PROCESSING: { labelAr: "قيد المعالجة", labelEn: "Processing", class: "bg-purple-100 text-purple-800" },
  SHIPPED:    { labelAr: "تم الشحن",     labelEn: "Shipped",    class: "bg-indigo-100 text-indigo-800" },
  DELIVERED:  { labelAr: "تم التسليم",   labelEn: "Delivered",  class: "bg-green-100 text-green-800" },
  CANCELLED:  { labelAr: "ملغي",         labelEn: "Cancelled",  class: "bg-red-100 text-red-800" },
};

const STATUS_OPTIONS = Object.values(OrderStatusUpdateStatus);

function OrderDetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(order.status);

  const update = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: t("admin.save") + " ✓" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryOptions().queryKey });
        onClose();
      },
    },
  });

  const addr = (order.shippingAddress as Record<string, string>) ?? {};
  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDING"];
  const stLabel = locale === "ar" ? st.labelAr : st.labelEn;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:w-[480px] overflow-y-auto" dir={locale === "ar" ? "rtl" : "ltr"}>
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-3">
            <span>{locale === "ar" ? "طلب" : "Order"} {order.orderNumber ?? order.id.slice(0, 8)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.class}`}>{stLabel}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 text-sm">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-gray-700">{locale === "ar" ? "بيانات العميل" : "Customer Info"}</h4>
            <p><span className="text-gray-500">{locale === "ar" ? "الاسم: " : "Name: "}</span>{addr.name ?? "—"}</p>
            <p><span className="text-gray-500">{locale === "ar" ? "الهاتف: " : "Phone: "}</span>{addr.phone ?? "—"}</p>
            <p><span className="text-gray-500">{locale === "ar" ? "العنوان: " : "Address: "}</span>{addr.address ?? "—"}</p>
            <p><span className="text-gray-500">{locale === "ar" ? "المدينة: " : "City: "}</span>{addr.city ?? "—"}</p>
            <p><span className="text-gray-500">{locale === "ar" ? "المحافظة: " : "Governorate: "}</span>{addr.governorate ?? "—"}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">{locale === "ar" ? "المنتجات" : "Items"}</h4>
            <div className="space-y-2">
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName ?? ""} className="w-10 h-10 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.productName ?? item.productId}</p>
                    <p className="text-gray-500 text-xs">× {item.quantity} × {formatPrice(item.price, locale)}</p>
                  </div>
                  <p className="font-bold text-[#C9A84C] shrink-0">{formatPrice(item.price * item.quantity, locale)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 bg-gray-50 rounded-xl p-4">
            {order.couponCode && (
              <div className="flex justify-between">
                <span className="text-gray-500">{locale === "ar" ? `كوبون (${order.couponCode})` : `Coupon (${order.couponCode})`}</span>
                <span className="text-green-600">− {formatPrice(order.discount ?? 0, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{locale === "ar" ? "طريقة الدفع" : "Payment Method"}</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{locale === "ar" ? "حالة الدفع" : "Payment Status"}</span>
              <span>{order.paymentStatus === "paid" ? (locale === "ar" ? "✓ مدفوع" : "✓ Paid") : (locale === "ar" ? "غير مدفوع" : "Unpaid")}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-base">
              <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-[#C9A84C]">{formatPrice(order.total, locale)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">{locale === "ar" ? "تحديث الحالة" : "Update Status"}</h4>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s}>
                      {cfg ? (locale === "ar" ? cfg.labelAr : cfg.labelEn) : s}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-black"
              onClick={() => update.mutate({
                id: order.id,
                data: { status: status as typeof OrderStatusUpdateStatus[keyof typeof OrderStatusUpdateStatus] },
              })}
              disabled={update.isPending}
            >
              {update.isPending ? t("admin.loading") : t("admin.save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const TABS = [
    { value: "", label: locale === "ar" ? "الكل" : "All" },
    { value: "PENDING",   label: locale === "ar" ? "قيد الانتظار" : "Pending" },
    { value: "SHIPPED",   label: locale === "ar" ? "تم الشحن"     : "Shipped" },
    { value: "DELIVERED", label: locale === "ar" ? "تم التسليم"   : "Delivered" },
    { value: "CANCELLED", label: locale === "ar" ? "ملغي"         : "Cancelled" },
  ];

  const { data, isLoading } = useQuery(
    getListOrdersQueryOptions({ status: statusFilter || undefined, page })
  );

  const handleExport = () => {
    window.open(`/api/admin/orders/export${statusFilter ? `?status=${statusFilter}` : ""}`, "_blank");
  };

  const filteredOrders = search
    ? (data?.orders ?? []).filter(
        (o) =>
          o.orderNumber?.includes(search) ||
          ((o.shippingAddress as Record<string, string>)?.phone ?? "").includes(search)
      )
    : (data?.orders ?? []);

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.value
                ? "bg-[#C9A84C] text-black shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={locale === "ar" ? "ابحث برقم الطلب أو الهاتف..." : "Search by order number or phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-8"
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={handleExport}>
          <Download size={14} />
          {t("admin.export_csv")}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-400">{t("admin.no_results")}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "رقم الطلب" : "Order #"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "العميل" : "Customer"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "طريقة الدفع" : "Payment"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الحالة" : "Status"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order: Order) => {
                  const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDING"];
                  const stLabel = locale === "ar" ? st.labelAr : st.labelEn;
                  const addr = (order.shippingAddress as Record<string, string>) ?? {};
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EB] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{order.orderNumber ?? order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{addr.name ?? "—"}</p>
                        <p className="text-gray-400 text-xs">{addr.phone ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#C9A84C]">{formatPrice(order.total, locale)}</td>
                      <td className="px-4 py-3 text-gray-600">{order.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.class}`}>{stLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB") : ""}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{data?.total} {locale === "ar" ? "طلب" : "orders"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                {locale === "ar" ? "السابق" : "Prev"}
              </Button>
              <span className="flex items-center text-xs px-2 text-gray-500">{page}/{totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
