import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  productIds: string[];
  toggle: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) => set((state) => {
        if (state.productIds.includes(id)) {
          return { productIds: state.productIds.filter((p) => p !== id) };
        }
        return { productIds: [...state.productIds, id] };
      }),
      isInWishlist: (id) => get().productIds.includes(id),
    }),
    {
      name: 'knouz-wishlist',
    }
  )
);
