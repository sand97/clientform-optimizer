
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Form {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  organization_id: string | null;
  organization_name?: string;
}

interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder: string | null;
  options: any | null;
  order_position: number;
}

const FormView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormDetails = async () => {
      if (!id || !user) return;

      try {
        // Fetch form details
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select(`
            id, 
            name, 
            description, 
            created_at, 
            organization_id,
            organizations:organization_id(name)
          `)
          .eq('id', id)
          .single();

        if (formError) throw formError;

        // Format form data
        const formWithOrgName = {
          ...formData,
          organization_name: formData.organizations?.name
        };

        setForm(formWithOrgName);

        // Fetch form fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('fields')
          .select('*')
          .eq('form_id', id)
          .order('order_position', { ascending: true });

        if (fieldsError) throw fieldsError;

        setFields(fieldsData);
      } catch (error: any) {
        toast({
          title: "Error fetching form details",
          description: error.message,
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchFormDetails();
  }, [id, user, toast, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Form not found or you don't have permission to view it.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getFieldTypeLabel = (type: string) => {
    const typeMap: {[key: string]: string} = {
      'text': 'Text',
      'email': 'Email',
      'number': 'Number',
      'date': 'Date',
      'textarea': 'Text Area',
      'checkbox': 'Checkbox',
      'select': 'Dropdown'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => navigate(`/forms/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Form
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{form.name}</CardTitle>
                {form.organization_name && (
                  <div className="text-sm text-blue-600 font-medium mt-1">
                    {form.organization_name}
                  </div>
                )}
                <CardDescription className="mt-2">
                  {form.description || "No description provided"}
                </CardDescription>
              </div>
              <div className="text-right text-sm text-gray-500">
                Created {new Date(form.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>These fields will be included in your form.</CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No fields found for this form.</p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-white border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{field.name} {field.required && <span className="text-red-500">*</span>}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          Type: {getFieldTypeLabel(field.type)}
                        </div>
                        {field.placeholder && (
                          <div className="text-sm text-gray-500 mt-1">
                            Placeholder: {field.placeholder}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;
