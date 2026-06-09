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

  // ========== ALIASES FOR COMPATIBILITY ==========
  // These make sure existing Login/Register components work
  
  const register = async (name, email, password, role) => {
    return await registerWithPassword(name, email, password, role);
  };

  const login = async (email, password) => {
    // If it's OTP login (password is 'otp_login'), don't do anything
    if (password === 'otp_login') {
      return { success: true };
    }
    // Otherwise do password login
    return await loginWithPassword(email, password);
  };

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
      // Aliases for compatibility
      register,     // ✅ ADDED
      login,        // ✅ ADDED
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
