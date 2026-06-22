import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import setupAxios from '../utils/axiosSetup';

const AxiosInterceptor = ({ children }) => {
  const auth = useAuth();
  
  useEffect(() => {
    // Only set up interceptors if auth context is available and has logout function
    if (auth?.logout) {
      setupAxios(auth.logout);
    }
  }, [auth?.logout]);

  return children;
};

export default AxiosInterceptor;
