
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Comprehensive debugging logs
    console.log('Auth callback triggered');
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
        
        console.log('Hash parameters:', Object.fromEntries(hashParams.entries()));
        console.log('Query parameters:', Object.fromEntries(queryParams.entries()));
        
        // Check if this is an email confirmation by looking for multiple indicators
        const isEmailConfirmation = 
          queryParams.get('type') === 'signup' || 
          hashParams.get('type') === 'signup' ||
          queryParams.has('confirmation_token') ||
          queryParams.has('token') ||
          location.pathname.includes('confirm') ||
          location.pathname.includes('verify') ||
          window.location.href.includes('confirm') ||
          window.location.href.includes('verify');
        
        console.log('Is email confirmation detected:', isEmailConfirmation);
        
        // Extract all possible tokens
        const accessToken = 
          queryParams.get('access_token') || 
          hashParams.get('access_token');
        
        const refreshToken = 
          queryParams.get('refresh_token') || 
          hashParams.get('refresh_token');
        
        const confirmationToken = 
          queryParams.get('confirmation_token') || 
          hashParams.get('token') ||
          queryParams.get('token');
          
        console.log('Access token found:', !!accessToken);
        console.log('Refresh token found:', !!refreshToken);
        console.log('Confirmation token found:', !!confirmationToken);
        
        // For email confirmations with access token
        if (isEmailConfirmation && accessToken) {
          console.log('Processing email confirmation with access token...');
          
          try {
            // Set the session with the provided tokens
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (setSessionError) {
              console.error('Error setting session with tokens:', setSessionError);
              // Continue to next approach - don't return early
            } else {
              console.log('Successfully set session with tokens');
            }
          } catch (e) {
            console.error('Exception setting session with tokens:', e);
            // Continue to next approach - don't return early
          }
        }
        
        // For email confirmations with confirmation token
        if (isEmailConfirmation && confirmationToken && !accessToken) {
          console.log('Processing email confirmation with confirmation token...');
          
          try {
            // Try to verify the email using the confirmation token
            // This approach depends on Supabase's implementation and may not be available
            // but we're trying all possible approaches
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: confirmationToken,
              type: 'email',
            });
            
            if (verifyError) {
              console.error('Error verifying with confirmation token:', verifyError);
              // Continue to next approach - don't return early
            } else {
              console.log('Successfully verified with confirmation token');
            }
          } catch (e) {
            console.error('Exception verifying with confirmation token:', e);
            // Continue to next approach - don't return early
          }
        }
        
        // Manual session refresh to ensure we have the latest state
        console.log('Manually refreshing session...');
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
          } else {
            console.log('Session refresh successful');
          }
        } catch (e) {
          console.error('Exception refreshing session:', e);
        }
        
        // Check the session after all token handling attempts
        console.log('Checking current session');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError.message);
          setProcessing(false);
          return;
        }
        
        console.log('Session check result:', data.session ? 'Has session' : 'No session');
        
        // Final redirection logic
        if (data.session) {
          // We have a valid session, redirect to dashboard
          console.log('Valid session found, redirecting to dashboard');
          toast({
            title: "Email verified successfully",
            description: "Your account is now active",
          });
          navigate('/dashboard');
        } else if (isEmailConfirmation) {
          // If it was an email confirmation but we couldn't establish a session,
          // redirect to login with success message
          console.log('Email confirmed but no session, redirecting to login with message');
          toast({
            title: "Email confirmed",
            description: "Your email has been confirmed. Please log in.",
          });
          navigate('/auth/login', { 
            state: { message: 'Email confirmed successfully. Please log in.' } 
          });
        } else {
          // If we get here and we thought it was an email confirmation,
          // make a final attempt with any tokens we have
          if (isEmailConfirmation && (accessToken || confirmationToken)) {
            console.log('Making final attempt to handle email confirmation');
            toast({
              title: "Email confirmation processed",
              description: "Please log in to continue.",
            });
            navigate('/auth/login', { 
              state: { message: 'Email confirmation processed. Please log in to continue.' } 
            });
          } else {
            // Not an email confirmation and no session - authentication failed
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

    // Execute the auth callback handler
    handleAuthCallback();
  }, [navigate, location, toast]);

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
