import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetails from './pages/OrderDetails';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import './App.css';
import SplashCursor from './components/SplashCursor';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <CartProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary relative">
              <SplashCursor
                DENSITY_DISSIPATION={5.0}
                VELOCITY_DISSIPATION={3}
                PRESSURE={0.1}
                CURL={1.5}
                SPLAT_RADIUS={0.08}
                SPLAT_FORCE={2000}
                COLOR_UPDATE_SPEED={10}
                SHADING={true}
                RAINBOW_MODE={false}
                COLOR="#86efac"
              />
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
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