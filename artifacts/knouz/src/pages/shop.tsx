import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import {
  getListProductsQueryOptions,
  getListCategoriesQueryOptions,
} from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";
import { useSearch } from "wouter";

export default function ShopPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const defaultCat = params.get("category") ?? "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(defaultCat);
  const [page, setPage] = useState(1);

  const { data: products, isLoading } = useQuery(
    getListProductsQueryOptions({
      search: search || undefined,
      category: category || undefined,
      page,
      limit: 12,
    })
  );
  const { data: categories } = useQuery(getListCategoriesQueryOptions());

  const totalPages = products ? Math.ceil((products.total ?? 0) / 12) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-6">المتجر</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9"
          />
        </div>
        <Select
          value={category || "all"}
          onValueChange={(v) => {
            setCategory(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal size={14} className="me-2" />
            <SelectValue placeholder="كل الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            {(categories ?? []).map((cat: Category) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : products?.products?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">لا توجد منتجات</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {products?.total ?? 0} منتج
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(products?.products ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                السابق
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
