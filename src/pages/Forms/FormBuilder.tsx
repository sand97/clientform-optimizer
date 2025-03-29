import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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

// Define a type for the options object
type FieldOptions = { options?: string };

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
  const { id: formId } = useParams<{ id?: string }>();
  console.log("formId", formId);
  const isEditMode = Boolean(formId);
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
  const [initialFields, setInitialFields] = useState<Field[]>([]);
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

  // Merged useEffect for loading initial data (organizations and form details)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      let fetchedOrgs: Organization[] = [];

      try {
        // 1. Fetch Organizations first
        const { data: orgData, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id, organizations:organization_id(id, name)')
          .eq('user_id', user.id);

        if (orgError) throw orgError;

        fetchedOrgs = orgData.map(item => ({ 
          id: item.organizations.id, 
          name: item.organizations.name 
        }));
        setOrganizations(fetchedOrgs);

        // 2. Handle Edit Mode: Fetch form details and fields
        if (isEditMode && formId) {
          const { data: formDetails, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .eq('user_id', user.id)
            .single();

          if (formError) throw formError;
          if (!formDetails) throw new Error("Form not found or access denied.");

          const { data: formFields, error: fieldsError } = await supabase
            .from('fields')
            .select('*')
            .eq('form_id', formId)
            .order('order_position', { ascending: true });

          if (fieldsError) throw fieldsError;

          const processedFields: Field[] = formFields.map(field => {
             let parsedOptions: string | null = null;
             if (field.options) {
               try {
                 const optionsObj = JSON.parse(String(field.options));
                 if (typeof optionsObj === 'object' && optionsObj !== null && typeof optionsObj.options === 'string') {
                   parsedOptions = optionsObj.options;
                 }
               } catch (parseError) {
                 console.error('Failed to parse field options:', field.options, parseError);
               }
             }
             return {
               id: String(field.id), 
               name: field.name,
               type: field.type,
               required: field.required,
               placeholder: field.placeholder,
               options: parsedOptions, 
               order_position: field.order_position,
             };
           });

          // Reset forms with fetched data
          form.reset({
            name: formDetails.name,
            description: formDetails.description,
            organization_id: formDetails.organization_id || 'personal'
          });
          fieldsForm.reset({ fields: processedFields });
          setFormData(form.getValues()); // Set formData for display
          setInitialFields(processedFields); // Store initial fields for diffing
          setCurrentStep(1); // Ensure starting at step 1
        
        } else { // 3. Handle Create Mode: Reset forms to defaults
          form.reset({
            name: '',
            description: '',
            // Use currentOrgId from location state if available, else default
            organization_id: currentOrgId || 'personal' 
          });
          // Ensure default field exists if fieldsForm is empty
          if (fieldsForm.getValues('fields').length === 0) {
             fieldsForm.reset({ fields: [{ id: uuidv4(), name: '', type: 'text', required: false, placeholder: null, options: null, order_position: 0 }] });
          }
          setFormData(null); // Clear form data state
          setInitialFields([]); // Clear initial fields
          setCurrentStep(1);
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
        const message = error instanceof Error ? error.message : "Could not load data.";
        toast({
          title: "Error Loading Data",
          description: message,
          variant: "destructive",
        });
        // Optionally navigate away if loading fails critically
        if (isEditMode) navigate('/dashboard'); 
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

  // Dependencies: Trigger when mode, user, or relevant IDs change.
  // form, fieldsForm, toast, navigate, supabase are stable references.
  }, [isEditMode, formId, user, currentOrgId, form, fieldsForm, toast, navigate]);

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

  // Function to handle saving (both create and update)
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
      let currentFormId = formId; // Use existing formId if editing

      // 1. Upsert Form Details
      if (isEditMode && currentFormId) {
        // Update existing form
        const { error: updateFormError } = await supabase
          .from('forms')
          .update({
            name: formData.name,
            description: formData.description || '',
            // user_id should likely not be updated, assuming ownership doesn't change
            organization_id: formData.organization_id !== 'personal' ? formData.organization_id : null
          })
          .eq('id', currentFormId)
          .eq('user_id', user.id); // Ensure user owns the form

        if (updateFormError) {
          toast({ title: "Error updating form", description: updateFormError.message, variant: "destructive" });
          throw updateFormError; // Throw to prevent field updates if form update fails
        }
      } else {
        // Insert new form
        const { data: formResult, error: insertFormError } = await supabase
          .from('forms')
          .insert({
            name: formData.name,
            description: formData.description || '',
            user_id: user.id,
            organization_id: formData.organization_id !== 'personal' ? formData.organization_id : null
          })
          .select('id')
          .single();

        if (insertFormError) {
          toast({ title: "Error creating form", description: insertFormError.message, variant: "destructive" });
          throw insertFormError;
        }
        currentFormId = formResult.id; // Get the new form ID
      }

      if (!currentFormId) {
        throw new Error("Form ID is missing after form insert/update.");
      }

      // 2. Sync Fields (Insert, Update, Delete)
      const submittedFields = values.fields;
      const initialFieldIds = new Set(initialFields.map(f => f.id));
      const submittedFieldIds = new Set(submittedFields.map(f => f.id));

      // Fields to Delete: In initialFields but not in submittedFields
      const fieldsToDelete = initialFields.filter(f => !submittedFieldIds.has(f.id));
      // Fields to Insert: In submittedFields but not in initialFields (these will have UUIDs)
      // Assuming initial fields always have DB IDs (numeric or specific format)
      // and new fields have client-generated UUIDs.
      const fieldsToInsert = submittedFields.filter(f => !initialFieldIds.has(f.id));
      // Fields to Update: In both initialFields and submittedFields
      const fieldsToUpdate = submittedFields.filter(f => initialFieldIds.has(f.id));

      // Use unknown[] for the operations array to accommodate Supabase builders
      const operations: unknown[] = [];

      // Delete operations
      if (fieldsToDelete.length > 0) {
        const deleteIds = fieldsToDelete.map(f => f.id);
        operations.push(supabase.from('fields').delete().in('id', deleteIds));
      }

      // Insert operations
      if (fieldsToInsert.length > 0) {
        const insertData = fieldsToInsert.map(field => ({
          form_id: currentFormId,
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || null,
          options: field.options ? JSON.stringify({ options: field.options }) : null,
          order_position: field.order_position
          // Note: The database will generate its own primary key 'id' here
        }));
        operations.push(supabase.from('fields').insert(insertData));
      }

      // Update operations
      if (fieldsToUpdate.length > 0) {
        fieldsToUpdate.forEach(field => {
          operations.push(
            supabase
              .from('fields')
              .update({
                name: field.name,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder || null,
                options: field.options ? JSON.stringify({ options: field.options }) : null,
                order_position: field.order_position
              })
              .eq('id', field.id) // Match the existing field ID
              .eq('form_id', currentFormId as string) // Ensure it belongs to the correct form
          );
        });
      }

      // Execute all field operations
      // Promise.allSettled can handle the Thenable Supabase builders
      const results = await Promise.allSettled(operations);

      // Check for errors in field operations
      const fieldErrors = results.filter(r => r.status === 'rejected');
      if (fieldErrors.length > 0) {
        console.error("Errors saving fields:", fieldErrors);
        // Attempt to get a specific error message
        const firstError = (fieldErrors[0] as PromiseRejectedResult).reason;
        const errorMessage = firstError?.message || "Some field operations failed.";
        toast({ title: "Error Saving Fields", description: errorMessage, variant: "destructive" });
        // Note: Depending on requirements, you might want to roll back form changes here
        // or indicate partial success/failure.
        throw new Error("Field synchronization failed."); 
      }

      toast({
        title: isEditMode ? "Form Updated" : "Form Created",
        description: `Your form "${formData.name}" has been ${isEditMode ? 'updated' : 'created'} successfully.`
      });
      navigate('/dashboard');

    } catch (error) {
      // Catch errors from form insert/update or field sync
      console.error('Error saving form:', error);
      const message = error instanceof Error ? error.message : `There was an error ${isEditMode ? 'updating' : 'creating'} your form.`;
      // Avoid redundant toasts if already shown
      if (!(error instanceof Error && error.message.includes('field operations failed'))) {
         toast({
            title: isEditMode ? "Error Updating Form" : "Error Creating Form",
            description: message,
            variant: "destructive"
         });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add loading state check
  if (loading && isEditMode) {
    return <div className="flex justify-center items-center h-screen">Loading form data...</div>;
  }

  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {currentStep === 1 ? <Card>
            <CardHeader>
              {/* Conditional Title */}
              <CardTitle className="text-2xl">{isEditMode ? `Edit Form: ${formData?.name || '...'}` : 'Create a New Form'}</CardTitle>
              {/* Conditional Description */}
              <CardDescription>
                {isEditMode 
                  ? 'Update the name, description, and organization for your form.'
                  : 'Start by giving your form a name and description. You\'ll be able to add fields and customize it in the next step.'
                }
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
                      {/* Conditional Button Text */}
                      {isEditMode ? 'Continue to Edit Fields' : 'Continue to Add Fields'}
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
                  {/* Conditional Title */}
                  <CardTitle className="text-2xl">{isEditMode ? `Edit Fields for "${formData?.name}"` : `Add Fields to "${formData?.name}"`}</CardTitle>
                  {/* Conditional Description */}
                  <CardDescription>
                    {isEditMode 
                      ? 'Modify the fields for your form. You can add, remove, reorder, or change existing fields.'
                      : 'Your form needs at least one field. Add as many fields as you need.'
                    }
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
                    {/* Conditional Button Text */}
                    {isSubmitting ? "Saving..." : (isEditMode ? "Update Form" : "Save Form")}
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