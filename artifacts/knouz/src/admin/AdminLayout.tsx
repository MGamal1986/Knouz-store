import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Grid3X3, Settings, Menu, X, LogOut, ChevronLeft,
} from "lucide-react";
import { useAuth, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/coupons", label: "الكوبونات", icon: Tag },
  { href: "/admin/categories", label: "الفئات", icon: Grid3X3 },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] text-white">
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-2xl font-extrabold text-[#C9A84C]">كنوز</span>
          <span className="text-xs text-white/50 mt-1">لوحة التحكم</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? location === href : location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onClose}>
              <div
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "text-[#C9A84C] bg-white/5 border-s-2 border-[#C9A84C]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/5"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "لوحة التحكم",
  "/admin/products": "إدارة المنتجات",
  "/admin/orders": "إدارة الطلبات",
  "/admin/customers": "إدارة العملاء",
  "/admin/coupons": "الكوبونات",
  "/admin/categories": "إدارة الفئات",
  "/admin/settings": "الإعدادات",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = PAGE_TITLES[location] ?? "لوحة التحكم";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 end-0 z-30 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 end-0 z-50 w-64 transition-transform duration-300 lg:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 start-4 text-white/70 hover:text-white z-10"
        >
          <X size={20} />
        </button>
        <SidebarContent onClose={() => setDrawerOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:me-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-gray-800 text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ChevronLeft size={14} />
                عرض المتجر
              </Button>
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
