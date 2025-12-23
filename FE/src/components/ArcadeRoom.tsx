import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Clock, Zap, Mountain, Trophy, TrendingUp, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface ExamRoomProps {
  onOpenExamRoom: () => void;
}

const leaderboardData = [
  { rank: 1, name: 'Nguyễn Văn A', score: 8750, avatar: '🥇', color: 'from-yellow-400 to-orange-500' },
  { rank: 2, name: 'Trần Thị B', score: 8240, avatar: '🥈', color: 'from-gray-300 to-gray-400' },
  { rank: 3, name: 'Lê Văn C', score: 7890, avatar: '🥉', color: 'from-orange-400 to-orange-600' },
  { rank: 24, name: 'Bạn', score: 4520, avatar: '🎯', isCurrentUser: true, color: 'from-purple-400 to-pink-500' }
];

const arcadeGames = [
  {
    id: 'sprint',
    title: 'Sprint 15 Phút',
    subtitle: 'Tốc độ là tất cả',
    description: 'Hoàn thành 15 câu trong 15 phút',
    icon: Zap,
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
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
    gradient: 'from-orange-400 via-red-500 to-pink-600',
    accentColor: 'orange',
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
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    accentColor: 'yellow',
    xp: 1000,
    difficulty: 'Thách thức',
    timer: 'Còn 3 ngày',
    bgPattern: '🏆',
    players: 15678
  }
];

export function ExamRoom({ onOpenExamRoom }: ExamRoomProps) {
  const currentUserRank = leaderboardData.find(p => p.isCurrentUser);
  const top3 = leaderboardData.filter(p => p.rank <= 3);
  const pointsToTop20 = 150;

  const handleGameClick = (gameId: string) => {
    onOpenExamRoom();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h2 
          className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-3xl mb-2"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          📝 Phòng Thi
        </motion.h2>
        <p className="text-gray-600">Chọn loại đề thi để thử thách bản thân!</p>
      </div>

      {/* Arcade Games Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {arcadeGames.map((game, index) => (
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
                      onClick={() => handleGameClick(game.id)}
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
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white"
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
    </div>
  );
}
