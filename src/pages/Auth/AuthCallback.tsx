
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          // Successfully authenticated
          navigate('/dashboard');
        } else {
          // Failed to authenticate
          setError('Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {error ? (
          <div className="text-center">
            <h2 className="text-xl font-medium text-red-600 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/auth/login')}>
              Return to Login
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-medium mb-4">Completing authentication...</h2>
            <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">You'll be redirected to the dashboard momentarily.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
