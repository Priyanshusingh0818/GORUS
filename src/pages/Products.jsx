import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../utils/api';

const DEFAULT_FILTERS = {
  search: '',
  tag: '',
  unit: '',
  available: '',
  minPrice: '',
  maxPrice: '',
  sort: 'latest'
};

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'price_asc', label: 'Price low' },
  { value: 'price_desc', label: 'Price high' },
  { value: 'name_asc', label: 'A-Z' },
  { value: 'stock_desc', label: 'Stock' }
];

const FILTER_KEYS = Object.keys(DEFAULT_FILTERS);

const cleanParams = (params) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (FILTER_KEYS.includes(key) && value !== undefined && value !== null && String(value).trim() !== '') {
      cleaned[key] = String(value).trim();
    }
  });

  return cleaned;
};

const normalizeFilters = (filters = {}) => ({
  ...DEFAULT_FILTERS,
  ...cleanParams(filters),
  sort: filters.sort || DEFAULT_FILTERS.sort
});

const slugify = (value = '') => (
  encodeURIComponent(
    String(value)
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
);

const unslugify = (value = '') => (
  decodeURIComponent(value)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const getLegacySearchFilters = (search) => {
  const params = new URLSearchParams(search);
  const values = {};

  FILTER_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) values[key] = value;
  });

  return values;
};

const getRouteFilters = (pathname, categorySlug) => {
  if (pathname === '/products/latest') return { sort: 'latest' };
  if (pathname === '/products/available') return { available: '1' };
  if (pathname === '/products/price-low-to-high') return { sort: 'price_asc' };
  if (categorySlug) return { tag: unslugify(categorySlug) };
  return {};
};

const getCleanPathForFilters = (pathname, filters) => {
  const active = cleanParams(filters);
  const keys = Object.keys(active).filter(key => !(key === 'sort' && active[key] === 'latest'));

  if (keys.length === 0 && active.sort === 'latest') return '/products/latest';
  if (keys.length === 1 && active.available === '1') return '/products/available';
  if (keys.length === 1 && active.tag) return `/category/${slugify(active.tag)}`;

  return pathname.split('?')[0] || '/products';
};

const filterLabel = (key, value) => {
  const labels = {
    search: 'Search',
    tag: 'Category',
    unit: 'Unit',
    available: 'Availability',
    minPrice: 'Min price',
    maxPrice: 'Max price',
    sort: 'Sort'
  };

  if (key === 'available') return `${labels[key]}: ${value === '1' ? 'Available' : 'Coming soon'}`;
  if (key === 'sort') return `${labels[key]}: ${SORT_OPTIONS.find(option => option.value === value)?.label || value}`;
  return `${labels[key] || key}: ${value}`;
};

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category: categorySlug } = useParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const routeFilters = useMemo(
    () => getRouteFilters(location.pathname, categorySlug),
    [location.pathname, categorySlug]
  );
  const locationStateFilters = useMemo(
    () => location.state?.filters || {},
    [location.state]
  );
  const legacySearchFilters = useMemo(
    () => getLegacySearchFilters(location.search),
    [location.search]
  );
  const initialFilters = useMemo(() => normalizeFilters({
    ...routeFilters,
    ...locationStateFilters,
    ...legacySearchFilters
  }), [routeFilters, locationStateFilters, legacySearchFilters]);

  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ tags: [], units: [], priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const nextFilters = normalizeFilters({
      ...routeFilters,
      ...locationStateFilters,
      ...legacySearchFilters
    });

    setFilters(nextFilters);
    setDraftFilters(nextFilters);

    if (location.search) {
      navigate(getCleanPathForFilters(location.pathname, nextFilters), {
        replace: true,
        state: { filters: nextFilters }
      });
    }
  }, [legacySearchFilters, location.key, location.pathname, location.search, locationStateFilters, navigate, routeFilters]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      const isInitialLoad = !hasLoadedRef.current;
      setLoading(isInitialLoad);
      setRefreshing(!isInitialLoad);
      setError('');

      try {
        const response = await productsAPI.getAll(cleanParams(filters));
        if (!isMounted) return;
        setProducts(response.products || []);
        setFilterMeta(response.filters || { tags: [], units: [], priceRange: { min: 0, max: 0 } });
      } catch (err) {
        if (!isMounted) return;
        setProducts([]);
        setError(err.message || 'Unable to load products.');
      } finally {
        if (isMounted) {
          hasLoadedRef.current = true;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const updateFilters = (updates) => {
    setFilters(current => {
      const next = normalizeFilters({ ...current, ...updates });
      setDraftFilters(next);
      return next;
    });
  };

  const applyDraftFilters = (event) => {
    event?.preventDefault();
    setFilters(normalizeFilters(draftFilters));
    setIsFilterOpen(false);
  };

  const clearFilter = (key) => {
    updateFilters({ [key]: key === 'sort' ? DEFAULT_FILTERS.sort : '' });
  };

  const clearAllFilters = () => {
    const next = { ...DEFAULT_FILTERS };
    setFilters(next);
    setDraftFilters(next);
    setIsFilterOpen(false);

    if (location.pathname !== '/products') {
      navigate('/products', { replace: true, state: { filters: next } });
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => (
    value && !(key === 'sort' && value === 'latest')
  ));

  const filterControls = (
    <form onSubmit={applyDraftFilters} className="grid gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search products"
          value={draftFilters.search}
          onChange={(event) => setDraftFilters({ ...draftFilters, search: event.target.value })}
          aria-label="Search products"
          className="premium-input w-full pl-11"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={filters.tag}
          onChange={(event) => updateFilters({ tag: event.target.value })}
          aria-label="Filter by category"
          className="premium-input w-full"
        >
          <option value="">All categories</option>
          {filterMeta.tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>

        <select
          value={filters.unit}
          onChange={(event) => updateFilters({ unit: event.target.value })}
          aria-label="Filter by unit"
          className="premium-input w-full"
        >
          <option value="">All units</option>
          {filterMeta.units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select>

        <select
          value={filters.available}
          onChange={(event) => updateFilters({ available: event.target.value })}
          aria-label="Filter by availability"
          className="premium-input w-full"
        >
          <option value="">Any availability</option>
          <option value="1">Available</option>
          <option value="0">Coming soon</option>
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFilters({ sort: option.value })}
              className={`premium-button min-h-[38px] rounded-full px-4 text-xs ${
                filters.sort === option.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input
          type="number"
          min="0"
          placeholder={`Min price${filterMeta.priceRange.min ? ` (${filterMeta.priceRange.min})` : ''}`}
          value={draftFilters.minPrice}
          onChange={(event) => setDraftFilters({ ...draftFilters, minPrice: event.target.value })}
          aria-label="Minimum price"
          className="premium-input w-full"
        />
        <input
          type="number"
          min="0"
          placeholder={`Max price${filterMeta.priceRange.max ? ` (${filterMeta.priceRange.max})` : ''}`}
          value={draftFilters.maxPrice}
          onChange={(event) => setDraftFilters({ ...draftFilters, maxPrice: event.target.value })}
          aria-label="Maximum price"
          className="premium-input w-full"
        />
        <button type="submit" className="premium-button-primary">
          <SlidersHorizontal size={17} /> Apply
        </button>
        <button type="button" onClick={clearAllFilters} className="premium-button-secondary">
          Clear
        </button>
      </div>
    </form>
  );

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{filters.tag ? `${filters.tag} Products` : 'Products'} - GORUS</title>
        <meta name="description" content="Browse the current GORUS catalogue with fast, clean product filtering." />
        <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}${location.pathname}` : location.pathname} />
      </Helmet>

      <section className="page-shell section-y">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-primary">Fresh from GORUS</p>
            <h1 className="text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
              {filters.tag || 'Products'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Browse fresh dairy essentials with calm filtering, clear availability, and polished product details.
            </p>
          </div>

          <button type="button" onClick={() => setIsFilterOpen(true)} className="premium-button-secondary lg:hidden">
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        <div className="premium-card mb-8 hidden p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] lg:block">
          {filterControls}
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Fresh catalogue</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground" aria-live="polite">
              {loading ? 'Loading products' : refreshing ? 'Updating products' : `${products.length} product${products.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => clearFilter(key)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  aria-label={`Remove ${key} filter`}
                >
                  {filterLabel(key, value)}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="skeleton aspect-[4/5]" />
                  <div className="space-y-3 p-4">
                    <div className="skeleton h-4 w-2/3 rounded-full" />
                    <div className="skeleton h-3 w-full rounded-full" />
                    <div className="skeleton h-3 w-4/5 rounded-full" />
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <div className="skeleton h-8 w-28 rounded-full" />
                      <div className="skeleton h-8 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card border-destructive/40 bg-destructive/10 p-10 text-center"
            >
              <h3 className="mb-2 text-xl font-semibold text-destructive">Unable to load products</h3>
              <p className="text-destructive/80">{error}</p>
            </motion.div>
          ) : products.length > 0 ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`grid grid-cols-1 gap-7 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${refreshing ? 'opacity-70' : 'opacity-100'}`}
            >
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card bg-muted/40 p-12 text-center"
            >
              <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">No products found</h3>
              <p className="text-muted-foreground">Adjust or clear filters to continue browsing.</p>
              <button type="button" onClick={clearAllFilters} className="premium-button-primary mt-6">
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/35 backdrop-blur-sm lg:hidden"
          >
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-lg bg-background p-4 shadow-[0_-20px_60px_rgba(15,23,42,0.22)]"
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Shop controls</p>
                  <h2 className="text-xl font-bold text-foreground">Filters</h2>
                </div>
                <button type="button" onClick={() => setIsFilterOpen(false)} className="premium-button-secondary h-10 w-10 px-0" aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              {filterControls}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Products;
