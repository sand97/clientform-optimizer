import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: string;
  form_id: string;
  pdf_url: string;
  original_pdf_name: string;
  positions: Array<{
    x: number;
    y: number;
    page: number;
    fieldId: string;
  }>;
  updated_at: string;
  form_name?: string;
}

interface Form {
  id: string;
  name: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedForm, setSelectedForm] = useState<string>('');

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('templates')
          .select(`
            *,
            forms:form_id(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const templatesWithFormNames = data.map(template => ({
          ...template,
          form_name: template.forms?.name
        }));

        setTemplates(templatesWithFormNames);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchForms = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('forms')
          .select('id, name')
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
      }
    };

    fetchTemplates();
    fetchForms();
  }, [user, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedForm || !user) return;

    try {
      // Upload PDF to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // Create template record
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .insert([
          {
            form_id: selectedForm,
            pdf_url: publicUrl,
            positions: [],
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (templateError) throw templateError;

      toast({
        title: "Success",
        description: "Template uploaded successfully",
      });

      // Refresh templates list
      const { data: updatedTemplates, error: fetchError } = await supabase
        .from('templates')
        .select(`
          *,
          forms:form_id(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const templatesWithFormNames = updatedTemplates.map(t => ({
        ...t,
        form_name: t.forms?.name
      }));

      setTemplates(templatesWithFormNames);
      setSelectedFile(null);
      setSelectedForm('');
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "Error",
        description: "Failed to upload template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleShare = (template: Template) => {
    // Implementation of handleShare function
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">PDF Templates</CardTitle>
          <CardDescription>
            Manage your PDF templates for form filling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center text-gray-500">
              No templates found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>PDF Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.form_name}</TableCell>
                    <TableCell>{template.original_pdf_name}</TableCell>
                    <TableCell>
                      {new Date(template.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(template)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates; 