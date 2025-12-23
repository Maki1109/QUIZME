/**
 * Individual Onboarding Pages - DISABLED
 * Các trang này giờ chỉ có nhiệm vụ redirect về Dashboard để tránh vòng lặp
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Component chung để redirect
function RedirectToDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Chuyển hướng ngay lập tức
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
        <p className="text-gray-500">Đang chuyển đến Dashboard...</p>
      </div>
    </div>
  );
}

/**
 * Goal Selection Page
 */
export function GoalSelectionPage() {
  return <RedirectToDashboard />;
}

/**
 * Subject Selection Page
 */
export function SubjectSelectionPage() {
  return <RedirectToDashboard />;
}

/**
 * Placement Test Page
 */
export function PlacementTestPage() {
  return <RedirectToDashboard />;
}