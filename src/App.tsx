import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Browse from "./pages/Browse.tsx";
import ProviderDetail from "./pages/ProviderDetail.tsx";
import BecomeProvider from "./pages/BecomeProvider.tsx";
import CustomerDashboard from "./pages/CustomerDashboard.tsx";
import ProviderDashboard from "./pages/ProviderDashboard.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/providers/:id" element={<ProviderDetail />} />
            <Route path="/become-provider" element={<BecomeProvider />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
