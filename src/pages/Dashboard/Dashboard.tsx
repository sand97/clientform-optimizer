
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, FileText, Settings, Plus } from 'lucide-react';

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
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Extract user name from metadata or email
    if (user) {
      const metadata = user.user_metadata;
      if (metadata && metadata.full_name) {
        setUserName(metadata.full_name);
      } else if (metadata && metadata.name) {
        setUserName(metadata.name);
      } else if (user.email) {
        // Use email prefix as name if no name is available
        setUserName(user.email.split('@')[0]);
      }
    }
  }, [user]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h1>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Create your first form
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  No submissions yet
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Just you for now
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Account Settings</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Configure your account
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Organizations</h2>
            <Button onClick={handleCreateOrganization} size="sm">
              <Plus className="mr-1 h-4 w-4" /> Create Organization
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your organizations...</p>
            </div>
          ) : organizations.length > 0 ? (
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
          ) : (
            <Card className="bg-gray-50 border border-dashed border-gray-200">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No organizations yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create your first organization to start building forms
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={handleCreateOrganization}
                  >
                    Create Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
