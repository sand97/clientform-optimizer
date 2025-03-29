import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Eye, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// Define the type for a form object fetched from Supabase
interface FormListItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  organization_id: string | null;
  // Add organization name if joining later
  organization_name?: string | null; 
}

const FormListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State (to be implemented later)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Example: 10 forms per page
  const [totalForms, setTotalForms] = useState(0);

  useEffect(() => {
    const fetchForms = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Calculate range for pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // Fetch forms for the current page
        const { data, error: formsError, count } = await supabase
          .from('forms')
          .select('id, name, description, created_at, organization_id', { count: 'exact' }) // Request total count
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to); // Apply pagination range

        if (formsError) throw formsError;

        setForms(data || []);
        setTotalForms(count || 0); // Set the total count

      } catch (err: any) {
        console.error("Error fetching forms:", err);
        setError("Failed to load forms. Please try again.");
        toast({
          title: "Error",
          description: err.message || "Could not fetch forms.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user, supabase, toast, currentPage, itemsPerPage]); // Add currentPage, itemsPerPage

  const handleCreateNewForm = () => {
    // Navigate to the dedicated form creation route (e.g., /forms/new)
    // This route should render the FormBuilder component
    navigate('/forms/new'); 
  };

  const handleEditForm = (formId: string) => {
    // Navigate to the form edit route (e.g., /forms/:id)
    // This route should also render the FormBuilder component
    navigate(`/forms/${formId}`); 
  };
  
  const handleViewSubmissions = (formId: string) => {
    // TODO: Navigate to a potential submissions view page for this form
    navigate(`/forms/${formId}/submissions`); // Example route
     toast({ title: "Coming Soon", description: "Viewing form submissions is not yet implemented."});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  }

  // Pagination handlers
  const totalPages = Math.ceil(totalForms / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
       </Button>
       
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Your Forms</CardTitle>
            <CardDescription>
              Manage your created forms here. Create new forms or edit existing ones.
            </CardDescription>
          </div>
          <Button onClick={handleCreateNewForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading forms...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && forms.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">You haven't created any forms yet.</p>
              <Button onClick={handleCreateNewForm} className="mt-4">
                Create Your First Form
              </Button>
            </div>
          )}
          {!loading && !error && forms.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{form.description || '-'}</TableCell>
                     <TableCell>
                       {form.organization_id ? <Badge variant="outline">Organization</Badge> : <Badge variant="secondary">Personal</Badge>}
                    </TableCell>
                    <TableCell>{formatDate(form.created_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(form.id)}>
                        <Eye className="mr-1 h-4 w-4" /> View Submissions
                      </Button>
                       <Button variant="outline" size="sm" onClick={() => handleEditForm(form.id)}>
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FormListPage; 