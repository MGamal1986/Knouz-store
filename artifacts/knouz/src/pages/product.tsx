import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useToast } from "@/hooks/use-toast";
import { useCreateReview } from "@workspace/api-client-react";
import {
  getGetProductQueryOptions,
  getListProductReviewsQueryOptions,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import type { Review } from "@workspace/api-client-react";

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(p) + " جنيه";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className="focus:outline-none"
        >
          <Star
            size={20}
            className={
              i <= value
                ? "fill-primary text-primary"
                : "fill-muted text-muted-foreground"
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn, userId } = useAuth();
  const { toast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const queryClient = useQueryClient();

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: product, isLoading } = useQuery(getGetProductQueryOptions(id!));
  const { data: reviews } = useQuery(getListProductReviewsQueryOptions(id!));

  const reviewMutation = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "شكراً لمراجعتك!" });
        setComment("");
        setRating(5);
        queryClient.invalidateQueries({ queryKey: getListProductReviewsQueryOptions(id!).queryKey });
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">
        المنتج غير موجود
      </div>
    );
  }

  const images = product.images ?? [];
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.comparePrice as number)) * 100)
    : 0;
  const wished = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      nameAr: product.nameAr,
      price: product.price,
      image: images[0] ?? null,
      quantity: qty,
      stock: product.stock,
    });
    toast({ title: "تمت الإضافة إلى السلة ✓" });
  };

  const handleReview = () => {
    if (!isSignedIn) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    reviewMutation.mutate({
      id: id!,
      data: { rating, comment, userId: userId ?? undefined },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">الرئيسية</Link>
        <ArrowRight size={12} />
        <Link href="/shop" className="hover:text-foreground">المتجر</Link>
        <ArrowRight size={12} />
        <span className="text-foreground truncate max-w-48">{product.nameAr}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {images.length > 0 ? (
              <img
                src={images[imgIdx]}
                alt={product.nameAr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                  className="absolute start-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))}
                  className="absolute end-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                    i === imgIdx ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {product.category?.nameAr && (
            <Badge variant="secondary">{product.category.nameAr}</Badge>
          )}
          <h1 className="text-2xl font-extrabold leading-snug">{product.nameAr}</h1>

          {product.avgRating && product.avgRating > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(Number(product.avgRating))} />
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount ?? 0} مراجعة)
              </span>
            </div>
          ) : null}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-primary">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePrice as number)}
                </span>
                <Badge className="bg-destructive text-destructive-foreground">
                  خصم {discountPct}%
                </Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.descriptionAr}</p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">المخزون:</span>
            <span
              className={`text-sm font-medium ${
                product.stock > 5 ? "text-green-600" : "text-destructive"
              }`}
            >
              {product.stock > 0 ? `${product.stock} قطعة متاحة` : "نفذ المخزون"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-muted text-sm"
              >
                −
              </button>
              <span className="px-4 py-2 text-sm font-medium border-x border-border">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 hover:bg-muted text-sm"
              >
                +
              </button>
            </div>
            <Button
              className="flex-1 gap-2"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={16} />
              أضف للسلة
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggle(product.id)}
            >
              <Heart
                size={18}
                className={wished ? "fill-red-500 text-red-500" : ""}
              />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-bold mb-4">المراجعات ({reviews?.length ?? 0})</h2>
          {reviews?.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا توجد مراجعات بعد</p>
          ) : (
            <div className="space-y-4">
              {(reviews ?? []).map((r: Review) => (
                <div key={r.id} className="border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <StarRating value={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar-EG") : ""}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">اترك مراجعتك</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">التقييم</label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
              placeholder="اكتب رأيك في المنتج..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className="w-full"
            >
              {reviewMutation.isPending ? "جاري الإرسال..." : "إرسال المراجعة"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
