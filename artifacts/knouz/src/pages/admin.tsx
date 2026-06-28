import { useLocation } from "wouter";
import { useAuth, SignInButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
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
  const [location] = useLocation();
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم كنوز</h1>
          <p className="text-gray-500">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
          <SignInButton mode="modal">
            <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-black">تسجيل الدخول</Button>
          </SignInButton>
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
