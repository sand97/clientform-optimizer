
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;

      try {
        // Get organizations where the user is a member
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            organizations:organization_id(id, name, created_at)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Extract organizations from the joined query
        const orgs = data.map(item => item.organizations) as Organization[];
        setOrganizations(orgs);
      } catch (error: any) {
        toast({
          title: "Error fetching organizations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [user, toast]);

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  const handleSelectOrganization = (id: string) => {
    // Will be implemented when we add organization-specific features
    navigate(`/organizations/${id}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // If no organizations, redirect to create one
  useEffect(() => {
    if (!loading && organizations.length === 0 && user) {
      navigate('/organizations/create');
    }
  }, [loading, organizations, user, navigate]);

  if (!user) {
    return null; // Will be redirected by the auth check
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleCreateOrganization}>Create Organization</Button>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-8">Loading your organizations...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card 
                key={org.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectOrganization(org.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
