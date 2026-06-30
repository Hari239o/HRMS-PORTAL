import axios from 'axios';
import axiosRetry from 'axios-retry';
import toast from 'react-hot-toast';

// Force empty baseURL to use Next.js rewrites proxy
const API_URL = '';

const api = axios.create({
 baseURL: API_URL,
 timeout: 15000, // 15 seconds timeout
});

// Setup Retry (retries on network errors or 5xx status codes)
axiosRetry(api, { 
 retries: 2, 
 retryDelay: axiosRetry.exponentialDelay,
 retryCondition: (error) => {
 // Retry on network errors or 5xx server errors
 return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500);
 }
});

let activeRequests = 0;

// Helper to manage global loading state via CustomEvent
const toggleLoading = (isLoading) => {
 if (isLoading) {
 activeRequests++;
 if (activeRequests === 1) {
 window.dispatchEvent(new Event('api_loading_start'));
 }
 } else {
 activeRequests--;
 if (activeRequests === 0) {
 window.dispatchEvent(new Event('api_loading_end'));
 }
 }
};

// Request Interceptor
api.interceptors.request.use(
 (config) => {
 if (config.method?.toLowerCase() !== 'get') {
 toggleLoading(true);
 }
 const token = sessionStorage.getItem('token');
 if (token) {
 config.headers.Authorization = `Bearer ${token}`;
 }
 return config;
 },
 (error) => {
 if (error.config?.method?.toLowerCase() !== 'get') {
 toggleLoading(false);
 }
 return Promise.reject(error);
 }
);

// Simple GET request memory cache to fix frontend lag during navigation
const getCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const originalGet = api.get;
api.get = async (url, config) => {
 const cacheKey = url + JSON.stringify(config?.params || {});
 const cached = getCache.get(cacheKey);
 if (cached && Date.now() - cached.time < CACHE_TTL) {
 return Promise.resolve(cached.res);
 }
 const res = await originalGet(url, config);
 getCache.set(cacheKey, { res, time: Date.now() });
 return res;
};

// Response Interceptor
api.interceptors.response.use(
 (response) => {
 if (response.config?.method?.toLowerCase() !== 'get') {
 toggleLoading(false);
 // Clear cache on any write operation (POST/PUT/DELETE) to ensure fresh data
 getCache.clear();
 }
 return response;
 },
 async (error) => {
 if (error.config?.method?.toLowerCase() !== 'get') {
 toggleLoading(false);
 }
 const originalRequest = error.config;

 if (!error.response) {
 toast.error('Network Error: Please check your internet connection or server status.');
 return Promise.reject(error);
 }

 const status = error.response.status;
 const serverError = error.response.data?.error;
 let message = 'An unexpected error occurred.';
 if (serverError) {
 message = typeof serverError === 'string' ? serverError : (serverError.message || message);
 }

 // Handle 401 Unauthorized globally
 if (status === 401) {
 // Optional: Logic to attempt token refresh could go here if the backend supported it.
 // e.g. const newToken = await api.post('/auth/refresh', { refreshToken });
 
 // Since no refresh token is provided by backend, log out the user
 toast.error('Session Expired: Please login again.');
 sessionStorage.removeItem('token');
 sessionStorage.removeItem('user');
 window.dispatchEvent(new Event('auth_logout'));
 setTimeout(() => {
 window.location.href = '/';
 }, 1500);
 } else if (status === 403) {
 toast.error(typeof serverError === 'string' && serverError.includes('device') ? 'Device Access Restricted' : 'Access Denied: You do not have permission for this action.');
 } else if (status === 503) {
 toast.error(message || 'Service temporarily unavailable.');
 } else if (status >= 500) {
 toast.error(message || 'Server Error: Our engineers are looking into it.');
 } else if (status !== 401) {
 console.error('API Error:', message);
 }

 return Promise.reject(error);
 }
);

export default api;
