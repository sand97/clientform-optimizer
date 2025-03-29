import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  organization_id: string;
  role: string;
  expires_at: string;
}

const InvitationAccept = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // No rows returned
            toast({
              title: "No invitation found",
              description: "This invitation has expired or is invalid",
              variant: "destructive",
            });
            navigate('/dashboard');
            return;
          }
          throw error;
        }

        setInvitation(data);
      } catch (error) {
        console.error('Error checking invitation:', error);
        toast({
          title: "Error",
          description: "Failed to check invitation",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [navigate, toast]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      const { error } = await supabase
        .rpc('accept_invitation', { invitation_id: invitation.id });

      if (error) throw error;

      toast({
        title: "Invitation accepted",
        description: "You have been added to the organization",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You have been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              You have been invited to join an organization with the role of{' '}
              <span className="font-medium capitalize">{invitation.role}</span>.
            </p>
            <p className="text-sm text-gray-500">
              This invitation expires on{' '}
              {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Decline
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={accepting}
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default InvitationAccept; 