/**
 * Auth Pages with Navigation
 * ĐÃ SỬA: Luôn chuyển hướng về Dashboard sau khi đăng nhập, bỏ qua kiểm tra Onboarding
 */

import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { RegisterPage } from '../components/auth/RegisterPage';
import { ForgotPasswordPage } from '../components/auth/ForgotPasswordPage';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

/**
 * Login Page
 * Route: /login
 */
export function LoginPageRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Không cần lấy user nữa

  // Nếu đã đăng nhập -> Vào thẳng Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <LoginPage
      onSwitchToRegister={handleSwitchToRegister}
      onForgotPassword={handleForgotPassword}
    />
  );
}

/**
 * Register Page
 * Route: /register
 */
export function RegisterPageRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Nếu đã đăng nhập -> Vào thẳng Dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return <RegisterPage onSwitchToLogin={handleSwitchToLogin} />;
}

/**
 * Forgot Password Page
 * Route: /forgot-password
 */
export function ForgotPasswordPageRoute() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/login');
  };

  return <ForgotPasswordPage onBack={handleBack} />;
}