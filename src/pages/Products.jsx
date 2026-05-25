import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import BlurText from '../components/BlurText';
import { productsAPI } from '../utils/api';

const cleanParams = (params) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      cleaned[key] = String(value).trim();
    }
  });

  return cleaned;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = useMemo(() => ({
    search: searchParams.get('search') || '',
    tag: searchParams.get('tag') || '',
    unit: searchParams.get('unit') || '',
    available: searchParams.get('available') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'latest'
  }), [searchParams]);

  const [draftFilters, setDraftFilters] = useState(queryParams);
  const [products, setProducts] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ tags: [], units: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftFilters(queryParams);
  }, [queryParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await productsAPI.getAll(cleanParams(queryParams));
        if (!isMounted) return;
        setProducts(response.products || []);
        setFilterMeta(response.filters || { tags: [], units: [], priceRange: { min: 0, max: 0 } });
      } catch (err) {
        if (!isMounted) return;
        setProducts([]);
        setError(err.message || 'Unable to load products.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [queryParams]);

  const updateQuery = (updates) => {
    setSearchParams(cleanParams({ ...queryParams, ...updates }));
  };

  const applyDraftFilters = (event) => {
    event?.preventDefault();
    updateQuery(draftFilters);
  };

  const clearFilter = (key) => {
    updateQuery({ [key]: '' });
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const activeFilters = Object.entries(queryParams).filter(([key, value]) => (
    value && !(key === 'sort' && value === 'latest')
  ));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            <BlurText text="Products" delay={90} direction="top" />
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Browse the current GORUS catalogue and narrow it down by stock, unit, tag, price, and sort order.
          </p>
        </div>

        <form
          onSubmit={applyDraftFilters}
          className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products"
                value={draftFilters.search}
                onChange={(event) => setDraftFilters({ ...draftFilters, search: event.target.value })}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-muted text-foreground text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
            </div>

            <select
              value={queryParams.tag}
              onChange={(event) => updateQuery({ tag: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            >
              <option value="">All tags</option>
              {filterMeta.tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <select
              value={queryParams.unit}
              onChange={(event) => updateQuery({ unit: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            >
              <option value="">All units</option>
              {filterMeta.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            <select
              value={queryParams.available}
              onChange={(event) => updateQuery({ available: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Any availability</option>
              <option value="1">Available</option>
              <option value="0">Coming soon</option>
            </select>

            <select
              value={queryParams.sort}
              onChange={(event) => updateQuery({ sort: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            >
              <option value="latest">Latest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name_asc">Name A-Z</option>
              <option value="stock_desc">Stock: high to low</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3">
            <input
              type="number"
              min="0"
              placeholder={`Min price${filterMeta.priceRange.min ? ` (${filterMeta.priceRange.min})` : ''}`}
              value={draftFilters.minPrice}
              onChange={(event) => setDraftFilters({ ...draftFilters, minPrice: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            />
            <input
              type="number"
              min="0"
              placeholder={`Max price${filterMeta.priceRange.max ? ` (${filterMeta.priceRange.max})` : ''}`}
              value={draftFilters.maxPrice}
              onChange={(event) => setDraftFilters({ ...draftFilters, maxPrice: event.target.value })}
              className="h-12 rounded-xl border border-border bg-muted text-foreground px-4 text-sm outline-none transition focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              <SlidersHorizontal size={17} />
              Apply
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className="h-12 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Catalogue</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? 'Loading products' : `${products.length} product${products.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => clearFilter(key)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  {key}: {value}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[420px] rounded-2xl bg-card border border-border p-3 animate-pulse">
                <div className="h-64 rounded-2xl bg-muted mb-4" />
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-6" />
                <div className="h-9 bg-muted rounded-full w-28" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-destructive/10 rounded-2xl border border-destructive/50">
            <h3 className="text-xl font-semibold text-destructive mb-2">Unable to load products</h3>
            <p className="text-destructive/80">{error}</p>
          </div>
        ) : products.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map(product => (
              <motion.div key={product.id} variants={itemVariants} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-muted/50 rounded-2xl border border-dashed border-border">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">Adjust or clear the filters to see more products.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
