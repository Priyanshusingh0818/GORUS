
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { productsAPI } from '../utils/api';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getAll();
        setAllProducts(response.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to hardcoded products if API fails
        const fallbackProducts = [
          {
            id: 1,
            name: 'Pure Desi Ghee',
            description: '100% pure desi cow ghee made from traditional bilona method. Rich in vitamins and nutrients.',
            price: 1800,
            unit: 'kg',
            image: '/images/ghee.jpg',
            available: 1,
            tag: 'Premium'
          },
          {
            id: 2,
            name: 'Sarso Tel (Mustard Oil)',
            description: 'Cold-pressed mustard oil, rich in nutrients. Perfect for cooking and health benefits.',
            price: 210,
            unit: 'litre',
            image: '/images/sarso-tel.jpg',
            available: 1,
            tag: 'Fresh'
          },
          {
            id: 3,
            name: 'Fresh Cow Milk',
            description: 'Farm-fresh pure cow milk delivered daily. No additives, no preservatives.',
            price: 60,
            unit: 'litre',
            image: '/images/milk.jpg',
            available: 1,
            tag: 'Daily Fresh'
          },
          {
            id: 4,
            name: 'Paneer',
            description: 'Fresh homemade paneer from pure cow milk.',
            price: 320,
            unit: 'kg',
            image: '/images/paneer.jpg',
            available: 1
          },
          {
            id: 5,
            name: 'Curd',
            description: 'Fresh thick curd made from pure cow milk.',
            price: 55,
            unit: '500ml',
            image: '/images/curd.jpg',
            available: 1
          },
          {
            id: 6,
            name: 'Buttermilk',
            description: 'Refreshing buttermilk made from fresh curd.',
            price: 20,
            unit: '500ml',
            image: '/images/buttermilk.jpg',
            available: 1
          }
        ];
        setAllProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableProducts = filteredProducts.filter(p => p.available === 1);
  const comingSoonProducts = filteredProducts.filter(p => p.available !== 1);

  if (loading) {
    return (
      <div style={styles.productsPage}>
        <div className="container">
          <div style={styles.loading}>Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.productsPage}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Our Products</h1>
          <p style={styles.subtitle}>
            Explore our range of 100% pure and organic dairy products
          </p>

          {/* Search Bar */}
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Available Products */}
        {availableProducts.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Available Now</h2>
            <div style={styles.productsGrid}>
              {availableProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon Products */}
        {comingSoonProducts.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Coming Soon</h2>
            <div style={styles.productsGrid}>
              {comingSoonProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {!loading && filteredProducts.length === 0 && allProducts.length === 0 && (
          <div style={styles.noResults}>
            <p style={styles.noResultsText}>
              No products available. Please check your connection or try again later.
            </p>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && allProducts.length > 0 && (
          <div style={styles.noResults}>
            <p style={styles.noResultsText}>
              No products found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  productsPage: {
    minHeight: '100vh',
    padding: '40px 0 80px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px'
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '40px'
  },
  searchContainer: {
    position: 'relative',
    maxWidth: '500px',
    margin: '0 auto'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 48px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px'
  },
  section: {
    marginBottom: '60px'
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '32px'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '32px'
  },
  noResults: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  noResultsText: {
    fontSize: '18px',
    color: '#6b7280'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#6b7280'
  }
};

export default Products;