import OrganizationSelector from '@/components/layout/OrganizationSelector';
import UserMenu from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, BarChart, CheckCircle, FileCheck, FileText, FormInput, Plus, Send, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface Form {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  organization_id: string | null;
  organization_name?: string;
}

interface Member {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  created_at: string;
}

interface Template {
  id: string;
  form_id: string;
  pdf_url: string;
  positions: Array<{
    x: number;
    y: number;
    page: number;
    fieldId: string;
  }>;
  created_at: string;
  updated_at: string;
  form_name?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

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

  useEffect(() => {
    const fetchForms = async () => {
      if (!user) return;

      try {
        const { data: personalForms, error: personalFormsError } = await supabase
          .from('forms')
          .select('id, name, description, created_at, organization_id')
          .eq('user_id', user.id)
          .is('organization_id', null)
          .order('created_at', { ascending: false });

        if (personalFormsError) throw personalFormsError;

        const { data: orgForms, error: orgFormsError } = await supabase
          .from('forms')
          .select(`
            id, 
            name, 
            description, 
            created_at, 
            organization_id,
            organizations:organization_id(name)
          `)
          .not('organization_id', 'is', null)
          .order('created_at', { ascending: false });

        if (orgFormsError) throw orgFormsError;

        const organizationForms = orgForms.map(form => ({
          ...form,
          organization_name: form.organizations?.name
        }));

        const allForms = [...personalForms, ...organizationForms];
        setForms(allForms);
      } catch (error: any) {
        toast({
          title: "Error fetching forms",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchForms();
  }, [user, toast]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user) return;

      try {
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', currentOrganization?.id);

        if (membersError) throw membersError;

        setMembers(membersData || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast({
          title: "Error fetching members",
          description: "Failed to load team members",
          variant: "destructive",
        });
      }
    };

    if (currentOrganization) {
      fetchMembers();
    }
  }, [user, toast, currentOrganization]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('templates')
          .select(`
            *,
            forms:form_id(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const templatesWithFormNames = data.map(template => ({
          ...template,
          form_name: template.forms?.name
        }));

        setTemplates(templatesWithFormNames);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      }
    };

    fetchTemplates();
  }, [user, toast]);

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

  const handleCreateForm = () => {
    if (forms.length > 0) {
      navigate('/templates/create', { 
        state: { 
          currentOrganizationId: currentOrganization?.id || ''
      } 
    });
  } else {
    navigate('/forms/create', { 
      state: { 
        currentOrganizationId: currentOrganization?.id || ''
      } 
    });
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
          <Card className="bg-blue-50 border border-blue-100">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Get Started with FormFiller</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FormInput className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2 flex items-center gap-2">
                    1. Create Form
                    {forms.length > 0 && <CheckCircle className="h-5 w-5 text-blue-700" />}
                  </h4>
                  <p className="text-gray-600 text-sm">Design a user-friendly web form that captures all the information needed for your document.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-lg mb-2">2. Configure Template
                    {templates.length > 0 && <CheckCircle className="h-5 w-5 text-blue-700" />}
                  </h4>
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
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateForm}>
                  <Plus className="mr-2 h-4 w-4" /> 
                  {
                    forms.length > 0 ? "Create Your First Template" : "Create Your First Form"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="cursor-pointer transition-colors duration-300 hover:bg-blue-50 hover:border-blue-200 group"
              onClick={() => {
                if (forms.length > 0) {
                  navigate('/forms');
                } else {
                  navigate('/forms/new');
                }
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Total Forms
                  <span className="ml-1 transform transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </span>
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-blue-600">{forms.length}</div>
                <p className="text-xs text-muted-foreground">
                  {forms.length === 0 ? "Create your first form" : "Forms created"}
                </p>
              </CardContent>
            </Card>
            <Card
              onClick={() => navigate('/templates')}
              className="cursor-pointer transition-colors duration-300 hover:bg-blue-50 hover:border-blue-200 group"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Templates
                  <span className="ml-1 transform transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </span>
                </CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-blue-600">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  {templates.length === 0 ? "Configure your first template" : "Templates configured"}
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer transition-colors duration-300 hover:bg-blue-50 hover:border-blue-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Submissions
                  <span className="ml-1 transform transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </span>
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-blue-600">0</div>
                <p className="text-xs text-muted-foreground">
                  No submissions yet
                </p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer transition-colors duration-300 hover:bg-blue-50 hover:border-blue-200 group"
              onClick={() => navigate('/team')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Team Members
                  <span className="ml-1 transform transition-transform duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </span>
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold group-hover:text-blue-600">{members.length}</div>
                <p className="text-xs text-muted-foreground">
                  {members.length === 0 ? "Invite your first member" : "Team members"}
                </p>
              </CardContent>
            </Card>  
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
