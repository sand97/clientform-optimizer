
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
import NotFound from "./pages/NotFound";

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
              <Route path="/forms/:id" element={<FormBuilder />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
