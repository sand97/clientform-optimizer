
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const GuestLayout = () => {
  const { user, isLoading } = useAuth();

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

  // If already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render the guest routes
  return <Outlet />;
};

export default GuestLayout;
