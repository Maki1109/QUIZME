import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Trophy, Clock, Target, Zap, CheckCircle, XCircle, RotateCcw, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { QuizResults } from './Challenge5MinQuiz';

interface Challenge5MinResultProps {
  results: QuizResults;
  onRetry: () => void;
  onBackToDashboard: () => void;
}

export function Challenge5MinResult({
  results,
  onRetry,
  onBackToDashboard,
}: Challenge5MinResultProps) {
  const { correctCount, totalQuestions, timeSpent, answers } = results;
  
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const avgTimePerQuestion = Math.round(timeSpent / totalQuestions);
  
  // Calculate XP earned
  let baseXP = 0;
  if (correctCount === 5) baseXP = 200;
  else if (correctCount === 4) baseXP = 150;
  else if (correctCount === 3) baseXP = 100;
  else if (correctCount === 2) baseXP = 50;
  else baseXP = 20;

  // Speed bonus (20% if < 3 minutes = 180 seconds)
  const speedBonus = timeSpent < 180 ? Math.round(baseXP * 0.2) : 0;
  const totalXP = baseXP + speedBonus;

  // Performance level
  let performanceLevel = '';
  let performanceColor = '';
  let performanceEmoji = '';
  
  if (accuracy === 100) {
    performanceLevel = 'Hoàn Hảo!';
    performanceColor = 'from-yellow-500 to-orange-500';
    performanceEmoji = '🏆';
  } else if (accuracy >= 80) {
    performanceLevel = 'Xuất Sắc!';
    performanceColor = 'from-green-500 to-teal-500';
    performanceEmoji = '⭐';
  } else if (accuracy >= 60) {
    performanceLevel = 'Khá Tốt!';
    performanceColor = 'from-blue-500 to-cyan-500';
    performanceEmoji = '👍';
  } else if (accuracy >= 40) {
    performanceLevel = 'Cố Gắng!';
    performanceColor = 'from-orange-500 to-yellow-500';
    performanceEmoji = '💪';
  } else {
    performanceLevel = 'Cần Ôn Thêm!';
    performanceColor = 'from-red-500 to-pink-500';
    performanceEmoji = '📚';
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-4 border-teal-200 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Trophy Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
              className={`w-24 h-24 bg-gradient-to-br ${performanceColor} rounded-2xl flex items-center justify-center mx-auto shadow-xl`}
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>

            {/* Performance Title */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-5xl mb-2">{performanceEmoji}</div>
                <CardTitle className="text-teal-700 text-3xl mb-2">
                  {performanceLevel}
                </CardTitle>
                <p className="text-gray-600 text-lg">
                  Hoàn thành Challenge 5 Phút
                </p>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Main Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-4"
            >
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Độ chính xác</p>
                <p className="text-3xl text-green-700">{accuracy}%</p>
                <p className="text-xs text-gray-500 mt-1">{correctCount}/{totalQuestions} câu đúng</p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Thời gian</p>
                <p className="text-3xl text-teal-700">{formatTime(timeSpent)}</p>
                <p className="text-xs text-gray-500 mt-1">~{avgTimePerQuestion}s/câu</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">XP nhận được</p>
                <p className="text-3xl text-purple-700">+{totalXP}</p>
                {speedBonus > 0 && (
                  <p className="text-xs text-orange-600 mt-1">⚡ Bonus +{speedBonus} XP</p>
                )}
              </div>
            </motion.div>

            {/* Speed Bonus Alert */}
            {speedBonus > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Alert className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50">
                  <AlertDescription className="flex items-center gap-2 text-orange-700">
                    <Zap className="w-5 h-5" />
                    <strong>Speed Bonus!</strong> Bạn hoàn thành trong &lt; 3 phút. Nhận thêm {speedBonus} XP!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Detailed Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white border-2 border-gray-200 rounded-lg p-4"
            >
              <h3 className="text-gray-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                Chi tiết từng câu
              </h3>
              <div className="space-y-2">
                {answers.map((answer, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-gray-700">
                        Câu {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {answer.timeSpent}s
                      </span>
                      {answer.isCorrect ? (
                        <span className="text-xs text-green-600 px-2 py-1 bg-green-100 rounded">
                          +30 XP
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 px-2 py-1 bg-red-100 rounded">
                          0 XP
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mascot Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Alert className="border-2 border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50">
                <AlertDescription className="text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🦉</div>
                    <div>
                      <p>
                        <strong>Sparky nói:</strong>{' '}
                        {accuracy === 100
                          ? 'Hoàn hảo! Bạn là một chiến binh thực thụ! 🏆'
                          : accuracy >= 80
                          ? 'Xuất sắc! Tiếp tục phát huy nhé! ⭐'
                          : accuracy >= 60
                          ? 'Khá tốt! Luyện tập thêm để lên top nhé! 💪'
                          : 'Đừng nản lòng! Hãy ôn lại những phần yếu và thử lại nhé! 📚'}
                      </p>
                      {correctCount < totalQuestions && (
                        <p className="text-sm text-teal-600 mt-2">
                          💡 Gợi ý: Ôn lại các câu sai để củng cố kiến thức!
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={onBackToDashboard}
                className="flex-1 py-6 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Về Dashboard
              </Button>

              <Button
                onClick={onRetry}
                variant="outline"
                className="flex-1 py-6 text-lg border-2 border-orange-300 hover:bg-orange-50 text-orange-700"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Thử lại ngày mai
              </Button>
            </motion.div>

            {/* Daily Limit Notice */}
            <p className="text-center text-xs text-gray-500">
              ⏰ Challenge 5 Phút chỉ làm 1 lần/ngày. Quay lại vào ngày mai nhé!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
