import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Clock, Zap, CheckCircle, XCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface QuestionResult {
  questionId: number;
  correct: boolean;
  timeSpent: number;
}

interface ExamRoomResultProps {
  mode: 'sprint' | 'marathon' | 'ranking';
  correctCount: number;
  totalQuestions: number;
  totalTime: number;
  questionResults: QuestionResult[];
  onBackToDashboard: () => void;
  onRetry?: () => void;
}

const ExamRoomResult: React.FC<ExamRoomResultProps> = ({
  mode,
  correctCount,
  totalQuestions,
  totalTime,
  questionResults,
  onBackToDashboard,
  onRetry
}) => {
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  // Calculate XP based on mode and performance
  const calculateXP = () => {
    let baseXP = 0;
    
    if (mode === 'sprint') {
      // Sprint: 150 base, up to 200 for perfect
      if (accuracy === 100) baseXP = 200;
      else if (accuracy >= 80) baseXP = 150;
      else if (accuracy >= 60) baseXP = 100;
      else if (accuracy >= 40) baseXP = 50;
      else baseXP = 20;

      // Speed bonus for Sprint (if < 10 minutes)
      if (totalTime < 10 * 60) {
        const speedBonus = Math.floor(baseXP * 0.2);
        return { base: baseXP, speed: speedBonus, total: baseXP + speedBonus };
      }
    } else if (mode === 'marathon') {
      // Marathon: 500 base, up to 700 for perfect
      if (accuracy === 100) baseXP = 700;
      else if (accuracy >= 80) baseXP = 500;
      else if (accuracy >= 60) baseXP = 300;
      else if (accuracy >= 40) baseXP = 150;
      else baseXP = 50;
    } else if (mode === 'ranking') {
      // Ranking: based on performance
      if (accuracy === 100) baseXP = 1000;
      else if (accuracy >= 80) baseXP = 800;
      else if (accuracy >= 60) baseXP = 500;
      else if (accuracy >= 40) baseXP = 300;
      else baseXP = 100;
    }

    return { base: baseXP, speed: 0, total: baseXP };
  };

  const xp = calculateXP();

  // Get performance badge
  const getPerformanceBadge = () => {
    if (accuracy === 100) {
      return {
        icon: Trophy,
        label: '🏆 Hoàn Hảo',
        color: 'from-yellow-500 to-orange-600',
        textColor: 'text-yellow-300',
        bgColor: 'bg-yellow-500/20'
      };
    } else if (accuracy >= 80) {
      return {
        icon: Trophy,
        label: '⭐ Xuất Sắc',
        color: 'from-green-500 to-teal-600',
        textColor: 'text-green-300',
        bgColor: 'bg-green-500/20'
      };
    } else if (accuracy >= 60) {
      return {
        icon: Target,
        label: '👍 Khá Tốt',
        color: 'from-cyan-500 to-blue-600',
        textColor: 'text-cyan-300',
        bgColor: 'bg-cyan-500/20'
      };
    } else if (accuracy >= 40) {
      return {
        icon: Zap,
        label: '💪 Cố Gắng',
        color: 'from-orange-500 to-pink-600',
        textColor: 'text-orange-300',
        bgColor: 'bg-orange-500/20'
      };
    } else {
      return {
        icon: CheckCircle,
        label: '📚 Cần Ôn Thêm',
        color: 'from-red-500 to-pink-600',
        textColor: 'text-red-300',
        bgColor: 'bg-red-500/20'
      };
    }
  };

  const badge = getPerformanceBadge();

  // Mascot message based on performance
  const getMascotMessage = () => {
    if (accuracy === 100) {
      return '🦉 "Hoàn hảo! Bạn là chiến binh xuất sắc! 🏆"';
    } else if (accuracy >= 80) {
      return '🦉 "Xuất sắc! Tiếp tục phát huy nhé! ⭐"';
    } else if (accuracy >= 60) {
      return '🦉 "Khá tốt! Còn một chút nữa thôi! 💪"';
    } else if (accuracy >= 40) {
      return '🦉 "Cố gắng lên! Ôn thêm sẽ tốt hơn! 📚"';
    } else {
      return '🦉 "Đừng nản! Hãy ôn lại và thử lại nhé! 🔥"';
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Get mode display name
  const getModeName = () => {
    switch (mode) {
      case 'sprint': return '⚡ Sprint Mode';
      case 'marathon': return '🏔️ Marathon Mode';
      case 'ranking': return '🏆 Ranking Mode';
      default: return '';
    }
  };

  // Get mode color
  const getModeGradient = () => {
    switch (mode) {
      case 'sprint': return 'from-cyan-500 to-teal-600';
      case 'marathon': return 'from-orange-500 to-red-600';
      case 'ranking': return 'from-purple-500 to-pink-600';
      default: return 'from-cyan-500 to-teal-600';
    }
  };

  const IconComponent = badge.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        {/* Performance Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${badge.color} mb-4`}>
            <IconComponent className="w-12 h-12 text-white" />
          </div>
          <h2 className={`${badge.textColor} mb-2`}>{badge.label}</h2>
          <p className="text-slate-300">Hoàn thành {getModeName()}</p>
        </motion.div>

        {/* Main Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <Card className={`${badge.bgColor} border-2 border-${badge.textColor.replace('text-', '')}/30`}>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-3xl text-white mb-1">{accuracy}%</div>
              <div className="text-sm text-slate-300">Độ chính xác</div>
            </CardContent>
          </Card>

          <Card className={`${badge.bgColor} border-2 border-${badge.textColor.replace('text-', '')}/30`}>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <div className="text-3xl text-white mb-1">{formatTime(totalTime)}</div>
              <div className="text-sm text-slate-300">Thời gian</div>
            </CardContent>
          </Card>

          <Card className={`${badge.bgColor} border-2 border-${badge.textColor.replace('text-', '')}/30`}>
            <CardContent className="p-6 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-3xl text-purple-400 mb-1">+{xp.total}</div>
              <div className="text-sm text-slate-300">XP</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Speed Bonus Alert */}
        {xp.speed > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300">⚡ Speed Bonus! +{xp.speed} XP</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-2 border-purple-500/20 mb-6">
            <CardContent className="p-6">
              <h3 className="text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                🎯 Chi tiết từng câu
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {questionResults.map((result, index) => (
                  <motion.div
                    key={result.questionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.02 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.correct
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={result.correct ? 'text-green-300' : 'text-red-300'}>
                        Câu {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-sm">
                        {formatTime(result.timeSpent)}
                      </span>
                      <span className={result.correct ? 'text-purple-400' : 'text-slate-500'}>
                        {result.correct ? `+${Math.floor(xp.base / totalQuestions)}` : '0'} XP
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-green-400">{correctCount}</div>
                    <div className="text-slate-400">Đúng</div>
                  </div>
                  <div>
                    <div className="text-red-400">{totalQuestions - correctCount}</div>
                    <div className="text-slate-400">Sai</div>
                  </div>
                  <div>
                    <div className="text-purple-400">{totalQuestions}</div>
                    <div className="text-slate-400">Tổng</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mascot Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-2 border-cyan-500/30">
            <CardContent className="p-4">
              <p className="text-center text-cyan-300">{getMascotMessage()}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4"
        >
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Home className="w-4 h-4 mr-2" />
            Về Dashboard
          </Button>
          {onRetry && (
            <Button
              onClick={onRetry}
              className={`flex-1 bg-gradient-to-r ${getModeGradient()} hover:opacity-90 text-white`}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          )}
        </motion.div>

        {/* Additional Info */}
        {mode === 'ranking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <p className="text-slate-400 text-sm">
              ⏰ Điểm đã được cộng vào bảng xếp hạng tuần
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExamRoomResult;
