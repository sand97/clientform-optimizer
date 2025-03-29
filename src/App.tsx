import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layouts/AuthLayout";
import GuestLayout from "@/components/layouts/GuestLayout";

import Index from "./pages/Index";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import AuthCallback from "./pages/Auth/AuthCallback";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateOrganization from "./pages/Organizations/CreateOrganization";
import FormBuilder from "./pages/Forms/FormBuilder";
import FormView from "./pages/Forms/FormView";
import NotFound from "./pages/NotFound";
import FormListPage from "./pages/Forms/FormListPage";
import TeamMembers from '@/pages/Team/TeamMembers';
import InvitationsPage from '@/pages/Invitations/InvitationsPage';
import ManageAccount from './pages/Account/ManageAccount';
import Templates from '@/pages/Templates/Templates';
import CreateTemplate from '@/pages/Templates/CreateTemplate';
import SubmitTemplate from '@/pages/Templates/SubmitTemplate';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            
            {/* Guest routes (only accessible if NOT logged in) */}
            <Route element={<GuestLayout />}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/reset-password" element={<ForgotPassword />} />
            </Route>
            
            {/* Special auth routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/update-password" element={<ResetPassword />} />
            
            {/* Protected routes (only accessible if logged in) */}
            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organizations/create" element={<CreateOrganization />} />
              <Route path="/forms/create" element={<FormBuilder />} />
              <Route path="/forms/:id/edit" element={<FormBuilder />} />
              <Route path="/forms/:id" element={<FormView />} />
              <Route path="/forms" element={<FormListPage />} />
              <Route path="/forms/new" element={<FormBuilder />} />
              <Route path="/team" element={<TeamMembers />} />
              <Route path="/invitations" element={<InvitationsPage />} />
              <Route path="/account/settings" element={<ManageAccount />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/create" element={<CreateTemplate />} />
            </Route>
            
            {/* Public Routes */}
            <Route path="/template/:templateId/submit" element={<SubmitTemplate />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
