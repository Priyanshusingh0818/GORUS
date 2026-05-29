import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HelpCircle, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import OptimizedImage from '../components/OptimizedImage';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../utils/api';

const slugifyTag = (value = '') => (
  encodeURIComponent(
    String(value)
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
);

const reassuranceFaqs = [
  {
    question: 'How do I know what is available?',
    answer: 'The catalogue shows current availability and stock signals, so you are not guessing before checkout.'
  },
  {
    question: 'What happens if my order needs support?',
    answer: 'Use the listed phone or email with your order details. A real support contact can help with delivery or product issues.'
  },
  {
    question: 'Can I choose how to pay?',
    answer: 'Yes. Checkout supports UPI and Cash on Delivery, so you can choose the option that feels right for your order.'
  }
];

const heroProductImages = [
  {
    key: 'ghee',
    src: '/images/ghee.jpg',
    alt: 'GORUS ghee',
    imageClassName: 'h-56 sm:h-72',
    matches: ['ghee']
  },
  {
    key: 'paneer',
    src: '/images/paneer.jpg',
    alt: 'GORUS paneer',
    imageClassName: 'h-80 sm:h-[420px]',
    matches: ['paneer']
  },
  {
    key: 'curd',
    src: '/images/curd.jpg',
    alt: 'GORUS curd',
    imageClassName: 'h-32 sm:h-40',
    matches: ['curd']
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await productsAPI.getAll({ available: '1', limit: 8 });
        setProducts(response.products || []);
      } catch (err) {
        setProducts([]);
        setError(err.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const tags = useMemo(() => {
    const valuesFromProducts = products
      .map(product => product.tag)
      .filter(Boolean);

    return [...new Set(valuesFromProducts)].slice(0, 5);
  }, [products]);

  const heroProducts = useMemo(() => {
    return heroProductImages.reduce((acc, image) => {
      acc[image.key] = products.find(product => {
        const productName = String(product.name || '').toLowerCase();
        const productImage = String(product.image || '').toLowerCase();

        return image.matches.some(match => productName.includes(match) || productImage.includes(match));
      });

      return acc;
    }, {});
  }, [products]);

  const handleHeroProductClick = (image) => {
    const product = heroProducts[image.key];
    const target = product ? `/product/${product.id}` : '/products/available';

    if (user) {
      navigate(target);
      return;
    }

    navigate('/login', { state: { redirectTo: target } });
  };

  const renderHeroProductImage = (image, loadingMode = 'lazy') => (
    <button
      key={image.key}
      type="button"
      onClick={() => handleHeroProductClick(image)}
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-white text-left shadow-sm transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:bg-card"
      aria-label={`Shop ${image.alt.replace('GORUS ', '')}`}
    >
      <OptimizedImage
        src={image.src}
        alt={image.alt}
        className={`${image.imageClassName} w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035] group-focus-visible:scale-[1.035]`}
        loading={loadingMode}
        decoding="async"
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        fetchPriority={loadingMode === 'eager' ? 'high' : 'auto'}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 ease-out group-hover:bg-black/45 group-focus-visible:bg-black/45">
        <span className="inline-flex translate-y-2 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-primary opacity-0 shadow-xl transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Shop Now
          <ArrowRight size={16} />
        </span>
      </span>
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Helmet>
        <title>GORUS - Premium Pure Dairy</title>
        <meta name="description" content="Premium GORUS dairy products with clean sourcing, careful handling, and a calm trustworthy shopping experience." />
      </Helmet>

      <main className="w-full">
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--primary)/0.08),transparent_42%),linear-gradient(0deg,hsl(var(--background)/0.78),hsl(var(--background)/0.78))]" />
          <div className="page-shell relative grid min-h-[calc(100vh-72px)] items-center gap-10 py-14 lg:grid-cols-[0.96fr_1.04fr] lg:py-18">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-primary shadow-sm dark:border-primary/30 dark:bg-primary/10">
                <Leaf size={15} />
                Proof of 100% purity
              </div>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
                Dairy that feels carefully made, not merely sold.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                GORUS brings a quieter kind of premium to daily dairy: focused products, transparent freshness, and a shopping experience that respects your trust.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => navigate('/products/available')} className="premium-button-primary min-h-[48px] px-7">
                  Shop available products
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={() => navigate('/products/latest')} className="premium-button min-h-[48px] border border-primary/20 bg-white px-7 text-foreground hover:border-primary/30 hover:bg-muted dark:bg-background dark:text-foreground dark:hover:bg-muted">
                  See latest batch
                </button>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-border pt-6">
                {[
                  ['Focused', 'catalogue'],
                  ['Fresh', 'delivery'],
                  ['Human', 'support']
                ].map(([label, detail]) => (
                  <div key={label}>
                    <p className="text-lg font-bold text-foreground">{label}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.08, ease: 'easeOut' }}
              className="relative"
            >
              <div className="grid grid-cols-[0.9fr_1.1fr] gap-3 sm:gap-4">
                <div className="space-y-3 pt-10 sm:space-y-4 sm:pt-16">
                  {renderHeroProductImage(heroProductImages[0], 'eager')}
                  <div className="rounded-lg border border-border bg-white p-5 shadow-sm dark:bg-card">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Brand promise</p>
                    <p className="text-sm leading-6 text-muted-foreground">Clear products, honest freshness, and dairy that belongs in a careful home kitchen.</p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {renderHeroProductImage(heroProductImages[1], 'eager')}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {renderHeroProductImage(heroProductImages[2])}
                    <div className="flex items-center justify-center rounded-lg border border-border bg-white p-5 shadow-sm dark:bg-card">
                      <img src="/images/logo.png" alt="GORUS symbol" className="h-24 w-24 object-contain dark:rounded-full dark:bg-white dark:p-2" loading="lazy" decoding="async" width="96" height="96" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="defer-render bg-muted/45">
          <div className="page-shell section-y">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Curated catalogue</p>
                <h2 className="text-4xl font-extrabold text-foreground">Fresh essentials, intentionally presented.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Each product card keeps the focus on what matters: product, price, availability, and a clear next step.
                </p>
              </div>
              <button type="button" onClick={() => navigate('/products')} className="premium-button-secondary">
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => navigate('/products/available')} className="premium-button bg-foreground text-background hover:bg-foreground/90">
                Available now
              </button>
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate(`/category/${slugifyTag(tag)}`, { state: { filters: { tag } } })}
                  className="premium-button-secondary"
                >
                  {tag}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="premium-card p-3">
                    <div className="skeleton aspect-[4/5] rounded-lg" />
                    <div className="mt-4 space-y-3 px-1">
                      <div className="skeleton h-4 w-2/3 rounded-full" />
                      <div className="skeleton h-3 w-full rounded-full" />
                      <div className="skeleton h-9 w-28 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="premium-card border-destructive/50 bg-destructive/10 p-8 text-destructive">
                {error}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="premium-card border-dashed bg-background p-10 text-center text-muted-foreground">
                No available products are listed right now.
              </div>
            )}
          </div>
        </section>

        <section className="defer-render border-t border-border bg-background">
          <div className="page-shell grid gap-8 border-b border-border py-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">Order with confidence</p>
              <h2 className="text-3xl font-extrabold text-foreground">Clear answers before you buy.</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Premium should feel simple: visible products, clear payment choices, and help that is easy to reach.
              </p>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {reassuranceFaqs.map(({ question, answer }) => (
                <details key={question} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-foreground">
                    <span>{question}</span>
                    <HelpCircle size={17} className="shrink-0 text-primary transition group-open:rotate-45" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;
