
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error);
        navigate('/auth/login');
        return;
      }

      if (data.session) {
        // Successfully authenticated
        navigate('/dashboard');
      } else {
        // Failed to authenticate
        navigate('/auth/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-4">Completing authentication...</h2>
        <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
