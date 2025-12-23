import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

type Step = 'email' | 'sent' | 'reset';

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send reset email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setStep('sent');
  };

  // Step 2: User clicks link in email (simulated)
  const handleOpenResetLink = () => {
    setStep('reset');
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    
    // Success - redirect to login
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md border-2 border-teal-200 shadow-xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-teal-600 hover:bg-teal-50"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-teal-700">Quên Mật Khẩu?</CardTitle>
                <CardDescription>
                  Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSendEmail}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="border-red-300">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="minhnguyen@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-teal-200 focus:border-orange-400"
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      'Gửi email đặt lại'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="w-full text-teal-600 hover:bg-teal-50"
                  >
                    Quay lại đăng nhập
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}

        {step === 'sent' && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md border-2 border-green-200 shadow-xl">
              <CardHeader className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <CardTitle className="text-green-700">Email Đã Gửi!</CardTitle>
                <CardDescription className="text-base">
                  Chúng tôi đã gửi link đặt lại mật khẩu đến
                  <br />
                  <span className="text-teal-600">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Alert className="border-2 border-yellow-300 bg-yellow-50">
                  <AlertDescription className="text-sm text-gray-700">
                    📧 Vui lòng kiểm tra hộp thư của bạn. Email có thể mất vài phút để đến.
                    <br />
                    <br />
                    💡 <strong>Không thấy email?</strong> Kiểm tra thư mục Spam/Junk.
                  </AlertDescription>
                </Alert>

                {/* DEMO ONLY: Simulate clicking email link */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center mb-3">
                    🎯 DEMO: Bấm nút dưới để mô phỏng click vào link trong email
                  </p>
                  <Button
                    onClick={handleOpenResetLink}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  >
                    Mở link đặt lại mật khẩu
                  </Button>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="w-full text-gray-600 hover:bg-gray-50"
                >
                  Quay lại đăng nhập
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'reset' && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full max-w-md border-2 border-purple-200 shadow-xl">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-700">Đặt Mật Khẩu Mới</CardTitle>
                <CardDescription>
                  Nhập mật khẩu mới cho tài khoản {email}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="border-red-300">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-2 border-purple-200 focus:border-pink-400"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-2 border-purple-200 focus:border-pink-400"
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đặt lại mật khẩu'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
