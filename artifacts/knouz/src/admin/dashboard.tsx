import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  TrendingUp, ShoppingBag, Clock, Users, Package, AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  getGetAdminStatsQueryOptions,
  getGetSalesChartQueryOptions,
  getGetCategorySalesQueryOptions,
} from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice, formatDate } from "@/lib/formatters";

const PIE_COLORS = ["#C9A84C", "#8B1A1A", "#2D5016", "#1A3A5C", "#5C1A4A", "#1A5C4A"];

function StatCard({
  label, value, icon, color, subLabel,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; subLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    PENDING: { label: t("status.PENDING"), class: "bg-yellow-100 text-yellow-800" },
    CONFIRMED: { label: t("status.CONFIRMED"), class: "bg-blue-100 text-blue-800" },
    PROCESSING: { label: t("track.status_processing"), class: "bg-purple-100 text-purple-800" },
    SHIPPED: { label: t("status.SHIPPED"), class: "bg-indigo-100 text-indigo-800" },
    DELIVERED: { label: t("status.DELIVERED"), class: "bg-green-100 text-green-800" },
    CANCELLED: { label: t("status.CANCELLED"), class: "bg-red-100 text-red-800" },
  };

  const { data: stats, isLoading } = useQuery(getGetAdminStatsQueryOptions());
  const { data: sales } = useQuery(getGetSalesChartQueryOptions());
  const { data: catSales } = useQuery(getGetCategorySalesQueryOptions());

  const cards = [
    {
      label: t("admin.total_revenue"),
      value: stats ? formatPrice(stats.totalRevenue, locale) : "-",
      icon: <TrendingUp size={18} className="text-yellow-700" />,
      color: "bg-yellow-50",
    },
    {
      label: t("admin.total_orders"),
      value: stats?.totalOrders ?? "-",
      icon: <ShoppingBag size={18} className="text-blue-700" />,
      color: "bg-blue-50",
    },
    {
      label: t("admin.today_orders"),
      value: stats?.todayOrders ?? "-",
      icon: <Clock size={18} className="text-purple-700" />,
      color: "bg-purple-50",
    },
    {
      label: t("admin.total_customers"),
      value: stats?.totalCustomers ?? "-",
      icon: <Users size={18} className="text-green-700" />,
      color: "bg-green-50",
    },
    {
      label: t("admin.products"),
      value: stats?.totalProducts ?? "-",
      icon: <Package size={18} className="text-orange-700" />,
      color: "bg-orange-50",
    },
    {
      label: locale === "ar" ? "منتجات منخفضة المخزون" : "Low Stock Products",
      value: stats?.lowStockCount ?? "-",
      icon: <AlertTriangle size={18} className="text-red-700" />,
      color: "bg-red-50",
      subLabel: stats?.lowStockCount && stats.lowStockCount > 0
        ? (locale === "ar" ? "تحتاج إعادة تخزين" : "Needs restocking")
        : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) =>
          isLoading ? (
            <Skeleton key={card.label} className="h-28 rounded-xl" />
          ) : (
            <StatCard key={card.label} {...card} />
          )
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            {locale === "ar" ? "المبيعات الشهرية (جنيه)" : "Monthly Sales (EGP)"}
          </h3>
          {sales && sales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sales} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatPrice(v, locale)} />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]}
                  name={locale === "ar" ? "الإيراد" : "Revenue"} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              {locale === "ar" ? "لا توجد بيانات بعد" : "No data yet"}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            {locale === "ar" ? "المبيعات حسب الفئة" : "Sales by Category"}
          </h3>
          {catSales && catSales.length > 0 && catSales.some((c) => c.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catSales.filter((c) => c.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={false}
                >
                  {catSales.filter((c) => c.value > 0).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                <Tooltip formatter={(v: number) => formatPrice(v, locale)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              {locale === "ar" ? "لا توجد مبيعات بعد" : "No sales yet"}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">
              {locale === "ar" ? "آخر الطلبات" : "Recent Orders"}
            </h3>
            <Link href="/admin/orders" className="text-xs text-[#C9A84C] font-medium hover:underline">
              {locale === "ar" ? "عرض الكل" : "View all"}
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (stats?.recentOrders ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-start px-4 py-2 font-medium">{t("account.order_number")}</th>
                    <th className="text-start px-4 py-2 font-medium">{t("account.order_total")}</th>
                    <th className="text-start px-4 py-2 font-medium">{t("account.order_status")}</th>
                    <th className="text-start px-4 py-2 font-medium">{t("account.order_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(stats?.recentOrders ?? []).map((order: Order) => {
                    const st = STATUS_LABELS[order.status] ?? STATUS_LABELS["PENDING"];
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF5EB] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber ?? order.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-bold text-[#C9A84C]">{formatPrice(order.total, locale)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.class}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {order.createdAt ? formatDate(order.createdAt, locale) : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">
              {locale === "ar" ? "منتجات منخفضة المخزون" : "Low Stock Products"}
            </h3>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          {(stats?.lowStockProducts ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {isLoading
                ? <Skeleton className="h-8 mx-auto w-32" />
                : (locale === "ar" ? "كل المنتجات متوفرة ✓" : "All products in stock ✓")}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(stats?.lowStockProducts ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#FAF5EB]">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1 flex-1 me-2">{p.nameAr}</p>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.stock === 0
                      ? (locale === "ar" ? "نفذ" : "Out")
                      : (locale === "ar" ? `${p.stock} قطع` : `${p.stock} left`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
