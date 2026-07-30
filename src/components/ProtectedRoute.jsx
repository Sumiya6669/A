import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, children }) {
  const location = useLocation();
  const { isAuthenticated, isLoadingAuth, authChecked, profile } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!['owner', 'admin'].includes(profile?.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="text-lg font-bold text-white">Нет доступа</p>
          <p className="text-sm text-white/35 mt-2">Для входа в админ-панель нужна роль owner или admin.</p>
        </div>
      </div>
    );
  }

  return children || <Outlet />;
}
