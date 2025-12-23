import { Flame, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface StudyStreakProps {
  streak: number;
}

export function StudyStreak({ streak }: StudyStreakProps) {
  const isAtRisk = false; // Would be calculated based on last activity time

  return (
    <motion.div 
      className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-pink-50 px-3 py-1.5 rounded-full border border-orange-200"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      {isAtRisk ? (
        <AlertCircle className="w-4 h-4 text-red-400" />
      ) : (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Flame className="w-4 h-4 text-orange-500" />
        </motion.div>
      )}
      <span className="text-slate-700">{streak} ngày</span>
      {isAtRisk && (
        <span className="text-red-400 text-xs ml-1">Sắp mất streak!</span>
      )}
    </motion.div>
  );
}
