import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface SubmissionSuccessProps {
  formName: string;
  onSubmitAnother: () => void;
}

const SubmissionSuccess = ({
  formName,
  onSubmitAnother
}: SubmissionSuccessProps) => {
  return (
    <Card className="w-full max-w-md bg-blue-500 text-white border-blue-400">
      <CardHeader className="pb-2 flex flex-col items-center text-center">
        <CheckCircle2 className="h-16 w-16 text-white mb-4" />
        <CardTitle className="text-white">Submission Successful</CardTitle>
        <CardDescription className="text-blue-100">
          Thank you for submitting {formName}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-white">
          Your form has been successfully submitted. We'll process your information and get back to you if necessary.
        </p>
        <p className="mt-2 text-sm text-blue-100">
          You can submit another response or close this window.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <Button 
          variant="outline" 
          className="w-full bg-white text-blue-600 border-white hover:bg-blue-50"
          onClick={onSubmitAnother}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Submit Another Response
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubmissionSuccess; 