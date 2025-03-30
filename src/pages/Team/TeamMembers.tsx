import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import OrganizationSelector from '@/components/layout/OrganizationSelector';
import { Organization, TeamMember } from '@/types/forms';

const TeamMembers = () => {
  const { user } = useAuth();
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  
  const inviteFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    role: z.enum(["member", "admin", "owner"], {
      required_error: "Please select a role",
    }),
  });

  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

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

        const orgs = data
          .filter(item => item.organizations)
          .map(item => item.organizations) as Organization[];
        
        setOrganizations(orgs);
        
        if (organizationId) {
          const selectedOrg = orgs.find(org => org.id === organizationId);
          if (selectedOrg) {
            setCurrentOrganization(selectedOrg);
          } else if (orgs.length > 0) {
            setCurrentOrganization(orgs[0]);
          }
        } else if (orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
        }
      } catch (error: any) {
        console.error('Error fetching organizations:', error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      }
    };

    fetchOrganizations();
  }, [user, toast, organizationId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user || !currentOrganization) return;

      try {
        setLoading(true);
        
        // Check user role
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', currentOrganization.id)
          .eq('user_id', user.id)
          .single();

        if (userRoleError && userRoleError.code !== 'PGRST116') {
          throw userRoleError;
        }

        setIsAdmin(
          userRoleData?.role === 'admin' || 
          userRoleData?.role === 'owner'
        );
        
        // Get all members with organization name
        const { data, error } = await supabase
          .from('organization_members_with_users')
          .select(`
            id, 
            organization_id, 
            user_id, 
            role, 
            created_at, 
            email, 
            raw_user_meta_data,
            organizations:organization_id(name)
          `)
          .eq('organization_id', currentOrganization.id);

        if (error) throw error;

        console.log('Members data:', data);

        // Map the results to include organization name without deep nesting
        const mappedMembers: TeamMember[] = data.map(member => ({
          id: member.id || '',
          organization_id: member.organization_id || '',
          user_id: member.user_id || '',
          role: member.role || '',
          created_at: member.created_at || '',
          email: member.email || '',
          raw_user_meta_data: member.raw_user_meta_data || null,
          organization_name: member.organizations?.name || currentOrganization.name
        }));

        setMembers(mappedMembers);
      } catch (error: any) {
        console.error('Error fetching members:', error);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentOrganization) {
      fetchMembers();
    }
  }, [user, toast, currentOrganization]);

  

  const onSubmit = async (formData: z.infer<typeof inviteFormSchema>) => {
    try {
      if (!currentOrganization) {
        toast({
          title: "Error",
          description: "No organization selected",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: currentOrganization.id,
          email: formData.email,
          role: formData.role,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${formData.email}`,
      });

      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      if (!currentOrganization) {
        return;
      }

      setLoading(true);

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      
      toast({
        title: "Member removed",
        description: "The team member has been removed from the organization",
      });
      
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = () => {
    navigate('/organizations/create');
  };

  const handleSelectOrganization = (id: string) => {
    const selected = organizations.find(org => org.id === id);
    if (selected) {
      setCurrentOrganization(selected);
      navigate(`/team/${id}`);
    }
  };

  

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
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Members</h1>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Invite Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The email address of the person you want to invite.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The permissions level for this team member.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {loading && members.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Loading team members...</p>
          </div>
        ) : members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {member.raw_user_meta_data?.name || member.raw_user_meta_data?.full_name || 'User'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {member.email}
                      </CardDescription>
                    </div>
                    {isAdmin && member.user_id !== user?.id && (
                      <AlertDialog 
                        open={isDeleteDialogOpen && memberToDelete?.id === member.id} 
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setMemberToDelete(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => setMemberToDelete(member)}
                          >
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.email} from the organization? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => deleteMember(member.id)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">Role:</span>
                      <span className="ml-2 capitalize">{member.role}</span>
                    </div>
                    <div>
                      <span className="font-medium">Joined:</span>
                      <span className="ml-2">
                        {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">No team members found</p>
              {isAdmin && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  Invite Your First Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamMembers;
