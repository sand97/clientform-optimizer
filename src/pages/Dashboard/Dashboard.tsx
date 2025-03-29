
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, FileText, Settings, Plus, FormInput, FileCheck, Send } from 'lucide-react';
import UserMenu from '@/components/layout/UserMenu';
import OrganizationSelector from '@/components/layout/OrganizationSelector';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      if (metadata && metadata.full_name) {
        setUserName(metadata.full_name);
      } else if (metadata && metadata.name) {
        setUserName(metadata.name);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            organizations:organization_id(id, name, created_at)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const orgs = data.map(item => item.organizations) as Organization[];
        setOrganizations(orgs);
        
        if (orgs.length > 0 && !currentOrganization) {
          setCurrentOrganization(orgs[0]);
        }
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
  }, [user, toast, currentOrganization]);

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  const handleSelectOrganization = (id: string) => {
    const selected = organizations.find(org => org.id === id);
    if (selected) {
      setCurrentOrganization(selected);
      navigate(`/organizations/${id}`);
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <OrganizationSelector 
              organizations={organizations}
              currentOrganization={currentOrganization}
              onSelectOrganization={handleSelectOrganization}
              onCreate={handleCreateOrganization}
            />
            <UserMenu userName={userName} />
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
          <Card className="bg-blue-50 border border-blue-100">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Get Started with FormFiller</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FormInput className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2">1. Create Form</h4>
                  <p className="text-gray-600 text-sm">Design a user-friendly web form that captures all the information needed for your document.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2">2. Configure Template</h4>
                  <p className="text-gray-600 text-sm">Upload your existing PDF or document template that needs to be filled with client information.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2">3. Share Link</h4>
                  <p className="text-gray-600 text-sm">Send your clients a link to fill out the form on any device with real-time validation.</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
