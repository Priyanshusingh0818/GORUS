import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../utils/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const isInCart = cartItems?.some(item => item.id === product?.id);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsAPI.getById(id);
        setProduct(response.product);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (product && !isInCart) {
      addToCart({ ...product, available: product.available === 1 }, quantity);
      setShowNotification(true);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (product) {
      if (!isInCart) {
        addToCart({ ...product, available: product.available === 1 }, quantity);
      }
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
          <button 
            className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold"
            onClick={() => navigate('/products')}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = (product.available === 1) || (product.available === true) || (product.available === '1');
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const productMeta = [
    ['Unit', product.unit],
    ['Availability', !isAvailable ? 'Coming soon' : isOutOfStock ? 'Out of stock' : 'Available'],
    ['Stock', product.stock !== undefined ? product.stock : null],
    ['Tag', product.tag]
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumbs */}
        <nav className="flex text-sm text-muted-foreground mb-8 font-medium">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-primary">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left: Image Gallery */}
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full aspect-square bg-muted rounded-[2rem] flex items-center justify-center p-8"
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain drop-shadow-xl" 
                />
              ) : (
                <span className="text-muted-foreground">No Image Available</span>
              )}
            </motion.div>
          </div>

          {/* Right: Product Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col pt-4"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-muted-foreground mb-3 leading-relaxed text-sm">
              {product.description || 'No description has been added for this product yet.'}
            </p>
            
            {/* Price Line */}
            <div className="border-t border-border pt-6 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-foreground">₹{product.price}.00</span>
                <span className="text-muted-foreground font-medium">/ {product.unit}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-10">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-muted rounded-full border border-border px-2 py-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
                  <button 
                    onClick={() => {
                      const maxQuantity = Number.isFinite(Number(product.stock)) ? Number(product.stock) : null;
                      setQuantity(maxQuantity === null ? quantity + 1 : Math.min(maxQuantity, quantity + 1));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="text-sm">
                  {product.stock !== undefined && product.stock > 0 ? (
                    <p><span className="font-bold text-orange-500">Only {product.stock} Items</span> Left!<br/><span className="text-muted-foreground">Don't miss it</span></p>
                  ) : (
                    <p className="text-green-600 font-medium">In Stock</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {!isAvailable ? (
                <button disabled className="flex-1 py-3.5 rounded-full font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                  Coming Soon
                </button>
              ) : isOutOfStock ? (
                <button disabled className="flex-1 py-3.5 rounded-full font-semibold bg-destructive/10 text-destructive cursor-not-allowed">
                  Out of Stock
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleBuyNow}
                    className="cursor-target flex-1 py-3.5 rounded-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                  >
                    Buy Now
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    className={`cursor-target flex-1 py-3.5 rounded-full font-semibold transition-all ${
                      isInCart 
                        ? 'bg-muted text-foreground border border-border' 
                        : 'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    {isInCart ? 'In Cart' : 'Add to Cart'}
                  </button>
                </>
              )}
            </div>

            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {productMeta.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 p-4 bg-card">
                  <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </div>

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
              <ShoppingCart size={12} fill="currentColor" />
            </div>
            <span className="font-medium text-sm">Added to cart successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
