import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Award, Truck, Shield } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsAPI } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getAll();
        // Show only first 3 available products on home page
        const available = (response.products || []).filter(p => p.available === 1).slice(0, 3);
        setProducts(available);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback products
        const fallbackProducts = [
          {
            id: 1,
            name: 'Pure Desi Ghee',
            description: '100% pure desi cow ghee made from traditional bilona method',
            price: 1800,
            unit: 'kg',
            image: '/images/ghee.jpg',
            available: 1,
            tag: 'Premium'
          },
          {
            id: 2,
            name: 'Sarso Tel (Mustard Oil)',
            description: 'Cold-pressed mustard oil, rich in nutrients',
            price: 210,
            unit: 'litre',
            image: '/images/sarso-tel.jpg',
            available: 1,
            tag: 'Fresh'
          },
          {
            id: 3,
            name: 'Fresh Cow Milk',
            description: 'Farm-fresh pure cow milk delivered daily',
            price: 60,
            unit: 'litre',
            image: '/images/milk.jpg',
            available: 1,
            tag: 'Daily Fresh'
          }
        ];
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const features = [
    {
      icon: <Award size={40} />,
      title: '100% Pure',
      description: 'Guaranteed purity in every product'
    },
    {
      icon: <Shield size={40} />,
      title: 'Quality Tested',
      description: 'Lab tested for quality assurance'
    },
    {
      icon: <Truck size={40} />,
      title: 'Fast Delivery',
      description: 'Quick and safe delivery to your doorstep'
    },
    {
      icon: <ShoppingBag size={40} />,
      title: 'Easy Ordering',
      description: 'Simple and secure online ordering'
    }
  ];

  return (
    <div style={styles.home}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container">
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              Experience the Purity of <span style={styles.highlight}>GORAS</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Premium quality dairy products sourced directly from our farm. 
              100% pure, 100% natural, 100% trusted.
            </p>
            <div style={styles.heroBtns}>
              <button 
                className="btn-primary"
                onClick={() => navigate('/products')}
                style={styles.heroBtn}
              >
                Shop Now
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/products')}
                style={styles.heroBtn}
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Why Choose GORAS?</h2>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className="card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section style={styles.productsSection}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Our Premium Products</h2>
          <p style={styles.sectionSubtitle}>
            Discover our range of pure and organic dairy products
          </p>
          <div style={styles.productsGrid}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div style={styles.viewAllBtn}>
            <button 
              className="btn-primary"
              onClick={() => navigate('/products')}
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div className="container">
          <div className="card" style={styles.ctaCard}>
            <h2 style={styles.ctaTitle}>Ready to Experience Pure Goodness?</h2>
            <p style={styles.ctaText}>
              Join thousands of happy customers who trust GORAS for their daily dairy needs
            </p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/products')}
              style={styles.ctaBtn}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  home: {
    minHeight: '100vh'
  },
  hero: {
    padding: '80px 0',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '24px',
    lineHeight: '1.2'
  },
  highlight: {
    color: '#22c55e'
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '40px',
    lineHeight: '1.6'
  },
  heroBtns: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  heroBtn: {
    fontSize: '16px'
  },
  features: {
    padding: '60px 0'
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '16px'
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '48px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px'
  },
  featureCard: {
    textAlign: 'center'
  },
  featureIcon: {
    color: '#22c55e',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'center'
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px'
  },
  featureDesc: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5'
  },
  productsSection: {
    padding: '60px 0'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    marginBottom: '48px'
  },
  viewAllBtn: {
    display: 'flex',
    justifyContent: 'center'
  },
  cta: {
    padding: '60px 0 80px'
  },
  ctaCard: {
    textAlign: 'center',
    padding: '60px 40px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
  },
  ctaTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px'
  },
  ctaText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px'
  },
  ctaBtn: {
    fontSize: '18px',
    padding: '14px 32px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '18px',
    color: '#6b7280'
  }
};

export default Home;