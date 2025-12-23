import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Zap, Clock, Target, Trophy, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface Challenge5MinLobbyProps {
  onStart: () => void;
  onBack: () => void;
}

export function Challenge5MinLobby({ onStart, onBack }: Challenge5MinLobbyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-4 border-orange-200 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl"
            >
              <Zap className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-orange-700 text-3xl mb-2">
                Challenge 5 Phút ⚡
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Thử thách tốc độ - Làm nhanh, làm chính xác!
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Mascot Message */}
            <Alert className="border-2 border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50">
              <AlertDescription className="text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🦉</div>
                  <div>
                    <p className="mb-1">
                      <strong>Sparky nói:</strong> "Hãy thử sức với 5 câu hỏi nhanh! 
                      Tốc độ và độ chính xác đều quan trọng đấy!"
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Challenge Info */}
            <div className="grid md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg p-4 text-center"
              >
                <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Số câu hỏi</p>
                <p className="text-2xl text-orange-700">5 câu</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-lg p-4 text-center"
              >
                <Clock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Thời gian</p>
                <p className="text-2xl text-teal-700">5:00</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center"
              >
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Phần thưởng</p>
                <p className="text-2xl text-purple-700">+150 XP</p>
              </motion.div>
            </div>

            {/* Rules */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-800 mb-3">📋 Quy tắc</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>5 câu hỏi ngẫu nhiên từ các chủ đề bạn đã chọn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Thời gian: 5 phút (1 phút/câu trung bình)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Feedback ngay lập tức sau mỗi câu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Càng nhanh và chính xác, càng nhiều XP bonus!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">⚡</span>
                  <span><strong>Mỗi ngày chỉ làm 1 lần!</strong> Hãy cố gắng hết mình!</span>
                </li>
              </ul>
            </div>

            {/* XP Bonus Info */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>🎯 Hệ thống điểm thưởng:</strong>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• 5/5 đúng: <strong className="text-green-600">+200 XP</strong></div>
                <div>• 4/5 đúng: <strong className="text-teal-600">+150 XP</strong></div>
                <div>• 3/5 đúng: <strong className="text-blue-600">+100 XP</strong></div>
                <div>• 2/5 đúng: <strong className="text-orange-600">+50 XP</strong></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                + Bonus 20% XP nếu hoàn thành trong &lt; 3 phút
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 py-6 text-lg border-2 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại
              </Button>
              
              <Button
                onClick={onStart}
                className="flex-1 py-6 text-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Bắt đầu ngay!
              </Button>
            </div>

            <p className="text-center text-xs text-gray-500">
              💡 Mẹo: Đọc kỹ câu hỏi trước khi chọn đáp án nhé!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
