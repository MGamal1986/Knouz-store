import { useAuth, useUser, SignInButton, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Package, LogIn, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getListOrdersQueryOptions } from "@workspace/api-client-react";
import { Link } from "wouter";
import type { Order } from "@workspace/api-client-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "قيد الانتظار", variant: "secondary" },
  CONFIRMED: { label: "مؤكد", variant: "default" },
  SHIPPED: { label: "تم الشحن", variant: "default" },
  DELIVERED: { label: "تم التسليم", variant: "default" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
};

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(p) + " جنيه";

export default function AccountPage() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const { data: ordersData, isLoading } = useQuery({
    ...getListOrdersQueryOptions({ userId: userId ?? undefined }),
    enabled: !!userId,
  });

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <LogIn size={48} className="mx-auto text-muted-foreground" strokeWidth={1} />
        <h1 className="text-2xl font-bold">حسابي</h1>
        <p className="text-muted-foreground">سجل دخولك لعرض طلباتك وإدارة حسابك</p>
        <SignInButton mode="modal">
          <Button className="gap-2">
            <LogIn size={16} />
            تسجيل الدخول
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">حسابي</h1>
        <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
        {user?.imageUrl && (
          <img
            src={user.imageUrl}
            alt={user.fullName ?? ""}
            className="w-14 h-14 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-bold text-lg">{user?.fullName ?? "مستخدم"}</p>
          <p className="text-muted-foreground text-sm">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package size={20} />
          طلباتي ({ordersData?.orders?.length ?? 0})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : ordersData?.orders?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p>لا توجد طلبات بعد</p>
            <Link href="/shop">
              <Button className="mt-3" variant="outline">ابدأ التسوق</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(ordersData?.orders ?? []).map((order: Order) => {
              const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS["PENDING"];
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold font-mono text-sm">{order.orderNumber ?? order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(order.items ?? []).slice(0, 3).map((item) => (
                          <span key={item.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {item.productName ?? item.productId} × {item.quantity}
                          </span>
                        ))}
                        {(order.items?.length ?? 0) > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{(order.items?.length ?? 0) - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      <p className="font-bold text-primary text-sm">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-end">
                    <Link href={`/track?orderNumber=${order.orderNumber ?? ""}`}>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        تتبع الطلب
                        <ChevronLeft size={12} />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
