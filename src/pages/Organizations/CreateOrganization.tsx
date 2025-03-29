
import { useState } from 'react';
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

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const CreateOrganization = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
    },
  });

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
      // Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add the creator as a member with 'admin' role
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
      
      // Redirect to organization dashboard
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
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
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
