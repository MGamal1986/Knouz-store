import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, CheckCircle, Clock, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTrackOrderQueryOptions } from "@workspace/api-client-react";

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING: { label: "قيد الانتظار", icon: <Clock size={20} />, color: "text-yellow-500" },
  CONFIRMED: { label: "مؤكد", icon: <CheckCircle size={20} />, color: "text-blue-500" },
  SHIPPED: { label: "تم الشحن", icon: <Truck size={20} />, color: "text-purple-500" },
  DELIVERED: { label: "تم التسليم", icon: <CheckCircle size={20} />, color: "text-green-600" },
  CANCELLED: { label: "ملغي", icon: <XCircle size={20} />, color: "text-destructive" },
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(p) + " جنيه";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    ...getTrackOrderQueryOptions({ orderNumber, phone }),
    enabled: submitted && Boolean(orderNumber) && Boolean(phone),
  });

  const handleSearch = () => {
    setSubmitted(true);
  };

  const statusInfo = order ? (STATUS_MAP[order.status] ?? STATUS_MAP["PENDING"]) : null;
  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Package size={48} className="mx-auto text-primary mb-3" strokeWidth={1.5} />
        <h1 className="text-3xl font-extrabold mb-2">تتبع طلبك</h1>
        <p className="text-muted-foreground">أدخل رقم الطلب ورقم الهاتف لمتابعة حالة طلبك</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
        <div className="space-y-1.5">
          <Label>رقم الطلب</Label>
          <Input
            placeholder="KNZ-XXXXXXXX"
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value.toUpperCase());
              setSubmitted(false);
            }}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label>رقم الهاتف</Label>
          <Input
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSubmitted(false);
            }}
            dir="ltr"
          />
        </div>
        <Button
          className="w-full gap-2"
          onClick={handleSearch}
          disabled={!orderNumber || !phone || isLoading}
        >
          <Search size={16} />
          {isLoading ? "جاري البحث..." : "تتبع الطلب"}
        </Button>
      </div>

      {submitted && error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center">
          لم يتم العثور على طلب بهذه البيانات
        </div>
      )}

      {order && statusInfo && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">رقم الطلب</p>
              <p className="font-bold font-mono">{order.orderNumber}</p>
            </div>
            <div className={`flex items-center gap-2 font-semibold ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </div>
          </div>

          {order.status !== "CANCELLED" && (
            <div className="relative">
              <div className="absolute top-4 start-4 end-4 h-0.5 bg-muted" />
              <div
                className="absolute top-4 start-4 h-0.5 bg-primary transition-all"
                style={{
                  width: `${Math.max(0, currentStep) * (100 / (STATUS_STEPS.length - 1))}%`,
                }}
              />
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, idx) => {
                  const done = currentStep >= idx;
                  const info = STATUS_MAP[step];
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {info.icon}
                      </div>
                      <span className={`text-xs font-medium ${done ? "text-primary" : "text-muted-foreground"}`}>
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ الطلب</span>
              <span>
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
            </div>
            {order.shippingAddress && typeof order.shippingAddress === "object" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">عنوان الشحن</span>
                <span className="text-end max-w-xs">
                  {(order.shippingAddress as Record<string, string>).address},{" "}
                  {(order.shippingAddress as Record<string, string>).city}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
