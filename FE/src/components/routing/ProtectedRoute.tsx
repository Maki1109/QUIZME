import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Target } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

/**
 * Protected Route Component
 * Chuyển hướng đến /login nếu chưa đăng nhập
 * ĐÃ SỬA: Bỏ chặn Onboarding để tránh Loop
 */
export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ❌ ĐÃ XÓA: Logic này gây ra vòng lặp. 
  // User chưa xong onboarding vẫn được vào Dashboard.
  /* if (requireOnboarding && user && !user.onboardingCompleted) {
    return <Navigate to="/goal-selection" replace />;
  }
  */

  return <>{children}</>;
}

/**
 * Loading component cho protected routes
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Target className="w-10 h-10 text-white" />
        </div>
        <p className="text-teal-700">Đang tải...</p>
      </div>
    </div>
  );
}