
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building, LogOut, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const CreateOrganization = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckingOrganizations, setIsCheckingOrganizations] = useState(true);
  const [hasValidOrganization, setHasValidOrganization] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    const checkExistingOrganizations = async () => {
      if (!user) return;
      
      try {
        // First check if we have any organization memberships
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id, organizations:organization_id(id, name)')
          .eq('user_id', user.id);
          
        if (membershipError) throw membershipError;
        
        console.log('CreateOrg - Checking organization membership:', memberships);
        
        // Check if any of the memberships have a valid organization
        const validOrganizations = memberships?.filter(m => 
          m.organizations && m.organizations.id && m.organizations.name
        );
        
        if (validOrganizations && validOrganizations.length > 0) {
          console.log('CreateOrg - Found valid organizations, redirecting to dashboard');
          setHasValidOrganization(true);
          navigate('/dashboard');
          return;
        }
        
        // If no valid organizations, check if we need to fix the data
        if (memberships && memberships.length > 0) {
          console.log('CreateOrg - User has memberships but no valid organizations');
          // We have memberships but no valid organizations, let user create a new one
          setHasValidOrganization(false);
        }
      } catch (error) {
        console.error('Error checking organizations:', error);
      } finally {
        setIsCheckingOrganizations(false);
      }
    };
    
    checkExistingOrganizations();
  }, [user, navigate]);

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an organization",
        variant: "destructive",
      });
      navigate('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        title: "Organization created",
        description: `${data.name} has been created successfully.`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error creating organization",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth/login');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isCheckingOrganizations) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking organization status...</p>
        </div>
      </div>
    );
  }

  if (hasValidOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
          <CardDescription>Create your organization to collaborate with others</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." icon={<Building size={18} />} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                <Plus size={18} />
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <LogOut className="h-4 w-4 mr-2" />
                    Change Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out of your current account and redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-600">
          You'll be able to invite team members after creating your organization.
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateOrganization;
