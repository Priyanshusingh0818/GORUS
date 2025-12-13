import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingBag, Plus, Edit, Trash2, Check, X, RefreshCw, BarChart3, TrendingUp, DollarSign, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    image: '',
    available: true,
    tag: '',
    stock: 100
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.is_admin) {
      // Don't redirect, show message instead
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, navigate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const response = await adminAPI.getDashboardStats();
        setDashboardStats(response);
      } else if (activeTab === 'orders') {
        const response = await adminAPI.getAllOrders();
        setOrders(response.orders || []);
      } else if (activeTab === 'products') {
        const response = await adminAPI.getAllProducts();
        setProducts(response.products || []);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getAllUsers();
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, productForm);
      } else {
        await adminAPI.createProduct(productForm);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        unit: '',
        image: '',
        available: true,
        tag: '',
        stock: 100
      });
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit,
      image: product.image || '',
      available: product.available === 1,
      tag: product.tag || '',
      stock: product.stock || 100
    });
    setShowProductModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#22c55e',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Show loading state
  if (loading && !user) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div style={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (user && !user.is_admin) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div className="card" style={styles.accessDenied}>
            <h2 style={styles.accessDeniedTitle}>Access Denied</h2>
            <p style={styles.accessDeniedText}>
              You need administrator privileges to access this page.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/')}
              style={styles.backButton}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div style={styles.page}>
        <div className="container">
          <div className="card" style={styles.accessDenied}>
            <h2 style={styles.accessDeniedTitle}>Please Login</h2>
            <p style={styles.accessDeniedText}>
              You need to be logged in as an administrator to access this page.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={styles.backButton}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="container">
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Panel</h1>
          {(activeTab === 'orders' || activeTab === 'dashboard') && (
            <button
              onClick={fetchData}
              className="btn-secondary"
              style={styles.refreshButton}
              title="Refresh data"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          )}
        </div>

        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            Dashboard
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'orders' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={20} />
            Orders ({orders.length})
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'products' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} />
            Products ({products.length})
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            Users ({users.length})
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div style={styles.content}>
            {loading ? (
              <div style={styles.empty}>Loading dashboard...</div>
            ) : dashboardStats ? (
              <>
                {/* Stats Cards */}
                <div style={styles.statsGrid}>
                    <div className="card" style={styles.statCard}>
                      <div style={{...styles.statIcon, backgroundColor: '#dbeafe'}}>
                        <DollarSign size={24} color="#3b82f6" />
                      </div>
                      <div style={styles.statContent}>
                        <div style={styles.statLabel}>Total Sales</div>
                        <div style={styles.statValue}>₹{dashboardStats.stats.totalSales.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="card" style={styles.statCard}>
                      <div style={{...styles.statIcon, backgroundColor: '#fef3c7'}}>
                        <ShoppingBag size={24} color="#f59e0b" />
                      </div>
                      <div style={styles.statContent}>
                        <div style={styles.statLabel}>Total Orders</div>
                        <div style={styles.statValue}>{dashboardStats.stats.totalOrders}</div>
                      </div>
                    </div>

                    <div className="card" style={styles.statCard}>
                      <div style={{...styles.statIcon, backgroundColor: '#d1fae5'}}>
                        <UserPlus size={24} color="#22c55e" />
                      </div>
                      <div style={styles.statContent}>
                        <div style={styles.statLabel}>New Users (30 days)</div>
                        <div style={styles.statValue}>{dashboardStats.stats.newUsersCount}</div>
                      </div>
                    </div>

                    <div className="card" style={styles.statCard}>
                      <div style={{...styles.statIcon, backgroundColor: '#e0e7ff'}}>
                        <Package size={24} color="#8b5cf6" />
                      </div>
                      <div style={styles.statContent}>
                        <div style={styles.statLabel}>Total Products</div>
                        <div style={styles.statValue}>{dashboardStats.stats.totalProducts}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Chart */}
                  <div className="card" style={styles.chartCard}>
                    <h2 style={styles.chartTitle}>Sales Over Last 7 Days</h2>
                    <div style={styles.chartContainer}>
                      {dashboardStats.salesOverTime.map((day, idx) => {
                        const maxSales = Math.max(...dashboardStats.salesOverTime.map(d => d.sales), 1);
                        const height = (day.sales / maxSales) * 200;
                        return (
                          <div key={idx} style={styles.barContainer}>
                            <div style={styles.barWrapper}>
                              <div style={{...styles.bar, height: `${height}px`}}>
                                <div style={styles.barValue}>₹{day.sales.toFixed(0)}</div>
                              </div>
                            </div>
                            <div style={styles.barLabel}>
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div style={styles.barOrders}>{day.orders} orders</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={styles.grid}>
                    {/* Sales by Product */}
                    <div className="card" style={styles.gridCard}>
                      <h2 style={styles.sectionTitle}>Top Selling Products</h2>
                      <div style={styles.productList}>
                        {dashboardStats.salesByProduct.slice(0, 5).map((product, idx) => (
                          <div key={idx} style={styles.productItem}>
                            <div style={styles.productRank}>#{idx + 1}</div>
                            <div style={styles.productInfo}>
                              <div style={styles.productName}>{product.name}</div>
                              <div style={styles.productStats}>
                                {product.quantity} sold • ₹{product.revenue.toFixed(2)} revenue
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* New Users */}
                    <div className="card" style={styles.gridCard}>
                      <h2 style={styles.sectionTitle}>New Users (Last 30 Days)</h2>
                      <div style={styles.usersList}>
                        {dashboardStats.newUsers.length === 0 ? (
                          <div style={styles.emptyText}>No new users in the last 30 days</div>
                        ) : (
                          dashboardStats.newUsers.map(user => (
                            <div key={user.id} style={styles.userItem}>
                              <div style={styles.userInfo}>
                                <div style={styles.userName}>{user.name || 'N/A'}</div>
                                <div style={styles.userEmail}>{user.email}</div>
                              </div>
                              <div style={styles.userDate}>
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="card" style={styles.recentOrdersCard}>
                    <h2 style={styles.sectionTitle}>Recent Orders</h2>
                    <div style={styles.recentOrdersList}>
                      {dashboardStats.recentOrders.slice(0, 5).map(order => (
                        <div key={order.id} style={styles.recentOrderItem}>
                          <div>
                            <div style={styles.recentOrderNumber}>Order #{order.order_number}</div>
                            <div style={styles.recentOrderCustomer}>{order.shipping_name}</div>
                          </div>
                          <div style={styles.recentOrderAmount}>₹{order.total_amount.toFixed(2)}</div>
                          <div style={{...styles.recentOrderStatus, color: getStatusColor(order.status)}}>
                            {order.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={styles.empty}>No data available</div>
              )}
            </div>
          )}

        {activeTab === 'orders' && (
          <div style={styles.content}>
            {loading && orders.length === 0 ? (
              <div style={styles.empty}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={styles.empty}>No orders yet</div>
            ) : (
              <div style={styles.ordersList}>
                {orders.map(order => (
                  <div key={order.id} className="card" style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <div style={styles.orderInfo}>
                        <h3 style={styles.orderNumber}>Order #{order.order_number}</h3>
                        <p style={styles.orderDate}>
                          📅 {new Date(order.created_at).toLocaleString()}
                        </p>
                        <p style={styles.customerInfo}>
                          👤 Customer: {order.shipping_name} | 📞 {order.shipping_phone}
                        </p>
                      </div>
                      <div style={styles.statusSection}>
                        <label style={styles.statusLabel}>Order Status:</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          style={{...styles.statusSelect, borderColor: getStatusColor(order.status), backgroundColor: getStatusColor(order.status) + '10'}}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="processing">🔄 Processing</option>
                          <option value="shipped">📦 Shipped</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div style={styles.divider} />
                    
                    <div style={styles.orderDetails}>
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>📦 Order Items</h4>
                        <div style={styles.orderItems}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={styles.itemRow}>
                              <span style={styles.itemName}>{item.product_name}</span>
                              <span style={styles.itemQty}>× {item.quantity}</span>
                              <span style={styles.itemPrice}>₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>📍 Shipping Address</h4>
                        <p style={styles.addressText}>
                          {order.shipping_name}<br />
                          {order.shipping_address}<br />
                          Phone: {order.shipping_phone}
                        </p>
                      </div>
                    </div>
                    
                    <div style={styles.divider} />
                    
                    <div style={styles.orderFooter}>
                      <div style={styles.totalSection}>
                        <span style={styles.totalLabel}>Total Amount:</span>
                        <span style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div style={styles.content}>
            <button
              className="btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  unit: '',
                  image: '',
                  available: true,
                  tag: '',
                  stock: 100
                });
                setShowProductModal(true);
              }}
              style={styles.addButton}
            >
              <Plus size={20} />
              Add Product
            </button>

            <div style={styles.productsGrid}>
              {products.map(product => (
                <div key={product.id} className="card" style={styles.productCard}>
                  {product.image && (
                    <img src={product.image} alt={product.name} style={styles.productImage} />
                  )}
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productPrice}>₹{product.price} / {product.unit}</p>
                  <div style={styles.productActions}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEditProduct(product)}
                      style={styles.actionButton}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{...styles.actionButton, color: '#ef4444'}}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={styles.content}>
            <div className="card" style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Admin</th>
                    <th style={styles.th}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}>{user.name || 'N/A'}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        {user.is_admin ? <Check size={20} color="#22c55e" /> : <X size={20} color="#9ca3af" />}
                      </td>
                      <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showProductModal && (
          <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={handleSaveProduct} style={styles.form}>
                <label style={styles.label}>Name *</label>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  style={styles.input}
                />

                <label style={styles.label}>Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  rows={3}
                  style={styles.input}
                />

                <div style={styles.row}>
                  <div style={styles.col}>
                    <label style={styles.label}>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.col}>
                    <label style={styles.label}>Unit *</label>
                    <input
                      value={productForm.unit}
                      onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <label style={styles.label}>Image URL</label>
                <input
                  value={productForm.image}
                  onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  style={styles.input}
                />

                <div style={styles.row}>
                  <div style={styles.col}>
                    <label style={styles.label}>Stock</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.col}>
                    <label style={styles.label}>Tag</label>
                    <input
                      value={productForm.tag}
                      onChange={(e) => setProductForm({...productForm, tag: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                </div>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({...productForm, available: e.target.checked})}
                    style={styles.checkbox}
                  />
                  Available
                </label>

                <div style={styles.modalActions}>
                  <button type="button" className="btn-secondary" onClick={() => setShowProductModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', padding: '40px 0 80px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 36, fontWeight: 700, color: '#111827', margin: 0 },
  refreshButton: { display: 'flex', alignItems: 'center', gap: 8 },
  tabs: { display: 'flex', gap: 12, marginBottom: 32, borderBottom: '2px solid #e5e7eb' },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    color: '#6b7280',
    transition: 'all 0.3s'
  },
  tabActive: {
    color: '#22c55e',
    borderBottomColor: '#22c55e'
  },
  content: { marginTop: 24 },
  loading: { textAlign: 'center', padding: 60, fontSize: 18 },
  empty: { textAlign: 'center', padding: 60, color: '#6b7280' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: 20 },
  orderCard: { padding: 24, marginBottom: 0 },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 },
  orderInfo: { flex: 1, minWidth: 300 },
  orderNumber: { fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#111827' },
  orderDate: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  customerInfo: { fontSize: 14, color: '#374151', marginTop: 8 },
  statusSection: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 },
  statusLabel: { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  statusSelect: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '2px solid',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none'
  },
  divider: { height: 1, backgroundColor: '#e5e7eb', margin: '20px 0' },
  orderDetails: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 },
  section: { marginBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 },
  orderItems: { display: 'flex', flexDirection: 'column', gap: 8 },
  itemRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    fontSize: 14
  },
  itemName: { flex: 1, color: '#374151', fontWeight: 500 },
  itemQty: { color: '#6b7280', margin: '0 12px' },
  itemPrice: { fontWeight: 600, color: '#111827', minWidth: 80, textAlign: 'right' },
  addressText: { fontSize: 14, color: '#374151', lineHeight: 1.6, backgroundColor: '#f9fafb', padding: 12, borderRadius: 6 },
  orderFooter: { marginTop: 16 },
  totalSection: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f0fdf4',
    borderRadius: 8
  },
  totalLabel: { fontSize: 18, fontWeight: 600, color: '#111827' },
  totalValue: { fontSize: 24, fontWeight: 700, color: '#22c55e' },
  addButton: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 },
  productCard: { padding: 16 },
  productImage: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  productPrice: { fontSize: 16, color: '#22c55e', fontWeight: 600, marginBottom: 12 },
  productActions: { display: 'flex', gap: 8 },
  actionButton: { display: 'flex', alignItems: 'center', gap: 6, flex: 1 },
  tableCard: { padding: 20, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontWeight: 600 },
  td: { padding: '12px', borderBottom: '1px solid #f3f4f6' },
  modalTitle: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { fontSize: 14, fontWeight: 600, color: '#374151' },
  input: { padding: 12, borderRadius: 8, border: '2px solid #e5e7eb', fontSize: 14 },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  checkbox: { width: 18, height: 18 },
  modalActions: { display: 'flex', gap: 12, marginTop: 8 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 },
  statCard: { padding: 24, display: 'flex', alignItems: 'center', gap: 16 },
  statIcon: { width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statContent: { flex: 1 },
  statLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: 700, color: '#111827' },
  chartCard: { padding: 24, marginBottom: 32 },
  chartTitle: { fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#111827' },
  chartContainer: { display: 'flex', alignItems: 'flex-end', gap: 16, height: 250, padding: '20px 0' },
  barContainer: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  barWrapper: { width: '100%', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '80%', backgroundColor: '#22c55e', borderRadius: '4px 4px 0 0', position: 'relative', minHeight: 4, transition: 'all 0.3s' },
  barValue: { position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' },
  barLabel: { fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  barOrders: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 },
  gridCard: { padding: 24 },
  productList: { display: 'flex', flexDirection: 'column', gap: 12 },
  productItem: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  productRank: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 },
  productStats: { fontSize: 12, color: '#6b7280' },
  usersList: { display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' },
  userItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: 12, color: '#6b7280' },
  userDate: { fontSize: 12, color: '#9ca3af' },
  recentOrdersCard: { padding: 24 },
  recentOrdersList: { display: 'flex', flexDirection: 'column', gap: 12 },
  recentOrderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 },
  recentOrderNumber: { fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 },
  recentOrderCustomer: { fontSize: 12, color: '#6b7280' },
  recentOrderAmount: { fontSize: 16, fontWeight: 700, color: '#22c55e', marginRight: 16 },
  recentOrderStatus: { fontSize: 12, fontWeight: 600, textTransform: 'capitalize', padding: '4px 12px', borderRadius: 12, backgroundColor: '#f3f4f6' },
  emptyText: { textAlign: 'center', color: '#9ca3af', padding: 20 },
  accessDenied: {
    maxWidth: 500,
    margin: '100px auto',
    padding: 40,
    textAlign: 'center'
  },
  accessDeniedTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#ef4444',
    marginBottom: 16
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 1.6
  },
  backButton: {
    padding: '12px 24px',
    fontSize: 16
  }
};

export default AdminPanel;

