
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface RegistrationSuccessProps {
  email: string;
}

const RegistrationSuccess = ({ email }: RegistrationSuccessProps) => {
  return (
    <Card className="w-full max-w-md border-blue-300 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-blue-500" />
          <CardTitle className="text-blue-700">Registration Successful</CardTitle>
        </div>
        <CardDescription className="text-blue-600">
          Please verify your email to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-700">
          We've sent a verification email to <span className="font-medium">{email}</span>. 
          Please check your inbox and click the verification link to activate your account.
        </p>
        <p className="mt-2 text-sm text-blue-600">
          If you don't see the email in your inbox, please check your spam or junk folder.
        </p>
      </CardContent>
    </Card>
  );
};

export default RegistrationSuccess;
