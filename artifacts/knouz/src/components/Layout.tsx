import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, Package, LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth, UserButton, SignInButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "المتجر" },
  { href: "/track", label: "تتبع طلبك" },
];

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

function CartSheet() {
  const { items, removeItem, updateQuantity, subtotal, discount, total, coupon } =
    useCartStore();
  const itemTotal = useCartStore((s) => s.itemTotal);
  const [, navigate] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart size={20} />
          {itemTotal > 0 && (
            <span className="absolute -top-1 -end-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {itemTotal}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>سلة التسوق ({itemTotal})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>سلتك فارغة</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.nameAr}
                      className="w-16 h-16 object-cover rounded-md shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.nameAr}</p>
                    <p className="text-primary font-bold text-sm mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(item.id, item.quantity - 1)
                            : removeItem(item.id)
                        }
                        className="w-6 h-6 border border-border rounded flex items-center justify-center text-sm hover:bg-muted"
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.min(item.quantity + 1, item.stock)
                          )
                        }
                        className="w-6 h-6 border border-border rounded flex items-center justify-center text-sm hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive mt-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {coupon && discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>خصم ({coupon.code})</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => navigate("/checkout")}
              >
                إتمام الشراء
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background font-[Cairo,sans-serif]">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-primary tracking-tight">
              كنوز
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block mt-1">
              Knouz
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  location === href
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/account">
              <Button variant="ghost" size="icon">
                <Package size={20} />
              </Button>
            </Link>
            <CartSheet />
            {isSignedIn ? (
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="gap-1">
                  <LogIn size={14} />
                  تسجيل الدخول
                </Button>
              </SignInButton>
            )}

            <button
              className="md:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-foreground text-background mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-extrabold text-primary mb-2">كنوز</h3>
            <p className="text-sm text-background/70 leading-relaxed">
              متجرك الإلكتروني للمنتجات المميزة في مصر. جودة عالية وأسعار مناسبة.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/account" className="hover:text-primary transition-colors">
                  حسابي
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">تواصل معنا</h4>
            <p className="text-sm text-background/70">
              📧 info@knouz.eg
              <br />
              📞 01000000000
              <br />
              📍 القاهرة، مصر
            </p>
          </div>
        </div>
        <div className="border-t border-background/10 px-4 py-4 text-center text-xs text-background/50">
          © 2026 كنوز — جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  );
}
