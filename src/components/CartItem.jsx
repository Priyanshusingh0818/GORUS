import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import OptimizedImage from './OptimizedImage';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="premium-card premium-card-hover flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
      <div className="relative flex h-32 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted p-3 sm:w-32">
        {item.image ? (
          <OptimizedImage
            src={item.image}
            alt={item.name}
            loading="lazy"
            sizes="128px"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold text-foreground">{item.name}</h3>
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">{formatCurrency(item.price)}</span>
            <span className="text-xs font-medium text-muted-foreground">/ {item.unit}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5 sm:justify-end">
          <div className="flex items-center gap-3 rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-background hover:text-primary hover:shadow-sm active:scale-95"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center font-bold text-foreground">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-background hover:text-primary hover:shadow-sm active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <div className="hidden min-w-[92px] flex-col items-end sm:flex">
            <span className="text-xs font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</span>
          </div>

          <button
            type="button"
            onClick={() => removeFromCart(item.id)}
            aria-label="Remove item"
            className="flex h-10 w-10 items-center justify-center rounded-full text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
