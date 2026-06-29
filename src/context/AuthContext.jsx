import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const API_URL = 'https://api.mypinkshop.com/api';

  // ============ LOAD USER FROM LOCALSTORAGE ============
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        console.log('✅ User loaded from localStorage:', userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        // Fallback to individual items
        const storedUserEmail = localStorage.getItem('userEmail');
        const storedUserName = localStorage.getItem('userName');
        const storedUserRole = localStorage.getItem('userRole');
        const storedUserId = localStorage.getItem('userId');
        const storedProfileImage = localStorage.getItem('profileImage') || sessionStorage.getItem('user_profile_image');
        
        if (storedToken && storedUserEmail) {
          setToken(storedToken);
          setUser({
            _id: storedUserId,
            email: storedUserEmail,
            name: storedUserName,
            role: storedUserRole,
            profileImage: storedProfileImage || null
          });
        }
      }
    }
    setLoading(false);
  }, []);

  // ============ REGISTER ============
  const register = (userData, token) => {
    console.log('📝 Register called with:', userData);
    
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userId', userData._id || '');
    if (userData.profileImage) {
      localStorage.setItem('profileImage', userData.profileImage);
      sessionStorage.setItem('user_profile_image', userData.profileImage);
    }
    
    console.log('✅ User registered and logged in:', userData);
    return { success: true };
  };

  // ============ LOGIN ============
  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt for:', email);
      
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        const userData = {
          _id: data.user._id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'buyer',
          profileImage: data.user.profileImage || null
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userId', userData._id);
        if (userData.profileImage) {
          localStorage.setItem('profileImage', userData.profileImage);
          sessionStorage.setItem('user_profile_image', userData.profileImage);
        }
        
        setToken(data.token);
        setUser(userData);
        
        console.log('✅ Login successful:', userData);
        return { success: true, data: userData };
      } else {
        console.log('❌ Login failed:', data.error);
        return { success: false, error: data.error || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // ============ OTP LOGIN ============
  const otpLogin = (userData, token) => {
    console.log('🔐 OTP Login with:', userData);
    
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userId', userData._id || '');
    if (userData.profileImage) {
      localStorage.setItem('profileImage', userData.profileImage);
      sessionStorage.setItem('user_profile_image', userData.profileImage);
    }
    
    return { success: true };
  };

  // ============ UPDATE PROFILE ============ ✅ NEW
  const updateUserProfile = (updatedData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      
      // ✅ Save to localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // ✅ Save profileImage separately
      if (updatedData.profileImage) {
        localStorage.setItem('profileImage', updatedData.profileImage);
        sessionStorage.setItem('user_profile_image', updatedData.profileImage);
      }
      
      console.log('✅ User profile updated:', newUser);
      return newUser;
    });
  };

  // ============ LOGOUT ============
  const logout = () => {
    console.log('🚪 Logging out...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('profileImage');
    sessionStorage.removeItem('user_profile_image');
    
    setToken(null);
    setUser(null);
  };

  // ============ IS AUTHENTICATED ============
  const isAuthenticated = () => {
    const hasToken = !!token && !!localStorage.getItem('token');
    return hasToken;
  };

  // ============ GET CURRENT USER ============
  const getCurrentUser = () => {
    return user || JSON.parse(localStorage.getItem('user') || 'null');
  };

  // ============ GET TOKEN ============
  const getToken = () => {
    return token || localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      register,
      login,
      otpLogin,
      logout,
      updateUserProfile, // ✅ NEW - Export this!
      isAuthenticated,
      getCurrentUser,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
