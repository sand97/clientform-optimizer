import OrganizationSelector from '@/components/layout/OrganizationSelector';
import UserMenu from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, BarChart, CheckCircle, FileCheck, FileText, FormInput, Plus, Send, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Organization, Template, TeamMember } from '@/types/forms';

interface Form {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  organization_id: string | null;
  organization_name?: string;
}

interface Submission {
  id: string;
  form_id: string;
  template_id: string;
  template_data: any;
  form_data: any;
  field_values: any;
  created_at: string;
  organization_id: string | null;
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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hasCheckedOrgs, setHasCheckedOrgs] = useState(false);
  const [rawOrganizationIds, setRawOrganizationIds] = useState<string[]>([]);
  const [redirectingToCreate, setRedirectingToCreate] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

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
        setPermissionError(false);
        
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            organization_id,
            organizations:organization_id(id, name, created_at)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Dashboard - Error fetching organizations:', error);
          if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
            setPermissionError(true);
            toast({
              title: "Permission error",
              description: "You don't have permission to view these organizations. Please contact an administrator.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error fetching organizations",
              description: error.message,
              variant: "destructive",
            });
          }
          setHasCheckedOrgs(true);
          setLoading(false);
          return;
        }

        console.log('Raw organization data:', data);
        
        const allOrgIds = data?.map(item => item.organization_id).filter(Boolean) || [];
        setRawOrganizationIds(allOrgIds);
        
        const orgs = data
          ?.filter(item => item.organizations && item.organizations.id && item.organizations.name)
          .map(item => item.organizations) as Organization[] || [];
        
        console.log('Dashboard - Filtered organizations:', orgs);
        setOrganizations(orgs);
        
        if (orgs.length > 0 && !currentOrganization) {
          setCurrentOrganization(orgs[0]);
        }
        
        setHasCheckedOrgs(true);
      } catch (error: any) {
        console.error('Dashboard - Error fetching organizations:', error);
        toast({
          title: "Error fetching organizations",
          description: error.message,
          variant: "destructive",
        });
        setHasCheckedOrgs(true);
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

        let allForms = personalForms;

        if (currentOrganization) {
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
            .eq('organization_id', currentOrganization.id)
            .order('created_at', { ascending: false });

          if (orgFormsError) throw orgFormsError;

          const organizationForms = orgForms.map(form => ({
            ...form,
            organization_name: form.organizations?.name
          }));

          allForms = [...personalForms, ...organizationForms];
        }

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
  }, [user, currentOrganization, toast]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user || !currentOrganization) return;

      try {
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', currentOrganization.id);

        if (membersError) throw membersError;

        const transformedMembers: TeamMember[] = membersData.map(member => ({
          id: member.id || '',
          organization_id: member.organization_id || '',
          user_id: member.user_id || '',
          role: member.role || '',
          created_at: member.created_at || '',
          email: member.user_id || '',
          raw_user_meta_data: null
        }));

        setMembers(transformedMembers);

      } catch (error) {
        console.error('Error loading members:', error);
        toast({
          title: "Error",
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
          form_name: template.forms?.name,
          positions: typeof template.positions === 'string' ? 
            JSON.parse(template.positions) : template.positions
        }));

        setTemplates(templatesWithFormNames as Template[]);
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

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from('submissions')
          .select(`
            *,
            forms:form_id (
              user_id,
              organization_id
            )
          `);

        if (currentOrganization) {
          query = query.eq('organization_id', currentOrganization.id);
        } else {
          query = query.eq('forms.user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        const parsedSubmissions = data.map(submission => ({
          ...submission,
          template_data: typeof submission.template_data === 'string' ? 
            JSON.parse(submission.template_data) : submission.template_data,
          form_data: typeof submission.form_data === 'string' ? 
            JSON.parse(submission.form_data) : submission.form_data,
          field_values: typeof submission.field_values === 'string' ? 
            JSON.parse(submission.field_values) : submission.field_values
        }));

        setSubmissions(parsedSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load submissions",
          variant: "destructive",
        });
      }
    };

    fetchSubmissions();
  }, [user, currentOrganization, toast]);

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  const handleSelectOrganization = (id: string) => {
    const selected = organizations.find(org => org.id === id);
    if (selected) {
      setCurrentOrganization(selected);
      navigate(`/dashboard`);
    }
  };

  const handleCreateForm = () => {
    if (forms.length === 0) {
      navigate('/forms/create', { 
        state: { 
          currentOrganizationId: currentOrganization?.id || ''
      } 
    });
  } else if (templates.length === 0) {
    navigate('/templates/create', { 
      state: { 
        currentOrganizationId: currentOrganization?.id || ''
      } 
    });
  } else {
    navigate('/templates');
  }
  };

  useEffect(() => {
    if (!loading && 
        hasCheckedOrgs && 
        organizations.length === 0 && 
        rawOrganizationIds.length === 0 && 
        user && 
        !redirectingToCreate &&
        !permissionError) {
      console.log('No organizations found, redirecting to create organization');
      setRedirectingToCreate(true);
      navigate('/organizations/create');
    }
  }, [loading, hasCheckedOrgs, organizations, rawOrganizationIds, user, navigate, redirectingToCreate, permissionError]);

  if (!user) {
    return null; // Will be redirected by the auth check
  }

  if (loading && !hasCheckedOrgs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (redirectingToCreate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your organization...</p>
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full p-6">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Permission Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <p className="text-center text-gray-600">
                You don't have permission to view these organizations. This might be due to Row Level Security restrictions.
              </p>
              <Button onClick={handleCreateOrganization} className="w-full">
                Create New Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
                  <div className={`w-12 h-12 ${forms.length > 0 ? 'bg-blue-50' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
                    <FormInput className={`h-6 w-6 ${forms.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <h4 className={`font-medium text-lg mb-2 flex items-center gap-2 ${forms.length > 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                    1. Create Form
                    {forms.length > 0 && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Design a user-friendly web form that captures all the information needed for your document.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${templates.length > 0 ? 'bg-blue-50' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
                    <FileCheck className={`h-6 w-6 ${templates.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <h4 className={`font-medium text-lg mb-2 flex items-center gap-2 ${templates.length > 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                    2. Configure Template
                    {templates.length > 0 && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Upload your existing PDF or document template that needs to be filled with client information.
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${submissions.length > 0 ? 'bg-blue-50' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
                    <Send className={`h-6 w-6 ${submissions.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <h4 className={`font-medium text-lg mb-2 flex items-center gap-2 ${submissions.length > 0 ? 'text-blue-700' : 'text-gray-700'}`}>
                    3. Get Submissions
                    {submissions.length > 0 && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </h4>
                  <p className="text-sm text-gray-600">Send your clients a link to fill out the form on any device with real-time validation.</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                {forms.length === 0 || templates.length === 0 || submissions.length === 0 ? <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateForm}>
                  <Plus className="mr-2 h-4 w-4" /> 
                  {
                    forms.length === 0 ? "Create Your First Form" :
                    templates.length === 0 ? "Create Your First Template" :
                    "Share your template with your clients"
                  }
                </Button> : <p className="text-gray-600">Congratulations! You've done all the steps. You'll see stats here very soon.</p>}
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
            <Card 
              className="cursor-pointer transition-colors duration-300 hover:bg-blue-50 hover:border-blue-200 group"
              onClick={() => navigate('/submissions')}
            >
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
                <div className="text-2xl font-bold group-hover:text-blue-600">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {submissions.length === 0 ? "No submissions yet" : "Total submissions"}
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
