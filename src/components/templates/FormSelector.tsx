import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Field {
  id: string;
  name: string;
  type: string;
}

interface Form {
  id: string;
  name: string;
  fields: Field[];
}

interface FormSelectorProps {
  onFormSelect: (form: Form | null) => void;
}

export const FormSelector = ({ onFormSelect }: FormSelectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('forms')
          .select(`
            id,
            name,
            fields (
              id,
              name,
              type
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setForms(data || []);
      } catch (error) {
        console.error('Error fetching forms:', error);
        toast({
          title: "Error",
          description: "Failed to load forms",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user, toast]);

  const handleFormChange = (formId: string) => {
    const selectedForm = forms.find(form => form.id === formId) || null;
    onFormSelect(selectedForm);
  };

  if (loading) {
    return <div>Loading forms...</div>;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="form">Form</Label>
      <Select onValueChange={handleFormChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a form" />
        </SelectTrigger>
        <SelectContent>
          {forms.map((form) => (
            <SelectItem key={form.id} value={form.id}>
              <div>
                <span>{form.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({form.fields.length} fields)
                </span>
              </div>
            </SelectItem>
          ))}
          {forms.length === 0 && (
            <SelectItem value="empty" disabled>
              No forms available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}; 