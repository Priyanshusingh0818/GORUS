import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const SubscriptionSignup = lazy(() => import('./pages/SubscriptionSignup'));
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'));
const AdminDeliveryRequests = lazy(() => import('./pages/AdminDeliveryRequests'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));

const RouteFallback = () => (
  <main className="min-h-[72vh] bg-background">
    <div className="page-shell section-y">
      <div className="max-w-3xl">
        <div className="skeleton mb-4 h-4 w-36 rounded-full" />
        <div className="skeleton mb-4 h-12 w-4/5 rounded-full" />
        <div className="skeleton h-4 w-full rounded-full" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="skeleton aspect-[4/5]" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-2/3 rounded-full" />
              <div className="skeleton h-3 w-full rounded-full" />
              <div className="skeleton h-10 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </main>
);

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <CartProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary relative">
              <Navbar />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/latest" element={<Products />} />
                  <Route path="/products/available" element={<Products />} />
                  <Route path="/products/price-low-to-high" element={<Products />} />
                  <Route path="/category/:category" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/order/:id" element={<OrderDetails />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/subscriptions/new" element={<SubscriptionSignup />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                  <Route path="/admin/delivery-requests" element={<AdminDeliveryRequests />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Routes>
              </Suspense>
              <CartDrawer />
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
