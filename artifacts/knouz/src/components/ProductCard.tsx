import { Link } from "wouter";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

const formatPrice = (p: number) =>
  new Intl.NumberFormat("ar-EG").format(p) + " جنيه";

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const { toast } = useToast();
  const wished = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      nameAr: product.nameAr,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity: 1,
      stock: product.stock,
    });
    toast({ title: "تمت الإضافة إلى السلة ✓" });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product.id);
  };

  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        (1 - product.price / (product.comparePrice as number)) * 100
      )
    : 0;

  return (
    <Link href={`/product/${product.id}`}>
      <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.nameAr}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🛍️
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute top-2 start-2 bg-secondary text-secondary-foreground text-xs">
              خصم {discountPct}%
            </Badge>
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-2 end-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
          >
            <Heart
              size={16}
              className={wished ? "fill-red-500 text-red-500" : "text-gray-500"}
            />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-2 flex-1">
          <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">
            {product.nameAr}
          </p>

          {product.avgRating && product.avgRating > 0 ? (
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-primary text-primary" />
              <span className="text-xs text-muted-foreground">
                {Number(product.avgRating).toFixed(1)} ({product.reviewCount ?? 0})
              </span>
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-2">
            <div>
              <p className="font-bold text-primary">{formatPrice(product.price)}</p>
              {hasDiscount && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.comparePrice as number)}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="shrink-0"
            >
              <ShoppingCart size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
