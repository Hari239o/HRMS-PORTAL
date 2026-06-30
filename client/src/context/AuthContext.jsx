"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
 const [portalMode, setPortalModeState] = useState('hr');

 useEffect(() => {
 const token = sessionStorage.getItem('token');
 const userData = sessionStorage.getItem('user');
 const storedPortalMode = sessionStorage.getItem('portalMode');

 if (token && userData) {
 const parsedUser = JSON.parse(userData);
 setUser(parsedUser);
 api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
 
 if (parsedUser.role === 'student') {
 sessionStorage.setItem('portalMode', 'student');
 setPortalModeState('student');
 } else if (storedPortalMode && storedPortalMode !== 'student') {
 setPortalModeState(storedPortalMode);
 }

 // Refresh latest user data in background
 api.get(`/api/employees/me`)
 .then(res => {
 if (res.data) {
 const updated = { ...parsedUser, ...res.data };
 sessionStorage.setItem('user', JSON.stringify(updated));
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
 sessionStorage.setItem('portalMode', mode);
 setPortalModeState(mode);
 };

 const login = (userData, token) => {
 sessionStorage.setItem('token', token);
 sessionStorage.setItem('user', JSON.stringify(userData));
 api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
 setUser(userData);

 if (userData.role === 'student') {
 sessionStorage.setItem('portalMode', 'student');
 setPortalModeState('student');
 } else {
 sessionStorage.setItem('portalMode', 'hr');
 setPortalModeState('hr');
 }
 };

 const updateUser = (newUserData) => {
 const updated = { ...user, ...newUserData };
 sessionStorage.setItem('user', JSON.stringify(updated));
 setUser(updated);
 };

 const logout = async () => {
 // Clear session synchronously to prevent interceptor loops
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('user');
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
