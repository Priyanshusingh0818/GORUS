import React, { memo } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import OptimizedImage from './OptimizedImage';

const ProductCard = ({ product }) => {
  const { addToCart, cartItems, openCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isInCart = cartItems?.some(item => item.id === product.id);
  const isAvailable = product.available === 1 || product.available === true || product.available === '1';
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const description = product.description || 'A fresh GORUS dairy essential for careful everyday kitchens.';
  const rating = Number(product.rating);
  const reviewCount = Number(product.reviewCount);

  const goToProduct = () => navigate(`/product/${product.id}`);

  const handleAddToCart = (event) => {
    event.stopPropagation();

    if (!user) {
      navigate('/login', { state: { redirectTo: `/product/${product.id}` } });
      return;
    }

    if (isInCart) {
      openCart();
      return;
    }

    addToCart(product, 1);
  };

  return (
    <article className="group premium-card premium-card-hover flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <button
          type="button"
          onClick={goToProduct}
          className="flex h-full w-full items-center justify-center p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={`View ${product.name}`}
        >
          {product.image ? (
            <OptimizedImage
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full object-contain drop-shadow-sm transition duration-500 ease-out group-hover:scale-[1.045]"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">No image</span>
          )}
        </button>

        <span className="absolute left-4 top-4 z-10 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur">
          {product.tag || 'Fresh'}
        </span>

        <button
          type="button"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Save ${product.name}`}
        >
          <Heart size={16} />
        </button>

        <span className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-2 rounded-full bg-background/95 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-foreground opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View details
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button
          type="button"
          onClick={goToProduct}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <h3 className="line-clamp-2 min-h-[42px] text-[17px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </button>

        {(Number.isFinite(rating) || Number.isFinite(reviewCount)) && (
          <div className="mt-3 flex items-center gap-2">
            {Number.isFinite(rating) && (
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={13} fill={star <= rating ? 'currentColor' : 'none'} strokeWidth={2} />
                ))}
              </div>
            )}
            {Number.isFinite(reviewCount) && <span className="text-xs font-medium text-muted-foreground">{reviewCount} reviews</span>}
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Price</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-foreground">{formatCurrency(product.price)}</span>
                <span className="text-xs font-semibold text-muted-foreground">/ {product.unit}</span>
              </div>
            </div>
            {isAvailable && !isOutOfStock && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Available
              </span>
            )}
          </div>

          {!isAvailable ? (
            <button disabled className="premium-button min-h-[44px] w-full bg-muted px-5 text-sm font-semibold text-muted-foreground">
              Coming Soon
            </button>
          ) : isOutOfStock ? (
            <button disabled className="premium-button min-h-[44px] w-full bg-destructive/10 px-5 text-sm font-semibold text-destructive">
              Out of Stock
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className={
                isInCart
                  ? 'premium-button min-h-[44px] w-full border border-primary/20 bg-primary/10 px-5 text-sm text-primary hover:bg-primary/15'
                  : 'premium-button-primary min-h-[44px] w-full px-5 text-sm'
              }
            >
              <ShoppingBag size={17} />
              {isInCart ? 'View Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default memo(ProductCard);
