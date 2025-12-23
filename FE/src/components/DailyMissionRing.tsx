import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { CheckCircle2, Circle, Flame, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Mascot } from './Mascot';

interface DailyMissionRingProps {
  progress: number;
  completed: number;
  total: number;
  userName?: string;
}

const missions = [
  { id: 1, title: 'Hoàn thành Sprint 15 phút', completed: true, xp: 30 },
  { id: 2, title: 'Củng cố 5 công thức', completed: true, xp: 25 },
  { id: 3, title: 'Làm thử thách hôm nay', completed: true, xp: 50 },
  { id: 4, title: 'Ôn lại phần sai hôm qua', completed: false, xp: 40 },
];

export function DailyMissionRing({ progress, completed, total, userName = "Chiến Binh" }: DailyMissionRingProps) {
  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Mascot emotion="happy" size="large" />
        <div>
          <h2 className="text-gray-900 text-2xl">Chào {userName}! 👋</h2>
          <p className="text-gray-600">Hãy khởi động ngày mới với năng lượng học tập!</p>
        </div>
      </motion.div>

      {/* Main Mission Card */}
      <Card className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white border-0 shadow-2xl relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              backgroundSize: '100% 100%',
            }}
          />
        </div>

        <CardHeader className="relative z-10">
          <CardTitle className="text-white text-xl flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Buồng Lái Chiến Binh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          {/* Progress Ring */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white/90 text-lg">{completed}/{total} nhiệm vụ</span>
                <span className="text-white/90">•</span>
                <span className="text-white/90 text-lg">{progress}%</span>
                {progress === 100 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-yellow-300"
                  >
                    ✨ Hoàn thành!
                  </motion.span>
                )}
              </div>
              <Progress value={progress} className="h-4 bg-white/20" />
            </div>
            <motion.div 
              className="ml-6 text-6xl"
              animate={{ 
                rotate: progress === 100 ? [0, 10, -10, 0] : 0,
                scale: progress === 100 ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: progress === 100 ? Infinity : 0, repeatDelay: 2 }}
            >
              {progress === 100 ? '🎉' : '🎯'}
            </motion.div>
          </div>

          {/* Missions List */}
          <div className="space-y-2 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  mission.completed ? 'bg-white/5' : 'bg-yellow-400/20 hover:bg-yellow-400/30'
                }`}
                whileHover={{ x: 4, scale: 1.02 }}
              >
                {mission.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-300" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Circle className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                )}
                <span className={`flex-1 ${mission.completed ? 'text-white/70 line-through' : 'text-white'}`}>
                  {mission.title}
                </span>
                <span className="text-yellow-300 text-sm">+{mission.xp} XP</span>
              </motion.div>
            ))}
          </div>

          {/* Main CTA Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:opacity-90 text-white shadow-2xl border-2 border-yellow-300 h-16 text-xl"
            >
              <Flame className="w-6 h-6 mr-3" />
              Thử Thách 5 Phút Hôm Nay!
              <Zap className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
