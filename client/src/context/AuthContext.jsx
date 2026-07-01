"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalMode, setPortalModeState] = useState('hr');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const storedPortalMode = localStorage.getItem('portalMode');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (parsedUser.role === 'student') {
        localStorage.setItem('portalMode', 'student');
        setPortalModeState('student');
      } else if (storedPortalMode && storedPortalMode !== 'student') {
        setPortalModeState(storedPortalMode);
      }

      // Refresh latest user data in background
      api.get(`/api/employees/me`)
        .then(res => {
          if (res.data) {
            const updated = { ...parsedUser, ...res.data };
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
          }
        })
        .catch(err => {
           console.log('Failed to background refresh user data', err.message);
        });
    }

    setLoading(false);
  }, []);

  const setPortalMode = (mode) => {
    if (!user) return;
    if (user.role === 'student' && mode !== 'student') return;
    if (user.role !== 'student' && mode === 'student') return;
    localStorage.setItem('portalMode', mode);
    setPortalModeState(mode);
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);

    if (userData.role === 'student') {
      localStorage.setItem('portalMode', 'student');
      setPortalModeState('student');
    } else {
      localStorage.setItem('portalMode', 'hr');
      setPortalModeState('hr');
    }
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const logout = async () => {
    try {
      if (user) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout API failed', err);
    }
    // Clear session synchronously to prevent interceptor loops
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, portalMode, setPortalMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
