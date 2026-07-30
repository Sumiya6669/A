import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { LangProvider } from '@/lib/i18n/LangContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import SiteLayout from '@/components/layout/SiteLayout';
import Home from './pages/Home';
import ServicesPage from './pages/ServicesPage';
import ProjectsPage from './pages/ProjectsPage';
import ProductsPage from './pages/ProductsPage';
import ProcessPage from './pages/ProcessPage';
import StackPage from './pages/StackPage';
import ReviewsPage from './pages/ReviewsPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import Admin from './pages/Admin';
import Login from './pages/Login';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Публичный сайт: каждый раздел — отдельная страница */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/stack" element={<StackPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LangProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LangProvider>
    </AuthProvider>
  );
}

export default App;
