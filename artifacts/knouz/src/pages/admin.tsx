import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Tag,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getGetAdminStatsQueryOptions,
  getGetSalesChartQueryOptions,
  getListProductsQueryOptions,
  getListOrdersQueryOptions,
  getListCouponsQueryOptions,
  getListCategoriesQueryOptions,
  useCreateProduct,
  useUpdateOrder,
  useDeleteProduct,
  useCreateCoupon,
  useDeleteCoupon,
  OrderStatusUpdateStatus,
} from "@workspace/api-client-react";
import type { Order, Product, Coupon, Category } from "@workspace/api-client-react";
import { useAuth, SignInButton } from "@clerk/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(Math.round(p)) + " جنيه";

const STATUS_OPTIONS = Object.values(OrderStatusUpdateStatus);
const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

function StatsTab() {
  const { data: stats, isLoading } = useQuery(getGetAdminStatsQueryOptions());
  const { data: sales } = useQuery(getGetSalesChartQueryOptions());

  const cards = [
    { label: "إجمالي الإيرادات", value: stats ? formatPrice(stats.totalRevenue) : "-", icon: <TrendingUp size={20} />, color: "text-primary" },
    { label: "إجمالي الطلبات", value: stats?.totalOrders ?? "-", icon: <ShoppingBag size={20} />, color: "text-blue-500" },
    { label: "طلبات قيد الانتظار", value: stats?.pendingOrders ?? "-", icon: <Package size={20} />, color: "text-purple-500" },
    { label: "إجمالي العملاء", value: stats?.totalCustomers ?? "-", icon: <Users size={20} />, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) =>
          isLoading ? (
            <Skeleton key={card.label} className="h-24 rounded-xl" />
          ) : (
            <div key={card.label} className="bg-card border border-border rounded-xl p-4">
              <div className={`flex items-center gap-2 mb-2 ${card.color}`}>
                {card.icon}
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-extrabold">{card.value}</p>
            </div>
          )
        )}
      </div>

      {sales && sales.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold mb-4">المبيعات الشهرية (جنيه)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatPrice(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nameAr: "", descriptionAr: "", price: "", comparePrice: "", stock: "", categoryId: "", images: "",
  });

  const { data: products, isLoading } = useQuery(getListProductsQueryOptions({ limit: 50 }));
  const { data: categories } = useQuery(getListCategoriesQueryOptions());

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم إضافة المنتج" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryOptions({ limit: 50 }).queryKey });
        setOpen(false);
        setForm({ nameAr: "", descriptionAr: "", price: "", comparePrice: "", stock: "", categoryId: "", images: "" });
      },
      onError: () => toast({ title: "خطأ في إضافة المنتج", variant: "destructive" }),
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم حذف المنتج" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryOptions({ limit: 50 }).queryKey });
      },
    },
  });

  const handleCreate = () => {
    createProduct.mutate({
      data: {
        nameAr: form.nameAr,
        descriptionAr: form.descriptionAr,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        stock: Number(form.stock),
        categoryId: form.categoryId || "",
        images: form.images ? form.images.split(",").map((s) => s.trim()) : [],
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{products?.total ?? 0} منتج</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة منتج جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>اسم المنتج بالعربي *</Label>
                <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>الوصف بالعربي</Label>
                <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>السعر (جنيه) *</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>سعر المقارنة</Label>
                  <Input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>المخزون *</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>الفئة</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c: Category) => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>روابط الصور (مفصولة بفاصلة)</Label>
                <Textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} rows={2} dir="ltr" placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.nameAr || !form.price || !form.stock || createProduct.isPending}>
                {createProduct.isPending ? "جاري الإضافة..." : "إضافة المنتج"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(products?.products ?? []).map((p: Product) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              {p.images?.[0] && (
                <img src={p.images[0]} alt={p.nameAr} className="w-12 h-12 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{p.nameAr}</p>
                <p className="text-xs text-muted-foreground">{p.category?.nameAr} · مخزون: {p.stock}</p>
              </div>
              <div className="text-end shrink-0">
                <p className="font-bold text-primary text-sm">{formatPrice(p.price)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => deleteProduct.mutate({ id: p.id })}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: ordersData, isLoading } = useQuery(getListOrdersQueryOptions());

  const updateOrder = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم تحديث حالة الطلب" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryOptions().queryKey });
      },
    },
  });

  return (
    <div className="space-y-2">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : (ordersData?.orders ?? []).length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">لا توجد طلبات</p>
      ) : (
        (ordersData?.orders ?? []).map((order: Order) => (
          <div key={order.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-48">
              <p className="font-bold font-mono text-sm">{order.orderNumber ?? order.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : ""} · {order.items?.length ?? 0} منتج
              </p>
              <p className="text-primary font-bold text-sm mt-1">{formatPrice(order.total)}</p>
            </div>
            <Select
              value={order.status}
              onValueChange={(status) =>
                updateOrder.mutate({
                  id: order.id,
                  data: { status: status as typeof OrderStatusUpdateStatus[keyof typeof OrderStatusUpdateStatus] },
                })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))
      )}
    </div>
  );
}

function CouponsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discount: "", type: "PERCENTAGE", minOrder: "" });

  const { data: coupons, isLoading } = useQuery(getListCouponsQueryOptions());

  const createCoupon = useCreateCoupon({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم إضافة الكوبون" });
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryOptions().queryKey });
        setOpen(false);
        setForm({ code: "", discount: "", type: "PERCENTAGE", minOrder: "" });
      },
      onError: () => toast({ title: "خطأ في إضافة الكوبون", variant: "destructive" }),
    },
  });

  const deleteCoupon = useDeleteCoupon({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم حذف الكوبون" });
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryOptions().queryKey });
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{(coupons ?? []).length} كوبون</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>إضافة كوبون خصم</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>كود الخصم *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>قيمة الخصم *</Label>
                  <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>نوع الخصم</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">نسبة %</SelectItem>
                      <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>الحد الأدنى للطلب</Label>
                <Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} dir="ltr" placeholder="0" />
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  createCoupon.mutate({
                    data: {
                      code: form.code,
                      discount: Number(form.discount),
                      type: form.type as "PERCENTAGE" | "FIXED",
                      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
                    },
                  })
                }
                disabled={!form.code || !form.discount || createCoupon.isPending}
              >
                {createCoupon.isPending ? "جاري الإضافة..." : "إضافة الكوبون"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (coupons ?? []).length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">لا توجد كوبونات</p>
      ) : (
        <div className="space-y-2">
          {(coupons ?? []).map((c: Coupon) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <Tag size={18} className="text-primary shrink-0" />
              <div className="flex-1">
                <code className="font-bold text-primary">{c.code}</code>
                <p className="text-xs text-muted-foreground mt-0.5">
                  خصم {c.discount}{c.type === "PERCENTAGE" ? "%" : " جنيه"}
                  {c.minOrder ? ` · الحد الأدنى ${formatPrice(c.minOrder)}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteCoupon.mutate({ id: c.id })}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
        <SignInButton mode="modal">
          <Button>تسجيل الدخول</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={28} className="text-primary" />
        <h1 className="text-3xl font-extrabold">لوحة التحكم</h1>
      </div>

      <Tabs defaultValue="stats" dir="rtl">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp size={14} />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package size={14} />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag size={14} />
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2">
            <Tag size={14} />
            الكوبونات
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
