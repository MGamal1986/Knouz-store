import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nameAr: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock: number;
}

export type CouponType = 'PERCENTAGE' | 'FIXED';

export interface CartCoupon {
  code: string;
  discountAmount: number;
  type: CouponType;
}

interface CartState {
  items: CartItem[];
  coupon: CartCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCoupon: (coupon: CartCoupon | null) => void;
  clearCart: () => void;
  get itemTotal(): number;
  get subtotal(): number;
  get total(): number;
  get discount(): number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          return {
            items: state.items.map((i) => 
              i.id === item.id ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i))
      })),
      setCoupon: (coupon) => set({ coupon }),
      clearCart: () => set({ items: [], coupon: null }),
      get itemTotal() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      get discount() {
        const state = get();
        if (!state.coupon) return 0;
        if (state.coupon.type === 'PERCENTAGE') {
          return state.subtotal * (state.coupon.discountAmount / 100);
        }
        return Math.min(state.subtotal, state.coupon.discountAmount);
      },
      get total() {
        const state = get();
        return Math.max(0, state.subtotal - state.discount);
      }
    }),
    {
      name: 'knouz-cart',
    }
  )
);
