import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('gorasUser');
    const storedToken = localStorage.getItem('gorasToken');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('gorasUser');
        localStorage.removeItem('gorasToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token } = response;
      setUser(userData);
      localStorage.setItem('gorasUser', JSON.stringify(userData));
      localStorage.setItem('gorasToken', token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup(name, email, password);
      const { user: userData, token } = response;
      setUser(userData);
      localStorage.setItem('gorasUser', JSON.stringify(userData));
      localStorage.setItem('gorasToken', token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gorasUser');
    localStorage.removeItem('gorasToken');
  };

  // Check if token is valid (not expired)
  const isTokenValid = () => {
    const token = localStorage.getItem('gorasToken');
    if (!token) return false;
    
    try {
      // Decode token without verification (just to check expiry)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch (e) {
      return false;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};