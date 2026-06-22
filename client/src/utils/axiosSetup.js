import axios from 'axios';
import toast from 'react-hot-toast';

const setupAxios = (logout) => {
  // Add a request interceptor to include the JWT token
  axios.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add a response interceptor to handle errors globally
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        toast.error('Network Error: Please check if the backend server is running on port 5002.');
      } else {
        const status = error.response.status;
        const message = error.response.data?.error || 'An unexpected error occurred.';

        if (status === 401) {
          toast.error('Session Expired: Please login again.');
          if (typeof logout === 'function') {
            logout();
          }
        } else if (status === 403) {
          toast.error('Access Denied: You do not have permission for this action.');
        } else if (status === 503) {
          toast.error(message || 'Database temporarily unavailable.');
        } else if (status >= 500) {
          toast.error(message || 'Server Error: Our engineers are looking into it.');
        } else {
          console.error('API Error:', message);
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxios;
