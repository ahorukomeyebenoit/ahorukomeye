import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Login with email + password
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, token: jwtToken } = response.data.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);

    return userData;
  };

  // Login with OTP (phone)
  const loginWithOTP = async (phone, code) => {
    const response = await authAPI.verifyOTP({
      phone,
      code,
      purpose: 'login'
    });
    const { user: userData, token: jwtToken } = response.data.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);

    return userData;
  };

  // Register (self-signup for admin)
  const register = async (data) => {
    const response = await authAPI.register(data);
    const { user: userData, token: jwtToken } = response.data.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);

    return userData;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Refresh user data from backend
  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      const userData = response.data.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      logout();
      throw err;
    }
  };

  // Computed helpers
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isTenant = user?.role === 'tenant';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isManager,
    isTenant,
    login,
    loginWithOTP,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export default AuthContext;