
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback or email confirmation
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash or query params (email confirmations use query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check if this is an email confirmation (will have a 'type' param of 'signup')
        const isEmailConfirmation = queryParams.get('type') === 'signup' || 
                                    hashParams.get('type') === 'signup';
        
        // Get and refresh the session to ensure we have the latest state
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          // Successfully authenticated
          console.log('Authentication successful, redirecting to dashboard');
          navigate('/dashboard');
        } else if (isEmailConfirmation) {
          // If this is an email confirmation but no session yet,
          // we need to explicitly exchange the token
          const token = queryParams.get('access_token') || hashParams.get('access_token');
          const refreshToken = queryParams.get('refresh_token') || hashParams.get('refresh_token');
          
          if (token) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken || '',
            });
            
            if (setSessionError) {
              console.error('Error setting session:', setSessionError);
              setError(setSessionError.message);
              return;
            }
            
            // After setting the session, redirect to dashboard
            navigate('/dashboard');
          } else {
            // If we don't have a token but it's an email confirmation,
            // try to redirect to login
            navigate('/auth/login', { 
              state: { message: 'Email confirmed successfully. Please log in.' } 
            });
          }
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
