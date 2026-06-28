import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, CheckCircle, Clock, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTrackOrderQueryOptions } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPrice, formatDate } from "@/lib/formatters";

export default function TrackPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    PENDING: { label: t("track.status_pending"), icon: <Clock size={20} />, color: "text-yellow-500" },
    CONFIRMED: { label: t("track.status_confirmed"), icon: <CheckCircle size={20} />, color: "text-blue-500" },
    SHIPPED: { label: t("track.status_shipped"), icon: <Truck size={20} />, color: "text-purple-500" },
    DELIVERED: { label: t("track.status_delivered"), icon: <CheckCircle size={20} />, color: "text-green-600" },
    CANCELLED: { label: t("track.status_cancelled"), icon: <XCircle size={20} />, color: "text-destructive" },
  };

  const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

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
        <h1 className="text-3xl font-extrabold mb-2">{t("track.title")}</h1>
        <p className="text-muted-foreground">{t("track.subtitle")}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
        <div className="space-y-1.5">
          <Label>{t("track.order_number")}</Label>
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
          <Label>{t("track.phone")}</Label>
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
          {isLoading ? t("track.searching") : t("track.track_btn")}
        </Button>
      </div>

      {submitted && error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center">
          {t("track.not_found")}
        </div>
      )}

      {order && statusInfo && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("track.order_number")}</p>
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
              <span className="text-muted-foreground">{t("track.order_date")}</span>
              <span>
                {order.createdAt ? formatDate(order.createdAt, locale) : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("track.order_total")}</span>
              <span className="font-bold text-primary">{formatPrice(order.total, locale)}</span>
            </div>
            {order.shippingAddress && typeof order.shippingAddress === "object" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("track.shipping_address")}</span>
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
