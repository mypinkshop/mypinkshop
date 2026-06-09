import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const API_URL = 'https://api.mypinkshop.com/api';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserEmail = localStorage.getItem('userEmail');
    const storedUserName = localStorage.getItem('userName');
    const storedUserRole = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedToken && storedUserEmail) {
      setToken(storedToken);
      setUser({
        _id: storedUserId,
        email: storedUserEmail,
        name: storedUserName,
        role: storedUserRole
      });
    }
    setLoading(false);
  }, []);

  // ========== PASSWORD-BASED METHODS ==========
  
  // Register with password
  const registerWithPassword = async (name, email, password, role = 'buyer') => {
    try {
      const res = await fetch(`${API_URL}/auth/password/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userId', data.user._id);
        
        setToken(data.token);
        setUser(data.user);
        
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Login with password
  const loginWithPassword = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/password/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userId', data.user._id);
        
        setToken(data.token);
        setUser(data.user);
        
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error || 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ========== OTP-BASED METHODS ==========
  
  // Send OTP
  const sendOTP = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Verify OTP and login/register
  const verifyOTP = async (email, otp) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user?.email || email);
        localStorage.setItem('userName', data.user?.name || email.split('@')[0]);
        localStorage.setItem('userRole', data.user?.role || 'buyer');
        localStorage.setItem('userId', data.user?._id || '');
        
        setToken(data.token);
        setUser(data.user || { email, name: email.split('@')[0], role: 'buyer' });
        
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.error || 'Invalid OTP' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      return { success: res.ok, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ========== COMMON METHODS ==========
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token && !!localStorage.getItem('token');
  };

  const getCurrentUser = () => user;
  const getToken = () => token || localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      // Password-based methods
      registerWithPassword,
      loginWithPassword,
      // OTP-based methods
      sendOTP,
      verifyOTP,
      resendOTP,
      // Common methods
      logout,
      isAuthenticated,
      getCurrentUser,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
