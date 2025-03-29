import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, ArrowRight, Info, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FIELD_TYPES } from '@/constants/formFields';
import { Field, Organization } from '@/types/forms';
import FieldList from '@/components/forms/FieldList';

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Form name must be at least 3 characters long"
  }),
  description: z.string().optional(),
  organization_id: z.string().optional()
});

const fieldsSchema = z.object({
  fields: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, { message: "Field name is required" }),
    type: z.string(),
    required: z.boolean(),
    placeholder: z.string().optional().nullable(),
    options: z.string().optional().nullable(),
    order_position: z.number()
  }))
});

type FormValues = z.infer<typeof formSchema>;
type FieldsValues = z.infer<typeof fieldsSchema>;

const FormBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const currentOrgId = location.state?.currentOrganizationId || '';
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      organization_id: currentOrgId
    }
  });

  const fieldsForm = useForm<FieldsValues>({
    resolver: zodResolver(fieldsSchema),
    defaultValues: {
      fields: [{
        id: uuidv4(),
        name: '',
        type: 'text',
        required: false,
        placeholder: null,
        options: null,
        order_position: 0
      }]
    }
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('organization_members').select(`
            organization_id,
            organizations:organization_id(id, name)
          `).eq('user_id', user.id);
        if (error) throw error;
        const orgs = data.map(item => ({
          id: item.organizations.id,
          name: item.organizations.name
        }));
        setOrganizations(orgs);
        if (currentOrgId && orgs.some(org => org.id === currentOrgId)) {
          form.setValue('organization_id', currentOrgId);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching organizations",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [user, toast, form, currentOrgId]);

  const onSubmitFormDetails = async (values: FormValues) => {
    setFormData(values);
    setCurrentStep(2);
  };
  
  const addNewField = () => {
    const currentFields = fieldsForm.getValues('fields');
    const newField = {
      id: uuidv4(),
      name: '',
      type: 'text',
      required: false,
      placeholder: null,
      options: null,
      order_position: currentFields.length
    };
    fieldsForm.setValue('fields', [...currentFields, newField]);
  };

  const removeField = (id: string) => {
    const currentFields = fieldsForm.getValues('fields');
    const updatedFields = currentFields
      .filter(field => field.id !== id)
      .map((field, index) => ({
        ...field,
        order_position: index
      }));
    fieldsForm.setValue('fields', updatedFields);
  };

  const updateFields = (updatedFields: Field[]) => {
    fieldsForm.setValue('fields', updatedFields);
  };

  const saveForm = async (values: FieldsValues) => {
    if (!formData || !user) return;
    if (values.fields.length === 0) {
      toast({
        title: "No fields added",
        description: "Please add at least one field to your form.",
        variant: "destructive"
      });
      return;
    }
    if (values.fields.some(field => !field.name.trim())) {
      toast({
        title: "Incomplete fields",
        description: "Please ensure all fields have a name before saving.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        data: formResult,
        error: formError
      } = await supabase.from('forms').insert({
        name: formData.name,
        description: formData.description || '',
        user_id: user.id,
        organization_id: formData.organization_id !== 'personal' ? formData.organization_id : null
      }).select('id').single();
      if (formError){
        toast({
          title: "Error creating form",
          description: formError.message || "There was an error creating your form. Please try again.",
          variant: "destructive"
        });
        return;
      }
      const formId = formResult.id;
      const fieldsToInsert = values.fields.map(field => {
        const options: any = {}
        if(field.options)
          options.options = field.options
        return ({
          form_id: formId,
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || null,
          // options are jsonb in supabase
          options: Object.keys(options).length > 0 ? JSON.stringify(options) : null,
          order_position: field.order_position
        })
      });
      const {
        error: fieldsError
      } = await supabase.from('fields').insert(fieldsToInsert);
      if (fieldsError) throw fieldsError;
      toast({
        title: "Form created",
        description: `Your form "${formData.name}" has been created successfully.`
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating form:', error);
      toast({
        title: "Error creating form",
        description: error.message || "There was an error creating your form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {currentStep === 1 ? <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create a New Form</CardTitle>
              <CardDescription>
                Start by giving your form a name and description. You'll be able to add fields and customize it in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitFormDetails)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({
                field
              }) => <FormItem>
                        <FormLabel>Form Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Client Intake Form" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="description" render={({
                field
              }) => <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Form for collecting client information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  {organizations.length > 0 && <FormField control={form.control} name="organization_id" render={({
                field
              }) => <FormItem>
                          <FormLabel>Organization (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an organization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">Personal Form</SelectItem>
                              {organizations.map(org => <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />}

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit">
                      Continue to Add Fields
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card> : <div className="space-y-6">
            <Form {...fieldsForm}>
              <form onSubmit={fieldsForm.handleSubmit(saveForm)}>
                <CardHeader>
                  <CardTitle className="text-2xl">Add Fields to "{formData?.name}"</CardTitle>
                  <CardDescription>
                    Your form needs at least one field. Add as many fields as you need.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldList 
                    fields={fieldsForm.watch('fields') as Field[]}
                    onFieldUpdate={updateFields}
                    onFieldDelete={removeField}
                  />

                  <Button
                    type="button"
                    className="w-full mt-6"
                    onClick={addNewField}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Field
                  </Button>
                </CardContent>

                <div className="flex justify-between">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Form Details
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || fieldsForm.watch('fields').length === 0}
                  >
                    {isSubmitting ? "Saving..." : "Save Form"}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>}
      </div>
    </div>;
};
export default FormBuilder;