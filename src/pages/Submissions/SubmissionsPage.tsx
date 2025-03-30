import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import { FormData, TemplateData, Field } from '@/types/forms';
import { useNavigate } from 'react-router-dom';
import { generateFilledPDF, PDFField } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SubmissionTemplate {
  original_pdf_name: string;
  pdf_url: string;
  form_name?: string;
}

interface Submission {
  id: string;
  form_data: FormData;
  template_data: TemplateData;
  field_values: Record<string, any>;
  created_at: string;
  templates?: SubmissionTemplate;
}

export default function SubmissionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          templates:template_id (
            original_pdf_name,
            pdf_url,
            form_id
          ),
          forms:form_id (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        form_data: typeof item.form_data === 'string' ? JSON.parse(item.form_data) : item.form_data,
        template_data: typeof item.template_data === 'string' ? JSON.parse(item.template_data) : item.template_data,
        field_values: typeof item.field_values === 'string' ? JSON.parse(item.field_values) : item.field_values,
        templates: item.templates ? {
          ...item.templates,
          form_name: item.forms?.name
        } : undefined
      })) as Submission[];
    }
  });

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const handleBuildDocument = async (submission: Submission) => {
    try {
      setIsGeneratingPDF(true);
      
      const pdfFields: PDFField[] = [];
      
      Object.entries(submission.field_values).forEach(([fieldId, value]) => {
        const position = submission.template_data.positions[fieldId];
        
        if (position) {
          pdfFields.push({
            id: fieldId,
            value: String(value),
            position: {
              x: position.x,
              y: position.y,
              page: position.page || 0
            }
          });
        }
      });
      
      const filledPdfBytes = await generateFilledPDF(
        submission.template_data.pdf_url,
        pdfFields
      );
      
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `filled_${submission.template_data.original_pdf_name || 'document.pdf'}`;
      link.click();
      
      toast({
        title: "PDF Generated",
        description: "Your filled PDF has been generated and downloaded.",
      });
      
    } catch (error) {
      console.error('Error generating filled PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <PageHeader heading="Submissions" text="View and manage form submissions" />
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-red-500">Error loading submissions: {(error as Error).message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <PageHeader heading="Submissions" text="View and manage form submissions" />

      <Card className="mt-6">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : submissions && submissions.length > 0 ? (
            <Table>
              <TableCaption>A list of all form submissions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.form_data.name}</TableCell>
                    <TableCell>
                      {submission.templates && submission.templates.original_pdf_name ? 
                        submission.templates.original_pdf_name : 
                        (submission.template_data.original_pdf_name || 'Unnamed Template')
                      }
                    </TableCell>
                    <TableCell>
                      {Object.keys(submission.field_values).length} fields filled
                    </TableCell>
                    <TableCell>
                      {submission.created_at ? 
                        formatDistanceToNow(new Date(submission.created_at), { addSuffix: true }) : 
                        'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBuildDocument(submission)}
                          disabled={isGeneratingPDF}
                        >
                          <Download className="h-4 w-4 mr-1" /> Build PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted {selectedSubmission?.created_at ? 
                formatDistanceToNow(new Date(selectedSubmission.created_at), { addSuffix: true }) : 
                'Unknown date'}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Form Name:</strong> {selectedSubmission.form_data.name}</p>
                  <p><strong>Template:</strong> {
                    selectedSubmission.templates?.original_pdf_name || 
                    selectedSubmission.template_data.original_pdf_name || 
                    'Unnamed Template'
                  }</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedSubmission.field_values).map(([fieldId, value]) => {
                      const fieldDef = selectedSubmission.form_data.fields?.find(
                        field => field.id === fieldId
                      );
                      
                      return (
                        <div key={fieldId} className="border rounded p-3">
                          <div className="font-medium">{fieldDef?.name || fieldId}</div>
                          <div className="text-sm mt-1 break-words">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                <Button 
                  onClick={() => handleBuildDocument(selectedSubmission)}
                  disabled={isGeneratingPDF}
                >
                  <Download className="h-4 w-4 mr-1" /> Generate PDF
                  {isGeneratingPDF && <span className="ml-2">...</span>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
