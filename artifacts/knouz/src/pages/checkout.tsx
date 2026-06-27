import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder } from "@workspace/api-client-react";
import { useAuth, SignInButton } from "@clerk/react";
import { ShoppingBag } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  governorate: z.string().min(2, "المحافظة مطلوبة"),
});

type FormValues = z.infer<typeof schema>;

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

const GOVERNORATES = [
  "القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية",
  "المنوفية","الغربية","كفر الشيخ","البحيرة","الإسماعيلية","بورسعيد",
  "السويس","دمياط","الفيوم","بني سويف","المنيا","أسيوط","سوهاج",
  "قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح",
  "شمال سيناء","جنوب سيناء",
];

export default function CheckoutPage() {
  const { isSignedIn, userId } = useAuth();
  const { items, subtotal, discount, total, coupon, clearCart } = useCartStore();
  const itemTotal = useCartStore((s) => s.itemTotal);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orderDone, setOrderDone] = useState<{ orderNumber: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (data) => {
        clearCart();
        setOrderDone({ orderNumber: data.orderNumber ?? "" });
      },
      onError: () =>
        toast({ title: "حدث خطأ أثناء إنشاء الطلب", variant: "destructive" }),
    },
  });

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground" strokeWidth={1} />
        <h2 className="text-xl font-bold">يجب تسجيل الدخول لإتمام الشراء</h2>
        <SignInButton mode="modal">
          <Button>تسجيل الدخول</Button>
        </SignInButton>
      </div>
    );
  }

  if (items.length === 0 && !orderDone) {
    navigate("/cart");
    return null;
  }

  if (orderDone) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-extrabold text-primary">تم إنشاء طلبك بنجاح!</h1>
        <p className="text-muted-foreground">رقم طلبك:</p>
        <code className="text-lg font-bold bg-primary/10 text-primary px-4 py-2 rounded-lg block">
          {orderDone.orderNumber}
        </code>
        <p className="text-sm text-muted-foreground">
          احتفظ بهذا الرقم لتتبع طلبك
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/track")}>تتبع الطلب</Button>
          <Button variant="outline" onClick={() => navigate("/")}>الرئيسية</Button>
        </div>
      </div>
    );
  }

  const onSubmit = (values: FormValues) => {
    createOrder.mutate({
      data: {
        userId: userId ?? undefined,
        total,
        shippingAddress: values as Record<string, unknown>,
        paymentMethod: "COD",
        couponCode: coupon?.code,
        discount: discount > 0 ? discount : undefined,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-8">إتمام الشراء</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-lg">بيانات الشحن</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input id="name" placeholder="محمد أحمد" {...register("name")} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input id="phone" placeholder="01xxxxxxxxx" {...register("phone")} dir="ltr" />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">العنوان التفصيلي *</Label>
              <Input id="address" placeholder="الشارع، المبنى، الشقة" {...register("address")} />
              {errors.address && <p className="text-destructive text-xs">{errors.address.message}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">المدينة *</Label>
                <Input id="city" placeholder="القاهرة" {...register("city")} />
                {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="governorate">المحافظة *</Label>
                <select
                  id="governorate"
                  {...register("governorate")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.governorate && <p className="text-destructive text-xs">{errors.governorate.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="font-bold text-lg">طريقة الدفع</h2>
            <div className="flex items-center gap-3 p-3 border-2 border-primary rounded-lg bg-primary/5">
              <input type="radio" checked readOnly id="cod" />
              <Label htmlFor="cod" className="cursor-pointer">الدفع عند الاستلام</Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
          </Button>
        </form>

        <div className="bg-card border border-border rounded-xl p-5 h-fit space-y-4">
          <h2 className="font-bold text-lg">ملخص الطلب ({itemTotal})</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2 text-sm">
                {item.image && (
                  <img src={item.image} alt={item.nameAr} className="w-10 h-10 rounded object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 font-medium">{item.nameAr}</p>
                  <p className="text-muted-foreground">× {item.quantity}</p>
                </div>
                <span className="text-sm font-medium shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع</span>
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
        </div>
      </div>
    </div>
  );
}
