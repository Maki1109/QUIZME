import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Award, Star, Flame, Target, Zap, Lock } from 'lucide-react';
import { motion } from 'motion/react';

const achievements = [
  {
    id: 1,
    title: 'Chiến binh 7 ngày',
    description: 'Học liên tục 7 ngày',
    icon: Flame,
    unlocked: true,
    progress: 100,
    color: 'from-orange-500 to-red-500',
    date: '25/10/2024'
  },
  {
    id: 2,
    title: 'Bậc thầy Logarit',
    description: 'Hoàn thành 50 câu Logarit với 90% chính xác',
    icon: Star,
    unlocked: true,
    progress: 100,
    color: 'from-yellow-500 to-orange-500',
    date: '20/10/2024'
  },
  {
    id: 3,
    title: 'Tốc độ ánh sáng',
    description: 'Hoàn thành Sprint 15 phút trong 10 phút',
    icon: Zap,
    unlocked: true,
    progress: 100,
    color: 'from-teal-500 to-cyan-500',
    date: '18/10/2024'
  },
  {
    id: 4,
    title: 'Người chinh phục',
    description: 'Đánh bại 3 Boss cuối chặng',
    icon: Trophy,
    unlocked: false,
    progress: 66,
    color: 'from-purple-500 to-pink-500',
    date: null
  },
  {
    id: 5,
    title: 'Hoàn hảo',
    description: 'Đạt 100% trong 1 đề thi tổng hợp',
    icon: Target,
    unlocked: false,
    progress: 85,
    color: 'from-green-500 to-teal-500',
    date: null
  },
  {
    id: 6,
    title: 'Huyền thoại',
    description: 'Học liên tục 30 ngày',
    icon: Award,
    unlocked: false,
    progress: 40,
    color: 'from-yellow-500 to-orange-500',
    date: null
  }
];

const leaderboard = [
  { rank: 1, name: 'Nguyễn Văn A', xp: 5240, avatar: '👨‍🎓' },
  { rank: 2, name: 'Trần Thị B', xp: 4890, avatar: '👩‍🎓' },
  { rank: 3, name: 'Bạn', xp: 2450, avatar: '🎯', isCurrentUser: true },
  { rank: 4, name: 'Lê Văn C', xp: 2120, avatar: '👨‍🎓' },
  { rank: 5, name: 'Phạm Thị D', xp: 1980, avatar: '👩‍🎓' }
];

export function Achievements() {
  return (
    <div className="space-y-8">
      {/* Achievements Section */}
      <div>
        <h2 className="text-teal-700 mb-4">🏆 Huy Hiệu & Thành Tích</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: achievement.unlocked ? 1.05 : 1 }}
            >
              <Card className={`${
                achievement.unlocked 
                  ? 'bg-white/80 backdrop-blur-sm hover:shadow-lg' 
                  : 'bg-gray-100 opacity-70'
              } transition-all`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center ${
                      !achievement.unlocked && 'opacity-50'
                    }`}>
                      {achievement.unlocked ? (
                        <achievement.icon className="w-10 h-10 text-white" />
                      ) : (
                        <Lock className="w-10 h-10 text-white" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-gray-900 mb-1">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>

                    {achievement.unlocked ? (
                      <Badge className="bg-green-500">
                        ✓ Đã mở khóa {achievement.date && `• ${achievement.date}`}
                      </Badge>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Tiến độ</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${achievement.color}`}
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div>
        <h2 className="text-teal-700 mb-4">📊 Bảng Xếp Hạng Bạn Bè</h2>
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    user.isCurrentUser 
                      ? 'bg-gradient-to-r from-teal-100 to-orange-100 border-2 border-teal-500' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.rank === 1 ? 'bg-yellow-400' :
                      user.rank === 2 ? 'bg-gray-300' :
                      user.rank === 3 ? 'bg-orange-400' :
                      'bg-gray-200'
                    }`}>
                      <span className="text-sm">{user.rank}</span>
                    </div>
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1">
                      <p className={user.isCurrentUser ? 'text-teal-700' : 'text-gray-900'}>
                        {user.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600">{user.xp.toLocaleString()} XP</p>
                  </div>
                  {user.rank <= 3 && (
                    <Trophy className={`w-5 h-5 ${
                      user.rank === 1 ? 'text-yellow-500' :
                      user.rank === 2 ? 'text-gray-400' :
                      'text-orange-500'
                    }`} />
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
