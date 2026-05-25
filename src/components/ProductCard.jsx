import React, { useState, useEffect } from 'react';
import { Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);

  const isInCart = cartItems?.some(item => item.id === product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isInCart) {
      addToCart(product);
      setShowNotification(true);
    }
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const isAvailable = (product.available === 1) || (product.available === true) || (product.available === '1');
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const renderStars = () => {
    const rating = Number(product.rating);
    const reviewCount = Number(product.reviewCount);

    if (!Number.isFinite(rating) && !Number.isFinite(reviewCount)) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 mt-2">
        {Number.isFinite(rating) && (
          <div className="flex text-green-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={12} fill={star <= rating ? "currentColor" : "none"} strokeWidth={2} />
            ))}
          </div>
        )}
        {Number.isFinite(reviewCount) && <span className="text-xs text-muted-foreground">({reviewCount})</span>}
      </div>
    );
  };

  return (
    <>
      <motion.div 
        className="group flex flex-col bg-card rounded-2xl h-full p-3 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
      >
        {/* Image Container with Light Gray Background */}
        <div 
          onClick={() => navigate(`/product/${product.id}`)}
          className="relative w-full h-64 bg-muted rounded-2xl overflow-hidden cursor-pointer flex items-center justify-center p-6 mb-4"
        >
          {/* Wishlist Heart Icon */}
          <button 
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background text-muted-foreground hover:text-red-500 shadow-sm transition-colors"
            onClick={(e) => { e.stopPropagation(); /* Add to wishlist logic */ }}
          >
            <Heart size={16} />
          </button>

          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-md" 
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground font-medium">
              No Image
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-grow px-2 pb-2">
          <div className="flex justify-between items-start cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {product.description}
              </p>
              {renderStars()}
            </div>
            <div className="flex flex-col items-end pl-2">
              <span className="text-[15px] font-extrabold text-foreground tracking-tight whitespace-nowrap">
                ₹{product.price}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5 whitespace-nowrap">
                / {product.unit}
              </span>
            </div>
          </div>
          
          <div className="mt-5">
            {!isAvailable ? (
              <button disabled className="px-6 py-2 rounded-full text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                Coming Soon
              </button>
            ) : isOutOfStock ? (
              <button disabled className="px-6 py-2 rounded-full text-xs font-semibold bg-destructive/10 text-destructive cursor-not-allowed">
                Out of Stock
              </button>
            ) : (
              <button 
                onClick={handleAddToCart}
                className={`cursor-target px-6 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isInCart 
                    ? 'bg-primary text-primary-foreground border border-primary' 
                    : 'bg-transparent text-foreground border border-border hover:border-primary hover:text-primary'
                }`}
              >
                {isInCart ? 'In Cart' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full bg-foreground text-background shadow-2xl shadow-black/20"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
              <Star size={12} fill="currentColor" />
            </div>
            <span className="font-medium text-sm">Added to cart successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;
