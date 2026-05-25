import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
      
      {/* Image Container */}
      <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-muted border border-border relative">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row flex-1 gap-6 sm:items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">₹{item.price}</span>
            <span className="text-xs font-medium text-muted-foreground">/ {item.unit}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between sm:justify-end">
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 p-1 rounded-full border border-border bg-muted">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:text-primary hover:shadow-sm transition-all active:scale-95"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center font-bold text-foreground">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:text-primary hover:shadow-sm transition-all active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Total Price */}
          <div className="flex flex-col items-end hidden sm:flex min-w-[80px]">
            <span className="text-xs font-medium text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>

          {/* Mobile Total */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className="text-lg font-bold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            aria-label="Remove item"
            className="w-10 h-10 flex items-center justify-center rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
