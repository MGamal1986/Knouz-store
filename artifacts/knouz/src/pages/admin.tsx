import { useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import AdminLayout from "@/admin/AdminLayout";
import DashboardPage from "@/admin/dashboard";
import ProductsPage from "@/admin/products";
import OrdersPage from "@/admin/orders";
import CustomersPage from "@/admin/customers";
import CouponsPage from "@/admin/coupons";
import CategoriesPage from "@/admin/categories";
import SettingsPage from "@/admin/settings";

function getAdminPage(location: string) {
  if (location.startsWith("/admin/products")) return <ProductsPage />;
  if (location.startsWith("/admin/orders")) return <OrdersPage />;
  if (location.startsWith("/admin/customers")) return <CustomersPage />;
  if (location.startsWith("/admin/coupons")) return <CouponsPage />;
  if (location.startsWith("/admin/categories")) return <CategoriesPage />;
  if (location.startsWith("/admin/settings")) return <SettingsPage />;
  return <DashboardPage />;
}

export default function AdminPage() {
  const [location, setLocation] = useLocation();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAF5EB] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="text-5xl font-extrabold text-[#C9A84C]">كنوز</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
            <p className="text-gray-500">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
          </div>
          <button
            onClick={() => setLocation("/sign-in")}
            className="w-full bg-[#C9A84C] hover:bg-[#b8963e] text-black font-bold py-3 px-6 rounded-xl transition-colors"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      {getAdminPage(location)}
    </AdminLayout>
  );
}
