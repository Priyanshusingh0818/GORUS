import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, HelpCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import OptimizedImage from '../components/OptimizedImage';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productsAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const RECENTLY_VIEWED_KEY = 'gorusRecentlyViewed';

const productFaqs = [
  {
    question: 'How fresh will my order be?',
    answer: 'Orders are packed around current availability, so you see clear stock before checkout and receive the freshest listed batch.'
  },
  {
    question: 'What if something arrives damaged or incorrect?',
    answer: 'Contact support with your order details. The team will help with a correction, replacement, or refund review depending on the issue.'
  },
  {
    question: 'Can I pay after delivery?',
    answer: 'Cash on Delivery is available at checkout alongside UPI, so you can choose the payment option that feels most comfortable.'
  }
];

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const isInCart = cartItems?.some(item => item.id === product?.id);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productsAPI.getById(id);
        if (!isMounted) return;
        setProduct(response.product);
        setActiveImage(response.product?.image || '');
        setQuantity(1);
      } catch (error) {
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return undefined;

    let isMounted = true;

    const fetchRelated = async () => {
      try {
        const response = await productsAPI.getAll({
          available: '1',
          limit: 8,
          ...(product.tag ? { tag: product.tag } : {})
        });
        if (!isMounted) return;

        setRelatedProducts((response.products || []).filter(item => item.id !== product.id).slice(0, 4));
      } catch (error) {
        if (isMounted) setRelatedProducts([]);
      }
    };

    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;

    try {
      const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
      const recent = Array.isArray(stored) ? stored : [];
      const current = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit,
        image: product.image,
        available: product.available,
        tag: product.tag,
        stock: product.stock
      };
      const next = [current, ...recent.filter(item => item.id !== product.id)].slice(0, 5);

      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      setRecentProducts(next.filter(item => item.id !== product.id).slice(0, 4));
    } catch (error) {
      setRecentProducts([]);
    }
  }, [product]);

  const isAvailable = product?.available === 1 || product?.available === true || product?.available === '1';
  const isOutOfStock = product?.stock !== undefined && product?.stock <= 0;
  const maxQuantity = Number.isFinite(Number(product?.stock)) ? Number(product.stock) : null;

  const productBenefits = [
    'Freshness-first handling from product to checkout',
    product?.tag ? `Curated under ${product.tag}` : 'Part of the focused GORUS dairy catalogue',
    'Clear availability, simple pricing, and reachable support'
  ];

  const productMeta = [
    ['Unit', product?.unit],
    ['Availability', !isAvailable ? 'Coming soon' : isOutOfStock ? 'Out of stock' : 'Available'],
    ['Stock', product?.stock !== undefined ? product.stock : null],
    ['Category', product?.tag]
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: `/product/${id}` } });
      return;
    }

    if (product) {
      addToCart({ ...product, available: product.available === 1 }, quantity);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: `/product/${id}` } });
      return;
    }

    if (product) {
      addToCart({ ...product, available: product.available === 1 }, quantity, { openDrawer: false });
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="page-shell section-y">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="skeleton aspect-square rounded-lg" />
            <div className="space-y-5 pt-4">
              <div className="skeleton h-5 w-32 rounded-full" />
              <div className="skeleton h-12 w-4/5 rounded-full" />
              <div className="skeleton h-4 w-full rounded-full" />
              <div className="skeleton h-4 w-3/4 rounded-full" />
              <div className="skeleton h-14 w-52 rounded-full" />
              <div className="flex gap-3">
                <div className="skeleton h-12 flex-1 rounded-full" />
                <div className="skeleton h-12 flex-1 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Product not found</h2>
          <button className="premium-button-primary mt-4" onClick={() => navigate('/products')}>
            Back to products
          </button>
        </div>
      </div>
    );
  }

  const recommendations = relatedProducts.length > 0 ? relatedProducts : recentProducts;

  return (
    <main className="min-h-screen bg-background pb-28 lg:pb-0">
      <div className="page-shell section-y">
        <nav className="mb-8 flex text-sm font-medium text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="transition hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="transition hover:text-primary">Products</Link>
          <span className="mx-2">/</span>
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="lg:sticky lg:top-28"
            aria-label={`${product.name} gallery`}
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {activeImage || product.image ? (
                <motion.div
                  key={activeImage || product.image || product.id}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="h-full w-full"
                >
                  <OptimizedImage
                    src={activeImage || product.image}
                    alt={product.name}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="h-full w-full object-contain p-8 drop-shadow-sm sm:p-12"
                  />
                </motion.div>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">No image available</span>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.04, ease: 'easeOut' }}
            className="min-w-0"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {product.tag || 'GORUS dairy'}
              </span>
              {isAvailable && !isOutOfStock && (
                <span className="rounded-full border border-primary/20 px-3 py-1 text-xs font-bold text-primary">Available now</span>
              )}
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
              {product.description || 'A carefully presented GORUS dairy essential, selected for everyday kitchens that value freshness, clarity, and dependable quality.'}
            </p>

            <div className="mt-7 rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Price</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">{formatCurrency(product.price)}</span>
                <span className="font-semibold text-muted-foreground">/ {product.unit}</span>
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              {productBenefits.map(benefit => (
                <div key={benefit} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <CheckCircle size={18} className="shrink-0 text-primary" />
                  {benefit}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center rounded-full border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-background hover:text-primary hover:shadow-sm"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-bold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(maxQuantity === null ? quantity + 1 : Math.min(maxQuantity, quantity + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-background hover:text-primary hover:shadow-sm"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-sm">
                {product.stock !== undefined && product.stock > 0 ? (
                  <p><span className="font-bold text-primary">Only {product.stock} left</span><br /><span className="text-muted-foreground">Fresh batch inventory</span></p>
                ) : (
                  <p className="font-bold text-primary">Fresh stock available</p>
                )}
              </div>
            </div>

            <div className="mt-5 hidden flex-col gap-3 sm:flex sm:flex-row">
              {!isAvailable ? (
                <button disabled className="premium-button flex-1 bg-muted font-semibold text-muted-foreground">
                  Coming Soon
                </button>
              ) : isOutOfStock ? (
                <button disabled className="premium-button flex-1 bg-destructive/10 font-semibold text-destructive">
                  Out of Stock
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleBuyNow} className="premium-button-primary flex-1">
                    Buy Now
                  </button>
                  <button type="button" onClick={handleAddToCart} className="premium-button-secondary flex-1">
                    <ShoppingBag size={18} />
                    {isInCart ? 'Add More' : 'Add to Cart'}
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2">
              {productMeta.map(([label, value]) => (
                <div key={label} className="border-b border-border p-4 last:border-b-0 sm:border-r sm:last:border-r-0">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
                  <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {recommendations.length > 0 && (
          <section className="defer-render mt-16 border-t border-border pt-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  {relatedProducts.length > 0 ? 'Recommended with this' : 'Recently viewed'}
                </p>
                <h2 className="text-3xl font-extrabold text-foreground">Continue discovering</h2>
              </div>
              <button type="button" onClick={() => navigate('/products/available')} className="premium-button-secondary">
                View all products
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map(item => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

        <section className="defer-render mt-14 grid gap-6 border-t border-border pt-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">Before you order</p>
            <h2 className="text-3xl font-extrabold text-foreground">A calmer way to buy daily dairy.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Simple availability, clear payment choices, and real support if something needs attention.
            </p>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {productFaqs.map(({ question, answer }) => (
              <details key={question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-foreground">
                  <span>{question}</span>
                  <HelpCircle size={17} className="shrink-0 text-primary transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {isAvailable && !isOutOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-16px_48px_rgba(15,23,42,0.14)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
              <p className="text-sm font-extrabold text-primary">{formatCurrency(product.price)} <span className="text-xs font-semibold text-muted-foreground">/ {product.unit}</span></p>
            </div>
            <button type="button" onClick={handleAddToCart} className="premium-button-primary min-h-[48px] px-5">
              <ShoppingBag size={18} />
              Add
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-7xl text-xs font-medium text-muted-foreground">Secure checkout. COD and UPI available.</p>
        </div>
      )}
    </main>
  );
};

export default ProductDetails;
