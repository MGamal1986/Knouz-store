import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import {
  getListProductsQueryOptions,
  getListCategoriesQueryOptions,
} from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/contexts/LocaleContext";

export default function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const { data: featuredData, isLoading: loadingProducts } = useQuery(
    getListProductsQueryOptions({ featured: true, limit: 8 })
  );
  const { data: categories, isLoading: loadingCats } = useQuery(
    getListCategoriesQueryOptions()
  );

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles size={14} />
            {t("home.new_arrivals")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight max-w-2xl">
            {t("home.hero_title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            {t("home.hero_subtitle")}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                {t("home.hero_cta")}
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <Link href="/track">
              <Button size="lg" variant="outline">
                {t("home.hero_track")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">{t("home.categories_title")}</h2>
        {loadingCats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(categories ?? []).map((cat: Category) => (
              <Link key={cat.id} href={`/shop?category=${cat.id}`}>
                <div className="relative rounded-xl overflow-hidden group cursor-pointer h-36">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white font-bold text-lg">
                      {locale === "en" && (cat as any).nameEn ? (cat as any).nameEn : cat.nameAr}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("home.featured_title")}</h2>
          <Link href="/shop">
            <Button variant="ghost" className="gap-1 text-primary">
              {t("home.view_all")}
              <ArrowLeft size={14} />
            </Button>
          </Link>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(featuredData?.products ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-primary/10 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">{t("home.coupon_title")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("home.coupon_desc", { code: "KNOUZ10" }).split("KNOUZ10").map((part, i, arr) =>
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <code className="bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold">
                    KNOUZ10
                  </code>
                </span>
              ) : part
            )}
          </p>
          <Link href="/shop">
            <Button size="lg">{t("home.shop_now")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
