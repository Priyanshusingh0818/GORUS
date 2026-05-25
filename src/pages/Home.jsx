import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import TextType from '../components/TextType';
import CircularGallery from '../components/CircularGallery';
import { productsAPI } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
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
    const values = products
      .map(product => product.tag)
      .filter(Boolean);

    return [...new Set(values)].slice(0, 5);
  }, [products]);

  const galleryItems = useMemo(() => products
    .filter(product => product.image)
    .slice(0, 8)
    .map(product => ({
      image: product.image,
      text: product.name
    })), [products]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>GORUS - Fresh Dairy Products</title>
        <meta name="description" content="Browse the current GORUS dairy catalogue." />
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 w-full">
        <section className="relative overflow-hidden rounded-2xl bg-muted/50 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-center p-8 md:p-12 lg:px-16">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl z-10"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary dark:text-green-400 leading-tight mb-5">
                <TextType 
                  text="GORUS dairy catalogue" 
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor
                  cursorCharacter="_"
                />
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-7 mb-8">
                Product details, prices, and availability are loaded from the store backend.
              </p>
              <button
                onClick={() => navigate('/products?available=1')}
                className="cursor-target inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#064e3b] text-white font-semibold shadow-md hover:bg-[#043729] hover:shadow-lg transition-all duration-300"
              >
                Browse products
                <ArrowRight size={18} />
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-background border border-border shadow-sm">
                <img src="/images/milk.jpg" alt="GORUS milk" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden bg-background border border-border shadow-sm">
                  <img src="/images/ghee.jpg" alt="GORUS ghee" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-background border border-border shadow-sm">
                  <img src="/images/paneer.jpg" alt="GORUS paneer" className="w-full h-full object-cover" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/products?available=1')}
              className="cursor-target px-4 py-2 rounded-full text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Available now
            </button>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/products?tag=${encodeURIComponent(tag)}`)}
                className="cursor-target px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => navigate('/products?sort=price_asc')}
            className="cursor-target inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Sort by price
            <ArrowRight size={15} />
          </button>
        </section>

        {galleryItems.length > 1 && (
          <section className="mb-14">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Product Gallery</h2>
                <p className="text-sm text-muted-foreground mt-1">Drag or scroll to browse product images.</p>
              </div>
            </div>
            <div className="h-[460px] sm:h-[540px] rounded-2xl border border-border bg-muted/50 overflow-hidden">
              <CircularGallery
                items={galleryItems}
                bend={1.4}
                textColor="#064e3b"
                borderRadius={0.05}
                scrollSpeed={2}
                scrollEase={0.05}
              />
            </div>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Available Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Pulled from the live product catalogue.</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="hidden sm:inline-flex text-sm font-semibold text-primary hover:underline"
            >
              View all
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[390px] rounded-2xl bg-card border border-border p-3 animate-pulse">
                  <div className="h-64 rounded-2xl bg-muted mb-4" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-full mb-6" />
                  <div className="h-9 bg-muted rounded-full w-28" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-8 text-destructive">
              {error}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-10 text-center text-muted-foreground">
              No available products are listed right now.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
