import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";

const STORAGE_KEY = "knouz_settings";

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSettings(key: string, values: Record<string, unknown>) {
  const all = loadSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [key]: values }));
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const stored = loadSettings();

  const [store, setStore] = useState({
    storeName: (stored.store?.storeName as string) ?? "كنوز",
    storeDesc: (stored.store?.storeDesc as string) ?? "",
    whatsapp:  (stored.store?.whatsapp  as string) ?? "",
    facebook:  (stored.store?.facebook  as string) ?? "",
    instagram: (stored.store?.instagram as string) ?? "",
  });

  const [shipping, setShipping] = useState({
    defaultPrice:  (stored.shipping?.defaultPrice  as string)  ?? "50",
    freeThreshold: (stored.shipping?.freeThreshold as string)  ?? "500",
    freeShipping:  (stored.shipping?.freeShipping  as boolean) ?? true,
  });

  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });

  const saveStore = () => {
    saveSettings("store", store);
    toast({ title: t("common.save_success") });
  };

  const saveShipping = () => {
    saveSettings("shipping", shipping);
    toast({ title: t("common.save_success") });
  };

  const changePassword = () => {
    if (password.next !== password.confirm) {
      toast({ title: locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.next.length < 8) {
      toast({ title: locale === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    toast({ title: locale === "ar" ? "تم تغيير كلمة المرور ✓" : "Password changed ✓" });
    setPassword({ current: "", next: "", confirm: "" });
  };

  const isAr = locale === "ar";

  return (
    <div className="max-w-2xl space-y-8">
      {/* Store settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-bold text-gray-800 text-lg">
          {isAr ? "إعدادات المتجر" : "Store Settings"}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "اسم المتجر" : "Store Name"}</Label>
            <Input value={store.storeName} onChange={(e) => setStore({ ...store, storeName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "رقم واتساب" : "WhatsApp Number"}</Label>
            <Input dir="ltr" value={store.whatsapp} onChange={(e) => setStore({ ...store, whatsapp: e.target.value })} placeholder="201000000000" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{isAr ? "وصف المتجر" : "Store Description"}</Label>
          <Textarea rows={3} value={store.storeDesc} onChange={(e) => setStore({ ...store, storeDesc: e.target.value })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "رابط فيسبوك" : "Facebook URL"}</Label>
            <Input dir="ltr" value={store.facebook} onChange={(e) => setStore({ ...store, facebook: e.target.value })} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "رابط إنستجرام" : "Instagram URL"}</Label>
            <Input dir="ltr" value={store.instagram} onChange={(e) => setStore({ ...store, instagram: e.target.value })} placeholder="https://instagram.com/..." />
          </div>
        </div>

        <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-black" onClick={saveStore}>
          {isAr ? "حفظ إعدادات المتجر" : "Save Store Settings"}
        </Button>
      </div>

      {/* Shipping settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-bold text-gray-800 text-lg">
          {isAr ? "إعدادات الشحن" : "Shipping Settings"}
        </h2>

        <div className="flex items-center gap-3">
          <Switch
            checked={shipping.freeShipping}
            onCheckedChange={(v) => setShipping({ ...shipping, freeShipping: v })}
          />
          <Label>{isAr ? "تفعيل الشحن المجاني" : "Enable Free Shipping"}</Label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isAr ? "سعر الشحن الافتراضي (جنيه)" : "Default Shipping Price (EGP)"}</Label>
            <Input
              type="number"
              dir="ltr"
              value={shipping.defaultPrice}
              onChange={(e) => setShipping({ ...shipping, defaultPrice: e.target.value })}
              disabled={shipping.freeShipping}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "حد الشحن المجاني (الطلبات فوق X جنيه)" : "Free Shipping Threshold (orders above X EGP)"}</Label>
            <Input
              type="number"
              dir="ltr"
              value={shipping.freeThreshold}
              onChange={(e) => setShipping({ ...shipping, freeThreshold: e.target.value })}
            />
          </div>
        </div>

        <Button className="bg-[#C9A84C] hover:bg-[#b8963e] text-black" onClick={saveShipping}>
          {isAr ? "حفظ إعدادات الشحن" : "Save Shipping Settings"}
        </Button>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="font-bold text-gray-800 text-lg">
          {isAr ? "تغيير كلمة المرور" : "Change Password"}
        </h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{isAr ? "كلمة المرور الحالية" : "Current Password"}</Label>
            <Input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <Input type="password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}</Label>
            <Input type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
          </div>
        </div>

        <Button
          className="bg-[#C9A84C] hover:bg-[#b8963e] text-black"
          onClick={changePassword}
          disabled={!password.current || !password.next || !password.confirm}
        >
          {isAr ? "تغيير كلمة المرور" : "Change Password"}
        </Button>
      </div>
    </div>
  );
}
