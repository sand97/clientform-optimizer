
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthLayout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While checking authentication status, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected routes
  return <Outlet />;
};

export default AuthLayout;
