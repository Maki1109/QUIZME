import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Target, User, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-orange-200 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
            >
              <Target className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-orange-700">Tạo Tài Khoản Mới</CardTitle>
              <CardDescription className="text-base mt-2">
                Bắt đầu hành trình trở thành Chiến Binh Tri Thức
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  Họ và tên
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn Minh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-orange-200 focus:border-pink-400"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="minhnguyen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-orange-200 focus:border-pink-400"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-orange-200 focus:border-pink-400"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  Xác nhận mật khẩu
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-2 border-orange-200 focus:border-pink-400"
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  'Tạo tài khoản'
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">hoặc</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-orange-200 hover:bg-orange-50"
                onClick={onSwitchToLogin}
              >
                Đã có tài khoản? Đăng nhập
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          🚀 Tham gia cùng hàng nghìn Chiến Binh khác
        </p>
      </motion.div>
    </div>
  );
}
