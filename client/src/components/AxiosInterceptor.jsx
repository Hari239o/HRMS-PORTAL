import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const GlobalLoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-5 rounded-lg flex flex-col items-center shadow-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-gray-700 font-medium">Processing...</p>
      </div>
    </div>
  );
};

const AxiosInterceptor = ({ children }) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const handleLogoutEvent = () => {
      if (auth?.logout) {
        auth.logout();
      }
    };

    const handleLoadingStart = () => setIsLoading(true);
    const handleLoadingEnd = () => setIsLoading(false);

    window.addEventListener('auth_logout', handleLogoutEvent);
    window.addEventListener('api_loading_start', handleLoadingStart);
    window.addEventListener('api_loading_end', handleLoadingEnd);

    return () => {
      window.removeEventListener('auth_logout', handleLogoutEvent);
      window.removeEventListener('api_loading_start', handleLoadingStart);
      window.removeEventListener('api_loading_end', handleLoadingEnd);
    };
  }, [auth]);

  return (
    <>
      {isLoading && <GlobalLoadingOverlay />}
      {children}
    </>
  );
};

export default AxiosInterceptor;
