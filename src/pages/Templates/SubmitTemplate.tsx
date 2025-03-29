import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import SubmissionSuccess from '@/components/templates/SubmissionSuccess';

interface Field {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order_position: number;
}

interface Template {
  id: string;
  form_id: string;
  pdf_url: string;
  positions: Array<{
    x: number;
    y: number;
    page: number;
    fieldId: string;
  }>;
  form: {
    id: string;
    name: string;
    description?: string;
    organization_id: string;
    fields: Field[];
  };
}

export default function SubmitTemplate() {
  const { templateId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Update page title when template loads
  useEffect(() => {
    if (template?.form?.name) {
      document.title = `${template.form.name} - Form Submission`;
    } else {
      document.title = 'Form Submission';
    }

    // Cleanup - reset title when component unmounts
    return () => {
      document.title = 'Form Filler';
    };
  }, [template]);

  useEffect(() => {
    const fetchTemplateAndForm = async () => {
      try {
        // First fetch template with form
        const { data: templateData, error: templateError } = await supabase
          .from('templates')
          .select(`
            *,
            form:form_id (
              id,
              name,
              description,
              organization_id
            )
          `)
          .eq('id', templateId)
          .single();

        if (templateError) throw templateError;

        // Then fetch fields for the form
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('fields')
          .select('*')
          .eq('form_id', templateData.form_id)
          .order('order_position');

        if (fieldsError) throw fieldsError;

        // Combine the data
        const completeTemplate = {
          ...templateData,
          form: {
            ...templateData.form,
            fields: fieldsData
          }
        };

        setTemplate(completeTemplate);

        // Initialize form data with empty values
        const initialFormData: Record<string, string> = {};
        fieldsData.forEach((field: Field) => {
          initialFormData[field.id] = '';
        });
        setFormData(initialFormData);

      } catch (error) {
        console.error('Error fetching template:', error);
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplateAndForm();
    }
  }, [templateId, toast]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template) return;

    try {
      // Create submission record
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          form_id: template.form_id,
          template_id: template.id,
          organization_id: template.form.organization_id,
          template_data: JSON.stringify({
            id: template.id,
            pdf_url: template.pdf_url,
            positions: template.positions
          }),
          form_data: JSON.stringify({
            id: template.form.id,
            name: template.form.name,
            description: template.form.description,
            fields: template.form.fields
          }),
          field_values: JSON.stringify(formData),
        });

      if (submissionError) throw submissionError;
      
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAnother = () => {
    // Clear form data
    const initialFormData: Record<string, string> = {};
    if (template) {
      template.form.fields.forEach((field: Field) => {
        initialFormData[field.id] = '';
      });
      setFormData(initialFormData);
    }
    setIsSubmitted(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p>Template not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow max-w-3xl mx-auto px-4 py-8 w-full">
        {isSubmitted ? (
          <div className="flex justify-center">
            <SubmissionSuccess
              formName={template.form.name}
              onSubmitAnother={handleSubmitAnother}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{template.form.name}</CardTitle>
              <CardDescription>
                {template.form.description || 'Please fill out all required fields'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {template.form.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.type === 'text' && (
                      <Input
                        type="text"
                        placeholder={field.placeholder}
                        value={formData[field.id]}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )}

                    {field.type === 'email' && (
                      <Input
                        type="email"
                        placeholder={field.placeholder}
                        value={formData[field.id]}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )}

                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={field.placeholder}
                        value={formData[field.id]}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )}

                    {field.type === 'dropdown' && (
                      <Select
                        value={formData[field.id]}
                        onValueChange={(value) => handleInputChange(field.id, value)}
                        required={field.required}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.split(',').map((option) => (
                            <SelectItem key={option.trim()} value={option.trim()}>
                              {option.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'checkbox' && field.options?.split(',').map((option) => (
                      <div key={option.trim()} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.id}-${option.trim()}`}
                          checked={formData[field.id]?.includes(option.trim())}
                          onCheckedChange={(checked) => {
                            const currentValues = formData[field.id]?.split(',').filter(Boolean) || [];
                            const newValues = checked
                              ? [...currentValues, option.trim()]
                              : currentValues.filter(v => v !== option.trim());
                            handleInputChange(field.id, newValues.join(','));
                          }}
                        />
                        <Label htmlFor={`${field.id}-${option.trim()}`}>{option.trim()}</Label>
                      </div>
                    ))}
                  </div>
                ))}

                <Button type="submit" className="w-full">
                  Submit Form
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <footer className="py-8 border-t">
        <Logo className="mx-auto" showPoweredBy />
      </footer>
    </div>
  );
} 