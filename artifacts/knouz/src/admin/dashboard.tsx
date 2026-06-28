import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  TrendingUp, ShoppingBag, Clock, Users, Package, AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING: { label: "قيد الانتظار", class: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "مؤكد", class: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "قيد المعالجة", class: "bg-purple-100 text-purple-800" },
  SHIPPED: { label: "تم الشحن", class: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "تم التسليم", class: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ملغي", class: "bg-red-100 text-red-800" },
};

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
  const { data: stats, isLoading } = useQuery(getGetAdminStatsQueryOptions());
  const { data: sales } = useQuery(getGetSalesChartQueryOptions());
  const { data: catSales } = useQuery(getGetCategorySalesQueryOptions());

  const cards = [
    {
      label: "إجمالي الإيرادات",
      value: stats ? formatPrice(stats.totalRevenue) : "-",
      icon: <TrendingUp size={18} className="text-yellow-700" />,
      color: "bg-yellow-50",
    },
    {
      label: "إجمالي الطلبات",
      value: stats?.totalOrders ?? "-",
      icon: <ShoppingBag size={18} className="text-blue-700" />,
      color: "bg-blue-50",
    },
    {
      label: "طلبات اليوم",
      value: stats?.todayOrders ?? "-",
      icon: <Clock size={18} className="text-purple-700" />,
      color: "bg-purple-50",
    },
    {
      label: "العملاء",
      value: stats?.totalCustomers ?? "-",
      icon: <Users size={18} className="text-green-700" />,
      color: "bg-green-50",
    },
    {
      label: "المنتجات",
      value: stats?.totalProducts ?? "-",
      icon: <Package size={18} className="text-orange-700" />,
      color: "bg-orange-50",
    },
    {
      label: "منتجات منخفضة المخزون",
      value: stats?.lowStockCount ?? "-",
      icon: <AlertTriangle size={18} className="text-red-700" />,
      color: "bg-red-50",
      subLabel: stats?.lowStockCount && stats.lowStockCount > 0 ? "تحتاج إعادة تخزين" : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) =>
          isLoading ? (
            <Skeleton key={card.label} className="h-28 rounded-xl" />
          ) : (
            <StatCard key={card.label} {...card} />
          )
        )}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar chart - monthly sales */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">المبيعات الشهرية (جنيه)</h3>
          {sales && sales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sales} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} name="الإيراد" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              لا توجد بيانات بعد
            </div>
          )}
        </div>

        {/* Pie chart - category sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">المبيعات حسب الفئة</h3>
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
                <Tooltip formatter={(v: number) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              لا توجد مبيعات بعد
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: recent orders + low stock */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">آخر الطلبات</h3>
            <Link href="/admin/orders" className="text-xs text-[#C9A84C] font-medium hover:underline">
              عرض الكل
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (stats?.recentOrders ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد طلبات بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-start px-4 py-2 font-medium">رقم الطلب</th>
                    <th className="text-start px-4 py-2 font-medium">المبلغ</th>
                    <th className="text-start px-4 py-2 font-medium">الحالة</th>
                    <th className="text-start px-4 py-2 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(stats?.recentOrders ?? []).map((order: Order) => {
                    const st = STATUS_LABELS[order.status] ?? STATUS_LABELS["PENDING"];
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF5EB] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber ?? order.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-bold text-[#C9A84C]">{formatPrice(order.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.class}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">منتجات منخفضة المخزون</h3>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          {(stats?.lowStockProducts ?? []).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {isLoading ? <Skeleton className="h-8 mx-auto w-32" /> : "كل المنتجات متوفرة ✓"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(stats?.lowStockProducts ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-[#FAF5EB]">
                  <p className="text-sm font-medium text-gray-700 line-clamp-1 flex-1 me-2">{p.nameAr}</p>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.stock === 0 ? "نفذ" : `${p.stock} قطع`}
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
