import { useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, X, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart";
import { useToast } from "@/hooks/use-toast";
import { useValidateCoupon } from "@workspace/api-client-react";

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discount,
    total,
    coupon,
    setCoupon,
  } = useCartStore();
  const itemTotal = useCartStore((s) => s.itemTotal);
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");

  const validateCoupon = useValidateCoupon({
    mutation: {
      onSuccess: (data) => {
        setCoupon({
          code: couponCode,
          discountAmount: data.discountAmount,
          type: data.type as "PERCENTAGE" | "FIXED",
        });
        toast({ title: `✓ تم تطبيق الكود: ${couponCode}` });
      },
      onError: () =>
        toast({ title: "كود غير صالح أو منتهي الصلاحية", variant: "destructive" }),
    },
  });

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingCart size={64} strokeWidth={1} className="mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">سلتك فارغة</h1>
        <p className="text-muted-foreground">ابدأ التسوق لإضافة منتجات</p>
        <Link href="/shop">
          <Button>تسوق الآن</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-8">سلة التسوق ({itemTotal})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-card border border-border rounded-xl"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.nameAr}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.id}`}>
                  <p className="font-semibold hover:text-primary transition-colors line-clamp-2">
                    {item.nameAr}
                  </p>
                </Link>
                <p className="text-primary font-bold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity(item.id, item.quantity - 1)
                        : removeItem(item.id)
                    }
                    className="w-7 h-7 border border-border rounded flex items-center justify-center text-sm hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        Math.min(item.quantity + 1, item.stock)
                      )
                    }
                    className="w-7 h-7 border border-border rounded flex items-center justify-center text-sm hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
                <p className="font-bold text-sm">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-lg">ملخص الطلب</h2>

            <div className="flex gap-2">
              <Input
                placeholder="كود الخصم"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="text-start"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  validateCoupon.mutate({
                    data: { code: couponCode, orderTotal: subtotal },
                  })
                }
                disabled={!couponCode || validateCoupon.isPending}
              >
                <Tag size={16} />
              </Button>
            </div>
            {coupon && (
              <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <span>✓ {coupon.code}</span>
                <button onClick={() => setCoupon(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {coupon && discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم ({coupon.code})</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">الشحن</span>
                <span className="text-green-600">مجاني</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>الإجمالي</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            <Link href="/checkout">
              <Button className="w-full gap-2">
                إتمام الشراء
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
