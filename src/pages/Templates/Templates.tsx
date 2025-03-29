import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileCheck, Plus, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  created_at: string;
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
          <CardTitle className="text-2xl">PDF Templates</CardTitle>
          <CardDescription>
            Manage your PDF templates for form filling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Template</CardTitle>
                <CardDescription>
                  Select a PDF template and associate it with a form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pdf">PDF Template</Label>
                      <div className="relative">
                        <Input
                          id="pdf"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div className="border rounded-md p-4 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Choose PDF file'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="form">Form</Label>
                      <select
                        id="form"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={selectedForm}
                        onChange={(e) => setSelectedForm(e.target.value)}
                      >
                        <option value="">Select a form</option>
                        {forms.map((form) => (
                          <option key={form.id} value={form.id}>
                            {form.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || !selectedForm}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.form_name}</TableCell>
                  <TableCell>
                    {new Date(template.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(template.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates; 