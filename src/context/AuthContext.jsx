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
    const validateSession = async () => {
      const storedUser = localStorage.getItem('gorasUser');
      if (storedUser) {
        try {
          // Verify with backend
          const response = await authAPI.me();
          if (response && response.user) {
            setUser(response.user);
            localStorage.setItem('gorasUser', JSON.stringify(response.user));
          } else {
            throw new Error('Invalid session');
          }
        } catch (e) {
          console.warn('Session invalid or expired:', e.message);
          setUser(null);
          localStorage.removeItem('gorasUser');
          localStorage.removeItem('gorasToken');
        }
      }
      setLoading(false);
    };
    validateSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData } = response;
      setUser(userData);
      localStorage.setItem('gorasUser', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authAPI.signup(name, email, password);
      const { user: userData } = response;
      setUser(userData);
      localStorage.setItem('gorasUser', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('gorasUser');
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
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