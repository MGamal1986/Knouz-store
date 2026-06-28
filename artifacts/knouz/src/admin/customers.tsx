import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice } from "@/lib/formatters";
import {
  getListAdminCustomersQueryOptions,
  getGetCustomerOrdersQueryOptions,
} from "@workspace/api-client-react";
import type { AdminCustomer, Order } from "@workspace/api-client-react";

const STATUS_CLASS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED:   "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function CustomerRow({ customer }: { customer: AdminCustomer }) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const { data: orders, isLoading } = useQuery({
    ...getGetCustomerOrdersQueryOptions(customer.userId),
    enabled: expanded,
  });

  return (
    <>
      <tr
        className="hover:bg-[#FAF5EB] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 font-medium">{customer.name ?? "—"}</td>
        <td className="px-4 py-3 text-gray-500">{customer.phone ?? "—"}</td>
        <td className="px-4 py-3 text-center">{customer.orderCount}</td>
        <td className="px-4 py-3 font-bold text-[#C9A84C]">{formatPrice(customer.totalSpend, locale)}</td>
        <td className="px-4 py-3 text-gray-400 text-xs">
          {customer.createdAt
            ? new Date(customer.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")
            : ""}
        </td>
        <td className="px-4 py-3">
          <button className="text-gray-400 hover:text-gray-700">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-3">
            {isLoading ? (
              <div className="space-y-1">
                {[1, 2].map((i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : (orders ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                {locale === "ar" ? "لا توجد طلبات" : "No orders"}
              </p>
            ) : (
              <div className="space-y-2">
                {(orders ?? []).map((order: Order) => (
                  <div key={order.id} className="flex items-center gap-4 bg-white rounded-lg px-3 py-2 text-sm border border-gray-100">
                    <span className="font-mono text-xs text-gray-500">{order.orderNumber ?? order.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[order.status] ?? STATUS_CLASS["PENDING"]}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-[#C9A84C]">{formatPrice(order.total, locale)}</span>
                    <span className="text-gray-400 text-xs ms-auto">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminCustomersPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    getListAdminCustomersQueryOptions({ search: search || undefined, page })
  );

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={locale === "ar" ? "ابحث بالاسم..." : "Search by name..."}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ps-8"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (data?.customers ?? []).length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              {locale === "ar" ? "لا يوجد عملاء بعد" : "No customers yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                <tr>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الاسم" : "Name"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "الهاتف" : "Phone"}</th>
                  <th className="text-center px-4 py-3 font-medium">{locale === "ar" ? "عدد الطلبات" : "Orders"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "إجمالي الإنفاق" : "Total Spend"}</th>
                  <th className="text-start px-4 py-3 font-medium">{locale === "ar" ? "أول طلب" : "First Order"}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.customers ?? []).map((c: AdminCustomer) => (
                  <CustomerRow key={c.userId} customer={c} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {data?.total} {locale === "ar" ? "عميل" : "customers"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                {locale === "ar" ? "السابق" : "Prev"}
              </Button>
              <span className="text-xs text-gray-500 px-2 flex items-center">{page}/{totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
