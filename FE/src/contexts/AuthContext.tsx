import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type User as ApiUser } from '../services/authService';
import { userService } from '../services/userService';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  onboardingCompleted: boolean;
  goals?: string[];
  subjects?: string[];
  level?: number;
  xp?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  completeOnboarding: (goals: string[], subjects: string[], placementLevel: number) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ✅ KHÔNG AUTO-LOGIN: Luôn bắt đầu từ trạng thái không đăng nhập
  // Chỉ đăng nhập khi user bấm Login thành công
  const [isLoading, setIsLoading] = useState(false);

  // ❌ ĐÃ XÓA: useEffect auto-restore session
  // Luôn bắt đầu từ trang login, không auto-login

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      // Set user from API response
      setUser({
        id: response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        onboardingCompleted: response.user.onboardingCompleted || false,
        level: response.user.level || 1,
        xp: response.user.xp || 0,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authService.register({
        fullName: name,
        email,
        password,
      });
      
      // Set user from API response
      setUser({
        id: response.user.id,
        name: response.user.fullName,
        email: response.user.email,
        onboardingCompleted: response.user.onboardingCompleted || false,
        level: response.user.level || 1,
        xp: response.user.xp || 0,
      });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    setIsLoading(true);
    
    try {
      // TODO: Implement reset password API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password reset for:', email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (goals: string[], subjects: string[], placementLevel: number): Promise<boolean> => {
    if (!user) return false;
    try {
      // Update via API - nếu API fail thì chỉ update local state
      try {
        await userService.updateProfile({
          onboardingCompleted: true,
          goals,
          subjects,
        });
        
        // Nếu API success, fetch lại user từ API
        const userData = await authService.getMe();
        setUser({
          id: userData.id,
          name: userData.fullName,
          email: userData.email,
          avatar: userData.avatar,
          onboardingCompleted: userData.onboardingCompleted,
          goals: userData.goals,
          subjects: userData.subjects,
          level: userData.level,
          xp: userData.xp,
        });
      } catch (apiError) {
        // Nếu API fail (403 hoặc lỗi khác), vẫn update local state để tiếp tục flow
        console.warn('API update failed, updating local state only:', apiError);
        const updatedUser = {
          ...user,
          onboardingCompleted: true,
          goals,
          subjects,
          level: placementLevel,
        };
        setUser(updatedUser);
      }
      return true;
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        // Update via API if needed
        await userService.updateProfile({
          fullName: updates.name,
          avatar: updates.avatar,
          goals: updates.goals,
          subjects: updates.subjects,
        });
        
        // Update local state
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      } catch (error) {
        console.error('Update user error:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        completeOnboarding,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}