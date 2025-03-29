
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Enhanced debugging logs
    console.log('Auth callback URL:', window.location.href);
    console.log('Query params:', location.search);
    console.log('Hash:', location.hash);
    
    // Handle the OAuth callback or email confirmation
    const handleAuthCallback = async () => {
      try {
        setProcessing(true);
        
        // Get the URL hash or query params (email confirmations use query params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(location.search);
        
        // Check if this is an email confirmation 
        const isEmailConfirmation = queryParams.get('type') === 'signup' || 
                                  hashParams.get('type') === 'signup';
        
        console.log('Is email confirmation:', isEmailConfirmation);
        console.log('Query parameters:', Object.fromEntries(queryParams.entries()));
        
        // For email confirmations, we need to handle the token
        if (isEmailConfirmation) {
          console.log('Processing email confirmation...');
          
          // Extract token from URL (could be in different places)
          const token = queryParams.get('access_token') || hashParams.get('access_token');
          const refreshToken = queryParams.get('refresh_token') || hashParams.get('refresh_token');
          
          console.log('Token found:', !!token);
          
          if (token) {
            console.log('Setting session with token');
            // Set the session with the provided tokens
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken || '',
            });
            
            if (setSessionError) {
              console.error('Error setting session:', setSessionError);
              setError(setSessionError.message);
              setProcessing(false);
              return;
            }
          }
        }
        
        // After handling the token (or for OAuth callbacks), check the session
        console.log('Checking current session');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
          setProcessing(false);
          return;
        }
        
        console.log('Session check result:', data.session ? 'Has session' : 'No session');
        
        if (data.session) {
          // We have a valid session, redirect to dashboard
          console.log('Valid session found, redirecting to dashboard');
          navigate('/dashboard');
        } else if (isEmailConfirmation) {
          // If email confirmation but no session (this happens with some email confirmation flows)
          console.log('Email confirmed but no session, redirecting to login with message');
          navigate('/auth/login', { 
            state: { message: 'Email confirmed successfully. Please log in.' } 
          });
        } else {
          // If we get here and it was an email confirmation, try a more direct approach
          if (isEmailConfirmation) {
            console.log('Attempting alternative email confirmation handling');
            // Try to use the token to sign in directly
            const accessToken = queryParams.get('access_token') || hashParams.get('access_token');
            const refreshToken = queryParams.get('refresh_token') || hashParams.get('refresh_token');
            
            if (accessToken) {
              try {
                const { data: signInData, error: signInError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || '',
                });
                
                if (signInError) {
                  console.error('Error signing in with token:', signInError);
                  setError('Authentication failed. Please try logging in manually.');
                } else if (signInData.session) {
                  console.log('Successfully signed in with token, redirecting to dashboard');
                  navigate('/dashboard');
                  return;
                }
              } catch (signInErr) {
                console.error('Exception during token sign in:', signInErr);
              }
            }
            
            // If we couldn't sign in with the token, redirect to login with a success message
            console.log('Could not sign in with token, redirecting to login with confirmation message');
            navigate('/auth/login', { 
              state: { message: 'Email confirmed successfully. Please log in.' } 
            });
          } else {
            // Failed to authenticate
            console.error('Authentication failed: No session established');
            setError('Authentication failed. Please try again.');
            setProcessing(false);
          }
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

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
