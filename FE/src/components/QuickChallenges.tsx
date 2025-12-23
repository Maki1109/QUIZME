import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Zap, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

const challenges = [
  {
    id: 1,
    title: 'Thử thách hôm nay',
    subtitle: 'Giải nhanh 10 câu',
    duration: '15 phút',
    xp: 50,
    icon: Trophy,
    gradient: 'from-purple-500 to-pink-500',
    action: 'daily'
  },
  {
    id: 2,
    title: 'Sprint 15 phút',
    subtitle: 'Luyện tập tập trung',
    duration: '15 phút',
    xp: 30,
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
    action: 'sprint'
  },
  {
    id: 3,
    title: 'Challenge 5 Phút',
    subtitle: '5 câu trong 5 phút',
    duration: '5 phút',
    xp: 150,
    icon: Clock,
    gradient: 'from-teal-500 to-cyan-500',
    action: 'challenge5min'
  }
];

interface QuickChallengesProps {
  onStartChallenge5Min?: () => void;
}

export function QuickChallenges({ onStartChallenge5Min }: QuickChallengesProps) {
  const handleChallengeClick = (action: string) => {
    if (action === 'challenge5min' && onStartChallenge5Min) {
      onStartChallenge5Min();
    }
    // Other actions can be handled here
  };
  return (
    <div>
      <h2 className="text-teal-700 mb-4">⚡ Tốc độ Vi mô – Học mỗi ngày</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.05,
              transition: { type: 'spring', stiffness: 400 }
            }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${challenge.gradient}`} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challenge.gradient} flex items-center justify-center`}>
                    <challenge.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-yellow-100 px-2 py-1 rounded-full">
                    <span className="text-yellow-700 text-xs">+{challenge.xp} XP</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="text-gray-900 mb-1">{challenge.title}</h3>
                  <p className="text-gray-600 text-sm">{challenge.subtitle}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{challenge.duration}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className={`bg-gradient-to-r ${challenge.gradient} hover:opacity-90`}
                    onClick={() => handleChallengeClick(challenge.action)}
                  >
                    Chiến đấu!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
