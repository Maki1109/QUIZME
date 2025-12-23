import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { MascotGreeting } from './MascotGreeting';
import { Zap, Clock, TrendingUp, Target, CheckCircle, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';

interface DashboardOptimizedProps {
  onStartChallenge5Min: () => void;
  onStartAITeacherPractice: (topic: string) => void;
  onOpenFlashcards: () => void; 
  onOpenErrorReview: () => void;
}

export const DashboardOptimized: React.FC<DashboardOptimizedProps> = ({
  onStartChallenge5Min,
  onStartAITeacherPractice,
  onOpenFlashcards,
  onOpenErrorReview
}) => {
  // Mock data - trong thực tế sẽ lấy từ API/state
  const [challenge5MinCompleted, setChallenge5MinCompleted] = useState(false);
  
  const aiSuggestions = [
    {
      id: 1,
      type: 'error-fix',
      topic: 'Logarit',
      message: 'Bạn sai 3/5 câu Logarit hôm qua',
      priority: 'high',
      icon: '🔢',
      color: 'from-rose-300 to-pink-400',
      incorrectCount: 3,
      totalCount: 5
    },
    {
      id: 2,
      type: 'error-fix',
      topic: 'Dao động',
      message: 'Bạn sai 2/5 câu Dao động',
      priority: 'medium',
      icon: '〰️',
      color: 'from-amber-300 to-orange-400',
      incorrectCount: 2,
      totalCount: 5
    },
    {
      id: 3,
      type: 'progress',
      topic: 'Hàm số',
      message: 'Tiếp tục chinh phục Stage 2',
      priority: 'low',
      icon: '📈',
      color: 'from-cyan-300 to-teal-400',
      progress: 75
    }
  ];

  const goldenTimeCards = [
    { topic: 'Logarit', timeLeft: '2 giờ', urgency: 'critical' },
    { topic: 'Hàm số', timeLeft: '5 giờ', urgency: 'high' },
    { topic: 'Dao động', timeLeft: '1 ngày', urgency: 'medium' },
    { topic: 'Hình học', timeLeft: '2 ngày', urgency: 'low' }
  ];

  const dailyMissions = [
    { id: 1, title: 'Hoàn thành Challenge 5 phút', completed: challenge5MinCompleted, xp: 50 },
    { id: 2, title: 'Làm 10 câu hỏi', completed: false, progress: 6, total: 10, xp: 30 },
    { id: 3, title: 'Học 1 bài mới', completed: false, xp: 40 }
  ];

  const stats = {
    studyStreak: 7,
    todayXP: 120,
    weeklyProgress: 65,
    totalXP: 3450
  };

  // Sort AI suggestions: error-fix first, then by priority
  const sortedSuggestions = [...aiSuggestions].sort((a, b) => {
    if (a.type === 'error-fix' && b.type !== 'error-fix') return -1;
    if (a.type !== 'error-fix' && b.type === 'error-fix') return 1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  const criticalGoldenTime = goldenTimeCards.filter(c => c.urgency === 'critical' || c.urgency === 'high');
  const completedMissionsCount = dailyMissions.filter(m => m.completed).length;
  const missionProgress = (completedMissionsCount / dailyMissions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Mascot Greeting */}
      <MascotGreeting />

      {/* PRIORITY #1: Challenge 5 Phút */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Card className={`border-2 ${
          challenge5MinCompleted 
            ? 'border-slate-200 bg-slate-50 opacity-70' 
            : 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50'
        } shadow-sm`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    challenge5MinCompleted
                      ? 'bg-slate-300'
                      : 'bg-gradient-to-br from-cyan-400 to-teal-400'
                  }`}>
                    {challenge5MinCompleted ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Zap className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl mb-1 ${
                      challenge5MinCompleted ? 'text-slate-500' : 'text-slate-800'
                    }`}>
                      ⚡ Thử Thách 5 Phút Hôm Nay
                    </h2>
                    <p className={challenge5MinCompleted ? 'text-slate-400' : 'text-slate-600'}>
                      {challenge5MinCompleted 
                        ? '✅ Hoàn thành! Quay lại sau 24h'
                        : 'Luyện tập nhanh, hiệu quả ngay lập tức'}
                    </p>
                  </div>
                </div>

                {!challenge5MinCompleted && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        <span>⏰ 5 phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-teal-600" />
                        <span>🎯 5 câu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <span>⭐ +50 XP</span>
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <p className="text-sm text-cyan-700">
                        💡 <strong>Cá nhân hóa câu hỏi</strong> - Phản hồi tức thì sau mỗi câu
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-6">
                {challenge5MinCompleted ? (
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎉</div>
                    <p className="text-gray-600">Đã hoàn thành</p>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      onClick={onStartChallenge5Min}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-xl px-8 py-6 h-auto shadow-lg"
                    >
                      <Zap className="w-6 h-6 mr-2" />
                      BẮT ĐẦU NGAY!
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 1. Lịch sử lỗi sai - MÀU ĐỎ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Card className={`border-2 ${
          challenge5MinCompleted 
            ? 'border-slate-200 bg-slate-50 opacity-70' 
            : 'border-red-200 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50'
        } shadow-sm`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    challenge5MinCompleted
                      ? 'bg-slate-300'
                      : 'bg-gradient-to-br from-red-500 to-rose-500'
                  }`}>
                    {challenge5MinCompleted ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Zap className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl mb-1 ${
                      challenge5MinCompleted ? 'text-slate-500' : 'text-slate-800'
                    }`}>
                      👀 Lịch Sử Lỗi Sai
                    </h2>
                    <p className={challenge5MinCompleted ? 'text-slate-400' : 'text-slate-600'}>
                      {challenge5MinCompleted 
                        ? '✅ Hoàn thành! Quay lại sau 24h'
                        : 'Check các lỗi sai gần nhất và cải thiện ngay thôi!'}
                    </p>
                  </div>
                </div>

                {!challenge5MinCompleted && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-600" />
                        <span>⏰ 5 phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-rose-600" />
                        <span>🎯 5 câu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-600" />
                        <span>⭐ +50 XP</span>
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        💡 <strong>Lấy từ lỗi sai gần nhất</strong> - Check lịch sử lỗi sai để cải thiện
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-6">
                {challenge5MinCompleted ? (
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎉</div>
                    <p className="text-gray-600">Đã hoàn thành</p>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      onClick={onOpenErrorReview}
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xl px-8 py-6 h-auto shadow-lg"
                    >
                      <Zap className="w-6 h-6 mr-2" />
                      BẮT ĐẦU NGAY!
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Flashcards - MÀU VÀNG */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Card className={`border-2 ${
          challenge5MinCompleted 
            ? 'border-slate-200 bg-slate-50 opacity-70' 
            : 'border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50'
        } shadow-sm`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    challenge5MinCompleted
                      ? 'bg-slate-300'
                      : 'bg-gradient-to-br from-yellow-400 to-amber-500'
                  }`}>
                    {challenge5MinCompleted ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Zap className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl mb-1 ${
                      challenge5MinCompleted ? 'text-slate-500' : 'text-slate-800'
                    }`}>
                      🃏 Flashcards
                    </h2>
                    <p className={challenge5MinCompleted ? 'text-slate-400' : 'text-slate-600'}>
                      {challenge5MinCompleted 
                        ? '✅ Hoàn thành! Quay lại sau 24h'
                        : 'Sử dụng flashcards để ghi nhớ kiến thức nhanh chóng!'}
                    </p>
                  </div>
                </div>

                {!challenge5MinCompleted && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span>⏰ 5 phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-600" />
                        <span>🎯 5 câu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-600" />
                        <span>⭐ +50 XP</span>
                      </div>
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        💡 <strong>Rèn luyện trí nhớ với flashcards</strong> - Nắm vững lý thuyết
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-6">
                {challenge5MinCompleted ? (
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎉</div>
                    <p className="text-gray-600">Đã hoàn thành</p>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      onClick={onOpenFlashcards}
                      className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white text-xl px-8 py-6 h-auto shadow-lg"
                    >
                      <Zap className="w-6 h-6 mr-2" />
                      BẮT ĐẦU NGAY!
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PRIORITY #2: Nhiệm vụ Hàng ngày & Thống kê */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6"
      >
        {/* Daily Mission - 2/3 space */}
        <div className="md:col-span-2">
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  🎯 Nhiệm vụ Hàng ngày
                </h3>
                <Badge className="bg-indigo-400 text-white">
                  {completedMissionsCount}/{dailyMissions.length}
                </Badge>
              </div>

              <div className="mb-4">
                <Progress value={missionProgress} className="h-3" />
                <p className="text-sm text-gray-600 mt-1">
                  {Math.round(missionProgress)}% hoàn thành
                </p>
              </div>

              <div className="space-y-3">
                {dailyMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`p-3 rounded-lg border-2 ${
                      mission.completed
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {mission.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                        )}
                        <span className={mission.completed ? 'text-gray-600 line-through' : 'text-gray-900'}>
                          {mission.title}
                        </span>
                      </div>
                      <Badge className="bg-amber-300 text-amber-900 text-xs">
                        +{mission.xp} XP
                      </Badge>
                    </div>
                    
                    {mission.progress !== undefined && !mission.completed && (
                      <div className="mt-2 ml-8">
                        <Progress 
                          value={(mission.progress / mission.total!) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          {mission.progress}/{mission.total}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Stats - 1/3 space */}
        <div>
          <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardContent className="p-6">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                📊 Thống kê
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">🔥 Study Streak</span>
                    <span className="text-xl text-amber-600">{stats.studyStreak} ngày</span>
                  </div>
                </div>

                <div className="h-px bg-gray-300" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">⚡ XP Hôm nay</span>
                    <span className="text-xl text-indigo-600">{stats.todayXP}</span>
                  </div>
                </div>

                <div className="h-px bg-gray-300" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">📈 Tuần này</span>
                    <span className="text-xl text-cyan-600">{stats.weeklyProgress}%</span>
                  </div>
                  <Progress value={stats.weeklyProgress} className="h-2" />
                </div>

                <div className="h-px bg-gray-300" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">💎 Tổng XP</span>
                    <span className="text-xl text-cyan-600">{stats.totalXP.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* PRIORITY #3: AI Teacher Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4">
          <h3 className="text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            🤖 AI Teacher - Gợi ý Cá nhân hóa
          </h3>
          <p className="text-sm text-gray-600">Ưu tiên khắc phục lỗi sai trước</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sortedSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={`border-2 ${
                suggestion.type === 'error-fix'
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-indigo-200 bg-indigo-50'
              } hover:shadow-lg transition-all cursor-pointer`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center text-2xl`}>
                        {suggestion.icon}
                      </div>
                      <div>
                        <Badge className={
                          suggestion.type === 'error-fix'
                            ? 'bg-rose-400 text-white'
                            : 'bg-indigo-400 text-white'
                        }>
                          {suggestion.type === 'error-fix' ? '🚨 Cần ôn' : '📈 Tiến độ'}
                        </Badge>
                        <h4 className="text-gray-900 mt-1">{suggestion.topic}</h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">
                    {suggestion.type === 'error-fix' ? '❌ ' : '✨ '}
                    {suggestion.message}
                  </p>

                  {suggestion.incorrectCount && (
                    <div className="mb-3 p-2 bg-white rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tỉ lệ sai</span>
                        <span className="text-rose-600">
                          {suggestion.incorrectCount}/{suggestion.totalCount}
                        </span>
                      </div>
                      <Progress 
                        value={(suggestion.incorrectCount / suggestion.totalCount) * 100} 
                        className="h-2 bg-gray-200"
                      />
                    </div>
                  )}

                  <Button
                    className={`w-full ${
                      suggestion.type === 'error-fix'
                        ? 'bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600'
                        : 'bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600'
                    } text-white`}
                    onClick={() => onStartAITeacherPractice(suggestion.topic)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {suggestion.type === 'error-fix' ? 'Ôn ngay' : 'Tiếp tục'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};
