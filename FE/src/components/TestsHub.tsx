import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Trophy, Zap, Mountain, Target, Clock, Users, 
  TrendingUp, Beaker, FileText, Library, Sparkles 
} from 'lucide-react';

interface TestsHubProps {
  onOpenExamRoom: () => void;
}

// Arcade games data (from ArcadeRoom)
const examModes = [
  {
    id: 'sprint',
    title: 'Sprint 15 Phút',
    subtitle: 'Tốc độ là tất cả',
    description: 'Hoàn thành 15 câu trong 15 phút',
    icon: Zap,
    gradient: 'from-cyan-300 via-teal-400 to-blue-400',
    accentColor: 'cyan',
    xp: 150,
    difficulty: 'Trung bình',
    timer: '15:00',
    bgPattern: '⚡',
    players: 1234
  },
  {
    id: 'marathon',
    title: 'Marathon 90 Phút',
    subtitle: 'Thử thách sức bền',
    description: 'Làm trọn 1 đề thi thật - 40 câu',
    icon: Mountain,
    gradient: 'from-violet-300 via-purple-400 to-fuchsia-400',
    accentColor: 'purple',
    xp: 500,
    difficulty: 'Khó',
    timer: '90:00',
    bgPattern: '🏔️',
    players: 892
  },
  {
    id: 'weekly',
    title: 'Leo Rank Tuần',
    subtitle: 'Cạnh tranh toàn quốc',
    description: 'Tích điểm mỗi ngày để lên top',
    icon: Trophy,
    gradient: 'from-amber-300 via-orange-400 to-rose-400',
    accentColor: 'amber',
    xp: 1000,
    difficulty: 'Thách thức',
    timer: 'Còn 3 ngày',
    bgPattern: '🏆',
    players: 15678
  }
];

// Leaderboard data
const leaderboardData = [
  { rank: 1, name: 'Nguyễn Văn A', score: 8750, avatar: '🥇', color: 'from-yellow-400 to-orange-500' },
  { rank: 2, name: 'Trần Thị B', score: 8240, avatar: '🥈', color: 'from-gray-300 to-gray-400' },
  { rank: 3, name: 'Lê Văn C', score: 7890, avatar: '🥉', color: 'from-orange-400 to-orange-600' },
  { rank: 24, name: 'Bạn', score: 4520, avatar: '🎯', isCurrentUser: true, color: 'from-purple-400 to-pink-500' }
];

export function TestsHub({ onOpenExamRoom }: TestsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState('exam-room');
  
  const currentUserRank = leaderboardData.find(p => p.isCurrentUser);
  const top3 = leaderboardData.filter(p => p.rank <= 3);
  const pointsToTop20 = 150;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center">
            <Beaker className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <motion.h2 
          className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-3xl mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🧪 Thư Viện Đề
        </motion.h2>
        <p className="text-gray-600">Phòng thi, tạo đề riêng, và thư viện đề thi</p>
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-3 bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="exam-room" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Phòng Thi
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Tạo Đề Riêng
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            Thư Viện
          </TabsTrigger>
        </TabsList>

        {/* Exam Room Tab */}
        <TabsContent value="exam-room" className="space-y-8 mt-6">
          {/* Exam Modes Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {examModes.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20, rotateX: -20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 200
                }}
                whileHover={{ 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className={`relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br ${game.gradient}`}>
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <motion.div
                      className="absolute inset-0 text-6xl flex items-center justify-center"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    >
                      {game.bgPattern}
                    </motion.div>
                  </div>

                  <CardContent className="p-6 relative z-10">
                    <div className="space-y-4">
                      {/* Icon */}
                      <motion.div
                        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <game.icon className="w-8 h-8 text-white" />
                      </motion.div>

                      {/* Title */}
                      <div>
                        <h3 className="text-white text-xl mb-1">{game.title}</h3>
                        <p className="text-white/80 text-sm">{game.subtitle}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-white/90 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{game.timer}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{game.difficulty}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-white/70 text-sm bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        {game.description}
                      </p>

                      {/* Rewards & Players */}
                      <div className="flex items-center justify-between text-sm">
                        <Badge className="bg-yellow-400 text-yellow-900">
                          +{game.xp} XP
                        </Badge>
                        <span className="text-white/70">
                          👥 {game.players.toLocaleString()} đang chơi
                        </span>
                      </div>

                      {/* CTA Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          size="lg" 
                          onClick={onOpenExamRoom}
                          className="w-full bg-white hover:bg-white/90 text-gray-900 shadow-xl h-12"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          BẮT ĐẦU NGAY!
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Live Leaderboard */}
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-purple-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                  <div>
                    <h3 className="text-gray-900">🏆 Bảng Xếp Hạng Tuần - LIVE</h3>
                    <p className="text-gray-600 text-sm">Cập nhật mỗi phút</p>
                  </div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-red-500 w-3 h-3 rounded-full"
                />
              </div>

              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {top3.map((player, index) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`text-center ${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'}`}
                  >
                    <motion.div
                      className={`relative inline-block mb-3 ${index === 0 ? 'scale-110' : ''}`}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${player.color} flex items-center justify-center text-4xl shadow-lg`}>
                        {player.avatar}
                      </div>
                      {index === 0 && (
                        <motion.div
                          className="absolute -top-2 -right-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                          👑
                        </motion.div>
                      )}
                    </motion.div>
                    <p className="text-gray-900 mb-1">{player.name}</p>
                    <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                      {player.score.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-purple-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-purple-100 px-4 py-1 rounded-full text-sm text-purple-600">
                    ⬇️ Bạn đang ở đây
                  </span>
                </div>
              </div>

              {/* Current User Position */}
              {currentUserRank && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl p-4 text-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
                        {currentUserRank.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">Hạng #{currentUserRank.rank}</span>
                          <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                            {currentUserRank.name}
                          </Badge>
                        </div>
                        <p className="text-white/80 text-sm">
                          {currentUserRank.score.toLocaleString()} điểm
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-300" />
                      <p className="text-white">
                        Cố lên! Chỉ <strong>{pointsToTop20}</strong> điểm nữa là vào Top 20!
                      </p>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Test Factory Tab */}
        <TabsContent value="custom" className="mt-6">
          <CustomTestFactoryContent />
        </TabsContent>

        {/* Test Library Tab */}
        <TabsContent value="library" className="mt-6">
          <TestLibraryContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom Test Factory Content
function CustomTestFactoryContent() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['math', 'physics']);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);

  const topics = [
    { id: 'math', label: 'Hàm số', icon: '📐' },
    { id: 'logarit', label: 'Logarit', icon: '📊' },
    { id: 'physics', label: 'Dao động', icon: '〰️' },
    { id: 'geometry', label: 'Hình học', icon: '🔷' },
    { id: 'integral', label: 'Tích phân', icon: '∫' },
  ];

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-purple-200">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-gray-900">⚙️ NHÀ MÁY CHẾ ĐỀ THI</h3>
        </div>
        <p className="text-gray-600 mb-8">Tự thiết kế đề thi theo ý muốn</p>

        <div className="space-y-6">
          {/* Topics Selection */}
          <div>
            <label className="text-gray-700 mb-3 block">📚 Chủ đề:</label>
            <div className="flex flex-wrap gap-3">
              {topics.map(topic => (
                <motion.button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-indigo-400 border-indigo-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <span className="mr-2">{topic.icon}</span>
                  {topic.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-gray-700 mb-3 block">⚡ Độ khó:</label>
            <div className="flex gap-3">
              {['easy', 'medium', 'hard', 'mixed'].map(level => (
                <motion.button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    difficulty === level
                      ? 'bg-violet-400 border-violet-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-violet-300'
                  }`}
                >
                  {level === 'easy' && 'Dễ'}
                  {level === 'medium' && 'Trung bình'}
                  {level === 'hard' && 'Khó'}
                  {level === 'mixed' && 'Hỗn hợp'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Question Count & Time */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-700 mb-3 block">🎯 Số câu: {questionCount}</label>
              <input
                type="range"
                min="10"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <label className="text-gray-700 mb-3 block">⏱️ Thời gian: {timeLimit} phút</label>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>15</span>
                <span>90</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200">
            <CardContent className="p-4">
              <h4 className="text-gray-900 mb-3">📋 Dự kiến:</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• {questionCount} câu hỏi</li>
                <li>• {timeLimit} phút</li>
                <li>• {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Trung bình' : difficulty === 'hard' ? 'Khó' : 'Hỗn hợp'}</li>
                <li>• Chủ đề: {selectedTopics.length > 0 ? topics.filter(t => selectedTopics.includes(t.id)).map(t => t.label).join(', ') : 'Chưa chọn'}</li>
                <li className="text-purple-600">• +{Math.floor(questionCount * 10 * (difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1))} XP (nếu 80%+)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSelectedTopics([]);
                setDifficulty('medium');
                setQuestionCount(20);
                setTimeLimit(30);
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              disabled={selectedTopics.length === 0}
            >
              <Zap className="w-5 h-5 mr-2" />
              Tạo đề thi ngay!
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Test Library Content
function TestLibraryContent() {
  const testLibrary = [
    {
      id: 1,
      title: 'Đề thi thử THPT 2024 - Đợt 1',
      questions: 40,
      duration: 90,
      difficulty: 'Khó',
      rating: 4.8,
      attempts: 1234,
      avgScore: 7.2,
      completed: false,
      locked: false
    },
    {
      id: 2,
      title: 'Sprint Logarit - 15 phút',
      questions: 15,
      duration: 15,
      difficulty: 'Trung bình',
      rating: 4.5,
      attempts: 892,
      avgScore: null,
      completed: true,
      bestScore: '13/15',
      locked: false
    },
    {
      id: 3,
      title: 'Ôn tập Hàm số - Cơ bản',
      questions: 20,
      duration: 30,
      difficulty: 'Dễ',
      rating: 4.9,
      attempts: 2456,
      avgScore: null,
      completed: false,
      locked: true,
      requirement: 'Hoàn thành Stage 1'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Dễ': return 'bg-green-100 text-green-700';
      case 'Trung bình': return 'bg-yellow-100 text-yellow-700';
      case 'Khó': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Library className="w-6 h-6 text-purple-600" />
        <h3 className="text-gray-900">📚 THƯ VIỆN ĐỀ THI</h3>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" size="sm" className="bg-purple-100 text-purple-700 border-purple-300">
          Tất cả
        </Button>
        <Button variant="outline" size="sm">Chưa làm</Button>
        <Button variant="outline" size="sm">Đã làm</Button>
        <Button variant="outline" size="sm">Yêu thích</Button>
      </div>

      {/* Test Cards */}
      <div className="space-y-4">
        {testLibrary.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${test.locked ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-2">{test.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{test.questions} câu</span>
                      <span>•</span>
                      <span>{test.duration} phút</span>
                      <span>•</span>
                      <Badge className={getDifficultyColor(test.difficulty)}>
                        {test.difficulty}
                      </Badge>
                    </div>
                  </div>
                  {test.locked && (
                    <Badge className="bg-red-100 text-red-700">
                      🔒 Locked
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>⭐ {test.rating} ({test.attempts.toLocaleString()} lượt làm)</span>
                  {test.avgScore && <span>🎯 Điểm TB: {test.avgScore}</span>}
                  {test.bestScore && <span className="text-green-600">✅ Điểm cao nhất: {test.bestScore}</span>}
                </div>

                {test.locked ? (
                  <div className="text-sm text-gray-500">
                    🔒 Yêu cầu: {test.requirement}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    >
                      {test.completed ? 'Làm lại' : 'Làm ngay'}
                    </Button>
                    <Button variant="outline">
                      Xem chi tiết
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
