import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Trophy, Home, Zap, TrendingUp } from 'lucide-react';

interface AITeacherPracticeResultProps {
  topic: string;
  correctCount: number;
  totalCount: number;
  xpEarned: number;
  onBackToDashboard: () => void;
}

export const AITeacherPracticeResult: React.FC<AITeacherPracticeResultProps> = ({
  topic,
  correctCount,
  totalCount,
  xpEarned,
  onBackToDashboard
}) => {
  const percentage = Math.round((correctCount / totalCount) * 100);
  const isPerfect = correctCount === totalCount;
  const isGood = percentage >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-4 border-purple-300 shadow-2xl">
          <CardContent className="p-8">
            {/* Celebration Icon */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-8xl mb-4"
              >
                {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl text-gray-900 mb-2"
              >
                {isPerfect ? 'HOÀN HẢO!' : isGood ? 'TỐT LẮM!' : 'HOÀN THÀNH!'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                {isPerfect 
                  ? 'Bạn đã nắm vững kiến thức rồi!'
                  : isGood
                  ? 'Bạn đang tiến bộ rất tốt!'
                  : 'Cố gắng lên, bạn sẽ làm tốt hơn!'}
              </motion.p>
            </div>

            {/* Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className={`border-4 mb-6 ${
                isPerfect 
                  ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50'
                  : isGood
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-teal-50'
                  : 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
              }`}>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 mb-2">Chủ đề: {topic}</p>
                    <div className="text-6xl text-gray-900 mb-2">
                      {correctCount}/{totalCount}
                    </div>
                    <div className={`text-2xl ${
                      isPerfect ? 'text-yellow-600' : isGood ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {percentage}% chính xác
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        isPerfect 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : isGood
                          ? 'bg-gradient-to-r from-green-400 to-teal-500'
                          : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* XP Reward */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
            >
              <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-100 to-pink-100 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      <Zap className="w-8 h-8 text-purple-600" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-gray-600 mb-1">Phần thưởng</p>
                      <p className="text-3xl text-purple-600">+{xpEarned} XP</p>
                    </div>
                    <motion.div
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: 100, y: -100, opacity: 0 }}
                      transition={{ duration: 1, delay: 1 }}
                    >
                      <Zap className="w-8 h-8 text-purple-600" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Improvement Message */}
            {!isPerfect && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="bg-orange-50 border-2 border-orange-200 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-orange-900 mb-1">
                          <strong>Gợi ý cải thiện:</strong>
                        </p>
                        <p className="text-orange-800 text-sm">
                          {correctCount < totalCount / 2
                            ? `Bạn nên ôn lại lý thuyết ${topic} và làm thêm bài tập cơ bản.`
                            : `Bạn đã nắm được phần lớn, hãy tập trung vào ${totalCount - correctCount} câu sai để hoàn thiện!`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success Message */}
            {isPerfect && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="bg-green-50 border-2 border-green-300 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-green-600" />
                      <p className="text-green-800">
                        Thẻ AI Teacher này sẽ <strong>biến mất khỏi Dashboard</strong> vì bạn đã làm chủ kiến thức!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="space-y-3"
            >
              <Button
                size="lg"
                onClick={onBackToDashboard}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xl h-14"
              >
                <Home className="w-6 h-6 mr-2" />
                Về Bảng điều khiển
              </Button>

              {!isPerfect && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Làm lại để cải thiện
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
