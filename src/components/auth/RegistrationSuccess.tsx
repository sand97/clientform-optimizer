
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, LogIn } from 'lucide-react';

interface RegistrationSuccessProps {
  email: string;
}

const RegistrationSuccess = ({ email }: RegistrationSuccessProps) => {
  return (
    <Card className="w-full max-w-md bg-blue-500 text-white border-blue-400">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-white" />
          <CardTitle className="text-white">Registration Successful</CardTitle>
        </div>
        <CardDescription className="text-blue-100">
          Please verify your email to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white">
          We've sent a verification email to <span className="font-medium">{email}</span>. 
          Please check your inbox and click the verification link to activate your account.
        </p>
        <p className="mt-2 text-sm text-blue-100">
          If you don't see the email in your inbox, please check your spam or junk folder.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        <Button 
          variant="outline" 
          className="w-full bg-white text-blue-600 border-white hover:bg-blue-50"
          onClick={() => window.location.href = "mailto:bruceguenkam@gmail.com"}
        >
          <Mail className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
        <Link to="/auth/login" className="w-full">
          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
            <LogIn className="mr-2 h-4 w-4" />
            Go to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RegistrationSuccess;
