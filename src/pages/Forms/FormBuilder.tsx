import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardGroupedInput,
  CardGroupedCell
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FieldCard from '@/components/forms/FieldCard';
import { FIELD_TYPES } from '@/constants/formFields';
import { Field, Organization } from '@/types/forms';

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Form name must be at least 3 characters long",
  }),
  description: z.string().optional(),
  organization_id: z.string().optional(),
});

const fieldSchema = z.object({
  name: z.string().min(1, {
    message: "Field name is required",
  }),
  type: z.string().min(1, {
    message: "Field type is required",
  }),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type FieldValues = z.infer<typeof fieldSchema>;

const FormBuilder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEmptyNames, setHasEmptyNames] = useState(false);
  
  const currentOrgId = location.state?.currentOrganizationId || '';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      organization_id: currentOrgId,
    },
  });

  const fieldForm = useForm<FieldValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
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
            organizations:organization_id(id, name)
          `)
          .eq('user_id', user.id);

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
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [user, toast, form, currentOrgId]);

  useEffect(() => {
    setHasEmptyNames(fields.some(field => !field.name.trim()));
  }, [fields]);

  const onSubmitFormDetails = async (values: FormValues) => {
    setFormData(values);
    setCurrentStep(2);
  };

  const addField = (values: FieldValues) => {
    const newField: Field = {
      id: uuidv4(),
      name: values.name,
      type: values.type,
      required: values.required,
      placeholder: values.placeholder,
      order_position: fields.length,
    };

    setFields([...fields, newField]);
    
    fieldForm.reset({
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
    });
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id)
      .map((field, index) => ({
        ...field,
        order_position: index,
      }));
    
    setFields(updatedFields);
  };

  const saveForm = async () => {
    if (!formData || !user) return;
    
    if (fields.length === 0) {
      toast({
        title: "No fields added",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      });
      return;
    }

    if (hasEmptyNames) {
      toast({
        title: "Incomplete fields",
        description: "Please ensure all fields have a name before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: formResult, error: formError } = await supabase
        .from('forms')
        .insert({
          name: formData.name,
          description: formData.description || '',
          user_id: user.id,
          organization_id: formData.organization_id !== 'personal' ? formData.organization_id : null,
        })
        .select('id')
        .single();

      if (formError) throw formError;
      
      const formId = formResult.id;
      const fieldsToInsert = fields.map(field => ({
        form_id: formId,
        name: field.name,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || null,
        options: field.options || null,
        order_position: field.order_position,
      }));

      const { error: fieldsError } = await supabase
        .from('fields')
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;
      
      toast({
        title: "Form created",
        description: `Your form "${formData.name}" has been created successfully.`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating form:', error);
      toast({
        title: "Error creating form",
        description: error.message || "There was an error creating your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {currentStep === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create a New Form</CardTitle>
              <CardDescription>
                Start by giving your form a name and description. You'll be able to add fields and customize it in the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitFormDetails)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Client Intake Form" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Form for collecting client information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {organizations.length > 0 && (
                    <FormField
                      control={form.control}
                      name="organization_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization (Optional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an organization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">Personal Form</SelectItem>
                              {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Add Fields to "{formData?.name}"</CardTitle>
                <CardDescription>
                  Your form needs at least one field. Add as many fields as you need.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...fieldForm}>
                  <form onSubmit={fieldForm.handleSubmit(addField)} className="space-y-4">
                    <Card className="border-dashed border-2 bg-white">
                      <CardContent className="p-6">
                        <CardGroupedInput className="mb-4">
                          <CardGroupedCell label="FIELD NAME">
                            <FormField
                              control={fieldForm.control}
                              name="name"
                              render={({ field }) => (
                                <Input 
                                  className="border-0 shadow-none px-0 h-auto text-lg" 
                                  placeholder="e.g., Full Name" 
                                  {...field} 
                                />
                              )}
                            />
                          </CardGroupedCell>
                          
                          <CardGroupedCell label="FIELD TYPE">
                            <FormField
                              control={fieldForm.control}
                              name="type"
                              render={({ field }) => (
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="border-0 shadow-none px-0 h-auto text-lg">
                                      <SelectValue placeholder="Select a field type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {FIELD_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </CardGroupedCell>
                          
                          <CardGroupedCell label="OPTIONS">
                            <div className="flex items-center h-full">
                              <FormField
                                control={fieldForm.control}
                                name="required"
                                render={({ field }) => (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="required"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                    <label
                                      htmlFor="required"
                                      className="text-sm leading-none cursor-pointer"
                                    >
                                      Required Field
                                    </label>
                                  </div>
                                )}
                              />
                            </div>
                          </CardGroupedCell>
                        </CardGroupedInput>
                        
                        <CardGroupedInput>
                          <CardGroupedCell label="PLACEHOLDER" fullWidth>
                            <FormField
                              control={fieldForm.control}
                              name="placeholder"
                              render={({ field }) => (
                                <Input 
                                  className="border-0 shadow-none px-0 h-auto text-lg" 
                                  placeholder="e.g., Enter your full name" 
                                  {...field} 
                                />
                              )}
                            />
                          </CardGroupedCell>
                        </CardGroupedInput>

                        <Button type="submit" className="w-full mt-6">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Field
                        </Button>
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Form Fields ({fields.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <FieldCard 
                        key={field.id}
                        field={field}
                        index={index}
                        onRemove={removeField}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Form Details
              </Button>
              <Button 
                onClick={saveForm} 
                disabled={isSubmitting || fields.length === 0 || hasEmptyNames}
              >
                {isSubmitting ? "Saving..." : "Save Form"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
