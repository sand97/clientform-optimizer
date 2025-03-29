
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Form name must be at least 3 characters long",
  }),
  description: z.string().optional(),
});

// Field schema with validation
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

// Field type for our application
interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: any;
  order_position: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
];

const FormBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [currentField, setCurrentField] = useState<FieldValues>({
    name: '',
    type: 'text',
    required: false,
    placeholder: '',
  });

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
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
    
    // Reset field form
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

    setIsSubmitting(true);
    
    try {
      // Insert form
      const { data: formResult, error: formError } = await supabase
        .from('forms')
        .insert({
          name: formData.name,
          description: formData.description || '',
          user_id: user.id,
        })
        .select('id')
        .single();

      if (formError) throw formError;
      
      // Insert fields
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
      
      // Navigate to the dashboard
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={fieldForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fieldForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={fieldForm.control}
                        name="placeholder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placeholder (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fieldForm.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Required Field</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
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
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div 
                        key={field.id} 
                        className="flex items-center justify-between p-3 bg-white border rounded-md"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{field.name}</div>
                          <div className="text-sm text-gray-500">
                            Type: {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                            {field.required && ' • Required'}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeField(field.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                disabled={isSubmitting || fields.length === 0}
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
